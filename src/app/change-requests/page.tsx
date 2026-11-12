"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  GitPullRequest,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  DollarSign,
  User,
  RefreshCw,
} from "lucide-react";
import { formatDate, formatRupiah } from "@/lib/utils";

interface ChangeRequest {
  id: string;
  crCode: string;
  title: string;
  description: string;
  reason: string;
  costImpact: number;
  scheduleImpactDays: number;
  status: string;
  decisionNotes?: string;
  decidedAt?: string;
  decidedBy?: string;
  priority?: string;
  createdAt: string;
  updatedAt: string;
  project: { id: string; projectCode: string; name: string };
  requester: { id: string; name: string };
}

interface Project {
  id: string;
  projectCode: string;
  name: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  Pending: {
    label: "Menunggu",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  "Under Review": {
    label: "Dalam Tinjauan",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <RefreshCw className="w-3.5 h-3.5" />,
  },
  Approved: {
    label: "Disetujui",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  Rejected: {
    label: "Ditolak",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

const PRIORITY_CONFIG: Record<string, string> = {
  Low: "bg-slate-100 text-slate-700 border-slate-200",
  Medium: "bg-blue-100 text-blue-700 border-blue-200",
  High: "bg-red-100 text-red-700 border-red-200",
};

export default function ChangeRequestsPage() {
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDecideModal, setShowDecideModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCR, setSelectedCR] = useState<ChangeRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Create form state
  const [form, setForm] = useState({
    projectId: "",
    title: "",
    description: "",
    reason: "",
    costImpact: 0,
    scheduleImpactDays: 0,
    priority: "Medium",
  });

  // Decision form state
  const [decision, setDecision] = useState({
    action: "Approved",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [crRes, projectsRes, meRes] = await Promise.all([
        fetch("/api/change-requests"),
        fetch("/api/projects"),
        fetch("/api/auth/me"),
      ]);

      const crData = await crRes.json();
      const projectsData = await projectsRes.json();
      const meData = await meRes.json();

      setChangeRequests(crData.changeRequests || []);
      setProjects(projectsData.projects || []);
      setUserRole(meData.user?.role?.name || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          costImpact: Number(form.costImpact),
          scheduleImpactDays: Number(form.scheduleImpactDays),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat CR");
      setShowCreateModal(false);
      setForm({ projectId: "", title: "", description: "", reason: "", costImpact: 0, scheduleImpactDays: 0, priority: "Medium" });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecide(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCR) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/change-requests/${selectedCR.id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: decision.action, notes: decision.notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses keputusan");
      setShowDecideModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = changeRequests.filter((cr) => {
    const matchesSearch =
      cr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cr.crCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cr.project.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || cr.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: changeRequests.length,
    pending: changeRequests.filter((c) => c.status === "Pending").length,
    approved: changeRequests.filter((c) => c.status === "Approved").length,
    rejected: changeRequests.filter((c) => c.status === "Rejected").length,
  };

  const canDecide = ["OWNER", "PM", "ADMIN"].includes(userRole);
  const canCreate = ["PM", "MEMBER", "ADMIN"].includes(userRole);

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2">
              <GitPullRequest className="w-7 h-7 text-blue-600" />
              Change Request
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Kelola permintaan perubahan lingkup, jadwal, atau anggaran proyek
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajukan CR Baru
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total CR", value: stats.total, icon: <GitPullRequest className="w-5 h-5" />, color: "text-blue-600 bg-blue-50" },
            { label: "Menunggu", value: stats.pending, icon: <Clock className="w-5 h-5" />, color: "text-amber-600 bg-amber-50" },
            { label: "Disetujui", value: stats.approved, icon: <CheckCircle className="w-5 h-5" />, color: "text-green-600 bg-green-50" },
            { label: "Ditolak", value: stats.rejected, icon: <XCircle className="w-5 h-5" />, color: "text-red-600 bg-red-50" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="text-xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari CR berdasarkan kode, judul, atau proyek..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">Semua Status</option>
              <option value="Pending">Menunggu</option>
              <option value="Under Review">Dalam Tinjauan</option>
              <option value="Approved">Disetujui</option>
              <option value="Rejected">Ditolak</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<GitPullRequest className="w-10 h-10 text-slate-400" />}
              title="Belum ada Change Request"
              description="Change Request digunakan untuk mengajukan perubahan pada scope, jadwal, atau anggaran proyek."
              action={
                canCreate ? (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Ajukan CR Baru
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Kode</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Judul & Proyek</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Dampak</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Pengaju</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tanggal</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((cr) => {
                    const statusConf = STATUS_CONFIG[cr.status] || STATUS_CONFIG["Pending"];
                    return (
                      <tr key={cr.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                            {cr.crCode}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm text-slate-800 line-clamp-1">{cr.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {cr.project.projectCode} — {cr.project.name}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {cr.costImpact > 0 && (
                            <div className="flex items-center gap-1 text-orange-600 text-xs">
                              <DollarSign className="w-3 h-3" />
                              <span>+{formatRupiah(cr.costImpact)}</span>
                            </div>
                          )}
                          {cr.scheduleImpactDays > 0 && (
                            <div className="flex items-center gap-1 text-blue-600 text-xs mt-0.5">
                              <Calendar className="w-3 h-3" />
                              <span>+{cr.scheduleImpactDays} hari</span>
                            </div>
                          )}
                          {cr.costImpact === 0 && cr.scheduleImpactDays === 0 && (
                            <span className="text-xs text-slate-400">Tidak ada dampak biaya</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                              {cr.requester.name.charAt(0)}
                            </div>
                            <span className="text-sm text-slate-700">{cr.requester.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusConf.color}`}>
                            {statusConf.icon}
                            {statusConf.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {formatDate(cr.createdAt)}
                          {cr.decidedAt && (
                            <div className="text-xs text-slate-400 mt-0.5">
                              Diputuskan: {formatDate(cr.decidedAt)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setSelectedCR(cr); setShowDetailModal(true); }}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Detail
                            </button>
                            {canDecide && cr.status === "Pending" && (
                              <button
                                onClick={() => {
                                  setSelectedCR(cr);
                                  setDecision({ action: "Approved", notes: "" });
                                  setShowDecideModal(true);
                                }}
                                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded font-medium"
                              >
                                Putuskan
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create CR Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setError(""); }}
        title="Ajukan Change Request Baru"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Proyek *</label>
            <select
              required
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Proyek</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectCode} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Judul Perubahan *</label>
            <input
              required
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Contoh: Penambahan Fitur Laporan PDF"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Perubahan *</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Jelaskan perubahan yang diajukan secara detail..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Alasan Perubahan *</label>
            <textarea
              required
              rows={2}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Mengapa perubahan ini diperlukan?"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dampak Biaya (Rp)</label>
              <input
                type="number"
                min={0}
                value={form.costImpact}
                onChange={(e) => setForm({ ...form, costImpact: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">Isi 0 jika tidak ada dampak biaya</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dampak Jadwal (Hari)</label>
              <input
                type="number"
                min={0}
                value={form.scheduleImpactDays}
                onChange={(e) => setForm({ ...form, scheduleImpactDays: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">Isi 0 jika tidak ada dampak jadwal</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prioritas</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Low">Rendah</option>
              <option value="Medium">Sedang</option>
              <option value="High">Tinggi</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {submitting ? "Mengajukan..." : "Ajukan CR"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Decide Modal */}
      <Modal
        isOpen={showDecideModal}
        onClose={() => { setShowDecideModal(false); setError(""); }}
        title={`Keputusan CR: ${selectedCR?.crCode}`}
        size="md"
      >
        {selectedCR && (
          <form onSubmit={handleDecide} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-slate-800">{selectedCR.title}</h4>
              <p className="text-sm text-slate-600">{selectedCR.description}</p>
              <div className="flex gap-4 mt-2">
                {selectedCR.costImpact > 0 && (
                  <div className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded">
                    Dampak Biaya: +{formatRupiah(selectedCR.costImpact)}
                  </div>
                )}
                {selectedCR.scheduleImpactDays > 0 && (
                  <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
                    Dampak Jadwal: +{selectedCR.scheduleImpactDays} hari
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Keputusan *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDecision({ ...decision, action: "Approved" })}
                  className={`p-3 rounded-lg border-2 flex items-center gap-2 text-sm font-medium transition-colors ${
                    decision.action === "Approved"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-slate-200 hover:border-green-300 text-slate-600"
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  Setujui CR
                </button>
                <button
                  type="button"
                  onClick={() => setDecision({ ...decision, action: "Rejected" })}
                  className={`p-3 rounded-lg border-2 flex items-center gap-2 text-sm font-medium transition-colors ${
                    decision.action === "Rejected"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-slate-200 hover:border-red-300 text-slate-600"
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                  Tolak CR
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Catatan Keputusan {decision.action === "Rejected" ? "*" : "(Opsional)"}
              </label>
              <textarea
                required={decision.action === "Rejected"}
                rows={3}
                value={decision.notes}
                onChange={(e) => setDecision({ ...decision, notes: e.target.value })}
                placeholder={
                  decision.action === "Approved"
                    ? "Tambahkan catatan persetujuan (opsional)..."
                    : "Jelaskan alasan penolakan..."
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDecideModal(false)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-50 ${
                  decision.action === "Approved"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {submitting ? "Memproses..." : decision.action === "Approved" ? "Setujui" : "Tolak"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Detail ${selectedCR?.crCode}`}
        size="md"
      >
        {selectedCR && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                  STATUS_CONFIG[selectedCR.status]?.color || ""
                }`}>
                  {STATUS_CONFIG[selectedCR.status]?.icon}
                  {STATUS_CONFIG[selectedCR.status]?.label || selectedCR.status}
                </span>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Proyek</p>
                <p className="text-sm font-medium text-slate-800">{selectedCR.project.name}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Deskripsi Perubahan</p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{selectedCR.description}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Alasan</p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{selectedCR.reason}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                <p className="text-xs text-orange-600 mb-1 font-medium">Dampak Biaya</p>
                <p className="text-sm font-bold text-orange-800">
                  {selectedCR.costImpact > 0 ? `+${formatRupiah(selectedCR.costImpact)}` : "Tidak ada"}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-blue-600 mb-1 font-medium">Dampak Jadwal</p>
                <p className="text-sm font-bold text-blue-800">
                  {selectedCR.scheduleImpactDays > 0 ? `+${selectedCR.scheduleImpactDays} hari` : "Tidak ada"}
                </p>
              </div>
            </div>

            {selectedCR.decisionNotes && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Catatan Keputusan</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{selectedCR.decisionNotes}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Diputuskan oleh {selectedCR.decidedBy} pada {formatDate(selectedCR.decidedAt || "")}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User className="w-4 h-4 text-slate-400" />
                Pengaju: <span className="font-medium">{selectedCR.requester.name}</span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4 text-slate-400" />
                {formatDate(selectedCR.createdAt)}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}

