# pmail

Private secure email + social identity system.

Built on QP (Quantitative Proof) kernel. Every action is cryptographically verified. Credentials never leave the vault.

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

## Status

Setting up. Instructions incoming.
