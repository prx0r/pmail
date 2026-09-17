// src/core/session.ts — Accountless session + capability lifecycle
// Phase B: No email/password/phone required. Cryptographic capabilities only.

import { createHash, randomBytes } from "crypto";
import type { Operator, Session } from "../identity/types";

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

// ─── Session Lifecycle ────────────────────────────────────
// UNFUNDED → FUNDED → ACTIVE → EXHAUSTED/REVOKED

export interface Capability {
  id: string;                    // "cap:" + sha256
  sessionId: string;
  type: string;                  // "messaging", "phone", "posting", etc.
  granted_by: string;            // invoice_id or authority_ref
  amount_atomic: bigint;         // XMR piconeros
  granted_at: string;
  expires_at?: string;
  used: boolean;
}

export function createSession(agentId: string, operatorId?: string): Session {
  return {
    id: "sess:" + randomBytes(16).toString("hex"),
    operatorId,
    agentId,
    state: "UNFUNDED",
    createdAt: new Date().toISOString(),
    credits: 0n,
  };
}

export function fundSession(session: Session, amountAtomic: bigint, invoiceId: string): Session {
  if (session.state !== "UNFUNDED") throw new Error(`Cannot fund session in state ${session.state}`);
  return {
    ...session,
    state: "ACTIVE",
    fundedAt: new Date().toISOString(),
    credits: session.credits + amountAtomic,
  };
}

// ─── Capability Minting ───────────────────────────────────
// A capability is minted EXACTLY ONCE per invoice.
// Duplicate callbacks cannot double-credit.

export function mintCapability(
  session: Session,
  invoiceId: string,
  amountAtomic: bigint,
  capabilityType: string,
  existingCapabilities: Capability[]
): { capability: Capability | null; error?: string } {
  // Idempotency: check if this invoice already minted a capability
  const alreadyMinted = existingCapabilities.some((c) => c.granted_by === invoiceId);
  if (alreadyMinted) {
    return { capability: null, error: "invoice already minted (replay detected)" };
  }

  // Partial payment check
  if (amountAtomic <= 0n) {
    return { capability: null, error: "zero or negative amount" };
  }

  const capability: Capability = {
    id: "cap:" + sha256(`${session.id}:${invoiceId}:${capabilityType}`),
    sessionId: session.id,
    type: capabilityType,
    granted_by: invoiceId,
    amount_atomic: amountAtomic,
    granted_at: new Date().toISOString(),
    used: false,
  };

  return { capability };
}

// ─── Capability Usage ─────────────────────────────────────
export function useCapability(
  capability: Capability,
  requiredAmount: bigint
): { allowed: boolean; reason?: string } {
  if (capability.used) return { allowed: false, reason: "capability already used" };
  if (capability.expires_at && new Date(capability.expires_at) < new Date()) {
    return { allowed: false, reason: "capability expired" };
  }
  if (capability.amount_atomic < requiredAmount) {
    return { allowed: false, reason: `insufficient credits: ${capability.amount_atomic} < ${requiredAmount}` };
  }
  return { allowed: true };
}

// ─── Session State Machine ────────────────────────────────
export function advanceSession(session: Session, event: string): Session {
  const transitions: Record<string, Record<string, string>> = {
    UNFUNDED: { funded: "ACTIVE" },
    ACTIVE: { exhausted: "EXHAUSTED", revoked: "REVOKED" },
    EXHAUSTED: { funded: "ACTIVE", revoked: "REVOKED" },
  };

  const next = transitions[session.state]?.[event];
  if (!next) throw new Error(`Invalid transition: ${session.state} → ${event}`);

  return { ...session, state: next as Session["state"] };
}
