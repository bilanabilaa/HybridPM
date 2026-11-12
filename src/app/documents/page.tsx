"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { FileText, Plus, Upload, Download, History, CheckCircle2, FileCheck2 } from "lucide-react";

export default function DocumentManagementPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [loading, setLoading] = useState(true);

  // Upload modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("SRS");
  const [fileName, setFileName] = useState("");
  const [versionNumber, setVersionNumber] = useState("1.0");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Version history modal
  const [viewDoc, setViewDoc] = useState<any>(null);

  const loadDocs = async () => {
    try {
      const [pRes, dRes] = await Promise.all([
        fetch("/api/projects").then((r) => r.json()),
        fetch(`/api/documents${selectedProjectId ? `?projectId=${selectedProjectId}` : ""}`).then((r) =>
          r.json()
        ),
      ]);
      setProjects(pRes.projects || []);
      setDocuments(dRes.documents || []);
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
    loadDocs();
  }, [selectedProjectId]);

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          title,
          category,
          fileName: fileName || `${title.replace(/\s+/g, "_")}_v${versionNumber}.pdf`,
          fileUrl: `/uploads/${fileName || "doc.pdf"}`,
          versionNumber,
          notes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setTitle("");
        setFileName("");
        setNotes("");
        await loadDocs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout breadcrumbs={[{ label: "Manajemen Dokumen & Versi" }]}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Repositori Dokumen & Versioning</h1>
            <Badge variant="primary">Multi-Version Archive</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan dokumen resmi proyek, pelacakan riwayat versi berkas, dan status legalitas persetujuan.
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
            <Upload className="w-4 h-4" />
            <span>Unggah / Revisi Dokumen</span>
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-400 transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <Badge variant="outline">{doc.category}</Badge>
                <Badge variant={doc.status === "Approved" ? "success" : "default"}>
                  {doc.status}
                </Badge>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{doc.title}</h3>
                  <span className="text-xs font-bold text-blue-600 block mt-0.5">
                    Versi Terkini: v{doc.currentVersion}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <p>Diunggah oleh: <strong className="text-slate-800">{doc.uploadedBy?.name}</strong></p>
                <p>Pembaruan: {formatDate(doc.updatedAt)}</p>
                <p>Riwayat Versi: {doc.versions?.length || 1} Arsip Berkas</p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => setViewDoc(doc)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <History className="w-3.5 h-3.5" />
                <span>Lihat Versi ({doc.versions?.length || 1})</span>
              </button>

              <a
                href={doc.versions?.[0]?.fileUrl || "#"}
                download
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Unduh</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Version History Modal */}
      <Modal
        isOpen={!!viewDoc}
        onClose={() => setViewDoc(null)}
        title={viewDoc ? `Riwayat Versi Dokumen: ${viewDoc.title}` : ""}
        description="HybridPM tidak pernah menimpa berkas lama; seluruh riwayat revisi disimpan permanen."
      >
        <div className="space-y-3">
          {viewDoc?.versions?.map((ver: any) => (
            <div
              key={ver.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-slate-900 block">
                  Versi {ver.versionNumber} — {ver.fileName}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Catatan: {ver.notes || "Pembaruan rutin"}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Diunggah: {formatDate(ver.uploadedAt)}
                </span>
              </div>

              <a
                href={ver.fileUrl}
                download
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-blue-50 text-blue-600 font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh v{ver.versionNumber}</span>
              </a>
            </div>
          ))}
        </div>
      </Modal>

      {/* Upload Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Unggah Dokumen / Rilis Versi Revisi"
        description="Unggah dokumen proyek baru atau revisi versi dari dokumen yang sudah ada."
      >
        <form onSubmit={handleUploadDoc} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Judul Dokumen *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Spesifikasi Kebutuhan Perangkat Lunak (SRS)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Dokumen *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50"
              >
                <option value="Project Charter">Project Charter</option>
                <option value="Scope Document">Scope Document</option>
                <option value="Project Plan">Project Plan</option>
                <option value="SRS">Spesifikasi Kebutuhan (SRS)</option>
                <option value="System Design">System Design & Arsitektur</option>
                <option value="ERD">Skema ERD Database</option>
                <option value="UI/UX Prototype">UI/UX Prototype</option>
                <option value="Testing Report">Testing Report</option>
                <option value="UAT Document">Dokumen & Skenario UAT</option>
                <option value="User Manual">Buku Panduan Pengguna</option>
                <option value="BAST">Berita Acara Serah Terima (BAST)</option>
                <option value="Other">Lain-lain</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Versi *</label>
              <input
                type="text"
                required
                placeholder="1.0 atau 1.1"
                value={versionNumber}
                onChange={(e) => setVersionNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama File Lampiran</label>
            <input
              type="text"
              placeholder="Contoh: SRS_SIMRS_Hybrid_Signed.pdf"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Revisi / Ringkasan</label>
            <textarea
              rows={2}
              placeholder="Jelaskan ringkasan perubahan pada versi ini..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
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
              {submitting ? "Mengunggah..." : "Simpan Versi Dokumen"}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

