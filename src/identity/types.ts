// src/identity/types.ts — Identity model (operator, agent, person)

/**
 * Identity model for PMail:
 * - Person: deliberately absent from ANON_CORE
 * - Operator: pseudonymous public key / capability holder
 * - Agent: workload/runtime identity, ideally attested
 *
 * Never make email/phone/name the identity root.
 */

export interface Operator {
  id: string;                    // "op:" + sha256(publicKey)
  publicKey: string;             // Ed25519 public key (PEM)
  createdAt: string;
  capabilities: string[];        // granted capability hashes
  revoked: boolean;
}

export interface Agent {
  id: string;                    // "agent:" + random or attested
  operatorId: string;            // which operator owns this agent
  attestation?: Attestation;     // optional TEE attestation
  createdAt: string;
}

export interface Attestation {
  workloadHash: string;          // hash of agent code
  runtimeHash: string;           // hash of runtime environment
  attestedAt: string;
  verifier: string;              // "dstack" | "local" | etc.
}

export interface Session {
  id: string;                    // "sess:" + random
  operatorId?: string;           // optional operator binding
  agentId: string;
  state: "UNFUNDED" | "FUNDED" | "ACTIVE" | "EXHAUSTED" | "REVOKED";
  createdAt: string;
  fundedAt?: string;
  credits: bigint;               // in atomic units (XMR piconeros)
}

export function createOperator(): Operator {
  // In production: generate Ed25519 keypair
  // For now: random ID
  const id = "op:" + sha256(String(Date.now()) + String(Math.random()));
  return {
    id,
    publicKey: "", // would be Ed25519 public key
    createdAt: new Date().toISOString(),
    capabilities: [],
    revoked: false,
  };
}

export function createSession(agentId: string, operatorId?: string): Session {
  return {
    id: "sess:" + sha256(String(Date.now()) + String(Math.random())),
    operatorId,
    agentId,
    state: "UNFUNDED",
    createdAt: new Date().toISOString(),
    credits: 0n,
  };
}

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}
