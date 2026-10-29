import { RuleTester } from "eslint";
import { describe, expect, it } from "vitest";
import boundaries from "../../tools/eslint-rules/index.js";
import noDirectDbInApiRoute from "../../tools/eslint-rules/no-direct-db-in-api-route.js";
import noLibToFeatures from "../../tools/eslint-rules/no-lib-to-features.js";
import noServerDbInClient from "../../tools/eslint-rules/no-server-db-in-client.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

/**
 * Setiap rule diuji dengan pasangan valid/invalid. Test yang hanya memeriksa
 * jalur "valid" tidak membuktikan apa pun — rule yang lupa melempar pesan akan
 * tetap hijau. Karena itu setiap rule wajib punya minimal satu kasus invalid
 * dengan tepat satu error dan messageId yang diharapkan.
 */
describe("damez-boundaries/no-lib-to-features", () => {
  ruleTester.run("damez-boundaries/no-lib-to-features", noLibToFeatures, {
    valid: [
      {
        filename: "/repo/src/lib/time/jakarta.ts",
        code: 'import { createPgPool } from "@/lib/db/pg";',
      },
      {
        filename: "/repo/src/features/booking/wizard.ts",
        code: 'import { findSlots } from "@/features/slots/engine";',
      },
    ],
    invalid: [
      {
        filename: "/repo/src/lib/pricing/quote.ts",
        code: 'import { engine } from "@/features/slots/engine";',
        errors: [{ messageId: "libImportsFeatures" }],
      },
    ],
  });
});

describe("damez-boundaries/no-server-db-in-client", () => {
  ruleTester.run("damez-boundaries/no-server-db-in-client", noServerDbInClient, {
    valid: [
      {
        filename: "/repo/src/lib/db/server.ts",
        code: 'import "server-only";\nimport { pool } from "@/lib/db/pg";',
      },
      {
        filename: "/repo/src/components/admin/header.tsx",
        code: 'import { useState } from "react";\nexport const Header = () => useState(0);',
      },
    ],
    invalid: [
      {
        filename: "/repo/src/components/admin/header.tsx",
        code: "'use client';\nimport { getPool } from \"@/lib/db/server\";",
        errors: [{ messageId: "serverDbInClient" }],
      },
      {
        filename: "/repo/src/app/(admin)/layout.tsx",
        code: "'use client';\nimport \"server-only\";",
        errors: [{ messageId: "serverDbInClient" }],
      },
    ],
  });
});

describe("damez-boundaries/no-direct-db-in-api-route", () => {
  ruleTester.run("damez-boundaries/no-direct-db-in-api-route", noDirectDbInApiRoute, {
    valid: [
      {
        filename: "/repo/src/app/api/booking/hold/route.ts",
        code: 'import { createHold } from "@/features/booking/queries";',
      },
      {
        filename: "/repo/src/features/booking/queries.ts",
        code: 'import { createPgPool } from "@/lib/db/pg";',
      },
    ],
    invalid: [
      {
        filename: "/repo/src/app/api/admin/bookings/route.ts",
        code: 'import { getPool } from "@/lib/db/pg";',
        errors: [{ messageId: "directDbInApiRoute" }],
      },
      {
        filename: "/repo/src/app/api/admin/reports/daily-csv/route.ts",
        code: 'import { Pool } from "pg";',
        errors: [{ messageId: "directDbInApiRoute" }],
      },
    ],
  });
});

describe("plugin wiring", () => {
  it("exposes exactly the three documented rules", () => {
    expect(Object.keys(boundaries.rules).sort()).toEqual([
      "no-direct-db-in-api-route",
      "no-lib-to-features",
      "no-server-db-in-client",
    ]);
    expect(boundaries.meta.name).toBe("damez-boundaries");
  });
});
