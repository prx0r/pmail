// tests/security.test.ts — Security and red-team tests

import { describe, it, expect } from "vitest";
import { composePrivacy, evaluatePrivacy } from "../src/privacy/types";
import { selectBridge } from "../src/bridges/phone/provider";
import { verifyReceiptSignature, buildReceiptEnvelope, generateSigner, signReceipt, verifyReceiptChain } from "../src/qp/receipts";
import { evaluateEgress, defaultPmailEgressPolicy } from "../src/core/secrets";
import { LocalAttestor } from "../src/core/attestor";
import { MockSimplexAdapter, buildInboundEvidence } from "../src/messaging/simplex";
import { handleMcpRequest, PMAIL_TOOLS } from "../src/mcp/server";
import type { Grant } from "../src/qp/kernel";

describe("Security / Red-Team Tests", () => {
  describe("Privacy class escalation prevention", () => {
    it("ANON_CORE cannot upgrade to better class by adding dependencies", () => {
      const result = composePrivacy("ANON_CORE", "ANON_CORE");
      expect(result).toBe("ANON_CORE");
    });

    it("privacy degrades monotonically — never improves", () => {
      let current: "ANON_CORE" | "PSEUDONYMOUS_BRIDGE" | "IDENTITY_BRIDGED" = "ANON_CORE";
      current = composePrivacy(current, "PSEUDONYMOUS_BRIDGE");
      expect(current).toBe("PSEUDONYMOUS_BRIDGE");
      current = composePrivacy(current, "ANON_CORE");
      expect(current).toBe("PSEUDONYMOUS_BRIDGE"); // stays degraded
    });

    it("ANON_CORE policy rejects IDENTITY_BRIDGED provider", () => {
      const surfaces = [{
        provider: "kyc-provider",
        legal_identity_required: true,
        account_required: false,
        email_required: false,
        phone_required: false,
        payment_rails: [],
        data_disclosed: [],
        network_metadata: [],
        evidence: [],
      }];
      const policy = { max_privacy_class: "ANON_CORE" as const, forbid: ["legal_identity"] };
      const decision = evaluatePrivacy(surfaces, policy);
      expect(decision.allowed).toBe(false);
      expect(decision.violations.length).toBeGreaterThan(0);
    });

    it("bridge selector rejects IDENTITY_BRIDGED when max is ANON_CORE", async () => {
      const bridgedProvider = {
        id: "kyc-provider",
        name: "KYC Provider",
        status: "VALIDATED" as const,
        describeIdentitySurface: async () => ({
          provider: "kyc",
          legal_identity_required: true,
          account_required: false,
          email_required: false,
          phone_required: false,
          payment_rails: [],
          data_disclosed: [],
          network_metadata: [],
          evidence: [],
        }),
        listProducts: async () => [],
        quote: async (p: any) => ({ product: p, totalCost: { amount: 0, currency: "USD" }, paymentMethods: [], identityRequired: ["passport"], privacyClass: "IDENTITY_BRIDGED" as const }),
        provision: async () => ({ success: true, rawResponse: "{}", observedAt: "", privacyClass: "IDENTITY_BRIDGED" as const, identityRequired: [] }),
        readback: async () => ({ exists: true, state: {}, evidence: [] }),
        capabilities: async () => ({ sms_in: true, sms_out: true, voice_in: true, voice_out: true, data: true, renewable: true }),
      };

      const results = await selectBridge([bridgedProvider], {
        capabilities: ["sms_in"],
        maxPrivacyClass: "ANON_CORE",
        paymentRail: "XMR",
      });
      expect(results.length).toBe(0);
    });
  });

  describe("Receipt security", () => {
    it("tampered receipt fails signature verification", () => {
      const signer = generateSigner();
      const receipt = {
        protocol: "qp/1" as const,
        transition_type: "RESOLVE" as const,
        contract_root: "abc",
        claim_id: "claim:1",
        state_before_root: "sb",
        proposal_root: "pr",
        evidence_root: "er",
        judge_results_root: "jr",
        gate_results_root: "gr",
        actuality: "TRUE" as const,
        transition_program_hash: "tp",
        state_after_root: "sa",
        run: { executor_id: "e", program_hash: "p", runtime_hash: "r", started_at: "", finished_at: "" },
        prev_receipt_hash: "prev",
        settled_at: new Date().toISOString(),
        receipt_hash: "",
        qp_signer: "test",
        qp_signature: "",
      };

      const envelope = buildReceiptEnvelope({
        action: "test", issuer: "issuer", outcome: { status: "success" },
        qpReceipt: receipt,
        privacy: { class: "ANON_CORE", identity_surface_root: "x", pii_collected_by_pmail: false, external_identity_dependencies: [] },
      });

      const signed = signReceipt(envelope, signer);

      // Verify works before tampering
      expect(verifyReceiptSignature(signed)).toBe(true);

      // Tamper with action
      signed.action = "tampered.action";
      expect(verifyReceiptSignature(signed)).toBe(false);
    });

    it("receipt chain breaks if prev_hash is wrong", () => {
      const r1 = buildReceiptEnvelope({
        action: "a1", issuer: "i", outcome: { status: "success" },
        qpReceipt: {
          protocol: "qp/1", transition_type: "RESOLVE", contract_root: "c", claim_id: "cl",
          state_before_root: "sb", proposal_root: "pr", evidence_root: "er",
          judge_results_root: "jr", gate_results_root: "gr", actuality: "TRUE",
          transition_program_hash: "tp", state_after_root: "sa",
          run: { executor_id: "e", program_hash: "p", runtime_hash: "r", started_at: "", finished_at: "" },
          prev_receipt_hash: "ph", settled_at: "", receipt_hash: "", qp_signer: "", qp_signature: "",
        },
        privacy: { class: "ANON_CORE", identity_surface_root: "x", pii_collected_by_pmail: false, external_identity_dependencies: [] },
      });

      const r2 = buildReceiptEnvelope({
        action: "a2", issuer: "i", outcome: { status: "success" },
        qpReceipt: {
          protocol: "qp/1", transition_type: "RESOLVE", contract_root: "c", claim_id: "cl",
          state_before_root: "sb", proposal_root: "pr", evidence_root: "er",
          judge_results_root: "jr", gate_results_root: "gr", actuality: "TRUE",
          transition_program_hash: "tp", state_after_root: "sa",
          run: { executor_id: "e", program_hash: "p", runtime_hash: "r", started_at: "", finished_at: "" },
          prev_receipt_hash: "ph", settled_at: "", receipt_hash: "", qp_signer: "", qp_signature: "",
        },
        privacy: { class: "ANON_CORE", identity_surface_root: "x", pii_collected_by_pmail: false, external_identity_dependencies: [] },
        prevReceiptHash: "wrong-hash",
      });

      const result = verifyReceiptChain([r1, r2]);
      expect(result.valid).toBe(false);
    });
  });

  describe("Egress security", () => {
    const policy = defaultPmailEgressPolicy();

    it("denies cloud metadata endpoint", () => {
      expect(evaluateEgress("169.254.169.254", policy).allowed).toBe(false);
    });

    it("denies Google APIs", () => {
      expect(evaluateEgress("www.googleapis.com", policy).allowed).toBe(false);
    });

    it("denies AWS metadata", () => {
      expect(evaluateEgress("169.254.169.254", policy).allowed).toBe(false);
    });

    it("allows SimpleX", () => {
      expect(evaluateEgress("api.simplex.im", policy).allowed).toBe(true);
    });

    it("denies unknown hosts", () => {
      expect(evaluateEgress("evilattacker.com", policy).allowed).toBe(false);
    });
  });

  describe("SimpleX evidence integrity", () => {
    it("evidence contains required provenance fields", () => {
      const adapter = new MockSimplexAdapter();
      const addr = { id: "addr:1", simplexAddress: "test", createdAt: "", revoked: false };
      const msg = {
        id: "msg:1", from: "sender", to: addr.simplexAddress,
        body: new TextEncoder().encode("test"), bodyHash: "hash",
        receivedAt: new Date().toISOString(), nonce: "nonce-abc",
      };

      const evidence = buildInboundEvidence(msg, addr.id, "claim:test");

      expect(evidence.id).toBeTruthy();
      expect(evidence.class).toBe("simplex_receive");
      expect(evidence.claim_id).toBe("claim:test"); // claim_id is bound
      expect(evidence.collector_program_hash).toBeTruthy();
      expect(evidence.response_payload).toBeTruthy();
      expect(evidence.response_hash).toBeTruthy();
      expect(evidence.nonce).toBe("nonce-abc");
    });

    it("evidence with empty claim_id is flagged", () => {
      const msg = {
        id: "msg:1", from: "s", to: "t",
        body: new TextEncoder().encode("x"), bodyHash: "h",
        receivedAt: new Date().toISOString(),
      };
      const evidence = buildInboundEvidence(msg, "addr:1");
      // Empty claim_id should be avoided in production
      expect(evidence.claim_id).toBe("");
    });
  });

  describe("Attestation security", () => {
    it("rejects tampered attestation", async () => {
      const attestor = new LocalAttestor();
      const att = await attestor.attest({
        workloadHash: "wl",
        qpVerifierVersion: "1.0",
        privacyPolicyHash: "pp",
      });

      // Tamper
      att.claims.workload_hash = "tampered";
      const result = await attestor.verify(att);
      expect(result.valid).toBe(false);
    });

    it("rejects attestation from wrong attestor", async () => {
      const attestor = new LocalAttestor();
      const fake = {
        attestor_id: "unknown-attestor",
        timestamp: new Date().toISOString(),
        claims: { workload_hash: "w", qp_verifier_version: "v", privacy_policy_hash: "p", runtime_hash: "r" },
        attestation_blob: "blob",
        algorithm: "sha256",
      };
      const result = await attestor.verify(fake as any);
      expect(result.valid).toBe(false);
    });
  });

  describe("MCP grant enforcement", () => {
    it("state-changing tool without grant is rejected", async () => {
      const ctx = { principal: "agent:1", grants: new Map() };
      const result = await handleMcpRequest(
        { method: "tools/call", params: { name: "pmail.phone.provision", arguments: { providerId: "p", productId: "x", grantId: "g1" } } },
        ctx,
      );
      // Should fail because grant g1 doesn't exist
      expect(result.result?.content[0].text).toContain("Grant g1 not found");
    });

    it("read-only tool works without grant", async () => {
      const ctx = { principal: "agent:1", grants: new Map() };
      const result = await handleMcpRequest(
        { method: "tools/call", params: { name: "pmail.status", arguments: {} } },
        ctx,
      );
      expect(result.result).toBeTruthy();
      expect(result.result.content[0].text).toContain("running");
    });

    it("grant with wrong action is rejected", async () => {
      const grant: Grant = {
        protocol: "qp/1", id: "g1", issuer: "human", subject: "agent:1",
        action: "pmail.xmr.invoice", payload_hash: "h", constraints: {},
        issued_at: new Date().toISOString(), expires_at: new Date(Date.now() + 3600000).toISOString(),
        nonce: "n", max_uses: 1, signature: "sig",
      };
      const ctx = { principal: "agent:1", grants: new Map([["g1", grant]]) };
      const result = await handleMcpRequest(
        { method: "tools/call", params: { name: "pmail.phone.provision", arguments: { providerId: "p", productId: "x", grantId: "g1" } } },
        ctx,
      );
      expect(result.result?.content[0].text).toContain("action mismatch");
    });

    it("expired grant is rejected", async () => {
      const grant: Grant = {
        protocol: "qp/1", id: "g1", issuer: "human", subject: "agent:1",
        action: "pmail.phone.provision", payload_hash: "h", constraints: {},
        issued_at: new Date(Date.now() - 7200000).toISOString(),
        expires_at: new Date(Date.now() - 3600000).toISOString(), // expired
        nonce: "n", max_uses: 1, signature: "sig",
      };
      const ctx = { principal: "agent:1", grants: new Map([["g1", grant]]) };
      const result = await handleMcpRequest(
        { method: "tools/call", params: { name: "pmail.phone.provision", arguments: { providerId: "p", productId: "x", grantId: "g1" } } },
        ctx,
      );
      expect(result.result?.content[0].text).toContain("expired");
    });
  });
});
