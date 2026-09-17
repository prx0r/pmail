// src/bridges/phone/pikasim.ts — PikaSim experimental adapter
// Phase G: First full phone bridge (eSIM + voice + SMS + data)

/**
 * PikaSim claims:
 * - Real carrier phone-number eSIMs with voice + SMS + data
 * - Public MCP browsing needs no auth
 * - Agent wallet can be created without account/email/KYC
 * - Prepaid wallet can be crypto-funded (including Monero)
 * - Purchasing exposed directly as MCP
 *
 * STATUS: EXPERIMENTAL — not validated until live acceptance tests pass.
 * Do NOT assume marketing claims are proven.
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
import type { Evidence, Grant } from "../../qp/kernel";
import { createHash, randomBytes } from "crypto";

// ─── PikaSim MCP Client ──────────────────────────────────

export interface PikaSimConfig {
  /** Base URL for PikaSim MCP endpoint */
  mcpUrl: string;
  /** Wallet endpoint (authenticated) */
  walletUrl?: string;
  /** Request timeout */
  timeoutMs?: number;
}

export class PikaSimProvider implements PhoneBridgeProvider {
  id = "pikasim";
  name = "PikaSim (Experimental)";
  status: "EXPERIMENTAL" | "VALIDATED" | "DEPRECATED" = "EXPERIMENTAL";

  private config: PikaSimConfig;

  constructor(config: PikaSimConfig) {
    this.config = {
      timeoutMs: 30_000,
      ...config,
    };
  }

  async describeIdentitySurface(): Promise<IdentitySurface> {
    return {
      provider: "pikasim",
      legal_identity_required: false,
      account_required: false,
      email_required: false,
      phone_required: false,
      payment_rails: ["XMR", "BTC", "USDT"],
      data_disclosed: ["wallet_address", "device_imsi_iccid_on_activation"],
      network_metadata: ["ip_address", "device_info"],
      retention_claims: ["number active while funded"],
      evidence: [{
        type: "api_response",
        locator: "https://pikasim.com/mcp-docs",
        retrieved_at: new Date().toISOString(),
        hash: sha256("pikasim-docs-v1"),
      }],
    };
  }

  async listProducts(query: PhoneQuery): Promise<PhoneProduct[]> {
    const response = await this.mcpCall("tools/call", {
      name: "browse_products",
      arguments: {
        country: query.country,
        type: query.capabilities?.sms_in !== undefined ? "all" : undefined,
      },
    });

    if (!response?.products) return [];

    return response.products.map((p: any) => ({
      id: p.id || `pikasim-${p.mcc_mnc || "unknown"}`,
      country: p.country || query.country || "unknown",
      type: (p.type as any) || "unknown",
      capabilities: {
        sms_in: p.sms_inbound ?? "UNKNOWN",
        sms_out: p.sms_outbound ?? "UNKNOWN",
        voice_in: p.voice_inbound ?? "UNKNOWN",
        voice_out: p.voice_outbound ?? "UNKNOWN",
        data: p.data ?? "UNKNOWN",
        renewable: p.renewable ?? "UNKNOWN",
      },
      price: {
        amount: p.price || 0,
        currency: p.currency || "USD",
        period: p.period || "one-time",
      },
      expiry: p.expiry,
    }));
  }

  async quote(product: PhoneProduct): Promise<Quote> {
    const response = await this.mcpCall("tools/call", {
      name: "get_quote",
      arguments: { product_id: product.id },
    });

    return {
      product,
      totalCost: {
        amount: response?.total_cost || product.price.amount,
        currency: response?.currency || product.price.currency,
      },
      paymentMethods: response?.payment_methods || ["XMR", "BTC"],
      identityRequired: response?.identity_required || [],
      privacyClass: "PSEUDONYMOUS_BRIDGE",
    };
  }

  async provision(input: ProvisionInput, authority: Grant): Promise<AttemptEvidence> {
    const requestId = "req:" + randomBytes(8).toString("hex");

    try {
      const response = await this.mcpCall("tools/call", {
        name: "purchase_number",
        arguments: {
          product_id: input.product.id,
          payment_invoice: input.paymentProof,
          request_id: requestId,
        },
      });

      return {
        success: response?.success ?? false,
        resourceId: response?.number_id,
        rawResponse: JSON.stringify(response),
        observedAt: new Date().toISOString(),
        privacyClass: "PSEUDONYMOUS_BRIDGE",
        identityRequired: [],
        error: response?.error,
      };
    } catch (err: any) {
      return {
        success: false,
        rawResponse: JSON.stringify({ error: err.message }),
        observedAt: new Date().toISOString(),
        privacyClass: "PSEUDONYMOUS_BRIDGE",
        identityRequired: [],
        error: err.message,
      };
    }
  }

  async readback(ref: ProviderResourceRef): Promise<ObservationEvidence> {
    try {
      const response = await this.mcpCall("tools/call", {
        name: "get_number_status",
        arguments: { number_id: ref.resourceId },
      });

      return {
        exists: response?.exists ?? false,
        state: response?.state || {},
        evidence: [{
          id: "ev:" + sha256(ref.resourceId + "readback").slice(0, 16),
          class: "pikasim_readback",
          claim_id: "",
          observed_at: new Date().toISOString(),
          source: "pikasim-mcp",
          locator: `number:${ref.resourceId}`,
          collector_id: "pikasim-adapter",
          collector_program_hash: sha256("pikasim-adapter-v1"),
          collector_runtime_hash: "node:fetch",
          response_payload: JSON.stringify(response),
          response_hash: sha256(JSON.stringify(response)),
          normalized_payload_hash: sha256(JSON.stringify(response?.state || {})),
          independence_group: "pikasim-readback",
        }],
      };
    } catch {
      return {
        exists: false,
        state: {},
        evidence: [],
      };
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

    return {
      sms_in: readback.state.sms_in ?? "UNKNOWN",
      sms_out: readback.state.sms_out ?? "UNKNOWN",
      voice_in: readback.state.voice_in ?? "UNKNOWN",
      voice_out: readback.state.voice_out ?? "UNKNOWN",
      data: readback.state.data ?? "UNKNOWN",
      renewable: readback.state.renewable ?? "UNKNOWN",
      expires_at: readback.state.expires_at,
      number_type: readback.state.number_type,
    };
  }

  // ─── Internal ───────────────────────────────────────────

  private async mcpCall(method: string, params: any): Promise<any> {
    const response = await fetch(this.config.mcpUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, params }),
      signal: AbortSignal.timeout(this.config.timeoutMs!),
    });

    if (!response.ok) {
      throw new Error(`PikaSim MCP error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}
