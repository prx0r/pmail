// src/qp/obsigna/index.ts — obsigna-compatible receipt module

export { jcsCanonicalize, canonicalJson } from "./canonical";
export { signReceipt, verifyReceiptSignature, verifyReceiptChain, hashReceipt, generateReceiptKeyPair } from "./sign";
export type { ReceiptSignerKeyPair } from "./sign";
export { buildReceipt, buildAndSignReceipt, extendChain, terminateChain } from "./builder";
export { PinnedSignerRegistry, verifyWithTrust } from "./trusted-signer";
export type { TrustedSigner, VerifyContext, SignerTrustResolver } from "./trusted-signer";
export {
  RECEIPT_CONTEXT,
  RECEIPT_VERSION,
} from "./types";
export type {
  AgentReceipt,
  ReceiptIssuer,
  ReceiptSubject,
  QPReceiptExtension,
  ReceiptProof,
  CreateReceiptInput,
  ReceiptVerificationResult,
  ChainVerificationResult,
} from "./types";
