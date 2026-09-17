# UPSTREAM.md — Adopted Repositories and Provider Acceptance

## Adopted Repos (Clone to ../upstream/)

| Repo | License | Purpose | Status |
|------|---------|---------|--------|
| simplex-chat | Apache-2.0 | Private messaging substrate | Cloned |
| moneropay | GPL-3.0 | XMR payment processing | Cloned |
| monid | MIT | Connector substrate | Cloned |
| obsigna | Apache-2.0 | Signed receipt envelope | Cloned |
| grantex | Apache-2.0 | Delegated agent authority | Cloned |
| dstack | Apache-2.0 | TEE runtime (later) | Not cloned yet |

## Provider Acceptance Matrix

### Phone Providers

| Provider | Status | sms_in | sms_out | voice_in | voice_out | XMR | KYC | Privacy Class |
|----------|--------|--------|---------|----------|-----------|-----|-----|---------------|
| PikaSim | EXPERIMENTAL | ? | ? | ? | ? | ✅ claimed | ❓ | TBD by live test |
| SilentLink | EXPERIMENTAL | ✅ | ❌ | ❌ | ❌ | ✅ claimed | ❌ | PSEUDONYMOUS_BRIDGE |
| MoneroSMS | RESEARCH | ? | ? | ? | ? | ✅ claimed | ❓ | TBD |
| JMP.chat | BENCHMARK | ✅ | ✅ | ✅ | ✅ | ❓ | ❓ | IDENTITY_BRIDGED |

### Acceptance Criteria

A provider is VALIDATED only when live evidence proves:
- ✅ Actual onboarding fields (what they request)
- ✅ Actual payment rail used
- ✅ Actual number/resource type
- ✅ Actual inbound/outbound directions
- ✅ Actual voice behavior
- ✅ Actual expiry/renewal state
- ✅ Actual API/readback behavior
- ❌ Never infer capabilities from product name

### Privacy Classification Rules

```
ANON_CORE: No name, email, phone, legal ID required
PSEUDONYMOUS_BRIDGE: Account required but no legal identity
IDENTITY_BRIDGED: Legal identity/ID/KYC required
```

Composition: privacy degrades, never improves.
```
ANON_CORE + ANON_CORE → ANON_CORE
ANON_CORE + PSEUDONYMOUS_BRIDGE → PSEUDONYMOUS_BRIDGE
anything + IDENTITY_BRIDGED → IDENTITY_BRIDGED
```

### Bridge Selection

```typescript
selectBridge(providers, {
  capabilities: ["sms_in", "sms_out"],
  maxPrivacyClass: "PSEUDONYMOUS_BRIDGE",
  paymentRail: "XMR",
  country: "US"
})
```

Returns providers ranked by privacy class (most private first).
Never silently selects a more identity-invasive fallback.
