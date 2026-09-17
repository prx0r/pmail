// tests/secrets.test.ts — Agent Vault / egress policy tests

import { describe, it, expect } from "vitest";
import { evaluateEgress, defaultPmailEgressPolicy } from "../src/core/secrets";

describe("Secrets / Egress Policy", () => {
  const policy = defaultPmailEgressPolicy();

  describe("evaluateEgress", () => {
    it("allows SimpleX", () => {
      const result = evaluateEgress("api.simplex.im", policy);
      expect(result.allowed).toBe(true);
    });

    it("denies Google", () => {
      const result = evaluateEgress("www.google.com", policy);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Denied");
    });

    it("denies Facebook", () => {
      const result = evaluateEgress("graph.facebook.com", policy);
      expect(result.allowed).toBe(false);
    });

    it("denies cloud metadata endpoint", () => {
      const result = evaluateEgress("169.254.169.254", policy);
      expect(result.allowed).toBe(false);
    });

    it("allows Pikasim", () => {
      const result = evaluateEgress("pikasim.com", policy);
      expect(result.allowed).toBe(true);
    });

    it("denies unknown hosts", () => {
      const result = evaluateEgress("random-unknown-host.com", policy);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("Not in allowlist");
    });

    it("denies AWS metadata", () => {
      const result = evaluateEgress("169.254.169.254", policy);
      expect(result.allowed).toBe(false);
    });
  });
});
