// tests/identity.test.ts — Identity model tests

import { describe, it, expect } from "vitest";
import { createOperator, createAgent, sha256 } from "../src/identity/types";

describe("Identity", () => {
  describe("createOperator", () => {
    it("creates operator with Ed25519 keypair", () => {
      const op = createOperator();
      expect(op.id).toMatch(/^op:/);
      expect(op.publicKey).toContain("BEGIN PUBLIC KEY");
      expect(op.publicKey).toContain("MCowBQYDK2VwAyEA");
      expect(op.revoked).toBe(false);
      expect(op.capabilities).toEqual([]);
    });

    it("generates unique operators", () => {
      const op1 = createOperator();
      const op2 = createOperator();
      expect(op1.id).not.toBe(op2.id);
      expect(op1.publicKey).not.toBe(op2.publicKey);
    });
  });

  describe("createAgent", () => {
    it("creates agent bound to operator", () => {
      const op = createOperator();
      const agent = createAgent(op.id);
      expect(agent.id).toMatch(/^agent:/);
      expect(agent.operatorId).toBe(op.id);
      expect(agent.attestation).toBeUndefined();
    });

    it("creates agent with attestation", () => {
      const op = createOperator();
      const attestation = {
        workloadHash: "wh1",
        runtimeHash: "rh1",
        attestedAt: new Date().toISOString(),
        verifier: "dstack",
      };
      const agent = createAgent(op.id, attestation);
      expect(agent.attestation).toEqual(attestation);
    });
  });

  describe("sha256", () => {
    it("produces consistent hashes", () => {
      const h1 = sha256("hello");
      const h2 = sha256("hello");
      expect(h1).toBe(h2);
      expect(h1).toMatch(/^[a-f0-9]{64}$/);
    });

    it("different inputs produce different hashes", () => {
      expect(sha256("a")).not.toBe(sha256("b"));
    });
  });
});
