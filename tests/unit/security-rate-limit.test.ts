import { describe, expect, it } from "vitest";
import { clientKeyFrom, createRateLimiter } from "../../src/lib/security/rate-limit.ts";
import { readCronEnv, readDatabaseEnv } from "../../src/lib/config/database-env.ts";

/**
 * Kunci pembatas laju harus datang dari jaringan, bukan dari body yang bisa
 * dipalsukan pelanggan untuk menghindari batas.
 */
describe("clientKeyFrom", () => {
  const request = (headers: Record<string, string>): Request =>
    new Request("http://localhost/api/booking/hold", { headers });

  it("takes the first address of x-forwarded-for", () => {
    expect(clientKeyFrom(request({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" }))).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip", () => {
    expect(clientKeyFrom(request({ "x-real-ip": "198.51.100.5" }))).toBe("198.51.100.5");
  });

  it("uses a shared bucket when the proxy headers are absent", () => {
    expect(clientKeyFrom(request({}))).toBe("unknown");
  });
});

describe("readDatabaseEnv dan readCronEnv", () => {
  const databaseUrl = "postgresql://damez:***@127.0.0.1:5432/damez_test";

  it("accepts a database url on its own", () => {
    expect(readDatabaseEnv({ DATABASE_URL: databaseUrl }).DATABASE_URL).toBe(databaseUrl);
  });

  it("names the missing variable without printing values", () => {
    let message = "";
    try {
      readDatabaseEnv({});
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain("DATABASE_URL");
  });

  it("requires a cron secret of at least 16 characters", () => {
    expect(() => readCronEnv({ DATABASE_URL: databaseUrl, CRON_SECRET: "pendek" })).toThrow(
      /CRON_SECRET/,
    );
    expect(
      readCronEnv({ DATABASE_URL: databaseUrl, CRON_SECRET: "rahasia-cron-16karakter" }).CRON_SECRET,
    ).toBe("rahasia-cron-16karakter");
  });
});

describe("createRateLimiter", () => {
  it("fails closed when the database is not configured, so routes can answer 503", async () => {
    const saved = process.env["DATABASE_URL"];
    delete process.env["DATABASE_URL"];

    try {
      const limiter = createRateLimiter({ name: "unit", limit: 1, windowSeconds: 1 });
      await expect(limiter("1.2.3.4")).rejects.toThrow(/DATABASE_URL/);
    } finally {
      if (saved !== undefined) {
        process.env["DATABASE_URL"] = saved;
      }
    }
  });
});
