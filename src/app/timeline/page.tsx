"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { Calendar, Layers, Clock, CheckCircle2, ChevronRight, User } from "lucide-react";

export default function TimelinePage() {
  const [wbsItems, setWbsItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWbs() {
      try {
        const res = await fetch("/api/wbs");
        if (res.ok) {
          const json = await res.json();
          setWbsItems(json.items || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadWbs();
  }, []);

  const baselinePhases = [
    { name: "Inisiasi dan Perencanaan", start: "2 Nov 2026", end: "20 Nov 2026", status: "Completed", progress: 100 },
    { name: "Analisis Kebutuhan", start: "23 Nov 2026", end: "11 Des 2026", status: "Completed", progress: 100 },
    { name: "Desain Sistem", start: "14 Des 2026", end: "8 Jan 2027", status: "Completed", progress: 100 },
    { name: "Implementasi", start: "11 Jan 2027", end: "12 Mar 2027", status: "In Progress", progress: 60 },
    { name: "Pengujian", start: "15 Mar 2027", end: "2 Apr 2027", status: "Not Started", progress: 0 },
    { name: "UAT, Deployment, Pelatihan", start: "5 Apr 2027", end: "23 Apr 2027", status: "Not Started", progress: 0 },
    { name: "Penutupan dan BAST", start: "26 Apr 2027", end: "30 Apr 2027", status: "Not Started", progress: 0 },
  ];

  const baselineMilestones = [
    { code: "M1", title: "Kick-off & Charter Disetujui", date: "20 Nov 2026", done: true },
    { code: "M2", title: "Penandatanganan Dokumen SRS", date: "11 Des 2026", done: true },
    { code: "M3", title: "Arsitektur & Prototype Selesai", date: "8 Jan 2027", done: true },
    { code: "M4", title: "Penyelesaian 10 Modul Staging", date: "12 Mar 2027", done: false },
    { code: "M5", title: "Lolos Pengujian Bebas Defect Kritis", date: "2 Apr 2027", done: false },
    { code: "M6", title: "Berita Acara UAT Disetujui", date: "16 Apr 2027", done: false },
    { code: "M7", title: "Go-Live Sistem SIMRS", date: "21 Apr 2027", done: false },
    { code: "M8", title: "Serah Terima Akhir & BAST", date: "30 Apr 2027", done: false },
  ];

  return (
    <AppLayout breadcrumbs={[{ label: "Timeline & WBS" }]}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Timeline Proyek & Work Breakdown Structure (WBS)</h1>
        <p className="text-xs text-slate-500 mt-1">
          Jadwal baseline proyek, hierarki aktivitas kerja, penetapan matriks RACI, dan milestone M1 - M8.
        </p>
      </div>

      {/* Baseline Gantt Timeline Cards */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mb-8">
        <h2 className="font-bold text-slate-800 text-base mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span>Jadwal Baseline 7 Fase Proyek</span>
        </h2>

        <div className="space-y-4">
          {baselinePhases.map((phase, idx) => (
            <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Fase {idx + 1}
                  </span>
                  <span className="font-bold text-sm text-slate-900">{phase.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500 font-medium">
                    {phase.start} — {phase.end}
                  </span>
                  <Badge
                    variant={
                      phase.status === "Completed"
                        ? "success"
                        : phase.status === "In Progress"
                        ? "primary"
                        : "default"
                    }
                  >
                    {phase.status} ({phase.progress}%)
                  </Badge>
                </div>
              </div>

              {/* Visual Gantt Bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    phase.status === "Completed"
                      ? "bg-emerald-500"
                      : phase.status === "In Progress"
                      ? "bg-blue-600"
                      : "bg-slate-300"
                  }`}
                  style={{ width: `${phase.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones M1 to M8 */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mb-8">
        <h2 className="font-bold text-slate-800 text-base mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Milestone Utama Proyek (M1 - M8)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {baselineMilestones.map((m) => (
            <div
              key={m.code}
              className={`p-4 rounded-xl border transition-all ${
                m.done
                  ? "bg-emerald-50/50 border-emerald-200"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                    m.done
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {m.code}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">{m.date}</span>
              </div>
              <p className="text-xs font-bold text-slate-800 line-clamp-2">{m.title}</p>
              <Badge variant={m.done ? "success" : "default"} className="mt-3 text-[10px]">
                {m.done ? "Tercapai" : "Menunggu"}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Hierarchical WBS Table & RACI */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="font-bold text-slate-800 text-base mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          <span>Tabel Hierarki WBS & Matriks RACI</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="pb-3 px-2">Kode WBS</th>
                <th className="pb-3 px-2">Aktivitas / Deliverable</th>
                <th className="pb-3 px-2">Tenggat</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2 text-center">R</th>
                <th className="pb-3 px-2 text-center">A</th>
                <th className="pb-3 px-2 text-center">C</th>
                <th className="pb-3 px-2 text-center">I</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {wbsItems.map((item) => {
                const isHeader = !item.wbsCode.includes(".");
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isHeader ? "font-bold bg-slate-50/80" : ""
                    }`}
                  >
                    <td className="py-3 px-2 font-mono text-blue-600 font-bold">{item.wbsCode}</td>
                    <td className="py-3 px-2 text-slate-900">{item.title}</td>
                    <td className="py-3 px-2 text-slate-500 whitespace-nowrap">
                      {formatDate(item.endDate)}
                    </td>
                    <td className="py-3 px-2">
                      <Badge
                        variant={
                          item.status === "Completed"
                            ? "success"
                            : item.status === "In Progress"
                            ? "primary"
                            : "default"
                        }
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-center text-[11px] font-semibold text-slate-700">
                      {item.raciR || "-"}
                    </td>
                    <td className="py-3 px-2 text-center text-[11px] font-semibold text-slate-700">
                      {item.raciA || "-"}
                    </td>
                    <td className="py-3 px-2 text-center text-[11px] font-semibold text-slate-500">
                      {item.raciC || "-"}
                    </td>
                    <td className="py-3 px-2 text-center text-[11px] font-semibold text-slate-500">
                      {item.raciI || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

