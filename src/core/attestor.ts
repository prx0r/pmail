// src/core/attestor.ts — Runtime attestation interface (Phase L)
// TEE / dstack integration for confidential execution.

import { createHash } from "crypto";

/**
 * Attestation proves:
 * - workload/image/compose identity
 * - QP verifier version/bundle
 * - privacy-policy bundle
 * - optional receipt signer workload identity
 *
 * Do NOT make running in TEE equivalent to anonymous.
 * TEE proves execution isolation/identity, not network anonymity.
 */

// ─── Attestor Interface ───────────────────────────────────

export interface RuntimeAttestor {
  /** Unique identifier for this attestor implementation */
  id: string;
  /** Human-readable name */
  name: string;
  /** Whether TEE hardware is available */
  available(): Promise<boolean>;
  /** Generate attestation for the current runtime */
  attest(params: AttestParams): Promise<AttestationResult>;
  /** Verify an attestation from another runtime */
  verify(attestation: AttestationResult): Promise<VerificationResult>;
}

export interface AttestParams {
  /** Hash of the workload/image being attested */
  workloadHash: string;
  /** Version of the QP verifier bundle */
  qpVerifierVersion: string;
  /** Hash of the privacy policy bundle */
  privacyPolicyHash: string;
  /** Optional: hash of the receipt signer key */
  receiptSignerHash?: string;
  /** Optional: nonce for freshness */
  nonce?: string;
}

export interface AttestationResult {
  /** Attestor ID */
  attestor_id: string;
  /** Attestation timestamp */
  timestamp: string;
  /** The attested claims */
  claims: {
    workload_hash: string;
    qp_verifier_version: string;
    privacy_policy_hash: string;
    receipt_signer_hash?: string;
    runtime_hash: string;
    nonce?: string;
  };
  /** Hardware-signed attestation blob */
  attestation_blob: string;
  /** Algorithm used */
  algorithm: string;
  /** Certificate chain (if applicable) */
  certificate_chain?: string[];
}

export interface VerificationResult {
  valid: boolean;
  reason?: string;
  /** What was checked */
  checked: {
    signature: boolean;
    freshness: boolean;
    workload_match: boolean;
    qp_verifier_match: boolean;
    privacy_policy_match: boolean;
  };
  observed_at: string;
}

// ─── Local Attestor (for development/testing) ─────────────

export class LocalAttestor implements RuntimeAttestor {
  id = "local";
  name = "Local Attestor (DEV_ONLY — not for production)";

  async available(): Promise<boolean> {
    return true;
  }

  async attest(params: AttestParams): Promise<AttestationResult> {
    const timestamp = new Date().toISOString();
    const claims = {
      workload_hash: params.workloadHash,
      qp_verifier_version: params.qpVerifierVersion,
      privacy_policy_hash: params.privacyPolicyHash,
      receipt_signer_hash: params.receiptSignerHash,
      runtime_hash: sha256(`local-runtime-${process.version}-${process.arch}`),
      nonce: params.nonce,
    };

    // DEV_ONLY: content hash, not hardware-signed
    const attestation_blob = sha256(JSON.stringify(claims));

    return {
      attestor_id: this.id,
      timestamp,
      claims,
      attestation_blob,
      algorithm: "sha256-local-dev-only",
    };
  }

  async verify(attestation: AttestationResult): Promise<VerificationResult> {
    // Local attestor can only verify its own attestations
    if (attestation.attestor_id !== this.id) {
      return {
        valid: false,
        reason: `Attestation from unknown attestor: ${attestation.attestor_id}`,
        checked: {
          signature: false,
          freshness: false,
          workload_match: false,
          qp_verifier_match: false,
          privacy_policy_match: false,
        },
        observed_at: new Date().toISOString(),
      };
    }

    // Verify attestation blob matches claims
    const expectedBlob = sha256(JSON.stringify(attestation.claims));
    const signatureOk = expectedBlob === attestation.attestation_blob;

    // Check freshness (5 minutes)
    const age = Date.now() - new Date(attestation.timestamp).getTime();
    const freshnessOk = age < 5 * 60 * 1000;

    // DEV_ONLY: always fail production policy checks
    // A real TEE attestor would verify workload/runtime/policy hashes against hardware root
    return {
      valid: false, // DEV_ONLY: local attestor never produces production-valid attestation
      reason: "DEV_ONLY: LocalAttestor cannot satisfy production attestation policy. Use DStack or equivalent.",
      checked: {
        signature: signatureOk,
        freshness: freshnessOk,
        workload_match: false, // DEV_ONLY: not verified
        qp_verifier_match: false, // DEV_ONLY: not verified
        privacy_policy_match: false, // DEV_ONLY: not verified
      },
      observed_at: new Date().toISOString(),
    };
  }
}

// ─── DStack Attestor (placeholder) ────────────────────────

export class DStackAttestor implements RuntimeAttestor {
  id = "dstack";
  name = "DStack TEE Attestor";

  private dstackUrl: string;

  constructor(dstackUrl: string) {
    this.dstackUrl = dstackUrl;
  }

  async available(): Promise<boolean> {
    try {
      const resp = await fetch(`${this.dstackUrl}/health`, { signal: AbortSignal.timeout(5000) });
      return resp.ok;
    } catch {
      return false;
    }
  }

  async attest(params: AttestParams): Promise<AttestationResult> {
    // In production: call dstack attestation API
    // This returns a hardware-signed attestation report
    const response = await fetch(`${this.dstackUrl}/attest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`DStack attestation failed: ${response.status}`);
    }

    return response.json() as Promise<AttestationResult>;
  }

  async verify(attestation: AttestationResult): Promise<VerificationResult> {
    // In production: verify hardware signature against known DStack root CA
    const response = await fetch(`${this.dstackUrl}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(attestation),
    });

    if (!response.ok) {
      return {
        valid: false,
        reason: `DStack verification failed: ${response.status}`,
        checked: {
          signature: false,
          freshness: false,
          workload_match: false,
          qp_verifier_match: false,
          privacy_policy_match: false,
        },
        observed_at: new Date().toISOString(),
      };
    }

    return response.json() as Promise<VerificationResult>;
  }
}

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}
