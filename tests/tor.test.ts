// tests/tor.test.ts — Tor service tests

import { describe, it, expect } from "vitest";
import { TorService, defaultSecurityHeaders, sanitizeLogEntry } from "../src/core/tor";

describe("Tor Service", () => {
  const service = new TorService({
    torPath: "/usr/bin/tor",
    dataDir: "/tmp/tor-test",
    localPort: 8080,
    logLevel: "warn",
    clearnetEnabled: false,
  });

  it("starts in UNCONFIGURED state", () => {
    const info = service.getInfo();
    expect(info.state).toBe("UNCONFIGURED");
    expect(info.hostname).toBeUndefined();
  });

  it("start() returns UNCONFIGURED (DEV_ONLY)", async () => {
    const info = await service.start();
    expect(info.state).toBe("UNCONFIGURED");
    expect(info.error).toContain("DEV_ONLY");
  });

  it("verifyReachability returns unreachable (DEV_ONLY)", async () => {
    const result = await service.verifyReachability();
    expect(result.reachable).toBe(false);
    expect(result.hostname).toBe("");
    expect(result.error).toContain("DEV_ONLY");
  });

  it("stop resets to UNCONFIGURED", async () => {
    await service.start();
    await service.stop();
    const info = service.getInfo();
    expect(info.state).toBe("UNCONFIGURED");
  });
});

describe("Security Headers", () => {
  it("returns all required headers", () => {
    const headers = defaultSecurityHeaders();
    expect(headers.contentSecurityPolicy).toBeTruthy();
    expect(headers.strictTransportSecurity).toBeTruthy();
    expect(headers.xContentTypeOptions).toBe("nosniff");
    expect(headers.xFrameOptions).toBe("DENY");
    expect(headers.referrerPolicy).toBe("no-referrer");
  });
});

describe("Log Sanitization", () => {
  it("strips non-allowlisted fields", () => {
    const entry = {
      timestamp: "2026-01-01",
      level: "info" as const,
      module: "test",
      message: "test",
      meta: { action: "test", ip: "1.2.3.4", secret: "abc" },
    };
    const sanitized = sanitizeLogEntry(entry);
    expect(sanitized.meta?.action).toBe("test");
    expect(sanitized.meta?.ip).toBeUndefined();
    expect(sanitized.meta?.secret).toBeUndefined();
  });

  it("preserves allowlisted fields", () => {
    const entry = {
      timestamp: "2026-01-01",
      level: "info" as const,
      module: "test",
      message: "test",
      meta: { session_id: "s1", claim_id: "c1", duration_ms: "100" },
    };
    const sanitized = sanitizeLogEntry(entry);
    expect(sanitized.meta?.session_id).toBe("s1");
    expect(sanitized.meta?.claim_id).toBe("c1");
    expect(sanitized.meta?.duration_ms).toBe("100");
  });
});
