# pmail build 1/5 — constitution, repo bootstrap, th reat model

Content-Transfer-Encoding: quoted-printable
Build a new repo: prx0r/pmail.
DO NOT attach/import the old local ZIP. Create the repo cleanly and
reconstruct from these instructions plus selected code copied from cmail
only where explicitly permitted.
Reference cmail source state:
   - repo: https://github.com/prx0r/cmail
   - branch: master
   - exact source SHA to inspect first:
   dcb4b3b8ae61c7495d88b88ab49350d74afd52cf
   - do not copy older proof/receipt systems wholesale.
PMail thesis
PMail is the anonymous-communications/runtime primitive for privately.win.
The core product requirement is:
“A useful agent service can be accessed, funded, operated and audited
without PMail requiring a person’s conventional identity.”
Core stack:
   - pseudonymous operator key/capability, not account/email/password
   - Tor/.onion first-party interface
   - SimpleX as private messaging ingress/egress
   - XMR as payment/accounting primitive
   - private/isolated agent runtime
   - QP for exact claims + privacy invariants + outcome verification
   - optional telecom/email bridges that are explicitly classified as
   privacy degradations
Do NOT promise impossible universal untraceability. PMail itself must
collect no conventional identity in ANON_CORE mode. External providers may
see metadata. Model that explicitly.
Non-goal / hard rule:
   - do not bypass KYC, forge identity, or automate evasion of provider
   compliance.
   - if a provider requires ID, classify it IDENTITY_BRIDGED and it cannot
   satisfy an ANON_CORE policy.
Create these top-level areas:
pmail/ README.md SECURITY.md THREAT-MODEL.md ARCHITECTURE.md UPSTREAM.md
src/ core/ identity/ privacy/ payments/ messaging/ bridges/ phone/ email/
qp/ mcp/ proofspecs/ fixtures/ tests/ docs/ providers/ operations/
research/ Identity model
Never make email/phone the identity root.
Use three separate concepts:
Person = deliberately absent from ANON_CORE Operator = pseudonymous public
key / capability holder Agent = workload/runtime identity, ideally attested
A PMail operator should be representable by a generated Ed25519 keypair or
random bearer capability. No name/email/phone required.
Privacy classes
Implement this as a first-class type immediately:
type PrivacyClass = | "ANON_CORE" | "PSEUDONYMOUS_BRIDGE" |
"IDENTITY_BRIDGED";
Add:
interface IdentitySurface { provider: string; legal_identity_required:
boolean; account_required: boolean; email_required: boolean;
phone_required: boolean; payment_rails: string[]; data_disclosed: string[];
network_metadata: string[]; retention_claims?: string[]; evidence:
SourceRef[]; }
Derive operation privacy class from all dependencies. Privacy may only stay
equal or degrade as dependencies are introduced.
Invariant:
ANON_CORE + ANON_CORE -> ANON_CORE ANON_CORE + PSEUDONYMOUS_BRIDGE ->
PSEUDONYMOUS_BRIDGE anything + IDENTITY_BRIDGED -> IDENTITY_BRIDGED
A policy may state:
{ "max_privacy_class": "ANON_CORE", "forbid": ["legal_identity",
"card_payment", "google_oauth", "pstn_kyc"] }
Then the resolver MUST refuse a route whose dependency surface violates
that policy. Never silently fall back to Telnyx/Stripe/Google/etc.
Canonical anonymous lifecycle Tor/.onion or SimpleX -> anonymous session ->
fresh XMR invoice/subaddress -> payment observed -> capability minted ->
private agent execution -> QP verified result -> minimal receipt
No required:
   - name
   - email
   - phone
   - Google login
   - Stripe customer
   - card
   - billing account
Threat model
Explicitly model these observers separately:
   1. public recipient / counterparty
   2. PMail application
   3. PMail infrastructure operator
   4. VPS/cloud operator
   5. ISP / local network
   6. bridge provider (telecom/email)
   7. payment observer
   8. GitHub/development identity
ANON_CORE target:
   - PMail does not collect conventional identity.
   - payment path is XMR.
   - service endpoint can be onion-only.
   - operator identity is a key/capability.
   - application logs contain no unnecessary IP/PII.
   - secrets never enter agent context.
   - external bridges are optional.
GitHub is development infrastructure and NOT evidence that deployed PMail
is anonymous. Do not blur developer identity and operator/customer identity.
First README line:
PMail is a Tor-first, XMR-funded communications layer for pseudonymous
agents, with explicit proofs of where privacy holds and where external
bridges weaken it.
Important: build the smallest vertical first. Do not build a giant platform
before the lifecycle works end-to-end.
Part 2 gives exact upstream repos and the clone/adopt rules.

---

# pmail build 2/5 — exact upstream repos: clone/adop t, do not rebuild

Content-Transfer-Encoding: quoted-printable
This part is the build-vs-integrate constitution. Clone these repos OUTSIDE
pmail/ (e.g. ../upstream/) for inspection. Do not vendor entire repos into
PMail unless a specific package/import requires it and the license permits
it.
   1. SimpleX — canonical private messaging substrate
   =================================================
Repo:
https://github.com/simplex-chat/simplex-chat
Use stable branch for build/reference:
git clone https://github.com/simplex-chat/simplex-chat.git
../upstream/simplex-chat cd ../upstream/simplex-chat git checkout stable
Why:
   - private messaging network with no global user identifiers
   - CLI available
   - local profiles
   - one-time / temporary addresses
   - strong fit for PMail ingress/egress
Do NOT recreate encrypted messaging, double-ratchet, queue routing,
contacts, file transfer, etc.
PMail adapter owns only:
   - process supervision / client integration
   - message -> PMail event normalization
   - capability binding
   - privacy metadata
   - QP claims around delivery/receipt when provable
Target interface:
interface PrivateMessenger { createAddress(): Promise<AddressHandle>;
revokeAddress(id: string): Promise<void>; sendMessage(to: string, body:
Uint8Array): Promise<AttemptEvidence>; subscribe(handler: (m:
PrivateMessage) => Promise<void>): Promise<Unsubscribe>; }
   1. MoneroPay / monero-wallet-rpc — XMR payment substrate
   =======================================================
Repos:
https://github.com/moneropay/moneropay
https://github.com/moneropay/go-monero
Clone:
git clone https://github.com/moneropay/moneropay.git ../upstream/moneropay
MoneroPay is GPL-3.0. Prefer sidecar/process integration through its API
rather than copying code into a differently licensed PMail core.
Use native monero-wallet-rpc semantics / MoneroPay for:
   - unique subaddresses/invoices
   - incoming payment observation
   - confirmation tracking
   - partial payment handling
   - outgoing transfers only through bounded authority
DO NOT implement wallet cryptography or transaction parsing from scratch.
   1. Monid — deterministic connector substrate
   ============================================
Repo:
https://github.com/monid-ai/monid
git clone https://github.com/monid-ai/monid.git ../upstream/monid
Current repo provides declarative connector definitions, schema validation,
content-hashed executable functions, sealed endpoint units, credential
injection at transport and fixture replay.
Use Monid-style connector artifacts for external provider calls. PMail/QP
owns semantic truth; Monid owns HOW an endpoint is called.
Do not reproduce another giant provider SDK layer.
   1. Infisical Agent Vault — credential broker
   ============================================
Repo:
https://github.com/Infisical/agent-vault
git clone https://github.com/Infisical/agent-vault.git
../upstream/agent-vault
Core is MIT (enterprise directory has separate terms).
Use for:
   - credentials never returned to the agent
   - outbound credential injection
   - per-agent/service egress policy
   - short-lived vault-scoped sessions
   - strict deny for unknown hosts
PMail should not write its own secret vault.
Important architecture:
agent sandbox and Agent Vault should be separate trust zones/hosts/process
boundaries. Agent must receive dummy placeholders/capabilities, not real
provider keys.
   1. Agent Receipts / Obsigna — generic signed receipt envelope
   =============================================================
Repo:
https://github.com/agent-receipts/obsigna
git clone https://github.com/agent-receipts/obsigna.git ../upstream/obsigna
Use its protocol / SDK / out-of-process signing daemon rather than
reimplementing generic:
   - canonical receipt serialization
   - Ed25519 receipt signatures
   - receipt chain linkage
   - cross-language receipt verification
   - MCP tool-call receipt wrapper
QP extension remains PMail-specific and records:
   - exact claim
   - ContractRoot / ProofSpec identity
   - evidence commitments
   - actuality TRUE/FALSE/UNKNOWN
   - privacy class
   - identity surfaces
   - semantic replay result
Do not maintain a competing generic receipt format.
   1. Grantex — delegated agent authority
   ======================================
Repo:
https://github.com/mishrasanjeev/grantex
git clone https://github.com/mishrasanjeev/grantex.git ../upstream/grantex
Apache-2.0, scoped/time-limited/revocable delegated authorization.
Use its concepts/packages where they genuinely reduce our custom authority
code. Do not blindly adopt the currently published MCP auth service as a
trust root without reviewing known package limitations. QP still binds
authority to exact effect/payload/budget.
   1. dstack — confidential runtime / attestation
   ==============================================
Repo:
https://github.com/Dstack-TEE/dstack
Examples:
https://github.com/Dstack-TEE/dstack-examples
git clone https://github.com/Dstack-TEE/dstack.git ../upstream/dstack git
clone https://github.com/Dstack-TEE/dstack-examples.git
../upstream/dstack-examples
Apache-2.0 for dstack-owned code. Use it later for:
   - TEE-confidential execution
   - attested workload identity
   - per-app key derivation
   - verifiable runtime image / compose hash
Do NOT block MVP on TEE deployment. Design the runtime interface now so a
normal local/dev runtime and dstack runtime implement the same interface.
   1. Trigger.dev — durable workflow mechanics, optional later
   ===========================================================
Repo:
https://github.com/triggerdotdev/trigger.dev
Use only if we need durable waits/retries/reconciliation and do not want to
implement a workflow engine. Do not make it part of ANON_CORE deployment
automatically; self-hosting/privacy surface must be reviewed first.
   1. Stalwart — SMTP/JMAP bridge, later only
   ===========================================
Canonical repo/org should be verified before integration. Stalwart provides
SMTP/IMAP/JMAP and is useful if we later need conventional email
compatibility.
Do not build an SMTP server.
   1. social-mcp — code/reference donor only
   ==========================================
Repo:
https://github.com/IhsanKabir/social-mcp
MIT; useful for official OAuth/API patterns. Not central to PMail MVP.
RULE
Open source owns:
   - messaging crypto/protocol
   - wallet RPC / payment processor
   - generic connectors
   - secret brokering
   - generic signed receipts
   - delegated auth
   - TEE runtime
   - durable workflow engine
   - mail server
PMail owns:
   - privacy-class calculus
   - identity-surface registry
   - anonymous session/payment/capability lifecycle
   - QP ProofSpecs for privacy and communications
   - bridge selection under privacy constraints
   - phone-provider capability verification
   - end-to-end composition
Part 3 maps exactly what to reuse from cmail and what NOT to copy.

---

# pmail build 3/5 — reuse from cmail vs discard

Content-Transfer-Encoding: quoted-printable
Source reference:
   - https://github.com/prx0r/cmail
   - branch: master
   - inspect exact SHA dcb4b3b8ae61c7495d88b88ab49350d74afd52cf
Do not fork cmail wholesale. PMail should be a clean repo with selected
conceptual/code reuse.
REUSE / PORT THESE IDEAS FIRST
   1. integrations/receipts/qp-extension.ts
This is the newest convergence direction: QP-specific semantics inside an
Agent Receipts-compatible envelope.
Port the TYPE SHAPE / extension model, but adapt it for PMail privacy
fields:
interface PmailQPReceiptExtension { claim_id: string; contract_root:
string; actuality: "TRUE" | "FALSE" | "UNKNOWN"; evidence_root: string;
replay: "PASS" | "FAIL"; privacy: { class: PrivacyClass;
identity_surface_root: string; pii_collected_by_pmail: boolean;
payment_rail?: "XMR" | string; network_path?: string[];
external_identity_dependencies: string[]; }; }
Do not copy a second receipt signer. Obsigna/Agent Receipts should sign the
outer receipt.
   1. QP core semantic concepts
Inspect:
   - qp/kernel.ts
   - qp/judges.ts
   - qp/edges.ts
   - qp/identity.ts
   - qp/effects.ts
   - proofspecs/*.json
Port only the unique semantics:
   - Actuality = TRUE | FALSE | UNKNOWN
   - exact falsifiable Claim identity
   - immutable ProofSpec / ContractRoot
   - evidence provenance
   - deterministic judges/gates
   - typed dependency edges
   - effect vs independent readback separation
   - semantic replay
Do NOT blindly copy current runtime implementation as trusted production
code. The prior reviews found incomplete/bypassable pieces. PMail gets a
cleaner implementation around commodity components.
   1. Email round-trip proof pattern
Inspect:
qp/probes/email-roundtrip.ts
Reuse the IDEA:
   - cryptorandom nonce
   - independent sender
   - exact destination
   - exact observed nonce
   - raw evidence hash
   - timeout => UNKNOWN, not FALSE
Generalize it into channel capability proofs:
sms_receives(number) sms_sends(number) voice_receives(number)
voice_sends(number) simplex_receives(address) simplex_sends(address)
email_receives(address)
Never collapse these into phone_owned=true. A number can support inbound
SMS but no outbound SMS/voice.
   1. Provider/phone capability modelling
Inspect:
   - src/phoneIdentity.ts
   - docs/phone-blueprint/*
   - targets/phone.json
Reuse:
   - provider comparison mindset
   - capability matrix
   - cost/renewal/lifecycle fields
   - empirical test receipts
Replace old assumption that Telnyx is canonical. PMail’s phone provider is
selected by policy/capability/privacy class.
   1. Existing adversarial-test philosophy
Inspect:
qp/adversarial.test.ts
Build better PMail red/green tests around actual anonymous invariants.
DO NOT PORT THESE AS CANONICAL TRUTH
   1.
   src/capacity.ts
   Old boolean/CapacityProof model is legacy. Do not create another
   pass:boolean truth store.
   2.
   mcp/interface.ts legacy receipt types
   Do not recreate acom/0.1 or duplicate receipt protocols.
   3.
   mcp/domain.ts simulation paths
   Do not port any simulation that can promote itself to canonical truth.
   4.
   Direct Cloudflare/Telnyx/Google mutators
   PMail is not supposed to inherit cmail’s conventional identity
   assumptions. Any external bridge goes through policy + authority + adapter
   + independent verification.
   5.
   Cloudflare as an anonymous-core requirement
   Cloudflare/domain/email can be optional compatibility bridges. Onion
   service must be sufficient for ANON_CORE.
   6.
   Old custom grant crypto where Grantex/standard libraries can replace it
   Do not proliferate bespoke canonicalization/signing code.
PMail QP CLAIMS
Start with these exact claim families:
Core privacy:
pmail_identity_not_collected(session_id) xmr_payment_received(invoice_id,
amount_atomic) capability_minted(capability_hash, invoice_id)
onion_service_reachable(service_id)
simplex_address_active(address_commitment)
Messaging:
simplex_message_observed(message_commitment, endpoint)
sms_inbound_observed(number_commitment, nonce)
sms_outbound_observed(number_commitment, destination_commitment, nonce)
voice_inbound_capable(number_commitment)
voice_outbound_capable(number_commitment)
email_inbound_observed(address_commitment, nonce)
Privacy/dependency:
provider_identity_surface(provider_id, policy_hash)
operation_privacy_class(operation_id, class)
no_forbidden_identity_bridge(operation_id, policy_hash)
runtime_attested(workload_hash) // later TEE mode
Important semantic rule:
   - provider says success = attempt evidence
   - independent readback/observation = candidate actuality
   - missing/readback failure = UNKNOWN
   - a marketing claim like “no KYC” is NOT proof that a given order path
   collected no identity; record actual required fields and our own
   transaction path evidence.
STATE MODEL
Avoid account-centric tables.
Primary state should be:
   - operator key/capability
   - anonymous session
   - invoice/subaddress
   - credit/capability grant
   - provider bridge instance
   - evidence blobs
   - QP claims/receipts
Never make email/phone/name a required foreign key.
Suggested core interfaces:
interface PaymentRail { createInvoice(amountAtomic: bigint):
Promise<Invoice>; observeInvoice(id: string): Promise<PaymentObservation>;
} interface BridgeProvider<TCapability> { identitySurface():
Promise<IdentitySurface>; quote(req: BridgeRequest): Promise<BridgeQuote>;
provision(req: BridgeRequest, authority: AuthorityRef):
Promise<AttemptEvidence>; readback(resource: ResourceRef):
Promise<ObservationEvidence>; capabilities(resource: ResourceRef):
Promise<TCapability>; } interface PrivacyResolver { evaluate(dependencies:
IdentitySurface[], policy: PrivacyPolicy): PrivacyDecision; }
Part 4 is the phone/XMR implementation plan and provider acceptance matrix.

---

# pmail build 4/5 — XMR lifecycle + phone bridge imp lementation

Content-Transfer-Encoding: quoted-printable
This is the hard real-world vertical. Build it as a provider capability
system, not phone_owned=true.
A. XMR PAYMENT / ACCOUNTLESS ACCESS
Use MoneroPay / monero-wallet-rpc. Do not implement Monero cryptography.
Desired lifecycle:
POST /session/new -> random session id + operator capability -> create
fresh XMR invoice/subaddress payment observer -> detects
amount/confirmations -> QP resolves xmr_payment_received(...) -> mint
bounded service capability -> capability is the "account"
Never require an email/password to recover a normal account. Recovery can
be an optional operator key / recovery capability.
Payment implementation rules:
   1. Fresh subaddress/invoice per session/order.
   2. Store amounts in atomic units; never float.
   3. Define confirmation policy explicitly by operation/risk.
   4. Separate receive wallet from spending wallet where practical.
   5. Agent never receives wallet seed/private spend key.
   6. Outgoing XMR requires exact bounded authority: destination, max
   amount, purpose, expiry, nonce.
   7. Preserve payment evidence privately; public receipt should normally
   expose commitments/hashes, not unnecessary transaction metadata.
   8. Idempotency: an invoice can mint its entitlement exactly once.
   9. Partial/overpayment semantics must be explicit.
   10. Reorg/ambiguous state => UNKNOWN/reconciliation, not silent success.
Model:
type InvoiceState = | "PENDING" | "PARTIAL" | "DETECTED" | "CONFIRMED" |
"EXPIRED" | "RECONCILIATION_REQUIRED"; B. PHONE IS AN OPTIONAL BRIDGE
Never identify an operator by phone number. A phone number is a leased
external capability.
Model each resource as:
interface PhoneCapabilities { sms_in: boolean | "UNKNOWN"; sms_out: boolean
| "UNKNOWN"; voice_in: boolean | "UNKNOWN"; voice_out: boolean | "UNKNOWN";
data: boolean | "UNKNOWN"; renewable: boolean | "UNKNOWN"; expires_at?:
string; number_type?: "mobile" | "voip" | "unknown"; } C. PROVIDER 1 —
PIKASIM (EXPERIMENTAL FIRST FULL BRIDGE)
Current docs:
   - https://pikasim.com/mcp-docs
   - https://pikasim.com/for-ai-assistants
   - https://pikasim.com/api-docs-for-ai
   - MCP browse endpoint: https://pikasim.com/mcp
   - authenticated wallet endpoint: https://pikasim.com/mcp/wallet
Why test first:
   - current docs claim real carrier phone-number eSIMs with voice + SMS +
   data
   - public MCP browsing needs no auth
   - agent wallet can be created without account/email/KYC according to
   current docs
   - prepaid wallet can be crypto funded, including Monero according to
   current docs
   - purchasing is exposed directly as MCP
DO NOT assume the marketing claim is proven. Treat provider as EXPERIMENTAL
until live acceptance tests pass.
Build PikaSimProvider against their MCP protocol rather than screen
scraping.
Required workflow:
   1. keyless tools/list
   2. create_wallet in test flow if acceptable under provider TOS
   3. generate crypto deposit invoice
   4. fund manually during first live test (do not spend autonomously until
   reviewed)
   5. search exact phone-number plan
   6. capture quote + advertised capabilities + country + expiry
   7. exact QP authorization for purchase
   8. purchase
   9. record returned resource identifiers privately
   10. independently test actual SMS/voice capabilities
   11. only then promote claims to TRUE
Acceptance tests:
   - no name requested
   - no email requested
   - no legal ID requested
   - no card required for selected flow
   - XMR funding path works
   - resource persists across API sessions
   - inbound SMS from independent sender arrives
   - outbound SMS to independent receiver arrives
   - inbound voice rings/terminates where advertised
   - outbound voice reaches independent receiver where advertised
   - renewal/top-up path works
   - provider API/MCP can read resource state
   - cancellation/refund semantics recorded
If any identity/KYC requirement appears in the selected jurisdiction/plan,
classify that route IDENTITY_BRIDGED; do not automate evasion.
D. PROVIDER 2 — SILENT LINK (STRONGER ESTABLISHED PRIVACY, LIMITED PHONE)
Current docs:
   - https://silent.link/
   - https://silent.link/bulk
Current US.PLUS advertises:
   - US +1 number
   - data + inbound SMS
   - no legacy voice
   - outbound SMS disabled
   - one-year number lease, renewable
   - zero-KYC/no email according to provider
   - Monero payment shown
Public bulk API is documented on /bulk page:
   - GET /api/v1/bulk/stock
   - POST /api/v1/order/new
   - GET /api/v1/order/{token}/json
   - public OpenAPI/Swagger referenced there
Build SilentLinkProvider only around documented API.
Expected capability truth after empirical validation:
sms_in TRUE sms_out FALSE voice_in FALSE/limited-not-general voice_out
FALSE data TRUE
Do not call it a “full phone”.
E. MONEROSMS — PROGRAMMABLE SMS CANDIDATE
Research current API/TOS independently before implementation. Prior
research identified it as an XMR/no-personal-info SMS candidate, but do not
trust stale notes. Add provider only after current docs are saved under
docs/providers/monerosms.md with dated source URLs and exact
capability/identity surface.
F. JMP.CHAT — FULL PSTN BENCHMARK, NOT ANON-CORE BY ASSUMPTION
Use as a functional benchmark for two-way SMS/voice and XMPP integration.
Do not label anonymous/XMR-native unless current evidence proves the exact
funding and onboarding path.
G. TEST HARNESS
Create:
tests/live/phone/ pikasim.acceptance.ts silentlink.acceptance.ts
provider-contract.ts
Every live test outputs immutable evidence fixture with:
   - provider
   - observed date
   - product/plan id
   - country
   - fields requested during onboarding
   - payment rails actually used
   - resource type
   - capability tested
   - independent sender/receiver
   - timestamps
   - result TRUE/FALSE/UNKNOWN
   - raw-response commitment
   - privacy classification
Never commit live phone numbers, wallet codes, API keys, QR activation
codes, IMSI/ICCID, or raw sensitive provider payloads.
H. BRIDGE SELECTION
Resolver should do:
selectBridge({ require: ["sms_in", "sms_out"], maxPrivacyClass:
"PSEUDONYMOUS_BRIDGE", paymentRail: "XMR", country: "US" })
and return a ranked SET OF ELIGIBLE routes based on hard constraints. Do
not silently choose a more identity-invasive fallback.
Part 5 gives the build order, API/MCP surface, tests and definition of done.

---

# pmail build 5/5 — exact implementation order, MCP  surface, acceptance gates

Content-Transfer-Encoding: quoted-printable
Execute in this order. Do not jump ahead to UI/branding/extra providers
until each gate passes.
   1. REPO BOOTSTRAP
   =================
If prx0r/pmail does not exist and gh is authenticated with repo-create
permission:
gh repo create prx0r/pmail --public --description "Tor-first, XMR-funded
communications for pseudonymous agents" git clone
https://github.com/prx0r/pmail.git cd pmail
If repo creation is unavailable, create local git repo and stop before
remote push; do not substitute another repo name.
Use a clean main branch. Add AGENTS.md stating the constitution from emails
1-4.
   1. PHASE A — PRIVACY TYPES + POLICY ENGINE
   ==========================================
Implement before network code:
   - PrivacyClass
   - IdentitySurface
   - PrivacyPolicy
   - deterministic privacy-class composition
   - forbidden-dependency checks
   - source/evidence references
Tests:
   - ANON_CORE + ANON_CORE remains ANON_CORE
   - introducing pseudonymous external bridge degrades exactly once
   - introducing legal-ID dependency becomes IDENTITY_BRIDGED
   - strict ANON_CORE policy rejects identity bridge
   - no route can improve its privacy classification by adding dependencies
   1. PHASE B — ACCOUNTLESS SESSION + CAPABILITY
   =============================================
Implement:
createSession(): { session_id, operator_public_key?, recovery_capability?,
state: "UNFUNDED" }
Do not require a username/password/email/phone.
Use cryptographically random opaque capabilities. Persist only hashes where
bearer secret recovery is unnecessary.
Add lifecycle:
UNFUNDED -> FUNDED -> ACTIVE -> EXHAUSTED/REVOKED
   1. PHASE C — XMR PAYMENT VERTICAL
   ================================
Integrate MoneroPay / wallet RPC as sidecar.
MVP proof:
   1. create anonymous session
   2. issue unique XMR invoice
   3. pay test invoice
   4. observe confirmation
   5. atomically mint capability credits exactly once
   6. QP proves xmr_payment_received
   7. Obsigna-compatible receipt includes QP extension
Critical tests:
   - duplicate callback cannot double-credit
   - partial payment does not become paid
   - wrong invoice cannot fund another session
   - overpayment deterministic handling
   - expiry deterministic
   - wallet/service restart does not lose entitlement state
   - no private spend key enters app logs or agent context
   1. PHASE D — SIMPLEX VERTICAL
   ============================
Run SimpleX CLI/service locally, ideally behind Tor.
Implement SimplexAdapter:
   - create/revoke PMail-facing contact address
   - inbound message event
   - outbound message
   - normalized message commitment
MVP proof:
   - fresh PMail session gets a SimpleX contact endpoint
   - independent SimpleX client connects
   - send random nonce inbound
   - PMail sees exact nonce
   - reply with separate nonce
   - independent client sees exact reply
   - QP claims both directions using immutable evidence commitments
The product is already meaningful when phases A-D work:
no account -> XMR -> capability -> private messaging -> verified receipt.
   1. PHASE E — TOR SERVICE
   =======================
Expose service control/API through an onion service. Onion service is
canonical ANON_CORE network endpoint. Clearnet/custom domain is optional
later.
Requirements:
   - do not require clearnet domain for operation
   - do not log source IP by default
   - explicit structured log allowlist
   - no secrets in URLs
   - CSP/security headers if browser UI exists
   - Tor/onion reachability ProofSpec
   1. PHASE F — PHONE PROVIDER CONTRACT
   ===================================
Implement generic provider contract before any provider-specific
assumptions.
interface PhoneBridgeProvider { describeIdentitySurface():
Promise<IdentitySurface>; listProducts(query: PhoneQuery):
Promise<PhoneProduct[]>; quote(product: PhoneProduct): Promise<Quote>;
provision(input: ProvisionInput, authority: AuthorityRef):
Promise<AttemptEvidence>; readback(ref: ProviderResourceRef):
Promise<ObservationEvidence>; capabilities(ref: ProviderResourceRef):
Promise<PhoneCapabilities>; renew?(ref: ProviderResourceRef, authority:
AuthorityRef): Promise<AttemptEvidence>; cancel?(ref: ProviderResourceRef,
authority: AuthorityRef): Promise<AttemptEvidence>; }
No provider can directly mint QP truth.
   1. PHASE G — PIKASIM EXPERIMENTAL ADAPTER
   =========================================
Use their current MCP endpoint, not browser automation.
Implement browse/search first. Capture schemas/fixtures. Then gated
purchase path.
Do not enable autonomous purchase by default. First live purchase requires
explicit human bounded authorization and a small budget.
After provision, independently test every advertised capability. Provider
response alone is not enough.
If full voice+SMS+data with crypto funding and no conventional identity
actually survives empirical testing, promote the adapter from EXPERIMENTAL
to VALIDATED with dated evidence.
   1. PHASE H — SILENT LINK ADAPTER
   ================================
Use documented public API.
Model limited truth accurately:
   - inbound SMS capability
   - data capability
   - renewal/lease
   - no generic outbound SMS or voice claims
This provider is useful specifically because it demonstrates that PMail can
compose partial bridge capabilities rather than pretending every number is
equivalent.
   1. PHASE I — QP PRIVACY PROOFS
   ==============================
Create frozen ProofSpecs for at least:
xmr_payment_received.v1 capability_minted.v1 simplex_receives.v1
simplex_sends.v1 onion_service_reachable.v1 provider_identity_surface.v1
operation_privacy_class.v1 sms_receives.v1 sms_sends.v1 voice_receives.v1
voice_sends.v1 runtime_attested.v1 // can remain inactive until TEE phase
Semantics:
   - TRUE only on exact evidence
   - FALSE only on decisive contradiction
   - timeout/provider unavailable/parse error => UNKNOWN
   - marketing docs are metadata, not operational proof
   - provider execution response != external outcome
   1. PHASE J — RECEIPTS
   ======================
Adopt Agent Receipts/Obsigna envelope.
Outer receipt handles:
   - signing
   - canonicalization
   - chain
   - generic action/outcome metadata
QP extension handles:
   - Claim
   - ContractRoot
   - Actuality
   - evidence root
   - semantic replay
   - privacy class
   - identity surface root
   - external identity dependencies
Do not expose raw PII/provider secrets/phone number unless explicitly
required. Use commitments where possible.
   1. PHASE K — SECRETS
   =====================
Integrate Agent Vault before adding providers that need long-lived
credentials.
Hard requirement:
   - agent cannot read actual provider credentials
   - service allowlist/egress policy
   - strict unmatched-host deny in production
   - short-lived agent-vault session token
   - management plane separate from agent sandbox
   1. PHASE L — TEE / DSTACK
   ==========================
Once local MVP works, provide a RuntimeAttestor interface and dstack
implementation.
Attestation must bind:
   - workload/image/compose identity
   - QP verifier version/bundle
   - privacy-policy bundle
   - optional receipt signer workload identity
Do not make running in TEE equivalent to anonymous. It proves execution
isolation/identity, not network anonymity.
   1. MCP/API SURFACE
   ===================
Keep tool surface small:
Read-only:
pmail.status pmail.privacy.explain pmail.bridges.list pmail.phone.search
pmail.receipt.get pmail.receipt.verify
State-changing:
pmail.session.create pmail.xmr.invoice pmail.simplex.address.create
pmail.simplex.send pmail.phone.provision pmail.phone.renew
pmail.phone.sms.send
All state-changing provider/money actions must pass exact authority +
privacy policy + effect gateway.
Do not expose generic http.fetch_with_secret or generic wallet send to
agents.
   1. STORAGE / LOGGING
   =====================
Separate:
   - public receipt data
   - private evidence
   - secrets
   - ephemeral transport metadata
Default data minimization:
   - no raw IP storage unless operationally required
   - no full phone numbers in public receipts
   - no wallet seeds
   - no API tokens
   - no SimpleX local database in git
   - no raw telecom payload committed
Add pre-commit secret scan and fixture sanitizer.
   1. FAILURE / RECONCILIATION
   ============================
For every consequential external action:
AUTHORIZE -> RESERVE -> ACT -> READBACK -> SETTLE
If ACT may have happened and readback fails:
   - do NOT retry blindly
   - mark RECONCILIATION_REQUIRED
   - preserve attempt evidence
   - retry readback first
This matters especially for XMR sends and paid phone provisioning.
   1. LIVE PHONE ACCEPTANCE GATE
   ==============================
A provider is VALIDATED only if live evidence proves:
   - actual onboarding fields
   - actual payment rail used
   - actual number/resource type
   - actual inbound/outbound directions
   - actual voice behavior
   - actual expiry/renewal state
   - actual API/readback behavior
Never infer capabilities from product name.
   1. SECURITY/PRIVACY RED-TEAM TESTS
   ===================================
Must include:
   - request asks ANON_CORE but resolver attempts IDENTITY_BRIDGED provider
   => reject
   - raw provider credential leaks into agent output => test fail
   - receipt includes email/name/phone unexpectedly => test fail
   - reused XMR callback => no double credit
   - reused grant => no second effect
   - wrong session invoice => no entitlement
   - bridge readback unavailable => UNKNOWN
   - spoofed provider success => cannot create TRUE
   - provider claims no-KYC but live form requests ID => route
   reclassified/rejected
   - phone advertises SMS but independent nonce not observed => claim not
   TRUE
   - action response timeout after possible spend => reconciliation, not
   blind retry
   1. DOCUMENTATION REQUIRED BEFORE MVP COMPLETE
   ==============================================
Create:
   - THREAT-MODEL.md
   - PRIVACY-CLASSES.md
   - docs/providers/pikasim.md
   - docs/providers/silentlink.md
   - docs/xmr.md
   - docs/simplex.md
   - docs/receipts.md
   - docs/live-test-procedure.md
   - UPSTREAM.md with exact repos/licenses/commit pins used
Document claims carefully:
GOOD: “PMail does not require legal identity in ANON_CORE mode.”
BAD: “PMail is untraceable.”
GOOD: “This provider route requested no conventional identity in our dated
test.”
BAD: “This provider can never identify anyone.”
   1. DEFINITION OF DONE — MVP
   ============================
Do not call MVP complete until this exact demo passes:
[ ] fresh user reaches onion endpoint / SimpleX ingress [ ] no
signup/name/email/phone required [ ] fresh XMR invoice/subaddress created [
] XMR payment observed and confirmed [ ] entitlement/capabil