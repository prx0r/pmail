// tests/mcp.test.ts — MCP server tests

import { describe, it, expect } from "vitest";
import { PMAIL_TOOLS, handleMcpRequest } from "../src/mcp/server";
import type { Grant } from "../src/qp/kernel";

describe("MCP Server", () => {
  const ctx = { grants: new Map() };

  describe("tools/list", () => {
    it("returns all tools", async () => {
      const result = await handleMcpRequest({ method: "tools/list" }, ctx);
      expect(result.result).toBeTruthy();
      expect(result.result.tools.length).toBe(PMAIL_TOOLS.length);
    });

    it("each tool has name, description, inputSchema", async () => {
      const result = await handleMcpRequest({ method: "tools/list" }, ctx);
      for (const tool of result.result.tools) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeTruthy();
      }
    });
  });

  describe("tools/call", () => {
    it("rejects unknown tool", async () => {
      const result = await handleMcpRequest(
        { method: "tools/call", params: { name: "nonexistent" } },
        ctx,
      );
      expect(result.error).toBeTruthy();
      expect(result.error!.code).toBe(-32601);
    });

    it("pmail.status returns status via real handler", async () => {
      const result = await handleMcpRequest(
        { method: "tools/call", params: { name: "pmail.status", arguments: {} } },
        ctx,
      );
      expect(result.result).toBeTruthy();
      const text = result.result.content[0].text;
      expect(text).toContain("running");
      expect(text).toContain("0.1.0");
    });

    it("pmail.session.create uses cryptographically secure IDs", async () => {
      const result = await handleMcpRequest(
        { method: "tools/call", params: { name: "pmail.session.create", arguments: {} } },
        ctx,
      );
      expect(result.result).toBeTruthy();
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

  describe("unknown method", () => {
    it("returns error for unknown method", async () => {
      const result = await handleMcpRequest({ method: "unknown" }, ctx);
      expect(result.error).toBeTruthy();
      expect(result.error!.code).toBe(-32601);
    });
  });
});
