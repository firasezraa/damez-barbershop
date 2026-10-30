import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SLOT_STATES, type SlotState } from "../../src/components/ui/slot-cell.tsx";

/**
 * Token dibaca dari berkas CSS-nya, bukan dari salinan di test: kalau seseorang
 * menukar hex di `globals.css` sampai di bawah ambang AA, test ini gagal. Itu
 * cara membuat aturan kontras §17.4 punya gigi.
 */

const cssPath = path.resolve(import.meta.dirname, "../../src/app/globals.css");
const css = readFileSync(cssPath, "utf8");

function token(name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  if (match === null || match[1] === undefined) {
    throw new Error(`Token --${name} tidak ditemukan di globals.css`);
  }
  return match[1];
}

function relativeLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const channels = [0, 2, 4].map((offset) => {
    const value = Number.parseInt(clean.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const [r = 0, g = 0, b = 0] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const INK = "#0b0b0c";
const SURFACE = "#141417";

describe("token warna", () => {
  it("tidak memuat dua nilai yang gagal AA dan sudah diganti di §17.4", () => {
    expect(css.toLowerCase()).not.toContain("#7a6a3f");
    expect(css.toLowerCase()).not.toContain("#8b8781");
  });

  it.each([
    ["text", INK],
    ["text", SURFACE],
    ["muted", INK],
    ["muted", SURFACE],
    ["ghost", INK],
    ["punched", INK],
    ["brass", INK],
    ["brass", SURFACE],
    ["brass-deep", INK],
    ["danger", INK],
    ["ok", INK],
  ])("token %s lulus 4,5:1 di atas %s", (name, background) => {
    const ratio = contrast(token(`color-${name}`), background);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("teks tombol lulus di atas brass", () => {
    expect(contrast("#141416", token("color-brass"))).toBeGreaterThanOrEqual(4.5);
  });

  it("teks tiket lulus di atas kertas", () => {
    expect(contrast(token("color-paper-ink"), token("color-paper"))).toBeGreaterThanOrEqual(4.5);
  });
});

describe("kosakata keadaan kursi", () => {
  const expected: SlotState[] = [
    "scheduled",
    "free",
    "rest",
    "chosen",
    "held",
    "done",
    "no_show",
    "cancelled",
  ];

  it("mendefinisikan tepat delapan keadaan", () => {
    expect(Object.keys(SLOT_STATES).sort()).toEqual([...expected].sort());
  });

  it("setiap keadaan punya label teks sendiri, jadi tidak ada yang hanya dibedakan warna", () => {
    for (const state of expected) {
      expect(SLOT_STATES[state].label.length).toBeGreaterThan(0);
    }

    const labels = expected.map((state) => SLOT_STATES[state].label);
    expect(new Set(labels).size).toBe(expected.length);
  });

  it("setiap keadaan punya bentuk, bukan sekadar kelas warna", () => {
    for (const state of expected) {
      const shape = SLOT_STATES[state].shape;
      const hasShape = /border|self-stretch|rounded/.test(shape);
      expect(hasShape, `keadaan ${state} tidak punya bentuk`).toBe(true);
    }
  });
});
