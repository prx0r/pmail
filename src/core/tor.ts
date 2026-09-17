// src/core/tor.ts — Tor onion service configuration
// Phase E: Expose PMail API through an onion service.
// STATUS: DEV_ONLY — no real Tor process. Returns UNCONFIGURED.

/**
 * Tor is the canonical ANON_CORE network endpoint.
 * Clearnet/custom domain is optional later.
 *
 * Requirements:
 * - No clearnet domain required for operation
 * - No source IP logging by default
 * - Explicit structured log allowlist
 * - No secrets in URLs
 * - CSP/security headers if browser UI exists
 */

import type { PrivacyClass } from "../privacy/types";

// ─── Configuration ────────────────────────────────────────

export interface TorConfig {
  /** Path to tor binary */
  torPath: string;
  /** Data directory for Tor state */
  dataDir: string;
  /** Port the local service listens on */
  localPort: number;
  /** Optional: pre-generated hostname file for stable .onion address */
  hostnameFile?: string;
  /** HS directory for hidden service keys */
  hsDir?: string;
  /** Log level */
  logLevel: "warn" | "notice" | "info";
  /** Whether to enable clearnet fallback */
  clearnetEnabled: boolean;
}

export type TorState = "UNCONFIGURED" | "STARTING" | "READY" | "FAILED";

export interface OnionServiceInfo {
  state: TorState;
  hostname?: string;            // only set when state === "READY"
  port: number;
  createdAt: string;
  privacyClass?: PrivacyClass;  // only set when state === "READY"
  localEndpoint: string;
  error?: string;
}

// ─── Tor Service Manager ─────────────────────────────────

export class TorService {
  private config: TorConfig;
  private service: OnionServiceInfo;

  constructor(config: TorConfig) {
    this.config = config;
    this.service = {
      state: "UNCONFIGURED",
      port: config.localPort,
      createdAt: new Date().toISOString(),
      localEndpoint: `127.0.0.1:${config.localPort}`,
    };
  }

  /**
   * Start the Tor onion service.
   * DEV_ONLY: returns UNCONFIGURED. Real implementation launches tor process.
   */
  async start(): Promise<OnionServiceInfo> {
    // DEV_ONLY: In production:
    // 1. Generate or load HS keys
    // 2. Write torrc with HiddenServiceDir + HiddenServicePort
    // 3. Launch tor process
    // 4. Read hostname from HiddenServiceDir/hostname
    // 5. Verify service is reachable via 127.0.0.1:localPort
    this.service = {
      state: "UNCONFIGURED",
      port: this.config.localPort,
      createdAt: new Date().toISOString(),
      localEndpoint: `127.0.0.1:${this.config.localPort}`,
      error: "DEV_ONLY: Tor not implemented. Run Commit 9 for real onion service.",
    };
    return this.service;
  }

  /** Stop the Tor service */
  async stop(): Promise<void> {
    this.service = { state: "UNCONFIGURED", port: this.config.localPort, createdAt: this.service.createdAt, localEndpoint: this.service.localEndpoint };
  }

  /** Get current service info */
  getInfo(): OnionServiceInfo {
    return this.service;
  }

  /**
   * Verify the onion service is reachable.
   * DEV_ONLY: always returns unreachable. Never produces TRUE QP claim.
   */
  async verifyReachability(): Promise<{
    reachable: boolean;
    hostname: string;
    observedAt: string;
    latencyMs?: number;
    error?: string;
  }> {
    return {
      reachable: false,
      hostname: "",
      observedAt: new Date().toISOString(),
      error: "DEV_ONLY: Tor not implemented. Onion service reachability cannot be verified.",
    };
  }
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

// ─── Structured Logging ───────────────────────────────────

export type LogLevel = "debug" | "info" | "notice" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  /** Explicit allowlist — never log IPs, secrets, or PII */
  meta?: Record<string, string>;
}

const LOG_ALLOWLIST = new Set([
  "module",
  "action",
  "result",
  "duration_ms",
  "error_type",
  "session_id",
  "claim_id",
]);

export function sanitizeLogEntry(entry: LogEntry): LogEntry {
  if (!entry.meta) return entry;
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(entry.meta)) {
    if (LOG_ALLOWLIST.has(key)) {
      sanitized[key] = value;
    }
  }
  return { ...entry, meta: sanitized };
}
