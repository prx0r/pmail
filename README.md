# pmail

Tor-first, XMR-funded communications for pseudonymous agents.

**Status: ACTIVE DEVELOPMENT — not production-ready.**

This is a scaffold with working type system, privacy composition, session lifecycle, QP kernel, and receipt primitives. Most external integrations (SimpleX, Tor, XMR wallet, phone providers) are stubs or interfaces. Do not use for real money or real identity until Commit 7+ milestones are reached.

## What Works (tested)

- Privacy class composition and policy evaluation (7 tests)
- Accountless session lifecycle + capability minting (10 tests)
- QP kernel: actuality, claims, merkle trees, canonical hashing, replay (18 tests)
- Identity: Ed25519 operator keypairs (6 tests)
- Phone provider contract + bridge selection (8 tests)
- Receipt envelope: Ed25519 signing, chain verification (8 tests)
- Egress policy: allowlist/denylist enforcement (6 tests)
- Runtime attestation: LocalAttestor for dev (5 tests)
- MCP server: tool dispatch with grant validation (5 tests)
- Security red-team tests (20 tests)

## What's Stubbed (interfaces only, not real)

- `src/messaging/simplex.ts` — MockSimplexAdapter works; live CLI adapter is placeholder
- `src/core/tor.ts` — Returns UNCONFIGURED, no real onion service
- `src/payments/` — Does not exist yet (Commit 7)
- `src/bridges/phone/pikasim.ts` — HTTP calls exist, no response validation
- `src/bridges/phone/silentlink.ts` — HTTP calls exist, no empirical validation
- `src/core/secrets.ts` — AgentVault interface, no real vault server
- `src/core/attestor.ts` — LocalAttestor for dev only, DStack is placeholder
- `src/mcp/server.ts` — 7 tools implemented, 6 tools are stubs

## Architecture

```
AGENT → MCP Server → QP Kernel → Effect Gateway → Platform
                                        ↓
HUMAN → Dashboard (approval only) ←── receipts ←──┘
```

## Core Principles

1. **Proof, not trust** — every action has a QP receipt
2. **Credentials never leave the vault** — agent gets capabilities, not tokens
3. **Human approval for consequential actions** — purchases, sends, writes
4. **Independent readback** — never trust the executor's success response
5. **Append-only receipts** — cryptographically signed, hash-chained, replayable

## Running Tests

```bash
npm test          # 98 tests
npm run typecheck # 0 errors
```

## Peer Review

5-part peer review saved to `PEER_REVIEW_INBOX.md`. Execution order: Commits 0-10.
