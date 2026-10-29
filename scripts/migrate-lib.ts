import { createHash } from "node:crypto";

/**
 * Fungsi murni milik runner migrasi. Dipisah dari CLI supaya bisa diuji tanpa
 * database. Yang paling mudah salah: memotong isi fungsi PL/pgSQL ber-`$$`,
 * yang berisi titik koma dan tidak boleh dipecah.
 */

/** Memecah berkas SQL menjadi statement, sadar komentar, string, dan dollar quote. */
export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let i = 0;

  while (i < sql.length) {
    const char = sql[i] as string;
    const next = sql[i + 1];

    if (char === "-" && next === "-") {
      while (i < sql.length && sql[i] !== "\n") i += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      i += 2;
      while (i < sql.length && !(sql[i] === "*" && sql[i + 1] === "/")) i += 1;
      i += 2;
      continue;
    }

    if (char === "'" || char === '"') {
      current += char;
      i += 1;
      while (i < sql.length) {
        const inner = sql[i] as string;
        current += inner;
        i += 1;
        if (inner === char) {
          if (sql[i] === char) {
            current += char;
            i += 1;
            continue;
          }
          break;
        }
      }
      continue;
    }

    if (char === "$") {
      const tag = /^\$[A-Za-z_0-9]*\$/.exec(sql.slice(i))?.[0];
      if (tag !== undefined) {
        const end = sql.indexOf(tag, i + tag.length);
        if (end === -1) {
          current += sql.slice(i);
          break;
        }
        current += sql.slice(i, end + tag.length);
        i = end + tag.length;
        continue;
      }
    }

    if (char === ";") {
      statements.push(current.trim());
      current = "";
      i += 1;
      continue;
    }

    current += char;
    i += 1;
  }

  const tail = current.trim();
  if (tail.length > 0) statements.push(tail);

  return statements.filter((statement) => statement.length > 0);
}

function numericPrefix(name: string): number {
  const match = /^(\d+)/.exec(name);
  return match?.[1] === undefined ? Number.MAX_SAFE_INTEGER : Number(match[1]);
}

/** Urut berdasarkan prefix numerik, bukan urutan leksikografis string. */
export function sortMigrationFiles(names: string[]): string[] {
  return [...names].sort(
    (left, right) => numericPrefix(left) - numericPrefix(right) || left.localeCompare(right),
  );
}

/** SHA-256 hex dari isi berkas migrasi — mendeteksi migrasi terterap yang diubah. */
export function checksum(sql: string): string {
  return createHash("sha256").update(sql, "utf8").digest("hex");
}
