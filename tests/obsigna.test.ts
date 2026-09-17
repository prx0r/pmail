// tests/obsigna.test.ts — obsigna-compatible receipt tests

import { describe, it, expect } from "vitest";
import {
  canonicalJson,
  generateReceiptKeyPair,
  signReceipt,
  verifyReceiptSignature,
  verifyReceiptChain,
  hashReceipt,
  buildReceipt,
  buildAndSignReceipt,
  extendChain,
  terminateChain,
  PinnedSignerRegistry,
} from "../src/qp/obsigna";
import type { AgentReceipt, CreateReceiptInput } from "../src/qp/obsigna";

describe("RFC 8785 Canonicalization", () => {
  it("sorts object keys deterministically", () => {
    const a = canonicalJson({ z: 1, a: 2, m: 3 });
    const b = canonicalJson({ m: 3, a: 2, z: 1 });
    expect(a).toBe(b);
    expect(a).toBe('{"a":2,"m":3,"z":1}');
  });

  it("no whitespace", () => {
    const result = canonicalJson({ a: 1, b: [2, 3] });
    expect(result).not.toContain(" ");
  });

  it("handles nested objects", () => {
    const a = canonicalJson({ z: { b: 2, a: 1 } });
    const b = canonicalJson({ z: { a: 1, b: 2 } });
    expect(a).toBe(b);
  });

  it("handles strings with special chars", () => {
    const result = canonicalJson({ s: 'line\nwith\t"quotes"' });
    expect(result).toContain("\\n");
    expect(result).toContain("\\t");
    expect(result).toContain('\\"');
  });

  it("handles null in arrays", () => {
    const result = canonicalJson([1, null, 3]);
    expect(result).toBe("[1,null,3]");
  });

  it("UTF-8 pass-through (ensure_ascii=false)", () => {
    const result = canonicalJson({ s: "日本語" });
    expect(result).toBe('{"s":"日本語"}');
  });
});

describe("Receipt Signing (obsigna-compatible)", () => {
  const keys = generateReceiptKeyPair();

  it("generates Ed25519 keypair with multibase public key", () => {
    expect(keys.publicKey).toContain("BEGIN PUBLIC KEY");
    expect(keys.privateKey).toContain("BEGIN PRIVATE KEY");
    expect(keys.publicKeyMultibase).toMatch(/^u[A-Za-z0-9_-]+$/);
  });

  it("signs and verifies receipt", () => {
    const unsigned = buildReceipt({
      issuer: { id: "did:agent:test-agent" },
      subject: {
        action: { id: "act_1", type: "test.action", timestamp: new Date().toISOString() },
        outcome: { status: "success" },
      },
    });

    const signed = signReceipt(unsigned, keys.privateKey, `${keys.publicKeyMultibase}`);
    expect(signed.proof).toBeTruthy();
    expect(signed.proof.type).toBe("Ed25519Signature2020");
    expect(signed.proof.proofValue).toMatch(/^u[A-Za-z0-9_-]+$/);

    const result = verifyReceiptSignature(signed, keys.publicKey);
    expect(result.valid).toBe(true);
  });

  it("rejects tampered receipt", () => {
    const unsigned = buildReceipt({
      issuer: { id: "did:agent:test" },
      subject: {
        action: { id: "act_1", type: "test", timestamp: new Date().toISOString() },
        outcome: { status: "success" },
      },
    });

    const signed = signReceipt(unsigned, keys.privateKey, "vm:1");
    // Tamper with action type
    signed.credentialSubject.action.type = "tampered.action";

    const result = verifyReceiptSignature(signed, keys.publicKey);
    expect(result.valid).toBe(false);
  });

  it("rejects receipt signed with wrong key", () => {
    const otherKeys = generateReceiptKeyPair();
    const unsigned = buildReceipt({
      issuer: { id: "did:agent:test" },
      subject: {
        action: { id: "act_1", type: "test", timestamp: new Date().toISOString() },
        outcome: { status: "success" },
      },
    });

    const signed = signReceipt(unsigned, keys.privateKey, "vm:1");
    const result = verifyReceiptSignature(signed, otherKeys.publicKey);
    expect(result.valid).toBe(false);
  });
});

describe("Receipt Hashing", () => {
  it("produces deterministic hash", () => {
    const keys = generateReceiptKeyPair();
    const unsigned = buildReceipt({
      issuer: { id: "did:agent:test" },
      subject: {
        action: { id: "act_1", type: "test", timestamp: "2026-01-01T00:00:00Z" },
        outcome: { status: "success" },
      },
    });
    const signed = signReceipt(unsigned, keys.privateKey, "vm:1");

    const h1 = hashReceipt(signed);
    const h2 = hashReceipt(signed);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("different receipts produce different hashes", () => {
    const keys = generateReceiptKeyPair();
    const r1 = signReceipt(
      buildReceipt({ issuer: { id: "a" }, subject: { action: { id: "1", type: "x", timestamp: "" }, outcome: { status: "success" } } }),
      keys.privateKey, "vm:1"
    );
    const r2 = signReceipt(
      buildReceipt({ issuer: { id: "b" }, subject: { action: { id: "2", type: "y", timestamp: "" }, outcome: { status: "success" } } }),
      keys.privateKey, "vm:1"
    );
    expect(hashReceipt(r1)).not.toBe(hashReceipt(r2));
  });
});

describe("Chain Verification", () => {
  const keys = generateReceiptKeyPair();

  it("valid chain passes", () => {
    const r1 = buildAndSignReceipt(
      { issuer: { id: "did:agent:a" }, subject: { action: { id: "1", type: "t", timestamp: "" }, outcome: { status: "success" } } },
      keys.privateKey, "vm:1"
    );
    const r2 = extendChain(r1, { action: { id: "2", type: "t", timestamp: "" }, outcome: { status: "success" } }, keys.privateKey, "vm:1");

    const result = verifyReceiptChain([r1, r2], keys.publicKey);
    expect(result.valid).toBe(true);
    expect(result.length).toBe(2);
  });

  it("broken hash linkage fails", () => {
    const r1 = buildAndSignReceipt(
      { issuer: { id: "did:agent:a" }, subject: { action: { id: "1", type: "t", timestamp: "" }, outcome: { status: "success" } } },
      keys.privateKey, "vm:1"
    );
    const r2 = buildAndSignReceipt(
      {
        issuer: { id: "did:agent:a" },
        subject: {
          action: { id: "2", type: "t", timestamp: "" },
          outcome: { status: "success" },
          chain: { sequence: 2, previous_receipt_hash: "sha256:wrong", chain_id: r1.credentialSubject.chain.chain_id },
        },
      },
      keys.privateKey, "vm:1"
    );

    const result = verifyReceiptChain([r1, r2], keys.publicKey);
    expect(result.valid).toBe(false);
    expect(result.broken_at).toBe(1);
  });

  it("receipt after terminal fails", () => {
    const r1 = buildAndSignReceipt(
      { issuer: { id: "did:agent:a" }, subject: { action: { id: "1", type: "t", timestamp: "" }, outcome: { status: "success" } } },
      keys.privateKey, "vm:1"
    );
    const terminated = terminateChain(r1, keys.privateKey, "vm:1");
    const r2 = extendChain(terminated, { action: { id: "2", type: "t", timestamp: "" }, outcome: { status: "success" } }, keys.privateKey, "vm:1");

    const result = verifyReceiptChain([terminated, r2], keys.publicKey);
    expect(result.valid).toBe(false);
    expect(result.broken_at).toBe(1);
  });

  it("sequence gap fails", () => {
    const r1 = buildAndSignReceipt(
      { issuer: { id: "did:agent:a" }, subject: { action: { id: "1", type: "t", timestamp: "" }, outcome: { status: "success" } } },
      keys.privateKey, "vm:1"
    );
    // Skip sequence 2, go to 3
    const r3 = buildAndSignReceipt(
      {
        issuer: { id: "did:agent:a" },
        subject: {
          action: { id: "3", type: "t", timestamp: "" },
          outcome: { status: "success" },
          chain: { sequence: 3, previous_receipt_hash: hashReceipt(r1), chain_id: r1.credentialSubject.chain.chain_id },
        },
      },
      keys.privateKey, "vm:1"
    );

    const result = verifyReceiptChain([r1, r3], keys.publicKey);
    expect(result.valid).toBe(false);
    expect(result.broken_at).toBe(1);
  });
});

describe("Trusted Signer Registry", () => {
  it("resolves pinned signers", async () => {
    const keys = generateReceiptKeyPair();
    const registry = new PinnedSignerRegistry();
    registry.pin({
      issuer: "did:agent:test",
      publicKeyPem: keys.publicKey,
      source: "pinned",
    });

    const signers = await registry.resolve("did:agent:test");
    expect(signers.length).toBe(1);
    expect(signers[0].publicKeyPem).toBe(keys.publicKey);
  });

  it("returns empty for unknown issuer", async () => {
    const registry = new PinnedSignerRegistry();
    const signers = await registry.resolve("did:agent:unknown");
    expect(signers.length).toBe(0);
  });

  it("filters by validity window", async () => {
    const keys = generateReceiptKeyPair();
    const registry = new PinnedSignerRegistry();
    registry.pin({
      issuer: "did:agent:test",
      publicKeyPem: keys.publicKey,
      source: "pinned",
      validUntil: "2020-01-01T00:00:00Z", // expired
    });

    const signers = await registry.resolve("did:agent:test");
    expect(signers.length).toBe(0);
  });
});

describe("QP Extension", () => {
  it("receipt with QP extension preserves it through signing", () => {
    const keys = generateReceiptKeyPair();
    const qpExt = {
      claim_id: "claim:test",
      contract_root: "root:abc",
      actuality: "TRUE" as const,
      evidence_root: "ev:123",
      replay: "PASS" as const,
      privacy: {
        class: "ANON_CORE",
        identity_surface_root: "isr:1",
        pii_collected_by_pmail: false,
        external_identity_dependencies: [],
      },
    };

    const signed = buildAndSignReceipt(
      { issuer: { id: "did:agent:a" }, subject: { action: { id: "1", type: "t", timestamp: "" }, outcome: { status: "success" } }, qpExtension: qpExt },
      keys.privateKey, "vm:1"
    );

    expect(signed.credentialSubject.qp_extension).toBeTruthy();
    expect(signed.credentialSubject.qp_extension!.actuality).toBe("TRUE");
    expect(signed.credentialSubject.qp_extension!.privacy.class).toBe("ANON_CORE");

    // Signature should verify with the extension
    const result = verifyReceiptSignature(signed, keys.publicKey);
    expect(result.valid).toBe(true);
  });
});
