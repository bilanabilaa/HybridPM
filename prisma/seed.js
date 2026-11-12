const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting HybridPM Database Seeder ---');

  // 1. Roles
  const rolesData = [
    { name: 'OWNER', label: 'Project Owner', description: 'Pemilik proyek dan pemutus keputusan strategis serta Gate' },
    { name: 'PM', label: 'Project Manager', description: 'Pengelola operasional proyek, jadwal, WBS, anggaran, dan risiko' },
    { name: 'MEMBER', label: 'Anggota Tim', description: 'Pelaksana tugas teknis dan pengembang fitur pada Kanban' },
    { name: 'STAKEHOLDER', label: 'Stakeholder', description: 'Pemangku kepentingan, pengawas kemajuan, dan pengulas hasil' },
    { name: 'ADMIN', label: 'Administrator', description: 'Pengelola sistem, akun pengguna, konfigurasi, dan audit log' },
  ];

  const roles = {};
  for (const r of rolesData) {
    roles[r.name] = await prisma.role.upsert({
      where: { name: r.name },
      update: { label: r.label, description: r.description },
      create: r,
    });
  }
  console.log('✓ Roles seeded');

  // Password for demo accounts: Password123!
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 2. Users
  const usersData = [
    {
      name: 'Ir. Budi Santoso, M.Eng',
      email: 'owner@hybridpm.local',
      password: passwordHash,
      roleId: roles.OWNER.id,
      division: 'Steering Committee',
      phone: '081234567801',
    },
    {
      name: 'Reza Pratama, PMP',
      email: 'pm@hybridpm.local',
      password: passwordHash,
      roleId: roles.PM.id,
      division: 'Project Management Office',
      phone: '081234567802',
    },
    {
      name: 'Siti Aminah, S.Kom',
      email: 'member@hybridpm.local',
      password: passwordHash,
      roleId: roles.MEMBER.id,
      division: 'Divisi Pengembangan',
      phone: '081234567803',
    },
    {
      name: 'Dimas Setiawan, S.T',
      email: 'analyst@hybridpm.local',
      password: passwordHash,
      roleId: roles.MEMBER.id,
      division: 'Divisi Analisis dan Desain',
      phone: '081234567804',
    },
    {
      name: 'Maya Putri, S.Kom',
      email: 'qa@hybridpm.local',
      password: passwordHash,
      roleId: roles.MEMBER.id,
      division: 'Divisi Penjaminan Mutu',
      phone: '081234567805',
    },
    {
      name: 'Fajar Ramadhan',
      email: 'infra@hybridpm.local',
      password: passwordHash,
      roleId: roles.MEMBER.id,
      division: 'Divisi Infrastruktur',
      phone: '081234567806',
    },
    {
      name: 'Rina Andriani, M.Kom',
      email: 'doc@hybridpm.local',
      password: passwordHash,
      roleId: roles.MEMBER.id,
      division: 'Divisi Dokumentasi dan Pelatihan',
      phone: '081234567807',
    },
    {
      name: 'Hendra Wijaya',
      email: 'coach@hybridpm.local',
      password: passwordHash,
      roleId: roles.MEMBER.id,
      division: 'Kanban Coach',
      phone: '081234567808',
    },
    {
      name: 'Dr. H. Ahmad Fauzi, MARS',
      email: 'stakeholder@hybridpm.local',
      password: passwordHash,
      roleId: roles.STAKEHOLDER.id,
      division: 'Direksi Rumah Sakit / Stakeholder',
      phone: '081234567809',
    },
    {
      name: 'System Administrator',
      email: 'admin@hybridpm.local',
      password: passwordHash,
      roleId: roles.ADMIN.id,
      division: 'IT Operations',
      phone: '081234567810',
    },
  ];

  const users = {};
  for (const u of usersData) {
    users[u.email] = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, division: u.division, phone: u.phone },
      create: u,
    });
  }
  console.log('✓ Users seeded (10 accounts including 5 primary demo roles)');

  // 3. Baseline Project
  const baselineProject = await prisma.project.upsert({
    where: { projectCode: 'PRJ-2026-001' },
    update: {},
    create: {
      projectCode: 'PRJ-2026-001',
      name: 'Pengembangan Sistem Informasi Manajemen Rumah Sakit Terpadu (SIMRS Hybrid)',
      description: 'Implementasi SIMRS terintegrasi berbasis metodologi Hybrid Waterfall-Kanban untuk mengoptimalkan pelayanan pasien, rekam medis elektronik (RME), farmasi, kasir, dan bridging BPJS SatuSehat.',
      ownerId: users['owner@hybridpm.local'].id,
      managerId: users['pm@hybridpm.local'].id,
      startDate: new Date('2026-11-02T00:00:00Z'),
      targetDate: new Date('2027-04-30T00:00:00Z'),
      budget: 956043000,
      status: 'Active',
      progress: 52,
      methodology: 'Hybrid',
      priority: 'High',
    },
  });
  console.log('✓ Baseline Project created');

  // 4. Project Members
  const projectMemberships = [
    { userId: users['pm@hybridpm.local'].id, roleInProject: 'Project Manager', division: 'PMO' },
    { userId: users['owner@hybridpm.local'].id, roleInProject: 'Project Sponsor / Owner', division: 'Steering Committee' },
    { userId: users['member@hybridpm.local'].id, roleInProject: 'Tech Lead & Senior Developer', division: 'Divisi Pengembangan' },
    { userId: users['analyst@hybridpm.local'].id, roleInProject: 'Lead System Analyst', division: 'Divisi Analisis dan Desain' },
    { userId: users['qa@hybridpm.local'].id, roleInProject: 'QA Engineer Lead', division: 'Divisi Penjaminan Mutu' },
    { userId: users['infra@hybridpm.local'].id, roleInProject: 'DevOps & SysAdmin', division: 'Divisi Infrastruktur' },
    { userId: users['doc@hybridpm.local'].id, roleInProject: 'Documentation & Trainer', division: 'Divisi Dokumentasi dan Pelatihan' },
    { userId: users['coach@hybridpm.local'].id, roleInProject: 'Kanban Coach', division: 'Agile Office' },
    { userId: users['stakeholder@hybridpm.local'].id, roleInProject: 'Hospital Representative', division: 'Direksi RS' },
  ];

  for (const pm of projectMemberships) {
    await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: baselineProject.id,
          userId: pm.userId,
        },
      },
      update: { roleInProject: pm.roleInProject, division: pm.division },
      create: {
        projectId: baselineProject.id,
        userId: pm.userId,
        roleInProject: pm.roleInProject,
        division: pm.division,
      },
    });
  }
  console.log('✓ Project members linked');

  // 5. Waterfall 7 Phases
  const phasesData = [
    {
      phaseNumber: 1,
      name: 'Inisiasi dan Perencanaan',
      description: 'Kick-off meeting, penetapan tim proyek, penyusunan Project Charter, Scope Document, Project Plan, dan Rencana Anggaran.',
      startDate: new Date('2026-11-02T00:00:00Z'),
      targetDate: new Date('2026-11-20T00:00:00Z'),
      actualEndDate: new Date('2026-11-20T00:00:00Z'),
      status: 'Completed',
      progress: 100,
      evalNotes: 'Seluruh dokumen perencanaan dan Project Charter telah disetujui Steering Committee.',
    },
    {
      phaseNumber: 2,
      name: 'Analisis Kebutuhan',
      description: 'Pengumpulan kebutuhan pengguna, wawancara mendalam, workshop kebutuhan klinis & operasional, penyusunan SRS dan Product Backlog.',
      startDate: new Date('2026-11-23T00:00:00Z'),
      targetDate: new Date('2026-12-11T00:00:00Z'),
      actualEndDate: new Date('2026-12-11T00:00:00Z'),
      status: 'Completed',
      progress: 100,
      evalNotes: 'SRS versi 1.1 telah ditandatangani oleh Project Owner dan perwakilan RS.',
    },
    {
      phaseNumber: 3,
      name: 'Desain Sistem',
      description: 'Perancangan arsitektur microservices/monolith modular, skema database ERD PostgreSQL, desain UI/UX Figma, dan prototype interaktif.',
      startDate: new Date('2026-12-14T00:00:00Z'),
      targetDate: new Date('2027-01-08T00:00:00Z'),
      actualEndDate: new Date('2027-01-08T00:00:00Z'),
      status: 'Completed',
      progress: 100,
      evalNotes: 'Arsitektur sistem dan UI prototype telah lulus evaluasi teknis dan disetujui.',
    },
    {
      phaseNumber: 4,
      name: 'Implementasi',
      description: 'Pengembangan modul sistem menggunakan papan Kanban secara iteratif, code review harian, pengujian unit, dan demo mingguan.',
      startDate: new Date('2027-01-11T00:00:00Z'),
      targetDate: new Date('2027-03-12T00:00:00Z'),
      status: 'In Progress',
      progress: 60,
      evalNotes: '6 dari 10 modul telah selesai di staging. Eksekusi Kanban berjalan optimal dengan batasan WIP.',
    },
    {
      phaseNumber: 5,
      name: 'Pengujian',
      description: 'Functional testing, integration testing, regression testing, performance testing, security audit, dan pembersihan defect kritis.',
      startDate: new Date('2027-03-15T00:00:00Z'),
      targetDate: new Date('2027-04-02T00:00:00Z'),
      status: 'Not Started',
      progress: 0,
      evalNotes: 'Akan dimulai segera setelah Gate 4 Implementasi disetujui.',
    },
    {
      phaseNumber: 6,
      name: 'UAT, Deployment, dan Pelatihan',
      description: 'User Acceptance Testing (UAT) bersama dokter dan staf, deployment ke server produksi, pelatihan pengguna, dan penyerahan user manual.',
      startDate: new Date('2027-04-05T00:00:00Z'),
      targetDate: new Date('2027-04-23T00:00:00Z'),
      status: 'Not Started',
      progress: 0,
      evalNotes: 'Persiapan modul pelatihan dan skenario UAT.',
    },
    {
      phaseNumber: 7,
      name: 'Penutupan dan Serah Terima',
      description: 'Evaluasi akhir, dokumentasi lessons learned, laporan penutupan proyek, dan penandatanganan Berita Acara Serah Terima (BAST).',
      startDate: new Date('2027-04-26T00:00:00Z'),
      targetDate: new Date('2027-04-30T00:00:00Z'),
      status: 'Not Started',
      progress: 0,
      evalNotes: 'Serah terima final kepada pihak manajemen RS.',
    },
  ];

  const createdPhases = [];
  for (const p of phasesData) {
    const existing = await prisma.projectPhase.findFirst({
      where: { projectId: baselineProject.id, phaseNumber: p.phaseNumber },
    });
    let phase;
    if (existing) {
      phase = await prisma.projectPhase.update({
        where: { id: existing.id },
        data: p,
      });
    } else {
      phase = await prisma.projectPhase.create({
        data: { ...p, projectId: baselineProject.id },
      });
    }
    createdPhases.push(phase);
  }
  console.log('✓ 7 Waterfall Phases configured');

  // 6. Project Gates (Gate 1 to 7)
  const gatesData = [
    {
      gateNumber: 1,
      phaseId: createdPhases[0].id,
      name: 'Gate 1: Persetujuan Scope dan Rencana Proyek',
      criteria: '1. Project Charter ditandatangani. 2. Dokumen Scope disepakati. 3. Baseline WBS & Anggaran diverifikasi.',
      status: 'Approved',
      submittedAt: new Date('2026-11-18T10:00:00Z'),
      decisionAt: new Date('2026-11-20T14:30:00Z'),
      decisionNotes: 'Scope dan jadwal proyek realistis dan disetujui penuh oleh Steering Committee.',
    },
    {
      gateNumber: 2,
      phaseId: createdPhases[1].id,
      name: 'Gate 2: Penandatanganan Dokumen SRS',
      criteria: '1. SRS disetujui seluruh unit kerja. 2. Backlog fungsional tuntas. 3. Kebutuhan bridging BPJS terdefinisi.',
      status: 'Approved',
      submittedAt: new Date('2026-12-09T09:00:00Z'),
      decisionAt: new Date('2026-12-11T16:00:00Z'),
      decisionNotes: 'Dokumen SRS versi 1.1 sah ditandatangani oleh Project Owner.',
    },
    {
      gateNumber: 3,
      phaseId: createdPhases[2].id,
      name: 'Gate 3: Persetujuan Arsitektur dan Prototype UI/UX',
      criteria: '1. Desain Arsitektur & ERD disetujui Lead Tech. 2. Prototype UI/UX lolos uji usability dengan perwakilan pengguna.',
      status: 'Approved',
      submittedAt: new Date('2027-01-06T11:00:00Z'),
      decisionAt: new Date('2027-01-08T15:00:00Z'),
      decisionNotes: 'Prototype interaktif sangat intuitif dan arsitektur database memenuhi standar keamanan rekam medis.',
    },
    {
      gateNumber: 4,
      phaseId: createdPhases[3].id,
      name: 'Gate 4: Review Kesiapan 10 Modul di Staging',
      criteria: '1. 10 Modul utama berjalan di environment staging. 2. Code review minimal 90% lulus. 3. Demo mingguan diterima perwakilan pengguna.',
      status: 'Pending Approval',
      submittedAt: new Date('2027-03-10T14:00:00Z'),
      decisionAt: null,
      decisionNotes: null,
    },
    {
      gateNumber: 5,
      phaseId: createdPhases[4].id,
      name: 'Gate 5: Lolos Pengujian Mutu Bebas Defect Kritis',
      criteria: '1. Tidak ada defect berstatus High atau Critical yang terbuka. 2. Test coverage >= 80%. 3. Laporan uji performa memenuhi SLA.',
      status: 'Not Submitted',
      submittedAt: null,
      decisionAt: null,
      decisionNotes: null,
    },
    {
      gateNumber: 6,
      phaseId: createdPhases[5].id,
      name: 'Gate 6: UAT Diterima dan Kesiapan Go-Live',
      criteria: '1. Keberhasilan skenario UAT >= 95%. 2. Berita Acara UAT ditandatangani. 3. Pelatihan 100% pengguna inti selesai.',
      status: 'Not Submitted',
      submittedAt: null,
      decisionAt: null,
      decisionNotes: null,
    },
    {
      gateNumber: 7,
      phaseId: createdPhases[6].id,
      name: 'Gate 7: Berita Acara Serah Terima (BAST) & Evaluasi',
      criteria: '1. BAST ditandatangani kedua belah pihak. 2. Final project report diserahkan. 3. Dokumen lessons learned diarsipkan.',
      status: 'Not Submitted',
      submittedAt: null,
      decisionAt: null,
      decisionNotes: null,
    },
  ];

  for (const g of gatesData) {
    const existingGate = await prisma.projectGate.findFirst({
      where: { projectId: baselineProject.id, gateNumber: g.gateNumber },
    });
    let gateObj;
    if (existingGate) {
      gateObj = await prisma.projectGate.update({
        where: { id: existingGate.id },
        data: g,
      });
    } else {
      gateObj = await prisma.projectGate.create({
        data: { ...g, projectId: baselineProject.id },
      });
    }

    if (g.status === 'Approved') {
      const existingApproval = await prisma.gateApproval.findFirst({
        where: { gateId: gateObj.id },
      });
      if (!existingApproval) {
        await prisma.gateApproval.create({
          data: {
            gateId: gateObj.id,
            approverId: users['owner@hybridpm.local'].id,
            status: 'Approved',
            comments: g.decisionNotes,
            signatureToken: `SIG-GATE${g.gateNumber}-OWNER-HASH99281`,
            decidedAt: g.decisionAt || new Date(),
          },
        });
      }
    }
  }
  console.log('✓ Project Gates & Digital Signatures seeded');

  // 7. Milestones (M1 to M8)
  const milestonesData = [
    { code: 'M1', title: 'Kick-off & Persetujuan Dokumen Inisiasi', targetDate: new Date('2026-11-20T00:00:00Z'), isReached: true, reachedDate: new Date('2026-11-20T00:00:00Z'), description: 'Charter & Perencanaan disepakati' },
    { code: 'M2', title: 'Penandatanganan Dokumen Spesifikasi SRS', targetDate: new Date('2026-12-11T00:00:00Z'), isReached: true, reachedDate: new Date('2026-12-11T00:00:00Z'), description: 'SRS v1.1 ditandatangani Owner' },
    { code: 'M3', title: 'Arsitektur Sistem & Prototype Selesai', targetDate: new Date('2027-01-08T00:00:00Z'), isReached: true, reachedDate: new Date('2027-01-08T00:00:00Z'), description: 'Desain teknis disetujui Steering Committee' },
    { code: 'M4', title: 'Penyelesaian 10 Modul Sistem Utama', targetDate: new Date('2027-03-12T00:00:00Z'), isReached: false, description: 'Pengembangan fungsional di staging' },
    { code: 'M5', title: 'Lolos Pengujian Fungsional & Integrasi', targetDate: new Date('2027-04-02T00:00:00Z'), isReached: false, description: 'Zero open critical/high defects' },
    { code: 'M6', title: 'Penyelesaian UAT & Berita Acara UAT', targetDate: new Date('2027-04-16T00:00:00Z'), isReached: false, description: 'UAT pass rate >= 95%' },
    { code: 'M7', title: 'Go-Live Sistem Produksi SIMRS', targetDate: new Date('2027-04-21T00:00:00Z'), isReached: false, description: 'Sistem resmi beroperasi di rumah sakit' },
    { code: 'M8', title: 'Serah Terima Akhir & Penandatanganan BAST', targetDate: new Date('2027-04-30T00:00:00Z'), isReached: false, description: 'Penutupan kontrak dan penyerahan final' },
  ];

  for (const m of milestonesData) {
    const existing = await prisma.milestone.findFirst({
      where: { projectId: baselineProject.id, code: m.code },
    });
    if (existing) {
      await prisma.milestone.update({ where: { id: existing.id }, data: m });
    } else {
      await prisma.milestone.create({ data: { ...m, projectId: baselineProject.id } });
    }
  }
  console.log('✓ Milestones M1 - M8 configured');

  // 8. Project Charter & Scope
  await prisma.projectCharter.upsert({
    where: { projectId: baselineProject.id },
    update: {},
    create: {
      projectId: baselineProject.id,
      background: 'Kebutuhan transformasi digital pelayanan kesehatan dan kepatuhan terhadap integrasi SatuSehat Kemenkes serta BPJS Kesehatan.',
      objectives: '1. Mengurangi waktu tunggu antrean pasien hingga 50%. 2. Menghilangkan rekam medis kertas secara 100%. 3. Menghubungkan bridging klaim BPJS secara real-time.',
      businessCase: 'Investasi Rp956.043.000 dengan estimasi efisiensi operasional dan penghematan biaya logistik kertas sebesar Rp420.000.000 per tahun.',
      scopeSummary: 'Mencakup 10 modul: Pendaftaran & Antrean, Rawat Jalan, Rawat Inap, IGD, Farmasi, Laboratorium, Radiologi, Kasir & Billing, Bridging BPJS/SatuSehat, dan Dashboard Eksekutif.',
      keyStakeholders: 'Direktur RS, Kepala Pelayanan Medis, Kepala Instalasi Farmasi, Tim IT, Pasien & BPJS.',
      successCriteria: 'Keberhasilan UAT >= 95%, tidak ada defect kritis saat go-live, ketersediaan sistem >= 99% per bulan.',
      approvedBy: 'Ir. Budi Santoso, M.Eng (Owner)',
      approvedAt: new Date('2026-11-20T00:00:00Z'),
    },
  });

  await prisma.projectScope.upsert({
    where: { projectId: baselineProject.id },
    update: {},
    create: {
      projectId: baselineProject.id,
      inScope: '1. Pengembangan 10 modul perangkat lunak SIMRS. 2. Instalasi server & arsitektur database. 3. Bridging API BPJS VClaim & SatuSehat. 4. Migrasi data historis 1 tahun terakhir. 5. Pelatihan 120 staf pengguna.',
      outOfScope: '1. Pengadaan perangkat keras komputer & scanner barcode fisik. 2. Penataan jaringan kabel LAN fisik rumah sakit. 3. Integrasi mesin lab vendor pihak ketiga yang belum memiliki antarmuka API.',
      assumptions: 'Infrastruktur cloud server dan sambungan internet rumah sakit telah tersedia minimal 100 Mbps simetris.',
      constraints: 'Jadwal implementasi ketat selama 6 bulan dan wajib mematuhi regulasi kerahasiaan data medis Kemenkes.',
      acceptanceCriteria: 'Sistem dapat diakses bersamaan oleh minimal 300 user tanpa degradasi performa, lolos uji keamanan penetration testing, dan disetujui komite medik.',
    },
  });
  console.log('✓ Project Charter and Scope documents seeded');

  // 9. WBS Items (Hierarchical)
  const wbsItemsData = [
    { wbsCode: '1.0', title: 'Inisiasi dan Perencanaan Proyek', startDate: new Date('2026-11-02'), endDate: new Date('2026-11-20'), progress: 100, status: 'Completed', raciR: 'Reza Pratama', raciA: 'Budi Santoso', raciC: 'Ahmad Fauzi', raciI: 'Tim SIMRS' },
    { wbsCode: '1.1', title: 'Penyusunan Project Charter dan Scope Document', startDate: new Date('2026-11-02'), endDate: new Date('2026-11-10'), progress: 100, status: 'Completed', raciR: 'Reza Pratama', raciA: 'Budi Santoso', raciC: 'Dimas Setiawan', raciI: 'All' },
    { wbsCode: '1.2', title: 'Perencanaan Jadwal, WBS, dan Anggaran Biaya', startDate: new Date('2026-11-11'), endDate: new Date('2026-11-20'), progress: 100, status: 'Completed', raciR: 'Reza Pratama', raciA: 'Budi Santoso', raciC: 'Siti Aminah', raciI: 'All' },
    { wbsCode: '2.0', title: 'Analisis Kebutuhan Sistem & Spesifikasi', startDate: new Date('2026-11-23'), endDate: new Date('2026-12-11'), progress: 100, status: 'Completed', raciR: 'Dimas Setiawan', raciA: 'Reza Pratama', raciC: 'Ahmad Fauzi', raciI: 'Siti Aminah' },
    { wbsCode: '2.1', title: 'Wawancara & Workshop Pengguna Klinis', startDate: new Date('2026-11-23'), endDate: new Date('2026-12-02'), progress: 100, status: 'Completed', raciR: 'Dimas Setiawan', raciA: 'Reza Pratama', raciC: 'Staff RS', raciI: 'Tim QA' },
    { wbsCode: '2.2', title: 'Penyusunan SRS dan Backlog Modul', startDate: new Date('2026-12-03'), endDate: new Date('2026-12-11'), progress: 100, status: 'Completed', raciR: 'Dimas Setiawan', raciA: 'Budi Santoso', raciC: 'Reza Pratama', raciI: 'Developer' },
    { wbsCode: '3.0', title: 'Desain Arsitektur & Prototype UI/UX', startDate: new Date('2026-12-14'), endDate: new Date('2027-01-08'), progress: 100, status: 'Completed', raciR: 'Dimas Setiawan', raciA: 'Reza Pratama', raciC: 'Fajar Ramadhan', raciI: 'All' },
    { wbsCode: '3.1', title: 'Perancangan ERD Database & Schema Relasional', startDate: new Date('2026-12-14'), endDate: new Date('2026-12-24'), progress: 100, status: 'Completed', raciR: 'Siti Aminah', raciA: 'Reza Pratama', raciC: 'Fajar Ramadhan', raciI: 'QA Lead' },
    { wbsCode: '3.2', title: 'Desain Antarmuka Pengguna & Interaktif Prototype', startDate: new Date('2026-12-26'), endDate: new Date('2027-01-08'), progress: 100, status: 'Completed', raciR: 'Dimas Setiawan', raciA: 'Reza Pratama', raciC: 'User RS', raciI: 'Developer' },
    { wbsCode: '4.0', title: 'Implementasi Modul Berbasis Kanban', startDate: new Date('2027-01-11'), endDate: new Date('2027-03-12'), progress: 60, status: 'In Progress', raciR: 'Siti Aminah', raciA: 'Reza Pratama', raciC: 'Hendra Wijaya', raciI: 'Budi Santoso' },
    { wbsCode: '4.1', title: 'Pengembangan Modul Pendaftaran & Antrean Online', startDate: new Date('2027-01-11'), endDate: new Date('2027-01-25'), progress: 100, status: 'Completed', raciR: 'Siti Aminah', raciA: 'Reza Pratama', raciC: 'Dimas Setiawan', raciI: 'QA Lead' },
    { wbsCode: '4.2', title: 'Pengembangan Modul Rekam Medis Elektronik (RME)', startDate: new Date('2027-01-26'), endDate: new Date('2027-02-15'), progress: 100, status: 'Completed', raciR: 'Siti Aminah', raciA: 'Reza Pratama', raciC: 'Komite Medik', raciI: 'QA Lead' },
    { wbsCode: '4.3', title: 'Pengembangan Modul Farmasi & Resep Elektronik', startDate: new Date('2027-02-01'), endDate: new Date('2027-02-22'), progress: 75, status: 'In Progress', raciR: 'Siti Aminah', raciA: 'Reza Pratama', raciC: 'Instalasi Farmasi', raciI: 'QA Lead' },
    { wbsCode: '4.4', title: 'Pengembangan Modul Billing, Kasir & Bridging BPJS', startDate: new Date('2027-02-16'), endDate: new Date('2027-03-12'), progress: 50, status: 'In Progress', raciR: 'Siti Aminah', raciA: 'Reza Pratama', raciC: 'BPJS Team', raciI: 'Owner' },
    { wbsCode: '5.0', title: 'Pengujian Mutu Sistem & Audit Keamanan', startDate: new Date('2027-03-15'), endDate: new Date('2027-04-02'), progress: 0, status: 'Not Started', raciR: 'Maya Putri', raciA: 'Reza Pratama', raciC: 'Fajar Ramadhan', raciI: 'Owner' },
    { wbsCode: '6.0', title: 'UAT, Deployment Produksi & Pelatihan', startDate: new Date('2027-04-05'), endDate: new Date('2027-04-23'), progress: 0, status: 'Not Started', raciR: 'Rina Andriani', raciA: 'Reza Pratama', raciC: 'Ahmad Fauzi', raciI: 'All' },
    { wbsCode: '7.0', title: 'Evaluasi Akhir dan Serah Terima BAST', startDate: new Date('2027-04-26'), endDate: new Date('2027-04-30'), progress: 0, status: 'Not Started', raciR: 'Reza Pratama', raciA: 'Budi Santoso', raciC: 'Ahmad Fauzi', raciI: 'All' },
  ];

  for (const w of wbsItemsData) {
    const existing = await prisma.wbsItem.findFirst({
      where: { projectId: baselineProject.id, wbsCode: w.wbsCode },
    });
    if (existing) {
      await prisma.wbsItem.update({ where: { id: existing.id }, data: w });
    } else {
      await prisma.wbsItem.create({ data: { ...w, projectId: baselineProject.id } });
    }
  }
  console.log('✓ WBS items with RACI matrix tags created');

  // 10. Kanban Cards (Tasks)
  // Columns: Backlog, Analisis, Develop (WIP: 4), Review (WIP: 3), Test (WIP: 3), Done
  const tasksData = [
    // Done cards (met quality gates)
    {
      taskCode: 'TSK-001',
      title: 'Setup Arsitektur Basis Data SIMRS di PostgreSQL',
      description: 'Menyusun skema relasional, tabel master pasien, dan indeks performa.',
      status: 'Done',
      priority: 'High',
      labels: 'Database,Backend',
      assigneeId: users['member@hybridpm.local'].id,
      creatorId: users['pm@hybridpm.local'].id,
      estimateDays: 3,
      startDate: new Date('2027-01-12'),
      dueDate: new Date('2027-01-15'),
      completedAt: new Date('2027-01-15'),
      isReviewed: true,
      isTested: true,
      isDemoed: true,
    },
    {
      taskCode: 'TSK-002',
      title: 'Pembuatan Modul Pendaftaran Pasien Baru & Antrean Online',
      description: 'Fitur input data pasien sesuai standar Rekam Medis dan cetak barcode nomor antrean.',
      status: 'Done',
      priority: 'High',
      labels: 'Frontend,Backend',
      assigneeId: users['member@hybridpm.local'].id,
      creatorId: users['pm@hybridpm.local'].id,
      estimateDays: 5,
      startDate: new Date('2027-01-16'),
      dueDate: new Date('2027-01-22'),
      completedAt: new Date('2027-01-21'),
      isReviewed: true,
      isTested: true,
      isDemoed: true,
    },
    {
      taskCode: 'TSK-003',
      title: 'Implementasi Format SOAP Rekam Medis Elektronik (RME)',
      description: 'Formulir pemeriksaan dokter: Subjective, Objective, Assessment, Plan terstruktur.',
      status: 'Done',
      priority: 'High',
      labels: 'Clinical,Feature',
      assigneeId: users['member@hybridpm.local'].id,
      creatorId: users['pm@hybridpm.local'].id,
      estimateDays: 6,
      startDate: new Date('2027-01-23'),
      dueDate: new Date('2027-01-30'),
      completedAt: new Date('2027-01-29'),
      isReviewed: true,
      isTested: true,
      isDemoed: true,
    },
    // Test cards (max 3 WIP)
    {
      taskCode: 'TSK-004',
      title: 'Pengujian Validasi Resep Elektronik & Interaksi Obat',
      description: 'Memastikan peringatan kontraindikasi dan alergi obat muncul otomatis saat dokter meresepkan obat.',
      status: 'Test',
      priority: 'High',
      labels: 'Farmasi,QA',
      assigneeId: users['qa@hybridpm.local'].id,
      creatorId: users['pm@hybridpm.local'].id,
      estimateDays: 3,
      startDate: new Date('2027-02-02'),
      dueDate: new Date('2027-02-06'),
      isReviewed: true,
      isTested: false,
      isDemoed: false,
    },
    {
      taskCode: 'TSK-005',
      title: 'Pengujian Beban Koneksi Bridging VClaim BPJS',
      description: 'Uji simulasi 100 hit per detik pada endpoint verifikasi nomor kartu kepesertaan BPJS.',
      status: 'Test',
      priority: 'Medium',
      labels: 'Integration,Testing',
      assigneeId: users['qa@hybridpm.local'].id,
      creatorId: users['pm@hybridpm.local'].id,
      estimateDays: 4,
      startDate: new Date('2027-02-03'),
      dueDate: new Date('2027-02-08'),
      isReviewed: true,
      isTested: false,
      isDemoed: false,
    },
    // Review cards (max 3 WIP)
    {
      taskCode: 'TSK-006',
      title: 'Code Review Modul Perhitungan Billing Pasien Pulang',
      description: 'Pengecekan logika akumulasi biaya obat, kamar, tindakan medis dan diskon asuransi.',
      status: 'Review',
      priority: 'High',
      labels: 'Billing,Security',
      assigneeId: users['member@hybridpm.local'].id,
      creatorId: users['pm@hybridpm.local'].id,
      estimateDays: 2,
      startDate: new Date('2027-02-04'),
      dueDate: new Date('2027-02-07'),
      isReviewed: false,
      isTested: false,
      isDemoed: false,
    },
    {
      taskCode: 'TSK-007',
      title: 'Review Enkripsi Data Rekam Medis (AES-256)',
      description: 'Audit implementasi pengamanan data pasien sesuai standar kepatuhan SatuSehat.',
      status: 'Review',
      priority: 'High',
      labels: 'Security,Compliance',
      assigneeId: users['infra@hybridpm.local'].id,
      creatorId: users['pm@hybridpm.local'].id,
      estimateDays: 2,
      startDate: new Date('2027-02-05'),
      dueDate: new Date('2027-02-08'),
      isReviewed: false,
      isTested: false,
      isDemoed: false,
    },
    // Develop cards (max 4 WIP)
    {
      taskCode: 'TSK-008',
      title: 'Pengembangan Modul Laboratorium & Cetak Hasil Otomatis',
      description: 'Integrasi input hasil nilai rujukan laboratorium dan generate PDF hasil tes.',
      status: 'Develop',
      priority: 'Medium',
      labels: 'Lab,Feature',
      assigneeId: users['member@hybridpm.local'].id,
      creatorId: users['pm@hybridpm.local'].id,
      estimateDays: 5,
      startDate: new Date('2027-02-05'),
      dueDate: new Date('2027-02-12'),
      isReviewed: false,
      isTested: false,
      isDemoed: false,
    },
    {
      taskCode: 'TSK-009',
      title: 'Implementasi Antarmuka Radiologi (PACS Viewer Link)',
      description: 'Menyematkan tautan hasil rontgen DICOM ke dalam lembar rekam medis pasien.',
      status: 'Develop',
      priority: 'Low',
      labels: 'Radiologi,UI',
      assigneeId: users['member@hybridpm.local'].id,
      creatorId: users['pm@hybridpm.local'].id,
      estimateDays: 4,
      startDate: new Date('2027-02-06'),
      dueDate: new Date('2027-02-13'),
      isReviewed: false,
      isTested: false,
      isDemoed: false,
    },
    {
      taskCode: 'TSK-010',
      title: 'Dashboard Executive KPI Keterisian Tempat Tidur (BOR)',
      description: 'Visualisasi grafik Bed Occupancy Rate, LOS, dan tren kunjungan harian rawat inap.',
      status: 'Develop',
      priority: 'Medium',
      labels: 'Dashboard,Analytics',
      assigneeId: users['member@hybridpm.local'].id,
      creatorId: users['pm@hybridpm.local'].id,
      estimateDays: 3,
      startDate: new Date('2027-02-07'),
      dueDate: new Date('2027-02-11'),
      isReviewed: false,
      isTested: false,
      isDemoed: false,
    },
    // Analisis cards
    {
      taskCode: 'TSK-011',
      title: 'Analisis Alur Transfer Pasien dari IGD ke Rawat Inap',
      description: 'Penyusunan use case transfer bed, hand-over perawat, dan serah terima catatan observasi.',
      status: 'Analisis',
      priority: 'Medium',
      labels: 'Analisis,Workflow',
      assigneeId: users['analyst@hybridpm.local'].id,
      creatorId: users['pm@hybridpm.local'].id,
      estimateDays: 3,
      startDate: new Date('2027-02-07'),
      dueDate: new Date('2027-02-12'),
    },
    // Backlog cards
    {
      taskCode: 'TSK-012',
      title: 'Integrasi Payment Gateway QRIS di Kasir SIMRS',
      description: 'Penyediaan pembayaran non-tunai langsung cetak struk pembayaran sah.',
      status: 'Backlog',
      priority: 'Low',
      labels: 'Payment,Fintech',
      assigneeId: null,
      creatorId: users['pm@hybridpm.local'].id,
      estimateDays: 4,
    },
    {
      taskCode: 'TSK-013',
      title: 'Notifikasi SMS / WhatsApp Pengambilan Obat Siap di Farmasi',
      description: 'Otomasi blast pesan ke nomor ponsel pasien saat racikan obat telah selesai dikemas.',
      status: 'Backlog',
      priority: 'Low',
      labels: 'Notification,Messaging',
      assigneeId: null,
      creatorId: users['pm@hybridpm.local'].id,
      estimateDays: 3,
    },
  ];

  for (const t of tasksData) {
    const existing = await prisma.task.findFirst({
      where: { projectId: baselineProject.id, taskCode: t.taskCode },
    });
    let savedTask;
    if (existing) {
      savedTask = await prisma.task.update({ where: { id: existing.id }, data: t });
    } else {
      savedTask = await prisma.task.create({ data: { ...t, projectId: baselineProject.id } });
    }

    // Add status history record
    await prisma.taskStatusHistory.create({
      data: {
        taskId: savedTask.id,
        fromStatus: null,
        toStatus: savedTask.status,
        changedBy: 'System Seeder',
        changedAt: savedTask.createdAt,
      },
    });
  }
  console.log('✓ Kanban tasks created (Strictly respecting WIP limits)');

  // 11. Risk Register (5x5 Matrix)
  const risksData = [
    {
      riskCode: 'RSK-001',
      title: 'Keterlambatan Integrasi API Bridging BPJS Kesehatan',
      description: 'Spesifikasi endpoint SatuSehat dan BPJS VClaim mengalami perubahan skema parameter.',
      category: 'Eksternal',
      probability: 4,
      impact: 4,
      riskScore: 16,
      severity: 'Critical',
      mitigationPlan: 'Mengadakan koordinasi teknis mingguan dengan tim IT BPJS cabang dan membuat adapter mock API fleksibel.',
      ownerId: users['member@hybridpm.local'].id,
      status: 'Mitigating',
    },
    {
      riskCode: 'RSK-002',
      title: 'Resistensi Pengguna Terhadap Peralihan Rekam Medis Kertas ke Digital',
      description: 'Beberapa dokter senior memerlukan waktu adaptasi lebih lama dalam mengetik SOAP secara digital.',
      category: 'Manajemen',
      probability: 3,
      impact: 4,
      riskScore: 12,
      severity: 'High',
      mitigationPlan: 'Sediakan asisten perawat khusus pencatat (medical scribe) selama masa transisi 2 minggu dan sediakan template auto-text.',
      ownerId: users['doc@hybridpm.local'].id,
      status: 'Mitigating',
    },
    {
      riskCode: 'RSK-003',
      title: 'Kapasitas Server Database Kurang Memadai saat Jam Sibuk',
      description: 'Lonjakan traffic pendaftaran pasien pukul 07.00 - 09.00 berpotensi menurunkan respons aplikasi.',
      category: 'Teknis',
      probability: 2,
      impact: 4,
      riskScore: 8,
      severity: 'Medium',
      mitigationPlan: 'Implementasi PostgreSQL connection pooling (PgBouncer) dan caching Redis untuk kuota poliklinik.',
      ownerId: users['infra@hybridpm.local'].id,
      status: 'Identified',
    },
    {
      riskCode: 'RSK-004',
      title: 'Ketidaksesuaian Stok Fisik Obat dengan Sistem Farmasi',
      description: 'Perbedaan pencatatan kartu stok fisik gudang farmasi sebelum proses go-live.',
      category: 'Sumber Daya',
      probability: 3,
      impact: 3,
      riskScore: 9,
      severity: 'Medium',
      mitigationPlan: 'Lakukan stock opname serentak H-2 sebelum deployment modul farmasi live.',
      ownerId: users['analyst@hybridpm.local'].id,
      status: 'Identified',
    },
    {
      riskCode: 'RSK-005',
      title: 'Kegagalan Backup Otomatis Harian',
      description: 'Risiko hilangnya data transaksi jika script snapshot backup gagal dieksekusi.',
      category: 'Teknis',
      probability: 1,
      impact: 5,
      riskScore: 5,
      severity: 'Medium',
      mitigationPlan: 'Setup automated replication multi-region dengan alert bot Telegram jika backup gagal.',
      ownerId: users['infra@hybridpm.local'].id,
      status: 'Identified',
    },
    {
      riskCode: 'RSK-006',
      title: 'Kesalahan Input Tarif Tindakan Medis Khusus',
      description: 'Kekeliruan pengisian master tarif tindakan berpotensi menimbulkan perselisihan tagihan pasien.',
      category: 'Manajemen',
      probability: 2,
      impact: 2,
      riskScore: 4,
      severity: 'Low',
      mitigationPlan: 'Wajibkan verifikasi ganda (double-check) oleh Bagian Keuangan sebelum tarif diaktifkan.',
      ownerId: users['pm@hybridpm.local'].id,
      status: 'Accepted',
    },
  ];

  for (const r of risksData) {
    const existing = await prisma.risk.findFirst({
      where: { projectId: baselineProject.id, riskCode: r.riskCode },
    });
    if (existing) {
      await prisma.risk.update({ where: { id: existing.id }, data: r });
    } else {
      await prisma.risk.create({ data: { ...r, projectId: baselineProject.id } });
    }
  }
  console.log('✓ Risk register 5x5 Matrix seeded');

  // 12. Budget Management
  // Baseline prompt figures:
  // SDM: 722.000.000
  // Non-SDM: 61.000.000
  // Langsung: 783.000.000
  // Kontingensi 10%: 78.300.000
  // Subtotal: 861.300.000
  // PPN 11%: 94.743.000
  // Total: 956.043.000
  const budget = await prisma.budget.upsert({
    where: { projectId: baselineProject.id },
    update: {},
    create: {
      projectId: baselineProject.id,
      totalLaborCost: 722000000,
      totalNonLaborCost: 61000000,
      directCost: 783000000,
      contingencyRate: 0.10,
      contingencyCost: 78300000,
      subtotal: 861300000,
      taxRate: 0.11,
      taxAmount: 94743000,
      totalBudget: 956043000,
    },
  });

  const budgetItemsData = [
    { category: 'Termin', name: 'Termin 1 (20%): Uang Muka & Persetujuan Inisiasi', allocatedAmount: 191208600, percentage: 20, isPaid: true, paidAt: new Date('2026-11-21') },
    { category: 'Termin', name: 'Termin 2 (20%): Persetujuan SRS & Desain Sistem', allocatedAmount: 191208600, percentage: 20, isPaid: true, paidAt: new Date('2027-01-10') },
    { category: 'Termin', name: 'Termin 3 (30%): Selesai Modul Inti di Staging', allocatedAmount: 286812900, percentage: 30, isPaid: false },
    { category: 'Termin', name: 'Termin 4 (20%): Lulus UAT & Pelatihan Staf', allocatedAmount: 191208600, percentage: 20, isPaid: false },
    { category: 'Termin', name: 'Termin 5 (10%): Penandatanganan BAST Final', allocatedAmount: 95604300, percentage: 10, isPaid: false },
    { category: 'SDM', name: 'Alokasi Gaji Tim Pengembang & Analis (6 Bulan)', allocatedAmount: 722000000, isPaid: false },
    { category: 'Non-SDM', name: 'Infrastruktur Cloud Staging, Domain & Lisensi', allocatedAmount: 61000000, isPaid: false },
    { category: 'Kontingensi', name: 'Dana Cadangan Risiko Proyek (Otorisasi Owner)', allocatedAmount: 78300000, isPaid: false },
  ];

  for (const bi of budgetItemsData) {
    const existing = await prisma.budgetItem.findFirst({
      where: { budgetId: budget.id, name: bi.name },
    });
    if (!existing) {
      await prisma.budgetItem.create({ data: { ...bi, budgetId: budget.id } });
    }
  }

  // Realistic sample expenses
  const expensesData = [
    { description: 'Pembayaran Honorarium Tim Fase Inisiasi & Analisis (Bulan 1-2)', category: 'SDM', amount: 240000000, expenseDate: new Date('2026-12-28') },
    { description: 'Sewa Virtual Private Cloud (VPC) Staging & Database RDS 6 Bulan', category: 'Infrastruktur', amount: 18500000, expenseDate: new Date('2026-11-15') },
    { description: 'Konsumsi & Fasilitasi Workshop Analisis Pengguna 4 Hari', category: 'Operasional', amount: 7500000, expenseDate: new Date('2026-11-28') },
    { description: 'Honorarium Tim Pengembangan Fase Implementasi (Bulan 3)', category: 'SDM', amount: 120000000, expenseDate: new Date('2027-01-30') },
  ];

  for (const exp of expensesData) {
    const existing = await prisma.expense.findFirst({
      where: { budgetId: budget.id, description: exp.description },
    });
    if (!existing) {
      await prisma.expense.create({
        data: {
          ...exp,
          budgetId: budget.id,
          isApproved: true,
          approvedBy: 'Ir. Budi Santoso, M.Eng (Owner)',
        },
      });
    }
  }
  console.log('✓ Budget baseline & dynamic expenses seeded');

  // 13. Documents with Versioning
  const docsData = [
    {
      title: 'Project Charter SIMRS Hybrid',
      category: 'Project Charter',
      currentVersion: '1.0',
      status: 'Approved',
      uploadedById: users['pm@hybridpm.local'].id,
      versions: [
        { versionNumber: '1.0', fileName: 'Project_Charter_SIMRS_Signed.pdf', fileUrl: '/uploads/charter_v1.0.pdf', fileSize: 1048576, notes: 'Versi final disetujui Steering Committee' },
      ],
    },
    {
      title: 'Spesifikasi Kebutuhan Perangkat Lunak (SRS)',
      category: 'SRS',
      currentVersion: '1.1',
      status: 'Approved',
      uploadedById: users['analyst@hybridpm.local'].id,
      versions: [
        { versionNumber: '1.0', fileName: 'SRS_SIMRS_Draft.pdf', fileUrl: '/uploads/srs_v1.0.pdf', fileSize: 3145728, notes: 'Draft awal hasil wawancara' },
        { versionNumber: '1.1', fileName: 'SRS_SIMRS_Final_Signed.pdf', fileUrl: '/uploads/srs_v1.1.pdf', fileSize: 3450000, notes: 'Penambahan spesifikasi SatuSehat Kemenkes' },
      ],
    },
    {
      title: 'Dokumen Desain Arsitektur & ERD',
      category: 'System Design',
      currentVersion: '1.0',
      status: 'Approved',
      uploadedById: users['member@hybridpm.local'].id,
      versions: [
        { versionNumber: '1.0', fileName: 'System_Architecture_SIMRS.pdf', fileUrl: '/uploads/architecture_v1.0.pdf', fileSize: 2500000, notes: 'Desain mikroservis modul rekam medis' },
      ],
    },
    {
      title: 'Panduan Skenario Pengujian UAT',
      category: 'UAT Document',
      currentVersion: '1.0',
      status: 'Draft',
      uploadedById: users['qa@hybridpm.local'].id,
      versions: [
        { versionNumber: '1.0', fileName: 'Draft_UAT_Scenario_SIMRS.pdf', fileUrl: '/uploads/uat_draft_v1.0.pdf', fileSize: 1200000, notes: 'Draft skenario pengujian 10 modul' },
      ],
    },
  ];

  for (const doc of docsData) {
    const existing = await prisma.document.findFirst({
      where: { projectId: baselineProject.id, title: doc.title },
    });
    if (!existing) {
      const createdDoc = await prisma.document.create({
        data: {
          projectId: baselineProject.id,
          title: doc.title,
          category: doc.category,
          currentVersion: doc.currentVersion,
          status: doc.status,
          uploadedById: doc.uploadedById,
        },
      });
      for (const v of doc.versions) {
        await prisma.documentVersion.create({
          data: {
            ...v,
            documentId: createdDoc.id,
          },
        });
      }
    }
  }
  console.log('✓ Project documents & version history seeded');

  // 14. Change Request (CR)
  const existingCR = await prisma.changeRequest.findFirst({
    where: { crCode: 'CR-001' },
  });
  if (!existingCR) {
    await prisma.changeRequest.create({
      data: {
        crCode: 'CR-001',
        projectId: baselineProject.id,
        requesterId: users['stakeholder@hybridpm.local'].id,
        title: 'Penambahan Fitur Cetak Gelang Pasien dengan QR Code Medis',
        description: 'Pemberian gelang identitas pasien rawat inap yang memiliki QR code untuk verifikasi obat saat visite perawat.',
        reason: 'Peningkatan keselamatan pasien (patient safety) sesuai standar akreditasi rumah sakit KARS.',
        costImpact: 12000000,
        scheduleImpactDays: 4,
        qualityImpact: 'Meningkatkan akurasi identifikasi pasien hingga 100%.',
        technicalAnalysis: 'Modul cetak antrean dapat diperluas untuk printer thermal label gelang tanpa mengganggu jadwal modul lain.',
        status: 'Approved',
        decisionNotes: 'Disetujui Owner karena krusial untuk akreditasi rumah sakit.',
        decidedAt: new Date('2027-01-20'),
        decidedBy: 'Ir. Budi Santoso, M.Eng',
      },
    });
  }
  console.log('✓ Change Requests configured');

  // 15. Meetings & Communications
  const meetingsData = [
    {
      title: 'Daily Stand-up Tim Pengembangan SIMRS',
      meetingType: 'Daily Stand-up',
      scheduledAt: new Date('2027-02-08T09:00:00Z'),
      durationMin: 15,
      location: 'Ruang Rapat IT / Google Meet',
      agenda: 'Update pekerjaan harian: apa yang dikerjakan kemarin, apa yang dikerjakan hari ini, dan kendala (blocker).',
      status: 'Completed',
    },
    {
      title: 'Demo Mingguan Sprint Modul Rekam Medis ke Dokter Spesialis',
      meetingType: 'Demo Mingguan',
      scheduledAt: new Date('2027-02-13T14:00:00Z'),
      durationMin: 60,
      location: 'Auditorium RS Lt. 2',
      agenda: 'Demonstrasi alur input SOAP, validasi e-resep farmasi, dan masukan klinis.',
      status: 'Scheduled',
    },
    {
      title: 'Rapat Steering Committee Evaluasi Gate 4',
      meetingType: 'Rapat Gate',
      scheduledAt: new Date('2027-03-12T10:00:00Z'),
      durationMin: 90,
      location: 'Ruang Direksi RS',
      agenda: 'Peninjauan kesiapan 10 modul di server staging sebelum masuk fase pengujian QA menyeluruh.',
      status: 'Scheduled',
    },
  ];

  for (const m of meetingsData) {
    const existing = await prisma.meeting.findFirst({
      where: { projectId: baselineProject.id, title: m.title },
    });
    if (!existing) {
      await prisma.meeting.create({
        data: {
          ...m,
          projectId: baselineProject.id,
        },
      });
    }
  }
  console.log('✓ Meetings & Communications scheduled');

  // 16. Methodology Criteria (15 Criteria)
  const criteriaData = [
    {
      code: 'C01',
      name: 'Stabilitas Kebutuhan (Requirement Stability)',
      question: 'Seberapa stabil dan jelas kebutuhan fungsional proyek di awal inisiasi?',
      description: 'Kebutuhan yang sangat terdefinisi cocok untuk Waterfall, sedangkan kebutuhan dinamis cocok untuk Kanban.',
      weight: 1.2,
      orderIndex: 1,
      options: JSON.stringify([
        { label: 'Sangat Pasti & Regulasi Statis', waterfall: 5, kanban: 1, hybrid: 4 },
        { label: 'Sebagian Besar Pasti, Sedikit Penyesuaian', waterfall: 3, kanban: 3, hybrid: 5 },
        { label: 'Sangat Dinamis & Sering Berubah', waterfall: 1, kanban: 5, hybrid: 3 },
      ]),
    },
    {
      code: 'C02',
      name: 'Tingkat Keterlibatan Klien (Client Availability)',
      question: 'Seberapa sering pemangku kepentingan dapat berpartisipasi dan meninjau hasil?',
      description: 'Partisipasi harian/mingguan mendukung Kanban; interaksi berkala per fase mendukung Waterfall.',
      weight: 1.0,
      orderIndex: 2,
      options: JSON.stringify([
        { label: 'Hanya Pada Tiap Akhir Fase / Milestones', waterfall: 5, kanban: 1, hybrid: 4 },
        { label: 'Tinjauan Mingguan & Gate Formal', waterfall: 2, kanban: 3, hybrid: 5 },
        { label: 'Tersedia Setiap Hari Sepanjang Waktu', waterfall: 1, kanban: 5, hybrid: 4 },
      ]),
    },
    {
      code: 'C03',
      name: 'Ketegasan Tanggal Selesai (Fixed Deadline)',
      question: 'Apakah tanggal penyelesaian proyek bersifat mutlak dan memiliki sanksi keterlambatan?',
      description: 'Jadwal baseline ketat memerlukan kontrol Waterfall, eksekusi tim butuh aliran Kanban.',
      weight: 1.2,
      orderIndex: 3,
      options: JSON.stringify([
        { label: 'Batas Waktu Ketat & Regulasi Pemerintah', waterfall: 4, kanban: 2, hybrid: 5 },
        { label: 'Target Waktu Moderat dengan Toleransi', waterfall: 3, kanban: 3, hybrid: 4 },
        { label: 'Fleksibel Berorientasi Nilai Fitur', waterfall: 1, kanban: 5, hybrid: 3 },
      ]),
    },
    {
      code: 'C04',
      name: 'Ketegasan Anggaran (Fixed Budget)',
      question: 'Apakah total anggaran proyek bersifat lump-sum / pagu anggaran tetap?',
      description: 'Pagu anggaran tetap memerlukan WBS biaya Waterfall, alur pengeluaran terkontrol.',
      weight: 1.1,
      orderIndex: 4,
      options: JSON.stringify([
        { label: 'Pagu Anggaran Tetap & Termin Pembayaran Ketat', waterfall: 5, kanban: 2, hybrid: 5 },
        { label: 'Anggaran Dapat Disesuaikan Melalui CR', waterfall: 3, kanban: 3, hybrid: 4 },
        { label: 'Berbasis Time & Materials', waterfall: 1, kanban: 5, hybrid: 2 },
      ]),
    },
    {
      code: 'C05',
      name: 'Kompleksitas Teknis & Integrasi',
      question: 'Berapa banyak sistem eksternal dan arsitektur data yang harus dihubungkan?',
      description: 'Integrasi sistem medis/BPJS memerlukan desain arsitektur awal mendalam.',
      weight: 1.0,
      orderIndex: 5,
      options: JSON.stringify([
        { label: 'Banyak Integrasi Eksternal Kompleks', waterfall: 4, kanban: 2, hybrid: 5 },
        { label: 'Integrasi Menengah dengan API Terstandar', waterfall: 3, kanban: 4, hybrid: 4 },
        { label: 'Mandiri / Tanpa Ketergantungan Eksternal', waterfall: 2, kanban: 5, hybrid: 3 },
      ]),
    },
    {
      code: 'C06',
      name: 'Tingkat Kematangan Tim (Team Experience)',
      question: 'Seberapa berpengalaman tim pengembang dengan domain dan teknologi ini?',
      weight: 1.0,
      orderIndex: 6,
      options: JSON.stringify([
        { label: 'Sangat Senior & Memahami Disiplin Agile/Kanban', waterfall: 2, kanban: 5, hybrid: 4 },
        { label: 'Campuran Senior & Junior Terbimbing', waterfall: 3, kanban: 3, hybrid: 5 },
        { label: 'Mayoritas Baru Mempelajari Domain Bisnis', waterfall: 5, kanban: 2, hybrid: 4 },
      ]),
    },
    {
      code: 'C07',
      name: 'Kebutuhan Dokumentasi Formal (Compliance)',
      question: 'Apakah terdapat kewajiban audit, regulasi, dan arsip dokumen resmi?',
      weight: 1.2,
      orderIndex: 7,
      options: JSON.stringify([
        { label: 'Wajib Dokumen Lengkap (SRS, ERD, BAST, Manual)', waterfall: 5, kanban: 1, hybrid: 5 },
        { label: 'Dokumentasi Standar & Ringkasan Sprint', waterfall: 3, kanban: 3, hybrid: 4 },
        { label: 'Cukup Dokumentasi Kode & Wiki Singkat', waterfall: 1, kanban: 5, hybrid: 2 },
      ]),
    },
    {
      code: 'C08',
      name: 'Ukuran Tim Pengembang',
      question: 'Berapa jumlah total personil yang terlibat aktif dalam pengembangan?',
      weight: 0.9,
      orderIndex: 8,
      options: JSON.stringify([
        { label: 'Tim Besar (> 15 orang, berbagai divisi)', waterfall: 4, kanban: 2, hybrid: 5 },
        { label: 'Tim Menengah (7 - 15 orang terbagi peran)', waterfall: 3, kanban: 4, hybrid: 5 },
        { label: 'Tim Kecil (< 6 orang kompak)', waterfall: 1, kanban: 5, hybrid: 3 },
      ]),
    },
    {
      code: 'C09',
      name: 'Frekuensi Pengiriman Nilai (Delivery Cadence)',
      question: 'Seberapa sering perangkat lunak dapat didemokan atau dideploy parsial?',
      weight: 1.0,
      orderIndex: 9,
      options: JSON.stringify([
        { label: 'Hanya Sekali di Akhir Menjelang Go-Live', waterfall: 5, kanban: 1, hybrid: 2 },
        { label: 'Demo Tiap Modul Selesai Dilanjutkan Go-Live Serentak', waterfall: 2, kanban: 4, hybrid: 5 },
        { label: 'Continuous Deployment Setiap Hari/Minggu', waterfall: 1, kanban: 5, hybrid: 3 },
      ]),
    },
    {
      code: 'C10',
      name: 'Kekritisan Sistem Terhadap Keselamatan (Criticality)',
      question: 'Apa dampak apabila terjadi kegagalan perangkat lunak di lapangan?',
      weight: 1.1,
      orderIndex: 10,
      options: JSON.stringify([
        { label: 'Kritis (Kesehatan Pasien / Finansial Tinggi)', waterfall: 4, kanban: 2, hybrid: 5 },
        { label: 'Menengah (Operasional Tertunda Sementara)', waterfall: 3, kanban: 4, hybrid: 4 },
        { label: 'Rendah (Hanya Hiburan / Internal Non-kritis)', waterfall: 1, kanban: 5, hybrid: 2 },
      ]),
    },
    {
      code: 'C11',
      name: 'Tingkat Ketidakpastian Teknologi (Tech Uncertainty)',
      question: 'Seberapa baru atau belum terujinya stack teknologi yang akan diadopsi?',
      weight: 0.9,
      orderIndex: 11,
      options: JSON.stringify([
        { label: 'Stack Sangat Mapan & Terbukti Stabil', waterfall: 5, kanban: 2, hybrid: 4 },
        { label: 'Sebagian Teknologi Baru Butuh R&D Kecil', waterfall: 3, kanban: 3, hybrid: 5 },
        { label: 'Teknologi Eksperimental Belum Pernah Dipakai', waterfall: 1, kanban: 5, hybrid: 3 },
      ]),
    },
    {
      code: 'C12',
      name: 'Mekanisme Kontrol Perubahan (Change Governance)',
      question: 'Bagaimana penanganan perubahan lingkup pekerjaan (scope change)?',
      weight: 1.0,
      orderIndex: 12,
      options: JSON.stringify([
        { label: 'Wajib Melalui Komite Perubahan Resmi (CR Board)', waterfall: 5, kanban: 2, hybrid: 5 },
        { label: 'Dapat Masuk Backlog Prioritas Mingguan', waterfall: 2, kanban: 4, hybrid: 5 },
        { label: 'Langsung Diubah Sesuai Diskusi Informal', waterfall: 1, kanban: 5, hybrid: 2 },
      ]),
    },
    {
      code: 'C13',
      name: 'Tingkat Ketergantungan Antar Modul (Coupling)',
      question: 'Seberapa erat ketergantungan urutan kerja antar modul?',
      weight: 1.0,
      orderIndex: 13,
      options: JSON.stringify([
        { label: 'Ketergantungan Sekuensial Tinggi (Database -> API -> UI)', waterfall: 5, kanban: 2, hybrid: 5 },
        { label: 'Modular dengan Kontrak API yang Jelas', waterfall: 2, kanban: 4, hybrid: 5 },
        { label: 'Tiap Fitur Sepenuhnya Independen', waterfall: 1, kanban: 5, hybrid: 3 },
      ]),
    },
    {
      code: 'C14',
      name: 'Kesiapan Infrastruktur & Lingkungan Uji',
      question: 'Apakah server pengembangan, staging, dan produksi telah siap sejak awal?',
      weight: 0.9,
      orderIndex: 14,
      options: JSON.stringify([
        { label: 'Tersedia Lengkap dengan Pipeline CI/CD', waterfall: 3, kanban: 5, hybrid: 5 },
        { label: 'Tersedia Sebagian, Selesai Bertahap', waterfall: 3, kanban: 3, hybrid: 4 },
        { label: 'Belum Ada, Harus Dibangun Paralel', waterfall: 4, kanban: 2, hybrid: 4 },
      ]),
    },
    {
      code: 'C15',
      name: 'Kebutuhan Visibilitas Harian bagi Tim',
      question: 'Apakah tim memerlukan transparansi aliran tugas harian dan pembatasan beban kerja (WIP)?',
      weight: 1.1,
      orderIndex: 15,
      options: JSON.stringify([
        { label: 'Sangat Memerlukan Papan Kanban Visual & Stand-up', waterfall: 1, kanban: 5, hybrid: 5 },
        { label: 'Cukup Laporan Mingguan dari PM', waterfall: 4, kanban: 2, hybrid: 4 },
        { label: 'Hanya Laporan Bulanan ke Manajemen', waterfall: 5, kanban: 1, hybrid: 3 },
      ]),
    },
  ];

  for (const c of criteriaData) {
    await prisma.methodologyCriterion.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }
  console.log('✓ 15 Methodology Decision Criteria seeded');

  // Sample Assessment for SIMRS Project
  const sampleAssessment = await prisma.methodologyAssessment.create({
    data: {
      projectId: baselineProject.id,
      assessorId: users['pm@hybridpm.local'].id,
      projectName: 'SIMRS Hybrid Rumah Sakit Terpadu',
      waterfallScore: 78.5,
      kanbanScore: 82.0,
      hybridScore: 94.2,
      recommendedMethodology: 'Hybrid',
      rationale: 'Proyek memiliki tenggat waktu regulasi dan pagu anggaran tetap yang memerlukan tata kelola Waterfall (Fase & Gate), namun kecepatan pengembangan modul teknis dan transparansi kerja harian membutuhkan fleksibilitas Kanban dengan batasan WIP.',
    },
  });
  console.log('✓ Methodology assessment record created');

  // 17. Initial Audit Logs
  const auditEntries = [
    { action: 'SYSTEM_INIT', entityType: 'System', details: 'Sistem HybridPM diinisialisasi dengan konfigurasi awal.' },
    { action: 'PROJECT_CREATE', entityType: 'Project', entityId: baselineProject.id, userId: users['pm@hybridpm.local'].id, details: 'Proyek PRJ-2026-001 dibuat oleh Reza Pratama.' },
    { action: 'GATE_APPROVE', entityType: 'Gate', entityId: 'Gate-1', userId: users['owner@hybridpm.local'].id, details: 'Gate 1 (Scope & Plan) disetujui resmi oleh Ir. Budi Santoso.' },
    { action: 'GATE_APPROVE', entityType: 'Gate', entityId: 'Gate-2', userId: users['owner@hybridpm.local'].id, details: 'Gate 2 (SRS Signed) disetujui resmi oleh Ir. Budi Santoso.' },
    { action: 'GATE_APPROVE', entityType: 'Gate', entityId: 'Gate-3', userId: users['owner@hybridpm.local'].id, details: 'Gate 3 (Desain Sistem) disetujui resmi oleh Ir. Budi Santoso.' },
  ];

  for (const a of auditEntries) {
    await prisma.auditLog.create({
      data: {
        ...a,
        projectId: baselineProject.id,
      },
    });
  }
  console.log('✓ Audit logs initial records generated');

  console.log('--- All Seed Data Successfully Inserted ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

