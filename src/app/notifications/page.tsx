"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Bell,
  BellOff,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Link as LinkIcon,
  RefreshCw,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  info: {
    icon: <Info className="w-4 h-4" />,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
  },
  success: {
    icon: <CheckCircle className="w-4 h-4" />,
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
  },
  danger: {
    icon: <XCircle className="w-4 h-4" />,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
  },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingAll(false);
    }
  }

  const filtered =
    filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2">
              <Bell className="w-7 h-7 text-blue-600" />
              Notifikasi
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              {unreadCount > 0
                ? `${unreadCount} notifikasi belum dibaca`
                : "Semua notifikasi sudah dibaca"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchNotifications}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={markingAll}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-200 hover:border-blue-400 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4" />
                {markingAll ? "Memproses..." : "Tandai Semua Dibaca"}
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
          {[
            { key: "all", label: "Semua" },
            { key: "unread", label: `Belum Dibaca (${unreadCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as "all" | "unread")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === tab.key
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<BellOff className="w-10 h-10 text-slate-400" />}
            title={filter === "unread" ? "Tidak ada notifikasi yang belum dibaca" : "Belum ada notifikasi"}
            description={
              filter === "unread"
                ? "Semua notifikasi sudah Anda baca."
                : "Notifikasi akan muncul di sini saat ada aktivitas proyek yang relevan."
            }
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((notif) => {
              const typeConf = TYPE_CONFIG[notif.type] || TYPE_CONFIG["info"];
              return (
                <div
                  key={notif.id}
                  className={`bg-white rounded-xl border p-4 flex gap-4 transition-all ${
                    notif.isRead
                      ? "border-slate-200 opacity-80"
                      : "border-blue-200 shadow-sm shadow-blue-50"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-full border flex items-center justify-center flex-shrink-0 ${typeConf.bg} ${typeConf.color}`}
                  >
                    {typeConf.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            notif.isRead ? "text-slate-600" : "text-slate-800"
                          }`}
                        >
                          {notif.title}
                          {!notif.isRead && (
                            <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block" />
                          )}
                        </p>
                        <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        {notif.link && (
                          <Link
                            href={notif.link}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1"
                          >
                            <LinkIcon className="w-3 h-3" />
                            Lihat Detail
                          </Link>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {formatDateTime(notif.createdAt)}
                        </span>
                        {!notif.isRead && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Tandai dibaca
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

