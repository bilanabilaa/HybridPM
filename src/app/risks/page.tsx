"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { AlertTriangle, Plus, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";

export default function RiskManagementPage() {
  const [risks, setRisks] = useState<any[]>([]);
  const [matrixCounts, setMatrixCounts] = useState<Record<string, number>>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(true);

  // New risk form modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState<any>("Teknis");
  const [prob, setProb] = useState(3);
  const [impact, setImpact] = useState(3);
  const [mitigation, setMitigation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [pRes, rRes] = await Promise.all([
        fetch("/api/projects").then((r) => r.json()),
        fetch(`/api/risks${selectedProjectId ? `?projectId=${selectedProjectId}` : ""}`).then((r) =>
          r.json()
        ),
      ]);
      setProjects(pRes.projects || []);
      setRisks(rRes.risks || []);
      setMatrixCounts(rRes.matrix || {});
      if (!selectedProjectId && pRes.projects?.length > 0) {
        setSelectedProjectId(pRes.projects[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProjectId]);

  const handleCreateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/risks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          title,
          description: desc,
          category,
          probability: Number(prob),
          impact: Number(impact),
          mitigationPlan: mitigation,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mencatat risiko");

      setShowModal(false);
      setTitle("");
      setDesc("");
      setMitigation("");
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getMatrixCellColor = (p: number, i: number) => {
    const score = p * i;
    if (score >= 15) return "bg-rose-100 text-rose-800 border-rose-300";
    if (score >= 10) return "bg-amber-100 text-amber-800 border-amber-300";
    if (score >= 5) return "bg-blue-100 text-blue-800 border-blue-300";
    return "bg-emerald-100 text-emerald-800 border-emerald-300";
  };

  return (
    <AppLayout breadcrumbs={[{ label: "Manajemen Risiko" }]}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Risk Register & Matriks 5×5</h1>
            <Badge variant="danger">ISO 31000 / PMBOK</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Identifikasi, evaluasi skor risiko (Probabilitas × Dampak), serta rencana mitigasi dwimingguan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-xl"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectCode} — {p.name.slice(0, 25)}...
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Identifikasi Risiko Baru</span>
          </button>
        </div>
      </div>

      {/* 5x5 Matrix Grid Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mb-8">
        <h2 className="font-bold text-slate-800 text-base mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <span>Matriks Distribusi Risiko 5×5 (Probabilitas vs Dampak)</span>
        </h2>

        <div className="overflow-x-auto">
          <div className="min-w-[500px] max-w-2xl mx-auto">
            <div className="flex items-center text-xs font-bold text-slate-500 mb-2 justify-center">
              Dampak (Impact) 1 → 5
            </div>

            <div className="grid grid-cols-6 gap-2 text-center text-xs font-bold">
              {/* Header row for Impact */}
              <div className="p-2 text-slate-400">P \ I</div>
              <div className="p-2 bg-slate-50 rounded">1. Very Low</div>
              <div className="p-2 bg-slate-50 rounded">2. Low</div>
              <div className="p-2 bg-slate-50 rounded">3. Medium</div>
              <div className="p-2 bg-slate-50 rounded">4. High</div>
              <div className="p-2 bg-slate-50 rounded">5. Critical</div>

              {/* Rows from Probability 5 down to 1 */}
              {[5, 4, 3, 2, 1].map((p) => (
                <React.Fragment key={p}>
                  <div className="p-2 bg-slate-50 rounded text-slate-600 flex items-center justify-center">
                    P: {p}
                  </div>
                  {[1, 2, 3, 4, 5].map((i) => {
                    const count = matrixCounts[`${p}_${i}`] || 0;
                    return (
                      <div
                        key={`${p}_${i}`}
                        className={`h-12 rounded-lg border flex flex-col items-center justify-center transition-all ${getMatrixCellColor(
                          p,
                          i
                        )}`}
                      >
                        <span className="text-[11px] font-extrabold">{count > 0 ? `${count} Risiko` : "-"}</span>
                        <span className="text-[9px] opacity-70">Skor: {p * i}</span>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" /> Low (1-4)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500" /> Medium (5-9)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" /> High (10-14)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" /> Critical (15-25)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Register Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="font-bold text-slate-800 text-base mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-blue-600" />
          <span>Tabel Risk Register Proyek</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="pb-3 px-3">Kode</th>
                <th className="pb-3 px-3">Deskripsi Risiko</th>
                <th className="pb-3 px-3">Kategori</th>
                <th className="pb-3 px-3 text-center">P</th>
                <th className="pb-3 px-3 text-center">I</th>
                <th className="pb-3 px-3 text-center">Skor</th>
                <th className="pb-3 px-3">Tingkat</th>
                <th className="pb-3 px-3">Rencana Mitigasi</th>
                <th className="pb-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {risks.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-blue-600 whitespace-nowrap">
                    {r.riskCode}
                  </td>
                  <td className="py-3 px-3 text-slate-900 max-w-xs">
                    <span className="font-bold block">{r.title}</span>
                    <span className="text-[11px] text-slate-500 line-clamp-1">{r.description}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{r.category}</td>
                  <td className="py-3 px-3 text-center font-bold">{r.probability}</td>
                  <td className="py-3 px-3 text-center font-bold">{r.impact}</td>
                  <td className="py-3 px-3 text-center font-extrabold text-blue-700">{r.riskScore}</td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <Badge
                      variant={
                        r.severity === "Critical"
                          ? "danger"
                          : r.severity === "High"
                          ? "warning"
                          : r.severity === "Medium"
                          ? "primary"
                          : "success"
                      }
                    >
                      {r.severity}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-slate-700 max-w-sm text-[11px]">
                    {r.mitigationPlan || "Mitigasi sedang disusun"}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <Badge variant="outline">{r.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Risk */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Identifikasi Risiko Baru"
        description="Catat risiko potensial terhadap jadwal, anggaran, atau kualitas."
      >
        <form onSubmit={handleCreateRisk} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-xs">{errorMsg}</div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Judul Risiko *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Keterlambatan verifikasi API SatuSehat"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Penyebab</label>
            <textarea
              rows={2}
              placeholder="Jelaskan faktor pemicu risiko..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50"
              >
                <option value="Teknis">Teknis</option>
                <option value="Manajemen">Manajemen</option>
                <option value="Sumber Daya">Sumber Daya</option>
                <option value="Eksternal">Eksternal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Probabilitas (1-5)</label>
              <select
                value={prob}
                onChange={(e) => setProb(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50"
              >
                <option value={1}>1. Sangat Rendah</option>
                <option value={2}>2. Rendah</option>
                <option value={3}>3. Sedang</option>
                <option value={4}>4. Tinggi</option>
                <option value={5}>5. Sangat Tinggi</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dampak (1-5)</label>
              <select
                value={impact}
                onChange={(e) => setImpact(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50"
              >
                <option value={1}>1. Sangat Kecil</option>
                <option value={2}>2. Kecil</option>
                <option value={3}>3. Moderat</option>
                <option value={4}>4. Besar</option>
                <option value={5}>5. Kritis</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rencana Mitigasi</label>
            <textarea
              rows={2}
              placeholder="Tindakan pencegahan atau rencana kontingensi..."
              value={mitigation}
              onChange={(e) => setMitigation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
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
              {submitting ? "Menyimpan..." : "Simpan Risiko"}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

