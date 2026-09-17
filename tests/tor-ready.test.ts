// tests/tor-ready.test.ts — Tor service ready tests

import { describe, it, expect } from "vitest";
import { TorServiceReady, generateTorrc, isValidOnionV3 } from "../src/core/tor-ready";

describe("TorServiceReady", () => {
  it("starts in UNCONFIGURED state", () => {
    const svc = new TorServiceReady({
      torPath: "/usr/bin/tor", dataDir: "/tmp/tor",
      localPort: 8080, logLevel: "warn", clearnetEnabled: false,
    });
    expect(svc.getInfo().state).toBe("UNCONFIGURED");
  });

  it("start returns UNCONFIGURED (Tor not implemented)", async () => {
    const svc = new TorServiceReady({
      torPath: "/usr/bin/tor", dataDir: "/tmp/tor",
      localPort: 8080, logLevel: "warn", clearnetEnabled: false,
    });
    const info = await svc.start();
    expect(info.state).toBe("UNCONFIGURED");
    expect(info.error).toContain("not yet implemented");
  });

  it("verifyReachability returns unreachable when not READY", async () => {
    const svc = new TorServiceReady({
      torPath: "/usr/bin/tor", dataDir: "/tmp/tor",
      localPort: 8080, logLevel: "warn", clearnetEnabled: false,
    });
    const result = await svc.verifyReachability();
    expect(result.reachable).toBe(false);
    expect(result.evidence_class).toBe("tor_unavailable");
  });
});

describe("Torrc Generator", () => {
  it("generates valid torrc", () => {
    const torrc = generateTorrc({
      torPath: "/usr/bin/tor",
      dataDir: "/var/lib/tor",
      localPort: 8080,
      logLevel: "notice",
      clearnetEnabled: false,
    }, 80);
    expect(torrc).toContain("HiddenServiceDir");
    expect(torrc).toContain("HiddenServicePort 80");
    expect(torrc).toContain("SocksPort");
  });
});

describe("Onion Format", () => {
  it("validates v3 onion addresses", () => {
    expect(isValidOnionV3("a".repeat(56) + ".onion")).toBe(true);
    expect(isValidOnionV3("short.onion")).toBe(false);
    expect(isValidOnionV3("a".repeat(56) + ".not")).toBe(false);
  });
});
