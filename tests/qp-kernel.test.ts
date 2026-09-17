// tests/qp-kernel.test.ts — QP kernel tests

import { describe, it, expect } from "vitest";
import { andDag, makeClaim, computeContractRoot, merkleRoot, canonical, sha256, replayReceipt, computeReceiptHash } from "../src/qp/kernel";
import type { ProofSpec, Claim, Evidence, TransitionReceipt, JudgeBundle, GateBundle } from "../src/qp/kernel";

describe("QP Kernel", () => {
  describe("andDag", () => {
    it("TRUE + TRUE = TRUE", () => {
      expect(andDag("TRUE", "TRUE")).toBe("TRUE");
    });

    it("TRUE + FALSE = FALSE", () => {
      expect(andDag("TRUE", "FALSE")).toBe("FALSE");
    });

    it("TRUE + UNKNOWN = UNKNOWN", () => {
      expect(andDag("TRUE", "UNKNOWN")).toBe("UNKNOWN");
    });

    it("FALSE + UNKNOWN = FALSE", () => {
      expect(andDag("FALSE", "UNKNOWN")).toBe("FALSE");
    });

    it("UNKNOWN + UNKNOWN = UNKNOWN", () => {
      expect(andDag("UNKNOWN", "UNKNOWN")).toBe("UNKNOWN");
    });

    it("single value returns itself", () => {
      expect(andDag("TRUE")).toBe("TRUE");
    });

    it("empty = TRUE (vacuous)", () => {
      expect(andDag()).toBe("TRUE");
    });
  });

  describe("makeClaim", () => {
    it("creates claim with deterministic ID", () => {
      const c1 = makeClaim("test_predicate", { subject: "a" }, "test statement", "root1");
      const c2 = makeClaim("test_predicate", { subject: "a" }, "test statement", "root1");
      expect(c1.id).toBe(c2.id);
      expect(c1.id).toMatch(/^claim:/);
    });

    it("different subjects produce different IDs", () => {
      const c1 = makeClaim("pred", { subject: "a" }, "s", "root");
      const c2 = makeClaim("pred", { subject: "b" }, "s", "root");
      expect(c1.id).not.toBe(c2.id);
    });

    it("binds to contract root", () => {
      const c = makeClaim("pred", { subject: "a" }, "s", "my-root");
      expect(c.contract_root).toBe("my-root");
    });
  });

  describe("computeContractRoot", () => {
    it("produces deterministic hash from spec", () => {
      const spec: ProofSpec = {
        protocol: "qp/1",
        spec_id: "test",
        version: 1,
        claim_schema_hash: "cs",
        evidence_schema_hash: "es",
        actuality_dag: ["j1"],
        judges: [{ id: "j1", program_hash: "h1", runtime_hash: "r1", config_hash: "c1", dependencies_hash: "d1", bundle_hash: "b1" }],
        gates: [{ id: "g1", program_hash: "g1h", required: true }],
        freshness: {},
        provenance_policy_hash: "pp",
        independence_policy_hash: "ip",
        transition_program_hash: "tp",
        proof_requirement: "TRUE",
      };
      const r1 = computeContractRoot(spec);
      const r2 = computeContractRoot(spec);
      expect(r1).toBe(r2);
      expect(r1).toMatch(/^root:[a-f0-9]{64}$/);
    });
  });

  describe("merkleRoot", () => {
    it("empty array = hash of empty", () => {
      const r = merkleRoot([]);
      expect(r).toBeTruthy();
      expect(r).toMatch(/^[a-f0-9]{64}$/);
    });

    it("single item = padded hash chain", () => {
      const r = merkleRoot(["hello"]);
      // merkleRoot pads single items: sha256(sha256("hello") + ":" + 1)
      expect(r).toBe(sha256(sha256("hello") + ":1"));
    });

    it("multiple items produces consistent root", () => {
      const r1 = merkleRoot(["a", "b", "c"]);
      const r2 = merkleRoot(["a", "b", "c"]);
      expect(r1).toBe(r2);
    });

    it("different items produce different roots", () => {
      const r1 = merkleRoot(["a", "b"]);
      const r2 = merkleRoot(["a", "c"]);
      expect(r1).not.toBe(r2);
    });
  });

  describe("canonical", () => {
    it("sorts keys deterministically", () => {
      const a = canonical({ b: 2, a: 1, c: 3 });
      const b = canonical({ c: 3, a: 1, b: 2 });
      expect(a).toBe(b);
      expect(a).toBe('{"a":1,"b":2,"c":3}');
    });

    it("handles nested objects", () => {
      const a = canonical({ z: { b: 2, a: 1 } });
      const b = canonical({ z: { a: 1, b: 2 } });
      expect(a).toBe(b);
    });
  });

  describe("replayReceipt", () => {
    it("passes for valid receipt", () => {
      const spec: ProofSpec = {
        protocol: "qp/1",
        spec_id: "test",
        version: 1,
        claim_schema_hash: "cs",
        evidence_schema_hash: "es",
        actuality_dag: ["judge1"],
        judges: [{ id: "judge1", program_hash: "h1", runtime_hash: "r1", config_hash: "c1", dependencies_hash: "d1", bundle_hash: "b1" }],
        gates: [{ id: "all_pass", program_hash: "g1h", required: true }],
        freshness: {},
        provenance_policy_hash: "pp",
        independence_policy_hash: "ip",
        transition_program_hash: "tp",
        proof_requirement: "TRUE",
      };

      const claim = makeClaim("pred", { sub: "a" }, "statement", computeContractRoot(spec));

      const evidence: Evidence[] = [{
        id: "ev:1",
        class: "test",
        claim_id: claim.id,
        observed_at: new Date().toISOString(),
        source: "test",
        locator: "test",
        collector_id: "test",
        collector_program_hash: "h1",
        collector_runtime_hash: "r1",
        response_payload: "ok",
        response_hash: sha256("ok"),
        normalized_payload_hash: sha256("ok"),
        independence_group: "test",
      }];

      const now = new Date().toISOString();
      const receipt: TransitionReceipt = {
        protocol: "qp/1",
        transition_type: "RESOLVE",
        contract_root: computeContractRoot(spec),
        claim_id: claim.id,
        state_before_root: sha256("before"),
        proposal_root: sha256("proposal"),
        evidence_root: merkleRoot(evidence.map((e) => e.id)),
        judge_results_root: merkleRoot(["judge1:TRUE"]),
        gate_results_root: merkleRoot(["all_pass:TRUE"]),
        actuality: "TRUE",
        transition_program_hash: "tp",
        state_after_root: sha256("state"),
        run: {
          executor_id: "test",
          program_hash: "tp",
          runtime_hash: "r1",
          started_at: now,
          finished_at: now,
        },
        prev_receipt_hash: sha256("prev"),
        settled_at: now,
        receipt_hash: "",
        qp_signer: "test",
        qp_signature: "",
      };

      // Compute receipt hash using the canonical function
      const { receipt_hash, qp_signature, ...withoutHash } = receipt;
      receipt.receipt_hash = computeReceiptHash(withoutHash as any);

      // Build judge and gate functions that return pre-computed results
      const judgeFns = [(): any => ({ judge_id: "judge1", bundle_hash: "b1", actuality: "TRUE" as const, reasons: [], evidence_ids: ["ev:1"] })];
      const gateFns = [(): any => ({ gate_id: "all_pass", result: "TRUE" as const, proof: "ok", evidence_ids: [] })];

      const result = replayReceipt(spec, claim, evidence, judgeFns, gateFns, receipt);

      expect(result.pass).toBe(true);
      expect(result.recomputed.actuality).toBe("TRUE");
    });
  });
});
