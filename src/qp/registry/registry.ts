// src/qp/registry/registry.ts — Frozen registries for QP Replay V2

/**
 * ProofSpecRegistry, JudgeRegistry, GateRegistry, TransitionRegistry.
 * Frozen at build/deploy time. No runtime mutation of judge/gate logic.
 */

import { createHash } from "crypto";
import { canonicalJson } from "../obsigna/canonical";
import type { ProgramBundle, JudgeProgram, GateProgram, TransitionProgram, RegisteredProofSpec } from "./types";
export type { ProgramBundle, JudgeProgram, GateProgram, TransitionProgram, RegisteredProofSpec } from "./types";
import type { JudgeResult, GateResult } from "./types";
import type { Actuality } from "../kernel";

// ─── Program Bundle Factory ───────────────────────────────

export function createProgramBundle(params: {
  name: string;
  sourceHash: string;
  runtimeHash?: string;
  configHash?: string;
  dependenciesHash?: string;
  gitRepo?: string;
  gitCommit?: string;
}): ProgramBundle {
  const runtime = params.runtimeHash || sha256(`node:${process.version}`);
  const config = params.configHash || sha256("default-config");
  const deps = params.dependenciesHash || sha256("default-deps");
  const bundleHash = sha256(params.sourceHash + runtime + config + deps);

  return {
    id: `bundle:${bundleHash}`,
    name: params.name,
    sourceHash: params.sourceHash,
    runtimeHash: runtime,
    configHash: config,
    dependenciesHash: deps,
    bundleHash,
    gitRepo: params.gitRepo,
    gitCommit: params.gitCommit,
  };
}

// ─── ProofSpec Registry ───────────────────────────────────

export class ProofSpecRegistry {
  private specs: Map<string, RegisteredProofSpec> = new Map();

  register(specId: string, version: number, spec: any, contractRoot: string): void {
    const key = `${specId}:v${version}`;
    this.specs.set(key, {
      spec_id: specId,
      version,
      spec,
      contractRoot,
      registeredAt: new Date().toISOString(),
    });
  }

  get(specId: string, version: number): RegisteredProofSpec | undefined {
    return this.specs.get(`${specId}:v${version}`);
  }

  has(specId: string, version: number): boolean {
    return this.specs.has(`${specId}:v${version}`);
  }

  list(): RegisteredProofSpec[] {
    return Array.from(this.specs.values());
  }
}

// ─── Judge Registry ───────────────────────────────────────

export class JudgeRegistry {
  private judges: Map<string, JudgeProgram> = new Map();

  register(judgeId: string, bundleHash: string, judge: JudgeProgram): void {
    this.judges.set(`${judgeId}:${bundleHash}`, judge);
  }

  get(judgeId: string, bundleHash: string): JudgeProgram | undefined {
    return this.judges.get(`${judgeId}:${bundleHash}`);
  }

  has(judgeId: string, bundleHash: string): boolean {
    return this.judges.has(`${judgeId}:${bundleHash}`);
  }
}

// ─── Gate Registry ────────────────────────────────────────

export class GateRegistry {
  private gates: Map<string, GateProgram> = new Map();

  register(gateId: string, bundleHash: string, gate: GateProgram): void {
    this.gates.set(`${gateId}:${bundleHash}`, gate);
  }

  get(gateId: string, bundleHash: string): GateProgram | undefined {
    return this.gates.get(`${gateId}:${bundleHash}`);
  }

  has(gateId: string, bundleHash: string): boolean {
    return this.gates.has(`${gateId}:${bundleHash}`);
  }
}

// ─── Transition Registry ──────────────────────────────────

export class TransitionRegistry {
  private transitions: Map<string, TransitionProgram> = new Map();

  register(transitionId: string, bundleHash: string, transition: TransitionProgram): void {
    this.transitions.set(`${transitionId}:${bundleHash}`, transition);
  }

  get(transitionId: string, bundleHash: string): TransitionProgram | undefined {
    return this.transitions.get(`${transitionId}:${bundleHash}`);
  }
}

// ─── Canonical Registry Bundle ────────────────────────────

export interface QPRegistry {
  proofSpecs: ProofSpecRegistry;
  judges: JudgeRegistry;
  gates: GateRegistry;
  transitions: TransitionRegistry;
}

export function createRegistry(): QPRegistry {
  return {
    proofSpecs: new ProofSpecRegistry(),
    judges: new JudgeRegistry(),
    gates: new GateRegistry(),
    transitions: new TransitionRegistry(),
  };
}

// ─── Utility ──────────────────────────────────────────────

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}
