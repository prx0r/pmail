// tests/evidence.test.ts — Private evidence tree + disclosure tests

import { describe, it, expect } from "vitest";
import {
  evidenceLeafHash,
  buildEvidenceMerkleTree,
  generateInclusionProof,
  verifyInclusionProof,
  buildPublicReceipt,
  scanForPII,
  validatePublicReceipt,
} from "../src/qp/evidence";

describe("Evidence Merkle Tree", () => {
  it("empty tree has defined root", () => {
    const tree = buildEvidenceMerkleTree([]);
    expect(tree.root).toBeTruthy();
    expect(tree.size).toBe(0);
  });

  it("single leaf tree", () => {
    const tree = buildEvidenceMerkleTree([{ id: "ev:1", data: "test" }]);
    expect(tree.size).toBe(1);
    expect(tree.leaves.length).toBe(1);
    expect(tree.root).toBeTruthy();
  });

  it("deterministic — same input produces same root", () => {
    const items = [{ id: "ev:1" }, { id: "ev:2" }, { id: "ev:3" }];
    const t1 = buildEvidenceMerkleTree(items);
    const t2 = buildEvidenceMerkleTree(items);
    expect(t1.root).toBe(t2.root);
  });

  it("different order produces different root", () => {
    const t1 = buildEvidenceMerkleTree([{ id: "a" }, { id: "b" }]);
    const t2 = buildEvidenceMerkleTree([{ id: "b" }, { id: "a" }]);
    expect(t1.root).not.toBe(t2.root);
  });

  it("modifying raw payload changes root", () => {
    const t1 = buildEvidenceMerkleTree([{ id: "ev:1", data: "original" }]);
    const t2 = buildEvidenceMerkleTree([{ id: "ev:1", data: "tampered" }]);
    expect(t1.root).not.toBe(t2.root);
  });

  it("domain-separated leaf hash is not plain sha256", () => {
    const h = evidenceLeafHash({ id: "test" });
    // Should not equal plain sha256 of JSON
    const plainHash = require("crypto").createHash("sha256").update(JSON.stringify({ id: "test" })).digest("hex");
    expect(h).not.toBe(plainHash);
  });
});

describe("Inclusion Proofs", () => {
  it("generates and verifies inclusion proof", () => {
    const items = [{ id: "ev:1" }, { id: "ev:2" }, { id: "ev:3" }, { id: "ev:4" }];
    const tree = buildEvidenceMerkleTree(items);

    for (let i = 0; i < items.length; i++) {
      const proof = generateInclusionProof(tree, i);
      expect(proof).toBeTruthy();
      expect(verifyInclusionProof(proof!)).toBe(true);
    }
  });

  it("rejects proof with wrong root", () => {
    const tree = buildEvidenceMerkleTree([{ id: "ev:1" }, { id: "ev:2" }]);
    const proof = generateInclusionProof(tree, 0);
    expect(proof).toBeTruthy();
    proof!.root = "wrong_root";
    expect(verifyInclusionProof(proof!)).toBe(false);
  });

  it("rejects proof with tampered leaf", () => {
    const tree = buildEvidenceMerkleTree([{ id: "ev:1" }, { id: "ev:2" }]);
    const proof = generateInclusionProof(tree, 0);
    expect(proof).toBeTruthy();
    proof!.leafHash = "tampered";
    expect(verifyInclusionProof(proof!)).toBe(false);
  });

  it("returns null for out-of-range index", () => {
    const tree = buildEvidenceMerkleTree([{ id: "ev:1" }]);
    expect(generateInclusionProof(tree, 5)).toBeNull();
  });
});

describe("Disclosure / PII Scanning", () => {
  it("detects email addresses", () => {
    const findings = scanForPII("Contact me at user@example.com");
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0]).toContain("user@example.com");
  });

  it("detects phone numbers", () => {
    const findings = scanForPII("Call +447911123456");
    expect(findings.length).toBeGreaterThan(0);
  });

  it("detects IP addresses", () => {
    const findings = scanForPII("Server at 192.168.1.1");
    expect(findings.length).toBeGreaterThan(0);
  });

  it("detects API keys", () => {
    const findings = scanForPII("Key: sk-abc123def456ghi789jklmnop");
    expect(findings.length).toBeGreaterThan(0);
  });

  it("clean public receipt passes", () => {
    const publicReceipt = {
      receipt_id: "urn:receipt:test",
      issuer_id: "did:agent:test",
      action_type: "test.action",
      outcome_status: "success",
      qp: { actuality: "TRUE", privacy_class: "ANON_CORE", pii_collected: false, external_deps_count: 0 },
      chain: { sequence: 1, chain_id: "c1", terminal: false },
      evidence_root: "sha256:abc123",
      disclosure_manifest_id: "dm:1",
    };
    const result = validatePublicReceipt(publicReceipt as any);
    expect(result.clean).toBe(true);
  });

  it("public receipt with PII is flagged", () => {
    const publicReceipt = {
      receipt_id: "urn:receipt:test",
      issuer_id: "did:agent:test",
      action_type: "test.action",
      outcome_status: "success",
      qp: { actuality: "TRUE", privacy_class: "ANON_CORE", pii_collected: false },
      chain: { sequence: 1, chain_id: "c1", terminal: false },
      evidence_root: "sha256:abc",
      // This would be a bug — PII leaked into public receipt
      phone: "+447911123456",
      disclosure_manifest_id: "dm:1",
    };
    const result = validatePublicReceipt(publicReceipt as any);
    expect(result.clean).toBe(false);
    expect(result.findings.length).toBeGreaterThan(0);
  });
});
