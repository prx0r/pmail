// tests/privacy.test.ts — Privacy composition + policy tests

import { describe, it, expect } from "vitest";
import { composePrivacy, evaluatePrivacy, type PrivacyClass, type IdentitySurface, type PrivacyPolicy } from "../src/privacy/types";

describe("Privacy composition", () => {
  it("ANON_CORE + ANON_CORE = ANON_CORE", () => {
    expect(composePrivacy("ANON_CORE", "ANON_CORE")).toBe("ANON_CORE");
  });

  it("ANON_CORE + PSEUDONYMOUS_BRIDGE = PSEUDONYMOUS_BRIDGE", () => {
    expect(composePrivacy("ANON_CORE", "PSEUDONYMOUS_BRIDGE")).toBe("PSEUDONYMOUS_BRIDGE");
  });

  it("anything + IDENTITY_BRIDGED = IDENTITY_BRIDGED", () => {
    expect(composePrivacy("ANON_CORE", "IDENTITY_BRIDGED")).toBe("IDENTITY_BRIDGED");
    expect(composePrivacy("PSEUDONYMOUS_BRIDGE", "IDENTITY_BRIDGED")).toBe("IDENTITY_BRIDGED");
    expect(composePrivacy("IDENTITY_BRIDGED", "ANON_CORE")).toBe("IDENTITY_BRIDGED");
  });

  it("privacy never improves by adding dependencies", () => {
    expect(composePrivacy("PSEUDONYMOUS_BRIDGE", "ANON_CORE")).toBe("PSEUDONYMOUS_BRIDGE");
  });
});

describe("Privacy evaluation", () => {
  const anonPolicy: PrivacyPolicy = { max_privacy_class: "ANON_CORE", forbid: ["legal_identity", "card_payment"] };

  it("ANON_CORE provider passes ANON_CORE policy", () => {
    const surface: IdentitySurface = {
      provider: "test", legal_identity_required: false, account_required: false,
      email_required: false, phone_required: false, payment_rails: ["XMR"],
      data_disclosed: [], network_metadata: [], evidence: [],
    };
    const result = evaluatePrivacy([surface], anonPolicy);
    expect(result.allowed).toBe(true);
    expect(result.class).toBe("ANON_CORE");
  });

  it("identity-requiring provider fails ANON_CORE policy", () => {
    const surface: IdentitySurface = {
      provider: "kyc-exchange", legal_identity_required: true, account_required: true,
      email_required: true, phone_required: true, payment_rails: ["card"],
      data_disclosed: ["name", "address"], network_metadata: ["ip"], evidence: [],
    };
    const result = evaluatePrivacy([surface], anonPolicy);
    expect(result.allowed).toBe(false);
    expect(result.class).toBe("IDENTITY_BRIDGED");
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it("phone-required provider degrades to PSEUDONYMOUS_BRIDGE", () => {
    const surface: IdentitySurface = {
      provider: "phone-provider", legal_identity_required: false, account_required: false,
      email_required: false, phone_required: true, payment_rails: ["XMR"],
      data_disclosed: [], network_metadata: [], evidence: [],
    };
    const result = evaluatePrivacy([surface], anonPolicy);
    expect(result.class).toBe("PSEUDONYMOUS_BRIDGE");
    expect(result.allowed).toBe(false); // ANON_CORE policy rejects PSEUDONYMOUS_BRIDGE
  });
});
