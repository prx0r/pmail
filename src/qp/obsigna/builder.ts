// src/qp/obsigna/builder.ts — Receipt builder (obsigna-compatible W3C VC format)

/**
 * Builds AgentReceipt objects in obsigna-compatible format.
 * Replaces the custom ReceiptEnvelope from receipts.ts.
 */

import { randomUUID, createHash } from "crypto";
import { signReceipt, hashReceipt } from "./sign";
import type { AgentReceipt, ReceiptIssuer, ReceiptSubject, QPReceiptExtension, CreateReceiptInput } from "./types";
import { RECEIPT_CONTEXT, RECEIPT_VERSION } from "./types";

// ─── Receipt Builder ──────────────────────────────────────

export function buildReceipt(input: CreateReceiptInput): Omit<AgentReceipt, "proof"> {
  const receiptId = `urn:receipt:${randomUUID()}`;

  const chain: ReceiptSubject["chain"] = {
    sequence: input.subject.chain?.sequence ?? 1,
    previous_receipt_hash: input.subject.chain?.previous_receipt_hash ?? null,
    chain_id: input.subject.chain?.chain_id ?? `chain:${randomUUID()}`,
    terminal: input.subject.chain?.terminal ?? false,
    status: input.subject.chain?.status ?? "unknown",
  };

  const subject: ReceiptSubject = {
    principal: input.subject.principal,
    action: input.subject.action,
    outcome: input.subject.outcome,
    intent: input.subject.intent,
    authorization: input.subject.authorization,
    chain,
    keyRotation: input.subject.keyRotation,
    delegation: input.subject.delegation,
    qp_extension: input.qpExtension,
  };

  return {
    "@context": RECEIPT_CONTEXT,
    id: receiptId,
    type: ["VerifiableCredential", "AgentReceipt"],
    version: RECEIPT_VERSION,
    issuer: input.issuer,
    issuanceDate: new Date().toISOString(),
    credentialSubject: subject,
  };
}

// ─── Sign and finalize ────────────────────────────────────

export function buildAndSignReceipt(
  input: CreateReceiptInput,
  privateKeyPem: string,
  verificationMethod: string,
): AgentReceipt {
  const unsigned = buildReceipt(input);
  return signReceipt(unsigned, privateKeyPem, verificationMethod);
}

// ─── Extend chain ─────────────────────────────────────────

export function extendChain(
  previousReceipt: AgentReceipt,
  subject: Omit<ReceiptSubject, "chain">,
  privateKeyPem: string,
  verificationMethod: string,
): AgentReceipt {
  const previousHash = hashReceipt(previousReceipt);
  const unsigned = buildReceipt({
    issuer: previousReceipt.issuer,
    subject: {
      ...subject,
      chain: {
        sequence: previousReceipt.credentialSubject.chain.sequence + 1,
        previous_receipt_hash: previousHash,
        chain_id: previousReceipt.credentialSubject.chain.chain_id,
        terminal: false,
      },
    },
  });
  return signReceipt(unsigned, privateKeyPem, verificationMethod);
}

// ─── Terminate chain ──────────────────────────────────────

export function terminateChain(
  receipt: AgentReceipt,
  privateKeyPem: string,
  verificationMethod: string,
): AgentReceipt {
  const { proof, ...unsigned } = receipt;
  unsigned.credentialSubject.chain.terminal = true;
  unsigned.credentialSubject.chain.status = "complete";
  return signReceipt(unsigned, privateKeyPem, verificationMethod);
}

// ─── Hash receipt (for linking) ───────────────────────────

export { hashReceipt };
