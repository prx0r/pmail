// tests/transparency.test.ts — Transparency log tests

import { describe, it, expect } from "vitest";
import { TransparencyLog, verifySignedTreeHead, verifyInclusion } from "../src/qp/transparency";
import { generateReceiptKeyPair } from "../src/qp/obsigna";

describe("Transparency Log", () => {
  const keys = generateReceiptKeyPair();

  it("starts empty", () => {
    const log = new TransparencyLog(keys);
    const state = log.getState();
    expect(state.treeSize).toBe(0);
    expect(state.signedTreeHead).toBeNull();
  });

  it("appends entries", () => {
    const log = new TransparencyLog(keys);
    log.append("sha256:aaa");
    log.append("sha256:bbb");
    const state = log.getState();
    expect(state.treeSize).toBe(2);
  });

  it("generates signed tree head", () => {
    const log = new TransparencyLog(keys);
    log.append("sha256:aaa");
    const sth = log.getSignedTreeHead();
    expect(sth).toBeTruthy();
    expect(sth!.tree_size).toBe(1);
    expect(sth!.signature).toBeTruthy();
  });

  it("STH signature verifies", () => {
    const log = new TransparencyLog(keys);
    log.append("sha256:aaa");
    log.append("sha256:bbb");
    const sth = log.getSignedTreeHead()!;
    expect(verifySignedTreeHead(sth, keys.publicKey)).toBe(true);
  });

  it("STH signature fails with wrong key", () => {
    const otherKeys = generateReceiptKeyPair();
    const log = new TransparencyLog(keys);
    log.append("sha256:aaa");
    const sth = log.getSignedTreeHead()!;
    expect(verifySignedTreeHead(sth, otherKeys.publicKey)).toBe(false);
  });

  it("inclusion proof verifies for all leaves", () => {
    const log = new TransparencyLog(keys);
    for (let i = 0; i < 8; i++) {
      log.append(`sha256:item${i}`);
    }

    const state = log.getState();
    const proof = log.getInclusionProof(0)!;

    // Reproduce the exact standalone verification
    const { createHash } = require("crypto");
    const sha = (d: string) => createHash("sha256").update(d).digest("hex");

    let cur = sha("sha256:item0");
    let idx = 0;
    for (let i = 0; i < proof.path.length; i++) {
      const sib = proof.path[i];
      const isRight = idx % 2 === 1;
      if (isRight) {
        cur = sha(sib + cur);
      } else {
        cur = sha(cur + sib);
      }
      idx = Math.floor(idx / 2);
    }
    expect(cur).toBe(state.rootHash);
  });

  it("inclusion proof fails with wrong leaf digest", () => {
    const log = new TransparencyLog(keys);
    for (let i = 0; i < 4; i++) {
      log.append(`sha256:item${i}`);
    }
    const state = log.getState();
    const proof = log.getInclusionProof(0)!;
    expect(verifyInclusion(proof, "sha256:wrong", state.rootHash)).toBe(false);
  });

  it("consistency proof between sizes", () => {
    const log = new TransparencyLog(keys);
    for (let i = 0; i < 10; i++) {
      log.append(`sha256:item${i}`);
    }
    const proof = log.getConsistencyProof(5, 10);
    expect(proof).toBeTruthy();
    expect(proof!.old_size).toBe(5);
    expect(proof!.new_size).toBe(10);
  });

  it("root changes with each append", () => {
    const log = new TransparencyLog(keys);
    const roots: string[] = [];
    for (let i = 0; i < 5; i++) {
      log.append(`sha256:item${i}`);
      roots.push(log.getState().rootHash);
    }
    expect(new Set(roots).size).toBe(5);
  });
});
