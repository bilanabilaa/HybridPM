"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatDateTime } from "@/lib/utils";
import { History, Search, ShieldCheck, Activity, Filter } from "lucide-react";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("ALL");
  const [filterEntity, setFilterEntity] = useState("ALL");

  const loadLogs = async () => {
    try {
      let url = "/api/admin/audit-logs";
      const params = new URLSearchParams();
      if (filterAction !== "ALL") params.append("action", filterAction);
      if (filterEntity !== "ALL") params.append("entityType", filterEntity);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filterAction, filterEntity]);

  return (
    <AppLayout breadcrumbs={[{ label: "Audit Log & Keamanan" }]}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Audit Log Transaksi Sistem</h1>
            <Badge variant="primary">ISO 27001 Audit Trail</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan menyeluruh setiap aktivitas pengguna, perubahan data, stempel persetujuan Gate, dan autentikasi.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none"
          >
            <option value="ALL">Semua Aksi</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="GATE_APPROVE">GATE APPROVE</option>
            <option value="GATE_SUBMIT">GATE SUBMIT</option>
            <option value="GATE_REJECT">GATE REJECT</option>
            <option value="PROJECT_CREATE">PROJECT CREATE</option>
            <option value="TASK_CREATE">TASK CREATE</option>
            <option value="TASK_UPDATE">TASK UPDATE</option>
            <option value="EXPENSE_CREATE">EXPENSE CREATE</option>
          </select>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="pb-3 px-3">Waktu Transaksi</th>
                <th className="pb-3 px-3">Pelaku (User)</th>
                <th className="pb-3 px-3">Jenis Aksi</th>
                <th className="pb-3 px-3">Entitas</th>
                <th className="pb-3 px-3">Rincian Perubahan / Payload</th>
                <th className="pb-3 px-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 font-sans">
                    {log.user?.name || "System"}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action.includes("APPROVE")
                          ? "bg-emerald-100 text-emerald-800"
                          : log.action.includes("REJECT")
                          ? "bg-rose-100 text-rose-800"
                          : log.action.includes("CREATE")
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-sans">{log.entityType}</td>
                  <td className="py-3 px-3 text-slate-700 max-w-md font-sans text-xs break-words">
                    {log.details || "-"}
                  </td>
                  <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                    {log.ipAddress || "127.0.0.1"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

