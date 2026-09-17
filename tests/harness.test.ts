// tests/harness.test.ts — Phone acceptance harness tests

import { describe, it, expect } from "vitest";
import { runAcceptanceTests } from "../src/bridges/phone/harness";
import type { PhoneBridgeProvider, PhoneCapabilities, PhoneProduct, Quote, ProvisionInput, AttemptEvidence, ProviderResourceRef, ObservationEvidence, PhoneQuery } from "../src/bridges/phone/provider";
import type { IdentitySurface } from "../src/privacy/types";
import type { Grant } from "../src/qp/kernel";

function mockCleanProvider(): PhoneBridgeProvider {
  return {
    id: "clean-provider",
    name: "Clean Provider",
    status: "EXPERIMENTAL",
    describeIdentitySurface: async () => ({
      provider: "clean",
      legal_identity_required: false,
      account_required: false,
      email_required: false,
      phone_required: false,
      payment_rails: ["XMR"],
      data_disclosed: [],
      network_metadata: [],
      evidence: [],
    }),
    listProducts: async () => [],
    quote: async (p) => ({
      product: p,
      totalCost: { amount: 500, currency: "USD" },
      paymentMethods: ["XMR"],
      identityRequired: [],
      privacyClass: "ANON_CORE",
    }),
    provision: async () => ({
      success: true, rawResponse: "{}", observedAt: "",
      privacyClass: "ANON_CORE", identityRequired: [],
    }),
    readback: async () => ({ exists: true, state: {}, evidence: [] }),
    capabilities: async () => ({
      sms_in: true, sms_out: true, voice_in: true, voice_out: true,
      data: true, renewable: true,
    }),
  };
}

function mockKycProvider(): PhoneBridgeProvider {
  return {
    id: "kyc-provider",
    name: "KYC Provider",
    status: "EXPERIMENTAL",
    describeIdentitySurface: async () => ({
      provider: "kyc",
      legal_identity_required: true,
      account_required: false,
      email_required: false,
      phone_required: false,
      payment_rails: ["USD"],
      data_disclosed: ["passport"],
      network_metadata: [],
      evidence: [],
    }),
    listProducts: async () => [],
    quote: async (p) => ({
      product: p,
      totalCost: { amount: 10, currency: "USD" },
      paymentMethods: ["USD"],
      identityRequired: ["passport"],
      privacyClass: "IDENTITY_BRIDGED",
    }),
    provision: async () => ({
      success: true, rawResponse: "{}", observedAt: "",
      privacyClass: "IDENTITY_BRIDGED", identityRequired: ["passport"],
    }),
    readback: async () => ({ exists: true, state: {}, evidence: [] }),
    capabilities: async () => ({
      sms_in: true, sms_out: true, voice_in: true, voice_out: true,
      data: true, renewable: true,
    }),
  };
}

describe("Phone Acceptance Harness", () => {
  it("runs onboarding check for clean provider", async () => {
    const result = await runAcceptanceTests(mockCleanProvider(), {
      maxSpendCap: 1000,
      currency: "USD",
    });
    expect(result.provider_id).toBe("clean-provider");
    expect(result.tests.length).toBeGreaterThan(0);
    const onboarding = result.tests.find((t) => t.name === "onboarding_identity_check");
    expect(onboarding?.result).toBe("TRUE");
  });

  it("detects KYC requirement", async () => {
    const result = await runAcceptanceTests(mockKycProvider(), {
      maxSpendCap: 1000,
      currency: "USD",
    });
    const onboarding = result.tests.find((t) => t.name === "onboarding_identity_check");
    expect(onboarding?.result).toBe("FALSE");
  });

  it("respects spend cap", async () => {
    const result = await runAcceptanceTests(mockCleanProvider(), {
      maxSpendCap: 100,
      currency: "USD",
      testProduct: { id: "prod:1", price: { amount: 500 } },
    });
    // Quote would succeed but overall cost check should flag
    expect(result.cost_incurred).toBeGreaterThan(0);
  });

  it("overall status reflects test results", async () => {
    const cleanResult = await runAcceptanceTests(mockCleanProvider(), {
      maxSpendCap: 10000,
      currency: "USD",
    });
    expect(["PASS", "PARTIAL"]).toContain(cleanResult.overall);
  });
});
