// src/qp/transparency/log.ts — Append-only transparency log (CT-style)

import { createHash, createPrivateKey, sign } from "crypto";

export interface LogEntry {
  index: number;
  digest: string;
  timestamp: string;
}

export interface SignedTreeHead {
  tree_size: number;
  root_hash: string;
  timestamp: string;
  signature: string;
  signer_key: string;
}

export interface InclusionProof {
  leaf_index: number;
  tree_size: number;
  /** Sibling hashes from leaf level to root, bottom-up */
  path: string[];
  root_hash: string;
}

export interface ConsistencyProof {
  old_size: number;
  new_size: number;
  path: string[];
  old_root: string;
  new_root: string;
}

export interface TransparencyLogState {
  entries: LogEntry[];
  treeSize: number;
  rootHash: string;
  signedTreeHead: SignedTreeHead | null;
}

export class TransparencyLog {
  private entries: LogEntry[] = [];
  private logKeyPair: { publicKey: string; privateKey: string };

  constructor(logKeyPair: { publicKey: string; privateKey: string }) {
    this.logKeyPair = logKeyPair;
  }

  append(digest: string): LogEntry {
    const entry: LogEntry = {
      index: this.entries.length,
      digest,
      timestamp: new Date().toISOString(),
    };
    this.entries.push(entry);
    return entry;
  }

  getState(): TransparencyLogState {
    const rootHash = this.computeRoot();
    return {
      entries: [...this.entries],
      treeSize: this.entries.length,
      rootHash,
      signedTreeHead: this.entries.length > 0 ? this.signTreeHead() : null,
    };
  }

  getSignedTreeHead(): SignedTreeHead | null {
    return this.entries.length > 0 ? this.signTreeHead() : null;
  }

  getLeaf(index: number): LogEntry | undefined {
    return this.entries[index];
  }

  getInclusionProof(leafIndex: number, treeSize?: number): InclusionProof | null {
    const size = treeSize || this.entries.length;
    if (leafIndex < 0 || leafIndex >= size) return null;

    const leaves = this.entries.slice(0, size).map((e) => e.digest);
    const path = this.buildPath(leaves, leafIndex);

    return {
      leaf_index: leafIndex,
      tree_size: size,
      path,
      root_hash: this.computeRootFromLeaves(leaves),
    };
  }

  getConsistencyProof(oldSize: number, newSize: number): ConsistencyProof | null {
    if (oldSize <= 0 || newSize <= oldSize || newSize > this.entries.length) return null;
    const oldLeaves = this.entries.slice(0, oldSize).map((e) => e.digest);
    const newLeaves = this.entries.slice(0, newSize).map((e) => e.digest);
    return {
      old_size: oldSize,
      new_size: newSize,
      path: [],
      old_root: this.computeRootFromLeaves(oldLeaves),
      new_root: this.computeRootFromLeaves(newLeaves),
    };
  }

  // ─── Internal ─────────────────────────────────────────

  private computeRoot(): string {
    if (this.entries.length === 0) return sha256("empty-log");
    return this.computeRootFromLeaves(this.entries.map((e) => e.digest));
  }

  private computeRootFromLeaves(leaves: string[]): string {
    if (leaves.length === 0) return sha256("empty");
    let level = leaves.map(sha256);
    while (level.length > 1) {
      const next: string[] = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = i + 1 < level.length ? level[i + 1] : sha256("pad:" + left);
        next.push(sha256(left + right));
      }
      level = next;
    }
    return level[0];
  }

  /**
   * Build path: at each level, record the sibling hash.
   * The verifier uses the leaf_index to determine left/right at each level.
   */
  private buildPath(leaves: string[], leafIndex: number): string[] {
    const path: string[] = [];
    let index = leafIndex;
    let level = leaves.map(sha256);

    while (level.length > 1) {
      const isRight = index % 2 === 1;
      const siblingIndex = isRight ? index - 1 : index + 1;

      if (siblingIndex < level.length) {
        path.push(level[siblingIndex]);
      } else {
        path.push(sha256("pad:" + level[index]));
      }

      const next: string[] = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = i + 1 < level.length ? level[i + 1] : sha256("pad:" + left);
        next.push(sha256(left + right));
      }
      level = next;
      index = Math.floor(index / 2);
    }

    return path;
  }

  private signTreeHead(): SignedTreeHead {
    const treeSize = this.entries.length;
    const rootHash = this.computeRoot();
    const timestamp = new Date().toISOString();
    const dataToSign = `${treeSize}:${rootHash}:${timestamp}`;
    const privateKey = createPrivateKey({ key: this.logKeyPair.privateKey, format: "pem", type: "pkcs8" });
    const sig = sign(null, Buffer.from(dataToSign), privateKey);
    return {
      tree_size: treeSize,
      root_hash: rootHash,
      timestamp,
      signature: sig.toString("base64"),
      signer_key: this.logKeyPair.publicKey,
    };
  }
}

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}
