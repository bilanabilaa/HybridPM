"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRupiah, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Users,
  Calendar,
  Layers,
  TrendingUp,
} from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    async function loadProjects() {
      try {
        let url = "/api/projects";
        const params = new URLSearchParams();
        if (statusFilter !== "ALL") params.append("status", statusFilter);
        if (search) params.append("search", search);
        if (params.toString()) url += `?${params.toString()}`;

        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          setProjects(json.projects || []);
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [search, statusFilter]);

  return (
    <AppLayout breadcrumbs={[{ label: "Daftar Proyek" }]}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Proyek</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola portofolio proyek terpadu dengan siklus Waterfall dan papan Kanban.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Proyek Baru</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari kode atau nama proyek..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="Active">Active</option>
            <option value="Planning">Planning</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Project Cards List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">Memuat proyek...</div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="Belum Ada Proyek"
          description="Tidak ada proyek yang sesuai dengan kriteria pencarian atau filter yang dipilih."
          actionText="Buat Proyek Baru"
          onAction={() => (window.location.href = "/projects/new")}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {p.projectCode}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={
                        p.status === "Active"
                          ? "success"
                          : p.status === "Completed"
                          ? "primary"
                          : "default"
                      }
                    >
                      {p.status}
                    </Badge>
                    <Badge variant="outline">{p.methodology}</Badge>
                  </div>
                </div>

                <Link
                  href={`/projects/${p.id}`}
                  className="font-bold text-base text-slate-900 hover:text-blue-600 transition-colors block line-clamp-2"
                >
                  {p.name}
                </Link>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{p.description}</p>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600">Progres Keseluruhan</span>
                    <span className="text-blue-600 font-bold">{p.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, p.progress))}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Pagu Anggaran</span>
                    <span className="font-bold text-slate-800">{formatRupiah(p.budget)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Target Selesai</span>
                    <span className="font-semibold text-slate-700">{formatDate(p.targetDate)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Users className="w-3.5 h-3.5" />
                  <span>PM: {p.manager?.name}</span>
                </div>
                <Link
                  href={`/projects/${p.id}`}
                  className="font-bold text-blue-600 hover:text-blue-700"
                >
                  Buka Proyek →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

