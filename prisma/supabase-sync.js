/**
 * Supabase Synchronization & Verification Runner (Audited & Hardened v6)
 * HybridPM - Strict, Non-Destructive Deployment Script
 *
 * Menggunakan arsitektur isolated subprocess worker untuk database querying di Windows,
 * sehingga mencegah Windows DLL lock (EPERM) saat Prisma Client SQLite dipulihkan.
 */
const fs = require('fs');
const path = require('path');
const { execSync: defaultExecSync } = require('child_process');

const NPX_BIN = process.platform === 'win32' ? 'npx.cmd' : 'npx';

// 31 Tabel aktual yang diekstrak langsung dari model dan @@map di schema.prisma
const EXPECTED_TABLES = [
  'roles', 'users', 'projects', 'project_members', 'project_phases',
  'project_gates', 'gate_approvals', 'project_charters', 'project_scopes',
  'tasks', 'task_comments', 'task_attachments', 'task_status_histories',
  'wbs_items', 'milestones', 'risks', 'risk_mitigations', 'documents',
  'document_versions', 'notifications', 'meetings', 'meeting_participants',
  'communication_logs', 'change_requests', 'budgets', 'budget_items',
  'expenses', 'methodology_criteria', 'methodology_assessments',
  'methodology_answers', 'audit_logs'
];

/**
 * Ekstraksi informasi koneksi aman tanpa menampilkan username atau password
 */
function getSafeConnectionInfo(urlString) {
  if (!urlString) return { host: 'N/A', port: 'N/A', database: 'N/A', region: 'N/A' };
  try {
    const parsed = new URL(urlString);
    let region = 'Unknown';
    if (parsed.hostname.includes('ap-southeast-2')) {
      region = 'ap-southeast-2 (Australia / Sydney)';
    } else if (parsed.hostname.includes('ap-southeast-1')) {
      region = 'ap-southeast-1 (Singapore)';
    }
    return {
      host: parsed.hostname,
      port: parsed.port || (urlString.includes(':6543') ? '6543' : '5432'),
      database: parsed.pathname.replace(/^\//, '') || 'postgres',
      region: region,
      isPooler: parsed.port === '6543' || urlString.includes('pgbouncer=true')
    };
  } catch (e) {
    return { host: 'Invalid URL Format', port: 'N/A', database: 'N/A', region: 'N/A' };
  }
}

/**
 * Memeriksa tabel mana saja dari daftar yang sudah memiliki record (> 0)
 */
async function getPopulatedTables(prismaClient, tableList) {
  if (!tableList || tableList.length === 0) return [];
  const unionSql = tableList
    .map(tbl => `SELECT '${tbl}' AS tbl, COUNT(*)::bigint AS cnt FROM "${tbl}"`)
    .join(' UNION ALL ');
  const rows = await prismaClient.$queryRawUnsafe(unionSql);
  return (rows || [])
    .filter(r => Number(r.cnt) > 0)
    .map(r => ({ table: r.tbl, count: Number(r.cnt) }));
}

/**
 * Membaca dan memvalidasi file .env.supabase secara eksplisit
 */
function loadSupabaseEnv(customPath) {
  const envPath = customPath || path.resolve(__dirname, '../.env.supabase');
  if (!fs.existsSync(envPath)) {
    throw new Error(
      'File .env.supabase tidak ditemukan!\n' +
      'Silakan buat file .env.supabase di root project (C:\\xampp\\htdocs\\hybridpm\\.env.supabase).'
    );
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }

  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL tidak ditemukan di dalam .env.supabase!');
  }
  if (!env.DIRECT_URL) {
    throw new Error('DIRECT_URL tidak ditemukan di dalam .env.supabase!');
  }

  // Validasi protokol PostgreSQL
  if (!env.DATABASE_URL.startsWith('postgresql://') && !env.DATABASE_URL.startsWith('postgres://')) {
    throw new Error('DATABASE_URL di .env.supabase harus berprotokol PostgreSQL (postgresql://), bukan SQLite!');
  }
  if (!env.DIRECT_URL.startsWith('postgresql://') && !env.DIRECT_URL.startsWith('postgres://')) {
    throw new Error('DIRECT_URL di .env.supabase harus berprotokol PostgreSQL (postgresql://)!');
  }

  // Validasi placeholder
  if (env.DATABASE_URL.includes('[PROJECT-REF]') || env.DATABASE_URL.includes('[YOUR-PASSWORD]')) {
    throw new Error('DATABASE_URL masih berisi teks placeholder [PROJECT-REF] atau [YOUR-PASSWORD]!');
  }
  if (env.DIRECT_URL.includes('[PROJECT-REF]') || env.DIRECT_URL.includes('[YOUR-PASSWORD]')) {
    throw new Error('DIRECT_URL masih berisi teks placeholder [PROJECT-REF] atau [YOUR-PASSWORD]!');
  }

  // Validasi Region ap-southeast-2
  if (!env.DATABASE_URL.includes('ap-southeast-2')) {
    console.warn('⚠️ Catatan: Host DATABASE_URL tidak mengandung ap-southeast-2.');
  }

  return env;
}

/**
 * Pemulihan terjamin ke Prisma Client SQLite
 */
function restoreSqliteClient(options = {}) {
  const silent = options.silent || false;
  const exec = options.execSync || defaultExecSync;
  try {
    if (!silent) console.log('\n[PEMULIHAN] Mengembalikan Prisma Client lokal ke SQLite (dev.db)...');
    exec(`${NPX_BIN} prisma generate --schema=prisma/schema.sqlite.prisma`, {
      stdio: silent ? 'ignore' : 'inherit',
    });
    if (!silent) {
      console.log('      ✓ Prisma Client lokal BERHASIL dipulihkan ke SQLite (dev.db).');
      console.log('      ✓ Perintah "npm run dev" siap dijalankan dengan database lokal.');
    }
    return true;
  } catch (restoreErr) {
    console.error('\n⚠️ PERINGATAN KRITIS: Gagal memulihkan Prisma Client ke SQLite secara otomatis!');
    console.error('Penyebab:', restoreErr.message);
    console.error('Solusi Manual: Silakan jalankan perintah berikut di terminal:');
    console.error(`  ${NPX_BIN} prisma generate --schema=prisma/schema.sqlite.prisma\n`);
    return false;
  }
}

/**
 * Helper eksekusi worker subprocess untuk live database queries
 */
function callWorker(action, execEnv, execSyncFn = defaultExecSync) {
  const scriptPath = path.resolve(__dirname, 'supabase-sync.js');
  const cmd = `node "${scriptPath}" --internal-worker=${action}`;
  const rawOut = execSyncFn(cmd, {
    env: execEnv,
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe']
  });

  const markerStart = '__SYNC_RESULT_START__';
  const markerEnd = '__SYNC_RESULT_END__';
  const startIdx = rawOut.indexOf(markerStart);
  const endIdx = rawOut.indexOf(markerEnd);

  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`Worker ${action} tidak mengembalikan output yang valid:\n${rawOut}`);
  }

  const jsonStr = rawOut.slice(startIdx + markerStart.length, endIdx).trim();
  const parsed = JSON.parse(jsonStr);
  if (parsed.error) {
    throw new Error(`Worker ${action} gagal: ${parsed.error}`);
  }
  return parsed.data;
}

/**
 * Worker Subprocess Execution (Dieksekusi dalam proses terpisah agar tidak mengunci DLL)
 */
async function runInternalWorker(action) {
  let prisma;
  try {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } }
    });

    if (action === 'preflight') {
      const rawPublicTables = await prisma.$queryRawUnsafe(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE';
      `);
      const publicTableNames = (rawPublicTables || []).map(t => t.table_name);
      const existingHybridTables = EXPECTED_TABLES.filter(t => publicTableNames.includes(t));
      const missingHybridTables = EXPECTED_TABLES.filter(t => !publicTableNames.includes(t));
      const supabaseInternalTables = publicTableNames.filter(t => !EXPECTED_TABLES.includes(t));

      let populated = [];
      if (existingHybridTables.length === EXPECTED_TABLES.length) {
        populated = await getPopulatedTables(prisma, EXPECTED_TABLES);
      }

      const result = { existingHybridTables, missingHybridTables, supabaseInternalTables, populated };
      console.log('__SYNC_RESULT_START__' + JSON.stringify({ data: result }) + '__SYNC_RESULT_END__');
      return;
    }

    if (action === 'verify-push') {
      const createdTablesRaw = await prisma.$queryRawUnsafe(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE';
      `);
      const createdTableNames = (createdTablesRaw || []).map(r => r.table_name);
      const existingAfterPush = EXPECTED_TABLES.filter(t => createdTableNames.includes(t));
      const missingAfterPush = EXPECTED_TABLES.filter(t => !createdTableNames.includes(t));
      const populatedBeforeSeed = await getPopulatedTables(prisma, EXPECTED_TABLES);

      const result = { existingAfterPush, missingAfterPush, populatedBeforeSeed };
      console.log('__SYNC_RESULT_START__' + JSON.stringify({ data: result }) + '__SYNC_RESULT_END__');
      return;
    }

    if (action === 'verify-seed') {
      const [rolesCount, usersCount, projectsCount, phasesCount, gatesCount, tasksCount, criteriaCount] = await Promise.all([
        prisma.role.count(),
        prisma.user.count(),
        prisma.project.count(),
        prisma.projectPhase.count(),
        prisma.projectGate.count(),
        prisma.task.count(),
        prisma.methodologyCriterion.count(),
      ]);

      const result = { rolesCount, usersCount, projectsCount, phasesCount, gatesCount, tasksCount, criteriaCount };
      console.log('__SYNC_RESULT_START__' + JSON.stringify({ data: result }) + '__SYNC_RESULT_END__');
      return;
    }

    throw new Error(`Aksi worker tidak dikenali: ${action}`);
  } catch (err) {
    let cleanMessage = (err.message || 'Worker error')
      .replace(/postgres(?:ql)?:\/\/[^@]+@/gi, 'postgresql://****:****@')
      .replace(/password=[^\s&]+/gi, 'password=****');
    console.log('__SYNC_RESULT_START__' + JSON.stringify({ error: cleanMessage }) + '__SYNC_RESULT_END__');
    process.exit(1);
  } finally {
    if (prisma && typeof prisma.$disconnect === 'function') {
      try { await prisma.$disconnect(); } catch (_) {}
    }
  }
}

/**
 * Runner Utama
 */
async function run(options = {}) {
  const exec = options.execSync || defaultExecSync;
  const isMockMode = Boolean(options.PrismaClient);

  console.log('====================================================');
  console.log('   HYBRIDPM — SUPABASE MIGRATION & SEED RUNNER      ');
  console.log('====================================================\n');

  let env;
  try {
    env = options.envOverride || loadSupabaseEnv(options.envPath);
  } catch (loadErr) {
    console.error('❌ Gagal memuat konfigurasi:', loadErr.message);
    process.exitCode = 1;
    return false;
  }

  const dbInfo = getSafeConnectionInfo(env.DATABASE_URL);
  const directInfo = getSafeConnectionInfo(env.DIRECT_URL);

  console.log('[1/8] Verifikasi File Konfigurasi:');
  console.log('      File Sumber            : .env.supabase (eksplisit)');
  console.log('      DATABASE_URL Host      :', dbInfo.host, `(Port ${dbInfo.port})`);
  console.log('      DATABASE_URL Database  :', dbInfo.database);
  console.log('      DIRECT_URL Host        :', directInfo.host, `(Port ${directInfo.port})`);
  console.log('      Region Terdeteksi      :', dbInfo.region);
  console.log('      Status Kredensial      : Password & Username disembunyikan 100%');
  console.log('      Status SQLite Lokal    : File .env lokal tetap utuh (file:./dev.db)\n');

  const execEnv = {
    ...process.env,
    DATABASE_URL: env.DATABASE_URL,
    DIRECT_URL: env.DIRECT_URL,
  };

  let pipelineSuccess = false;
  let restoreSuccess = false;

  try {
    // 2. Generate Prisma Client for PostgreSQL
    console.log('[2/8] Meng-generate Prisma Client untuk PostgreSQL schema...');
    exec(`${NPX_BIN} prisma generate --schema=prisma/schema.prisma`, {
      stdio: 'inherit',
      env: execEnv,
    });
    console.log('      ✓ Prisma Client PostgreSQL berhasil dibuat.\n');

    // 3. PRE-FLIGHT CHECK SEBELUM DB PUSH
    console.log('[3/8] PRE-FLIGHT CHECK: Memeriksa koneksi & keberadaan 31 tabel HybridPM...');
    let needsDbPush = false;
    let needsSeed = false;

    let preflightData;
    if (isMockMode) {
      const mockPrisma = new options.PrismaClient({
        datasources: { db: { url: env.DATABASE_URL } },
      });
      try {
        const rawPublicTables = await mockPrisma.$queryRawUnsafe(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE';
        `);
        const publicTableNames = (rawPublicTables || []).map(t => t.table_name);
        const existingHybridTables = EXPECTED_TABLES.filter(t => publicTableNames.includes(t));
        const missingHybridTables = EXPECTED_TABLES.filter(t => !publicTableNames.includes(t));
        const supabaseInternalTables = publicTableNames.filter(t => !EXPECTED_TABLES.includes(t));
        let populated = [];
        if (existingHybridTables.length === EXPECTED_TABLES.length) {
          populated = await getPopulatedTables(mockPrisma, EXPECTED_TABLES);
        }
        preflightData = { existingHybridTables, missingHybridTables, supabaseInternalTables, populated };
      } finally {
        if (typeof mockPrisma.$disconnect === 'function') await mockPrisma.$disconnect();
      }
    } else {
      preflightData = callWorker('preflight', execEnv, exec);
    }

    const { existingHybridTables, missingHybridTables, supabaseInternalTables, populated } = preflightData;

    if (supabaseInternalTables.length > 0) {
      console.log(`      ℹ Info: Terdeteksi ${supabaseInternalTables.length} tabel non-HybridPM/bawaan: [ ${supabaseInternalTables.join(', ')} ] (diabaikan).`);
    }

    // KASUS 1: Belum ada tabel HybridPM sama sekali (0 dari 31)
    if (existingHybridTables.length === 0) {
      console.log('      ✓ Pre-flight: Belum ada tabel HybridPM di database Supabase (0 / 31).');
      console.log('      ✓ Aman untuk melanjutkan ke tahap Prisma db push.\n');
      needsDbPush = true;
      needsSeed = true;
    }
    // KASUS 2: Sebagian tabel HybridPM sudah ada (1 s.d. 30 tabel) -> POTENSI KONFLIK
    else if (existingHybridTables.length > 0 && existingHybridTables.length < EXPECTED_TABLES.length) {
      throw new Error(
        `PRE-FLIGHT DITOLAK: Schema HybridPM terdeteksi tidak lengkap (hanya ${existingHybridTables.length} / 31 tabel ada)!\n` +
        `Tabel HybridPM yang sudah ada (${existingHybridTables.length}): [ ${existingHybridTables.join(', ')} ]\n` +
        `Tabel HybridPM yang belum ada (${missingHybridTables.length}): [ ${missingHybridTables.join(', ')} ]\n` +
        `Untuk menghindari konflik schema atau korupsi relasi, proses dihentikan.\n` +
        `Silakan lakukan pemeriksaan manual pada database Supabase sebelum melanjutkan.`
      );
    }
    // KASUS 3: Seluruh 31 tabel HybridPM sudah ada
    else {
      console.log('      ✓ Seluruh 31 tabel HybridPM sudah ada di Supabase.');
      console.log('      Memeriksa jumlah record pada seluruh 31 tabel sebelum menentukan tindakan...');

      if (populated.length > 0) {
        const detail = populated.map(p => `${p.table} (${p.count} records)`).join(', ');
        console.log(`      ℹ Kondisi Data: Ditemukan ${populated.length} tabel yang sudah berisi data: [ ${detail} ].`);
        console.log('      ℹ Tindakan: db push dan seed DILEWATI untuk menjaga data agar tidak tertimpa/direset.\n');
        needsDbPush = false;
        needsSeed = false;
      } else {
        console.log('      ℹ Kondisi Data: Seluruh 31 tabel HybridPM terverifikasi KOSONG (0 record di semua tabel).');
        console.log('      ℹ Tindakan: db push dilewati (tabel sudah lengkap), siap melanjutkan ke seed.\n');
        needsDbPush = false;
        needsSeed = true;
      }
    }

    // 4. Tahap Prisma db push (Hanya jika tabel HybridPM belum ada)
    if (needsDbPush) {
      console.log('[4/8] Menjalankan Prisma db push ke Supabase PostgreSQL...');
      console.log('      Keamanan: Tidak menggunakan --accept-data-loss atau --force-reset.');
      exec(`${NPX_BIN} prisma db push --schema=prisma/schema.prisma`, {
        stdio: 'inherit',
        env: execEnv,
      });
      console.log('      ✓ Prisma db push berhasil dieksekusi.\n');
    } else {
      console.log('[4/8] Tahap Prisma db push DILEWATI (tabel HybridPM sudah lengkap terbentuk).\n');
    }

    // 5. Verifikasi 31 Tabel Terbentuk & Seluruh Tabel Masih Kosong Sebelum Seed
    console.log('[5/8] Memverifikasi seluruh 31 tabel HybridPM di Supabase...');
    let pushVerifyData;
    if (isMockMode) {
      const mockPrismaVerify = new options.PrismaClient({
        datasources: { db: { url: env.DATABASE_URL } },
      });
      try {
        const createdTablesRaw = await mockPrismaVerify.$queryRawUnsafe(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE';
        `);
        const createdTableNames = (createdTablesRaw || []).map(r => r.table_name);
        const existingAfterPush = EXPECTED_TABLES.filter(t => createdTableNames.includes(t));
        const missingAfterPush = EXPECTED_TABLES.filter(t => !createdTableNames.includes(t));
        const populatedBeforeSeed = await getPopulatedTables(mockPrismaVerify, EXPECTED_TABLES);
        pushVerifyData = { existingAfterPush, missingAfterPush, populatedBeforeSeed };
      } finally {
        if (typeof mockPrismaVerify.$disconnect === 'function') await mockPrismaVerify.$disconnect();
      }
    } else {
      pushVerifyData = callWorker('verify-push', execEnv, exec);
    }

    const { existingAfterPush, missingAfterPush, populatedBeforeSeed } = pushVerifyData;
    console.log(`      Tabel HybridPM terverifikasi: ${existingAfterPush.length} / 31 tabel.`);

    if (missingAfterPush.length > 0) {
      throw new Error(
        `VERIFIKASI TABEL GAGAL: ${missingAfterPush.length} tabel HybridPM belum terbentuk!\n` +
        `Tabel hilang: ${missingAfterPush.join(', ')}`
      );
    }
    console.log('      ✓ Seluruh 31 tabel HybridPM terverifikasi lengkap di Supabase.');

    // Jika seed direncanakan, periksa bahwa SELURUH 31 tabel benar-benar kosong (0 record)
    if (needsSeed) {
      console.log('      Memverifikasi seluruh 31 tabel benar-benar kosong (0 record) sebelum seed...');
      if (populatedBeforeSeed.length > 0) {
        const detail = populatedBeforeSeed.map(p => `${p.table} (${p.count} records)`).join(', ');
        throw new Error(
          `VERIFIKASI PRA-SEED GAGAL: Ditemukan minimal satu record pada ${populatedBeforeSeed.length} tabel: [ ${detail} ]!\n` +
          `Proses seed dibatalkan seketika agar tidak menimpa atau merusak data yang sudah ada.`
        );
      }
      console.log('      ✓ Seluruh 31 tabel terverifikasi 100% KOSONG (0 record di semua tabel). Aman untuk seed.\n');
    } else {
      console.log('      ✓ Database sudah memiliki data operasional. Melewati pemeriksaan pra-seed.\n');
    }

    // 6. Jalankan Seed (Hanya jika needsSeed = true)
    if (needsSeed) {
      console.log('[6/8] Menjalankan prisma/seed.js ke Supabase PostgreSQL...');
      exec('node prisma/seed.js', {
        stdio: 'inherit',
        env: execEnv,
      });
      console.log('      ✓ Seeding data demo ke Supabase selesai.\n');
    } else {
      console.log('[6/8] Tahap seeding DILEWATI (data sudah ada sebelumnya).\n');
    }

    // 7. Verifikasi Integritas Data di Supabase
    console.log('[7/8] Memverifikasi integritas data di Supabase PostgreSQL...');
    let seedVerifyData;
    if (isMockMode) {
      const mockPrismaSeed = new options.PrismaClient({
        datasources: { db: { url: env.DATABASE_URL } },
      });
      try {
        const [rolesCount, usersCount, projectsCount, phasesCount, gatesCount, tasksCount, criteriaCount] = await Promise.all([
          mockPrismaSeed.role.count(),
          mockPrismaSeed.user.count(),
          mockPrismaSeed.project.count(),
          mockPrismaSeed.projectPhase.count(),
          mockPrismaSeed.projectGate.count(),
          mockPrismaSeed.task.count(),
          mockPrismaSeed.methodologyCriterion.count(),
        ]);
        seedVerifyData = { rolesCount, usersCount, projectsCount, phasesCount, gatesCount, tasksCount, criteriaCount };
      } finally {
        if (typeof mockPrismaSeed.$disconnect === 'function') await mockPrismaSeed.$disconnect();
      }
    } else {
      seedVerifyData = callWorker('verify-seed', execEnv, exec);
    }

    const { rolesCount, usersCount, projectsCount, phasesCount, gatesCount, tasksCount, criteriaCount } = seedVerifyData;

    console.log(`      ✓ Roles                : ${rolesCount} (Target: 5)`);
    console.log(`      ✓ Users (Demo Accounts): ${usersCount} (Target: 10)`);
    console.log(`      ✓ Projects             : ${projectsCount} (Target: 1)`);
    console.log(`      ✓ Waterfall Phases     : ${phasesCount} (Target: 7)`);
    console.log(`      ✓ Project Gates        : ${gatesCount} (Target: 7)`);
    console.log(`      ✓ Kanban Tasks         : ${tasksCount} (Target: 13)`);
    console.log(`      ✓ Methodology Criteria : ${criteriaCount} (Target: 15)`);

    if (usersCount < 10 || projectsCount < 1 || gatesCount < 7) {
      throw new Error('VERIFIKASI DATA DEMO GAGAL: Jumlah record tidak memenuhi target minimum!');
    }

    pipelineSuccess = true;
  } catch (pipelineError) {
    console.error('\n❌ PIPELINE TERHENTI KARENA ERROR:', pipelineError.message);
    console.error('Catatan: Tahapan selanjutnya dibatalkan untuk menjaga integritas database.');
    process.exitCode = 1;
    pipelineSuccess = false;
  } finally {
    // 8. Mekanisme FINALLY: Selalu pulihkan Prisma Client lokal ke SQLite
    restoreSuccess = restoreSqliteClient({
      silent: options.silentRestore || false,
      execSync: options.restoreExecSync || exec
    });
    if (!restoreSuccess) {
      process.exitCode = 1;
      pipelineSuccess = false;
    }
  }

  if (pipelineSuccess && restoreSuccess) {
    console.log('\n====================================================');
    console.log('   MIGRASI & SEED SUPABASE SELESAI 100% SUKSES!     ');
    console.log('====================================================\n');
    return true;
  } else {
    console.log('\n====================================================');
    console.log('   PROSES MIGRATION/SEED SELESAI DENGAN ERROR       ');
    console.log('====================================================\n');
    process.exitCode = 1;
    return false;
  }
}

// Handler jika file dieksekusi langsung
if (require.main === module) {
  const workerArg = process.argv.find(a => a.startsWith('--internal-worker='));
  if (workerArg) {
    const action = workerArg.split('=')[1];
    runInternalWorker(action);
  } else {
    run();
  }
}

module.exports = {
  EXPECTED_TABLES,
  getSafeConnectionInfo,
  getPopulatedTables,
  loadSupabaseEnv,
  restoreSqliteClient,
  run
};
