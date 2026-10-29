import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();

// GoTrue tidak bisa dijalankan di VPS ini (tanpa Docker) maupun di CI (hanya
// service postgres). Yang diuji di sini adalah logika milik kita sendiri:
// pemetaan klaim dan penolakan klaim yang bisa ditulis pengguna.
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser } }),
}));

async function loadVerifier() {
  const loaded = await import("../../src/lib/auth/supabase-verifier.ts");
  return loaded.verifySupabaseToken;
}

beforeEach(() => {
  vi.resetModules();
  getUser.mockReset();
  process.env["NEXT_PUBLIC_SUPABASE_URL"] = "https://example.supabase.co";
  process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] = "anon-key-for-test";
});

afterEach(() => {
  delete process.env["NEXT_PUBLIC_SUPABASE_URL"];
  delete process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
});

describe("verifySupabaseToken", () => {
  it("maps a valid user to a verified token", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "u-1", email: "owner@damez.id", app_metadata: { role: "owner" } } },
      error: null,
    });

    const verify = await loadVerifier();

    await expect(verify("token")).resolves.toEqual({
      userId: "u-1",
      email: "owner@damez.id",
      role: "owner",
    });
  });

  it("ignores a role planted in user_metadata (self-service escalation)", async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          id: "u-2",
          email: "siapa-saja@example.com",
          app_metadata: {},
          user_metadata: { role: "owner" },
        },
      },
      error: null,
    });

    const verify = await loadVerifier();
    const result = await verify("token");

    expect(result?.role).toBeNull();
  });

  it("returns null when Supabase rejects the token", async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "invalid JWT" },
    });

    const verify = await loadVerifier();

    await expect(verify("stale-token")).resolves.toBeNull();
  });

  it("returns null when there is no user in the response", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const verify = await loadVerifier();

    await expect(verify("token")).resolves.toBeNull();
  });

  it("throws when Supabase is not configured, so the caller fails closed", async () => {
    delete process.env["NEXT_PUBLIC_SUPABASE_URL"];

    const verify = await loadVerifier();

    await expect(verify("token")).rejects.toThrow(/belum dikonfigurasi/);
  });

  it("treats an empty email as no email", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "u-3", email: undefined, app_metadata: { role: "barber" } } },
      error: null,
    });

    const verify = await loadVerifier();
    const result = await verify("token");

    expect(result).toEqual({ userId: "u-3", email: null, role: "barber" });
  });
});
