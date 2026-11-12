"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { User, Mail, Shield, Phone, Building, Calendar, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const json = await res.json();
          setUser(json.user);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMe();
  }, []);

  if (loading) {
    return (
      <AppLayout breadcrumbs={[{ label: "Profil Saya" }]}>
        <div className="py-20 text-center text-slate-400 text-sm">Memuat profil pengguna...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={[{ label: "Profil Saya" }]}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Profil Pengguna</h1>
          <p className="text-xs text-slate-500 mt-1">
            Informasi identitas akun dan hak akses otorisasi sistem Anda.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-2xl shadow-md shadow-blue-500/20">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="primary">{user?.roleLabel || user?.role}</Badge>
                <Badge variant="success">Akun Aktif</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                Role Otorisasi
              </span>
              <p className="font-bold text-slate-800 text-sm">{user?.roleLabel || user?.role}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
                <Building className="w-3.5 h-3.5 text-blue-600" />
                Divisi / Unit Kerja
              </span>
              <p className="font-bold text-slate-800 text-sm">{user?.division || "PMO"}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                Alamat Email Resmi
              </span>
              <p className="font-bold text-slate-800 text-sm font-mono">{user?.email}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                Nomor Kontak
              </span>
              <p className="font-bold text-slate-800 text-sm">{user?.phone || "081234567800"}</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

