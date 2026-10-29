import { describe, expect, it } from "vitest";
import {
  ADMIN_SESSION_COOKIE,
  readAccessToken,
  readAdminSession,
  type SessionVerifier,
} from "../../src/lib/auth/session.ts";
import { requireAdmin } from "../../src/lib/auth/require-admin.ts";

function requestWithCookies(cookieHeader?: string): Request {
  const headers = new Headers();
  if (cookieHeader !== undefined) {
    headers.set("cookie", cookieHeader);
  }
  return new Request("http://localhost/api/admin/health", { headers });
}

const validVerifier: SessionVerifier = async (token) =>
  token === "token-owner" ? { userId: "u-1", email: "owner@damez.id", role: "owner" } : null;

describe("readAccessToken", () => {
  it("returns null when there is no Cookie header", () => {
    expect(readAccessToken(requestWithCookies())).toBeNull();
  });

  it("finds the session cookie among other cookies", () => {
    const request = requestWithCookies(`theme=dark; ${ADMIN_SESSION_COOKIE}=abc123; other=1`);
    expect(readAccessToken(request)).toBe("abc123");
  });

  it("treats an empty cookie value as missing", () => {
    expect(readAccessToken(requestWithCookies(`${ADMIN_SESSION_COOKIE}=`))).toBeNull();
  });

  it("ignores cookies whose name merely contains the session name", () => {
    expect(readAccessToken(requestWithCookies(`x${ADMIN_SESSION_COOKIE}=abc`))).toBeNull();
  });
});

describe("readAdminSession", () => {
  it("returns the session for a valid token and known role", async () => {
    const result = await readAdminSession(requestWithCookies(`${ADMIN_SESSION_COOKIE}=token-owner`), {
      verify: validVerifier,
    });

    expect(result).toEqual({
      ok: true,
      session: { userId: "u-1", email: "owner@damez.id", role: "owner" },
    });
  });

  it("fails closed when the cookie is missing", async () => {
    const result = await readAdminSession(requestWithCookies(), { verify: validVerifier });
    expect(result).toEqual({ ok: false, reason: "missing" });
  });

  it("fails closed when the verifier rejects the token", async () => {
    const result = await readAdminSession(requestWithCookies(`${ADMIN_SESSION_COOKIE}=expired`), {
      verify: validVerifier,
    });
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("fails closed when the verifier throws (network failure must not open the door)", async () => {
    const throwingVerifier: SessionVerifier = async () => {
      throw new Error("ECONNREFUSED supabase");
    };

    const result = await readAdminSession(requestWithCookies(`${ADMIN_SESSION_COOKIE}=anything`), {
      verify: throwingVerifier,
    });
    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects a token whose role is not an admin role", async () => {
    const customerVerifier: SessionVerifier = async () => ({
      userId: "u-9",
      email: "pelanggan@example.com",
      role: "customer",
    });

    const result = await readAdminSession(requestWithCookies(`${ADMIN_SESSION_COOKIE}=token-customer`), {
      verify: customerVerifier,
    });
    expect(result).toEqual({ ok: false, reason: "unknown_role" });
  });

  it("rejects a token with no role claim at all", async () => {
    const rolelessVerifier: SessionVerifier = async () => ({
      userId: "u-10",
      email: null,
      role: null,
    });

    const result = await readAdminSession(requestWithCookies(`${ADMIN_SESSION_COOKIE}=token-norole`), {
      verify: rolelessVerifier,
    });
    expect(result).toEqual({ ok: false, reason: "unknown_role" });
  });
});

describe("requireAdmin", () => {
  it("answers 401 without a session cookie", async () => {
    const guard = await requireAdmin(requestWithCookies(), { verify: validVerifier });

    expect(guard.ok).toBe(false);
    if (!guard.ok) {
      expect(guard.status).toBe(401);
      expect(guard.body.error).toBe("UNAUTHENTICATED");
    }
  });

  it("answers 401 for a token the verifier does not know", async () => {
    const guard = await requireAdmin(requestWithCookies(`${ADMIN_SESSION_COOKIE}=stale`), {
      verify: validVerifier,
    });

    expect(guard.ok).toBe(false);
    if (!guard.ok) {
      expect(guard.status).toBe(401);
    }
  });

  it("answers 403 when the role is outside the allowed set", async () => {
    const cashierVerifier: SessionVerifier = async () => ({
      userId: "u-2",
      email: "kasir@damez.id",
      role: "cashier",
    });

    const guard = await requireAdmin(
      requestWithCookies(`${ADMIN_SESSION_COOKIE}=token-cashier`),
      { verify: cashierVerifier },
      ["owner"],
    );

    expect(guard.ok).toBe(false);
    if (!guard.ok) {
      expect(guard.status).toBe(403);
      expect(guard.body.error).toBe("FORBIDDEN_ROLE");
    }
  });

  it("lets an owner through when every admin role is allowed", async () => {
    const guard = await requireAdmin(requestWithCookies(`${ADMIN_SESSION_COOKIE}=token-owner`), {
      verify: validVerifier,
    });

    expect(guard.ok).toBe(true);
    if (guard.ok) {
      expect(guard.session.role).toBe("owner");
    }
  });
});
