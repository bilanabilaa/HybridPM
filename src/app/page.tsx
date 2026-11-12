import React from "react";
import Link from "next/link";
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  Columns,
  Calendar,
  AlertTriangle,
  FileCheck2,
  TrendingUp,
  CheckCircle,
} from "lucide-react";

export default function LandingPage() {
  const demoAccounts = [
    { role: "Owner", email: "owner@hybridpm.local", desc: "Persetujuan Gate strategis, pagu biaya & audit" },
    { role: "Project Manager", email: "pm@hybridpm.local", desc: "Manajemen scope, WBS, jadwal & kontrol Kanban" },
    { role: "Anggota Tim", email: "member@hybridpm.local", desc: "Pelaksanaan tugas teknis, kode & pengujian" },
    { role: "Stakeholder", email: "stakeholder@hybridpm.local", desc: "Pemantauan berkala & tinjauan demo modul" },
    { role: "Administrator", email: "admin@hybridpm.local", desc: "Konfigurasi akun, master data & audit log" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              Hybrid<span className="text-blue-400">PM</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
            >
              <span>Masuk Aplikasi</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 px-6 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800 text-blue-300 text-xs font-semibold mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Hybrid Project Management System — Terintegrasi & Berstandar Industri</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Padukan Disiplin <span className="text-blue-400">Waterfall</span> dengan Ketangkasan{" "}
            <span className="text-blue-400">Kanban</span>
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            HybridPM menghadirkan tata kelola proyek enterprise: kontrol fase dan Gate Approval sekuensial
            untuk kepastian anggaran dan jadwal, berpadu dengan papan Kanban visual dan batasan WIP untuk
            kecepatan eksekusi harian tim.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/login"
              className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-base shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2.5"
            >
              <span>Mulai Sekarang</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-base border border-slate-700 transition-all"
            >
              Demo Akun Tersedia
            </Link>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-800">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-blue-500/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center mb-4 border border-blue-800">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">7 Fase Waterfall & Gate Approval</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Pengawasan sekuensial dari Inisiasi, SRS, Desain, hingga Serah Terima BAST. Dilengkapi stempel
                digital konfirmasi Gate.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-blue-500/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-800">
                <Columns className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Kanban Interaktif & Batas WIP</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Alur kartu Develop (maks. 4), Review (maks. 3), dan Test (maks. 3). Metrik Lead Time, Cycle Time,
                dan Throughput otomatis.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-blue-500/50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center mb-4 border border-amber-800">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">EVM & Anggaran Dinamis</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Baseline pagu anggaran Rp956.043.000 dengan 5 termin, monitoring CPI/SPI aktual, dan kalkulasi
                biaya riil dari database.
              </p>
            </div>
          </div>
        </section>

        {/* Demo Roles Section */}
        <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-800 bg-slate-950/40 rounded-3xl p-8 mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white">Akun Demo Siap Pakai</h2>
            <p className="text-sm text-slate-400 mt-1">
              Gunakan kata sandi: <code className="text-blue-300 font-mono bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900">Password123!</code>
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {demoAccounts.map((d) => (
              <div
                key={d.role}
                className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                    {d.role}
                  </span>
                  <span className="text-xs font-mono text-slate-300 block mt-1 break-all select-all">
                    {d.email}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-2">{d.desc}</p>
                </div>
                <Link
                  href={`/login?email=${encodeURIComponent(d.email)}`}
                  className="mt-4 w-full py-1.5 text-center text-xs font-semibold bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg transition-colors border border-blue-500/30"
                >
                  Pilih Role Ini
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>HybridPM © 2026. Sistem Informasi Manajemen Proyek Waterfall-Kanban.</p>
      </footer>
    </div>
  );
}

