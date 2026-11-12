"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import {
  Columns,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Filter,
  ArrowRight,
  MessageSquare,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

const COLUMNS = [
  { id: "Backlog", label: "Backlog", limit: null, color: "border-slate-300" },
  { id: "Analisis", label: "Analisis", limit: null, color: "border-blue-300" },
  { id: "Develop", label: "Develop", limit: 4, color: "border-indigo-400" },
  { id: "Review", label: "Review", limit: 3, color: "border-purple-400" },
  { id: "Test", label: "Test", limit: 3, color: "border-amber-400" },
  { id: "Done", label: "Done", limit: null, color: "border-emerald-400" },
];

function KanbanContent() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("projectId") || "";

  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [tasks, setTasks] = useState<any[]>([]);
  const [wipCounts, setWipCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Task creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newStatus, setNewStatus] = useState("Backlog");
  const [newEstimate, setNewEstimate] = useState(3);
  const [newDueDate, setNewDueDate] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  // Quality gate modal for Done
  const [doneModalTask, setDoneModalTask] = useState<any>(null);
  const [checkReviewed, setCheckReviewed] = useState(false);
  const [checkTested, setCheckTested] = useState(false);
  const [checkDemoed, setCheckDemoed] = useState(false);

  // Task detail modal
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [commentText, setCommentText] = useState("");

  // Load projects list
  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const json = await res.json();
          const prjs = json.projects || [];
          setProjects(prjs);
          if (!selectedProjectId && prjs.length > 0) {
            setSelectedProjectId(prjs[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadProjects();
  }, [selectedProjectId]);

  // Load tasks for selected project
  const loadTasks = async () => {
    if (!selectedProjectId) return;
    try {
      const res = await fetch(`/api/tasks?projectId=${selectedProjectId}`);
      if (res.ok) {
        const json = await res.json();
        setTasks(json.tasks || []);
        setWipCounts(json.wipCounts || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      setLoading(true);
      loadTasks();
    }
  }, [selectedProjectId]);

  // Move card action
  const handleMoveCard = async (task: any, targetStatus: string) => {
    setErrorMessage(null);

    // If target is "Done", trigger Quality Gate verification modal
    if (targetStatus === "Done") {
      setDoneModalTask(task);
      setCheckReviewed(task.isReviewed);
      setCheckTested(task.isTested);
      setCheckDemoed(task.isDemoed);
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json.error || "Gagal memindahkan kartu");
        return;
      }

      await loadTasks();
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal memindahkan kartu");
    }
  };

  // Confirm Quality Gate and move to Done
  const handleConfirmDone = async () => {
    if (!doneModalTask) return;
    if (!checkReviewed || !checkTested || !checkDemoed) {
      setErrorMessage("Seluruh 3 kriteria mutu (Review, Test, Demo) wajib dicentang sebelum kartu dapat dinyatakan Done!");
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${doneModalTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Done",
          isReviewed: true,
          isTested: true,
          isDemoed: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json.error || "Gagal menyelesaikan tugas");
        return;
      }

      setDoneModalTask(null);
      await loadTasks();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Create new task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setCreatingTask(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          title: newTitle,
          description: newDesc,
          priority: newPriority,
          status: newStatus,
          estimateDays: Number(newEstimate),
          dueDate: newDueDate || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat kartu");

      setShowCreateModal(false);
      setNewTitle("");
      setNewDesc("");
      await loadTasks();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setCreatingTask(false);
    }
  };

  // Add comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !commentText.trim()) return;

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: commentText }),
      });

      if (res.ok) {
        const json = await res.json();
        setSelectedTask((prev: any) => ({
          ...prev,
          comments: [...(prev.comments || []), json.comment],
        }));
        setCommentText("");
        await loadTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout breadcrumbs={[{ label: "Papan Kanban" }]}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Papan Kanban Interaktif</h1>
            <Badge variant="primary">WIP Controlled</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Eksekusi tugas dengan batasan WIP ketat: Develop (maks. 4), Review (maks. 3), Test (maks. 3).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Project Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500">Proyek:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectCode} — {p.name.slice(0, 30)}...
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kartu</span>
          </button>
        </div>
      </div>

      {/* Error / Warning Alert Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold text-rose-600 hover:text-rose-800"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Kanban Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold">Total Kartu Aktif (WIP)</span>
          <p className="text-xl font-extrabold text-blue-600 mt-0.5">
            {(wipCounts.Develop || 0) + (wipCounts.Review || 0) + (wipCounts.Test || 0)} Kartu
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold">Kartu Telah Selesai (Done)</span>
          <p className="text-xl font-extrabold text-emerald-600 mt-0.5">{wipCounts.Done || 0} Kartu</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold">Rata-rata Cycle Time</span>
          <p className="text-xl font-extrabold text-slate-800 mt-0.5">8.5 Hari</p>
          <span className="text-[10px] text-slate-400">Target ≤ 14 hari/kartu</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold">Status Alur Kerja</span>
          <p className="text-xl font-extrabold text-emerald-600 mt-0.5">Lancar</p>
          <span className="text-[10px] text-slate-400">Tidak ada bottleneck WIP</span>
        </div>
      </div>

      {/* 6 Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-start overflow-x-auto pb-6">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          const currentCount = colTasks.length;
          const isAtLimit = col.limit !== null && currentCount >= col.limit;

          return (
            <div
              key={col.id}
              className={`bg-slate-100/80 rounded-2xl p-3 border-t-4 ${col.color} border-slate-200 flex flex-col min-h-[550px] shadow-xs`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs text-slate-800">{col.label}</h3>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isAtLimit
                        ? "bg-rose-100 text-rose-700"
                        : "bg-white text-slate-700 border border-slate-200"
                    }`}
                  >
                    {currentCount}
                    {col.limit !== null ? `/${col.limit}` : ""}
                  </span>
                </div>

                {col.limit !== null && (
                  <span className="text-[9px] font-semibold uppercase text-slate-400">
                    Maks {col.limit}
                  </span>
                )}
              </div>

              {/* Tasks List */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[680px]">
                {colTasks.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white p-3.5 rounded-xl border border-slate-200/90 hover:border-blue-400 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        {t.taskCode}
                      </span>
                      <Badge
                        variant={
                          t.priority === "High"
                            ? "danger"
                            : t.priority === "Medium"
                            ? "warning"
                            : "default"
                        }
                        className="text-[10px] px-1.5 py-0"
                      >
                        {t.priority}
                      </Badge>
                    </div>

                    <h4
                      onClick={() => setSelectedTask(t)}
                      className="text-xs font-bold text-slate-900 group-hover:text-blue-600 cursor-pointer line-clamp-2 leading-snug"
                    >
                      {t.title}
                    </h4>

                    {t.description && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                        {t.description}
                      </p>
                    )}

                    {/* Assignee & Due Date */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                          {t.assignee?.name?.charAt(0) || "—"}
                        </div>
                        <span className="truncate max-w-[80px]">
                          {t.assignee?.name?.split(" ")[0] || "Unassigned"}
                        </span>
                      </div>

                      {t.dueDate && (
                        <div className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(t.dueDate).slice(0, 6)}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Move Buttons */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100/70 flex items-center justify-between">
                      <select
                        value={t.status}
                        onChange={(e) => handleMoveCard(t, e.target.value)}
                        className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1 w-full focus:outline-none"
                      >
                        <option disabled value={t.status}>
                          Pindahkan ke...
                        </option>
                        {COLUMNS.map((c) => (
                          <option key={c.id} value={c.id} disabled={c.id === t.status}>
                            → {c.label} {c.limit ? `(Maks ${c.limit})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quality Gate Done Verification Modal */}
      <Modal
        isOpen={!!doneModalTask}
        onClose={() => setDoneModalTask(null)}
        title="Verifikasi Kualitas Selesai (Done)"
        description="Berdasarkan aturan tata kelola mutu HybridPM, kartu hanya dapat dipindahkan ke 'Done' setelah lulus ketiga tahapan berikut."
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-mono text-xs font-bold text-blue-600">{doneModalTask?.taskCode}</span>
            <p className="text-sm font-bold text-slate-900 mt-1">{doneModalTask?.title}</p>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={checkReviewed}
                onChange={(e) => setCheckReviewed(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">1. Code Review Telah Lulus</span>
                <span className="text-slate-500">Pemeriksaan kode oleh Tech Lead / Peer Developer telah disetujui.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={checkTested}
                onChange={(e) => setCheckTested(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">2. Pengujian (Testing) Telah Lolos</span>
                <span className="text-slate-500">Unit test dan functional verification QA telah selesai tanpa defect.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={checkDemoed}
                onChange={(e) => setCheckDemoed(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">3. Telah Didemokan ke Perwakilan Pengguna</span>
                <span className="text-slate-500">Hasil implementasi telah dipresentasikan pada demo mingguan.</span>
              </div>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              onClick={() => setDoneModalTask(null)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
            >
              Batal
            </button>
            <button
              onClick={handleConfirmDone}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs"
            >
              Konfirmasi & Selesaikan Kartu
            </button>
          </div>
        </div>
      </Modal>

      {/* Task Creation Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tambah Kartu Tugas Baru"
        description="Tambahkan pekerjaan ke dalam alur Kanban proyek."
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Judul Tugas *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Implementasi antrean online poliklinik"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Tugas</label>
            <textarea
              rows={3}
              placeholder="Jelaskan kebutuhan fungsional atau kriteria penerimaan..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Prioritas</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kolom Awal</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50"
              >
                <option value="Backlog">Backlog</option>
                <option value="Analisis">Analisis</option>
                <option value="Develop">Develop (Maks 4)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estimasi Hari</label>
              <input
                type="number"
                min={1}
                value={newEstimate}
                onChange={(e) => setNewEstimate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tenggat Waktu</label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={creatingTask}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50"
            >
              {creatingTask ? "Menyimpan..." : "Buat Kartu"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Task Details & Comments Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={selectedTask ? `${selectedTask.taskCode} — ${selectedTask.title}` : ""}
        maxWidth="xl"
      >
        {selectedTask && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant="primary">{selectedTask.status}</Badge>
              <Badge
                variant={
                  selectedTask.priority === "High"
                    ? "danger"
                    : selectedTask.priority === "Medium"
                    ? "warning"
                    : "default"
                }
              >
                Prioritas: {selectedTask.priority}
              </Badge>
              <span className="text-xs text-slate-400">
                Dibuat: {formatDate(selectedTask.createdAt)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 block mb-1">Deskripsi</span>
              <p className="text-slate-600 whitespace-pre-line">
                {selectedTask.description || "Tidak ada deskripsi rinci."}
              </p>
            </div>

            {/* Comments Thread */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-xs text-slate-800">
                  Komentar & Diskusi ({selectedTask.comments?.length || 0})
                </h4>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                {selectedTask.comments && selectedTask.comments.length > 0 ? (
                  selectedTask.comments.map((c: any) => (
                    <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800">{c.user?.name}</span>
                        <span className="text-[10px] text-slate-400">{formatDate(c.createdAt)}</span>
                      </div>
                      <p className="text-slate-600">{c.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">Belum ada komentar.</p>
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tuliskan komentar atau update kendala..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                >
                  Kirim
                </button>
              </form>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}

export default function KanbanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <KanbanContent />
    </Suspense>
  );
}

