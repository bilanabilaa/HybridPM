# HybridPM — Hybrid Project Management System

**HybridPM** adalah Sistem Informasi Manajemen Proyek berbasis web yang mengintegrasikan metodologi **Waterfall** (untuk perencanaan terstruktur, gate approval bertingkat, WBS, anggaran, dan manajemen risiko) dan **Kanban** (untuk eksekusi harian tim, pembatasan Work-in-Progress / WIP limits, dan quality gates).

---

## 🌟 Fitur Utama

1. **Autentikasi & Role-Based Access Control (RBAC)**
   - Mendukung 5 peran pengguna: **Owner**, **Project Manager (PM)**, **Anggota Tim (Member)**, **Stakeholder**, dan **Admin**.
   - Hak akses ditegakkan di level API dan Middleware, bukan sekadar menyembunyikan tombol UI.

2. **Manajemen Siklus Hidup Waterfall (7 Fase & Gate Approval)**
   - Inisiasi & Perencanaan (Gate 1)
   - Analisis Kebutuhan (Gate 2)
   - Desain Sistem (Gate 3)
   - Implementasi (Gate 4)
   - Pengujian (Gate 5)
   - UAT, Deployment & Pelatihan (Gate 6)
   - Penutupan Proyek & Pemeliharaan (Gate 7)
   - Gate Approval berurutan dengan tanda tangan digital & persetujuan berjenjang dari Owner.

3. **Papan Kanban Interaktif & Quality Gate**
   - 6 kolom status: *Backlog*, *Analisis*, *Develop* (WIP max 4), *Review* (WIP max 3), *Test* (WIP max 3), *Done*.
   - Penegakan WIP Limit di sisi backend.
   - Quality Gate untuk transisi ke status *Done* (Code Review lulus, Pengujian lulus, Demo terverifikasi).

4. **Timeline, WBS & Matriks RACI**
   - Hierarki Work Breakdown Structure (WBS).
   - Penugasan RACI (Responsible, Accountable, Consulted, Informed) pada setiap work package.
   - Visualisasi Gantt Chart dan Milestones.

5. **Manajemen Risiko (5×5 Matrix)**
   - Matriks Probabilitas × Dampak (Skor 1 - 25).
   - Kategori keparahan: Low, Medium, High, Critical.
   - Rencana mitigasi dan tindakan penanganan.

6. **Change Request (CR)**
   - Pengajuan perubahan scope, jadwal, atau anggaran oleh PM/Tim.
   - Evaluasi dampak biaya & jadwal.
   - Keputusan persetujuan oleh Owner / PM dengan audit trail.

7. **Manajemen Anggaran & EVM (Earned Value Management)**
   - Rincian biaya SDM, Non-SDM, Kontingensi (10%), dan PPN (11%).
   - Pembagian termin pembayaran.
   - Metrik EVM dinamis: PV, EV, AC, CV, SV, CPI, SPI.

8. **Keputusan Metodologi Proyek (15 Kriteria)**
   - Kuesioner penilaian otomatis 15 kriteria karakteristik proyek.
   - Rekomendasi pembobotan apakah proyek lebih cocok menggunakan Waterfall, Kanban, atau Hybrid.

9. **Pusat Dokumen & Versi**
   - Pengunggahan dokumen per fase.
   - Manajemen riwayat versi dokumen.

10. **Laporan, Analisis & Audit Trail**
    - Grafik pergerakan proyek & anggaran.
    - Ekspor laporan ke CSV.
    - Catatan riwayat audit (Audit Log) lengkap untuk semua aksi penting.

---

## 👥 Akun Demo & Kredensial

Semua akun menggunakan kata sandi bawaan: **`Password123!`**

| Peran (Role) | Email | Nama | Tanggung Jawab Utama |
| :--- | :--- | :--- | :--- |
| **Owner** | `owner@hybridpm.local` | Budi Santoso | Persetujuan strategis, persetujuan Gate & CR, pantau anggaran |
| **Project Manager** | `pm@hybridpm.local` | Siti Rahmawati | Pengelolaan proyek, WBS, jadwal, tugas Kanban, pengajuan Gate |
| **Anggota Tim** | `member@hybridpm.local` | Ahmad Fauzi | Eksekusi tugas harian, update status Kanban, catatan pekerjaan |
| **Stakeholder** | `stakeholder@hybridpm.local` | Hendra Wijaya | Tinjauan progres, milestone, dan dokumen publik |
| **Admin** | `admin@hybridpm.local` | Administrator | Manajemen akun pengguna, master data, dan audit log sistem |

> **Fitur Quick Login**: Anda juga dapat memilih peran langsung di halaman `/login` dengan satu kali klik.

---

## 🛠️ Arsitektur & Teknologi

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts
- **Backend**: Next.js Route Handlers & Server Actions, Zod Validation, Jose (JWT), BcryptJS
- **Database & ORM**: SQLite, Prisma ORM (31 models terelasi lengkap)
- **Desain UI**: Modern Corporate Project Management Dashboard (Navy `#172554` & Blue `#2563EB`)

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Prasyarat
- Node.js versi 18+ (disarankan Node.js 20+)
- NPM versi 9+

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Setup Database & Seeding
Database SQLite lokal sudah disediakan di `prisma/dev.db`. Jika ingin mengulang migrasi dan seeding data demo:
```bash
npx prisma generate
node prisma/seed.js
```

### 4. Menjalankan Server Development
```bash
npm run dev
```
Buka browser dan akses: **[http://localhost:3000](http://localhost:3000)**

### 5. Build untuk Produksi
```bash
npm run build
npm run start
```

