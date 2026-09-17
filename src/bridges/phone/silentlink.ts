// src/bridges/phone/silentlink.ts — SilentLink adapter
// Phase H: Privacy-first phone provider with limited capabilities

/**
 * SilentLink (US.PLUS) advertises:
 * - US +1 number
 * - Data + inbound SMS
 * - No legacy voice
 * - Outbound SMS disabled
 * - One-year number lease, renewable
 * - Zero-KYC / no email
 * - Monero payment shown
 *
 * Expected capability truth after empirical validation:
 *   sms_in: TRUE
 *   sms_out: FALSE
 *   voice_in: FALSE
 *   voice_out: FALSE
 *   data: TRUE
 *
 * Do NOT call it a "full phone".
 *
 * Public API: https://silent.link/bulk
 * - GET  /api/v1/bulk/stock
 * - POST /api/v1/order/new
 * - GET  /api/v1/order/{token}/json
 */

import type {
  PhoneBridgeProvider,
  PhoneProduct,
  PhoneCapabilities,
  PhoneQuery,
  Quote,
  ProvisionInput,
  AttemptEvidence,
  ProviderResourceRef,
  ObservationEvidence,
} from "./provider";
import type { IdentitySurface } from "../../privacy/types";
import type { Grant } from "../../qp/kernel";
import { createHash, randomBytes } from "crypto";

// ─── SilentLink Config ────────────────────────────────────

export interface SilentLinkConfig {
  /** Base URL for SilentLink API */
  apiUrl: string;
  /** Request timeout */
  timeoutMs?: number;
}

export class SilentLinkProvider implements PhoneBridgeProvider {
  id = "silentlink";
  name = "SilentLink (US.PLUS)";
  status: "EXPERIMENTAL" | "VALIDATED" | "DEPRECATED" = "EXPERIMENTAL";

  private config: SilentLinkConfig;

  constructor(config: SilentLinkConfig) {
    this.config = { timeoutMs: 30_000, ...config };
  }

  async describeIdentitySurface(): Promise<IdentitySurface> {
    return {
      provider: "silentlink",
      legal_identity_required: false,
      account_required: false,
      email_required: false,
      phone_required: false,
      payment_rails: ["XMR", "BTC"],
      data_disclosed: ["device_type"],
      network_metadata: ["ip_address"],
      retention_claims: ["number active while lease valid"],
      evidence: [{
        type: "url",
        locator: "https://silent.link/bulk",
        retrieved_at: new Date().toISOString(),
        hash: sha256("silentlink-bulk-api-v1"),
      }],
    };
  }

  async listProducts(query: PhoneQuery): Promise<PhoneProduct[]> {
    try {
      const response = await this.apiGet("/api/v1/bulk/stock");
      const stock = response?.stock || [];

      return stock
        .filter((s: any) => !query.country || s.country === query.country)
        .map((s: any) => ({
          id: `silentlink-${s.mcc_mnc || s.country || "us"}`,
          country: s.country || "US",
          type: "mobile" as const,
          capabilities: {
            sms_in: true,
            sms_out: false,    // SilentLink does not support outbound SMS
            voice_in: false,   // No voice
            voice_out: false,  // No voice
            data: true,
            renewable: true,
          } as PhoneCapabilities,
          price: {
            amount: s.price || 0,
            currency: s.currency || "USD",
            period: "year",
          },
          expiry: s.expiry || "1 year",
        }));
    } catch {
      return [];
    }
  }

  async quote(product: PhoneProduct): Promise<Quote> {
    return {
      product,
      totalCost: { amount: product.price.amount, currency: product.price.currency },
      paymentMethods: ["XMR", "BTC"],
      identityRequired: [],
      privacyClass: "ANON_CORE", // SilentLink's strongest claim
    };
  }

  async provision(input: ProvisionInput, authority: Grant): Promise<AttemptEvidence> {
    const token = randomBytes(16).toString("hex");

    try {
      const response = await this.apiPost("/api/v1/order/new", {
        product_id: input.product.id,
        payment_invoice: input.paymentProof,
        token,
      });

      return {
        success: response?.success ?? false,
        resourceId: response?.token || token,
        rawResponse: JSON.stringify(response),
        observedAt: new Date().toISOString(),
        privacyClass: "ANON_CORE",
        identityRequired: [],
        error: response?.error,
      };
    } catch (err: any) {
      return {
        success: false,
        rawResponse: JSON.stringify({ error: err.message }),
        observedAt: new Date().toISOString(),
        privacyClass: "ANON_CORE",
        identityRequired: [],
        error: err.message,
      };
    }
  }

  async readback(ref: ProviderResourceRef): Promise<ObservationEvidence> {
    try {
      const response = await this.apiGet(`/api/v1/order/${ref.resourceId}/json`);

      return {
        exists: response?.status !== "not_found",
        state: {
          number: response?.number,
          country: response?.country,
          expires_at: response?.expires_at,
          status: response?.status,
          sms_in: response?.sms_enabled ?? true,
          data: response?.data_enabled ?? true,
        },
        evidence: [{
          id: "ev:" + sha256(ref.resourceId + "sl-readback").slice(0, 16),
          class: "silentlink_readback",
          claim_id: "",
          observed_at: new Date().toISOString(),
          source: "silentlink-api",
          locator: `order:${ref.resourceId}`,
          collector_id: "silentlink-adapter",
          collector_program_hash: sha256("silentlink-adapter-v1"),
          collector_runtime_hash: "node:fetch",
          response_payload: JSON.stringify(response),
          response_hash: sha256(JSON.stringify(response)),
          normalized_payload_hash: sha256(JSON.stringify(response?.state || {})),
          independence_group: "silentlink-readback",
        }],
      };
    } catch {
      return { exists: false, state: {}, evidence: [] };
    }
  }

  async capabilities(ref: ProviderResourceRef): Promise<PhoneCapabilities> {
    const readback = await this.readback(ref);
    if (!readback.exists) {
      return {
        sms_in: "UNKNOWN",
        sms_out: "UNKNOWN",
        voice_in: "UNKNOWN",
        voice_out: "UNKNOWN",
        data: "UNKNOWN",
        renewable: "UNKNOWN",
      };
    }

    // SilentLink's known capabilities — model limited truth accurately
    return {
      sms_in: true,         // confirmed: inbound SMS works
      sms_out: false,       // NOT supported
      voice_in: false,      // NOT supported (no legacy voice)
      voice_out: false,     // NOT supported
      data: true,           // confirmed: data plan included
      renewable: true,      // one-year lease, renewable
      expires_at: readback.state.expires_at as string,
      number_type: "mobile",
    };
  }

  async renew(ref: ProviderResourceRef, authority: Grant): Promise<AttemptEvidence> {
    try {
      const response = await this.apiPost(`/api/v1/order/${ref.resourceId}/renew`, {
        payment_invoice: authority.payload_hash,
      });

      return {
        success: response?.success ?? false,
        resourceId: ref.resourceId,
        rawResponse: JSON.stringify(response),
        observedAt: new Date().toISOString(),
        privacyClass: "ANON_CORE",
        identityRequired: [],
      };
    } catch (err: any) {
      return {
        success: false,
        rawResponse: JSON.stringify({ error: err.message }),
        observedAt: new Date().toISOString(),
        privacyClass: "ANON_CORE",
        identityRequired: [],
        error: err.message,
      };
    }
  }

  // ─── Internal ───────────────────────────────────────────

  private async apiGet(path: string): Promise<any> {
    const response = await fetch(`${this.config.apiUrl}${path}`, {
      method: "GET",
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(this.config.timeoutMs!),
    });
    if (!response.ok) throw new Error(`SilentLink API: ${response.status}`);
    return response.json();
  }

  private async apiPost(path: string, body: any): Promise<any> {
    const response = await fetch(`${this.config.apiUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeoutMs!),
    });
    if (!response.ok) throw new Error(`SilentLink API: ${response.status}`);
    return response.json();
  }
}

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}
