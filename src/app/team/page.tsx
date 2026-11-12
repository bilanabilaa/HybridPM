"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Users, Plus, UserPlus, Mail, Phone, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function TeamManagementPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add member modal
  const [showModal, setShowModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [roleInProject, setRoleInProject] = useState("");
  const [division, setDivision] = useState("Divisi Pengembangan");
  const [submitting, setSubmitting] = useState(false);

  const loadTeam = async () => {
    try {
      const res = await fetch("/api/team");
      if (res.ok) {
        const json = await res.json();
        setMembers(json.members || []);
        setAvailableUsers(json.availableUsers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!members[0]?.projectId || !selectedUserId || !roleInProject) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: members[0].projectId,
          userId: selectedUserId,
          roleInProject,
          division,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setSelectedUserId("");
        setRoleInProject("");
        await loadTeam();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout breadcrumbs={[{ label: "Manajemen Tim & RACI" }]}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Manajemen Tim & Matriks RACI</h1>
            <Badge variant="primary">Struktur Organisasi Proyek</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Penugasan divisi, alokasi peran teknis, pemantauan beban tugas, dan akuntabilitas kerja.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Personil Tim</span>
        </button>
      </div>

      {/* Team Structure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {members.map((m) => (
          <div
            key={m.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-base border border-blue-100 shadow-xs">
                  {m.user?.name.charAt(0)}
                </div>
                <Badge variant="primary">{m.user?.role?.label || m.user?.role?.name}</Badge>
              </div>

              <h3 className="font-bold text-sm text-slate-900">{m.user?.name}</h3>
              <p className="text-xs font-bold text-blue-600 mt-0.5">{m.roleInProject}</p>
              <p className="text-[11px] text-slate-500 mt-1">Divisi: {m.division || m.user?.division}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{m.user?.email}</span>
                </div>
                {m.user?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{m.user?.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Beban Tugas:</span>
              <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {m.user?._count?.assignedTasks || 0} Tugas Ditugaskan
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Member */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Tambah Personil ke Tim Proyek"
        description="Pilih akun pengguna yang terdaftar untuk ditugaskan dalam proyek."
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pengguna Terdaftar *</label>
            <select
              required
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Pengguna...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.division || u.role?.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Peran dalam Proyek *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Senior Full-Stack Developer / System Analyst"
              value={roleInProject}
              onChange={(e) => setRoleInProject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Divisi Proyek *</label>
            <select
              value={division}
              onChange={(e) => setDivision(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50"
            >
              <option value="Steering Committee">Steering Committee</option>
              <option value="PMO">Project Management Office</option>
              <option value="Divisi Analisis dan Desain">Divisi Analisis dan Desain</option>
              <option value="Divisi Pengembangan">Divisi Pengembangan</option>
              <option value="Divisi Penjaminan Mutu">Divisi Penjaminan Mutu</option>
              <option value="Divisi Infrastruktur">Divisi Infrastruktur</option>
              <option value="Divisi Dokumentasi dan Pelatihan">Divisi Dokumentasi dan Pelatihan</option>
              <option value="Kanban Coach">Kanban Coach</option>
            </select>
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
              {submitting ? "Menyimpan..." : "Tambahkan ke Tim"}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

