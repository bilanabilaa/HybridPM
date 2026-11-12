"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { CheckSquare, Clock, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMyTasks = async () => {
    try {
      const res = await fetch("/api/tasks?myTasks=true");
      if (res.ok) {
        const json = await res.json();
        setTasks(json.tasks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyTasks();
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await loadMyTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout breadcrumbs={[{ label: "Tugas Saya" }]}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Tugas Saya</h1>
            <Badge variant="primary">{tasks.length} Tugas Terdaftar</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Daftar tugas yang didelegasikan langsung kepada Anda pada papan Kanban proyek.
          </p>
        </div>

        <Link
          href="/kanban"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
        >
          <span>Buka Papan Kanban</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Memuat tugas Anda...</div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Tidak ada tugas aktif yang sedang ditugaskan kepada Anda.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
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
                    >
                      {t.priority}
                    </Badge>
                    <span className="text-xs text-slate-400">• {t.project?.name}</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">{t.title}</h3>
                  {t.description && <p className="text-xs text-slate-500 line-clamp-1">{t.description}</p>}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right text-xs text-slate-500">
                    <span className="block font-semibold">Tenggat: {formatDate(t.dueDate)}</span>
                    <span className="block text-[11px] text-slate-400">Estimasi: {t.estimateDays} Hari</span>
                  </div>

                  <select
                    value={t.status}
                    onChange={(e) => handleStatusChange(t.id, e.target.value)}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Backlog">Backlog</option>
                    <option value="Analisis">Analisis</option>
                    <option value="Develop">Develop</option>
                    <option value="Review">Review</option>
                    <option value="Test">Test</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

