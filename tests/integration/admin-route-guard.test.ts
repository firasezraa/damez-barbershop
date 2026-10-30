import { describe, expect, it } from "vitest";
import { GET } from "../../src/app/api/admin/health/route.ts";

/**
 * Handler sungguhan (bukan salinan logikanya) dipanggil langsung. Verifikator
 * Supabase di jalur ini memakai klien nyata; tanpa konfigurasi Supabase ia
 * melempar, dan guard harus berubah menjadi 401 — bukan 500, dan bukan lolos.
 */
describe("/api/admin/health", () => {
  it("answers 401 without a session cookie", async () => {
    const response = await GET(new Request("http://localhost/api/admin/health"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: "UNAUTHENTICATED" });
  });

  it("answers 401 for a forged cookie", async () => {
    const response = await GET(
      new Request("http://localhost/api/admin/health", {
        headers: { cookie: "dmz_admin_session=forged-token" },
      }),
    );

    expect(response.status).toBe(401);
  });

  it("answers 401 for an empty session cookie", async () => {
    const response = await GET(
      new Request("http://localhost/api/admin/health", {
        headers: { cookie: "dmz_admin_session=" },
      }),
    );

    expect(response.status).toBe(401);
  });
});
