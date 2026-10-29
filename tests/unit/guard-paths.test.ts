import { describe, expect, it } from "vitest";
import {
  ADMIN_LOGIN_PATH,
  guardDecision,
} from "../../src/lib/auth/guard-paths.ts";

/**
 * Keputusan proteksi `/admin/*` ditulis sebagai fungsi murni supaya bisa diuji
 * tanpa edge runtime. Middleware hanya merangkai cookie + fungsi ini.
 */
describe("guardDecision", () => {
  it("lets public pages through untouched", () => {
    for (const pathname of ["/", "/booking", "/booking/success/DMZ-1", "/layanan"]) {
      expect(guardDecision(pathname, false)).toEqual({ type: "allow" });
    }
  });

  it("does not touch API routes: each admin route guards itself", () => {
    for (const pathname of ["/api/admin/health", "/api/booking/hold", "/api/webhooks/midtrans"]) {
      expect(guardDecision(pathname, false)).toEqual({ type: "allow" });
    }
  });

  it("redirects /admin without a session, keeping the destination", () => {
    expect(guardDecision("/admin", false)).toEqual({
      type: "redirect",
      to: `${ADMIN_LOGIN_PATH}?next=%2Fadmin`,
    });
    expect(guardDecision("/admin/dashboard", false)).toEqual({
      type: "redirect",
      to: `${ADMIN_LOGIN_PATH}?next=%2Fadmin%2Fdashboard`,
    });
    expect(guardDecision("/admin/bookings/2026-11-02", false)).toEqual({
      type: "redirect",
      to: `${ADMIN_LOGIN_PATH}?next=%2Fadmin%2Fbookings%2F2026-11-02`,
    });
  });

  it("always allows the login page, otherwise login would loop", () => {
    expect(guardDecision(ADMIN_LOGIN_PATH, false)).toEqual({ type: "allow" });
    expect(guardDecision("/admin/login/", false)).toEqual({ type: "allow" });
  });

  it("lets a session through everywhere", () => {
    for (const pathname of ["/admin", "/admin/dashboard", "/admin/reports"]) {
      expect(guardDecision(pathname, true)).toEqual({ type: "allow" });
    }
  });

  it("is not fooled by a path that merely starts with the admin prefix text", () => {
    for (const pathname of ["/administrasi", "/admin-panel", "/admine"]) {
      expect(guardDecision(pathname, false)).toEqual({ type: "allow" });
    }
  });
});
