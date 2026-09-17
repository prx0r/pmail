// src/core/tor-ready.ts — Tor service with proper state machine

/**
 * Production-ready Tor service interface.
 * Commit 9: proper state machine, no fake reachability.
 * Actual Tor process management requires system-level integration.
 */

import { createHash } from "crypto";
import type { PrivacyClass } from "../privacy/types";

export type TorState = "UNCONFIGURED" | "STARTING" | "READY" | "FAILED";

export interface TorServiceConfig {
  torPath: string;
  dataDir: string;
  localPort: number;
  hostnameFile?: string;
  hsDir?: string;
  logLevel: "warn" | "notice" | "info";
  clearnetEnabled: boolean;
  torSocksPort?: number;
}

export interface OnionServiceInfo {
  state: TorState;
  hostname?: string;
  port: number;
  createdAt: string;
  privacyClass?: PrivacyClass;
  localEndpoint: string;
  error?: string;
  pid?: number;
}

export class TorServiceReady {
  private config: TorServiceConfig;
  private service: OnionServiceInfo;
  private process?: any;

  constructor(config: TorServiceConfig) {
    this.config = config;
    this.service = {
      state: "UNCONFIGURED",
      port: config.localPort,
      createdAt: new Date().toISOString(),
      localEndpoint: `127.0.0.1:${config.localPort}`,
    };
  }

  async start(): Promise<OnionServiceInfo> {
    this.service = { ...this.service, state: "STARTING" };

    try {
      // In production:
      // 1. Generate or load HS identity key
      // 2. Write torrc
      // 3. Launch tor process with supervision
      // 4. Wait for hostname file
      // 5. Validate .onion format (v3: 56 chars + .onion)
      // 6. Verify reachability through SOCKS proxy

      this.service = {
        state: "UNCONFIGURED",
        port: this.config.localPort,
        createdAt: this.service.createdAt,
        localEndpoint: this.service.localEndpoint,
        error: "Tor process management not yet implemented. Deploy with actual tor binary.",
      };
      return this.service;
    } catch (err: any) {
      this.service = {
        state: "FAILED",
        port: this.config.localPort,
        createdAt: this.service.createdAt,
        localEndpoint: this.service.localEndpoint,
        error: err.message,
      };
      return this.service;
    }
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill("SIGTERM");
      this.process = undefined;
    }
    this.service = {
      state: "UNCONFIGURED",
      port: this.config.localPort,
      createdAt: this.service.createdAt,
      localEndpoint: this.service.localEndpoint,
    };
  }

  getInfo(): OnionServiceInfo {
    return { ...this.service };
  }

  /**
   * Verify reachability through Tor SOCKS proxy.
   * Must NOT return true without actual network test.
   */
  async verifyReachability(): Promise<{
    reachable: boolean;
    hostname: string;
    observedAt: string;
    latencyMs?: number;
    error?: string;
    evidence_class: string;
  }> {
    if (this.service.state !== "READY" || !this.service.hostname) {
      return {
        reachable: false,
        hostname: "",
        observedAt: new Date().toISOString(),
        error: "Service not in READY state",
        evidence_class: "tor_unavailable",
      };
    }

    // In production: HTTP request through Tor SOCKS proxy
    // curl --socks5-hostname 127.0.0.1:9050 http://<hostname>
    return {
      reachable: false,
      hostname: this.service.hostname,
      observedAt: new Date().toISOString(),
      error: "Tor SOCKS verification not implemented — requires live Tor process",
      evidence_class: "tor_unavailable",
    };
  }
}

// ─── Torrc Generator ──────────────────────────────────────

export function generateTorrc(config: TorServiceConfig, hiddenServicePort: number): string {
  return `
# PMail Tor Configuration — auto-generated
DataDirectory ${config.dataDir}
Log notice stdout

# Hidden Service
HiddenServiceDir ${config.hsDir || config.dataDir + "/hs_service"}
HiddenServicePort ${hiddenServicePort} 127.0.0.1:${config.localPort}

# SOCKS proxy (for outbound connections through Tor)
SocksPort ${config.torSocksPort || 9050}

# Security
RunAsDaemon 0
CookieAuthentication 1
${config.clearnetEnabled ? "" : "# Clearnet disabled — onion-only mode"}
`.trim();
}

// ─── .onion Format Validator ──────────────────────────────

export function isValidOnionV3(hostname: string): boolean {
  // v3 onion: 56 base32 chars + .onion
  return /^[a-z2-7]{56}\.onion$/.test(hostname);
}

// ─── Security Headers ─────────────────────────────────────

export interface SecurityHeaders {
  contentSecurityPolicy?: string;
  strictTransportSecurity?: string;
  xContentTypeOptions?: string;
  xFrameOptions?: string;
  referrerPolicy?: string;
}

export function defaultSecurityHeaders(): SecurityHeaders {
  return {
    contentSecurityPolicy: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
    strictTransportSecurity: "max-age=31536000; includeSubDomains",
    xContentTypeOptions: "nosniff",
    xFrameOptions: "DENY",
    referrerPolicy: "no-referrer",
  };
}
