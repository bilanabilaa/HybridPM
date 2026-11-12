"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { StatCard } from "@/components/ui/StatCard";
import { formatRupiah, formatDate } from "@/lib/utils";
import { DollarSign, Plus, CheckCircle2, AlertTriangle, TrendingDown, Receipt } from "lucide-react";

export default function BudgetManagementPage() {
  const [budget, setBudget] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New expense modal
  const [showModal, setShowModal] = useState(false);
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState<any>("SDM");
  const [amount, setAmount] = useState<number>(10000000);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadBudget = async () => {
    try {
      const res = await fetch("/api/budget");
      if (res.ok) {
        const json = await res.json();
        setBudget(json.budget);
        setSummary(json.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudget();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budget?.projectId) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: budget.projectId,
          description: desc,
          category,
          amount: Number(amount),
          expenseDate,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mencatat pengeluaran");

      setShowModal(false);
      setDesc("");
      setAmount(10000000);
      await loadBudget();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout breadcrumbs={[{ label: "Manajemen Anggaran & Biaya" }]}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Manajemen Anggaran & Termin Proyek</h1>
            <Badge variant="success">Kalkulasi Dinamis Database</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Baseline anggaran Rp956.043.000, pemantauan pengeluaran riil, dan jadwal pencairan 5 termin.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Pengeluaran Riil</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Pagu Anggaran"
          value={formatRupiah(summary?.totalBudget || 956043000)}
          subtitle="Termasuk PPN 11% & Kontingensi 10%"
          icon={DollarSign}
          variant="primary"
        />
        <StatCard
          title="Realisasi Biaya Aktual"
          value={formatRupiah(summary?.totalActualExpense || 0)}
          subtitle={`Persentase serapan: ${summary?.expensePercentage || 0}%`}
          icon={Receipt}
          variant="default"
        />
        <StatCard
          title="Sisa Anggaran Tersedia"
          value={formatRupiah(summary?.remainingBudget || 0)}
          subtitle="Tersedia untuk termin berikutnya"
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Varian Biaya (Cost Variance)"
          value={formatRupiah(summary?.costVariance || 0)}
          subtitle="Status: Berada di bawah pagu"
          icon={TrendingDown}
          variant="success"
        />
      </div>

      {/* Breakdown Baseline & Termin Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Baseline Formula Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="font-bold text-slate-800 text-base mb-4 pb-3 border-b border-slate-100">
            Rincian Baseline Biaya (Sesuai Dokumen Proyek)
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Total Biaya SDM (Tenaga Ahli)</span>
              <span className="font-bold text-slate-900">{formatRupiah(budget?.totalLaborCost || 722000000)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Total Biaya Non-SDM (Infrastruktur & Lisensi)</span>
              <span className="font-bold text-slate-900">{formatRupiah(budget?.totalNonLaborCost || 61000000)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 font-bold bg-slate-50 px-2 rounded">
              <span className="text-slate-800">Total Biaya Langsung Proyek</span>
              <span className="text-blue-700">{formatRupiah(budget?.directCost || 783000000)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Dana Cadangan Kontingensi (10%)</span>
              <span className="font-bold text-slate-900">{formatRupiah(budget?.contingencyCost || 78300000)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 font-bold bg-slate-50 px-2 rounded">
              <span className="text-slate-800">Subtotal Sebelum Pajak</span>
              <span className="text-slate-900">{formatRupiah(budget?.subtotal || 861300000)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Pajak Pertambahan Nilai (PPN 11%)</span>
              <span className="font-bold text-slate-900">{formatRupiah(budget?.taxAmount || 94743000)}</span>
            </div>
            <div className="flex justify-between py-3 font-extrabold text-sm text-blue-900 bg-blue-50 px-3 rounded-xl border border-blue-100">
              <span>TOTAL ANGGARAN PROYEK</span>
              <span>{formatRupiah(budget?.totalBudget || 956043000)}</span>
            </div>
          </div>
        </div>

        {/* 5 Termin Schedule */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="font-bold text-slate-800 text-base mb-4 pb-3 border-b border-slate-100">
            Jadwal Pembayaran & Pencairan 5 Termin
          </h2>

          <div className="space-y-3">
            {budget?.items
              ?.filter((it: any) => it.category === "Termin")
              .map((termin: any) => (
                <div
                  key={termin.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800 block">{termin.name}</span>
                    <span className="text-[11px] text-slate-500">
                      {termin.isPaid ? `Dicairkan pada ${formatDate(termin.paidAt)}` : "Belum dicairkan"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">
                      {formatRupiah(termin.allocatedAmount)}
                    </span>
                    <Badge variant={termin.isPaid ? "success" : "default"}>
                      {termin.isPaid ? "Lunas" : "Menunggu Gate"}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Actual Expenses Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="font-bold text-slate-800 text-base mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-blue-600" />
          <span>Riwayat Pengeluaran Biaya Aktual Proyek</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="pb-3 px-3">Tanggal</th>
                <th className="pb-3 px-3">Uraian Transaksi</th>
                <th className="pb-3 px-3">Kategori</th>
                <th className="pb-3 px-3">Disetujui Oleh</th>
                <th className="pb-3 px-3 text-right">Jumlah Biaya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {budget?.expenses?.map((exp: any) => (
                <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                    {formatDate(exp.expenseDate)}
                  </td>
                  <td className="py-3 px-3 text-slate-900 font-medium">{exp.description}</td>
                  <td className="py-3 px-3">
                    <Badge variant="outline">{exp.category}</Badge>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{exp.approvedBy || "Owner"}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                    {formatRupiah(exp.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Catat Pengeluaran Biaya Baru"
        description="Pencatatan pengeluaran dana langsung terkalkulasi ke sisa pagu dan realisasi."
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-xs">{errorMsg}</div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Uraian Pengeluaran *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Pembayaran lisensi basis data cloud bulan ke-4"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Biaya *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50"
              >
                <option value="SDM">SDM</option>
                <option value="Infrastruktur">Infrastruktur</option>
                <option value="Lisensi">Lisensi</option>
                <option value="Operasional">Operasional</option>
                <option value="Kontingensi">Kontingensi (Otorisasi Owner)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Transaksi *</label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Biaya (Rp) *</label>
            <input
              type="number"
              required
              min={1000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs disabled:opacity-50"
            >
              {submitting ? "Menyimpan..." : "Simpan Pengeluaran"}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

