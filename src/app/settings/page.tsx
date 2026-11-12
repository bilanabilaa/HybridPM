"use client";

import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Settings, Shield, Bell, Database, Globe, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppLayout breadcrumbs={[{ label: "Pengaturan Sistem" }]}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Pengaturan & Konfigurasi Aplikasi</h1>
          <p className="text-xs text-slate-500 mt-1">
            Parameter sistem HybridPM, batasan WIP Kanban, dan preferensi notifikasi.
          </p>
        </div>

        <div className="space-y-6">
          {/* General App Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <span>Identitas & Versi Aplikasi</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block">Nama Sistem</span>
                <span className="font-bold text-slate-800 text-sm">
                  HybridPM (Hybrid Project Management System)
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block">Versi Rilis</span>
                <span className="font-bold text-blue-600 text-sm">v1.0.0 Stable Enterprise</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block">Arsitektur Database</span>
                <span className="font-bold text-slate-800 text-sm">Prisma ORM Relasional (31 Tabel)</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block">Standar Metodologi</span>
                <span className="font-bold text-slate-800 text-sm">
                  Waterfall 7-Fase × Kanban WIP Limits
                </span>
              </div>
            </div>
          </div>

          {/* Kanban WIP Configuration Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <span>Konfigurasi Batas WIP (Work in Progress) Kanban</span>
            </h2>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="pb-2">Nama Kolom Kanban</th>
                    <th className="pb-2">Batas Maksimal Kartu</th>
                    <th className="pb-2">Alasan Pembatasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 font-bold text-slate-800">Backlog</td>
                    <td className="py-2.5 text-slate-500">Tidak Dibatasi</td>
                    <td className="py-2.5 text-slate-500">Menampung seluruh ide & kebutuhan</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-slate-800">Analisis</td>
                    <td className="py-2.5 text-slate-500">Tidak Dibatasi</td>
                    <td className="py-2.5 text-slate-500">Eksplorasi use case dan arsitektur</td>
                  </tr>
                  <tr className="bg-blue-50/50">
                    <td className="py-2.5 font-bold text-blue-900">Develop</td>
                    <td className="py-2.5 font-bold text-blue-900">Maksimal 4 Kartu</td>
                    <td className="py-2.5 text-blue-800">Mencegah multitasking & bottleneck pengembang</td>
                  </tr>
                  <tr className="bg-purple-50/50">
                    <td className="py-2.5 font-bold text-purple-900">Review</td>
                    <td className="py-2.5 font-bold text-purple-900">Maksimal 3 Kartu</td>
                    <td className="py-2.5 text-purple-800">Menjaga kecepatan peer review kode</td>
                  </tr>
                  <tr className="bg-amber-50/50">
                    <td className="py-2.5 font-bold text-amber-900">Test</td>
                    <td className="py-2.5 font-bold text-amber-900">Maksimal 3 Kartu</td>
                    <td className="py-2.5 text-amber-800">Memastikan QA menguji secara teliti dan tuntas</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-emerald-800">Done</td>
                    <td className="py-2.5 text-slate-500">Tidak Dibatasi</td>
                    <td className="py-2.5 text-slate-500">Wajib lulus Code Review, Test, dan Demo</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

