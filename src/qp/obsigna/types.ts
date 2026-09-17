// src/qp/obsigna/types.ts — W3C Verifiable Credential receipt envelope (obsigna-compatible)

/**
 * Receipt format follows W3C VC Data Integrity + Agent Receipts spec.
 * Compatible with obsigna SDK verification.
 *
 * Required top-level: @context, id, type, version, issuer, issuanceDate, credentialSubject, proof
 */

export const RECEIPT_CONTEXT = [
  "https://www.w3.org/ns/credentials/v2",
  "https://agentreceipts.ai/context/v2",
];

export const RECEIPT_VERSION = "0.5.0";

export type ReceiptType = "VerifiableCredential" | "AgentReceipt";

export interface ReceiptIssuer {
  id: string;                    // did:agent:<id>
  type?: string;
  name?: string;
  /** Open container for runtime metadata (extensible without version bump) */
  runtime?: Record<string, unknown>;
}

export interface ReceiptSubject {
  principal?: { id: string };    // did:user:<id>
  action: {
    id: string;
    type: string;                // e.g. "com.pmail.session.create"
    risk_level?: "low" | "medium" | "high";
    timestamp: string;
    parameters?: Record<string, unknown>;
    /** Optional encrypted disclosure */
    parameters_disclosure?: EncryptedDisclosure;
  };
  outcome: {
    status: "success" | "failure" | "partial" | "emit_failure";
    reversible?: boolean;
    reversal_method?: string;
    state_change?: Record<string, unknown>;
    response_hash?: string;      // sha256:<hex>
    error?: string;
    /** Optional encrypted disclosure */
    response_disclosure?: EncryptedDisclosure;
  };
  intent?: {
    conversation_hash?: string;
    prompt_preview?: string;
    reasoning_hash?: string;
  };
  authorization?: {
    scopes?: string[];
    granted_at?: string;
    grant_ref?: string;
  };
  chain: {
    sequence: number;
    previous_receipt_hash: string | null;
    chain_id: string;
    terminal?: boolean;
    status?: "complete" | "interrupted" | "unknown";
  };
  keyRotation?: {
    event_type: "key_rotated";
    new_public_key: string;
    rotated_at: string;
  };
  delegation?: {
    parent_chain_id?: string;
    parent_receipt_id?: string;
    delegator?: { id: string };
  };
  /** PMail QP extension — the constitutional truth layer */
  qp_extension?: QPReceiptExtension;
}

export interface QPReceiptExtension {
  claim_id: string;
  contract_root: string;
  actuality: "TRUE" | "FALSE" | "UNKNOWN";
  evidence_root: string;
  replay: "PASS" | "FAIL" | "NOT_VERIFIED";
  privacy: {
    class: string;
    identity_surface_root: string;
    pii_collected_by_pmail: boolean;
    payment_rail?: string;
    network_path?: string[];
    external_identity_dependencies: string[];
  };
}

export interface EncryptedDisclosure {
  v: string;
  alg: string;
  recipients: Array<{ kid: string; enc: string }>;
  ct: string;
}

export interface ReceiptProof {
  type: "Ed25519Signature2020";
  created: string;
  verificationMethod: string;
  proofPurpose: "assertionMethod";
  proofValue: string;            // multibase u + base64url(Ed25519 signature)
}

export interface AgentReceipt {
  "@context": string[];
  id: string;                    // urn:receipt:<uuid>
  type: ReceiptType[];
  version: string;
  issuer: ReceiptIssuer;
  issuanceDate: string;
  credentialSubject: ReceiptSubject;
  proof: ReceiptProof;
}

// ─── Input types for creating receipts ────────────────────

export interface CreateReceiptInput {
  issuer: ReceiptIssuer;
  subject: Omit<ReceiptSubject, "chain"> & {
    chain?: Partial<ReceiptSubject["chain"]>;
  };
  qpExtension?: QPReceiptExtension;
}

// ─── Verification result ──────────────────────────────────

export interface ReceiptVerificationResult {
  valid: boolean;
  reason?: string;
  checked: {
    schema: boolean;
    signature: boolean;
    canonicalization: boolean;
    chain_linkage?: boolean;
    freshess?: boolean;
  };
}

export interface ChainVerificationResult {
  valid: boolean;
  length: number;
  status: "complete" | "interrupted" | "unknown";
  broken_at?: number;
  reason?: string;
}
