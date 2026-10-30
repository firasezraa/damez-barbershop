/**
 * Helper bersama untuk rule batas modul. Semua rule memakai jalur absolut
 * (`context.filename`) supaya hasilnya sama saat dijalankan dari ESLint CLI
 * maupun dari RuleTester.
 */

/** Normalisasi pemisah jalur supaya rule jalan di Linux dan Windows. */
export function normalizePath(filename) {
  return filename.split("\\").join("/");
}

export function isInsideRepoPath(filename, segment) {
  return normalizePath(filename).includes(segment);
}

/** Direktif `'use client'` hanya sah di awal berkas; ESLint menandainya di `directive`. */
export function hasUseClientDirective(program) {
  return program.body.some(
    (statement) => statement.type === "ExpressionStatement" && statement.directive === "use client",
  );
}

export function isServerOnlyModule(source) {
  return source === "server-only" || source.startsWith("server-only/");
}
