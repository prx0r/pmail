// tests/payments.test.ts — XMR payments tests

import { describe, it, expect } from "vitest";
import { createInvoice, evaluatePayment, canMintCapability, parseMoneroPayCallback } from "../src/payments";
import type { PaymentObservation, PaymentPolicy } from "../src/payments";

describe("Invoice Lifecycle", () => {
  it("creates invoice with correct fields", () => {
    const inv = createInvoice({
      sessionId: "sess:1",
      subaddressIndex: 0,
      address: "4AdUn...",
      expectedAtomic: 100000000000n,
    });
    expect(inv.id).toMatch(/^inv:/);
    expect(inv.session_id).toBe("sess:1");
    expect(inv.state).toBe("OPEN");
    expect(inv.expected_atomic).toBe(100000000000n);
  });

  it("creates invoice with expiry", () => {
    const inv = createInvoice({
      sessionId: "sess:1",
      subaddressIndex: 0,
      address: "addr",
      expectedAtomic: 100n,
      ttlSeconds: 3600,
    });
    expect(inv.expires_at).toBeTruthy();
    expect(new Date(inv.expires_at!).getTime()).toBeGreaterThan(Date.now());
  });
});

describe("Payment Evaluation", () => {
  const baseInvoice = {
    id: "inv:1",
    session_id: "sess:1",
    subaddress_index: 0,
    address: "addr",
    address_commitment: "hash",
    expected_atomic: 1000n,
    created_at: new Date().toISOString(),
    min_confirmations: 1,
    state: "OPEN" as const,
  };

  const baseObs: PaymentObservation = {
    id: "obs:1",
    invoice_id: "inv:1",
    subaddress_index: 0,
    expected_atomic: 1000n,
    observed_atomic: 1000n,
    confirmation_count: 1,
    observed_at: new Date().toISOString(),
    source: "test",
    runtime_hash: "test",
  };

  const policy: PaymentPolicy = {
    underpayment: "REJECT",
    overpayment: "CREDIT_EXACT",
    min_confirmations: 1,
    invoice_ttl_seconds: 3600,
  };

  it("confirms exact payment", () => {
    const result = evaluatePayment(baseInvoice, baseObs, policy);
    expect(result.newState).toBe("CONFIRMED");
    expect(result.creditAtomic).toBe(1000n);
  });

  it("rejects underpayment", () => {
    const obs = { ...baseObs, observed_atomic: 500n };
    const result = evaluatePayment(baseInvoice, obs, policy);
    expect(result.newState).toBe("OPEN");
    expect(result.creditAtomic).toBe(0n);
  });

  it("partial credits underpayment when configured", () => {
    const obs = { ...baseObs, observed_atomic: 500n };
    const result = evaluatePayment(baseInvoice, obs, { ...policy, underpayment: "PARTIAL_CREDIT" });
    expect(result.newState).toBe("CONFIRMED");
    expect(result.creditAtomic).toBe(500n);
  });

  it("credits exact amount on overpayment", () => {
    const obs = { ...baseObs, observed_atomic: 2000n };
    const result = evaluatePayment(baseInvoice, obs, policy);
    expect(result.creditAtomic).toBe(1000n); // exact, not observed
  });

  it("credits observed on overpayment when configured", () => {
    const obs = { ...baseObs, observed_atomic: 2000n };
    const result = evaluatePayment(baseInvoice, obs, { ...policy, overpayment: "CREDIT_OBSERVED" });
    expect(result.creditAtomic).toBe(2000n);
  });

  it("rejects wrong subaddress", () => {
    const obs = { ...baseObs, subaddress_index: 99 };
    const result = evaluatePayment(baseInvoice, obs, policy);
    expect(result.creditAtomic).toBe(0n);
    expect(result.reason).toContain("Subaddress mismatch");
  });

  it("returns SEEN when insufficient confirmations", () => {
    const inv = { ...baseInvoice, min_confirmations: 10 };
    const obs = { ...baseObs, confirmation_count: 5 };
    const result = evaluatePayment(inv, obs, policy);
    expect(result.newState).toBe("SEEN");
    expect(result.creditAtomic).toBe(0n);
  });

  it("rejects already confirmed invoice", () => {
    const inv = { ...baseInvoice, state: "CONFIRMED" as const };
    const result = evaluatePayment(inv, baseObs, policy);
    expect(result.creditAtomic).toBe(0n);
  });

  it("rejects expired invoice", () => {
    const inv = { ...baseInvoice, expires_at: "2020-01-01T00:00:00Z" };
    const result = evaluatePayment(inv, baseObs, policy);
    expect(result.newState).toBe("EXPIRED");
  });
});

describe("Capability Minting Idempotency", () => {
  it("allows first mint", () => {
    const result = canMintCapability("inv:1", []);
    expect(result.allowed).toBe(true);
  });

  it("rejects duplicate mint", () => {
    const result = canMintCapability("inv:1", ["payment:inv:1"]);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("no double credit");
  });
});

describe("MoneroPay Callback Parsing", () => {
  it("parses valid callback", () => {
    const cb = parseMoneroPayCallback({
      tx_hash: "abc123",
      xmr_amount: "100000000000",
      payment_id: "0",
      confirmations: 15,
      subaddr_index: { major: 0, minor: 0 },
    });
    expect(cb).toBeTruthy();
    expect(cb!.tx_hash).toBe("abc123");
    expect(cb!.confirmations).toBe(15);
  });

  it("rejects invalid callback", () => {
    expect(parseMoneroPayCallback({})).toBeNull();
    expect(parseMoneroPayCallback(null)).toBeNull();
  });
});
