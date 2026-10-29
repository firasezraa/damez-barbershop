import { expect, test } from "@playwright/test";

/**
 * Bukti HTTP nyata (bukan pemanggilan handler di dalam proses): server produksi
 * menolak `/api/admin/*` tanpa sesi server-side, dan tidak membuka akses apa pun
 * ketika cookie dipalsukan. Ini yang membedakan v2 dari v1, di mana guard admin
 * hanya ada di klien dan sesi kosong otomatis menjadi sesi owner.
 */
test("admin API refuses requests without a server-side session", async ({ request }) => {
  const anonymous = await request.get("/api/admin/health");

  expect(anonymous.status()).toBe(401);
  expect(await anonymous.json()).toMatchObject({ error: "UNAUTHENTICATED" });
});

test("admin API refuses a forged session cookie", async ({ request }) => {
  const forged = await request.get("/api/admin/health", {
    headers: { cookie: "dmz_admin_session=palsu-dari-console" },
  });

  expect(forged.status()).toBe(401);
  expect(forged.headers()["set-cookie"]).toBeUndefined();
});

test("admin API refuses an empty session cookie", async ({ request }) => {
  const empty = await request.get("/api/admin/health", {
    headers: { cookie: "dmz_admin_session=" },
  });

  expect(empty.status()).toBe(401);
});
