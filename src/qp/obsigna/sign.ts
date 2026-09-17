// src/qp/obsigna/sign.ts — Ed25519 signing for obsigna-compatible receipts

/**
 * Ed25519 signing per obsigna protocol:
 * 1. Remove proof field
 * 2. Normalize required-nullable fields (previous_receipt_hash: null when absent)
 * 3. Strip optional null fields
 * 4. RFC 8785 canonicalize
 * 5. Sign canonical bytes
 * 6. Encode as multibase u + base64url
 */

import { createHash, generateKeyPairSync, sign, verify, createPrivateKey, createPublicKey } from "crypto";
import { jcsCanonicalize } from "./canonical";
import type { AgentReceipt, ReceiptProof, ReceiptVerificationResult } from "./types";

// ─── Key Generation ───────────────────────────────────────

export interface ReceiptSignerKeyPair {
  publicKey: string;     // PEM
  privateKey: string;    // PEM
  publicKeyMultibase: string; // u + base64url (for receipt)
}

export function generateReceiptKeyPair(): ReceiptSignerKeyPair {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const pub = publicKey.export({ type: "spki", format: "pem" }) as string;
  const priv = privateKey.export({ type: "pkcs8", format: "pem" }) as string;

  // Raw 32-byte public key for multibase encoding
  const rawPub = publicKey.export({ type: "spki", format: "der" }).slice(-32);
  const pubMultibase = "u" + base64urlEncode(rawPub);

  return { publicKey: pub, privateKey: priv, publicKeyMultibase: pubMultibase };
}

// ─── Signing ──────────────────────────────────────────────

export function signReceipt(
  receipt: Omit<AgentReceipt, "proof">,
  privateKeyPem: string,
  verificationMethod: string,
): AgentReceipt {
  const canonicalBytes = canonicalizeUnsignedReceipt(receipt);
  const privateKey = createPrivateKey({ key: privateKeyPem, format: "pem", type: "pkcs8" });
  const sig = sign(null, canonicalBytes, privateKey);
  const proofValue = "u" + base64urlEncode(sig);

  return {
    ...receipt,
    proof: {
      type: "Ed25519Signature2020",
      created: new Date().toISOString(),
      verificationMethod,
      proofPurpose: "assertionMethod",
      proofValue,
    },
  };
}

// ─── Verification ─────────────────────────────────────────

export function verifyReceiptSignature(
  receipt: AgentReceipt,
  publicKeyPem: string,
): ReceiptVerificationResult {
  try {
    const { proof, ...unsigned } = receipt;
    // Restore previous_receipt_hash as explicit null if missing (required-nullable)
    if (!("previous_receipt_hash" in unsigned.credentialSubject.chain)) {
      (unsigned.credentialSubject.chain as any).previous_receipt_hash = null;
    }

    const canonicalBytes = canonicalizeUnsignedReceipt(unsigned);
    const publicKey = createPublicKey({ key: publicKeyPem, format: "pem", type: "spki" });
    const sigBytes = base64urlDecode(proof.proofValue.slice(1)); // remove 'u' prefix

    const valid = verify(null, canonicalBytes, publicKey, sigBytes);

    return {
      valid,
      reason: valid ? undefined : "Ed25519 signature verification failed",
      checked: {
        schema: true,
        signature: valid,
        canonicalization: true,
      },
    };
  } catch (err: any) {
    return {
      valid: false,
      reason: `Verification error: ${err.message}`,
      checked: { schema: false, signature: false, canonicalization: false },
    };
  }
}

// ─── Chain Verification ───────────────────────────────────

export function verifyReceiptChain(
  receipts: AgentReceipt[],
  publicKeyPem: string,
): {
  valid: boolean;
  length: number;
  status: "complete" | "interrupted" | "unknown";
  broken_at?: number;
  reason?: string;
} {
  if (receipts.length === 0) {
    return { valid: false, length: 0, status: "unknown", reason: "Empty chain" };
  }

  let prevHash: string | null = null;
  let prevChainId: string | null = null;

  for (let i = 0; i < receipts.length; i++) {
    const r = receipts[i];

    // 1. Verify signature
    const sigResult = verifyReceiptSignature(r, publicKeyPem);
    if (!sigResult.valid) {
      return { valid: false, length: i + 1, status: "unknown", broken_at: i, reason: `Signature invalid at ${i}: ${sigResult.reason}` };
    }

    // 2. Check chain_id continuity
    const chainId = r.credentialSubject.chain.chain_id;
    if (prevChainId !== null && chainId !== prevChainId) {
      return { valid: false, length: i + 1, status: "unknown", broken_at: i, reason: `Chain ID mismatch at ${i}` };
    }
    prevChainId = chainId;

    // 3. Check previous_receipt_hash linkage
    if (i > 0) {
      const expected = hashReceipt(receipts[i - 1]);
      const actual = r.credentialSubject.chain.previous_receipt_hash;
      if (actual !== expected) {
        return { valid: false, length: i + 1, status: "unknown", broken_at: i, reason: `Hash linkage broken at ${i}: expected ${expected}, got ${actual}` };
      }
    } else {
      // First receipt must have null previous_receipt_hash
      if (r.credentialSubject.chain.previous_receipt_hash !== null) {
        return { valid: false, length: 1, status: "unknown", broken_at: 0, reason: "First receipt must have null previous_receipt_hash" };
      }
    }

    // 4. Check sequence
    if (r.credentialSubject.chain.sequence !== i + 1) {
      return { valid: false, length: i + 1, status: "unknown", broken_at: i, reason: `Sequence gap at ${i}: expected ${i + 1}, got ${r.credentialSubject.chain.sequence}` };
    }

    // 5. Check terminal — no receipt may follow a terminal receipt
    if (i > 0 && receipts[i - 1].credentialSubject.chain.terminal) {
      return { valid: false, length: i + 1, status: "unknown", broken_at: i, reason: `Receipt after terminal at ${i - 1}` };
    }

    prevHash = hashReceipt(r);
  }

  const last = receipts[receipts.length - 1];
  const status = last.credentialSubject.chain.terminal ? "complete" : "unknown";

  return { valid: true, length: receipts.length, status };
}

// ─── Hashing ──────────────────────────────────────────────

export function hashReceipt(receipt: AgentReceipt): string {
  const { proof, ...unsigned } = receipt;
  if (!("previous_receipt_hash" in unsigned.credentialSubject.chain)) {
    (unsigned.credentialSubject.chain as any).previous_receipt_hash = null;
  }
  const canonicalBytes = canonicalizeUnsignedReceipt(unsigned);
  const hash = createHash("sha256").update(canonicalBytes).digest("hex");
  return `sha256:${hash}`;
}

// ─── Internal ─────────────────────────────────────────────

function canonicalizeUnsignedReceipt(receipt: any): Uint8Array {
  // Normalize: remove proof, handle required-nullable fields
  const normalized = JSON.parse(JSON.stringify(receipt));
  delete normalized.proof;

  // Required-nullable: previous_receipt_hash must be explicit null when absent
  if (normalized.credentialSubject?.chain &&
      !("previous_receipt_hash" in normalized.credentialSubject.chain)) {
    normalized.credentialSubject.chain.previous_receipt_hash = null;
  }

  // Strip optional null fields (ADR-0009)
  stripNulls(normalized);

  return jcsCanonicalize(normalized);
}

function stripNulls(obj: any): void {
  if (obj === null || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach(stripNulls);
    return;
  }
  for (const key of Object.keys(obj)) {
    if (obj[key] === null && key !== "previous_receipt_hash") {
      delete obj[key];
    } else {
      stripNulls(obj[key]);
    }
  }
}

// ─── Multibase encoding ──────────────────────────────────

function base64urlEncode(data: Buffer | Uint8Array): string {
  const b64 = Buffer.from(data).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(s: string): Buffer {
  let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return Buffer.from(b64, "base64");
}
