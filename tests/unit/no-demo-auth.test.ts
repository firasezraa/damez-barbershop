import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const SRC_ROOT = path.join(REPO_ROOT, "src");

/** Komentar sering menyebut cacat v1 sebagai catatan; yang diperiksa adalah kode. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function listFiles(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(ts|tsx)$/.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .sort();
}

const sourceFiles = listFiles(SRC_ROOT);

/**
 * Penjaga regresi, bukan dokumentasi niat. Cacat v1 (IDEA.md §2.1) adalah
 * kredensial demo, guard client-side yang membuat sesi owner sendiri, dan sesi
 * di `localStorage` — test ini gagal kalau jejaknya kembali ke `src/`.
 */
describe("tidak ada jejak auth demo", () => {
  it("has source files to inspect", () => {
    expect(sourceFiles.length).toBeGreaterThan(0);
  });

  it("has no hardcoded demo credentials", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles) {
      const code = stripComments(readFileSync(file, "utf8"));
      const matches = code.match(/DEMO_ADMIN_USERS|damez123|admin123/gi);
      if (matches !== null) {
        offenders.push(`${path.relative(REPO_ROOT, file)}: ${matches.join(", ")}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("never reads or writes a session in browser storage", () => {
    const offenders = sourceFiles
      .filter((file) => /localStorage|sessionStorage|document\.cookie/.test(stripComments(readFileSync(file, "utf8"))))
      .map((file) => path.relative(REPO_ROOT, file));

    expect(offenders).toEqual([]);
  });

  it("keeps every admin API route behind requireAdmin", () => {
    // Dua pengecualian yang tak bisa dihindari: endpoint masuk/keluar justru
    // yang membuat sesi, jadi tidak mungkin mensyaratkan sesi lebih dulu.
    const AUTH_ENTRY_POINTS = new Set([
      path.join("app", "api", "admin", "auth", "sign-in", "route.ts"),
      path.join("app", "api", "admin", "auth", "sign-out", "route.ts"),
    ]);

    // Daftar pengecualian tidak boleh tumbuh diam-diam.
    expect(AUTH_ENTRY_POINTS.size).toBe(2);

    const routes = listFiles(path.join(SRC_ROOT, "app", "api", "admin"));
    expect(routes.length).toBeGreaterThan(AUTH_ENTRY_POINTS.size);

    const unguarded = routes
      .filter((route) => !AUTH_ENTRY_POINTS.has(path.relative(SRC_ROOT, route)))
      .filter((route) => !readFileSync(route, "utf8").includes("requireAdmin("))
      .map((route) => path.relative(REPO_ROOT, route));

    expect(unguarded).toEqual([]);
  });

  it("has no page that invents an owner session", () => {
    const pages = [
      ...listFiles(path.join(SRC_ROOT, "app", "admin")),
      ...listFiles(path.join(SRC_ROOT, "components")),
    ];

    const inventing = pages
      .filter((file) => /role:\s*["']owner["']/.test(readFileSync(file, "utf8")))
      .map((file) => path.relative(REPO_ROOT, file));

    expect(inventing).toEqual([]);
  });
});
