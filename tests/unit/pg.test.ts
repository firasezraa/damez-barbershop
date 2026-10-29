import { describe, expect, it } from "vitest";
import { Pool } from "pg";
import { createPgPool } from "../../src/lib/db/pg.ts";

describe("createPgPool", () => {
  it("returns a pg Pool bound to the given connection string", () => {
    const pool = createPgPool("postgresql://damez:damez@127.0.0.1:5432/damez_test");
    try {
      expect(pool).toBeInstanceOf(Pool);
      expect(pool.options.connectionString).toBe(
        "postgresql://damez:damez@127.0.0.1:5432/damez_test",
      );
    } finally {
      void pool.end();
    }
  });

  it("caps the pool at 5 connections by default", () => {
    const pool = createPgPool("postgresql://damez:damez@127.0.0.1:5432/damez_test");
    try {
      expect(pool.options.max).toBe(5);
      expect(createPgPool("postgresql://x", 1).options.max).toBe(1);
    } finally {
      void pool.end();
    }
  });
});
