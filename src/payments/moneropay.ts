// src/payments/moneropay.ts — MoneroPay / wallet-rpc HTTP client

/**
 * MoneroPay integration via HTTP API.
 * Do NOT implement wallet cryptography or transaction parsing.
 * Use MoneroPay / monero-wallet-rpc semantics.
 */

import type { WalletRpcConfig, SubAddress, MoneroPayCallback } from "./types";

// ─── MoneroPay Client ─────────────────────────────────────

export class MoneroPayClient {
  private config: WalletRpcConfig;

  constructor(config: WalletRpcConfig) {
    this.config = config;
  }

  /** Create a new subaddress for invoice */
  async createSubAddress(label?: string): Promise<SubAddress> {
    const response = await this.rpcCall("make_integrated_address", {});
    // In production: use make_integrated_address or create_address RPC
    return {
      address: response?.integrated_address || "",
      index: response?.subaddress_index || 0,
      label,
    };
  }

  /** Get transfers to a subaddress */
  async getTransfers(subaddressIndex?: number): Promise<any[]> {
    const response = await this.rpcCall("get_transfers", {
      filter: "received",
      subaddr_indices: subaddressIndex !== undefined ? [subaddressIndex] : undefined,
    });
    return response?.transfers || [];
  }

  /** Get balance */
  async getBalance(): Promise<{ balance: bigint; unlocked_balance: bigint }> {
    const response = await this.rpcCall("get_balance", {});
    return {
      balance: BigInt(response?.balance || 0),
      unlocked_balance: BigInt(response?.unlocked_balance || 0),
    };
  }

  /** Generic RPC call */
  private async rpcCall(method: string, params: Record<string, any>): Promise<any> {
    const auth = this.config.username
      ? { username: this.config.username, password: this.config.password || "" }
      : undefined;

    const response = await fetch(this.config.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: "0", method, params }),
      signal: AbortSignal.timeout(30_000),
      ...(auth ? { headers: { ...{}, "Authorization": "Basic " + Buffer.from(`${auth.username}:${auth.password}`).toString("base64") } } : {}),
    });

    if (!response.ok) throw new Error(`Wallet RPC error: ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(`Wallet RPC: ${data.error.message}`);
    return data.result;
  }
}

// ─── MoneroPay Webhook Handler ────────────────────────────

export function parseMoneroPayCallback(body: unknown): MoneroPayCallback | null {
  const b = body as any;
  if (!b?.tx_hash || !b?.xmr_amount || !b?.payment_id) return null;
  return {
    tx_hash: b.tx_hash,
    xmr_amount: String(b.xmr_amount),
    payment_id: b.payment_id,
    confirmations: b.confirmations || 0,
    subaddr_index: b.subaddr_index || { major: 0, minor: 0 },
  };
}

// ─── Payment Verification ─────────────────────────────────

export async function verifyPayment(
  client: MoneroPayClient,
  invoiceId: string,
  subaddressIndex: number,
  expectedAtomic: bigint,
): Promise<{
  verified: boolean;
  observed_atomic: bigint;
  confirmations: number;
  tx_hash?: string;
  error?: string;
}> {
  try {
    const transfers = await client.getTransfers(subaddressIndex);
    const matching = transfers.find((t: any) =>
      BigInt(t.amount || 0) > 0n
    );

    if (!matching) {
      return { verified: false, observed_atomic: 0n, confirmations: 0, error: "No matching transfer found" };
    }

    return {
      verified: true,
      observed_atomic: BigInt(matching.amount),
      confirmations: matching.confirmations || 0,
      tx_hash: matching.txid,
    };
  } catch (err: any) {
    return { verified: false, observed_atomic: 0n, confirmations: 0, error: err.message };
  }
}
