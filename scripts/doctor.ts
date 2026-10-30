import { existsSync, readFileSync } from "node:fs";
import { envValuesFromText, inspectEnvFile } from "./env-file-lib.ts";

/**
 * `npm run doctor` — memeriksa setup lokal dan menunjuk sebabnya, bukan menebak.
 *
 * Yang diperiksa: berkas `.env` (nama, encoding, placeholder), variabel wajib,
 * koneksi database, versi migrasi, dan isi katalog. Nilai rahasia tidak pernah
 * dicetak; hanya namanya, dan hanya kalau bermasalah.
 */

const REQUIRED_KEYS = ["DATABASE_URL", "TEST_DATABASE_URL"] as const;
const OPTIONAL_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "MIDTRANS_SERVER_KEY",
  "MIDTRANS_IS_PRODUCTION",
  "MOCK_MIDTRANS",
  "MOCK_WHATSAPP",
  "CRON_SECRET",
] as const;

const ENV_PATH = ".env";
let failures = 0;

function fail(message: string, hint: string): void {
  failures += 1;
  console.log(`GAGAL  ${message}`);
  console.log(`       → ${hint}`);
}

function ok(message: string): void {
  console.log(`OK     ${message}`);
}

function warn(message: string): void {
  console.log(`PERIKSA ${message}`);
}

function readEnvFile(): Record<string, string> {
  console.log("== Berkas .env ==");

  const candidates = [".env", ".env.txt", ".env.local"];

  if (!existsSync(ENV_PATH)) {
    const found = candidates.filter((name) => existsSync(name));
    fail(
      `${ENV_PATH} tidak ada di ${process.cwd()}`,
      found.length > 0
        ? `Ada berkas mirip: ${found.join(", ")}. Ganti nama jadi .env (PowerShell: Rename-Item "${found[0]}" .env).`
        : "Buat dari contoh: Copy-Item .env.example .env lalu isi DATABASE_URL dan TEST_DATABASE_URL.",
    );
    return {};
  }

  const bytes = readFileSync(ENV_PATH);
  const report = inspectEnvFile(bytes, [...REQUIRED_KEYS, ...OPTIONAL_KEYS]);

  if (report.issues.includes("utf16")) {
    fail(
      ".env tersimpan sebagai UTF-16 sehingga tidak bisa dibaca Node",
      'Tulis ulang sebagai UTF-8 tanpa BOM: [IO.File]::WriteAllText("$PWD\\.env", (Get-Content .env -Raw) -replace "\\r","", (New-Object System.Text.UTF8Encoding($false)))',
    );
    return {};
  }

  if (report.issues.includes("utf8-bom")) {
    warn(".env punya BOM UTF-8; biasanya tetap terbaca, tapi lebih bersih tanpa BOM.");
  }

  if (report.issues.includes("no-values")) {
    fail(".env tidak memuat satu pun baris KEY=VALUE", "Isi minimal DATABASE_URL dan TEST_DATABASE_URL.");
    return {};
  }

  if (report.placeholders.length > 0) {
    fail(
      `.env masih memakai nilai contoh pada: ${report.placeholders.join(", ")}`,
      "Nilai seperti *** atau <...> adalah placeholder dokumentasi. Tulis password asli role damez.",
    );
  }

  if (report.empty.length > 0) {
    const missingRequired = report.empty.filter((key) =>
      (REQUIRED_KEYS as readonly string[]).includes(key),
    );
    if (missingRequired.length > 0) {
      fail(`Variabel wajib masih kosong: ${missingRequired.join(", ")}`, "Isi nilainya di .env.");
    }

    const emptyOptional = report.empty.filter((key) => !missingRequired.includes(key));
    if (emptyOptional.length > 0) {
      warn(`kosong (opsional untuk menjalankan aplikasi): ${emptyOptional.join(", ")}`);
    }
  }

  if (failures === 0) {
    ok(`${report.present.length} variabel terbaca dari .env`);
  }

  return envValuesFromText(new TextDecoder("utf-8").decode(bytes));
}

async function checkDatabase(values: Record<string, string>): Promise<void> {
  console.log("");
  console.log("== Database ==");

  const databaseUrl = process.env["DATABASE_URL"] ?? values["DATABASE_URL"] ?? "";

  if (databaseUrl.length === 0) {
    fail("DATABASE_URL belum ada", "Perbaiki .env dulu; langkah database dilewati.");
    return;
  }

  process.env["DATABASE_URL"] = databaseUrl;

  const { createPgPool } = await import("../src/lib/db/pg.ts");
  const pool = createPgPool(databaseUrl, 1);

  try {
    const info = await pool.query<{ version: string; tz: string }>(
      "SELECT version() AS version, current_setting('TimeZone') AS tz",
    );
    const version = (info.rows[0]?.version ?? "").split(" ").slice(0, 2).join(" ");
    ok(`tersambung ke ${version} (sesi ${info.rows[0]?.tz ?? "?"})`);

    const tables = await pool.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM information_schema.tables WHERE table_schema = 'public'",
    );
    const tableCount = Number(tables.rows[0]?.count ?? "0");

    if (tableCount === 0) {
      fail("skema belum ada di database ini", "Jalankan: npm run migrate");
    } else {
      ok(`${tableCount} tabel di schema public`);
    }

    const applied = await pool.query<{ version: string }>(
      "SELECT version FROM public.schema_migrations ORDER BY version",
    ).catch(() => ({ rows: [] as { version: string }[] }));

    if (applied.rows.length === 0 && tableCount > 0) {
      warn("tabel schema_migrations kosong; skema mungkin dipasang di luar runner ini");
    } else if (applied.rows.length > 0) {
      ok(`migrasi diterapkan: ${applied.rows.map((row) => row.version.slice(0, 4)).join(", ")}`);
    }

    if (tableCount > 0) {
      const counts = await pool.query<{
        services: string;
        barbers: string;
        active_services: string;
      }>(
        `SELECT
           (SELECT count(*) FROM public.services)::text AS services,
           (SELECT count(*) FROM public.barbers)::text AS barbers,
           (SELECT count(*) FROM public.services WHERE is_active)::text AS active_services`,
      );
      const row = counts.rows[0];

      if (Number(row?.active_services ?? "0") === 0) {
        fail("katalog kosong sehingga beranda tidak menampilkan layanan", "Jalankan: npm run seed");
      } else {
        ok(`katalog terisi: ${row?.active_services} layanan aktif, ${row?.barbers} barber`);
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "galat tidak dikenal";
    fail(`tidak bisa tersambung ke database: ${message}`, connectionHint(message));
  } finally {
    await pool.end();
  }
}

function connectionHint(message: string): string {
  if (/ECONNREFUSED/i.test(message)) {
    return "Service PostgreSQL berhenti atau port salah. PowerShell: Start-Service postgresql-x64-16, cek netstat -ano | findstr :5432";
  }

  if (/password authentication failed/i.test(message)) {
    return "Password di DATABASE_URL tidak sama dengan yang dipakai saat CREATE ROLE. Setel ulang: ALTER ROLE damez WITH PASSWORD 'baru';";
  }

  if (/does not exist/i.test(message)) {
    return "Nama database atau role belum dibuat. PowerShell: createdb -U postgres -O damez damez_dev";
  }

  if (/self.signed|unable to verify|ALTERNATIVE/i.test(message)) {
    return "TLS host remote: pin root CA lewat PG_SSL_CA_PATH, jangan matikan verifikasi.";
  }

  return "Periksa DATABASE_URL: postgresql://USER:PASSWORD@127.0.0.1:5432/NAMA_DATABASE";
}

const values = readEnvFile();
await checkDatabase(values);

console.log("");
if (failures === 0) {
  console.log("Hasil: setup lokal siap. Lanjut: npm run dev");
  process.exit(0);
}

console.log(`Hasil: ${failures} masalah perlu diperbaiki (lihat baris GAGAL di atas).`);
process.exit(1);
