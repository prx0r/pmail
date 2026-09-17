// src/bridges/phone/provider.ts — Phone provider contract
// Phase F: Generic provider interface before any provider-specific assumptions.
// No provider can directly mint QP truth.

import type { IdentitySurface, PrivacyClass } from "../../privacy/types";
import type { Evidence, Grant } from "../../qp/kernel";

export interface PhoneProduct {
  id: string;
  country: string;
  type: "mobile" | "voip" | "unknown";
  capabilities: PhoneCapabilities;
  price: { amount: number; currency: string; period: string };
  expiry?: string;
}

export interface PhoneCapabilities {
  sms_in: boolean | "UNKNOWN";
  sms_out: boolean | "UNKNOWN";
  voice_in: boolean | "UNKNOWN";
  voice_out: boolean | "UNKNOWN";
  data: boolean | "UNKNOWN";
  renewable: boolean | "UNKNOWN";
  expires_at?: string;
  number_type?: "mobile" | "voip" | "unknown";
}

export interface PhoneQuery {
  country?: string;
  capabilities?: Partial<PhoneCapabilities>;
  maxPrice?: number;
  paymentRail?: "XMR" | "USD" | "any";
  privacyClass?: PrivacyClass;
}

export interface Quote {
  product: PhoneProduct;
  totalCost: { amount: number; currency: string };
  paymentMethods: string[];
  identityRequired: string[];
  privacyClass: PrivacyClass;
}

export interface ProvisionInput {
  product: PhoneProduct;
  paymentProof: string;          // invoice ID or payment reference
  authorityRef: string;          // QP grant ID
}

export interface AttemptEvidence {
  success: boolean;
  resourceId?: string;
  rawResponse: string;
  observedAt: string;
  privacyClass: PrivacyClass;
  identityRequired: string[];
  error?: string;
}

export interface ProviderResourceRef {
  providerId: string;
  resourceId: string;
}

export interface ObservationEvidence {
  exists: boolean;
  state: Record<string, any>;
  evidence: Evidence[];
}

export interface PhoneBridgeProvider {
  id: string;
  name: string;
  status: "EXPERIMENTAL" | "VALIDATED" | "DEPRECATED";

  describeIdentitySurface(): Promise<IdentitySurface>;
  listProducts(query: PhoneQuery): Promise<PhoneProduct[]>;
  quote(product: PhoneProduct): Promise<Quote>;
  provision(input: ProvisionInput, authority: Grant): Promise<AttemptEvidence>;
  readback(ref: ProviderResourceRef): Promise<ObservationEvidence>;
  capabilities(ref: ProviderResourceRef): Promise<PhoneCapabilities>;
  renew?(ref: ProviderResourceRef, authority: Grant): Promise<AttemptEvidence>;
  cancel?(ref: ProviderResourceRef, authority: Grant): Promise<AttemptEvidence>;
}

// ─── Privacy classification for providers ─────────────────

export function classifyProvider(surface: IdentitySurface): PrivacyClass {
  if (surface.legal_identity_required) return "IDENTITY_BRIDGED";
  if (surface.account_required || surface.phone_required || surface.email_required) {
    return "PSEUDONYMOUS_BRIDGE";
  }
  return "ANON_CORE";
}

// ─── Bridge selection ─────────────────────────────────────

export interface BridgeSelectionQuery {
  capabilities: string[];        // required capabilities (e.g. ["sms_in", "sms_out"])
  maxPrivacyClass: PrivacyClass;
  paymentRail: "XMR" | "USD" | "any";
  country?: string;
}

export async function selectBridge(
  providers: PhoneBridgeProvider[],
  query: BridgeSelectionQuery
): Promise<PhoneBridgeProvider[]> {
  const classOrder = { "ANON_CORE": 0, "PSEUDONYMOUS_BRIDGE": 1, "IDENTITY_BRIDGED": 2 };
  const maxClass = classOrder[query.maxPrivacyClass];

  const results: PhoneBridgeProvider[] = [];
  for (const p of providers) {
    const surface = await p.describeIdentitySurface();
    const pClass = classifyProvider(surface);
    if (classOrder[pClass] <= maxClass) {
      results.push(p);
    }
  }
  return results;
}
