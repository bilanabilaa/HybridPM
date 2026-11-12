"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { ShieldAlert, UserPlus, Users, CheckCircle2, Lock, Mail, Phone } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New user modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password123!");
  const [roleId, setRoleId] = useState("");
  const [division, setDivision] = useState("Divisi Pengembangan");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const json = await res.json();
        setUsers(json.users || []);
        setRoles(json.roles || []);
        if (json.roles?.length > 0 && !roleId) {
          setRoleId(json.roles[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          roleId,
          division,
          phone,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat pengguna");

      setShowModal(false);
      setName("");
      setEmail("");
      setPhone("");
      await loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout breadcrumbs={[{ label: "Kelola Pengguna Sistem" }]}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Manajemen Pengguna & Otorisasi RBAC</h1>
            <Badge variant="primary">Administrator Privileged</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi akun personil proyek, penugasan hak akses role (Owner, PM, Member, Stakeholder, Admin), dan status akun.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
        >
          <UserPlus className="w-4 h-4" />
          <span>Buat Akun Pengguna Baru</span>
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="pb-3 px-3">Nama Lengkap</th>
                <th className="pb-3 px-3">Email Pengguna</th>
                <th className="pb-3 px-3">Role Otorisasi</th>
                <th className="pb-3 px-3">Divisi Unit Kerja</th>
                <th className="pb-3 px-3">Kontak</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Terdaftar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900">{u.name}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{u.email}</td>
                  <td className="py-3 px-3">
                    <Badge variant="primary">{u.role?.label || u.role?.name}</Badge>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{u.division || "-"}</td>
                  <td className="py-3 px-3 text-slate-500">{u.phone || "-"}</td>
                  <td className="py-3 px-3">
                    <Badge variant={u.isActive ? "success" : "danger"}>
                      {u.isActive ? "Aktif" : "Non-Aktif"}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                    {formatDate(u.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add User */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Buat Akun Pengguna Baru"
        description="Pengguna baru akan otomatis mendapatkan otorisasi RBAC sesuai peran yang dipilih."
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-xs">{errorMsg}</div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Ir. Muhammad Ridwan, M.Kom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Akun *</label>
              <input
                type="email"
                required
                placeholder="nama@hybridpm.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi Awal *</label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Role Otorisasi RBAC *</label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label} ({r.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Divisi / Unit Kerja</label>
              <input
                type="text"
                placeholder="Contoh: Divisi Pengembangan"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
            <input
              type="text"
              placeholder="08123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
              {submitting ? "Membuat Akun..." : "Buat Akun Pengguna"}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

