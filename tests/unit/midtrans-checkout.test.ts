import { describe, expect, it, vi } from "vitest";
import { createCheckout } from "../../src/features/payment/checkout.ts";
import { readPaymentEnv } from "../../src/lib/config/payment-env.ts";

/**
 * Kontrak Snap diuji terhadap dokumentasi resmi Midtrans, bukan terhadap ingatan:
 * endpoint sandbox/produksi, header Basic, subtotal item = gross_amount, dan batas
 * panjang nama (BCA VA: 30 karakter). `pool` dan `fetch` disuntik supaya tidak ada
 * jaringan dan tidak ada database.
 */

const SANDBOX_KEY = "SB-Mid-server-uji-sandbox-1234567890";
const PRODUCTION_KEY = "Mid-server-uji-produksi-1234567890";
const BOOKING = "DMZ-20261102-0007";

type FakeResponse = { ok: boolean; status: number; json: () => Promise<unknown> };

function bookingPool(overrides: Record<string, unknown> = {}) {
  return {
    query: async () => ({
      rows: [
        {
          id: "11111111-1111-1111-1111-111111111111",
          booking_code: BOOKING,
          dp_idr: 20000,
          status: "pending_payment",
          hold_active: true,
          customer_name: "Budi Santoso Wijaya Kusuma Pratama",
          phone_e164: "+628123456789",
          ...overrides,
        },
      ],
    }),
  } as never;
}

function snapStub(payload: unknown = { token: "tok-123", redirect_url: "https://snap.test/vtweb/1" }) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = vi.fn(async (url: string, init: RequestInit): Promise<FakeResponse> => {
    calls.push({ url, init });
    return { ok: true, status: 201, json: async () => payload };
  });

  return { calls, fetchImpl: fetchImpl as unknown as typeof fetch };
}

describe("readPaymentEnv", () => {
  it("defaults to sandbox and mock off", () => {
    const env = readPaymentEnv({});

    expect(env.isProduction).toBe(false);
    expect(env.mock).toBe(false);
    expect(env.serverKey).toBe("");
  });

  it("accepts a sandbox key outside production", () => {
    const env = readPaymentEnv({ MIDTRANS_SERVER_KEY: SANDBOX_KEY });

    expect(env.isProduction).toBe(false);
  });

  it("accepts a production key with the production flag", () => {
    const env = readPaymentEnv({
      MIDTRANS_SERVER_KEY: PRODUCTION_KEY,
      MIDTRANS_IS_PRODUCTION: "true",
    });

    expect(env.isProduction).toBe(true);
  });

  it("refuses a sandbox key sent to the production endpoint", () => {
    expect(() =>
      readPaymentEnv({ MIDTRANS_SERVER_KEY: SANDBOX_KEY, MIDTRANS_IS_PRODUCTION: "true" }),
    ).toThrow(/MIDTRANS_IS_PRODUCTION/);
  });

  it("refuses a production key while still in sandbox mode", () => {
    expect(() => readPaymentEnv({ MIDTRANS_SERVER_KEY: PRODUCTION_KEY })).toThrow(
      /MIDTRANS_IS_PRODUCTION/,
    );
  });

  it("reads the app base url when present and trims a trailing slash", () => {
    const env = readPaymentEnv({ APP_BASE_URL: "https://damez.example/" });

    expect(env.appBaseUrl).toBe("https://damez.example");
  });
});

describe("createCheckout", () => {
  it("posts to the sandbox endpoint with a Basic header of key + colon", async () => {
    const { calls, fetchImpl } = snapStub();

    const result = await createCheckout(BOOKING, {
      mock: false,
      serverKey: SANDBOX_KEY,
      isProduction: false,
      pool: bookingPool(),
      fetchImpl,
    });

    expect(result.status).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://app.sandbox.midtrans.com/snap/v1/transactions");
    expect((calls[0]?.init.headers as Record<string, string>)["authorization"]).toBe(
      `Basic ${Buffer.from(`${SANDBOX_KEY}:`).toString("base64")}`,
    );
  });

  it("switches to the production endpoint when the flag says so", async () => {
    const { calls, fetchImpl } = snapStub();

    await createCheckout(BOOKING, {
      mock: false,
      serverKey: PRODUCTION_KEY,
      isProduction: true,
      pool: bookingPool(),
      fetchImpl,
    });

    expect(calls[0]?.url).toBe("https://app.midtrans.com/snap/v1/transactions");
  });

  it("sends an item whose subtotal equals gross_amount", async () => {
    const { calls, fetchImpl } = snapStub();

    await createCheckout(BOOKING, {
      mock: false,
      serverKey: SANDBOX_KEY,
      isProduction: false,
      pool: bookingPool(),
      fetchImpl,
    });

    const body = JSON.parse(String(calls[0]?.init.body)) as {
      transaction_details: { gross_amount: number };
      item_details: { price: number; quantity: number; name: string }[];
    };

    const subtotal = body.item_details.reduce((total, item) => total + item.price * item.quantity, 0);
    expect(subtotal).toBe(body.transaction_details.gross_amount);
    expect(body.transaction_details.gross_amount).toBe(20000);
    expect(body.item_details[0]?.name.length).toBeLessThanOrEqual(50);
  });

  it("truncates the customer name to the BCA VA limit and keeps the phone in E.164", async () => {
    const { calls, fetchImpl } = snapStub();

    await createCheckout(BOOKING, {
      mock: false,
      serverKey: SANDBOX_KEY,
      isProduction: false,
      pool: bookingPool(),
      fetchImpl,
    });

    const body = JSON.parse(String(calls[0]?.init.body)) as {
      customer_details: { first_name: string; phone: string };
    };

    expect(body.customer_details.first_name.length).toBeLessThanOrEqual(30);
    expect(body.customer_details.first_name.startsWith("Budi")).toBe(true);
    expect(body.customer_details.phone).toBe("+628123456789");
  });

  it("adds a finish callback only when the app base url is known", async () => {
    const withoutBase = snapStub();
    await createCheckout(BOOKING, {
      mock: false,
      serverKey: SANDBOX_KEY,
      isProduction: false,
      pool: bookingPool(),
      fetchImpl: withoutBase.fetchImpl,
    });
    const noCallbacks = JSON.parse(String(withoutBase.calls[0]?.init.body)) as {
      callbacks?: { finish?: string };
    };
    expect(noCallbacks.callbacks).toBeUndefined();

    const withBase = snapStub();
    await createCheckout(BOOKING, {
      mock: false,
      serverKey: SANDBOX_KEY,
      isProduction: false,
      appBaseUrl: "https://damez.example",
      pool: bookingPool(),
      fetchImpl: withBase.fetchImpl,
    });
    const callbacks = JSON.parse(String(withBase.calls[0]?.init.body)) as {
      callbacks?: { finish?: string };
    };
    expect(callbacks.callbacks?.finish).toBe(`https://damez.example/booking/success/${BOOKING}`);
  });

  it("keeps the 15 minute expiry that matches the hold ttl", async () => {
    const { calls, fetchImpl } = snapStub();

    await createCheckout(BOOKING, {
      mock: false,
      serverKey: SANDBOX_KEY,
      isProduction: false,
      pool: bookingPool(),
      fetchImpl,
    });

    const body = JSON.parse(String(calls[0]?.init.body)) as {
      expiry: { unit: string; duration: number };
      enabled_payments: string[];
    };
    expect(body.expiry).toEqual({ unit: "minutes", duration: 15 });
    expect(body.enabled_payments).toEqual(["qris", "bank_transfer"]);
  });

  it("answers 502 without leaking the key when Snap rejects the request", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 401,
      json: async () => ({ error_messages: ["Access denied"] }),
    })) as unknown as typeof fetch;

    const result = await createCheckout(BOOKING, {
      mock: false,
      serverKey: SANDBOX_KEY,
      isProduction: false,
      pool: bookingPool(),
      fetchImpl,
    });

    expect(result.status).toBe(502);
    expect(JSON.stringify(result.body)).not.toContain(SANDBOX_KEY.slice(0, 12));
  });

  it("answers 503 when no key is configured and mock is off", async () => {
    const result = await createCheckout(BOOKING, {
      mock: false,
      serverKey: "",
      isProduction: false,
      pool: bookingPool(),
    });

    expect(result.status).toBe(503);
  });

  it("refuses a booking that is no longer payable or whose hold expired", async () => {
    const settled = await createCheckout(BOOKING, {
      mock: false,
      serverKey: SANDBOX_KEY,
      isProduction: false,
      pool: bookingPool({ status: "confirmed" }),
    });
    const expired = await createCheckout(BOOKING, {
      mock: false,
      serverKey: SANDBOX_KEY,
      isProduction: false,
      pool: bookingPool({ hold_active: false }),
    });

    expect(settled.status).toBe(409);
    expect(expired.status).toBe(409);
  });
});