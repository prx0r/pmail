// tests/attestor.test.ts — Runtime attestation tests

import { describe, it, expect } from "vitest";
import { LocalAttestor } from "../src/core/attestor";

describe("Runtime Attestation", () => {
  const attestor = new LocalAttestor();

  it("is available", async () => {
    expect(await attestor.available()).toBe(true);
  });

  it("generates attestation", async () => {
    const result = await attestor.attest({
      workloadHash: "workload-123",
      qpVerifierVersion: "1.0.0",
      privacyPolicyHash: "policy-abc",
    });

    expect(result.attestor_id).toBe("local");
    expect(result.claims.workload_hash).toBe("workload-123");
    expect(result.claims.qp_verifier_version).toBe("1.0.0");
    expect(result.claims.privacy_policy_hash).toBe("policy-abc");
    expect(result.attestation_blob).toBeTruthy();
    expect(result.algorithm).toBe("sha256-local");
  });

  it("verifies valid attestation", async () => {
    const attestation = await attestor.attest({
      workloadHash: "wl",
      qpVerifierVersion: "1.0",
      privacyPolicyHash: "pp",
    });

    const result = await attestor.verify(attestation);
    expect(result.valid).toBe(true);
    expect(result.checked.signature).toBe(true);
    expect(result.checked.freshness).toBe(true);
  });

  it("rejects tampered attestation", async () => {
    const attestation = await attestor.attest({
      workloadHash: "wl",
      qpVerifierVersion: "1.0",
      privacyPolicyHash: "pp",
    });

    // Tamper with claims
    attestation.claims.workload_hash = "tampered";
    const result = await attestor.verify(attestation);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Signature mismatch");
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
