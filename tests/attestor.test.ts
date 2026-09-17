// tests/attestor.test.ts — Runtime attestation tests

import { describe, it, expect } from "vitest";
import { LocalAttestor } from "../src/core/attestor";

describe("Runtime Attestation", () => {
  const attestor = new LocalAttestor();

  it("is available", async () => {
    expect(await attestor.available()).toBe(true);
  });

  it("generates attestation (DEV_ONLY)", async () => {
    const result = await attestor.attest({
      workloadHash: "workload-123",
      qpVerifierVersion: "1.0.0",
      privacyPolicyHash: "policy-abc",
    });

    expect(result.attestor_id).toBe("local");
    expect(result.claims.workload_hash).toBe("workload-123");
    expect(result.attestation_blob).toBeTruthy();
    expect(result.algorithm).toBe("sha256-local-dev-only");
  });

  it("always fails production verification (DEV_ONLY)", async () => {
    const attestation = await attestor.attest({
      workloadHash: "wl",
      qpVerifierVersion: "1.0",
      privacyPolicyHash: "pp",
    });

    const result = await attestor.verify(attestation);
    // DEV_ONLY: LocalAttestor never produces production-valid attestation
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("DEV_ONLY");
    expect(result.checked.signature).toBe(true); // signature itself is valid
    expect(result.checked.workload_match).toBe(false); // but not production-verified
  });

  it("rejects attestation from wrong attestor", async () => {
    const fakeAttestation = {
      attestor_id: "unknown",
      timestamp: new Date().toISOString(),
      claims: {
        workload_hash: "wl",
        qp_verifier_version: "1.0",
        privacy_policy_hash: "pp",
        runtime_hash: "rh",
      },
      attestation_blob: "blob",
      algorithm: "sha256",
    };

    const result = await attestor.verify(fakeAttestation as any);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("unknown attestor");
  });
});
