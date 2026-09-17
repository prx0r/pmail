// src/store/types.ts — Durable store types

/**
 * Choose one simple production store first (SQLite/Postgres is fine;
 * avoid premature distributed architecture).
 *
 * Persist: sessions, operators/task keys, invoices, capabilities/token
 * hashes, credit ledger, authority refs/use state, effect journal,
 * claims/evidence metadata, receipt/log metadata.
 */

// ─── Session ──────────────────────────────────────────────

export interface StoredSession {
  id: string;
  agent_id: string;
  operator_id?: string;
  state: "UNFUNDED" | "FUNDED" | "ACTIVE" | "EXHAUSTED" | "REVOKED";
  created_at: string;
  funded_at?: string;
  credits: string;             // bigint as string for JSON safety
}

// ─── Invoice ──────────────────────────────────────────────

export interface StoredInvoice {
  id: string;
  session_id: string;
  subaddress_index: number;
  address_commitment: string;
  expected_atomic: string;
  created_at: string;
  expires_at?: string;
  min_confirmations: number;
  state: "OPEN" | "PARTIAL" | "SEEN" | "CONFIRMED" | "EXPIRED" | "CANCELLED";
}

// ─── Capability ───────────────────────────────────────────

export interface StoredCapability {
  id: string;
  token_hash: string;          // hash of random bearer token
  session_id: string;
  subject?: string;
  scopes: string[];
  budget_atomic?: string;
  issued_from_payment_root?: string;
  issued_at: string;
  expires_at?: string;
  max_uses?: number;
  uses: number;
  revoked_at?: string;
}

// ─── Credit Ledger ────────────────────────────────────────

export interface CreditLedgerEntry {
  id: string;
  session_id: string;
  delta_atomic: string;        // positive = credit, negative = debit
  reason: string;
  source_root?: string;
  created_at: string;
}

// ─── Authority ────────────────────────────────────────────

export interface StoredGrant {
  id: string;
  issuer: string;
  subject: string;
  action: string;
  payload_hash: string;
  constraints: Record<string, unknown>;
  issued_at: string;
  expires_at: string;
  nonce: string;
  max_uses: number;
  uses: number;
  signature: string;
  revoked: boolean;
}

// ─── Effect Journal ───────────────────────────────────────

export type EffectState =
  | "PROPOSED"
  | "AUTHORIZED"
  | "PREPARED"
  | "EXECUTING"
  | "EXECUTED_UNVERIFIED"
  | "PROVEN_TRUE"
  | "PROVEN_FALSE"
  | "UNKNOWN_RECONCILE"
  | "FAILED";

export interface EffectJournalEntry {
  id: string;
  session_id: string;
  action: string;
  state: EffectState;
  proposal_root: string;
  authority_ref?: string;
  authority_root?: string;
  budget_reserved?: string;
  effect_spec_root: string;
  idempotency_key: string;
  expected_claim?: string;
  attempt_number: number;
  created_at: string;
  updated_at: string;
  /** State transition log */
  transitions: Array<{
    from: EffectState;
    to: EffectState;
    timestamp: string;
    reason?: string;
    receipt_id?: string;
  }>;
}

// ─── Store Interface ──────────────────────────────────────

export interface DurableStore {
  // Sessions
  getSession(id: string): Promise<StoredSession | null>;
  putSession(session: StoredSession): Promise<void>;
  updateSession(id: string, patch: Partial<StoredSession>): Promise<void>;

  // Invoices
  getInvoice(id: string): Promise<StoredInvoice | null>;
  putInvoice(invoice: StoredInvoice): Promise<void>;
  updateInvoice(id: string, patch: Partial<StoredInvoice>): Promise<void>;

  // Capabilities
  getCapability(id: string): Promise<StoredCapability | null>;
  getCapabilityByTokenHash(tokenHash: string): Promise<StoredCapability | null>;
  putCapability(cap: StoredCapability): Promise<void>;
  incrementCapabilityUses(id: string): Promise<number>;

  // Credit Ledger
  appendCreditEntry(entry: CreditLedgerEntry): Promise<void>;
  getCreditBalance(sessionId: string): Promise<string>;

  // Grants
  getGrant(id: string): Promise<StoredGrant | null>;
  putGrant(grant: StoredGrant): Promise<void>;
  consumeGrant(id: string): Promise<boolean>;

  // Effect Journal
  getEffect(id: string): Promise<EffectJournalEntry | null>;
  putEffect(entry: EffectJournalEntry): Promise<void>;
  transitionEffect(id: string, to: EffectState, reason?: string, receiptId?: string): Promise<void>;

  // Claims/Evidence metadata
  putClaim(claim: { id: string; contract_root: string; predicate: string; subject: string; statement: string }): Promise<void>;
  getClaim(id: string): Promise<any | null>;
  putEvidence(evidence: { id: string; claim_id: string; class: string; collector_id: string; observed_at: string }): Promise<void>;

  // Receipt metadata
  putReceiptMeta(receipt: { id: string; chain_id: string; index: number; root_hash: string }): Promise<void>;

  // Query
  getActiveSessions(): Promise<StoredSession[]>;
  getPendingEffects(): Promise<EffectJournalEntry[]>;
}
