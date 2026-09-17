// src/qp/transparency/verifier.ts — Offline verifier for transparency log

import { createPublicKey, createHash, verify as edVerify } from "crypto";
import type { SignedTreeHead, InclusionProof } from "./log";

export function verifySignedTreeHead(sth: SignedTreeHead, trustedPublicKey: string): boolean {
  try {
    const dataToVerify = `${sth.tree_size}:${sth.root_hash}:${sth.timestamp}`;
    const publicKey = createPublicKey({ key: trustedPublicKey, format: "pem", type: "spki" });
    return edVerify(null, Buffer.from(dataToVerify), publicKey, Buffer.from(sth.signature, "base64"));
  } catch {
    return false;
  }
}

/**
 * Verify an inclusion proof.
 *
 * The proof contains sibling hashes from leaf level to root.
 * We need to know at each level whether the current hash is the left
 * or right child. This is determined by the leaf_index:
 * - At level 0: if leaf_index is even → current is left, sibling is right
 *   if leaf_index is odd → current is right, sibling is left
 * - At level k: if floor(leaf_index / 2^k) is even → current is left
 *
 * The tree computes: parent = sha256(left + right)
 */
export function verifyInclusion(
  proof: InclusionProof,
  leafDigest: string,
  expectedRoot: string,
): boolean {
  let current = sha256(leafDigest);
  let index = proof.leaf_index;
  let size = proof.tree_size;

  for (let i = 0; i < proof.path.length; i++) {
    const sibling = proof.path[i];
    const isRight = index % 2 === 1;

    if (isRight) {
      // current is RIGHT child, sibling is LEFT
      // parent = sha256(left + right) = sha256(sibling + current)
      current = sha256(sibling + current);
    } else {
      // current is LEFT child, sibling is RIGHT
      // parent = sha256(left + right) = sha256(current + sibling)
      current = sha256(current + sibling);
    }

    index = Math.floor(index / 2);
    size = Math.ceil(size / 2);
  }

  return current === proof.root_hash && proof.root_hash === expectedRoot;
}

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}
