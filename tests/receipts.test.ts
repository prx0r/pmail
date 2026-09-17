// tests/receipts.test.ts — Receipt envelope tests

import { describe, it, expect } from "vitest";
import {
  buildReceiptEnvelope,
  generateSigner,
  signReceipt,
  verifyReceiptSignature,
  verifyReceiptChain,
} from "../src/qp/receipts";
import type { TransitionReceipt } from "../src/qp/kernel";

const PRIVACY = {
  class: "ANON_CORE",
  identity_surface_root: "isr",
  pii_collected_by_pmail: false,
  external_identity_dependencies: [],
};

function makeFakeReceipt(overrides?: Partial<TransitionReceipt>): TransitionReceipt {
  const now = new Date().toISOString();
  return {
    protocol: "qp/1",
    transition_type: "RESOLVE",
    contract_root: "abc123",
    claim_id: "claim:test",
    state_before_root: "before",
    proposal_root: "proposal",
    evidence_root: "ev_root",
    judge_results_root: "judge_root",
    gate_results_root: "gate_root",
    actuality: "TRUE",
    transition_program_hash: "tp_hash",
    state_after_root: "state_root",
    run: { executor_id: "test", program_hash: "tp", runtime_hash: "r1", started_at: now, finished_at: now },
    prev_receipt_hash: "prev_hash",
    settled_at: now,
    receipt_hash: "receipt_hash",
    qp_signer: "test-signer",
    qp_signature: "sig",
    ...overrides,
  };
}

describe("Receipts", () => {
  describe("buildReceiptEnvelope", () => {
    it("creates envelope with QP extension", () => {
      const receipt = makeFakeReceipt();
      const envelope = buildReceiptEnvelope({
        action: "test.action",
        issuer: "test-issuer",
        outcome: { status: "success" },
        qpReceipt: receipt,
        privacy: PRIVACY,
      });

      expect(envelope.protocol).toBe("receipts/1");
      expect(envelope.id).toMatch(/^rcpt:/);
      expect(envelope.qp_extension.actuality).toBe("TRUE");
      expect(envelope.qp_extension.claim_id).toBe("claim:test");
      expect(envelope.qp_extension.privacy.class).toBe("ANON_CORE");
      expect(envelope.receipt_hash).toBeTruthy();
    });
  });

  describe("signing", () => {
    it("signs and verifies receipt", () => {
      const signer = generateSigner();
      const receipt = makeFakeReceipt();
      const envelope = buildReceiptEnvelope({
        action: "test",
        issuer: "issuer",
        outcome: { status: "success" },
        qpReceipt: receipt,
        privacy: PRIVACY,
      });

      const signed = signReceipt(envelope, signer);
      expect(signed.signature).toBeTruthy();
      expect(signed.signer_key).toBe(signer.publicKey);
      expect(verifyReceiptSignature(signed)).toBe(true);
    });

    it("rejects tampered receipt", () => {
      const signer = generateSigner();
      const receipt = makeFakeReceipt();
      const envelope = buildReceiptEnvelope({
        action: "test",
        issuer: "issuer",
        outcome: { status: "success" },
        qpReceipt: receipt,
        privacy: PRIVACY,
      });

      const signed = signReceipt(envelope, signer);
      signed.action = "tampered";
      expect(verifyReceiptSignature(signed)).toBe(false);
    });
  });

  describe("chain verification", () => {
    it("valid chain passes", () => {
      const r1 = buildReceiptEnvelope({
        action: "a1", issuer: "i", outcome: { status: "success" },
        qpReceipt: makeFakeReceipt(), privacy: PRIVACY,
      });
      const r2 = buildReceiptEnvelope({
        action: "a2", issuer: "i", outcome: { status: "success" },
        qpReceipt: makeFakeReceipt(), privacy: PRIVACY,
        prevReceiptHash: r1.receipt_hash,
      });

      const result = verifyReceiptChain([r1, r2]);
      expect(result.valid).toBe(true);
    });

    it("broken chain fails", () => {
      const r1 = buildReceiptEnvelope({
        action: "a1", issuer: "i", outcome: { status: "success" },
        qpReceipt: makeFakeReceipt(), privacy: PRIVACY,
      });
      const r2 = buildReceiptEnvelope({
        action: "a2", issuer: "i", outcome: { status: "success" },
        qpReceipt: makeFakeReceipt(), privacy: PRIVACY,
        prevReceiptHash: "wrong-hash",
      });

      const result = verifyReceiptChain([r1, r2]);
      expect(result.valid).toBe(false);
      expect(result.broken_at).toBe(1);
    });
  });
});
