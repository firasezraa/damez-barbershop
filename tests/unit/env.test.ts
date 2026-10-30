import { describe, expect, it } from "vitest";
import { readServerEnv, readSupabaseAuthEnv, serverEnvSchema } from "../../src/lib/config/env.ts";

const validSource = {
  DATABASE_URL: "postgresql://damez:damez@127.0.0.1:5432/damez_test",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  MIDTRANS_SERVER_KEY: "midtrans-server-key",
  CRON_SECRET: "0123456789abcdef",
} as const;

describe("readServerEnv", () => {
  it("names the missing variable when DATABASE_URL is absent", () => {
    const { DATABASE_URL: _omitted, ...withoutDb } = validSource;

    expect(() => readServerEnv(withoutDb)).toThrow(/DATABASE_URL/);
  });

  it("rejects a boolean flag that is not true/false", () => {
    expect(() =>
      readServerEnv({ ...validSource, MOCK_MIDTRANS: "yes" }),
    ).toThrow(/MOCK_MIDTRANS/);
  });

  it("parses boolean flags to real booleans, defaulting to false", () => {
    expect(readServerEnv(validSource).MOCK_MIDTRANS).toBe(false);
    expect(readServerEnv({ ...validSource, MOCK_MIDTRANS: "true" }).MOCK_MIDTRANS).toBe(true);
    expect(readServerEnv({ ...validSource, MOCK_WHATSAPP: "true" }).MOCK_WHATSAPP).toBe(true);
  });

  it("never leaks variable values into the error message", () => {
    let message = "";
    try {
      readServerEnv({ ...validSource, CRON_SECRET: "short" });
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toContain("CRON_SECRET");
    expect(message).not.toContain("postgresql://");
    expect(message).not.toContain("damez:damez");
  });

  it("exposes the schema for reuse by scripts", () => {
    expect(serverEnvSchema.safeParse(validSource).success).toBe(true);
  });
});

describe("readSupabaseAuthEnv", () => {
  it("reads only the variables the admin login path needs", () => {
    const env = readSupabaseAuthEnv({
      DATABASE_URL: "postgresql://damez:***@127.0.0.1:5432/damez_test",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });

    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://example.supabase.co");
  });

  it("does not require Midtrans or cron secrets, so login survives their absence", () => {
    expect(() =>
      readSupabaseAuthEnv({
        DATABASE_URL: "postgresql://damez:***@127.0.0.1:5432/damez_test",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      }),
    ).not.toThrow();
  });

  it("names the missing variables without printing their values", () => {
    let message = "";
    try {
      readSupabaseAuthEnv({ DATABASE_URL: "postgresql://damez:***@127.0.0.1:5432/damez_test" });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    expect(message).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(message).not.toContain("damez:");
  });
});
