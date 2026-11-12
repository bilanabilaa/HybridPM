"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { formatRupiah, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  FolderKanban,
  CheckSquare,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Clock,
  Activity,
  ArrowRight,
  ShieldAlert,
  Users,
  Calendar,
  CheckCircle2,
  FileText,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Dashboard" }]}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 font-medium">Memuat data dashboard HybridPM...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const role = data?.role || "MEMBER";
  const stats = data?.stats || {};
  const roleData = data?.roleSpecificData || {};
  const recentActivities = data?.recentActivities || [];

  return (
    <AppLayout breadcrumbs={[{ label: "Dashboard" }]}>
      {/* Header Banner */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">
              Selamat Datang, {data?.user?.name}
            </h1>
            <Badge variant="primary" className="text-xs">
              {data?.user?.roleLabel || role}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Sistem Informasi Manajemen Proyek Terpadu (Hybrid Waterfall × Kanban)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/kanban"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Papan Kanban</span>
          </Link>
          <Link
            href="/projects"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Lihat Proyek</span>
          </Link>
        </div>
      </div>

      {/* 1. OWNER DASHBOARD */}
      {role === "OWNER" && (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Proyek"
              value={stats.totalProjects || 1}
              subtitle={`${stats.activeProjects} Berjalan, ${stats.completedProjects} Selesai`}
              icon={FolderKanban}
              variant="primary"
            />
            <StatCard
              title="Rata-rata Progres"
              value={`${roleData.avgProgress || 52}%`}
              subtitle="Sesuai rencana baseline"
              icon={TrendingUp}
              variant="success"
            />
            <StatCard
              title="Total Anggaran Pagu"
              value={formatRupiah(stats.totalAllocatedBudget)}
              subtitle={`Realisasi: ${formatRupiah(stats.totalActualCost)}`}
              icon={DollarSign}
              variant="default"
            />
            <StatCard
              title="Gate Menunggu Approval"
              value={roleData.pendingGatesList?.length || stats.pendingGates || 0}
              subtitle="Memerlukan keputusan Anda"
              icon={ShieldCheck}
              variant="warning"
            />
          </div>

          {/* Pending Gates & Strategic Milestones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Gates Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-slate-800 text-base">Gate Menunggu Persetujuan</h3>
                </div>
                <Link href="/gates" className="text-xs font-semibold text-blue-600 hover:underline">
                  Kelola Gate →
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {roleData.pendingGatesList && roleData.pendingGatesList.length > 0 ? (
                  roleData.pendingGatesList.map((g: any) => (
                    <div
                      key={g.id}
                      className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-amber-800 block">{g.name}</span>
                        <span className="text-[11px] text-slate-600 block mt-0.5">
                          Proyek: {g.project?.name}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-1">
                          Diajukan: {formatDate(g.submittedAt)}
                        </span>
                      </div>
                      <Link
                        href={`/gates`}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        Tinjau & Tanda Tangani
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada Gate yang menunggu persetujuan saat ini.
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Milestones */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-800 text-base">Milestone Strategis Mendatang</h3>
                </div>
                <Link href="/timeline" className="text-xs font-semibold text-blue-600 hover:underline">
                  Timeline Lengkap →
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {roleData.upcomingMilestones?.map((m: any) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                        {m.code}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{m.title}</p>
                        <p className="text-[11px] text-slate-500">{m.project?.name}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      {formatDate(m.targetDate)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PROJECT MANAGER DASHBOARD */}
      {role === "PM" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Proyek yang Dikelola"
              value={roleData.managedCount || 1}
              subtitle="Status: Aktif berjalan"
              icon={FolderKanban}
              variant="primary"
            />
            <StatCard
              title="Total Tugas Kanban"
              value={stats.totalTasks || 0}
              subtitle={`${stats.doneTasks} Selesai, WIP: ${roleData.wipCount || 0}`}
              icon={CheckSquare}
              variant="success"
            />
            <StatCard
              title="Risiko Kritis Aktif"
              value={stats.criticalRisks || 0}
              subtitle="Memerlukan mitigasi aktif"
              icon={AlertTriangle}
              variant="danger"
            />
            <StatCard
              title="Change Request (CR)"
              value={roleData.pendingCRs || 0}
              subtitle="Menunggu persetujuan"
              icon={ShieldAlert}
              variant="warning"
            />
          </div>

          {/* Kanban WIP Status & Tasks Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-base">Distribusi Status Tugas Kanban</h3>
                <Link href="/kanban" className="text-xs font-semibold text-blue-600 hover:underline">
                  Buka Papan Kanban →
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500">Backlog</span>
                  <p className="text-xl font-bold text-slate-800">{roleData.tasksByStatus?.backlog || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="text-xs text-blue-700">Analisis</span>
                  <p className="text-xl font-bold text-blue-900">{roleData.tasksByStatus?.analisis || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                  <span className="text-xs text-indigo-700">Develop (Maks 4)</span>
                  <p className="text-xl font-bold text-indigo-900">{roleData.tasksByStatus?.develop || 0} / 4</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                  <span className="text-xs text-purple-700">Review (Maks 3)</span>
                  <p className="text-xl font-bold text-purple-900">{roleData.tasksByStatus?.review || 0} / 3</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-xs text-amber-700">Test (Maks 3)</span>
                  <p className="text-xl font-bold text-amber-900">{roleData.tasksByStatus?.test || 0} / 3</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xs text-emerald-700">Done</span>
                  <p className="text-xl font-bold text-emerald-900">{roleData.tasksByStatus?.done || 0}</p>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base mb-4">Metrik Kinerja Kanban</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600">Cycle Time Rata-rata</span>
                      <span className="text-blue-600 font-bold">8.5 Hari (Target ≤ 14 Hari)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: "60%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600">Throughput Kartu Selesai</span>
                      <span className="text-emerald-600 font-bold">{stats.doneTasks || 3} Kartu</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: "45%" }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Link
                  href="/reports"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold text-center block transition-colors shadow-xs"
                >
                  Buka Laporan EVM & Analisis Lengkap
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. ANGGOTA TIM (MEMBER) DASHBOARD */}
      {role === "MEMBER" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Tugas Saya"
              value={roleData.myTotalTasks || 0}
              subtitle="Ditugaskan kepada Anda"
              icon={CheckSquare}
              variant="primary"
            />
            <StatCard
              title="Tugas Selesai"
              value={roleData.myCompletedTasks || 0}
              subtitle={`Progres penyelesaian: ${roleData.myProgress || 0}%`}
              icon={CheckCircle2}
              variant="success"
            />
            <StatCard
              title="Menunggu Review"
              value={roleData.myReviewTasks?.length || 0}
              subtitle="Perlu code review"
              icon={Clock}
              variant="warning"
            />
            <StatCard
              title="Papan Kanban"
              value="Tersedia"
              subtitle="Pindahkan kartu & update progress"
              icon={FolderKanban}
              variant="default"
            />
          </div>

          {/* My Tasks List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Daftar Tugas Aktif Saya</h3>
              <Link href="/my-tasks" className="text-xs font-semibold text-blue-600 hover:underline">
                Kelola Tugas →
              </Link>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {roleData.myTasks?.map((t: any) => (
                <div key={t.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {t.taskCode}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{t.title}</p>
                      <p className="text-xs text-slate-500">
                        {t.project?.name} • Tenggat: {formatDate(t.dueDate)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      t.status === "Done"
                        ? "success"
                        : t.status === "Develop"
                        ? "primary"
                        : t.status === "Review"
                        ? "warning"
                        : "default"
                    }
                  >
                    {t.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. STAKEHOLDER DASHBOARD */}
      {role === "STAKEHOLDER" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Proyek yang Diikuti"
              value={roleData.joinedProjects?.length || 1}
              subtitle="Status: Aktif terpantau"
              icon={FolderKanban}
              variant="primary"
            />
            <StatCard
              title="Dokumen Disetujui"
              value={roleData.approvedDocumentsCount || 3}
              subtitle="SRS, Charter & Desain Sistem"
              icon={FileText}
              variant="success"
            />
            <StatCard
              title="Progres SIMRS"
              value="52%"
              subtitle="Fase 4: Implementasi Modul"
              icon={TrendingUp}
              variant="default"
            />
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-800 text-base mb-4">Ringkasan Status Fase Proyek SIMRS</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Fase 1: Inisiasi dan Perencanaan</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Project Charter & Scope telah disetujui</p>
                </div>
                <Badge variant="success">Completed (100%)</Badge>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Fase 2: Analisis Kebutuhan</h4>
                  <p className="text-xs text-slate-500 mt-0.5">SRS disahkan oleh Manajemen Rumah Sakit</p>
                </div>
                <Badge variant="success">Completed (100%)</Badge>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Fase 3: Desain Sistem</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Arsitektur & Prototype interaktif siap</p>
                </div>
                <Badge variant="success">Completed (100%)</Badge>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-blue-900">Fase 4: Implementasi Modul</h4>
                  <p className="text-xs text-blue-700 mt-0.5">Pengembangan 10 modul dengan Kanban</p>
                </div>
                <Badge variant="primary">In Progress (60%)</Badge>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. ADMIN DASHBOARD */}
      {role === "ADMIN" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Pengguna"
              value={roleData.totalUsersCount || 10}
              subtitle="Terdaftar di database"
              icon={Users}
              variant="primary"
            />
            <StatCard
              title="Akun Aktif"
              value={roleData.activeUsersCount || 10}
              subtitle="Status akun valid"
              icon={CheckCircle2}
              variant="success"
            />
            <StatCard
              title="Total Proyek"
              value={stats.totalProjects || 1}
              subtitle="Terintegrasi sistem"
              icon={FolderKanban}
              variant="default"
            />
            <StatCard
              title="Audit Log Sistem"
              value="Aktif"
              subtitle="Merekam setiap aktivitas transaksi"
              icon={ShieldAlert}
              variant="warning"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-slate-800 text-base mb-4">Distribusi Pengguna Berdasarkan Role</h3>
              <div className="space-y-2">
                {roleData.usersByRole?.map((r: any) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div>
                      <span className="font-semibold text-xs text-slate-800">{r.label}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">Role ID: {r.name}</span>
                    </div>
                    <Badge variant="primary">{r._count?.users || 0} Pengguna</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base mb-2">Pusat Kendali Administrasi</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Kelola hak akses pengguna, otorisasi RBAC, pengaturan parameter sistem, dan riwayat audit.
                </p>
                <div className="space-y-2">
                  <Link
                    href="/admin/users"
                    className="w-full py-2.5 px-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 text-xs font-bold flex items-center justify-between transition-colors"
                  >
                    <span>Kelola Pengguna & Hak Akses</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/admin/audit-logs"
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-between transition-colors"
                  >
                    <span>Audit Log Aktivitas Sistem</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activities Section for All Roles */}
      <div className="mt-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-base">Aktivitas Terkini Sistem</h3>
          </div>
          <span className="text-xs text-slate-400">Sinkronisasi Database Otomatis</span>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {recentActivities.map((act: any) => (
            <div key={act.id} className="py-3 flex items-start justify-between text-xs">
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-800">
                  <span className="text-blue-600">{act.user?.name || "System"}</span> — {act.action}
                </p>
                <p className="text-slate-500">{act.details || "Operasi database dicatat"}</p>
              </div>
              <span className="text-[11px] text-slate-400 whitespace-nowrap pl-4">
                {formatDate(act.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

