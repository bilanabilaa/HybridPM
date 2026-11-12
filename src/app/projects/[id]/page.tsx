"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatRupiah, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  FolderKanban,
  Layers,
  FileText,
  Calendar,
  Columns,
  Clock,
  AlertTriangle,
  Users,
  BarChart3,
  History,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");

  // Load project
  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (res.ok) {
          const json = await res.json();
          setProject(json.project);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Proyek", href: "/projects" }, { label: "Detail" }]}>
        <div className="py-20 text-center text-slate-400 text-sm">Memuat informasi proyek...</div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout breadcrumbs={[{ label: "Proyek", href: "/projects" }, { label: "Tidak Ditemukan" }]}>
        <div className="py-20 text-center">
          <h2 className="text-lg font-bold text-slate-800">Proyek Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1">Data proyek tidak tersedia atau akses dibatasi.</p>
          <Link href="/projects" className="mt-4 inline-block text-xs font-bold text-blue-600">
            ← Kembali ke Daftar Proyek
          </Link>
        </div>
      </AppLayout>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: FolderKanban },
    { id: "scope", label: "Charter & Scope", icon: FileText },
    { id: "phases", label: "Fase Waterfall", icon: Layers },
    { id: "kanban", label: "Papan Kanban", icon: Columns },
    { id: "timeline", label: "Timeline & Milestone", icon: Calendar },
    { id: "risks", label: "Risiko Proyek", icon: AlertTriangle },
    { id: "documents", label: "Dokumen", icon: FileText },
    { id: "team", label: "Tim & RACI", icon: Users },
    { id: "budget", label: "Anggaran & Termin", icon: DollarSign },
    { id: "activity", label: "Activity Log", icon: History },
  ];

  return (
    <AppLayout
      breadcrumbs={[
        { label: "Daftar Proyek", href: "/projects" },
        { label: project.projectCode },
      ]}
    >
      {/* Project Banner Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
                {project.projectCode}
              </span>
              <Badge
                variant={
                  project.status === "Active"
                    ? "success"
                    : project.status === "Completed"
                    ? "primary"
                    : "default"
                }
              >
                {project.status}
              </Badge>
              <Badge variant="outline">{project.methodology}</Badge>
              <Badge variant={project.priority === "High" ? "danger" : "default"}>
                Prioritas: {project.priority}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">{project.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/kanban?projectId=${project.id}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Columns className="w-4 h-4" />
              <span>Buka Papan Kanban</span>
            </Link>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Project Owner</span>
            <span className="font-bold text-slate-800">{project.owner?.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Project Manager</span>
            <span className="font-bold text-slate-800">{project.manager?.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Pagu Anggaran Baseline</span>
            <span className="font-bold text-slate-800">{formatRupiah(project.budget)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Target Selesai</span>
            <span className="font-bold text-slate-800">{formatDate(project.targetDate)}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-200 mb-6 text-xs font-semibold">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Progres Keseluruhan</span>
              <p className="text-3xl font-extrabold text-blue-600 mt-2">{project.progress}%</p>
              <div className="w-full bg-slate-100 h-2.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Penyelesaian Modul</span>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">6 / 10 Modul</p>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                Fase 4 Implementasi berjalan di staging
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Anggaran Terpakai</span>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                {formatRupiah(
                  project.budgetPlan?.expenses?.reduce((sum: number, e: any) => sum + e.amount, 0) || 0
                )}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Dari total {formatRupiah(project.budget)}
              </span>
            </div>
          </div>

          {/* Waterfall Lifecycle Progress Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base">Alur 7 Fase Waterfall & Gerbang Persetujuan (Gates)</h3>
              <button
                onClick={() => setActiveTab("phases")}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Lihat Detail Fase →
              </button>
            </div>

            <div className="space-y-4">
              {project.phases?.map((p: any) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Fase {p.phaseNumber}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">{p.name}</h4>
                      <Badge
                        variant={
                          p.status === "Completed"
                            ? "success"
                            : p.status === "In Progress"
                            ? "primary"
                            : "default"
                        }
                      >
                        {p.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">{p.description}</p>
                  </div>

                  <div className="text-right sm:min-w-[140px]">
                    <span className="text-xs font-bold text-blue-600 block">{p.progress}% Selesai</span>
                    <span className="text-[11px] text-slate-400 block">
                      Target: {formatDate(p.targetDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. CHARTER & SCOPE TAB */}
      {activeTab === "scope" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Project Charter Resmi</h3>
              <Badge variant="success">Disetujui Steering Committee</Badge>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-700 block text-xs uppercase tracking-wider mb-1">
                  Latar Belakang Proyek
                </span>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {project.charter?.background || "Transformasi digital pelayanan rumah sakit terintegrasi."}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block text-xs uppercase tracking-wider mb-1">
                  Tujuan & Manfaat Bisnis
                </span>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {project.charter?.objectives || "Efisiensi alur antrean, rekam medis elektronik, dan bridging BPJS."}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block text-xs uppercase tracking-wider mb-1">
                  Kriteria Keberhasilan Proyek
                </span>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {project.charter?.successCriteria || "UAT >= 95%, nihil defect kritis, uptime 99%."}
                </p>
              </div>
            </div>
          </div>

          {/* Scope In & Out */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-800 text-base mb-4 pb-4 border-b border-slate-100">
              Batasan Ruang Lingkup (Scope Boundaries)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <span className="font-bold text-emerald-800 text-sm block mb-2">
                  ✓ Dalam Lingkup Proyek (In-Scope)
                </span>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                  {project.scope?.inScope || "1. 10 Modul SIMRS\n2. Integrasi BPJS SatuSehat\n3. Pelatihan staf"}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100">
                <span className="font-bold text-rose-800 text-sm block mb-2">
                  ✕ Di Luar Lingkup Proyek (Out-of-Scope)
                </span>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                  {project.scope?.outOfScope || "1. Pengadaan perangkat komputer PC\n2. Penarikan kabel LAN fisik gedung"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. PHASES & GATES TAB */}
      {activeTab === "phases" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base">7 Fase Utama Waterfall & Pengendalian Gate</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fase berikutnya terkunci sebelum Gate sebelumnya disetujui resmi oleh Owner.
                </p>
              </div>
              <Link
                href="/gates"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Pusat Gate Approval →
              </Link>
            </div>

            <div className="mt-6 space-y-6">
              {project.phases?.map((p: any) => {
                const gate = p.gates?.[0];
                return (
                  <div
                    key={p.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 transition-all shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
                          Fase {p.phaseNumber}
                        </span>
                        <h4 className="text-base font-bold text-slate-900">{p.name}</h4>
                      </div>
                      <Badge
                        variant={
                          p.status === "Completed"
                            ? "success"
                            : p.status === "In Progress"
                            ? "primary"
                            : "default"
                        }
                      >
                        {p.status} ({p.progress}%)
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 mt-3 leading-relaxed">{p.description}</p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-4 text-slate-500">
                        <span>Mulai: {formatDate(p.startDate)}</span>
                        <span>Target: {formatDate(p.targetDate)}</span>
                      </div>

                      {gate && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500 font-medium">Status Gate:</span>
                          <Badge
                            variant={
                              gate.status === "Approved"
                                ? "success"
                                : gate.status === "Pending Approval"
                                ? "warning"
                                : "default"
                            }
                          >
                            {gate.status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. KANBAN TAB */}
      {activeTab === "kanban" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-center py-12">
          <Columns className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Papan Kanban Terintegrasi</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Buka tampilan Kanban khusus untuk drag-and-drop kartu, pembatasan WIP (Develop maks 4, Review maks 3, Test maks 3), dan metriks cycle time.
          </p>
          <Link
            href={`/kanban?projectId=${project.id}`}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-2"
          >
            <span>Buka Kanban Board Lengkap</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 5. TIMELINE TAB */}
      {activeTab === "timeline" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Milestone Baseline Proyek (M1 - M8)</h3>
              <Link href="/timeline" className="text-xs font-bold text-blue-600 hover:underline">
                Gantt Chart Interaktif →
              </Link>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {project.milestones?.map((m: any) => (
                <div key={m.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center border border-blue-100">
                      {m.code}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">{m.title}</p>
                      <p className="text-slate-500 text-[11px]">{m.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-700">{formatDate(m.targetDate)}</span>
                    <Badge variant={m.isReached ? "success" : "default"}>
                      {m.isReached ? "Tercapai" : "Mendatang"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. RISKS TAB */}
      {activeTab === "risks" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-center py-12">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Manajemen Risiko & Matriks 5×5</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Kelola Risk Register, kalkulasi skor probabilitas dan dampak, serta rencana mitigasi dwimingguan.
          </p>
          <Link
            href={`/risks?projectId=${project.id}`}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-2"
          >
            <span>Buka Risk Register & Matriks 5×5</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 7. DOCUMENTS TAB */}
      {activeTab === "documents" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-center py-12">
          <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Manajemen Dokumen & Versioning</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Akses dokumen SRS, Arsitektur Sistem, ERD, dan Berita Acara tanpa menimpa versi lama.
          </p>
          <Link
            href={`/documents?projectId=${project.id}`}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-2"
          >
            <span>Buka Repositori Dokumen</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 8. TEAM TAB */}
      {activeTab === "team" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Anggota Tim Proyek</h3>
              <Link href="/team" className="text-xs font-bold text-blue-600 hover:underline">
                Matriks RACI Lengkap →
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {project.members?.map((m: any) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                    {m.user?.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{m.user?.name}</p>
                    <p className="text-[11px] text-blue-600 font-medium">{m.roleInProject}</p>
                    <p className="text-[10px] text-slate-400">{m.division || m.user?.division}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 9. BUDGET TAB */}
      {activeTab === "budget" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Alokasi Anggaran Baseline & Termin</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total Anggaran: {formatRupiah(project.budget)} (Termasuk PPN 11% & Kontingensi 10%)
                </p>
              </div>
              <Link
                href="/budget"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Pusat Anggaran & Pengeluaran →
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {project.budgetPlan?.items?.map((item: any) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 block">{item.name}</span>
                    <span className="text-[11px] text-slate-500">Kategori: {item.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">{formatRupiah(item.allocatedAmount)}</span>
                    <Badge variant={item.isPaid ? "success" : "default"}>
                      {item.isPaid ? "Telah Dicairkan" : "Belum Cair"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 10. ACTIVITY TAB */}
      {activeTab === "activity" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-800 text-base mb-4 pb-4 border-b border-slate-100">
            Riwayat Aktivitas & Jejak Audit Proyek
          </h3>
          <div className="py-4 text-center text-xs text-slate-500">
            Seluruh transaksi modul disimpan pada modul Audit Log tersentralisasi.
          </div>
          <div className="text-center">
            <Link
              href="/admin/audit-logs"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
            >
              <span>Buka Audit Log Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

