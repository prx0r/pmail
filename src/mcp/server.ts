// src/mcp/server.ts — MCP API surface for PMail
// STATUS: PARTIAL — 7 tools implemented, 6 tools are DEV_ONLY stubs.

/**
 * Tool classification:
 * A. Anonymous bootstrap (no grant needed): pmail.session.create
 * B. Read-only: pmail.status, pmail.privacy.explain, pmail.bridges.list,
 *    pmail.phone.search, pmail.receipt.get, pmail.receipt.verify
 * C. Consequential (exact authority + effect gateway required):
 *    pmail.xmr.invoice, pmail.simplex.address.create, pmail.simplex.send,
 *    pmail.phone.provision, pmail.phone.renew, pmail.phone.sms.send
 */

import { createHash, randomBytes } from "crypto";
import type { PrivacyPolicy } from "../privacy/types";
import { evaluatePrivacy } from "../privacy/types";
import type { Grant } from "../qp/kernel";

// ─── Tool Definitions ─────────────────────────────────────

export interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  readOnly: boolean;
  implemented: boolean;  // false = DEV_ONLY stub
}

export const PMAIL_TOOLS: Tool[] = [
  // ── Read-only (implemented) ──
  {
    name: "pmail.status",
    description: "Current PMail runtime status",
    inputSchema: {},
    readOnly: true,
    implemented: true,
  },
  {
    name: "pmail.privacy.explain",
    description: "Explain privacy classification of dependency set",
    inputSchema: { dependencies: { type: "array", items: { type: "string" } } },
    readOnly: true,
    implemented: true,
  },
  {
    name: "pmail.receipt.get",
    description: "Retrieve a receipt by ID",
    inputSchema: { receiptId: { type: "string" } },
    readOnly: true,
    implemented: true,
  },
  {
    name: "pmail.receipt.verify",
    description: "Verify a receipt signature and chain",
    inputSchema: { receiptId: { type: "string" } },
    readOnly: true,
    implemented: true,
  },

  // ── Read-only (DEV_ONLY — no backing store) ──
  {
    name: "pmail.bridges.list",
    description: "[DEV_ONLY] List phone/messaging bridges",
    inputSchema: { capabilities: { type: "array", items: { type: "string" } }, maxPrivacyClass: { type: "string" } },
    readOnly: true,
    implemented: false,
  },
  {
    name: "pmail.phone.search",
    description: "[DEV_ONLY] Search available phone numbers",
    inputSchema: { country: { type: "string" }, capabilities: { type: "array", items: { type: "string" } } },
    readOnly: true,
    implemented: false,
  },

  // ── Anonymous bootstrap (implemented) ──
  {
    name: "pmail.session.create",
    description: "Create anonymous session (no signup required)",
    inputSchema: {},
    readOnly: false,
    implemented: true,
  },

  // ── Consequential (DEV_ONLY — no effect gateway / wallet RPC) ──
  {
    name: "pmail.xmr.invoice",
    description: "[DEV_ONLY] Generate XMR invoice — requires MoneroPay integration (Commit 7)",
    inputSchema: { sessionId: { type: "string" }, amountPiconeros: { type: "string" } },
    readOnly: false,
    implemented: false,
  },
  {
    name: "pmail.simplex.address.create",
    description: "[DEV_ONLY] Create SimpleX address — requires live adapter (Commit 8)",
    inputSchema: { sessionId: { type: "string" } },
    readOnly: false,
    implemented: false,
  },
  {
    name: "pmail.simplex.send",
    description: "[DEV_ONLY] Send SimpleX message — requires live adapter (Commit 8)",
    inputSchema: { to: { type: "string" }, body: { type: "string" }, claimId: { type: "string" } },
    readOnly: false,
    implemented: false,
  },
  {
    name: "pmail.phone.provision",
    description: "[DEV_ONLY] Provision phone — requires effect gateway + provider validation (Commit 10)",
    inputSchema: { providerId: { type: "string" }, productId: { type: "string" }, grantId: { type: "string" } },
    readOnly: false,
    implemented: false,
  },
  {
    name: "pmail.phone.renew",
    description: "[DEV_ONLY] Renew phone — requires effect gateway (Commit 10)",
    inputSchema: { providerId: { type: "string" }, resourceId: { type: "string" }, grantId: { type: "string" } },
    readOnly: false,
    implemented: false,
  },
  {
    name: "pmail.phone.sms.send",
    description: "[DEV_ONLY] Send SMS — requires effect gateway (Commit 10)",
    inputSchema: { providerId: { type: "string" }, resourceId: { type: "string" }, to: { type: "string" }, body: { type: "string" }, grantId: { type: "string" } },
    readOnly: false,
    implemented: false,
  },
];

// ─── Tool Handler ─────────────────────────────────────────

export interface ToolContext {
  sessionId?: string;
  principal?: string;
  grants: Map<string, Grant>;
}

export interface ToolResult {
  content: string;
  isError?: boolean;
  metadata?: Record<string, any>;
}

// ─── Grant Validation ─────────────────────────────────────

// Anonymous bootstrap: no grant required, no auth required
const ANONYMOUS_BOOTSTRAP = new Set(["pmail.session.create"]);

const STATE_CHANGING_TOOLS = new Set(
  PMAIL_TOOLS.filter((t) => !t.readOnly && t.implemented && !ANONYMOUS_BOOTSTRAP.has(t.name)).map((t) => t.name)
);

function validateGrantForTool(
  toolName: string,
  args: Record<string, any>,
  ctx: ToolContext,
): { valid: boolean; error?: string } {
  if (!STATE_CHANGING_TOOLS.has(toolName)) {
    return { valid: true };
  }

  const grantId = args.grantId;
  if (!grantId) {
    return { valid: false, error: `Tool ${toolName} requires a grantId` };
  }

  const grant = ctx.grants.get(grantId);
  if (!grant) {
    return { valid: false, error: `Grant ${grantId} not found` };
  }

  if (grant.action !== toolName) {
    return { valid: false, error: `Grant ${grantId} action mismatch: expected ${grant.action}, got ${toolName}` };
  }

  if (new Date(grant.expires_at) < new Date()) {
    return { valid: false, error: `Grant ${grantId} expired` };
  }

  if (grant.max_uses <= 0) {
    return { valid: false, error: `Grant ${grantId} exhausted` };
  }

  return { valid: true };
}

// ─── Principal Authentication ─────────────────────────────

function authenticatePrincipal(ctx: ToolContext): { principal: string; error?: string } {
  if (!ctx.principal) {
    return { principal: "", error: "No authenticated principal" };
  }
  return { principal: ctx.principal };
}

// ─── Main Dispatch ────────────────────────────────────────

export async function handleTool(
  toolName: string,
  args: Record<string, any>,
  ctx: ToolContext,
): Promise<ToolResult> {
  // 1. Check tool exists and is implemented
  const tool = PMAIL_TOOLS.find((t) => t.name === toolName);
  if (!tool) {
    return { content: `Unknown tool: ${toolName}`, isError: true };
  }
  if (!tool.implemented) {
    return { content: `${toolName} is DEV_ONLY — not yet implemented. See README for status.`, isError: true };
  }

  // 2. Authenticate principal (server-derived, never caller-asserted)
  if (!ANONYMOUS_BOOTSTRAP.has(toolName)) {
    const auth = authenticatePrincipal(ctx);
    if (auth.error && STATE_CHANGING_TOOLS.has(toolName)) {
      return { content: auth.error, isError: true };
    }
  }

  // 3. Validate grant for state-changing tools
  const grantCheck = validateGrantForTool(toolName, args, ctx);
  if (!grantCheck.valid) {
    return { content: grantCheck.error!, isError: true };
  }

  // 4. Dispatch to handler
  switch (toolName) {
    case "pmail.status":
      return handleStatus();
    case "pmail.privacy.explain":
      return handlePrivacyExplain(args);
    case "pmail.session.create":
      return handleSessionCreate();
    case "pmail.receipt.get":
      return handleReceiptGet(args);
    case "pmail.receipt.verify":
      return handleReceiptVerify(args);
    default:
      return { content: `Unknown tool: ${toolName}`, isError: true };
  }
}

// ─── Tool Implementations ─────────────────────────────────

function handleStatus(): ToolResult {
  return {
    content: JSON.stringify({
      status: "running",
      version: "0.1.0",
      mode: "DEV",
      uptime_seconds: Math.floor(process.uptime()),
      privacy_mode: "ANON_CORE",
      implemented_tools: PMAIL_TOOLS.filter((t) => t.implemented).length,
      total_tools: PMAIL_TOOLS.length,
      stub_tools: PMAIL_TOOLS.filter((t) => !t.implemented).map((t) => t.name),
    }),
  };
}

function handlePrivacyExplain(args: Record<string, any>): ToolResult {
  const deps = args.dependencies || [];
  const surfaces = deps.map((d: string) => ({
    provider: d,
    legal_identity_required: d.includes("kyc") || d.includes("identity"),
    account_required: d.includes("account") || d.includes("google"),
    email_required: d.includes("email"),
    phone_required: d.includes("phone"),
    payment_rails: d.includes("xmr") ? ["XMR"] : d.includes("card") ? ["card"] : [],
    data_disclosed: [],
    network_metadata: [],
    evidence: [],
  }));

  const policy: PrivacyPolicy = {
    max_privacy_class: "ANON_CORE",
    forbid: ["legal_identity", "card_payment", "google_oauth"],
  };

  const decision = evaluatePrivacy(surfaces, policy);
  return {
    content: JSON.stringify({
      decision: decision.allowed ? "ALLOWED" : "VIOLATED",
      privacy_class: decision.class,
      violations: decision.violations,
    }),
  };
}

function handleSessionCreate(): ToolResult {
  const sessionId = "sess:" + randomBytes(16).toString("hex");
  return {
    content: JSON.stringify({
      session_id: sessionId,
      state: "UNFUNDED",
      next_step: "pmail.xmr.invoice to fund this session (DEV_ONLY — no wallet RPC yet)",
    }),
  };
}

function handleReceiptGet(args: Record<string, any>): ToolResult {
  return {
    content: JSON.stringify({
      receipt_id: args.receiptId,
      found: false,
      message: "Receipt store not connected (Commit 6 — durable store)",
    }),
  };
}

function handleReceiptVerify(args: Record<string, any>): ToolResult {
  return {
    content: JSON.stringify({
      receipt_id: args.receiptId,
      verified: false,
      message: "Receipt verification not connected (Commit 2 — Obsigna integration)",
    }),
  };
}

// ─── HTTP Server ──────────────────────────────────────────

export interface MCPRequest {
  method: string;
  params?: Record<string, any>;
}

export interface MCPResponse {
  result?: any;
  error?: { code: number; message: string };
}

export async function handleMcpRequest(
  request: MCPRequest,
  ctx: ToolContext,
): Promise<MCPResponse> {
  if (request.method === "tools/list") {
    return {
      result: {
        tools: PMAIL_TOOLS.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
          implemented: t.implemented,
        })),
      },
    };
  }

  if (request.method === "tools/call") {
    const { name, arguments: args } = request.params || {};
    if (!name) {
      return { error: { code: -32602, message: "Missing tool name" } };
    }

    const result = await handleTool(name, args || {}, ctx);
    return {
      result: {
        content: [{ type: "text", text: result.content }],
        isError: result.isError,
        metadata: result.metadata,
      },
    };
  }

  return { error: { code: -32601, message: `Unknown method: ${request.method}` } };
}
