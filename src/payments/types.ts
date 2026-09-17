// src/payments/types.ts — XMR payment types

/**
 * Payment lifecycle:
 * anonymous session → fresh subaddress invoice → observed payment →
 * confirmations → QP TRUE → capability minted → receipt → transparency inclusion
 */

// ─── Invoice ──────────────────────────────────────────────

export type InvoiceState = "OPEN" | "PARTIAL" | "SEEN" | "CONFIRMED" | "EXPIRED" | "CANCELLED";

export interface XmrInvoice {
  id: string;
  session_id: string;
  subaddress_index: number;
  address: string;              // XMR subaddress (public)
  address_commitment: string;   // hash of address (for privacy)
  expected_atomic: bigint;
  created_at: string;
  expires_at?: string;
  min_confirmations: number;
  state: InvoiceState;
}

// ─── Payment Observation ──────────────────────────────────

export interface PaymentObservation {
  id: string;
  invoice_id: string;
  subaddress_index: number;
  expected_atomic: bigint;
  observed_atomic: bigint;
  confirmation_count: number;
  block_height?: number;
  tx_hash?: string;
  observed_at: string;
  source: string;               // "moneropay" | "wallet-rpc" | "poll"
  runtime_hash: string;
}

// ─── Payment Policy ───────────────────────────────────────

export interface PaymentPolicy {
  /** How to handle underpayment */
  underpayment: "REJECT" | "PARTIAL_CREDIT" | "WAIT";
  /** How to handle overpayment */
  overpayment: "CREDIT_EXACT" | "CREDIT_OBSERVED" | "CREDIT_CAPPED";
  /** Maximum overpayment to credit (atomic) */
  overpayment_cap?: bigint;
  /** Confirmation requirement */
  min_confirmations: number;
  /** Invoice expiry (seconds) */
  invoice_ttl_seconds: number;
}

export const DEFAULT_PAYMENT_POLICY: PaymentPolicy = {
  underpayment: "WAIT",
  overpayment: "CREDIT_EXACT",
  min_confirmations: 10,
  invoice_ttl_seconds: 3600,
};

// ─── Wallet RPC Interface ─────────────────────────────────

export interface WalletRpcConfig {
  url: string;                  // e.g. "http://127.0.0.1:18083/json_rpc"
  username?: string;
  password?: string;
}

export interface SubAddress {
  address: string;
  index: number;
  label?: string;
}

export interface Transfer {
  txid: string;
  amount: bigint;
  confirmations: number;
  block_height?: number;
}

// ─── MoneroPay Webhook ────────────────────────────────────

export interface MoneroPayCallback {
  tx_hash: string;
  xmr_amount: string;           // atomic units as string
  payment_id: string;           // subaddress index
  confirmations: number;
  subaddr_index: { major: number; minor: number };
}
