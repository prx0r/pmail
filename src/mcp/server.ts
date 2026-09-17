// src/mcp/server.ts — MCP API surface for PMail
// Phase: MCP/API surface (tools)

/**
 * Keep tool surface small:
 *
 * Read-only:
 *   pmail.status
 *   pmail.privacy.explain
 *   pmail.bridges.list
 *   pmail.phone.search
 *   pmail.receipt.get
 *   pmail.receipt.verify
 *
 * State-changing:
 *   pmail.session.create
 *   pmail.xmr.invoice
 *   pmail.simplex.address.create
 *   pmail.simplex.send
 *   pmail.phone.provision
 *   pmail.phone.renew
 *   pmail.phone.sms.send
 *
 * All state-changing provider/money actions must pass exact authority +
 * privacy policy + effect gateway.
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
}

export const PMAIL_TOOLS: Tool[] = [
  // Read-only
  {
    name: "pmail.status",
    description: "Current PMail runtime status (uptime, session count, active bridges)",
    inputSchema: {},
    readOnly: true,
  },
  {
    name: "pmail.privacy.explain",
    description: "Explain the privacy classification of a set of dependencies",
    inputSchema: {
      dependencies: { type: "array", items: { type: "string" } },
    },
    readOnly: true,
  },
  {
    name: "pmail.bridges.list",
    description: "List available phone/messaging bridges with their privacy classifications",
    inputSchema: {
      capabilities: { type: "array", items: { type: "string" } },
      maxPrivacyClass: { type: "string", enum: ["ANON_CORE", "PSEUDONYMOUS_BRIDGE", "IDENTITY_BRIDGED"] },
    },
    readOnly: true,
  },
  {
    name: "pmail.phone.search",
    description: "Search for available phone numbers by country and capabilities",
    inputSchema: {
      country: { type: "string" },
      capabilities: { type: "array", items: { type: "string" } },
      maxPrice: { type: "number" },
    },
    readOnly: true,
  },
  {
    name: "pmail.receipt.get",
    description: "Retrieve a receipt by ID",
    inputSchema: { receiptId: { type: "string" } },
    readOnly: true,
  },
  {
    name: "pmail.receipt.verify",
    description: "Verify a receipt's signature and chain",
    inputSchema: { receiptId: { type: "string" } },
    readOnly: true,
  },

  // State-changing
  {
    name: "pmail.session.create",
    description: "Create a new anonymous session (no signup, no email, no phone)",
    inputSchema: {},
    readOnly: false,
  },
  {
    name: "pmail.xmr.invoice",
    description: "Generate an XMR invoice for session funding",
    inputSchema: {
      sessionId: { type: "string" },
      amountPiconeros: { type: "string" },
    },
    readOnly: false,
  },
  {
    name: "pmail.simplex.address.create",
    description: "Create a new SimpleX contact address",
    inputSchema: {
      sessionId: { type: "string" },
    },
    readOnly: false,
  },
  {
    name: "pmail.simplex.send",
    description: "Send a message via SimpleX",
    inputSchema: {
      to: { type: "string" },
      body: { type: "string" },
      claimId: { type: "string" },
    },
    readOnly: false,
  },
  {
    name: "pmail.phone.provision",
    description: "Provision a phone number through a bridge provider",
    inputSchema: {
      providerId: { type: "string" },
      productId: { type: "string" },
      paymentProof: { type: "string" },
      grantId: { type: "string" },
    },
    readOnly: false,
  },
  {
    name: "pmail.phone.renew",
    description: "Renew a phone number lease",
    inputSchema: {
      providerId: { type: "string" },
      resourceId: { type: "string" },
      grantId: { type: "string" },
    },
    readOnly: false,
  },
  {
    name: "pmail.phone.sms.send",
    description: "Send an SMS via a provisioned phone number",
    inputSchema: {
      providerId: { type: "string" },
      resourceId: { type: "string" },
      to: { type: "string" },
      body: { type: "string" },
      grantId: { type: "string" },
    },
    readOnly: false,
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

const STATE_CHANGING_TOOLS = new Set([
  "pmail.xmr.invoice",
  "pmail.simplex.address.create",
  "pmail.simplex.send",
  "pmail.phone.provision",
  "pmail.phone.renew",
  "pmail.phone.sms.send",
]);

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
  // 1. Authenticate principal (server-derived, never caller-asserted)
  const auth = authenticatePrincipal(ctx);
  if (auth.error && STATE_CHANGING_TOOLS.has(toolName)) {
    return { content: auth.error, isError: true };
  }

  // 2. Validate grant for state-changing tools
  const grantCheck = validateGrantForTool(toolName, args, ctx);
  if (!grantCheck.valid) {
    return { content: grantCheck.error!, isError: true };
  }

  // 3. Dispatch to handler
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
    case "pmail.simplex.send":
      return handleSimplexSend(args, ctx);
    case "pmail.simplex.address.create":
      return handleSimplexAddressCreate(args, ctx);
    case "pmail.phone.provision":
      return handlePhoneProvision(args, ctx);
    case "pmail.xmr.invoice":
      return handleXmrInvoice(args, ctx);
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
      uptime_seconds: Math.floor(process.uptime()),
      privacy_mode: "ANON_CORE",
      bridges: [],
      sessions_active: 0,
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
      next_step: "pmail.xmr.invoice to fund this session",
    }),
  };
}

function handleReceiptGet(args: Record<string, any>): ToolResult {
  return {
    content: JSON.stringify({
      receipt_id: args.receiptId,
      found: false,
      message: "Receipt store not connected in dev mode",
    }),
  };
}

function handleReceiptVerify(args: Record<string, any>): ToolResult {
  return {
    content: JSON.stringify({
      receipt_id: args.receiptId,
      verified: false,
      message: "Receipt verification not connected in dev mode",
    }),
  };
}

function handleSimplexSend(args: Record<string, any>, ctx: ToolContext): ToolResult {
  return {
    content: JSON.stringify({
      status: "pending",
      to: args.to,
      body_hash: createHash("sha256").update(args.body || "").digest("hex"),
      claim_id: args.claimId || "",
      message: "SimpleX send dispatched (requires SimpleX adapter in context)",
    }),
  };
}

function handleSimplexAddressCreate(args: Record<string, any>, ctx: ToolContext): ToolResult {
  const addrId = "addr:" + randomBytes(8).toString("hex");
  return {
    content: JSON.stringify({
      address_id: addrId,
      session_id: args.sessionId,
      status: "created",
      message: "SimpleX address created (requires SimpleX adapter in context)",
    }),
  };
}

function handlePhoneProvision(args: Record<string, any>, ctx: ToolContext): ToolResult {
  return {
    content: JSON.stringify({
      provider_id: args.providerId,
      product_id: args.productId,
      status: "pending_authorization",
      grant_id: args.grantId,
      message: "Phone provision requires effect gateway execution",
    }),
  };
}

function handleXmrInvoice(args: Record<string, any>, ctx: ToolContext): ToolResult {
  const invoiceId = "inv:" + randomBytes(8).toString("hex");
  return {
    content: JSON.stringify({
      invoice_id: invoiceId,
      session_id: args.sessionId,
      amount_piconeros: args.amountPiconeros,
      status: "pending",
      message: "XMR invoice requires wallet RPC integration",
    }),
  };
}

// ─── HTTP Server (Hono-style for Cloudflare Workers) ──────

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
        })),
      },
    };
  }

  if (request.method === "tools/call") {
    const { name, arguments: args } = request.params || {};
    if (!name) {
      return { error: { code: -32602, message: "Missing tool name" } };
    }

    const tool = PMAIL_TOOLS.find((t) => t.name === name);
    if (!tool) {
      return { error: { code: -32601, message: `Unknown tool: ${name}` } };
    }

    // Dispatch to real tool handler with grant validation
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
