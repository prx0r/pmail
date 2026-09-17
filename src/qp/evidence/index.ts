// src/qp/evidence/index.ts — Private evidence tree + disclosure

export { evidenceLeafHash, buildEvidenceMerkleTree, generateInclusionProof, verifyInclusionProof } from "./merkle";
export type { MerkleTree, InclusionProof } from "./merkle";
export { buildPublicReceipt, scanForPII, validatePublicReceipt } from "./disclosure";
export type { DisclosureManifestV1, PublicReceipt } from "./disclosure";
