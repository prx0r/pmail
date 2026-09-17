// src/core/secrets.ts — Agent Vault integration (Phase K)
// Integrate Agent Vault before adding providers that need long-lived credentials.

/**
 * Hard requirements:
 * - Agent cannot read actual provider credentials
 * - Service allowlist / egress policy
 * - Strict unmatched-host deny in production
 * - Short-lived agent-vault session token
 * - Management plane separate from agent sandbox
 */

// ─── Vault Interface ──────────────────────────────────────

export interface VaultConfig {
  /** Agent Vault endpoint URL */
  vaultUrl: string;
  /** Service name for this PMail instance */
  serviceName: string;
  /** Egress policy: allowed hosts for outbound requests */
  egressAllowlist: string[];
  /** Egress policy: denied hosts (always enforced, even when strictHostMatching is off) */
  egressDenylist?: string[];
  /** Default secret TTL (seconds) */
  defaultTtlSeconds: number;
  /** Whether to enforce strict host matching */
  strictHostMatching: boolean;
}

export interface SecretReference {
  /** Vault path for the secret */
  path: string;
  /** Version (for immutability) */
  version: number;
  /** Expiry time */
  expiresAt: string;
  /** Fingerprint of the secret value (for verification without reading) */
  fingerprint: string;
}

export interface SessionToken {
  token: string;
  expiresAt: string;
  scope: string[];
  vaultUrl: string;
}

// ─── Vault Client ─────────────────────────────────────────

export class AgentVault {
  private config: VaultConfig;
  private sessionToken?: SessionToken;

  constructor(config: VaultConfig) {
    this.config = config;
  }

  /**
   * Initialize a session with the vault.
   * Returns a short-lived token for credential injection.
   * The agent NEVER sees the actual secret values.
   */
  async initializeSession(): Promise<SessionToken> {
    const response = await fetch(`${this.config.vaultUrl}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service: this.config.serviceName,
        scope: ["read:secret", "inject:credential"],
        ttl_seconds: this.config.defaultTtlSeconds,
      }),
    });

    if (!response.ok) {
      throw new Error(`Vault session failed: ${response.status}`);
    }

    const data = await response.json() as any;
    this.sessionToken = {
      token: data.token,
      expiresAt: data.expires_at,
      scope: data.scope,
      vaultUrl: this.config.vaultUrl,
    };

    return this.sessionToken;
  }

  /**
   * Request credential injection for a specific provider.
   * The vault injects credentials directly into the request —
   * the agent never sees them.
   *
   * This is the "outbound credential injection" pattern:
   * Agent builds request -> vault adds auth headers -> request goes out
   */
  async injectCredential(params: {
    provider: string;
    request: Request;
    scope?: string[];
  }): Promise<Request> {
    if (!this.sessionToken) {
      throw new Error("Vault session not initialized");
    }

    // Validate egress policy
    const url = new URL(params.request.url);
    if (!this.isEgressAllowed(url.hostname)) {
      throw new Error(`Egress denied: ${url.hostname} not in allowlist`);
    }

    // In production: POST to vault /inject endpoint
    // Vault adds Authorization/API-Key/etc. headers to the request
    // Agent receives back a Request with credentials injected
    // But cannot read the credential values

    const response = await fetch(`${this.config.vaultUrl}/inject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.sessionToken.token}`,
      },
      body: JSON.stringify({
        provider: params.provider,
        request_url: params.request.url,
        request_method: params.request.method,
        scope: params.scope,
      }),
    });

    if (!response.ok) {
      throw new Error(`Vault injection failed: ${response.status}`);
    }

    // In production: vault returns modified headers
    // For now, return original request (MVP)
    return params.request;
  }

  /**
   * Get a reference to a secret (not the value).
   * The agent uses the reference; the vault injects the value when needed.
   */
  async getSecretRef(path: string): Promise<SecretReference> {
    if (!this.sessionToken) {
      throw new Error("Vault session not initialized");
    }

    const response = await fetch(`${this.config.vaultUrl}/ref`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.sessionToken.token}`,
      },
      body: JSON.stringify({ path }),
    });

    if (!response.ok) {
      throw new Error(`Vault ref failed: ${response.status}`);
    }

    return response.json() as Promise<SecretReference>;
  }

  /** Check if a hostname is in the egress allowlist */
  private isEgressAllowed(hostname: string): boolean {
    // Always check denylist regardless of strictHostMatching
    for (const denied of this.config.egressDenylist || []) {
      if (matchesPattern(hostname, denied)) return false;
    }

    if (!this.config.strictHostMatching) return true;

    return this.config.egressAllowlist.some((allowed) => {
      if (allowed.startsWith("*.")) {
        return hostname.endsWith(allowed.slice(1));
      }
      return hostname === allowed;
    });
  }

  /** End the vault session */
  async endSession(): Promise<void> {
    if (this.sessionToken) {
      await fetch(`${this.config.vaultUrl}/session/end`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${this.sessionToken.token}` },
      }).catch(() => {});
      this.sessionToken = undefined;
    }
  }
}

// ─── Egress Policy ────────────────────────────────────────

export interface EgressPolicy {
  /** Allowed hostname patterns */
  allowlist: string[];
  /** Denied hostname patterns (takes precedence) */
  denylist: string[];
  /** Whether to log all outbound requests */
  auditLogging: boolean;
}

export function evaluateEgress(hostname: string, policy: EgressPolicy): {
  allowed: boolean;
  reason: string;
} {
  // Check denylist first
  for (const denied of policy.denylist) {
    if (matchesPattern(hostname, denied)) {
      return { allowed: false, reason: `Denied by pattern: ${denied}` };
    }
  }

  // Check allowlist
  for (const allowed of policy.allowlist) {
    if (matchesPattern(hostname, allowed)) {
      return { allowed: true, reason: `Allowed by pattern: ${allowed}` };
    }
  }

  return { allowed: false, reason: "Not in allowlist" };
}

function matchesPattern(hostname: string, pattern: string): boolean {
  if (pattern.startsWith("*.")) {
    return hostname.endsWith(pattern.slice(1)) || hostname === pattern.slice(2);
  }
  return hostname === pattern;
}

// ─── Default PMail Egress Policy ──────────────────────────

export function defaultPmailEgressPolicy(): EgressPolicy {
  return {
    allowlist: [
      "*.simplex.im",           // SimpleX network
      "*.moneropay.io",         // MoneroPay
      "pikasim.com",            // PikaSim provider
      "silent.link",            // SilentLink provider
      "payjoin.monerojo.org",   // Monero PayJoin
      "api.moneropool.com",     // Monero mining pool (for wallet sync)
    ],
    denylist: [
      "*.google.com",           // No Google in ANON_CORE
      "*.facebook.com",         // No Meta in ANON_CORE
      "*.amazonaws.com",        // No AWS metadata leaks
      "169.254.169.254",        // Cloud metadata endpoint
    ],
    auditLogging: true,
  };
}
