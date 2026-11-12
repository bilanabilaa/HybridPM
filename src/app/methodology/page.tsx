"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import {
  HelpCircle,
  CheckCircle2,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";

export default function MethodologyPage() {
  const [criteria, setCriteria] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [projectName, setProjectName] = useState("SIMRS Hybrid Rumah Sakit Terpadu");
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCriteria() {
      try {
        const res = await fetch("/api/methodology");
        if (res.ok) {
          const json = await res.json();
          setCriteria(json.criteria || []);
          setAssessments(json.assessments || []);

          // Initialize default answers (option 0 or 1 for balanced hybrid)
          const initialAns: Record<string, number> = {};
          (json.criteria || []).forEach((c: any) => {
            initialAns[c.id] = 1; // Default to middle option
          });
          setAnswers(initialAns);

          if (json.assessments && json.assessments.length > 0) {
            setResult(json.assessments[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCriteria();
  }, []);

  const handleSelectOption = (critId: string, optIdx: number) => {
    setAnswers((prev) => ({ ...prev, [critId]: optIdx }));
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payloadAnswers = Object.entries(answers).map(([criterionId, optionIndex]) => ({
        criterionId,
        optionIndex,
      }));

      const res = await fetch("/api/methodology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName,
          answers: payloadAnswers,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setResult(json.assessment);
        // Refresh assessments list
        const refresh = await fetch("/api/methodology").then((r) => r.json());
        setAssessments(refresh.assessments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout breadcrumbs={[{ label: "Sistem Pendukung Keputusan Metodologi" }]}>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900">
            Sistem Pendukung Keputusan Pemilihan Metodologi
          </h1>
          <Badge variant="primary">15 Kriteria Penilaian</Badge>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Rekomendasi saintifik penentuan pendekatan Waterfall, Kanban, atau Hybrid berdasarkan karakteristik proyek.
        </p>
      </div>

      {/* Official Notice regarding 15 Criteria Draft */}
      <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Pemberitahuan Konfigurasi Kriteria:</span>
          Dokumen proyek menetapkan evaluasi komprehensif berdasarkan 15 kriteria. Daftar 15 kriteria di bawah ini merupakan rancangan awal standar industri yang dapat dikelola dan dikonfigurasi secara berkala oleh PM/Admin.
        </div>
      </div>

      {/* Recommendation Result Card (if available) */}
      {result && (
        <div className="bg-gradient-to-br from-navy-950 to-blue-950 text-white p-6 sm:p-8 rounded-2xl border border-blue-900 shadow-md mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-blue-900/60">
            <div>
              <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block">
                Hasil Rekomendasi Resmi
              </span>
              <h2 className="text-3xl font-extrabold text-white mt-1 flex items-center gap-2.5">
                <Award className="w-8 h-8 text-amber-400" />
                <span>Metodologi: {result.recommendedMethodology}</span>
              </h2>
              <p className="text-xs text-blue-200/80 mt-1">Proyek: {result.projectName}</p>
            </div>

            {/* Score Badges */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/10 backdrop-blur p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-blue-200 block uppercase">Waterfall</span>
                <span className="text-xl font-black text-white">{result.waterfallScore}%</span>
              </div>
              <div className="bg-white/10 backdrop-blur p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-blue-200 block uppercase">Kanban</span>
                <span className="text-xl font-black text-white">{result.kanbanScore}%</span>
              </div>
              <div className="bg-blue-600 p-3 rounded-xl border border-blue-400 shadow-lg shadow-blue-500/30">
                <span className="text-[10px] text-blue-100 block uppercase font-bold">Hybrid</span>
                <span className="text-xl font-black text-white">{result.hybridScore}%</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-xs text-blue-100/90 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">
            <span className="font-bold text-white block mb-1">Rasional & Landasan Keputusan:</span>
            {result.rationale}
          </div>
        </div>
      )}

      {/* 15 Criteria Questionnaire Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mb-8">
        <h2 className="font-bold text-slate-800 text-base mb-4 pb-3 border-b border-slate-100">
          Kuesioner 15 Kriteria Karakteristik Proyek
        </h2>

        <form onSubmit={handleCalculate} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Proyek yang Dinilai</label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full sm:w-96 px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-6 divide-y divide-slate-100">
            {criteria.map((c, index) => {
              let options: any[] = [];
              try {
                options = JSON.parse(c.options);
              } catch {
                options = [];
              }
              const selectedIdx = answers[c.id] ?? 0;

              return (
                <div key={c.id} className="pt-4 first:pt-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {c.code}
                    </span>
                    <h3 className="font-bold text-xs text-slate-900">{c.name}</h3>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{c.question}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {options.map((opt: any, optIdx: number) => {
                      const isSelected = selectedIdx === optIdx;
                      return (
                        <button
                          type="button"
                          key={optIdx}
                          onClick={() => handleSelectOption(c.id, optIdx)}
                          className={`p-3 rounded-xl border text-left text-xs transition-all ${
                            isSelected
                              ? "bg-blue-50 border-blue-600 text-blue-900 font-bold ring-1 ring-blue-500"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <span className="block">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              <span>{submitting ? "Mengkalkulasi..." : "Kalkulasi & Simpan Rekomendasi Metodologi"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

