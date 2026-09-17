// src/store/memory.ts — In-memory durable store (for dev/testing)

import type {
  DurableStore, StoredSession, StoredInvoice, StoredCapability,
  CreditLedgerEntry, StoredGrant, EffectJournalEntry,
} from "./types";

export class MemoryStore implements DurableStore {
  private sessions = new Map<string, StoredSession>();
  private invoices = new Map<string, StoredInvoice>();
  private capabilities = new Map<string, StoredCapability>();
  private tokenHashIndex = new Map<string, string>();
  private creditEntries: CreditLedgerEntry[] = [];
  private grants = new Map<string, StoredGrant>();
  private effects = new Map<string, EffectJournalEntry>();
  private claims = new Map<string, any>();
  private evidence = new Map<string, any>();
  private receiptMeta = new Map<string, any>();

  async getSession(id: string) { return this.sessions.get(id) || null; }
  async putSession(s: StoredSession) { this.sessions.set(s.id, s); }
  async updateSession(id: string, patch: Partial<StoredSession>) {
    const s = this.sessions.get(id);
    if (s) Object.assign(s, patch);
  }

  async getInvoice(id: string) { return this.invoices.get(id) || null; }
  async putInvoice(inv: StoredInvoice) { this.invoices.set(inv.id, inv); }
  async updateInvoice(id: string, patch: Partial<StoredInvoice>) {
    const inv = this.invoices.get(id);
    if (inv) Object.assign(inv, patch);
  }

  async getCapability(id: string) { return this.capabilities.get(id) || null; }
  async getCapabilityByTokenHash(hash: string) {
    const id = this.tokenHashIndex.get(hash);
    return id ? this.capabilities.get(id) || null : null;
  }
  async putCapability(cap: StoredCapability) {
    this.capabilities.set(cap.id, cap);
    this.tokenHashIndex.set(cap.token_hash, cap.id);
  }
  async incrementCapabilityUses(id: string) {
    const cap = this.capabilities.get(id);
    if (!cap) return 0;
    cap.uses++;
    return cap.uses;
  }

  async appendCreditEntry(entry: CreditLedgerEntry) { this.creditEntries.push(entry); }
  async getCreditBalance(sessionId: string) {
    let balance = 0n;
    for (const e of this.creditEntries) {
      if (e.session_id === sessionId) balance += BigInt(e.delta_atomic);
    }
    return balance.toString();
  }

  async getGrant(id: string) { return this.grants.get(id) || null; }
  async putGrant(g: StoredGrant) { this.grants.set(g.id, g); }
  async consumeGrant(id: string) {
    const g = this.grants.get(id);
    if (!g || g.uses >= g.max_uses) return false;
    g.uses++;
    return true;
  }

  async getEffect(id: string) { return this.effects.get(id) || null; }
  async putEffect(e: EffectJournalEntry) { this.effects.set(e.id, e); }
  async transitionEffect(id: string, to: EffectJournalEntry["state"], reason?: string, receiptId?: string) {
    const e = this.effects.get(id);
    if (!e) return;
    const from = e.state;
    e.state = to;
    e.updated_at = new Date().toISOString();
    e.transitions.push({ from, to, timestamp: new Date().toISOString(), reason, receipt_id: receiptId });
  }

  async putClaim(c: any) { this.claims.set(c.id, c); }
  async getClaim(id: string) { return this.claims.get(id) || null; }
  async putEvidence(e: any) { this.evidence.set(e.id, e); }
  async putReceiptMeta(r: any) { this.receiptMeta.set(r.id, r); }

  async getActiveSessions() {
    return Array.from(this.sessions.values()).filter((s) => s.state === "ACTIVE");
  }
  async getPendingEffects() {
    return Array.from(this.effects.values()).filter((e) =>
      ["PROPOSED", "AUTHORIZED", "PREPARED", "EXECUTING", "EXECUTED_UNVERIFIED", "UNKNOWN_RECONCILE"].includes(e.state)
    );
  }
}
