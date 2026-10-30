import { describe, expect, it, vi } from "vitest";
import {
  LOGIN_PATH_AFTER_SUCCESS,
  handleSignIn,
  normalizeNextPath,
} from "../../src/features/admin/login.ts";
import { buildClearSessionCookie, buildSessionCookie } from "../../src/lib/auth/session-cookie.ts";

const okSignIn = async () => ({ ok: true as const, accessToken: "token-owner" });
const badSignIn = async () => ({ ok: false as const, message: "Email atau kata sandi salah." });
const allowedRateLimit = async () => true;
const blockedRateLimit = async () => false;

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

describe("normalizeNextPath", () => {
  it("keeps an internal admin path", () => {
    expect(normalizeNextPath("/admin/dashboard")).toBe("/admin/dashboard");
  });

  it("rejects absolute URLs (open redirect)", () => {
    expect(normalizeNextPath("https://evil.example/phish")).toBe(LOGIN_PATH_AFTER_SUCCESS);
  });

  it("rejects protocol-relative URLs", () => {
    expect(normalizeNextPath("//evil.example")).toBe(LOGIN_PATH_AFTER_SUCCESS);
  });

  it("rejects backslash tricks and empty values", () => {
    expect(normalizeNextPath("/\\evil.example")).toBe(LOGIN_PATH_AFTER_SUCCESS);
    expect(normalizeNextPath("")).toBe(LOGIN_PATH_AFTER_SUCCESS);
    expect(normalizeNextPath(null)).toBe(LOGIN_PATH_AFTER_SUCCESS);
  });

  it("rejects a path that is not under /admin", () => {
    expect(normalizeNextPath("/booking")).toBe(LOGIN_PATH_AFTER_SUCCESS);
  });
});

describe("handleSignIn", () => {
  it("rejects malformed input without hitting the auth provider", async () => {
    const signIn = vi.fn(okSignIn);
    const result = await handleSignIn(form({ email: "bukan-email", password: "x" }), {
      signIn,
      rateLimit: allowedRateLimit,
      clientKey: "ip:1.1.1.1",
    });

    expect(result.kind).toBe("failure");
    expect(result.status).toBe(400);
    expect(signIn).not.toHaveBeenCalled();
  });

  it("answers 429 when the rate limit is exhausted", async () => {
    const signIn = vi.fn(okSignIn);
    const result = await handleSignIn(
      form({ email: "owner@damez.id", password: "rahasia-panjang" }),
      { signIn, rateLimit: blockedRateLimit, clientKey: "ip:1.1.1.1" },
    );

    expect(result.kind).toBe("failure");
    expect(result.status).toBe(429);
    expect(signIn).not.toHaveBeenCalled();
  });

  it("answers 401 with a message that does not reveal which field was wrong", async () => {
    const result = await handleSignIn(
      form({ email: "owner@damez.id", password: "salah-sekali" }),
      { signIn: badSignIn, rateLimit: allowedRateLimit, clientKey: "ip:1.1.1.1" },
    );

    if (result.kind !== "failure") {
      throw new Error("seharusnya gagal");
    }
    expect(result.status).toBe(401);
    expect(result.body).toEqual({ error: "Email atau kata sandi salah." });
  });

  it("answers 303 to the requested admin page and returns the session token", async () => {
    const result = await handleSignIn(
      form({ email: "owner@damez.id", password: "rahasia-panjang", next: "/admin/reports" }),
      { signIn: okSignIn, rateLimit: allowedRateLimit, clientKey: "ip:1.1.1.1" },
    );

    if (result.kind !== "success") {
      throw new Error("seharusnya berhasil");
    }
    expect(result.status).toBe(303);
    expect(result.redirectTo).toBe("/admin/reports");
    expect(result.accessToken).toBe("token-owner");
  });

  it("falls back to the default admin page when next is hostile", async () => {
    const result = await handleSignIn(
      form({ email: "owner@damez.id", password: "rahasia-panjang", next: "https://evil.example" }),
      { signIn: okSignIn, rateLimit: allowedRateLimit, clientKey: "ip:1.1.1.1" },
    );

    if (result.kind !== "success") {
      throw new Error("seharusnya berhasil");
    }
    expect(result.redirectTo).toBe(LOGIN_PATH_AFTER_SUCCESS);
  });

  it("uses the client key for the rate limit, not the submitted email", async () => {
    const rateLimit = vi.fn(allowedRateLimit);
    await handleSignIn(form({ email: "owner@damez.id", password: "rahasia-panjang" }), {
      signIn: okSignIn,
      rateLimit,
      clientKey: "ip:203.0.113.9",
    });

    expect(rateLimit).toHaveBeenCalledWith("ip:203.0.113.9");
  });
});

describe("session cookie", () => {
  it("is HttpOnly, SameSite=Lax, and path-wide", () => {
    const cookie = buildSessionCookie("token-owner", { secure: true });

    expect(cookie).toContain("dmz_admin_session=token-owner");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Secure");
  });

  it("omits Secure on plain http so local development still works", () => {
    expect(buildSessionCookie("token-owner", { secure: false })).not.toContain("Secure");
  });

  it("clears the cookie with an expired Max-Age", () => {
    const cookie = buildClearSessionCookie({ secure: true });

    expect(cookie).toContain("dmz_admin_session=");
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("HttpOnly");
  });
});