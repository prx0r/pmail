// tests/bridges.test.ts — Phone bridge provider tests

import { describe, it, expect } from "vitest";
import { classifyProvider, selectBridge } from "../src/bridges/phone/provider";
import type { IdentitySurface } from "../src/privacy/types";
import type { PhoneBridgeProvider, PhoneQuery, PhoneProduct, Quote, ProvisionInput, AttemptEvidence, ProviderResourceRef, ObservationEvidence, PhoneCapabilities } from "../src/bridges/phone/provider";
import type { Grant } from "../src/qp/kernel";

// ─── Mock Provider ────────────────────────────────────────

function mockProvider(surface: IdentitySurface): PhoneBridgeProvider {
  return {
    id: `mock-${surface.provider}`,
    name: `Mock ${surface.provider}`,
    status: "EXPERIMENTAL",
    describeIdentitySurface: async () => surface,
    listProducts: async () => [],
    quote: async (p) => ({
      product: p,
      totalCost: { amount: 10, currency: "USD" },
      paymentMethods: ["XMR"],
      identityRequired: [],
      privacyClass: "ANON_CORE",
    }),
    provision: async () => ({
      success: true,
      rawResponse: "{}",
      observedAt: new Date().toISOString(),
      privacyClass: "ANON_CORE",
      identityRequired: [],
    }),
    readback: async () => ({
      exists: true,
      state: {},
      evidence: [],
    }),
    capabilities: async () => ({
      sms_in: true,
      sms_out: "UNKNOWN",
      voice_in: false,
      voice_out: false,
      data: true,
      renewable: true,
    }),
  };
}

describe("Phone Bridge Provider", () => {
  describe("classifyProvider", () => {
    it("returns ANON_CORE for clean providers", () => {
      const surface: IdentitySurface = {
        provider: "test",
        legal_identity_required: false,
        account_required: false,
        email_required: false,
        phone_required: false,
        payment_rails: ["XMR"],
        data_disclosed: [],
        network_metadata: [],
        evidence: [],
      };
      expect(classifyProvider(surface)).toBe("ANON_CORE");
    });

    it("returns PSEUDONYMOUS_BRIDGE for account-required", () => {
      const surface: IdentitySurface = {
        provider: "test",
        legal_identity_required: false,
        account_required: true,
        email_required: false,
        phone_required: false,
        payment_rails: [],
        data_disclosed: [],
        network_metadata: [],
        evidence: [],
      };
      expect(classifyProvider(surface)).toBe("PSEUDONYMOUS_BRIDGE");
    });

    it("returns PSEUDONYMOUS_BRIDGE for email-required", () => {
      const surface: IdentitySurface = {
        provider: "test",
        legal_identity_required: false,
        account_required: false,
        email_required: true,
        phone_required: false,
        payment_rails: [],
        data_disclosed: [],
        network_metadata: [],
        evidence: [],
      };
      expect(classifyProvider(surface)).toBe("PSEUDONYMOUS_BRIDGE");
    });

    it("returns IDENTITY_BRIDGED for legal identity required", () => {
      const surface: IdentitySurface = {
        provider: "test",
        legal_identity_required: true,
        account_required: false,
        email_required: false,
        phone_required: false,
        payment_rails: [],
        data_disclosed: [],
        network_metadata: [],
        evidence: [],
      };
      expect(classifyProvider(surface)).toBe("IDENTITY_BRIDGED");
    });
  });

  describe("selectBridge", () => {
    it("filters providers by privacy class", async () => {
      const anon = mockProvider({
        provider: "anon",
        legal_identity_required: false,
        account_required: false,
        email_required: false,
        phone_required: false,
        payment_rails: ["XMR"],
        data_disclosed: [],
        network_metadata: [],
        evidence: [],
      });

      const bridged = mockProvider({
        provider: "bridged",
        legal_identity_required: true,
        account_required: false,
        email_required: false,
        phone_required: false,
        payment_rails: [],
        data_disclosed: [],
        network_metadata: [],
        evidence: [],
      });

      const results = await selectBridge([anon, bridged], {
        capabilities: ["sms_in"],
        maxPrivacyClass: "ANON_CORE",
        paymentRail: "XMR",
      });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe("mock-anon");
    });

    it("returns empty when no providers match", async () => {
      const bridged = mockProvider({
        provider: "bridged",
        legal_identity_required: true,
        account_required: false,
        email_required: false,
        phone_required: false,
        payment_rails: [],
        data_disclosed: [],
        network_metadata: [],
        evidence: [],
      });

      const results = await selectBridge([bridged], {
        capabilities: ["sms_in"],
        maxPrivacyClass: "ANON_CORE",
        paymentRail: "XMR",
      });

      expect(results.length).toBe(0);
    });

    it("allows PSEUDONYMOUS_BRIDGE when max is PSEUDONYMOUS_BRIDGE", async () => {
      const pseudo = mockProvider({
        provider: "pseudo",
        legal_identity_required: false,
        account_required: true,
        email_required: false,
        phone_required: false,
        payment_rails: [],
        data_disclosed: [],
        network_metadata: [],
        evidence: [],
      });

      const results = await selectBridge([pseudo], {
        capabilities: ["sms_in"],
        maxPrivacyClass: "PSEUDONYMOUS_BRIDGE",
        paymentRail: "any",
      });

      expect(results.length).toBe(1);
    });
  });
});
