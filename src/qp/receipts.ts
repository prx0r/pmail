// src/qp/receipts.ts — Obsigna-compatible receipt envelope
// Phase J: Adopt Agent Receipts/Obsigna envelope for signed receipts.

/**
 * Outer receipt handles: signing, canonicalization, chain, generic metadata.
 * QP extension handles: Claim, ContractRoot, Actuality, evidence root,
 * semantic replay, privacy class, identity surface root, external deps.
 *
 * Do not expose raw PII/provider secrets/phone number in receipts.
 * Use commitments where possible.
 */

import { createHash, sign, verify, generateKeyPairSync } from "crypto";
import type { Actuality, TransitionReceipt } from "./kernel";

// ─── Receipt Envelope (Obsigna-compatible) ────────────────

export interface ReceiptEnvelope {
  protocol: "receipts/1";
  /** Unique receipt ID */
  id: string;
  /** When the receipt was created */
  created_at: string;
  /** What action this receipt covers */
  action: string;
  /** Who issued the receipt */
  issuer: string;
  /** Generic outcome metadata */
  outcome: {
    status: "success" | "failure" | "unknown";
    details?: Record<string, string>;
  };
  /** QP-specific extension (the constitutional truth layer) */
  qp_extension: QPReceiptExtension;
  /** Ed25519 signature over canonical envelope bytes */
  signature: string;
  /** Public key of the signer */
  signer_key: string;
  /** Chain linkage: hash of previous receipt (append-only) */
  prev_receipt_hash?: string;
  /** Hash of this receipt (content-addressed) */
  receipt_hash: string;
}

// ─── QP Receipt Extension ─────────────────────────────────

export interface QPReceiptExtension {
  /** The claim this receipt settles */
  claim_id: string;
  /** Contract root of the ProofSpec used */
  contract_root: string;
  /** Final actuality */
  actuality: Actuality;
  /** Merkle root of evidence */
  evidence_root: string;
  /** Semantic replay result */
  replay: "PASS" | "FAIL" | "NOT_VERIFIED";
  /** Privacy classification of the operation */
  privacy: {
    class: string;
    identity_surface_root: string;
    pii_collected_by_pmail: boolean;
    payment_rail?: string;
    network_path?: string[];
    external_identity_dependencies: string[];
  };
}

// ─── Receipt Builder ──────────────────────────────────────

export interface ReceiptBuildInput {
  action: string;
  issuer: string;
  outcome: { status: "success" | "failure" | "unknown"; details?: Record<string, string> };
  qpReceipt: TransitionReceipt;
  privacy: QPReceiptExtension["privacy"];
  prevReceiptHash?: string;
}

export function buildReceiptEnvelope(input: ReceiptBuildInput): ReceiptEnvelope {
  const qpExt: QPReceiptExtension = {
    claim_id: input.qpReceipt.claim_id,
    contract_root: input.qpReceipt.contract_root,
    actuality: input.qpReceipt.actuality,
    evidence_root: input.qpReceipt.evidence_root,
    replay: "NOT_VERIFIED", // caller verifies via replayReceipt()
    privacy: input.privacy,
  };

  const envelope: Omit<ReceiptEnvelope, "receipt_hash" | "signature" | "signer_key"> = {
    protocol: "receipts/1",
    id: "rcpt:" + sha256(input.action + input.issuer + Date.now()).slice(0, 16),
    created_at: new Date().toISOString(),
    action: input.action,
    issuer: input.issuer,
    outcome: input.outcome,
    qp_extension: qpExt,
    prev_receipt_hash: input.prevReceiptHash,
  };

  const receiptHash = computeEnvelopeHash(envelope);
  return {
    ...envelope,
    receipt_hash: receiptHash,
    signature: "", // filled in by signReceipt
    signer_key: "",
  };
}

// ─── Signing ──────────────────────────────────────────────

export interface ReceiptSigner {
  publicKey: string;
  privateKey: string;
}

export function generateSigner(): ReceiptSigner {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    publicKey: publicKey.export({ type: "spki", format: "pem" }) as string,
    privateKey: privateKey.export({ type: "pkcs8", format: "pem" }) as string,
  };
}

export function signReceipt(
  envelope: ReceiptEnvelope,
  signer: ReceiptSigner,
): ReceiptEnvelope {
  const dataToSign = canonicalEnvelopeBytes(envelope);
  const sig = sign(null, Buffer.from(dataToSign), signer.privateKey);
  return {
    ...envelope,
    signature: sig.toString("base64"),
    signer_key: signer.publicKey,
  };
}

export function verifyReceiptSignature(envelope: ReceiptEnvelope): boolean {
  if (!envelope.signature || !envelope.signer_key) return false;
  try {
    return verify(
      null,
      Buffer.from(canonicalEnvelopeBytes(envelope)),
      envelope.signer_key,
      Buffer.from(envelope.signature, "base64"),
    );
  } catch {
    return false;
  }
}

// ─── Chain Verification ───────────────────────────────────

export function verifyReceiptChain(receipts: ReceiptEnvelope[]): {
  valid: boolean;
  broken_at?: number;
  reason?: string;
} {
  for (let i = 1; i < receipts.length; i++) {
    const expected = receipts[i - 1].receipt_hash;
    const actual = receipts[i].prev_receipt_hash;
    if (expected !== actual) {
      return {
        valid: false,
        broken_at: i,
        reason: `Receipt ${i} prev_hash mismatch: expected ${expected}, got ${actual}`,
      };
    }
  }
  return { valid: true };
}

// ─── QP Extension from TransitionReceipt ──────────────────

export function qpExtensionFromReceipt(
  receipt: TransitionReceipt,
  privacy: QPReceiptExtension["privacy"],
): QPReceiptExtension {
  return {
    claim_id: receipt.claim_id,
    contract_root: receipt.contract_root,
    actuality: receipt.actuality,
    evidence_root: receipt.evidence_root,
    replay: "NOT_VERIFIED",
    privacy,
  };
}

// ─── Utilities ────────────────────────────────────────────

function computeEnvelopeHash(envelope: Omit<ReceiptEnvelope, "receipt_hash" | "signature" | "signer_key">): string {
  return sha256(JSON.stringify(canonicalEnvelope(envelope)));
}

function canonicalEnvelope(envelope: any): Record<string, any> {
  const { receipt_hash, signature, signer_key, ...rest } = envelope;
  return rest;
}

function canonicalEnvelopeBytes(envelope: ReceiptEnvelope): string {
  const { signature, signer_key, receipt_hash, ...rest } = envelope;
  return JSON.stringify(rest);
}

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}
