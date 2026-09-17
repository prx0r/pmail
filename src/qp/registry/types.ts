// src/qp/registry/types.ts — Frozen registry types

/**
 * QP Replay V2: no caller-supplied arbitrary functions.
 * Runtime loads frozen ProofSpec + ProgramManifest itself.
 * Caller supplies IDs/input, never arbitrary judge/gate functions.
 * Replay recomputes every root/hash/signature from persisted artifacts.
 */

import type { Actuality } from "../kernel";

// ─── Program Bundle (immutable, content-addressed) ────────

export interface ProgramBundle {
  id: string;                    // "bundle:<sha256>"
  name: string;
  sourceHash: string;            // sha256 of source code
  runtimeHash: string;           // sha256 of runtime (e.g., "node:20")
  configHash: string;            // sha256 of config
  dependenciesHash: string;      // sha256 of dependency manifest
  bundleHash: string;            // sha256(sourceHash + runtimeHash + configHash + dependenciesHash)
  gitRepo?: string;
  gitCommit?: string;            // full SHA, never branch name
}

// ─── Judge Registration ───────────────────────────────────

export interface JudgeProgram {
  bundle: ProgramBundle;
  /** The actual judge function — loaded from pinned source */
  evaluate: (evidence: any[]) => JudgeResult;
}

export interface JudgeResult {
  judge_id: string;
  bundle_hash: string;
  actuality: Actuality;
  reasons: string[];
  evidence_ids: string[];
}

// ─── Gate Registration ────────────────────────────────────

export interface GateProgram {
  bundle: ProgramBundle;
  /** The actual gate function — loaded from pinned source */
  evaluate: (evidence: any[], judgeResults: JudgeResult[]) => GateResult;
}

export interface GateResult {
  gate_id: string;
  result: Actuality;
  proof: string;
  evidence_ids: string[];
}

// ─── Transition Program ───────────────────────────────────

export interface TransitionProgram {
  bundle: ProgramBundle;
  /** Pure transition function: (state_before, claim, actuality, ...) -> state_after */
  evaluate: (input: TransitionInput) => TransitionOutput;
}

export interface TransitionInput {
  state_before_root: string;
  claim_id: string;
  actuality: Actuality;
  gate_results: GateResult[];
  authority_root?: string;
  proposal_root: string;
}

export interface TransitionOutput {
  state_after_root: string;
}

// ─── ProofSpec Registry Entry ─────────────────────────────

export interface RegisteredProofSpec {
  spec_id: string;
  version: number;
  /** The ProofSpec object (judges/gates reference bundle hashes) */
  spec: any;  // ProofSpec type from kernel.ts
  /** Contract root computed from the spec */
  contractRoot: string;
  /** Registered at timestamp */
  registeredAt: string;
}
