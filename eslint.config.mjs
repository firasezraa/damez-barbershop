// Konfigurasi ESLint 9 (flat). Aturan batas modul datang dari plugin lokal
// tools/eslint-rules yang sendirinya diuji di tests/unit/eslint-rules.test.ts.
import nextConfig from "eslint-config-next";
import boundaries from "./tools/eslint-rules/index.js";

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },
  ...nextConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "damez-boundaries": boundaries },
    rules: {
      "damez-boundaries/no-lib-to-features": "error",
      "damez-boundaries/no-server-db-in-client": "error",
      "damez-boundaries/no-direct-db-in-api-route": "error",
      // Tanpa debug print di kode yang ikut dikirim: permintaan §Gate R0.
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.name='console'][property.name='log']",
          message:
            "Jangan tinggalkan console.log di kode yang dikirim. Pakai console.error (boleh di src/lib/**) atau hapus.",
        },
      ],
    },
  },
  {
    files: ["src/lib/**/*.{ts,tsx}", "scripts/**/*.ts", "tests/**/*.ts", "tools/**/*.js"],
    rules: {
      // console.error tetap boleh di jalur server/CLI/test.
      "no-restricted-syntax": "off",
    },
  },
  {
    files: ["tools/**/*.js", "*.mjs"],
    languageOptions: { sourceType: "module" },
  },
];
