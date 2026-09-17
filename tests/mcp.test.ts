// tests/mcp.test.ts — MCP server tests

import { describe, it, expect } from "vitest";
import { PMAIL_TOOLS, handleMcpRequest } from "../src/mcp/server";
import type { Grant } from "../src/qp/kernel";

describe("MCP Server", () => {
  const ctx = { grants: new Map() };

  describe("tools/list", () => {
    it("returns all tools with implemented flag", async () => {
      const result = await handleMcpRequest({ method: "tools/list" }, ctx);
      expect(result.result).toBeTruthy();
      expect(result.result.tools.length).toBe(PMAIL_TOOLS.length);
      for (const tool of result.result.tools) {
        expect(typeof tool.implemented).toBe("boolean");
      }
    });

    it("every advertised tool has a dispatch path", async () => {
      // Every tool in PMAIL_TOOLS must either be implemented or return DEV_ONLY error
      for (const tool of PMAIL_TOOLS) {
        const result = await handleMcpRequest(
          { method: "tools/call", params: { name: tool.name, arguments: {} } },
          ctx,
        );
        // Should not return "Unknown tool" — either works or returns DEV_ONLY
        const text = result.result?.content?.[0]?.text || result.error?.message || "";
        expect(text).not.toContain("Unknown tool");
      }
    });

    it("every tool has name, description, inputSchema", async () => {
      const result = await handleMcpRequest({ method: "tools/list" }, ctx);
      for (const tool of result.result.tools) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeTruthy();
      }
    });
  });

  describe("DEV_ONLY tools return errors", () => {
    it("pmail.xmr.invoice returns DEV_ONLY", async () => {
      const result = await handleMcpRequest(
        { method: "tools/call", params: { name: "pmail.xmr.invoice", arguments: {} } },
        ctx,
      );
      expect(result.result.content[0].text).toContain("DEV_ONLY");
    });

    it("pmail.simplex.send returns DEV_ONLY", async () => {
      const result = await handleMcpRequest(
        { method: "tools/call", params: { name: "pmail.simplex.send", arguments: {} } },
        ctx,
      );
      expect(result.result.content[0].text).toContain("DEV_ONLY");
    });

    it("pmail.phone.provision returns DEV_ONLY", async () => {
      const result = await handleMcpRequest(
        { method: "tools/call", params: { name: "pmail.phone.provision", arguments: {} } },
        ctx,
      );
      expect(result.result.content[0].text).toContain("DEV_ONLY");
    });
  });

  describe("implemented tools work", () => {
    it("pmail.status returns status with DEV mode", async () => {
      const result = await handleMcpRequest(
        { method: "tools/call", params: { name: "pmail.status", arguments: {} } },
        ctx,
      );
      const text = result.result.content[0].text;
      expect(text).toContain("running");
      expect(text).toContain("DEV");
    });

    it("pmail.session.create uses cryptographically secure IDs", async () => {
      const result = await handleMcpRequest(
        { method: "tools/call", params: { name: "pmail.session.create", arguments: {} } },
        ctx,
      );
      const parsed = JSON.parse(result.result.content[0].text);
      expect(parsed.session_id).toMatch(/^sess:[a-f0-9]{32}$/);
      expect(parsed.state).toBe("UNFUNDED");
    });

    it("pmail.session.create produces unique IDs", async () => {
      const r1 = await handleMcpRequest(
        { method: "tools/call", params: { name: "pmail.session.create", arguments: {} } },
        ctx,
      );
      const r2 = await handleMcpRequest(
        { method: "tools/call", params: { name: "pmail.session.create", arguments: {} } },
        ctx,
      );
      const id1 = JSON.parse(r1.result.content[0].text).session_id;
      const id2 = JSON.parse(r2.result.content[0].text).session_id;
      expect(id1).not.toBe(id2);
    });
  });

  describe("grant enforcement", () => {
    it("rejects unknown tool", async () => {
      const result = await handleMcpRequest(
        { method: "tools/call", params: { name: "nonexistent" } },
        ctx,
      );
      const text = result.result?.content?.[0]?.text || "";
      expect(text).toContain("Unknown tool");
    });

    it("read-only tool works without grant", async () => {
      const result = await handleMcpRequest(
        { method: "tools/call", params: { name: "pmail.status", arguments: {} } },
        ctx,
      );
      expect(result.result).toBeTruthy();
    });
  });

  describe("unknown method", () => {
    it("returns error", async () => {
      const result = await handleMcpRequest({ method: "unknown" }, ctx);
      expect(result.error).toBeTruthy();
      expect(result.error!.code).toBe(-32601);
    });
  });
});
