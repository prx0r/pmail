// tests/session.test.ts — Accountless session + capability lifecycle tests

import { describe, it, expect } from "vitest";
import { createSession, fundSession, mintCapability, useCapability, advanceSession } from "../src/core/session";

describe("Session lifecycle", () => {
  it("creates accountless session", () => {
    const session = createSession("agent:1");
    expect(session.id).toMatch(/^sess:/);
    expect(session.state).toBe("UNFUNDED");
    expect(session.credits).toBe(0n);
  });

  it("fund transitions UNFUNDED → ACTIVE", () => {
    const session = createSession("agent:1");
    const funded = fundSession(session, 1000000n, "invoice:abc");
    expect(funded.state).toBe("ACTIVE");
    expect(funded.credits).toBe(1000000n);
    expect(funded.fundedAt).toBeDefined();
  });

  it("cannot fund already funded session", () => {
    const session = createSession("agent:1");
    const funded = fundSession(session, 1000n, "inv:1");
    expect(() => fundSession(funded, 1000n, "inv:2")).toThrow();
  });
});

describe("Capability minting", () => {
  it("mints capability exactly once per invoice", () => {
    const session = createSession("agent:1");
    const c1 = mintCapability(session, "inv:abc", 1000n, "messaging", []);
    expect(c1.capability).not.toBeNull();
    expect(c1.capability!.granted_by).toBe("inv:abc");

    // Second attempt with same invoice → rejected
    const c2 = mintCapability(session, "inv:abc", 1000n, "messaging", [c1.capability!]);
    expect(c2.capability).toBeNull();
    expect(c2.error).toContain("already minted");
  });

  it("rejects zero/negative amounts", () => {
    const session = createSession("agent:1");
    const c = mintCapability(session, "inv:1", 0n, "messaging", []);
    expect(c.capability).toBeNull();
    expect(c.error).toContain("zero");
  });
});

describe("Capability usage", () => {
  it("allows usage within credits", () => {
    const session = createSession("agent:1");
    const cap = mintCapability(session, "inv:1", 1000n, "messaging", []).capability!;
    const result = useCapability(cap, 500n);
    expect(result.allowed).toBe(true);
  });

  it("rejects insufficient credits", () => {
    const session = createSession("agent:1");
    const cap = mintCapability(session, "inv:1", 100n, "messaging", []).capability!;
    const result = useCapability(cap, 500n);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("insufficient");
  });
});

describe("Session state machine", () => {
  it("UNFUNDED → ACTIVE (funded)", () => {
    const s = createSession("agent:1");
    const s2 = advanceSession(s, "funded");
    expect(s2.state).toBe("ACTIVE");
  });

  it("ACTIVE → EXHAUSTED", () => {
    const s = createSession("agent:1");
    const s2 = advanceSession(advanceSession(s, "funded"), "exhausted");
    expect(s2.state).toBe("EXHAUSTED");
  });

  it("EXHAUSTED → ACTIVE (refunded)", () => {
    const s = advanceSession(advanceSession(createSession("agent:1"), "funded"), "exhausted");
    const s2 = advanceSession(s, "funded");
    expect(s2.state).toBe("ACTIVE");
  });

  it("rejects invalid transitions", () => {
    const s = createSession("agent:1");
    expect(() => advanceSession(s, "exhausted")).toThrow();
  });
});
