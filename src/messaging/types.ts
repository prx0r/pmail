// src/messaging/types.ts — Private messaging interfaces

/**
 * Private messenger contract for PMail.
 * SimpleX is the canonical implementation; others can be plugged in.
 *
 * Key invariant: adapter says delivery -> evidence. QP reads back -> proof.
 */

import type { Evidence } from "../qp/kernel";
import type { PrivacyClass } from "../privacy/types";

export interface AddressHandle {
  id: string;                     // internal address ID
  simplexAddress: string;         // SimpleX one-time or persistent address
  createdAt: string;
  sessionBinding?: string;        // bound to PMail session
  revoked: boolean;
}

export interface PrivateMessage {
  id: string;
  from: string;                   // sender address/commitment
  to: string;                     // recipient address/commitment
  body: Uint8Array;
  bodyHash: string;               // sha256 of body
  receivedAt: string;
  nonce?: string;                 // for QP round-trip proofs
}

export interface MessageDeliveryEvidence {
  messageId: string;
  from: string;
  to: string;
  bodyHash: string;
  sentAt: string;
  observedAt: string;
  rawResponse: string;
  privacyClass: PrivacyClass;
  evidence: Evidence[];
}

export interface PrivateMessenger {
  id: string;
  name: string;

  /** Create a new receiving address (one-time or persistent) */
  createAddress(sessionId?: string): Promise<AddressHandle>;

  /** Revoke an address — stops accepting messages */
  revokeAddress(id: string): Promise<void>;

  /** Send a message to an address */
  sendMessage(to: string, body: Uint8Array, claimId?: string): Promise<MessageDeliveryEvidence>;

  /** Subscribe to inbound messages — returns unsubscribe handle */
  subscribe(handler: (m: PrivateMessage) => Promise<void>): Promise<Unsubscribe>;

  /** Query message status (if supported) */
  messageStatus?(messageId: string): Promise<MessageStatus>;
}

export type Unsubscribe = () => Promise<void>;

export interface MessageStatus {
  messageId: string;
  state: "SENT" | "DELIVERED" | "READ" | "FAILED" | "UNKNOWN";
  observedAt: string;
}
