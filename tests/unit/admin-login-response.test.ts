import { describe, expect, it } from "vitest";
import { buildSignInResponse } from "../../src/app/api/admin/auth/sign-in/route.ts";
import { buildSignOutResponse } from "../../src/app/api/admin/auth/sign-out/route.ts";

/**
 * Jalur sukses 303 hanya bisa ditempuh kalau Supabase mengembalikan sesi nyata.
 * Karena itu pembentukan response-nya diuji langsung di sini — inilah jalur yang
 * dulu gagal di CI dengan "TypeError: immutable" karena memakai Response.redirect().
 */
const httpsRequest = (): Request =>
  new Request("https://damez.example/api/admin/auth/sign-in", { method: "POST" });

const httpRequest = (): Request =>
  new Request("http://localhost:3000/api/admin/auth/sign-in", { method: "POST" });

describe("buildSignInResponse", () => {
  it("answers 303 with a secure HttpOnly session cookie on success", () => {
    const response = buildSignInResponse(
      { kind: "success", status: 303, redirectTo: "/admin/dashboard", accessToken: "token-owner" },
      httpsRequest(),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://damez.example/admin/dashboard");
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("dmz_admin_session=token-owner");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
  });

  it("omits Secure over plain http so local development still works", () => {
    const response = buildSignInResponse(
      { kind: "success", status: 303, redirectTo: "/admin", accessToken: "token-owner" },
      httpRequest(),
    );

    expect(response.headers.get("set-cookie") ?? "").not.toContain("Secure");
  });

  it("never sets a cookie when the sign-in failed", () => {
    for (const status of [400, 401, 429, 503] as const) {
      const response = buildSignInResponse(
        { kind: "failure", status, body: { error: "gagal" } },
        httpsRequest(),
      );

      expect(response.status).toBe(status);
      expect(response.headers.get("set-cookie")).toBeNull();
    }
  });
});

describe("buildSignOutResponse", () => {
  it("answers 303 and expires the session cookie", () => {
    const response = buildSignOutResponse(httpsRequest());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://damez.example/admin/login");
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("dmz_admin_session=");
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("HttpOnly");
  });
});
