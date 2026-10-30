import { describe, expect, it } from "vitest";
import { Pool } from "pg";
import { createPgPool, sslFor } from "../../src/lib/db/pg.ts";
import { TIMEZONE } from "../../src/lib/config/constants.ts";

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
    const pool = createPgPool("postgresql://damez:***@127.0.0.1:5432/damez_test");
    try {
      expect(pool.options.max).toBe(5);
      expect(createPgPool("postgresql://x", 1).options.max).toBe(1);
    } finally {
      void pool.end();
    }
  });

  it("pins the session timezone of every connection to Asia/Jakarta", () => {
    const pool = createPgPool("postgresql://damez:***@127.0.0.1:5432/damez_test");
    try {
      expect(pool.options.options).toContain(`-c timezone=${TIMEZONE}`);
    } finally {
      void pool.end();
    }
  });

  it("bounds every connection so a stuck query fails instead of hanging", () => {
    const pool = createPgPool("postgresql://damez:***@127.0.0.1:5432/damez_test");
    try {
      expect(pool.options.options).toContain("-c statement_timeout=");
      expect(pool.options.options).toContain("-c idle_in_transaction_session_timeout=");
      expect(pool.options.connectionTimeoutMillis).toBeLessThanOrEqual(5_000);
    } finally {
      void pool.end();
    }
  });
});

describe("sslFor", () => {
  it("leaves local connections without TLS", () => {
    expect(sslFor("postgresql://damez:pw@127.0.0.1:5432/damez_test")).toBeUndefined();
    expect(sslFor("postgresql://damez:pw@localhost:5432/damez_test")).toBeUndefined();
  });

  it("requires verified TLS for a remote host and only relaxes it on explicit request", () => {
    const remote = "postgresql://postgres.ref:pw@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";

    expect(sslFor(remote)).toEqual({ rejectUnauthorized: true });

    process.env["PG_SSL_INSECURE"] = "true";
    try {
      expect(sslFor(remote)).toEqual({ rejectUnauthorized: false });
    } finally {
      delete process.env["PG_SSL_INSECURE"];
    }
  });
});
