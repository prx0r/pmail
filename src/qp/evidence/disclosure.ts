// src/qp/evidence/disclosure.ts — Disclosure manifest (public vs private projections)

/**
 * DisclosureManifestV1 defines what is public vs private in a receipt.
 * Public receipt scan must contain no PII, phone numbers, XMR addresses,
 * SimpleX addresses, raw messages, provider tokens, or credentials.
 */

// ─── Disclosure Manifest ──────────────────────────────────

export interface DisclosureManifestV1 {
  protocol: "pmail.disclosure/1";
  manifest_id: string;
  created_at: string;
  /** Fields that ARE included in the public receipt */
  public_fields: string[];
  /** Fields that are EXCLUDED from the public receipt */
  private_fields: string[];
  /** Commitments to private data (hashes, not values) */
  private_commitments: Record<string, string>;
  /** Privacy classification of this disclosure */
  privacy_class: string;
}

// ─── Public Receipt Projection ────────────────────────────

export interface PublicReceipt {
  /** Obsigna-compatible W3C VC envelope */
  receipt_id: string;
  issuer_id: string;
  issuance_date: string;
  action_type: string;
  action_risk_level?: string;
  outcome_status: string;
  /** QP extension (public parts only) */
  qp: {
    claim_id: string;
    actuality: string;
    replay: string;
    privacy_class: string;
    pii_collected: boolean;
    external_deps_count: number;
  };
  /** Chain info (no PII) */
  chain: {
    sequence: number;
    chain_id: string;
    terminal: boolean;
  };
  /** Evidence root only — no raw evidence */
  evidence_root: string;
  /** Commitment to private data */
  disclosure_manifest_id: string;
}

// ─── Build public projection ──────────────────────────────

export function buildPublicReceipt(receipt: any, manifest: DisclosureManifestV1): PublicReceipt {
  const subject = receipt.credentialSubject;
  const qp = subject.qp_extension;

  return {
    receipt_id: receipt.id,
    issuer_id: receipt.issuer?.id || "",
    issuance_date: receipt.issuanceDate || "",
    action_type: subject.action?.type || "",
    action_risk_level: subject.action?.risk_level,
    outcome_status: subject.outcome?.status || "",
    qp: {
      claim_id: qp?.claim_id || "",
      actuality: qp?.actuality || "UNKNOWN",
      replay: qp?.replay || "NOT_VERIFIED",
      privacy_class: qp?.privacy?.class || "UNKNOWN",
      pii_collected: qp?.privacy?.pii_collected_by_pmail || false,
      external_deps_count: qp?.privacy?.external_identity_dependencies?.length || 0,
    },
    chain: {
      sequence: subject.chain?.sequence || 0,
      chain_id: subject.chain?.chain_id || "",
      terminal: subject.chain?.terminal || false,
    },
    evidence_root: qp?.evidence_root || "",
    disclosure_manifest_id: manifest.manifest_id,
  };
}

// ─── PII scanner — verify no sensitive data in public receipt ──

const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,  // email
  /\b\+?\d{10,15}\b/,  // phone numbers
  /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/,  // Bitcoin addresses
  /\b4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}\b/,  // Monero addresses
  /simplex:\/\//,  // SimpleX addresses
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,  // IP addresses
  /BEGIN (PUBLIC|PRIVATE) KEY/,  // keys
  /sk-[a-zA-Z0-9]{20,}/,  // API keys
  /Bearer [a-zA-Z0-9._-]+/,  // bearer tokens
];

export function scanForPII(text: string): string[] {
  const findings: string[] = [];
  for (const pattern of PII_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      findings.push(`PII detected: ${matches[0]} (pattern: ${pattern.source})`);
    }
  }
  return findings;
}

// ─── Validate public receipt is clean ─────────────────────

export function validatePublicReceipt(publicReceipt: PublicReceipt): { clean: boolean; findings: string[] } {
  const text = JSON.stringify(publicReceipt);
  const findings = scanForPII(text);
  return { clean: findings.length === 0, findings };
}
