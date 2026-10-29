/**
 * Pemeriksaan berkas `.env` tanpa bergantung pada pembaca env Node.
 *
 * Alasan: `node --env-file-if-exists=.env` diam saja kalau berkasnya bernama lain
 * (Notepad menyimpan `.env` sebagai `.env.txt`) atau tersimpan sebagai UTF-16/BOM.
 * Gejalanya menyesatkan — skrip melaporkan "DATABASE_URL belum diset" padahal
 * berkasnya ada dan sudah diisi. Fungsi di sini memeriksa byte mentahnya supaya
 * pesan galat bisa menunjuk sebab sebenarnya.
 *
 * Nilai rahasia tidak pernah dikembalikan ke pemanggil; hanya status per variabel.
 */

export type EnvFileIssue =
  | "missing-file"
  | "utf16"
  | "utf8-bom"
  | "no-values"
  | "placeholder-value";

export type EnvFileReport = {
  exists: boolean;
  issues: EnvFileIssue[];
  /** Nama variabel yang punya nilai tidak kosong. */
  present: string[];
  /** Nama variabel yang muncul tapi nilainya kosong. */
  empty: string[];
  /** Nama variabel yang nilainya tampak masih placeholder (mis. `***`). */
  placeholders: string[];
};

const UTF16_LE_BOM = [0xff, 0xfe];
const UTF16_BE_BOM = [0xfe, 0xff];
const UTF8_BOM = [0xef, 0xbb, 0xbf];

/** Nilai yang jelas belum diisi sungguhan oleh pengguna. */
const PLACEHOLDER_PATTERN = /^(\*+|<.*>|changeme|ganti-ini|pilih-sendiri)$/i;

function startsWith(bytes: Uint8Array, prefix: number[]): boolean {
  if (bytes.length < prefix.length) {
    return false;
  }
  return prefix.every((byte, index) => bytes[index] === byte);
}

export function inspectEnvFile(bytes: Uint8Array, keys: readonly string[]): EnvFileReport {
  const report: EnvFileReport = {
    exists: true,
    issues: [],
    present: [],
    empty: [],
    placeholders: [],
  };

  if (startsWith(bytes, UTF16_LE_BOM) || startsWith(bytes, UTF16_BE_BOM)) {
    // UTF-16 tidak bisa dibaca `--env-file`; menebak isinya berisiko, jadi berhenti.
    return { ...report, issues: ["utf16"] };
  }

  if (startsWith(bytes, UTF8_BOM)) {
    report.issues.push("utf8-bom");
  }

  const text = new TextDecoder("utf-8").decode(bytes).replace(/^\uFEFF/, "");
  const values = new Map<string, string>();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator <= 0) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1")
      .replace(/^'(.*)'$/, "$1");
    values.set(key, value);
  }

  if (values.size === 0) {
    report.issues.push("no-values");
  }

  for (const key of keys) {
    const value = values.get(key);

    if (value === undefined || value.length === 0) {
      report.empty.push(key);
      continue;
    }

    if (PLACEHOLDER_PATTERN.test(value) || value.includes("***")) {
      report.placeholders.push(key);
      continue;
    }

    report.present.push(key);
  }

  if (report.placeholders.length > 0) {
    report.issues.push("placeholder-value");
  }

  return report;
}

/** Nilai variabel dari teks `.env`, untuk dipakai saat `--env-file` tidak jalan. */
export function envValuesFromText(text: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/^\uFEFF/, "").trim();
    if (line.length === 0 || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator <= 0) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^"(.*)"$/, "$1")
      .replace(/^'(.*)'$/, "$1");

    if (value.length > 0) {
      values[key] = value;
    }
  }

  return values;
}