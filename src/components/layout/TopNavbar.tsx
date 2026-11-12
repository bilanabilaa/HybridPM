"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  User,
  LogOut,
  ChevronDown,
  Calendar as CalendarIcon,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

interface TopNavbarProps {
  user?: {
    name: string;
    email: string;
    role: string;
    roleLabel?: string;
  } | null;
  breadcrumbs?: { label: string; href?: string }[];
}

export function TopNavbar({ user, breadcrumbs = [] }: TopNavbarProps) {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const todayStr = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-6 flex items-center justify-between shadow-xs">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
          HybridPM
        </Link>
        {breadcrumbs.map((b, i) => (
          <React.Fragment key={i}>
            <span>/</span>
            {b.href ? (
              <Link href={b.href} className="hover:text-blue-600 transition-colors">
                {b.label}
              </Link>
            ) : (
              <span className="font-semibold text-slate-800">{b.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
          <span>{todayStr}</span>
        </div>

        {/* Global Search Bar */}
        <div className="relative hidden lg:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari tugas, proyek, dokumen..."
            className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs w-60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors relative"
            title="Notifikasi"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
          </button>

          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-40">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800">Notifikasi</span>
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                  3 Baru
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                <div className="p-3 hover:bg-slate-50 transition-colors">
                  <p className="text-xs font-semibold text-slate-800">Gate 4 Menunggu Persetujuan</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">PM telah mengajukan Gate 4 ke Owner.</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">15 menit lalu</span>
                </div>
                <div className="p-3 hover:bg-slate-50 transition-colors">
                  <p className="text-xs font-semibold text-slate-800">Tugas Baru Diberikan</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Anda ditugaskan pada modul Farmasi.</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">1 jam lalu</span>
                </div>
                <div className="p-3 hover:bg-slate-50 transition-colors">
                  <p className="text-xs font-semibold text-slate-800">Risko Tinggi Teridentifikasi</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">RSK-001 Bridging BPJS perlu mitigasi.</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">2 jam lalu</span>
                </div>
              </div>
              <div className="p-2 border-t border-slate-100 text-center">
                <Link
                  href="/communication"
                  onClick={() => setShowNotificationMenu(false)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Lihat Semua Notifikasi
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-xs font-bold text-slate-800 truncate max-w-[120px]">
                {user?.name || "Pengguna"}
              </span>
              <span className="block text-[10px] text-blue-600 font-semibold uppercase">
                {user?.roleLabel || user?.role || "Member"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-40">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                  Role: {user?.roleLabel || user?.role}
                </span>
              </div>

              <Link
                href="/profile"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>Profil Saya</span>
              </Link>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>{isLoggingOut ? "Keluar..." : "Keluar dari Sistem"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

