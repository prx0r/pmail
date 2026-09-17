// tests/messaging.test.ts — SimpleX messaging tests

import { describe, it, expect } from "vitest";
import { MockSimplexAdapter, buildInboundEvidence } from "../src/messaging/simplex";

describe("SimpleX Messaging", () => {
  const adapter = new MockSimplexAdapter("ANON_CORE");

  it("creates an address without identity", async () => {
    const addr = await adapter.createAddress("test-session");
    expect(addr.id).toMatch(/^addr:/);
    expect(addr.simplexAddress).toMatch(/^simplex:\/\//);
    expect(addr.revoked).toBe(false);
    expect(addr.sessionBinding).toBe("test-session");
  });

  it("revokes an address", async () => {
    const addr = await adapter.createAddress();
    await adapter.revokeAddress(addr.id);
    // After revocation, address is marked revoked
    // (In real impl, SimpleX CLI would delete it)
  });

  it("sends a message and returns evidence", async () => {
    const addr = await adapter.createAddress();
    const body = new TextEncoder().encode("Hello SimpleX");
    const result = await adapter.sendMessage(addr.simplexAddress, body);

    expect(result.messageId).toMatch(/^msg:/);
    expect(result.to).toBe(addr.simplexAddress);
    expect(result.bodyHash).toBeTruthy();
    expect(result.privacyClass).toBe("ANON_CORE");
    expect(result.evidence.length).toBe(1);
    expect(result.evidence[0].class).toBe("simplex_send");
  });

  it("subscribes to inbound messages", async () => {
    const received: any[] = [];
    const unsub = await adapter.subscribe(async (msg) => {
      received.push(msg);
    });

    const addr = await adapter.createAddress();
    const body = new TextEncoder().encode("inbound test");
    await adapter.simulateInbound("sender-address", addr.simplexAddress, body, "nonce-abc");

    expect(received.length).toBe(1);
    expect(received[0].nonce).toBe("nonce-abc");
    expect(received[0].bodyHash).toBeTruthy();

    await unsub();
  });

  it("builds inbound evidence for QP", async () => {
    const addr = await adapter.createAddress();
    const body = new TextEncoder().encode("qp test");
    const msg = await adapter.simulateInbound("sender", addr.simplexAddress, body, "test-nonce");

    const evidence = buildInboundEvidence(msg, addr.id);
    expect(evidence.class).toBe("simplex_receive");
    expect(evidence.nonce).toBe("test-nonce");
    expect(evidence.source).toBe("simplex-cli");
    expect(evidence.response_payload).toBeTruthy();
    expect(evidence.response_hash).toBeTruthy();
  });

  it("generates unique message IDs", async () => {
    const addr = await adapter.createAddress();
    const body = new TextEncoder().encode("unique test");
    const r1 = await adapter.sendMessage(addr.simplexAddress, body);
    const r2 = await adapter.sendMessage(addr.simplexAddress, body);
    expect(r1.messageId).not.toBe(r2.messageId);
  });
});
