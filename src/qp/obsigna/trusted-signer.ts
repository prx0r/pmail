// src/qp/obsigna/trusted-signer.ts — Trusted signer resolver (external to receipt)

/**
 * Receipt verification requires signer key to be authorized for
 * issuer/purpose/time. The signer_key inside the receipt is UNTRUSTED.
 * This module resolves trusted signers from external sources.
 */

// ─── Trusted Signer ───────────────────────────────────────

export interface TrustedSigner {
  issuer: string;           // did:agent:<id> or other issuer ID
  publicKeyPem: string;
  purpose?: string[];       // allowed action types
  validFrom?: string;       // ISO timestamp
  validUntil?: string;      // ISO timestamp
  source: "pinned" | "delegation" | "tee_attestation" | "transparency_registry";
}

export interface VerifyContext {
  /** Current timestamp for validity check */
  now?: string;
  /** Expected issuer (optional — if set, reject other issuers) */
  expectedIssuer?: string;
  /** Expected action type (optional — if set, check purpose) */
  expectedAction?: string;
}

// ─── Trust Resolver ───────────────────────────────────────

export interface SignerTrustResolver {
  /** Resolve trusted signers for a given issuer */
  resolve(issuer: string, context?: VerifyContext): Promise<TrustedSigner[]>;
}

// ─── Pinned Signer Registry (for MVP) ────────────────────

export class PinnedSignerRegistry implements SignerTrustResolver {
  private signers: Map<string, TrustedSigner[]> = new Map();

  /** Pin a signer for an issuer */
  pin(signer: TrustedSigner): void {
    const existing = this.signers.get(signer.issuer) || [];
    existing.push(signer);
    this.signers.set(signer.issuer, existing);
  }

  /** Remove all pinned signers for an issuer */
  unpin(issuer: string): void {
    this.signers.delete(issuer);
  }

  async resolve(issuer: string, context?: VerifyContext): Promise<TrustedSigner[]> {
    const signers = this.signers.get(issuer) || [];
    const now = context?.now ? new Date(context.now) : new Date();

    return signers.filter((s) => {
      // Check validity window
      if (s.validFrom && new Date(s.validFrom) > now) return false;
      if (s.validUntil && new Date(s.validUntil) < now) return false;
      // Check purpose
      if (context?.expectedAction && s.purpose && !s.purpose.includes(context.expectedAction)) return false;
      return true;
    });
  }
}

// ─── Full Verification with Trust ────────────────────────

export function verifyWithTrust(
  receipt: any,
  trustResolver: SignerTrustResolver,
  context?: VerifyContext,
): Promise<{ valid: boolean; reason?: string; signer?: TrustedSigner }> {
  // This is the production verification path:
  // 1. Resolve trusted signers for the issuer
  // 2. For each trusted signer, verify signature
  // 3. If none match, reject
  //
  // Receipt.proof.verificationMethod contains the claimed key ID
  // but we do NOT trust it — we resolve from trustResolver instead

  return trustResolver.resolve(receipt.issuer?.id, context).then(async (trustedSigners) => {
    if (trustedSigners.length === 0) {
      return { valid: false, reason: `No trusted signers for issuer: ${receipt.issuer?.id}` };
    }

    // Try each trusted signer
    const { verifyReceiptSignature } = await import("./sign");
    for (const signer of trustedSigners) {
      const result = verifyReceiptSignature(receipt, signer.publicKeyPem);
      if (result.valid) {
        return { valid: true, signer };
      }
    }

    return { valid: false, reason: "Signature verification failed against all trusted signers" };
  });
}
