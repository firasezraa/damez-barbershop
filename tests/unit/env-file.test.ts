import { describe, expect, it } from "vitest";
import { envValuesFromText, inspectEnvFile } from "../../scripts/env-file-lib.ts";

const KEYS = ["DATABASE_URL", "TEST_DATABASE_URL", "MOCK_MIDTRANS"] as const;

function utf8(text: string, withBom = false): Uint8Array {
  const body = new TextEncoder().encode(text);
  if (!withBom) {
    return body;
  }
  const bytes = new Uint8Array(body.length + 3);
  bytes.set([0xef, 0xbb, 0xbf], 0);
  bytes.set(body, 3);
  return bytes;
}

/** UTF-16LE dengan BOM, seperti berkas yang ditulis Notepad sebagai "Unicode". */
function utf16le(text: string): Uint8Array {
  const bytes = new Uint8Array(2 + text.length * 2);
  bytes[0] = 0xff;
  bytes[1] = 0xfe;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    bytes[2 + index * 2] = code & 0xff;
    bytes[2 + index * 2 + 1] = code >> 8;
  }
  return bytes;
}

const GOOD = "DATABASE_URL=postgresql://damez:rahasia@127.0.0.1:5432/damez_dev\nTEST_DATABASE_URL=postgresql://damez:rahasia@127.0.0.1:5432/damez_test\n";

describe("inspectEnvFile", () => {
  it("reports required keys that are present and ignores comments", () => {
    const report = inspectEnvFile(utf8(`# contoh\n${GOOD}\n# MOCK_MIDTRANS=true\n`), KEYS);

    expect(report.present).toEqual(["DATABASE_URL", "TEST_DATABASE_URL"]);
    expect(report.empty).toEqual(["MOCK_MIDTRANS"]);
    expect(report.issues).toEqual([]);
  });

  it("understands CRLF, which is what Windows editors write", () => {
    const crlf = GOOD.replace(/\n/g, "\r\n");
    const report = inspectEnvFile(utf8(crlf), KEYS);

    expect(report.present).toContain("DATABASE_URL");
    expect(report.issues).toEqual([]);
  });

  it("stops at UTF-16 because Node cannot read it", () => {
    const report = inspectEnvFile(utf16le(GOOD), KEYS);

    expect(report.issues).toEqual(["utf16"]);
    expect(report.present).toEqual([]);
  });

  it("notes a UTF-8 BOM but still reads the values", () => {
    const report = inspectEnvFile(utf8(GOOD, true), KEYS);

    expect(report.issues).toEqual(["utf8-bom"]);
    expect(report.present).toContain("DATABASE_URL");
  });

  it("flags documentation placeholders instead of treating them as passwords", () => {
    const report = inspectEnvFile(
      utf8("DATABASE_URL=postgresql://damez:***@127.0.0.1:5432/damez_dev\nTEST_DATABASE_URL=<isi-sendiri>\n"),
      KEYS,
    );

    expect(report.issues).toContain("placeholder-value");
    expect(report.placeholders).toEqual(["DATABASE_URL", "TEST_DATABASE_URL"]);
    expect(report.present).toEqual([]);
  });

  it("flags a file with no KEY=VALUE pair at all", () => {
    const report = inspectEnvFile(utf8("# hanya komentar\n\n"), KEYS);

    expect(report.issues).toEqual(["no-values"]);
  });

  it("accepts quoted values, which editors add on their own", () => {
    const report = inspectEnvFile(
      utf8('DATABASE_URL="postgresql://damez:rahasia@127.0.0.1:5432/damez_dev"\n'),
      KEYS,
    );

    expect(report.present).toEqual(["DATABASE_URL"]);
  });
});

describe("envValuesFromText", () => {
  it("returns only keys that have a value", () => {
    const values = envValuesFromText(`# komentar\nDATABASE_URL=postgresql://x:y@127.0.0.1:5432/z\nEMPTY=\nMOCK_MIDTRANS="true"\n`);

    expect(values).toEqual({
      DATABASE_URL: "postgresql://x:y@127.0.0.1:5432/z",
      MOCK_MIDTRANS: "true",
    });
  });

  it("strips a leading BOM so the first key is not lost", () => {
    const values = envValuesFromText("\uFEFFDATABASE_URL=postgresql://x:y@127.0.0.1:5432/z\n");

    expect(values["DATABASE_URL"]).toBe("postgresql://x:y@127.0.0.1:5432/z");
  });
});