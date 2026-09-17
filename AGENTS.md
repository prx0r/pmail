# pmail — Agent Operating Manual

## Constitution

PMail is the anonymous-communications/runtime primitive for privately.win.

Core requirement: "A useful agent service can be accessed, funded, operated and audited without PMail requiring a person's conventional identity."

### Privacy Classes (first-class type)
```
type PrivacyClass = "ANON_CORE" | "PSEUDONYMOUS_BRIDGE" | "IDENTITY_BRIDGED"
```

### Composition Rules
- ANON_CORE + ANON_CORE → ANON_CORE
- ANON_CORE + PSEUDONYMOUS_BRIDGE → PSEUDONYMOUS_BRIDGE
- anything + IDENTITY_BRIDGED → IDENTITY_BRIDGED

### Never Required (ANON_CORE mode)
- name, email, phone, Google login, Stripe customer, card, billing account

### Required for Consequential Actions
- Signed grant from trusted authority
- QP receipt with Actuality = TRUE
- Independent readback from provider

### Hard Rules
1. Do not bypass KYC or automate evasion
2. If provider requires ID → classify IDENTITY_BRIDGED
3. Secrets never enter agent context
4. External bridges are optional, privacy degrades with each
5. No self-promotion — only QP settles truth
