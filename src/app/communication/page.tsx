"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import {
  MessageSquare,
  Calendar,
  Clock,
  Video,
  FileCheck2,
  Bell,
  Users,
  CheckCircle2,
} from "lucide-react";

export default function CommunicationPage() {
  const [selectedTab, setSelectedTab] = useState<"meetings" | "announcements" | "mom">("meetings");

  const meetings = [
    {
      id: "1",
      title: "Daily Stand-up Tim Pengembangan SIMRS",
      type: "Daily Stand-up (15 Menit)",
      time: "Setiap Hari Kerja, 09.00 - 09.15 WIB",
      location: "Ruang Rapat IT / Google Meet",
      agenda: "Update 3 pertanyaan: Pekerjaan kemarin, rencana hari ini, dan kendala (blocker).",
      status: "Berjalan Rutin",
    },
    {
      id: "2",
      title: "Demo Mingguan Sprint Modul Rekam Medis (RME)",
      type: "Demo Mingguan (Minggu ke-4)",
      time: "Jumat, 13 Februari 2027, 14.00 - 15.00 WIB",
      location: "Auditorium RS Lt. 2",
      agenda: "Demonstrasi alur input pemeriksaan SOAP dokter dan validasi resep elektronik.",
      status: "Terjadwal",
    },
    {
      id: "3",
      title: "Rapat Steering Committee Evaluasi Gate 4 (Implementasi)",
      type: "Rapat Gate (Akhir Fase)",
      time: "Jumat, 12 Maret 2027, 10.00 - 11.30 WIB",
      location: "Ruang Rapat Direksi RS",
      agenda: "Peninjauan 10 modul di server staging sebelum pengesahan Gate 4 ke fase pengujian QA.",
      status: "Terjadwal",
    },
  ];

  const announcements = [
    {
      id: "1",
      title: "Jadwal Pemeliharaan Server Staging SIMRS",
      date: "5 November 2026",
      sender: "Fajar Ramadhan (Divisi Infrastruktur)",
      content: "Akan dilakukan upgrade konfigurasi PostgreSQL dan RAM server staging pada hari Sabtu pukul 22.00 WIB.",
    },
    {
      id: "2",
      title: "Disiplin Pembatasan WIP Papan Kanban",
      date: "2 November 2026",
      sender: "Hendra Wijaya (Kanban Coach)",
      content: "Mengingatkan seluruh tim: kolom Develop maksimal 4 kartu, Review maksimal 3 kartu, dan Test maksimal 3 kartu. Selesaikan kartu yang sedang berjalan sebelum menarik kartu baru dari Analisis/Backlog.",
    },
  ];

  return (
    <AppLayout breadcrumbs={[{ label: "Pusat Komunikasi & Rapat" }]}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Komunikasi & Koordinasi Stakeholder</h1>
            <Badge variant="primary">Standar Komunikasi Proyek</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Frekuensi teratur: Daily stand-up harian 15 menit, Demo mingguan, Laporan kemajuan dwimingguan, dan Rapat Gate.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 text-xs font-semibold">
        <button
          onClick={() => setSelectedTab("meetings")}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-2 ${
            selectedTab === "meetings"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Jadwal Rapat & Agenda</span>
        </button>

        <button
          onClick={() => setSelectedTab("announcements")}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-2 ${
            selectedTab === "announcements"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Pengumuman Proyek</span>
        </button>
      </div>

      {/* Meetings Tab */}
      {selectedTab === "meetings" && (
        <div className="space-y-4">
          {meetings.map((m) => (
            <div
              key={m.id}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="primary">{m.type}</Badge>
                  <Badge variant="success">{m.status}</Badge>
                </div>
                <h3 className="font-bold text-base text-slate-900">{m.title}</h3>
                <p className="text-xs text-slate-600">{m.agenda}</p>

                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {m.time}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-slate-400" />
                    {m.location}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors">
                  Notulensi (MoM)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Announcements Tab */}
      {selectedTab === "announcements" && (
        <div className="space-y-4">
          {announcements.map((a) => (
            <div key={a.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">{a.title}</h3>
                <span className="text-[11px] text-slate-400">{a.date}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{a.content}</p>
              <span className="text-[11px] font-bold text-blue-600 block pt-2 border-t border-slate-100">
                Oleh: {a.sender}
              </span>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

