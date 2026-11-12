import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HybridPM — Hybrid Project Management System",
  description:
    "Sistem Informasi Manajemen Proyek Terpadu Berbasis Metodologi Waterfall dan Kanban",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-[#F8FAFC] text-[#0F172A] min-h-screen">{children}</body>
    </html>
  );
}

