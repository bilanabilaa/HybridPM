"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Layers, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const qEmail = searchParams.get("email");
    if (qEmail) setEmail(qEmail);
  }, [searchParams]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal masuk");
      }

      const destination = searchParams.get("from") || "/dashboard";
      router.push(destination);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat masuk");
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
    setError(null);
    setLoading(true);

    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: demoEmail, password: "Password123!" }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login gagal");
        router.push("/dashboard");
        router.refresh();
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
      {error && (
        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300">
            Alamat Email
          </label>
          <div className="mt-1 relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@hybridpm.local"
              className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-300">
              Kata Sandi
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Lupa sandi?
            </Link>
          </div>
          <div className="mt-1 relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition-all shadow-md shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? "Memproses..." : "Masuk"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Quick Demo Login Buttons */}
      <div className="mt-6 pt-6 border-t border-slate-700">
        <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider mb-3">
          Masuk Cepat Akun Demo (1-Klik)
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickLogin("owner@hybridpm.local")}
            className="p-2 bg-slate-900/60 hover:bg-blue-900/40 border border-slate-700 hover:border-blue-500 text-slate-200 rounded-lg font-medium transition-all text-left flex items-center justify-between"
          >
            <span>👑 Owner</span>
            <span className="text-[10px] text-blue-400">Masuk</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("pm@hybridpm.local")}
            className="p-2 bg-slate-900/60 hover:bg-blue-900/40 border border-slate-700 hover:border-blue-500 text-slate-200 rounded-lg font-medium transition-all text-left flex items-center justify-between"
          >
            <span>📋 Project Manager</span>
            <span className="text-[10px] text-blue-400">Masuk</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("member@hybridpm.local")}
            className="p-2 bg-slate-900/60 hover:bg-blue-900/40 border border-slate-700 hover:border-blue-500 text-slate-200 rounded-lg font-medium transition-all text-left flex items-center justify-between"
          >
            <span>💻 Anggota Tim</span>
            <span className="text-[10px] text-blue-400">Masuk</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("stakeholder@hybridpm.local")}
            className="p-2 bg-slate-900/60 hover:bg-blue-900/40 border border-slate-700 hover:border-blue-500 text-slate-200 rounded-lg font-medium transition-all text-left flex items-center justify-between"
          >
            <span>🏥 Stakeholder</span>
            <span className="text-[10px] text-blue-400">Masuk</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("admin@hybridpm.local")}
            className="col-span-2 p-2 bg-slate-900/60 hover:bg-amber-950/40 border border-slate-700 hover:border-amber-500 text-amber-200 rounded-lg font-medium transition-all text-left flex items-center justify-between"
          >
            <span>⚙️ System Administrator</span>
            <span className="text-[10px] text-amber-400">Masuk</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Layers className="w-6 h-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-white">
            Hybrid<span className="text-blue-400">PM</span>
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
          Masuk ke Akun Anda
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Sistem Informasi Manajemen Proyek Hybrid Waterfall × Kanban
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="text-white text-center p-8">Memuat form login...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}


