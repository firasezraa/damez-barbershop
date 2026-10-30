import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Penjaga regresi: satu kali CI merah karena `next/font/google` tidak bisa
 * di-resolve saat build (modul `@vercel/turbopack-next/internal/font/google/font`).
 * Huruf sekarang tinggal di repo dan dimuat lewat `next/font/local`, jadi build
 * tidak bergantung jaringan. Test ini menegakkan dua hal: tidak ada impor
 * `next/font/google` yang kembali, dan berkas hurufnya benar-benar ada.
 */
const AKAR = "src";

function berkasSumber(direktori: string): string[] {
  const hasil: string[] = [];

  for (const entri of readdirSync(direktori)) {
    const jalur = join(direktori, entri);
    if (statSync(jalur).isDirectory()) {
      hasil.push(...berkasSumber(jalur));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entri)) {
      hasil.push(jalur);
    }
  }

  return hasil;
}

describe("huruf dilayani dari repo", () => {
  it("tidak ada berkas sumber yang mengimpor next/font/google", () => {
    const pelanggar = berkasSumber(AKAR).filter((jalur) =>
      /from\s+["']next\/font\/google["']/.test(readFileSync(jalur, "utf8")),
    );

    expect(pelanggar).toEqual([]);
  });

  it("berkas huruf ada, berformat woff2, dan tidak kosong", () => {
    for (const nama of ["archivo-latin-var.woff2", "spline-sans-mono-latin-400.woff2"]) {
      const jalur = join("src", "app", "fonts", nama);
      const isi = readFileSync(jalur);

      expect(isi.length).toBeGreaterThan(10_000);
      expect(isi.subarray(0, 4).toString("latin1")).toBe("wOF2");
    }
  });
});