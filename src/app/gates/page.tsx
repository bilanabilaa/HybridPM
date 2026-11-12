"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  FileCheck2,
  XCircle,
  Key,
} from "lucide-react";

export default function GateApprovalPage() {
  const [gates, setGates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Approval / Rejection modal
  const [activeGate, setActiveGate] = useState<any>(null);
  const [modalAction, setModalAction] = useState<"SUBMIT" | "APPROVE" | "REJECT">("APPROVE");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadData = async () => {
    try {
      const [uRes, gRes] = await fetch("/api/auth/me").then((r) => r.json()).then(async (u) => [u, await fetch("/api/gates").then((r) => r.json())]);
      setCurrentUser(uRes.user);
      setGates(gRes.gates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGate) return;
    setProcessing(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/gates/${activeGate.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: modalAction,
          notes: decisionNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memproses Gate");

      setStatusMessage({ type: "success", text: json.message || "Operasi Gate berhasil!" });
      setActiveGate(null);
      setDecisionNotes("");
      await loadData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const isOwner = currentUser?.role === "OWNER" || currentUser?.role === "ADMIN";
  const isPM = currentUser?.role === "PM" || currentUser?.role === "ADMIN";

  return (
    <AppLayout breadcrumbs={[{ label: "Gate Approval" }]}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Modul Gate Approval Terpadu</h1>
            <Badge variant="primary">Waterfall Lifecycle Governance</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengendalian persetujuan antar fase sekuensial. Gerbang berikutnya terkunci hingga Gate sebelumnya disetujui Owner.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`mb-6 p-4 rounded-xl border text-xs flex items-center justify-between ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="font-bold text-slate-500 hover:text-slate-800"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Gates Sequence List */}
      <div className="space-y-4">
        {gates.map((g) => {
          const isApproved = g.status === "Approved";
          const isPending = g.status === "Pending Approval";
          const isRevision = g.status === "Revision Required";

          return (
            <div
              key={g.id}
              className={`p-6 rounded-2xl border transition-all bg-white shadow-xs ${
                isApproved
                  ? "border-emerald-200 hover:border-emerald-300"
                  : isPending
                  ? "border-amber-300 ring-2 ring-amber-100"
                  : isRevision
                  ? "border-rose-200"
                  : "border-slate-200 opacity-80"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-sm flex-shrink-0 ${
                      isApproved
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : isPending
                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                        : isRevision
                        ? "bg-rose-100 text-rose-700 border border-rose-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}
                  >
                    G{g.gateNumber}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        {g.project?.name}
                      </span>
                      <Badge
                        variant={
                          isApproved
                            ? "success"
                            : isPending
                            ? "warning"
                            : isRevision
                            ? "danger"
                            : "default"
                        }
                      >
                        {g.status}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{g.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Fase Terkait: <span className="font-semibold text-slate-700">{g.phase?.name}</span>
                    </p>
                  </div>
                </div>

                {/* Actions Button Group */}
                <div className="flex items-center gap-2">
                  {/* PM Action: Submit */}
                  {isPM && (g.status === "Not Submitted" || g.status === "Revision Required") && (
                    <button
                      onClick={() => {
                        setActiveGate(g);
                        setModalAction("SUBMIT");
                        setDecisionNotes("");
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                    >
                      Ajukan ke Owner
                    </button>
                  )}

                  {/* Owner Actions: Approve / Reject */}
                  {isOwner && isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveGate(g);
                          setModalAction("REJECT");
                          setDecisionNotes("");
                        }}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors"
                      >
                        Minta Revisi
                      </button>
                      <button
                        onClick={() => {
                          setActiveGate(g);
                          setModalAction("APPROVE");
                          setDecisionNotes("Seluruh deliverable dan kriteria fase telah diverifikasi memenuhi standar.");
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Setujui & Tanda Tangani</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Criteria & Decision Notes */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700 block mb-1">Kriteria Verifikasi Gate:</span>
                  <p className="text-slate-600 leading-relaxed">{g.criteria}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700 block mb-1">Catatan Keputusan / Evaluasi:</span>
                  <p className="text-slate-600 leading-relaxed">
                    {g.decisionNotes || "Belum ada catatan evaluasi formal."}
                  </p>
                </div>
              </div>

              {/* Digital Signature Audit Stamp */}
              {isApproved && g.approvals?.[0] && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      Disetujui secara digital oleh:{" "}
                      <strong className="text-slate-800">{g.approvals[0].approver?.name}</strong> pada{" "}
                      {formatDate(g.approvals[0].decidedAt)}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                    Token: {g.approvals[0].signatureToken || "SIG-VERIFIED"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Decision Modal */}
      <Modal
        isOpen={!!activeGate}
        onClose={() => setActiveGate(null)}
        title={
          modalAction === "SUBMIT"
            ? `Pengajuan ${activeGate?.name}`
            : modalAction === "APPROVE"
            ? `Persetujuan Resmi ${activeGate?.name}`
            : `Pengembalian Revisi ${activeGate?.name}`
        }
        description={
          modalAction === "SUBMIT"
            ? "Pastikan seluruh deliverable fase telah lengkap sebelum diajukan ke Project Owner."
            : modalAction === "APPROVE"
            ? "Konfirmasi persetujuan ini akan mengesahkan fase terkait dan mengizinkan fase berikutnya dimulai."
            : "Tuliskan alasan penolakan dan poin revisi yang wajib dilengkapi oleh PM."
        }
      >
        <form onSubmit={handleAction} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Keputusan / Evaluasi *
            </label>
            <textarea
              rows={4}
              required={modalAction === "REJECT"}
              placeholder="Tuliskan catatan evaluasi atau alasan keputusan..."
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {modalAction === "APPROVE" && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
              <Key className="w-4 h-4 flex-shrink-0 text-blue-600" />
              <span>
                Persetujuan akan dibubuhi stempel digital terenkripsi beserta nama, waktu, dan audit log sah.
              </span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveGate(null)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={processing}
              className={`px-5 py-2 rounded-lg text-xs font-bold text-white transition-all shadow-xs ${
                modalAction === "APPROVE"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : modalAction === "REJECT"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {processing
                ? "Memproses..."
                : modalAction === "APPROVE"
                ? "Bubuhkan Persetujuan Resmi"
                : modalAction === "REJECT"
                ? "Kirim Catatan Revisi"
                : "Kirim Pengajuan"}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

