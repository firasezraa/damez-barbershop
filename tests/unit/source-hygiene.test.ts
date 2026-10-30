import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const SRC_ROOT = path.join(REPO_ROOT, "src");
const MAX_SOURCE_LINES = 800;

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(ts|tsx|css)$/.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .sort();
}

const sourceFiles = listSourceFiles(SRC_ROOT);

/**
 * Gate R0 meminta dua hal yang tidak bisa dijamin konfigurasi ESLint proyek ini
 * (berkas eslint.config.mjs diproteksi hook dan tidak boleh diubah agen):
 * tidak ada debug print yang ikut dikirim, dan tidak ada berkas sumber di atas
 * plafon 800 baris. Keduanya diperiksa langsung dari berkas.
 */
describe("source hygiene", () => {
  it("finds source files to check", () => {
    expect(sourceFiles.length).toBeGreaterThan(0);
  });

  it("keeps console.log and debugger out of shipped code", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles) {
      const content = readFileSync(file, "utf8");
      content.split("\n").forEach((line, index) => {
        if (/console\.log\s*\(/.test(line) || /\bdebugger\b/.test(line)) {
          offenders.push(`${path.relative(REPO_ROOT, file)}:${index + 1}`);
        }
      });
    }

    expect(offenders).toEqual([]);
  });

  it(`keeps every source file under ${MAX_SOURCE_LINES} lines`, () => {
    const oversized = sourceFiles
      .map((file) => ({
        file: path.relative(REPO_ROOT, file),
        lines: readFileSync(file, "utf8").split("\n").length,
      }))
      .filter((entry) => entry.lines > MAX_SOURCE_LINES);

    expect(oversized).toEqual([]);
  });

  it("has no file above the ceiling in scripts or tools either", () => {
    const dirs = ["scripts", "tools"].map((dir) => path.join(REPO_ROOT, dir));
    const oversized: string[] = [];

    for (const dir of dirs) {
      for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
        if (!entry.isFile()) {
          continue;
        }
        const file = path.join(entry.parentPath, entry.name);
        const lines = readFileSync(file, "utf8").split("\n").length;
        if (lines > MAX_SOURCE_LINES) {
          oversized.push(`${path.relative(REPO_ROOT, file)} (${lines})`);
        }
      }
    }

    expect(oversized).toEqual([]);
  });

  it("has no committed build artefact at the repo root", () => {
    const suspects = ["preview-enhanced.html", "kanban.md", "KANBAN.md"];
    const present = suspects.filter((name) => {
      try {
        return statSync(path.join(REPO_ROOT, name)).isFile();
      } catch {
        return false;
      }
    });

    expect(present).toEqual([]);
  });
});
