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

/** Klien API: menerima JSON apa adanya. */
const apiRequest = (): Request =>
  new Request("https://damez.example/api/admin/auth/sign-in", {
    method: "POST",
    headers: { accept: "application/json" },
  });

/** Browser yang mengirim formulir HTML. */
const htmlRequest = (): Request =>
  new Request("https://damez.example/api/admin/auth/sign-in", {
    method: "POST",
    headers: { accept: "text/html,application/xhtml+xml" },
  });

describe("buildSignInResponse", () => {
  it("answers 303 with a secure HttpOnly session cookie on success", () => {
    const response = buildSignInResponse(
      { kind: "success", status: 303, redirectTo: "/admin/dashboard", accessToken: "token-owner" },
      httpsRequest(),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/admin/dashboard");
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
        { kind: "failure", status, code: "credentials", body: { error: "gagal" } },
        apiRequest(),
      );

      expect(response.status).toBe(status);
      expect(response.headers.get("set-cookie")).toBeNull();
    }
  });

  it("sends a browser form post back to the login page with the reason", () => {
    // Formulir masuk adalah form HTML. Tanpa ini, pengguna melihat JSON mentah
    // dan tidak pernah kembali ke dashboard — keluhan pertama dari mesin Windows.
    const response = buildSignInResponse(
      { kind: "failure", status: 401, code: "credentials", body: { error: "Email atau kata sandi salah." } },
      htmlRequest(),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/admin/login?error=credentials");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("keeps the json contract for api clients", () => {
    const response = buildSignInResponse(
      { kind: "failure", status: 401, code: "credentials", body: { error: "Email atau kata sandi salah." } },
      apiRequest(),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("content-type")).toContain("application/json");
  });
});

describe("buildSignOutResponse", () => {
  it("answers 303 and expires the session cookie", () => {
    const response = buildSignOutResponse(httpsRequest());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/admin/login");
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("dmz_admin_session=");
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("HttpOnly");
  });
});
