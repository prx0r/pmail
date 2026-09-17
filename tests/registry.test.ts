// tests/registry.test.ts — QP Registry / Replay V2 tests

import { describe, it, expect } from "vitest";
import {
  createRegistry,
  createProgramBundle,
  ProofSpecRegistry,
  JudgeRegistry,
  GateRegistry,
  replayReceiptV2,
} from "../src/qp/registry";
import { computeContractRoot } from "../src/qp/kernel";
import { signReceipt, generateReceiptKeyPair, buildReceipt, hashReceipt, extendChain, verifyReceiptChain } from "../src/qp/obsigna";
import type { AgentReceipt, QPReceiptExtension } from "../src/qp/obsigna";
import type { JudgeResult, GateResult } from "../src/qp/registry/types";

describe("Program Bundle", () => {
  it("creates deterministic bundle from inputs", () => {
    const b1 = createProgramBundle({ name: "test-judge", sourceHash: "abc123" });
    const b2 = createProgramBundle({ name: "test-judge", sourceHash: "abc123" });
    expect(b1.bundleHash).toBe(b2.bundleHash);
    expect(b1.id).toMatch(/^bundle:[a-f0-9]{64}$/);
  });

  it("different inputs produce different bundles", () => {
    const b1 = createProgramBundle({ name: "j1", sourceHash: "aaa" });
    const b2 = createProgramBundle({ name: "j1", sourceHash: "bbb" });
    expect(b1.bundleHash).not.toBe(b2.bundleHash);
  });
});

describe("ProofSpec Registry", () => {
  it("registers and retrieves specs", () => {
    const reg = new ProofSpecRegistry();
    reg.register("test_spec", 1, { judges: [] }, "root:abc");
    expect(reg.has("test_spec", 1)).toBe(true);
    expect(reg.get("test_spec", 1)?.contractRoot).toBe("root:abc");
  });

  it("returns undefined for unknown spec", () => {
    const reg = new ProofSpecRegistry();
    expect(reg.has("unknown", 1)).toBe(false);
  });
});

describe("Judge/Gate Registry", () => {
  it("registers and retrieves judges", () => {
    const reg = new JudgeRegistry();
    const bundle = createProgramBundle({ name: "test", sourceHash: "x" });
    reg.register("judge_test", bundle.bundleHash, {
      bundle,
      evaluate: (e) => ({ judge_id: "judge_test", bundle_hash: bundle.bundleHash, actuality: "TRUE", reasons: [], evidence_ids: [] }),
    });
    expect(reg.has("judge_test", bundle.bundleHash)).toBe(true);
  });

  it("registers and retrieves gates", () => {
    const reg = new GateRegistry();
    const bundle = createProgramBundle({ name: "gate", sourceHash: "x" });
    reg.register("gate_test", bundle.bundleHash, {
      bundle,
      evaluate: (e, j) => ({ gate_id: "gate_test", result: "TRUE", proof: "ok", evidence_ids: [] }),
    });
    expect(reg.has("gate_test", bundle.bundleHash)).toBe(true);
  });
});

describe("Replay V2", () => {
  const keys = generateReceiptKeyPair();

  function makeReceipt(qpExt: QPReceiptExtension): AgentReceipt {
    return buildAndSign({
      issuer: { id: "did:agent:test" },
      subject: {
        action: { id: "act_1", type: "test.action", timestamp: new Date().toISOString() },
        outcome: { status: "success" },
      },
      qpExtension: qpExt,
    });
  }

  function buildAndSign(input: any): AgentReceipt {
    const unsigned = buildReceipt(input);
    return signReceipt(unsigned, keys.privateKey, "vm:1");
  }

  it("FULL mode verifies valid receipt with registered programs", () => {
    // 1. Create judge and gate bundles
    const judgeBundle = createProgramBundle({ name: "always_true", sourceHash: "jt" });
    const gateBundle = createProgramBundle({ name: "all_pass", sourceHash: "gp" });

    // 2. Create and register ProofSpec
    const spec = {
      protocol: "qp/1",
      spec_id: "test_spec",
      version: 1,
      judges: [{ id: "always_true", program_hash: judgeBundle.bundleHash }],
      gates: [{ id: "all_pass", program_hash: gateBundle.bundleHash, required: true }],
    };
    const contractRoot = "root:" + judgeBundle.bundleHash;

    const registry = createRegistry();
    registry.proofSpecs.register("test_spec", 1, spec, contractRoot);
    registry.judges.register("always_true", judgeBundle.bundleHash, {
      bundle: judgeBundle,
      evaluate: (e) => ({
        judge_id: "always_true",
        bundle_hash: judgeBundle.bundleHash,
        actuality: "TRUE" as const,
        reasons: [],
        evidence_ids: e.map((x: any) => x.id),
      }),
    });
    registry.gates.register("all_pass", gateBundle.bundleHash, {
      bundle: gateBundle,
      evaluate: (e, j) => ({
        gate_id: "all_pass",
        result: "TRUE" as const,
        proof: "all judges true",
        evidence_ids: [],
      }),
    });

    // 3. Create receipt with QP extension
    const qpExt: QPReceiptExtension = {
      claim_id: "claim:test",
      contract_root: contractRoot,
      actuality: "TRUE",
      evidence_root: "empty",
      replay: "NOT_VERIFIED",
      privacy: { class: "ANON_CORE", identity_surface_root: "x", pii_collected_by_pmail: false, external_identity_dependencies: [] },
    };

    const receipt = makeReceipt(qpExt);

    // 4. Replay
    const result = replayReceiptV2(
      receipt,
      {
        claim_id: "claim:test",
        contract_root: contractRoot,
        actuality: "TRUE",
        evidence_root: "empty",
        evidence: [],
        spec_id: "test_spec",
        spec_version: 1,
      },
      registry,
      "FULL",
      keys.publicKey,
    );

    console.log("REPLAY RESULT:", JSON.stringify(result, null, 2));
    expect(result.valid).toBe(true);
    expect(result.mode).toBe("FULL");
    expect(result.checked.signature).toBe(true);
    expect(result.checked.contractRoot).toBe(true);
    expect(result.checked.actualityDag).toBe(true);
    expect(result.recomputed.actuality).toBe("TRUE");
  });

  it("rejects when ProofSpec not in registry", () => {
    const registry = createRegistry();
    const qpExt: QPReceiptExtension = {
      claim_id: "c", contract_root: "r", actuality: "TRUE",
      evidence_root: "e", replay: "PASS",
      privacy: { class: "ANON_CORE", identity_surface_root: "x", pii_collected_by_pmail: false, external_identity_dependencies: [] },
    };
    const receipt = makeReceipt(qpExt);

    const result = replayReceiptV2(receipt, {
      claim_id: "c", contract_root: "r", actuality: "TRUE",
      evidence_root: "e", evidence: [], spec_id: "unknown", spec_version: 1,
    }, registry, "FULL");

    expect(result.valid).toBe(false);
    expect(result.reason).toContain("not found in registry");
  });

  it("rejects when judge not in registry", () => {
    const registry = createRegistry();
    const spec = {
      spec_id: "test", version: 1,
      judges: [{ id: "missing_judge", program_hash: "nonexistent" }],
      gates: [],
    };
    registry.proofSpecs.register("test", 1, spec, "root:x");

    const qpExt: QPReceiptExtension = {
      claim_id: "c", contract_root: "root:x", actuality: "TRUE",
      evidence_root: "e", replay: "PASS",
      privacy: { class: "ANON_CORE", identity_surface_root: "x", pii_collected_by_pmail: false, external_identity_dependencies: [] },
    };
    const receipt = makeReceipt(qpExt);

    const result = replayReceiptV2(receipt, {
      claim_id: "c", contract_root: "root:x", actuality: "TRUE",
      evidence_root: "e", evidence: [], spec_id: "test", spec_version: 1,
    }, registry, "FULL");

    expect(result.valid).toBe(false);
    expect(result.reason).toContain("not found in registry");
  });

  it("CRYPTO mode only checks signature", () => {
    const registry = createRegistry();
    const qpExt: QPReceiptExtension = {
      claim_id: "c", contract_root: "r", actuality: "TRUE",
      evidence_root: "e", replay: "PASS",
      privacy: { class: "ANON_CORE", identity_surface_root: "x", pii_collected_by_pmail: false, external_identity_dependencies: [] },
    };
    const receipt = makeReceipt(qpExt);

    const result = replayReceiptV2(receipt, {
      claim_id: "c", contract_root: "r", actuality: "TRUE",
      evidence_root: "e", evidence: [], spec_id: "any", spec_version: 1,
    }, registry, "CRYPTO", keys.publicKey);

    expect(result.valid).toBe(true);
    expect(result.mode).toBe("CRYPTO");
    expect(result.checked.signature).toBe(true);
  });
});

describe("Chain with QP extension", () => {
  const keys = generateReceiptKeyPair();

  it("chain verification works with obsigna receipts", () => {
    const r1 = buildReceipt({
      issuer: { id: "did:agent:test" },
      subject: {
        action: { id: "a1", type: "t", timestamp: "" },
        outcome: { status: "success" },
      },
    });
    const signed1 = signReceipt(r1, keys.privateKey, "vm:1");

    const r2 = extendChain(signed1, {
      action: { id: "a2", type: "t", timestamp: "" },
      outcome: { status: "success" },
    }, keys.privateKey, "vm:1");

    const result = verifyReceiptChain([signed1, r2], keys.publicKey);
    expect(result.valid).toBe(true);
    expect(result.length).toBe(2);
  });
});
