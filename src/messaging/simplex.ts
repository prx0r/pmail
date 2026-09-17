// src/messaging/simplex.ts — SimpleX messaging adapter
// Phase D: Canonical private messaging substrate for PMail.

/**
 * SimpleX adapter wraps the SimpleX CLI/service to provide:
 * - address creation (one-time or persistent)
 * - inbound message subscription
 * - outbound message sending
 * - QP-ready evidence construction
 *
 * Design:
 * - SimpleX owns the crypto/protocol
 * - PMail owns capability binding, evidence, privacy metadata
 * - Never reinvent double-ratchet, queue routing, etc.
 *
 * Runtime requirement: simplex-chat CLI or simplex-chat-api must be available.
 * For MVP, we define the interface + mock/test mode.
 * Live mode shells out to `simplex-chat` CLI.
 */

import { createHash, randomBytes } from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import type {
  PrivateMessenger,
  AddressHandle,
  PrivateMessage,
  MessageDeliveryEvidence,
  Unsubscribe,
} from "./types";
import type { Evidence } from "../qp/kernel";
import type { PrivacyClass } from "../privacy/types";

const execFileAsync = promisify(execFile);

// ─── Configuration ────────────────────────────────────────

export interface SimplexConfig {
  /** Path to simplex-chat CLI binary */
  cliPath: string;
  /** Data directory for SimpleX state */
  dataDir: string;
  /** Optional: use a specific profile */
  profile?: string;
  /** Transport privacy class for this adapter */
  privacyClass: PrivacyClass;
  /** Whether to run through Tor */
  useTor?: boolean;
}

// ─── SimpleX Adapter ─────────────────────────────────────

export class SimplexAdapter implements PrivateMessenger {
  id = "simplex";
  name = "SimpleX Private Messenger";

  private config: SimplexConfig;
  private subscribers: Map<string, (m: PrivateMessage) => Promise<void>> = new Map();
  private listenerRunning = false;

  constructor(config: SimplexConfig) {
    this.config = config;
  }

  async createAddress(sessionId?: string): Promise<AddressHandle> {
    // Create a one-time invitation link via simplex-chat CLI
    const result = await this.simplexCmd([
      "create",
      "address",
      "--label",
      sessionId || `pmail-${Date.now()}`,
    ]);

    const address = result.output.trim();
    const id = "addr:" + sha256(address).slice(0, 16);

    return {
      id,
      simplexAddress: address,
      createdAt: new Date().toISOString(),
      sessionBinding: sessionId,
      revoked: false,
    };
  }

  async revokeAddress(id: string): Promise<void> {
    await this.simplexCmd(["delete", "address", "--id", id]);
  }

  async sendMessage(to: string, body: Uint8Array, claimId?: string): Promise<MessageDeliveryEvidence> {
    const bodyHash = sha256Bytes(body);
    const messageId = "msg:" + sha256(to + bodyHash + Date.now() + randomBytes(4).toString("hex")).slice(0, 16);
    const sentAt = new Date().toISOString();

    // Send via simplex-chat CLI
    // The message is base64-encoded for transport
    const b64body = Buffer.from(body).toString("base64");
    await this.simplexCmd([
      "send",
      "message",
      "--to",
      to,
      "--message",
      b64body,
    ]);

    const evidence: Evidence = {
      id: "ev:" + sha256(messageId + "send").slice(0, 16),
      class: "simplex_send",
      claim_id: claimId || "",
      observed_at: sentAt,
      source: "simplex-cli",
      locator: `message:${messageId}`,
      collector_id: "simplex-adapter",
      collector_program_hash: this.programHash(),
      collector_runtime_hash: "simplex-cli",
      response_payload: JSON.stringify({
        message_id: messageId,
        to,
        body_hash: bodyHash,
        sent_at: sentAt,
      }),
      response_hash: sha256(JSON.stringify({ message_id: messageId, to, body_hash: bodyHash })),
      normalized_payload_hash: sha256(JSON.stringify({ message_id: messageId, body_hash: bodyHash })),
      nonce: randomBytes(8).toString("hex"),
      independence_group: "simplex-send",
    };

    return {
      messageId,
      from: "", // caller fills in
      to,
      bodyHash,
      sentAt,
      observedAt: sentAt,
      rawResponse: JSON.stringify({ success: true, message_id: messageId }),
      privacyClass: this.config.privacyClass,
      evidence: [evidence],
    };
  }

  async subscribe(handler: (m: PrivateMessage) => Promise<void>): Promise<Unsubscribe> {
    const subId = "sub:" + randomBytes(8).toString("hex");
    this.subscribers.set(subId, handler);

    if (!this.listenerRunning) {
      this.startListener();
    }

    return async () => {
      this.subscribers.delete(subId);
      if (this.subscribers.size === 0) {
        this.listenerRunning = false;
      }
    };
  }

  async messageStatus(messageId: string): Promise<{ messageId: string; state: "SENT" | "DELIVERED" | "READ" | "FAILED" | "UNKNOWN"; observedAt: string }> {
    try {
      const result = await this.simplexCmd(["message", "status", "--id", messageId]);
      const state = result.output.includes("read")
        ? "READ"
        : result.output.includes("delivered")
          ? "DELIVERED"
          : result.output.includes("sent")
            ? "SENT"
            : "UNKNOWN";
      return { messageId, state, observedAt: new Date().toISOString() };
    } catch {
      return { messageId, state: "UNKNOWN", observedAt: new Date().toISOString() };
    }
  }

  // ─── Internal ───────────────────────────────────────────

  private async simplexCmd(args: string[]): Promise<{ output: string; stderr: string }> {
    const cmd = this.config.cliPath;
    const fullArgs = [
      ...(this.config.profile ? ["-p", this.config.profile] : []),
      "-d", this.config.dataDir,
      ...args,
    ];

    try {
      const { stdout, stderr } = await execFileAsync(cmd, fullArgs, {
        timeout: 30_000,
        maxBuffer: 1024 * 1024,
      });
      return { output: stdout, stderr };
    } catch (err: any) {
      throw new Error(`SimpleX command failed: ${err.message}\n${err.stderr || ""}`);
    }
  }

  private startListener(): void {
    this.listenerRunning = true;
    // In production: run simplex-chat in listen mode
    // and parse incoming messages, normalizing them to PrivateMessage
    // For MVP: this is a placeholder that would be started as a background process
  }

  private programHash(): string {
    // In production: content hash of the adapter source bundle
    return sha256("simplex-adapter-v1");
  }
}

// ─── Utilities ────────────────────────────────────────────

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

function sha256Bytes(data: Uint8Array): string {
  return createHash("sha256").update(Buffer.from(data)).digest("hex");
}

// ─── QP Evidence Builder ─────────────────────────────────

/**
 * Build QP evidence for an inbound SimpleX message observation.
 * Used by judges to verify simplex_receives claims.
 */
export function buildInboundEvidence(
  message: PrivateMessage,
  addressId: string,
  claimId?: string,
): Evidence {
  return {
    id: "ev:" + sha256(message.id + "receive").slice(0, 16),
    class: "simplex_receive",
    claim_id: claimId || "", // bound by QP caller
    observed_at: message.receivedAt,
    source: "simplex-cli",
    locator: `message:${message.id}:address:${addressId}`,
    collector_id: "simplex-adapter",
    collector_program_hash: sha256("simplex-adapter-v1"),
    collector_runtime_hash: "simplex-cli",
    response_payload: JSON.stringify({
      message_id: message.id,
      from: message.from,
      to: message.to,
      body_hash: message.bodyHash,
      nonce: message.nonce,
      received_at: message.receivedAt,
    }),
    response_hash: sha256(JSON.stringify({
      message_id: message.id,
      from: message.from,
      to: message.to,
      body_hash: message.bodyHash,
    })),
    normalized_payload_hash: sha256(JSON.stringify({
      message_id: message.id,
      body_hash: message.bodyHash,
      nonce: message.nonce,
    })),
    nonce: message.nonce,
    independence_group: "simplex-recv",
  };
}

// ─── Mock Adapter (for testing) ──────────────────────────

/**
 * In-memory SimpleX adapter for tests.
 * Simulates address creation, send, and receive without CLI.
 */
export class MockSimplexAdapter implements PrivateMessenger {
  id = "simplex-mock";
  name = "SimpleX Mock (Testing)";

  private addresses: Map<string, AddressHandle> = new Map();
  private messages: PrivateMessage[] = [];
  private handler?: (m: PrivateMessage) => Promise<void>;
  private privacyClass: PrivacyClass;

  constructor(privacyClass: PrivacyClass = "ANON_CORE") {
    this.privacyClass = privacyClass;
  }

  async createAddress(sessionId?: string): Promise<AddressHandle> {
    const addr = "simplex://contact/" + randomBytes(16).toString("hex");
    const handle: AddressHandle = {
      id: "addr:" + sha256(addr).slice(0, 16),
      simplexAddress: addr,
      createdAt: new Date().toISOString(),
      sessionBinding: sessionId,
      revoked: false,
    };
    this.addresses.set(handle.id, handle);
    return handle;
  }

  async revokeAddress(id: string): Promise<void> {
    const addr = this.addresses.get(id);
    if (addr) addr.revoked = true;
  }

  async sendMessage(to: string, body: Uint8Array, claimId?: string): Promise<MessageDeliveryEvidence> {
    const bodyHash = sha256Bytes(body);
    const messageId = "msg:" + sha256(to + bodyHash + Date.now() + randomBytes(4).toString("hex")).slice(0, 16);
    const sentAt = new Date().toISOString();

    const evidence: Evidence = {
      id: "ev:" + sha256(messageId + "send").slice(0, 16),
      class: "simplex_send",
      claim_id: claimId || "",
      observed_at: sentAt,
      source: "simplex-mock",
      locator: `message:${messageId}`,
      collector_id: "simplex-mock",
      collector_program_hash: sha256("simplex-mock-v1"),
      collector_runtime_hash: "node:test",
      response_payload: JSON.stringify({
        message_id: messageId,
        to,
        body_hash: bodyHash,
        sent_at: sentAt,
      }),
      response_hash: sha256(JSON.stringify({ message_id: messageId, to, body_hash: bodyHash })),
      normalized_payload_hash: sha256(JSON.stringify({ message_id: messageId, body_hash: bodyHash })),
      nonce: randomBytes(8).toString("hex"),
      independence_group: "simplex-send",
    };

    return {
      messageId,
      from: "",
      to,
      bodyHash,
      sentAt,
      observedAt: sentAt,
      rawResponse: JSON.stringify({ success: true }),
      privacyClass: this.privacyClass,
      evidence: [evidence],
    };
  }

  async subscribe(handler: (m: PrivateMessage) => Promise<void>): Promise<Unsubscribe> {
    this.handler = handler;
    return async () => { this.handler = undefined; };
  }

  /** Test helper: simulate receiving a message */
  async simulateInbound(from: string, to: string, body: Uint8Array, nonce?: string): Promise<PrivateMessage> {
    const msg: PrivateMessage = {
      id: "msg:" + sha256(from + to + Date.now()).slice(0, 16),
      from,
      to,
      body,
      bodyHash: sha256Bytes(body),
      receivedAt: new Date().toISOString(),
      nonce,
    };
    this.messages.push(msg);
    if (this.handler) await this.handler(msg);
    return msg;
  }

  getReceivedMessages(): PrivateMessage[] {
    return [...this.messages];
  }
}
