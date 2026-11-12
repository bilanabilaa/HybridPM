"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Columns,
  Calendar,
  ShieldCheck,
  Users,
  AlertTriangle,
  MessageSquare,
  FileText,
  BarChart3,
  HelpCircle,
  Settings,
  ShieldAlert,
  History,
  Layers,
  GitPullRequest,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userRole?: string;
  userName?: string;
  roleLabel?: string;
}

export function Sidebar({ userRole = "MEMBER", userName, roleLabel }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Proyek", href: "/projects", icon: FolderKanban },
    { name: "Tugas Saya", href: "/my-tasks", icon: CheckSquare },
    { name: "Papan Kanban", href: "/kanban", icon: Columns },
    { name: "Timeline & WBS", href: "/timeline", icon: Calendar },
    {
      name: "Gate Approval",
      href: "/gates",
      icon: ShieldCheck,
      hidden: userRole === "MEMBER" || userRole === "STAKEHOLDER",
    },
    { name: "Change Request", href: "/change-requests", icon: GitPullRequest },
    { name: "Manajemen Tim", href: "/team", icon: Users },
    { name: "Manajemen Risiko", href: "/risks", icon: AlertTriangle },
    { name: "Komunikasi", href: "/communication", icon: MessageSquare },
    { name: "Dokumen", href: "/documents", icon: FileText },
    { name: "Laporan & Analisis", href: "/reports", icon: BarChart3 },
    { name: "Keputusan Metodologi", href: "/methodology", icon: HelpCircle },
    { name: "Notifikasi", href: "/notifications", icon: Bell },
  ];

  const adminNavigation = [
    { name: "Kelola Pengguna", href: "/admin/users", icon: ShieldAlert },
    { name: "Audit Log", href: "/admin/audit-logs", icon: History },
  ];

  return (
    <aside className="w-64 bg-[#172554] text-white flex flex-col flex-shrink-0 h-screen sticky top-0 border-r border-blue-950">
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-blue-900/60 bg-navy-950">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight text-white block leading-tight">
            Hybrid<span className="text-blue-400">PM</span>
          </span>
          <span className="text-[10px] text-blue-200/70 font-medium tracking-wider uppercase block">
            Waterfall × Kanban
          </span>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-blue-300/60">
          Navigasi Utama
        </div>
        {navigation
          .filter((item) => !item.hidden)
          .map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-blue-100/80 hover:text-white hover:bg-white/10"
                )}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-white" : "text-blue-300 group-hover:text-white"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}

        {/* Admin Navigation */}
        {userRole === "ADMIN" && (
          <div className="pt-4 mt-4 border-t border-blue-900/40">
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">
              Administrasi Sistem
            </div>
            {adminNavigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                    isActive
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-amber-100/80 hover:text-white hover:bg-white/10"
                  )}
                >
                  <item.icon className="w-4 h-4 text-amber-300 group-hover:text-white" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Settings */}
        <div className="pt-4 mt-4 border-t border-blue-900/40">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
              pathname === "/settings"
                ? "bg-blue-600 text-white"
                : "text-blue-100/80 hover:text-white hover:bg-white/10"
            )}
          >
            <Settings className="w-4 h-4 text-blue-300 group-hover:text-white" />
            <span>Pengaturan</span>
          </Link>
        </div>
      </div>

      {/* User Info Footer */}
      <div className="p-4 border-t border-blue-900/60 bg-blue-950/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center justify-center font-bold text-sm">
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{userName || "Pengguna"}</p>
            <p className="text-[11px] text-blue-300/80 truncate">{roleLabel || userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

