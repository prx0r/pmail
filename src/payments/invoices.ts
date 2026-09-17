// src/payments/invoices.ts — Invoice lifecycle

import { createHash, randomBytes } from "crypto";
import type { XmrInvoice, InvoiceState, PaymentPolicy, PaymentObservation } from "./types";
import { DEFAULT_PAYMENT_POLICY } from "./types";

// ─── Invoice Creation ─────────────────────────────────────

export function createInvoice(params: {
  sessionId: string;
  subaddressIndex: number;
  address: string;
  expectedAtomic: bigint;
  minConfirmations?: number;
  ttlSeconds?: number;
}): XmrInvoice {
  const id = "inv:" + randomBytes(16).toString("hex");
  const now = new Date();
  const expires = params.ttlSeconds
    ? new Date(now.getTime() + params.ttlSeconds * 1000).toISOString()
    : undefined;

  return {
    id,
    session_id: params.sessionId,
    subaddress_index: params.subaddressIndex,
    address: params.address,
    address_commitment: sha256(params.address),
    expected_atomic: params.expectedAtomic,
    created_at: now.toISOString(),
    expires_at: expires,
    min_confirmations: params.minConfirmations || 10,
    state: "OPEN",
  };
}

// ─── Payment Evaluation ───────────────────────────────────

export function evaluatePayment(
  invoice: XmrInvoice,
  observation: PaymentObservation,
  policy: PaymentPolicy = DEFAULT_PAYMENT_POLICY,
): {
  newState: InvoiceState;
  creditAtomic: bigint;
  reason: string;
} {
  // 1. Check invoice is still open
  if (invoice.state !== "OPEN" && invoice.state !== "PARTIAL" && invoice.state !== "SEEN") {
    return { newState: invoice.state, creditAtomic: 0n, reason: `Invoice already ${invoice.state}` };
  }

  // 2. Check expiry
  if (invoice.expires_at && new Date(invoice.expires_at) < new Date()) {
    return { newState: "EXPIRED", creditAtomic: 0n, reason: "Invoice expired" };
  }

  // 3. Check subaddress binding
  if (observation.subaddress_index !== invoice.subaddress_index) {
    return { newState: invoice.state, creditAtomic: 0n, reason: "Subaddress mismatch — wrong invoice" };
  }

  // 4. Check confirmation count
  if (observation.confirmation_count < invoice.min_confirmations) {
    return { newState: "SEEN", creditAtomic: 0n, reason: `Only ${observation.confirmation_count}/${invoice.min_confirmations} confirmations` };
  }

  // 5. Evaluate amount
  const observed = observation.observed_atomic;
  const expected = invoice.expected_atomic;

  if (observed < expected) {
    // Underpayment
    switch (policy.underpayment) {
      case "REJECT":
        return { newState: "OPEN", creditAtomic: 0n, reason: `Underpayment: ${observed}/${expected}` };
      case "PARTIAL_CREDIT":
        return { newState: "CONFIRMED", creditAtomic: observed, reason: `Partial credit: ${observed}/${expected}` };
      case "WAIT":
        return { newState: "PARTIAL", creditAtomic: 0n, reason: `Underpayment, waiting: ${observed}/${expected}` };
    }
  }

  // 6. Overpayment handling
  if (observed > expected) {
    switch (policy.overpayment) {
      case "CREDIT_EXACT":
        return { newState: "CONFIRMED", creditAtomic: expected, reason: `Overpayment, crediting exact: ${expected}` };
      case "CREDIT_OBSERVED":
        return { newState: "CONFIRMED", creditAtomic: observed, reason: `Overpayment, crediting observed: ${observed}` };
      case "CREDIT_CAPPED": {
        const cap = policy.overpayment_cap || expected * 2n;
        const credit = observed > cap ? cap : observed;
        return { newState: "CONFIRMED", creditAtomic: credit, reason: `Overpayment capped: ${credit}` };
      }
    }
  }

  // 7. Exact payment
  return { newState: "CONFIRMED", creditAtomic: expected, reason: "Exact payment confirmed" };
}

// ─── Idempotent Capability Minting ────────────────────────

export function canMintCapability(
  invoiceId: string,
  existingCapabilityRoots: string[],
): { allowed: boolean; reason?: string } {
  // Each invoice can mint its entitlement exactly once
  const paymentRoot = "payment:" + invoiceId;
  if (existingCapabilityRoots.includes(paymentRoot)) {
    return { allowed: false, reason: "Invoice already used — no double credit" };
  }
  return { allowed: true };
}

// ─── Utility ──────────────────────────────────────────────

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}
