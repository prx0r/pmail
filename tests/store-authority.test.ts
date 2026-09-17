// tests/store-authority.test.ts — Durable store + authority + effect journal tests

import { describe, it, expect } from "vitest";
import { MemoryStore } from "../src/store";
import { LocalAuthority, LocalEffectJournal } from "../src/authority";

describe("Memory Store", () => {
  const store = new MemoryStore();

  it("stores and retrieves sessions", async () => {
    const session = {
      id: "sess:1", agent_id: "agent:1", state: "UNFUNDED" as const,
      created_at: new Date().toISOString(), credits: "0",
    };
    await store.putSession(session);
    const retrieved = await store.getSession("sess:1");
    expect(retrieved).toBeTruthy();
    expect(retrieved!.id).toBe("sess:1");
  });

  it("updates sessions", async () => {
    await store.putSession({
      id: "sess:2", agent_id: "agent:1", state: "UNFUNDED",
      created_at: new Date().toISOString(), credits: "0",
    });
    await store.updateSession("sess:2", { state: "ACTIVE", credits: "1000" });
    const s = await store.getSession("sess:2");
    expect(s!.state).toBe("ACTIVE");
    expect(s!.credits).toBe("1000");
  });

  it("stores capabilities and retrieves by token hash", async () => {
    const cap = {
      id: "cap:1", token_hash: "hash:abc", session_id: "sess:1",
      scopes: ["send"], issued_at: new Date().toISOString(), uses: 0,
    };
    await store.putCapability(cap);
    const byId = await store.getCapability("cap:1");
    expect(byId).toBeTruthy();
    const byHash = await store.getCapabilityByTokenHash("hash:abc");
    expect(byHash).toBeTruthy();
    expect(byHash!.id).toBe("cap:1");
  });

  it("increments capability uses atomically", async () => {
    await store.putCapability({
      id: "cap:2", token_hash: "hash:def", session_id: "sess:1",
      scopes: [], issued_at: new Date().toISOString(), uses: 0, max_uses: 3,
    });
    expect(await store.incrementCapabilityUses("cap:2")).toBe(1);
    expect(await store.incrementCapabilityUses("cap:2")).toBe(2);
    expect(await store.incrementCapabilityUses("cap:2")).toBe(3);
  });

  it("tracks credit ledger balance", async () => {
    await store.appendCreditEntry({
      id: "cl:1", session_id: "sess:3", delta_atomic: "1000",
      reason: "payment", created_at: new Date().toISOString(),
    });
    await store.appendCreditEntry({
      id: "cl:2", session_id: "sess:3", delta_atomic: "-200",
      reason: "spend", created_at: new Date().toISOString(),
    });
    const balance = await store.getCreditBalance("sess:3");
    expect(balance).toBe("800");
  });

  it("stores and consumes grants", async () => {
    const grant = {
      id: "grant:1", issuer: "human", subject: "agent:1",
      action: "test", payload_hash: "h", constraints: {},
      issued_at: new Date().toISOString(), expires_at: new Date(Date.now() + 3600000).toISOString(),
      nonce: "n", max_uses: 2, uses: 0, signature: "s", revoked: false,
    };
    await store.putGrant(grant);
    expect(await store.consumeGrant("grant:1")).toBe(true);
    const g = await store.getGrant("grant:1");
    expect(g!.uses).toBe(1);
    expect(await store.consumeGrant("grant:1")).toBe(true);
    expect(await store.consumeGrant("grant:1")).toBe(false); // exhausted
  });

  it("manages effect journal transitions", async () => {
    const effect = {
      id: "eff:1", session_id: "sess:1", action: "test",
      state: "PROPOSED" as const, proposal_root: "pr",
      effect_spec_root: "esr", idempotency_key: "ik1",
      attempt_number: 1, created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(), transitions: [],
    };
    await store.putEffect(effect);
    await store.transitionEffect("eff:1", "AUTHORIZED", "grant validated");
    await store.transitionEffect("eff:1", "PREPARED", "budget reserved");
    const e = await store.getEffect("eff:1");
    expect(e!.state).toBe("PREPARED");
    expect(e!.transitions.length).toBe(2);
  });
});

describe("Local Authority", () => {
  const authority = new LocalAuthority();

  it("issues signed grants", async () => {
    const grant = await authority.issueGrant({
      issuer: authority.issuerId,
      subject: "agent:1",
      action: "test.action",
      payload: { target: "resource1" },
      constraints: { max_amount: 100 },
    });
    expect(grant.id).toMatch(/^grant:/);
    expect(grant.signature).toBeTruthy();
    expect(grant.payload_hash).toBeTruthy();
  });

  it("validates correct grant", async () => {
    const grant = await authority.issueGrant({
      issuer: authority.issuerId,
      subject: "agent:1",
      action: "test.action",
      payload: { target: "resource1" },
      constraints: {},
    });
    const decision = await authority.validateGrant(grant, {
      action: "test.action",
      payload: { target: "resource1" },
    });
    expect(decision.valid).toBe(true);
  });

  it("rejects wrong action", async () => {
    const grant = await authority.issueGrant({
      issuer: authority.issuerId,
      subject: "agent:1",
      action: "correct.action",
      payload: {},
      constraints: {},
    });
    const decision = await authority.validateGrant(grant, {
      action: "wrong.action",
      payload: {},
    });
    expect(decision.valid).toBe(false);
    expect(decision.reason).toContain("Action mismatch");
  });

  it("rejects wrong payload", async () => {
    const grant = await authority.issueGrant({
      issuer: authority.issuerId,
      subject: "agent:1",
      action: "test",
      payload: { x: 1 },
      constraints: {},
    });
    const decision = await authority.validateGrant(grant, {
      action: "test",
      payload: { x: 2 },
    });
    expect(decision.valid).toBe(false);
    expect(decision.reason).toContain("Payload hash mismatch");
  });

  it("rejects expired grant", async () => {
    const grant = await authority.issueGrant({
      issuer: authority.issuerId,
      subject: "agent:1",
      action: "test",
      payload: {},
      constraints: {},
      ttlSeconds: -1, // already expired
    });
    const decision = await authority.validateGrant(grant, {
      action: "test",
      payload: {},
    });
    expect(decision.valid).toBe(false);
    expect(decision.reason).toContain("expired");
  });
});

describe("Effect Journal", () => {
  const journal = new LocalEffectJournal();

  it("creates and transitions effects", async () => {
    const id = await journal.propose({
      sessionId: "sess:1",
      action: "phone.provision",
      proposalRoot: "pr:1",
      effectSpecRoot: "esr:1",
      idempotencyKey: "ik:1",
    });
    expect(id).toMatch(/^effect:/);

    await journal.authorize(id, "grant:1", "ar:1");
    await journal.prepare(id, "500");
    await journal.execute(id);
    await journal.settle(id, "PROVEN_TRUE", "rcpt:1");

    const pending = await journal.getPending();
    expect(pending.length).toBe(0);
  });
});
