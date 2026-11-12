"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  DollarSign,
  Clock,
  Layers,
  AlertTriangle,
  CheckCircle2,
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
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch("/api/reports");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, []);

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ["Metric", "Nilai"],
      ["Nama Proyek", data.project?.name],
      ["Kode Proyek", data.project?.projectCode],
      ["Progres Keseluruhan", `${data.project?.progress}%`],
      ["Total Anggaran", data.evm?.totalBudget],
      ["Earned Value (EV)", data.evm?.earnedValue],
      ["Actual Cost (AC)", data.evm?.actualCost],
      ["Planned Value (PV)", data.evm?.plannedValue],
      ["Cost Variance (CV)", data.evm?.costVariance],
      ["Schedule Variance (SV)", data.evm?.scheduleVariance],
      ["Cost Performance Index (CPI)", data.evm?.cpi],
      ["Schedule Performance Index (SPI)", data.evm?.spi],
      ["Rata-rata Cycle Time (Hari)", data.kanbanMetrics?.avgCycleTime],
      ["Throughput (Kartu Selesai)", data.kanbanMetrics?.throughput],
      ["Work In Progress (WIP)", data.kanbanMetrics?.currentWIP],
      ["Waktu Laporan Dibuat", data.generatedAt],
      ["Dibuat Oleh", data.generatedBy],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Laporan_Kinerja_HybridPM_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Laporan & Analisis" }]}>
        <div className="py-20 text-center text-slate-400 text-sm">Menyiapkan laporan analitis...</div>
      </AppLayout>
    );
  }

  const evm = data?.evm || {};
  const km = data?.kanbanMetrics || {};

  return (
    <AppLayout breadcrumbs={[{ label: "Laporan & Analisis Kinerja" }]}>
      {/* Header with Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Laporan & Analisis Kinerja Proyek</h1>
            <Badge variant="primary">EVM & Kanban Analytics</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data aktual terverifikasi dari database: Earned Value Management, varian biaya/jadwal, dan metrik alur kerja.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* EVM Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Cost Performance Index (CPI)"
          value={evm.cpi}
          subtitle={evm.cpi >= 1.0 ? "Efisiensi biaya sangat baik (CPI ≥ 1.0)" : "Biaya melebihi rencana (CPI < 1.0)"}
          icon={TrendingUp}
          variant={evm.cpi >= 1.0 ? "success" : "danger"}
        />
        <StatCard
          title="Schedule Performance Index (SPI)"
          value={evm.spi}
          subtitle={evm.spi >= 1.0 ? "Jadwal sesuai atau lebih cepat (SPI ≥ 1.0)" : "Proyek mengalami penundaan"}
          icon={Clock}
          variant={evm.spi >= 1.0 ? "success" : "warning"}
        />
        <StatCard
          title="Cost Variance (CV = EV - AC)"
          value={formatRupiah(evm.costVariance)}
          subtitle={evm.costVariance >= 0 ? "Pengeluaran di bawah anggaran" : "Over budget"}
          icon={DollarSign}
          variant={evm.costVariance >= 0 ? "success" : "danger"}
        />
        <StatCard
          title="Rata-rata Cycle Time"
          value={`${km.avgCycleTime} Hari`}
          subtitle={`Target SLA: ≤ ${km.targetCycleTime || 14} Hari / Kartu`}
          icon={CheckCircle2}
          variant={km.avgCycleTime <= 14 ? "success" : "danger"}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Waterfall Phase Progress Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-800 text-base mb-4">Progres Tiap Fase Waterfall</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.phaseProgressData || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, "Progres"]}
                  labelFormatter={(name: any) => `Fase: ${name}`}
                />
                <Bar dataKey="progress" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Distribution Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-800 text-base mb-4">Distribusi Kartu Tugas Kanban</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.taskStatusData || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: any) => [`${val} Kartu`, "Jumlah"]} />
                <Bar dataKey="count" fill="#172554" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* EVM Summary Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mb-8">
        <h3 className="font-bold text-slate-800 text-base mb-4 pb-3 border-b border-slate-100">
          Ringkasan Kalkulasi Nilai Tambah (Earned Value Management)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-500 block">Total Budget (BAC)</span>
            <span className="font-bold text-slate-900 text-sm">{formatRupiah(evm.totalBudget)}</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl">
            <span className="text-blue-700 block">Earned Value (EV)</span>
            <span className="font-bold text-blue-900 text-sm">{formatRupiah(evm.earnedValue)}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-500 block">Actual Cost (AC)</span>
            <span className="font-bold text-slate-900 text-sm">{formatRupiah(evm.actualCost)}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-500 block">Planned Value (PV)</span>
            <span className="font-bold text-slate-900 text-sm">{formatRupiah(evm.plannedValue)}</span>
          </div>
        </div>
      </div>

      {/* Report Generator Stamp */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>
          Laporan digenerate otomatis dari database pada: <strong>{formatDate(data?.generatedAt)}</strong>
        </span>
        <span>
          Penanggung Jawab Laporan: <strong>{data?.generatedBy}</strong>
        </span>
      </div>
    </AppLayout>
  );
}

