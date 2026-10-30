import { describe, expect, it } from "vitest";
import { midtransSignature, verifyMidtransSignature } from "../../src/features/payment/signature.ts";

/** SHA-512 dari string "abc" — vektor acuan independen, bukan hitungan modul ini. */
const SHA512_ABC =
  "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a" +
  "2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f";

describe("midtransSignature", () => {
  it("hashes the four parts concatenated in Midtrans order", () => {
    expect(midtransSignature("abc", "", "", "")).toBe(SHA512_ABC);
  });

  it("changes completely when any part changes", () => {
    const base = midtransSignature("DMZ-20261102-0001", "200", "20000.00", "server-key");

    expect(midtransSignature("DMZ-20261102-0002", "200", "20000.00", "server-key")).not.toBe(base);
    expect(midtransSignature("DMZ-20261102-0001", "201", "20000.00", "server-key")).not.toBe(base);
    expect(midtransSignature("DMZ-20261102-0001", "200", "20001.00", "server-key")).not.toBe(base);
    expect(midtransSignature("DMZ-20261102-0001", "200", "20000.00", "server-key-lain")).not.toBe(base);
  });
});

describe("verifyMidtransSignature", () => {
  const serverKey = "kunci-server-midtrans-uji";
  const signature = midtransSignature("DMZ-20261102-0001", "200", "20000.00", serverKey);

  it("accepts a signature computed from the same parts", () => {
    expect(
      verifyMidtransSignature({
        orderId: "DMZ-20261102-0001",
        statusCode: "200",
        grossAmount: "20000.00",
        signature,
        serverKey,
      }),
    ).toBe(true);
  });

  it("accepts an upper-case signature", () => {
    expect(
      verifyMidtransSignature({
        orderId: "DMZ-20261102-0001",
        statusCode: "200",
        grossAmount: "20000.00",
        signature: signature.toUpperCase(),
        serverKey,
      }),
    ).toBe(true);
  });

  it("rejects a tampered amount", () => {
    expect(
      verifyMidtransSignature({
        orderId: "DMZ-20261102-0001",
        statusCode: "200",
        grossAmount: "1.00",
        signature,
        serverKey,
      }),
    ).toBe(false);
  });

  it("rejects a signature of the wrong length without throwing", () => {
    expect(
      verifyMidtransSignature({
        orderId: "DMZ-20261102-0001",
        statusCode: "200",
        grossAmount: "20000.00",
        signature: "pendek",
        serverKey,
      }),
    ).toBe(false);
  });

  it("rejects everything when the server key is absent (fail closed)", () => {
    expect(
      verifyMidtransSignature({
        orderId: "DMZ-20261102-0001",
        statusCode: "200",
        grossAmount: "20000.00",
        signature,
        serverKey: "",
      }),
    ).toBe(false);
  });
});