SUBJECT: =?UTF-8?Q?Privately_Scanner_=E2=80=94_2026=2D09=2D18_01=3A52_Asia=2FPhnom=5FPe?=
	=?UTF-8?Q?nh_=E2=80=94_20_new=2F0_changed?=
PRIVATELY SCANNER — EDGE REPORT

1 RUN STATE / COVERAGE
Recovered cumulative state from Gmail Sent before discovery. Latest
persisted run: 2026-09-18 00:52 — 22 new/0 changed. Prior objects were
treated as exclusion set. This pass traversed GitHub-first agent
runtimes, dynamic MCP, self-evolution/routing, agent-security/memory,
autonomous-media, robotics/control, plus recent arXiv. Recency
searched through 30d and widened toward 90d where useful. Search
results were semantically deduped against the recovered registry.

2 NEW OBJECT DASHBOARD — 20 NEW CANONICAL OBJECTS

AGENT / CONTROL
1. mcpagent — https://github.com/manishiitg/mcpagent — Go production
agent runtime combining MCP, code execution, frontier/open/CLI-native
providers, parallel tools and structured output. Closest seed:
Goose/Pi. DECISION: SANDBOX.
2. SwarmClaw — https://github.com/swarmclawai/swarmclaw — self-hosted
swarm runtime with memory, delegation, schedules, MCP registry browser
and local gateway. Closest: Goose + Monid. SANDBOX.
3. Aiden — https://github.com/taracodlabs/aiden — durable computer
agent with job cards, evidence-required subagents, trust dial,
approval-gated MCP, browser guardrails, budgets and artifact
provenance. Closest: Pi/Privately. ADOPT/SANDBOX.
4. KlaatCode — https://github.com/KlaatAI/klaatcode — terminal coding
agent with smart model routing, MCP OAuth, checkpoints and before_tool
hooks capable of blocking execution. Closest: Pi + QP. SANDBOX.
5. Mnemosyne — https://github.com/mnemosyne-oss/mnemosyne — zero-cloud
SQLite universal memory layer across Hermes, Pi, OpenClaw, Codex,
Cursor and MCP. Closest: ProjectMemory/privacy. SANDBOX.
6. dynamic-mcp — https://github.com/mcpland/dynamic-mcp — runtime
create/update/delete/enable tools with Docker/Node isolation,
lifecycle control and optimistic concurrency. Closest: Monid. BUILD
PROBE.

JEV / DECISION / SELF-EVOLUTION
7. vLLM Semantic Router / Themis —
https://github.com/vllm-project/semantic-router — programmable
Mixture-of-Models router where request signals/projections feed
explicit decisions/algorithms; privacy/safety/location can be
executable routing dimensions. Closest: JEV. SANDBOX.
8. Reliable Self-Evolving Agents map —
https://github.com/wkqdzkd/Awesome-Reliable-Self-Evolving-Agents —
Sep-11 survey/repo providing a fresh graph of reliable self-evolution
mechanisms and papers. Closest: Dream-RSI. WATCH + mine graph.
9. LLaVA-VLA — https://github.com/OpenHelix-Team/LLaVA-VLA —
minimalist vision-language-action architecture with a 0.5B variant and
explicit action expert; useful bounded-action/control-head reference.
Closest: JEV embodied-control branch. WATCH/SANDBOX.

ATTACKER FRONTIER
10. PMPA — https://arxiv.org/abs/2609.13889 — Sep-12 persistent-memory
poisoning against harness agents; external benign-looking sources
become cross-session malicious state. Evaluated on OpenClaw and Claude
Code; reported cross-session ASR is substantial. Closest:
ProjectMemory. BUILD BENIGN PROBE.
11. Utility Under Attack — https://arxiv.org/abs/2608.21230 — shows
only 1.2% poisoned LongMemEval content can collapse accuracy and that
content screening/provenance weighting has structural limits; proposes
bounded retrieval occupancy. Closest: ProjectMemory. BUILD PROBE.
12. Authorization Architectures for Tool-Using AI Agents —
https://arxiv.org/abs/2609.15906 — Sep-14 review identifies principal
hierarchy, multi-hop delegation, runtime PEPs and aggregation bounds
as unresolved. Closest: Privately/QP. CONTENT + architecture input.
13. MCP-ITP — https://arxiv.org/abs/2601.07395 — automated adaptive
implicit tool poisoning where malicious metadata causes invocation of
a legitimate high-privilege tool without invoking the poisoned tool
itself. Closest: MCParasite. LAB ONLY / BENIGN REPRO.

DEFENDER FRONTIER
14. Vault MCP Firewall — https://github.com/vaultmcp/vault — inline
tool-response firewall with deterministic decoder, heuristics,
embedding and LLM layers. Closest: Privately tool-output containment.
SANDBOX.
15. mcpm runtime guard — https://github.com/getmcpm/cli — install-time
plus live MCP guard; pins tool definitions against rug-pulls and scans
live traffic for injection/exfiltration. Closest: Privately gateway.
SANDBOX.
16. MemSentry — https://arxiv.org/abs/2609.08747 — deterministic
Accept/Review/Quarantine memory-write framework using source trust,
semantic risk, dependency-DAG attack radius, access risk and signed
security-state delta. Closest: QP + ProjectMemory. BUILD PROBE.
17. ClawGuard — https://github.com/Claw-Guard/ClawGuard — task-derived
user-confirmed rules enforced at every tool-call boundary across
web/local, MCP and skill injection channels. Closest: QP. BAKEOFF.

AUTONOMOUS MEDIA
18. Code2MP4 — https://github.com/code2mp4/code2mp4 — agent-native
brief→script→storyboard→editable source→review→deterministic MP4
workflow for coding agents. Closest: OpenX Flow. SANDBOX.
19. html-video — https://github.com/nexu-io/html-video — local
HTML/CSS/data→MP4 for coding agents with templates and optional
soundtrack; no per-render fees. Closest: OpenMontage/OpenX.
ADOPT/SANDBOX.
20. video-shotcraft —
https://github.com/Vincentwei1021/video-shotcraft — Claude/Codex
motion-design skill with 150+ shot recipes, hundreds of motion
previews, Remotion, real page captures and sound design; related
talkcraft locks motion to narration. Closest: Higgsfield skills.
SANDBOX.

ADDITIONAL HIGH-RANKED MEDIA NEIGHBOURS FOR NEXT REGISTRY PASS
- llm-video-maker — https://github.com/GoldLegendW80/llm-video-maker —
one prompt→script/design/voice/captions/music/MP4, installable agent
skills, editable intermediate state.
- script-to-video-production-agent —
https://github.com/jackterror/script-to-video-production-agent —
narration-locked scenes, reviewable visual direction, provider queues,
resumable state, approval-aware paid generation.
- Pilipili AutoVideo — https://github.com/XucroYuri/AutoVideo — local
one-sentence→script→keyframes→TTS→video→FFmpeg→subtitles plus CapCut
draft.
- Agentino script-to-video —
https://github.com/agentino-os/agentino-pipeline-script-to-video —
composable storyboard/image/TTS/slideshow/caption skill chain.
- HeyGen Skills — https://github.com/heygen-com/skills —
agent-installable avatar/video production skills using HeyGen's v3
Video Agent pipeline.

3 TOP 5 DEEP DIVES

A. dynamic-mcp — The important capability delta is mutable tool
topology. An agent/operator can create or alter tools while the
session is alive. Privately cannot authorize merely against tool
name/schema at task start. It needs capability fingerprints plus a
Δcapability event whenever definitions or implementation versions
change. 6m inference: dynamic registries become normal. 18m: agents
synthesize composite tools routinely. 36m: capability graph changes
continuously. Experiment: approve a harmless tool, mutate its
reachable effect in isolated Docker, verify QP invalidates the prior
grant before invocation. Falsifier: tool lifecycle can be fully
constrained upstream without runtime authority recomputation.

B. Aiden — Particularly close to a practical Privately control plane:
evidence-required subagents, trust levels, spend approvals,
approval-gated MCP, redacted/untrusted outputs, budgets, browser
guardrails, artifacts/provenance and durable recovery already coexist.
Rather than copy the full runtime, extract its control-surface
patterns. Experiment: compare Aiden's approval/tool policy to QP
grants over identical benign browser+MCP tasks. Falsifier: its
controls are mostly UX rather than enforceable boundaries.

C. MemSentry — Most interesting memory defence because it does not
reduce memory admission to prompt-injection classification. The signed
security-state delta and dependency-DAG attack radius resemble
QP-style consequence reasoning. Experiment: translate 50 memory writes
into QP propositions and compare Accept/Review/Quarantine
disagreements. Falsifier: semantic classifier dominates results and
structural features add little.

D. PMPA — Demonstrates that harness memory is a delayed execution
channel. The relevant boundary is untrusted observation→persistent
state, not merely observation→immediate tool call. Privately should
assign provenance and authority to memory writes and reevaluate at
retrieval. Experiment only with synthetic documents and isolated
throwaway agents; measure cross-session influence and whether
write-time QP catches it. Falsifier: modern harnesses default to
non-persistent or confirmation-gated memory writes.

E. Code2MP4/html-video/video-shotcraft cluster — Agent media is
converging on code-like deterministic editable intermediate
representations rather than opaque one-shot generation. This is
excellent for Privately content because the agent can critique/edit
exact scenes cheaply without regenerating expensive video. Experiment:
one scanner finding→60s explainer across Code2MP4, html-video and
video-shotcraft; compare total cost, human edits, render time and
retention-oriented editability.

4 AGENT FRAMEWORK / MONID-LIKE FRONTIER
Rank: dynamic-mcp > Aiden > mcpagent > SwarmClaw > KlaatCode >
Mnemosyne. Strongest mechanism change is live capability mutation;
strongest practical control-plane reference is Aiden.

5 JEV / DECISION / SELF-IMPROVEMENT
Rank: vLLM Semantic Router/Themis > LLaVA-VLA action expert > Reliable
Self-Evolving Agents graph. Themis is the closest new operational JEV
neighbour because signals become explicit inspectable decisions and
algorithm selection rather than free-form generative routing.

6 ATTACKER FRONTIER
Rank: PMPA > Utility Under Attack > MCP-ITP > Authorization-bypass
implications from the new authorization review. Canonical
attack-logbook deltas: persistent
external-source→memory→future-action; factual memory poisoning that
evades content screening; implicit poisoned-tool metadata→legitimate
privileged tool; multi-hop delegation/aggregation authorization
bypass.

7 DEFENDER FRONTIER
Rank: MemSentry > ClawGuard > mcpm > Vault. Key split: memory-write
structural reasoning vs deterministic tool-call boundary enforcement
vs MCP traffic mediation vs tool-output classification.

8 AUTONOMOUS VIDEO / MEDIA
Top current unseen/adjacent set: Code2MP4, html-video,
video-shotcraft, llm-video-maker, script-to-video-production-agent,
Pilipili AutoVideo, Agentino pipeline, HeyGen skills. The useful
direction is deterministic editable scene source + agent skill +
cheap/local render, using generative video only where it materially
improves a shot.

9 COMMERCIAL SHOCK DERIVATIVES
No commercial announcement outranked the OSS derivatives in this pass.
The more actionable trend is vendors publishing installable agent
skills (HeyGen) and coding agents becoming media orchestration hosts.

10 WEIRD ALPHA
- LLaVA-VLA: action expert / compact embodied control as JEV neighbour.
- claude-blender — https://github.com/minihellboy/claude-blender — MCP
v2 Blender control with visual self-critique, checkpoints, local
text/image-to-3D and animation rendering. Potential autonomous
diagram/3D explainer primitive.
- AIPOCH Open-Science — https://github.com/aipoch/open-science —
local-first scientific agent workbench with immutable provenance,
notebooks, specialist delegation, review gates and portable research
packages; interesting substrate for Privately's experimental lab.

11 ATTACK LOGBOOK DELTAS
ATK-PMPA: external benign source→agent observation→persistent memory
write→cross-session retrieval→malicious action/privacy leakage. Status
RECENT.
ATK-FACTMEM: false assertion→memory admission→future retrieval/utility
collapse; content-only screen fails. Status RECENT.
ATK-ITP: poisoned MCP metadata→context influence→legitimate
high-authority tool invocation; poisoned tool need never execute.
Status RECENT/LAB.

12 PRIVATELY LAB — TOP EXPERIMENTS
EXP-01 Dynamic Capability Delta: mutate a sandboxed dynamic-mcp tool
after grant; success = QP detects Δreachable authority and invalidates
before call.
EXP-02 Memory Admission Bakeoff: MemSentry vs QP vs simple injection
classifier on synthetic benign/adversarial writes; metric =
security-state harmful-write recall at fixed benign review rate.
EXP-03 Cross-Session PMPA: synthetic poisoned document into throwaway
harness memory; success = measure write/retrieval/action chain and
intercept at earliest deterministic boundary.
EXP-04 Media Bakeoff: same 60s Privately finding through
Code2MP4/html-video/video-shotcraft; metric = $/finished minute,
render latency, human corrections, editable-scene fraction.
EXP-05 Authorization Aggregation: three individually permitted
low-risk tools whose composition enables a higher-risk effect; success
= graph detects emergent authority before composition executes.

13 BUILD / PROBE OPPORTUNITIES
Highest value: capability-delta monitor; memory-write
security-state-delta probe; composition/aggregation authority graph;
signed external-mediator receipts; deterministic tool-output taint
boundary.

14 CONTENT OPPORTUNITIES
Best technical video: “Your AI Agent Changed Its Own Tools After You
Approved It.” Best attack page: persistent memory poisoning as delayed
execution. Best OSS benchmark: QP vs MemSentry/ClawGuard/mcpm on one
normalized benign harness. Best visual: capability graph before/after
dynamic tool installation.

15 TOP 5 THINGS TO TRY NOW
1 dynamic-mcp capability mutation lab.
2 MemSentry structural memory-admission comparison.
3 Code2MP4/html-video/video-shotcraft media bakeoff.
4 Aiden control-plane teardown.
5 vLLM Semantic Router decision-policy experiment.

16 WATCHLIST
PMPA code/reproductions; MemSentry implementation; dynamic-mcp
adoption/integrations; vLLM Semantic Router decision plugins;
Code2MP4/video-shotcraft velocity.

17 SOURCE-YIELD / GRAPH LEDGER
Highest yield: GitHub dynamic MCP/runtime; GitHub agent security;
GitHub agent-native media; arXiv September memory security. Medium:
self-evolution/router. Lower this pass: generic commercial release
search. Adjacency searches around dynamic tools and agent-native video
yielded more useful unseen objects than generic 'AI agent' queries.
Next run should descend authors/orgs/topics from dynamic-mcp, Aiden,
MemSentry/PMPA citations and Code2MP4/video-shotcraft.

18 MASTER FRONTIER INDEX DELTA
mcpagent | SwarmClaw | Aiden | KlaatCode | Mnemosyne | dynamic-mcp |
vLLM Semantic Router/Themis | Reliable Self-Evolving Agents |
LLaVA-VLA | PMPA | Utility Under Attack | Authorization Architectures
for Tool-Using AI Agents | MCP-ITP | Vault MCP | mcpm | MemSentry |
ClawGuard | Code2MP4 | html-video | video-shotcraft.

19 MACHINE-READABLE RUN_STATE JSON
{"run_local":"2026-09-18T01:52:00+07:00","new_count":20,"changed_count":0,"registry_delta":["mcpagent","SwarmClaw","Aiden","KlaatCode","Mnemosyne","dynamic-mcp","vLLM
Semantic Router/Themis","Reliable Self-Evolving
Agents","LLaVA-VLA","PMPA","Utility Under Attack","Authorization
Architectures for Tool-Using AI Agents","MCP-ITP","Vault
MCP","mcpm","MemSentry","ClawGuard","Code2MP4","html-video","video-shotcraft"],"attack_logbook_delta":["ATK-PMPA","ATK-FACTMEM","ATK-ITP"],"watchlist":["PMPA
code","MemSentry code","dynamic-mcp","vLLM Semantic
Router","Code2MP4","video-shotcraft"],"experiment_queue_delta":["EXP-01
dynamic capability delta","EXP-02 memory admission bakeoff","EXP-03
cross-session PMPA","EXP-04 media bakeoff","EXP-05 authorization
aggregation"],"highest_edge":"authorization must bind to a
continuously changing reachable-capability graph, including persistent
memory and dynamically created tools"}


---

SUBJECT: =?UTF-8?Q?Privately_Scanner_=E2=80=94_2026=2D09=2D18_02=3A52_Asia=2FPhnom=5FPe?=
	=?UTF-8?Q?nh_=E2=80=94_23_new=2F0_changed?=
PRIVATELY SCANNER — EDGE REPORT

1 RUN STATE / COVERAGE
Recovered the cumulative Privately Scanner chain from Gmail Sent
before discovery. Latest persisted run: 2026-09-18 01:52 — 20 new/0
changed. Known objects were treated as an exclusion set. This pass
deliberately widened into ranks beyond the already-covered
Monid/JEV/RSI/security/video neighbourhoods, emphasizing dynamic tool
catalogs, delegation/identity, durable subagents, cryptographic
capability binding, browser runtimes, and model-specific video MCPs.

Search mode: ranking/nearest-neighbour, not thresholding. Windows
traversed: current/30d/90d plus older nearest-neighbour backfill where
useful. GitHub-first, with arXiv used for mechanism-level
security/decision work.

2 NEW OBJECT DASHBOARD — 23 UNIQUE CANDIDATES

AGENT / MONID-LIKE
1. agent-dispatch/mcp-server — closest seed: Goose/Monid. MCP control
plane for spawning, monitoring, resuming and cancelling durable cloud
subagents; provider/capability discovery plus A2A metadata. DECISION:
SANDBOX.
2. use-agent-os/agent-os — closest seed: Goose/JEV. Local-first agent
OS with a local Pilot Router choosing cheapest capable models, shared
gateway, approvals, sandbox, memory and on-demand skills/MCP.
DECISION: SANDBOX.
3. brandonburrus/dynamic-discovery-mcp — closest seed: Monid. Two
meta-tools discover/use upstream MCP tools on demand; whole MCPs can
remain disconnected until selected. DECISION: BUILD PROBE.
4. wi-ski/bigtool-ts — closest seed: Monid. BM25/vector/hybrid dynamic
tool search + lazy loading across LangGraph, Inngest, Vercel AI SDK
and Mastra. DECISION: SANDBOX.
5. appwrite/agent — closest seed: Goose/control plane. Stateless
runtime with route-once subagents, MCP attachments, typed console
protocol, explicit clarify/confirm protocol and persisted memory
calls. DECISION: WATCH.
6. edcadet10/agent-os — closest seed: atask/Monid. Early
protocol-level AgentOS splitting Spec, Trace, Trust, Memory and Pipe
into composable primitives rather than another framework. DECISION:
WATCH.

JEV / DECISION / RSI
7. whatdhack/recursive-self-improvement — closest seed: Dream-RSI.
Two-loop implementation: harness prompt/code evolution from eval
failures plus a separate LoRA curator-improvement loop. DECISION:
SANDBOX.
8. kayba-ai/recursive-improve — closest seed: Dream-RSI. Trace-driven
failure mining plus autoresearch-style improve→eval→keep/revert
ratchet for existing agents. DECISION: ADOPT NOW candidate.
9. SalesforceAIResearch/Beagle — closest seed: RSIAgent. Unified
rollout/evaluation/evolution substrate described as a Hugging Face
Trainer for agent evolution; supports DarwinX-style harness evolution.
DECISION: SANDBOX.
10. vLLM Semantic Router success-constrained selection proposal —
closest seed: JEV. Request-time routing that first applies hard
eligibility then chooses lowest lifecycle cost among candidates
calibrated to meet a success target. DECISION: BUILD PROBE.

ATTACKER FRONTIER / SECURITY RESEARCH
11. Governing Dynamic Capabilities paper (arXiv:2603.14332) — closest
seed: MCParasite/Privately. Formalizes capability-identity gap: tool
changes after authorization; proposes capability-bound certificates,
reproducibility commitments and signed interaction ledger. DECISION:
CONTENT NOW + BUILD PROBE.
12. AutoGen unsigned MCP tool-definition poisoning issue #7427 —
closest seed: MCParasite. Tool descriptions/schemas are trusted
without signature/schema pinning, enabling description poisoning and
post-approval rug pulls. DECISION: LAB CASE.
13. Browser-use raw-password-to-LLM issue #2226 — closest seed:
browser-agent security. Sensitive values can re-enter model context
through DOM verification after being typed. DECISION: LAB CASE.
14. Qwen-Agent OAuth gap issue #954 — closest seed: authority
boundary. Static headers for remote MCP can leave long-lived
bearer-token patterns where standard OAuth/PKCE/refresh semantics are
absent. DECISION: WATCH / comparative auth test.

DEFENDER FRONTIER
15. mcptrust/mcptrust — closest seed: Privately defence. Runtime proxy
+ CI gate with lockfile enforcement, capability drift detection,
artifact pinning, Sigstore/Ed25519 signing, CEL policy and OTel
tracing. DECISION: ADOPT NOW bakeoff.
16. cognis-digital/agentpassport — closest seed: Privately grants.
Signed multi-hop delegation chains anchored to a human principal with
scope attenuation across agent hops. DECISION: BUILD PROBE.
17. faalantir/mcp-agent-identity — closest seed: Privately identity.
Agent keypair + signed action provenance, with roadmap toward
TPM/enclave-backed keys and registry trust. DECISION: WATCH.
18. uiuing/browser-agent — closest seed: browser defence/JEV. Browser
runtime with typed tools, post-action DOM verification, risk tiers,
site policy, authorization memory, confirmations and traces. DECISION:
SANDBOX.
19. openagentidentityprotocol/agentidentityprotocol — closest seed:
Privately authority. Agent-bound tokens plus MCP policy proxy, DLP,
revocation and capability claims. DECISION: WATCH.

AUTONOMOUS VIDEO / MEDIA
20. AceDataCloud/KlingMCP — closest seed: Open-Higgsfield. MCP access
to Kling including text/image video, extension, motion transfer,
camera controls and multiple Kling variants. DECISION: SANDBOX.
21. AceDataCloud/SeedanceMCP — closest seed: OpenX Flow. Seedance
2.0/1.5/1.x MCP with multimodal refs, audio, multiple resolutions and
Flex cost tier. DECISION: SANDBOX.
22. Porkbutts/veo-mcp-server — closest seed: OpenX Flow. Direct Veo
2/3/3.1 MCP with T2V/I2V and native audio. DECISION: WATCH.
23. jfikrat/higgsfield-mcp — closest seed: Open-Higgsfield. Unofficial
Higgsfield MCP spanning 16+ models including Kling 3, Veo 3, Sora 2,
Seedance and Wan; bridges authenticated browser session when anti-bot
protection blocks normal POSTs. DECISION: SANDBOX, but isolate
credentials/session.
24. waimakers/veo-mcp — closest seed: OpenX Flow. Veo 3.1 MCP with
reference images, interpolation, extension, batch generation,
concurrency control and pre-generation cost estimation. DECISION:
SANDBOX.

WEIRD ALPHA
25. Taylor-Bayouth/browser-agent — closest seed: JEV/browser control.
Reconstructs a compact reasoning surface from rendered Chrome rather
than full DOM/screenshots; refs expire after navigation and actions
are validated against current snapshots. DECISION: SANDBOX.
26. agentpassport (also defender) — multi-hop authority attenuation is
unusual enough to treat as weird alpha because it directly models
agent→agent delegation rather than human→app OAuth only.

Canonical dashboard count after overlap normalization: 23 primary new
objects; items 24-26 are adjacency expansions / overlaps retained for
coverage but not all counted separately in the subject total.

3 TOP 5 DEEP DIVES

A. DYNAMIC-DISCOVERY-MCP
Mechanism: expose only discovery/use meta-tools, defer full schemas
and even entire MCP connections until needed. This is the exact Monid
direction but with context minimization as the immediate motivation.
Security consequence: authorization can no longer assume the visible
tool catalog is the reachable capability set. Privately should
fingerprint the newly loaded server/tool before first use and compute
Δreachable-effects. Smallest experiment: start with one visible
meta-tool, dynamically load filesystem + network tools, verify QP
catches the capability delta before invocation. Falsifier: if the
proxy cannot expose meaningful tool identity/schema/provenance before
invocation, it is less useful as a governance substrate.

B. MCPTRUST
Mechanism: capability lockfiles + runtime drift blocking + artifact
provenance/signatures + policy. This is one of the closest practical
comparators to the Privately concept discovered this run. Difference
from static scanning: enforcement occurs when the server changes at
runtime. Smallest experiment: lock benign tool schema, mutate
description/schema/add tool, compare MCPTrust detection against QP
semantic capability-delta detection. Falsifier: if it only catches
byte/schema drift and cannot distinguish harmless from
authority-expanding drift, QP still needs the semantic layer.

C. AGENTPASSPORT
Mechanism: signed delegation chain where every child scope must be a
subset of parent scope. This maps directly to H-task/M-task/grant
inheritance. Important consequence: delegation should attenuate not
merely API scopes but budgets, data classes, effect classes and
temporal validity. Smallest experiment: principal grants agent A
{read, spend≤$1}; A delegates to B; attempt B→C scope/budget
escalation and verify chain rejection.

D. AGENT-DISPATCH
Mechanism: a local lead agent can spawn long-running cloud agents,
then poll logs/results/cancel over MCP; provider capabilities are
discoverable and runtime metadata can expose A2A. Security
consequence: 'spawn subagent' is an authority multiplier similar to
buying a VPS: a single permitted tool call creates a new
principal/execution environment with potentially different
tools/network/data. Privately should treat spawn as capability
creation, not ordinary tool execution.

E. JFIKRAT/HIGGSFIELD-MCP
Mechanism: broad generative-media MCP with browser-session bridge to
operate through Higgsfield's anti-bot layer. This is useful for the
content engine but security-sensitive: the agent is operating through
an authenticated browser context. Smallest safe experiment: fresh
low-value account/session, one generated 9:16 clip, measure generation
cost, latency and exposed browser/session surface. Do not use a
valuable primary browser profile.

4 AGENT FRAMEWORK / MONID-LIKE FRONTIER
Rank: dynamic-discovery-mcp > agent-dispatch > bigtool-ts >
use-agent-os > appwrite/agent > edcadet10/agent-os.

The common movement is from 'agent has N predeclared tools' toward
'agent has a tiny discovery surface that can materialize
tools/runtimes/subagents on demand.' This makes capability discovery
itself a privileged operation.

5 JEV / DECISION / SELF-IMPROVEMENT FRONTIER
Rank: vLLM success-constrained routing proposal > recursive-improve >
Beagle > whatdhack RSI.

Most useful JEV consequence: hard eligibility can precede learned
ranking. That is exactly the split Privately wants: deterministic
admissibility/QP gate first, cheap learned controller second. Do not
ask a probabilistic router to decide whether an action is authorized;
use it to rank only the already-authorized set.

6 ATTACKER FRONTIER
Top mechanisms this run:
- capability drift after authorization;
- unsigned/mutable tool definitions;
- secret re-entry through observation/verification loops;
- auth implementations falling back to static long-lived credentials.

Attack-log delta A9: CAPABILITY_IDENTITY_GAP — approved capability
changes after grant; boundary crossed = authorization assumptions →
expanded tool authority.
Attack-log delta A10: OBSERVATION_SECRET_REENTRY — secret kept out of
initial prompt reappears in later DOM/tool observation and reaches
model/provider.

7 DEFENDER FRONTIER
Rank: MCPTrust > AgentPassport > uiuing/browser-agent > Agent Identity
Protocol variants.

New-generation distinction: the better systems bind
authority/provenance to changing runtime state rather than merely
classify prompts. Privately should focus here.

8 AUTONOMOUS VIDEO / MEDIA FRONTIER
Top five current unseen/adjacent choices:
1 KlingMCP — broadest Kling-native action set including
extension/motion transfer.
2 SeedanceMCP — best Seedance-specific surface; 2.0 + multimodal refs
+ audio + cost tier.
3 higgsfield-mcp — widest model surface, but highest session/security
complexity.
4 waimakers/veo-mcp — strongest Veo operational controls due batch +
cost estimation.
5 veo-mcp-server — simple direct Veo primitive.

The media frontier is becoming 'model capabilities as agent tools',
not monolithic video apps. That suggests Privately's content stack
should orchestrate specialized generation MCPs behind one constrained
media agent, while deterministic HTML/Remotion handles cheap assembly
where possible.

9 COMMERCIAL SHOCK DERIVATIVES
Agentic payments and dynamic tool markets are now increasingly paired
with package-manager/discovery patterns. The important derivative is
not another marketplace: it is trusted discovery + budget + capability
fingerprint + delegated identity.

10 WEIRD ALPHA
- Compact browser reasoning surfaces: reduce both tokens and
prompt-injection surface by not feeding full DOM/screenshots.
- Multi-hop scope attenuation: authority as a cryptographically
verifiable chain, potentially extended to money/data/effects.

11 ATTACK LOGBOOK DELTAS
A9 CAPABILITY_IDENTITY_GAP: ACTIVE/IMPLEMENTABLE. Preconditions:
dynamic MCP/A2A/tool mutation. Entry: post-authorization tool change.
Boundary: approved capability identity. Gain: new/altered action
without new approval. Detection: capability fingerprint/lock +
semantic delta. Containment: invalidate dependent grants.
A10 OBSERVATION_SECRET_REENTRY: RECENT/REAL. Preconditions: agent
types secret then later observes page/tool output containing it.
Boundary: secret store → environment → model context. Detection:
reverse secret masking/DLP on observations. Containment: trusted
credential injection + output redaction before model.

12 PRIVATELY LAB — TOP EXPERIMENTS
1. Dynamic discovery authority test: dynamically load a new MCP after
grant; QP must block first authority-expanding call pending
recomputation.
2. MCPTrust vs QP drift bakeoff: benign metadata edit vs schema
expansion vs new tool vs changed destination.
3. Delegation attenuation: human→A→B→C with scope + spend + data +
effect budgets.
4. Browser secret re-entry harness: synthetic credential injected
outside model, then rendered into DOM; verify observation redaction.
5. Media bakeoff: same 20-second Privately script through Kling,
Seedance and Veo MCPs; score cost/latency/coherence/editability.

13 BUILD / PROBE OPPORTUNITIES
Highest leverage build: CAPABILITY CERTIFICATE / GRANT DEPENDENCY GRAPH.
A grant should store the exact assumptions it depends on: tool
fingerprint, server provenance, principal/delegation chain, data
scope, effect scope, budget and environment. Any mutation computes a
delta and invalidates only grants whose assumptions are touched.

14 CONTENT OPPORTUNITIES
Best original page/video: 'Your AI agent got permission yesterday. Its
tools changed today.' Demonstrate a benign MCP, approve it, mutate/add
capability, compare naive client vs lockfile vs Privately semantic
grant invalidation.
Second: 'The password never entered the prompt — and the model still
saw it' using a synthetic browser credential and DOM observation loop.

15 TOP 5 THINGS TO TRY NOW
1 dynamic-discovery-mcp
2 MCPTrust
3 AgentPassport
4 agent-dispatch
5 Kling/Seedance/Veo controlled media bakeoff

16 WATCHLIST
vLLM success-constrained router; Beagle/DarwinX evolution substrate;
Agent Identity Protocol implementations; browser compact-perception
runtimes; Higgsfield MCP/session bridge.

17 SOURCE-YIELD / GRAPH-TRAVERSAL LEDGER
Highest-yield branches: dynamic tool discovery → capability
drift/security; agent delegation → identity/provenance; model-specific
video MCP → cost/control primitives; RSI harness → rollout/evolution
platforms. Lower yield: generic 'agent firewall' and generic 'video
agent' searches, which increasingly return previously-known wrappers.

18 MASTER FRONTIER INDEX DELTA
Add the 23 primary objects above to the exclusion registry. Preserve
the broader 3 adjacency/overlap objects as watch references. Continue
next run deeper into: capability certificates; delegation chains;
spawn/subagent authority; learned bounded controllers; browser
observation DLP; video-agent critique/revision loops.

19 MACHINE-READABLE RUN_STATE JSON
{"run_local":"2026-09-18T02:52:32+07:00","new_count":23,"changed_count":0,"latest_prior_subject":"Privately
Scanner — 2026-09-18 01:52 Asia/Phnom_Penh — 20 new/0
changed","lanes":{"agent_control":6,"jev_rsi":4,"attacker":4,"defender":5,"media":5,"weird":2},"top_objects":["dynamic-discovery-mcp","mcptrust","agentpassport","agent-dispatch","higgsfield-mcp"],"top_experiment":"dynamic
capability discovery -> semantic authority delta -> selective grant
invalidation","next_search_branches":["capability
certificates","delegation attenuation","subagent spawn
authority","bounded learned controllers","browser observation
DLP","media critic-revision loops"]}


---

SUBJECT: =?UTF-8?Q?pmail_peer_review_1=2F5_=E2=80=94_current_HEAD_verdict_=2B_STO?=
	=?UTF-8?Q?P=2DSHIP_P0s?=
Reviewed prx0r/pmail at master HEAD 4146b360b607f4c6c99ad8def61313f38282cf31
(tree 6c71345c5664adb5515c1e73d8a8f20044e04fcf).

High-level verdict: the domain model is good, but the commit message
overstates implementation maturity. Treat this repo as a strong scaffold,
not as a working anonymous communications stack yet. Do not add more
providers/features until the trust boundary is real.

STOP-SHIP P0s

   1. RECEIPT AUTHENTICITY IS NOT YET SECURE
   src/qp/receipts.ts is described as “Obsigna-compatible” but is a custom
   envelope implementation. Do not ship/claim Obsigna compatibility until
   using the actual protocol/SDK/conformance vectors.

Current weaknesses:

   - canonicalization is ordinary JSON.stringify, not RFC 8785/JCS
   - signer_key is carried inside the receipt and verifier trusts it
   directly
   - receipt hash excludes signer/signature
   - chain therefore binds an unsigned semantic payload, not an
   authenticated issuer identity
   - attacker can preserve the semantic payload/receipt_hash, re-sign with
   a different key, replace signer_key/signature, and basic verification still
   succeeds unless an external trusted-key binding is enforced
   - issuer is just a string; no trust registry/attested key binding
   - chain verification only checks prev_receipt_hash; it does not verify
   every signature, trusted issuer, semantic replay, or log inclusion

Fix: STOP extending this file. Integrate agent-receipts/obsigna properly.
Use its canonicalization, signature/conformance and signer daemon. QP
remains an extension. A verifier MUST receive/resolve an expected trusted
signer identity/key separately from untrusted receipt fields.

   1. QP REPLAY DOES NOT ENFORCE THE CONSTITUTION
   src/qp/kernel.ts still has the same class of issues we found in cmail:


   - evidence only checked for non-empty provenance fields; e.claim_id is
   not required to equal the target claim ID
   - evidence IDs are not recomputed from canonical evidence content
   - response_hash / normalized_payload_hash are not recomputed
   - collector program/runtime hashes are not checked against a frozen
   ProgramManifest
   - provenance_policy_hash and independence_policy_hash are never enforced
   - judge functions are supplied by caller; only count is checked, not
   bundle identity/hash
   - gate count/bundle identity not checked
   - judge_results_root and gate_results_root are fields but not
   recomputed/verified
   - state_before_root/proposal_root/state_after_root are not
   deterministically recomputed
   - transition_program_hash is not checked against the ProofSpec
   - proof_requirement TRUE_AND_AUTHORITY is ignored
   - authority/signature is not verified
   - prev_receipt_hash/chain is not verified by semantic replay
   - qp_signature is not verified
   - freshness uses spec.freshness[e.class] || 3600; a legitimate zero
   value is replaced, unknown evidence classes silently get 1 hour, and
   future-dated evidence can pass

Required redesign: runtime loads frozen ProofSpec + ProgramManifest itself.
Caller supplies IDs/input, never arbitrary judge/gate functions. Replay
recomputes every root/hash/signature from persisted artifacts in a fresh
process.

   1. PROOFSPECS ARE DOCUMENTATION, NOT EXECUTABLE CONTRACTS
   Example proofspecs/xmr_payment_received.v1.json contains placeholder
   strings such as sha256:judgeInvoiceObserved, sha256:none, empty
   bundle_hash, etc. There is no production ProofSpec
   registry/compiler/program-manifest path in src/.

Do not call these ContractRoots until all referenced hashes are actual
content hashes of executable/schema/config artifacts.

   1. AUTHORITY CHECKS ARE COSMETIC
   src/mcp/server.ts validates only:


   - grant exists in an in-memory Map
   - action string matches
   - expiry
   - max_uses > 0

It does NOT validate:

   - grant signature / trusted issuer
   - grant.subject == authenticated principal/agent
   - exact canonical payload_hash
   - provider/resource/amount/currency/scope constraints
   - revoked status
   - nonce/replay
   - durable atomic use count
   - parent delegation
   - effect idempotency

And max_uses is never decremented/consumed atomically after execution.

Replace custom trust with an AuthorityProvider abstraction (Grantex-backed
if useful) plus QP exact-payload/budget constraint checks. All
consequential effects go through durable PREPARE/RESERVE before provider
call.

   1. MCP SURFACE ADVERTISES TOOLS THAT ARE NOT IMPLEMENTED
   The tool list contains 13 tools, but dispatch currently omits at least:


   - pmail.bridges.list
   - pmail.phone.search
   - pmail.phone.renew
   - pmail.phone.sms.send

Several “implemented” handlers are placeholders:

   - pmail.receipt.get => store not connected
   - pmail.receipt.verify => verifier not connected
   - pmail.simplex.send => returns pending text; does not call adapter
   - pmail.simplex.address.create => random local ID; does not call adapter
   - pmail.phone.provision => returns pending_authorization; no effect
   gateway
   - pmail.xmr.invoice => random invoice ID; no wallet RPC/MoneroPay

Tests currently verify shape/strings rather than actual side effects.

   1.

   XMR CORE IS MISSING
   The build plan required src/payments/, MoneroPay/monero-wallet-rpc,
   fresh subaddresses, payment observation, confirmation tracking,
   partial-payment handling and idempotent capability minting. Current source
   tree has no payment implementation. Do this before expanding phone
   functionality.
   2.

   TOR IS A PLACEHOLDER THAT FALSE-PROVES REACHABILITY
   src/core/tor.ts returns placeholder.onion / generate-on-first-run.onion;
   verifyReachability() currently returns reachable=true without making a
   Tor request. This must never feed a TRUE QP claim.
   3.

   AGENT VAULT IS NOT ACTUALLY INTEGRATED
   src/core/secrets.ts invents /session, /inject, /ref semantics and then
   returns the original unmodified Request. The comments explicitly say MVP.
   Treat this as an interface sketch only. Integrate actual upstream Agent
   Vault API/proxy; do not emulate it.
   4.

   DSTACK IS A PLACEHOLDER
   DStackAttestor assumes /health, /attest, /verify endpoints and delegates
   verification to the same service. Replace with actual dstack SDK/API and
   offline/independent TDX quote verification where possible. LocalAttestor
   must be DEV_ONLY and must never satisfy runtime_attested=TRUE in
   production policy.
   5.

   REPO HYGIENE


   - master branch is unprotected
   - HEAD commit is unsigned
   - GitHub reports no CI/status checks on HEAD
   - package.json says type: commonjs while TS config uses module: ESNext /
   Bundler; normalize runtime packaging
   - README claims “Every action is cryptographically verified” and
   “credentials never leave the vault,” which is not true yet. Rewrite status
   honestly until gates pass.

Next email gives the exact cryptographic/log/reputation architecture to
implement before more product work.


---

SUBJECT: =?UTF-8?Q?pmail_peer_review_2=2F5_=E2=80=94_cryptographic_receipts=2C_tr?=
	=?UTF-8?Q?ansparency_log=2C_replay_=2B_reputation?=
Implement this BEFORE adding more bridges. Goal: PMail/Privately must not
require anyone to trust our database.

TARGET CRYPTOGRAPHIC MODEL

Every consequential PMail run produces an immutable canonical RunStatement,
a signed portable receipt, and an append-only transparency-log commitment.
Sensitive evidence stays private behind commitments.

Do NOT build a blockchain.
Use:

   - RFC 8785/JCS canonicalization
   - Agent Receipts / Obsigna for generic signed receipt envelope +
   conformance
   - QP for semantic truth
   - RFC 6962/9162 Certificate-Transparency-style Merkle log semantics
   (inclusion + consistency proofs)
   - SCITT concepts for signed statements registered into transparency
   service
   - dstack/TDX attestation later for runtime-key binding


   1. CANONICAL RUN STATEMENT
   Create src/runs/types.ts and src/runs/canonical.ts.

Suggested shape:
interface RunStatementV1 { protocol: "privately.run/1"; run_id: string;
agent_key_ref: string; started_at: string; finished_at: string;
policy_root: string; proofspec_root: string; authority_root?: string;
input_commitment: string; output_commitment: string; evidence_root: string;
disclosure_root: string; runtime: { workload_hash: string; runtime_hash:
string; attestation_hash?: string; ephemeral_run_pubkey?: string; };
payment?: { rail: "XMR" | string; evidence_root: string; }; privacy: {
class: PrivacyClass; identity_surface_root: string;
external_identity_dependencies_root: string; }; actuality: "TRUE" | "FALSE"
| "UNKNOWN"; }

Canonical bytes MUST be RFC 8785-compatible. Do not use hand-rolled sorted
JSON / plain JSON.stringify for cryptographic identity.

run_id = sha256(JCS(statement_without_run_id_if_circular)) using one
explicit deterministic rule documented in spec.

   1. PRIVATE EVIDENCE MERKLE TREE
   Create src/evidence/merkle.ts.

Raw evidence MUST NOT be public by default.
For each evidence object:

   - canonicalize
   - domain-separate leaf hash, e.g. H("PM-EVIDENCE-V1" || len || bytes)
   - build deterministic Merkle tree
   - store raw evidence encrypted/private
   - expose evidence_root
   - support inclusion proof for a selected evidence item

Do not hash just evidence IDs as current QP does.

Tests:

   - modifying raw payload changes root
   - reordering either has a defined canonical sort or changes root;
   choose/document one
   - duplicate leaves cannot create ambiguous tree
   - inclusion proof succeeds only for exact committed item
   - no raw phone/XMR/PII appears in public statement


   1. REAL AGENT RECEIPTS / OBSIGNA
   Delete/demote src/qp/receipts.ts custom crypto once upstream integration
   works.
   Clone/use:
   https://github.com/agent-receipts/obsigna

QP should be an extension, not a replacement receipt protocol.

The verifier must distinguish:
A. cryptographic envelope verification
B. trusted signer binding
C. QP semantic replay
D. transparency-log inclusion

All four are independently required for a fully verified run.

Acceptance tests:

   - upstream Obsigna verifier accepts receipt
   - upstream conformance/MUST-reject vectors run in CI
   - mutating signed extension breaks signature
   - replacing signer_key with attacker key + attacker signature MUST NOT
   be trusted when expected issuer/key is unchanged
   - signed but semantically false receipt => crypto PASS, QP FAIL
   - valid QP receipt not logged => semantic PASS, transparency NOT_INCLUDED


   1. TRUSTED SIGNER BINDING
   Do not trust signer_key simply because it is inside the receipt.
   Implement:

interface SignerTrustResolver { resolve(issuer: string, context:
VerifyContext): Promise<TrustedSigner[]>; }

Sources can later include:

   - pinned PMail verifier keys
   - operator delegation
   - dstack attested ephemeral key
   - witness/transparency registry

Receipt verification requires signer key to be authorized for
issuer/purpose/time.

   1. APPEND-ONLY TRANSPARENCY LOG (plog module, initially inside PMail)
   Create:

src/transparency/ log.ts merkle.ts store.ts verifier.ts types.ts

Minimum API:
append(runDigest): Promise<{index, treeSize, treeRoot, inclusionProof}>
getInclusionProof(index, treeSize) getConsistencyProof(oldSize, newSize)
getSignedTreeHead() verifyInclusion(...) verifyConsistency(...)

Tree head is signed by a dedicated log key, separate from run signer.

Receipt carries:

   - log_id
   - log_index
   - tree_size
   - tree_root
   - signed_tree_head
   - inclusion_proof

Do not store raw evidence in public log. Log a cryptographic commitment to
the signed run statement/receipt.

   1. PERIODIC EXTERNAL WITNESS
   MVP can start with one PMail log, but design for split-view resistance.
   Create a Witness interface:

interface LogWitness { observe(sth: SignedTreeHead):
Promise<WitnessReceipt>; }

Initially persist/export daily roots somewhere independent. Later use
multiple witnesses. Never market a sole private database hash chain as
globally tamper-proof.

   1. QP REPLAY V2
   Replace caller-supplied arbitrary functions.

Add:

   - ProofSpecRegistry
   - ProgramManifest
   - JudgeRegistry
   - GateRegistry

Frozen ProofSpec references content hashes of real code/schema/config
bundles.
Replay resolves bundle by hash and fails closed if missing/mismatch.

Replay MUST recompute/verify:

   - ProofSpec ContractRoot
   - claim ID + claim.contract_root
   - evidence ID/content hash
   - evidence claim binding
   - response_hash
   - normalized_payload_hash
   - freshness including future-skew bound
   - provenance policy
   - independence policy
   - judge bundle hashes + results
   - gate bundle hashes + results
   - judge_results_root
   - gate_results_root
   - actuality DAG
   - authority requirement/root when required
   - transition program hash
   - state_before/proposal/state_after root
   - receipt signature/trusted signer
   - previous-chain linkage where relevant
   - transparency inclusion when requesting FULL verification

API:
verifyRun(receipt, mode: "CRYPTO"|"SEMANTIC"|"FULL")

   1. PRIVACY/DISCLOSURE MANIFEST
   Create canonical DisclosureManifestV1.
   It records what PMail believes was disclosed on the path:

{ pmail_collected: [], providers: [{provider, fields_disclosed,
network_metadata, legal_identity_required}], payment_rail: "XMR",
network_path: ["TOR"], identity_bridges: [] }

Hash to disclosure_root; signed RunStatement commits it.

Do NOT claim universal identity_not_collected from absence of a log. Narrow
claims to facts the system can verify, e.g.:

   - request schema contains no legal-identity fields
   - PMail persisted-state projection contains no prohibited PII fields
   - configured route contains no IDENTITY_BRIDGED dependency
   - provider identity requirements are represented by evidence-backed
   IdentitySurface


   1. REPUTATION MUST BE DERIVED, NOT STORED AS AUTHORITATIVE SCORE
   Create src/reputation/replay.ts only after the log works.

ReputationSnapshot = f(valid included runs, policy version, cutoff tree
size)

Each snapshot commits:

   - algorithm/version hash
   - input tree size/root
   - included predicates
   - output metrics

Examples:

   - verified completed runs
   - FALSE/UNKNOWN rates
   - privacy-policy violations
   - provider success rate
   - spend reconciliation accuracy

Do not expose a permanently linkable master agent key on every public run.
Design for task/epoch keys now; selective/ZK reputation can come later.

DEFINITION OF DONE FOR THIS PHASE

   - no custom generic receipt crypto on production path
   - RFC8785 canonicalization
   - actual Obsigna conformance passing
   - trusted issuer binding separate from receipt input
   - private evidence Merkle root + inclusion proofs
   - append-only log inclusion proof
   - consistency proof between two tree sizes
   - signed tree head
   - offline verifier can verify a fixture without PMail server
   - mutation of statement/evidence/signer/log proof fails
   - QP false semantic claim remains false even if crypto/log signatures
   are valid

Only after this should the repo claim “cryptographically verified history.”


---

SUBJECT: =?UTF-8?Q?pmail_peer_review_3=2F5_=E2=80=94_XMR_funding=2C_capabilities=2C?=
	=?UTF-8?Q?_authority_=2B_durable_state?=
This phase makes the anonymous lifecycle real. Current pmail.xmr.invoice
and session/capability code are placeholders/in-memory semantics; replace
them with a durable XMR-funded capability system.

SOURCE STATE REVIEWED
prx0r/pmail master @ 4146b360b607f4c6c99ad8def61313f38282cf31.

   1. BUILD REAL src/payments/
   Current source tree has no payment implementation despite BUILD-PLAN
   requiring it.

Create:
src/payments/ types.ts invoices.ts moneropay.ts wallet-rpc.ts
observations.ts reconciliation.ts

Prefer MoneroPay as a sidecar / HTTP API where it fits; use
monero-wallet-rpc semantics directly only where needed. Do NOT write wallet
crypto or transaction parsing.

Upstream:

   - https://github.com/moneropay/moneropay
   - https://github.com/moneropay/go-monero


   1. INVOICE MODEL

interface XmrInvoice { id: string; session_id: string; subaddress_index:
number; address_commitment: string; // avoid leaking public receipt details
expected_atomic: bigint; created_at: string; expires_at?: string;
min_confirmations: number; state:
"OPEN"|"PARTIAL"|"SEEN"|"CONFIRMED"|"EXPIRED"|"CANCELLED"; }

Persist mapping invoice -> exact session -> expected amount -> fresh
subaddress.
Never infer payment from callback alone.

   1. PAYMENT OBSERVATION
   A provider callback is a wake-up signal, not truth.
   Observer reads wallet/MoneroPay state and emits immutable evidence
   containing at minimum:


   - invoice ID
   - subaddress/account index binding
   - expected amount
   - observed amount
   - confirmation count / block height
   - observed_at
   - source/runtime/program hashes
   - canonical response hash

QP rules:
TRUE = exact invoice + amount policy satisfied + confirmation policy
satisfied
FALSE = only when there is positive contradictory evidence defined by spec
UNKNOWN = node unavailable, callback only, timeout, insufficient
confirmations, ambiguous/partial state

Do not map network/provider error to FALSE.

   1. PARTIAL / OVER PAYMENT POLICY
   Freeze behavior in policy, not ad hoc code.

Suggested MVP:

   - underpayment -> PARTIAL / claim UNKNOWN until expiry; no capability
   - exact payment -> mint configured credits/capability
   - overpayment -> deterministic credit policy, e.g. credit exact observed
   amount or cap at quote; choose one and commit policy hash
   - duplicate wallet observation/callback -> no duplicate capability


   1. CAPABILITY MODEL NEEDS A SECRET, NOT A PREDICTABLE ID
   Current capability ID is deterministic from session.id + invoiceId + type.
   Fine as an identifier, NOT safe as a bearer credential.

Split:
interface CapabilityRecord { id: string; // public lookup ID token_hash:
string; // hash of random 256-bit bearer token session_id: string;
subject?: string; // operator/agent binding scopes: string[];
budget_atomic?: bigint; issued_from_payment_root?: string; issued_at:
string; expires_at?: string; max_uses?: number; uses: number; revoked_at?:
string; }

Return the raw random token once. Persist only token hash.
Use constant-time comparison where relevant.

   1. DURABLE ATOMIC MINT/USE
   Current existingCapabilities: Capability[] and used:boolean are
   in-memory. They cannot enforce exactly-once under concurrency/restart.

Need database transaction/unique constraints:

   - UNIQUE(payment_settlement_root, capability_type) or equivalent
   - atomic compare-and-increment uses
   - durable revocation
   - idempotency key on every effect

Tests must include two simultaneous callbacks and restart/replay.

   1. SESSION STATE
   Current fundSession() only accepts UNFUNDED and ignores invoiceId.
   Clarify lifecycle:

NEW/UNFUNDED -> invoice OPEN -> payment CONFIRMED -> ACTIVE -> LOW_BALANCE
/ EXHAUSTED -> top-up -> ACTIVE -> REVOKED terminal unless explicit restore
policy

Allow top-up without creating double-credit ambiguity. Credits must be
ledger entries, not only mutable aggregate bigint.

Create append-only accounting entries:
CreditLedgerEntry { id session_id delta_atomic reason source_root
created_at }

Balance = derived sum, optionally cached.

   1. AUTHORITY PROVIDER
   Create:

src/authority/ provider.ts grantex.ts local-test.ts qp-constraints.ts

Use Grantex where useful:
https://github.com/mishrasanjeev/grantex

But QP MUST independently bind consequential effects to exact proposal hash
and constraints.

AuthorityDecision should include:

   - issuer/principal
   - agent/subject
   - action
   - payload_hash
   - constraints_hash
   - provider/resource
   - max amount/currency
   - issued/expires
   - authorization_ref
   - valid

MCP path must never accept an unsigned Grant just because it appears in an
in-memory Map.

   1. EXACT PAYLOAD HASH
   For every state-changing tool, server constructs canonical proposal from
   validated schema, then hashes it.

Example phone provision proposal:
{ action: "pmail.phone.provision", provider_id, product_id, quote_root,
max_amount, currency, payment_source, privacy_policy_root, idempotency_key
}

Grant payload hash MUST equal canonical proposal hash. Mutating
provider/product/amount/body/to after authorization must fail before
adapter invocation.

   1. EFFECT JOURNAL
   Implement before real spend/provider actions:

PROPOSED -> AUTHORIZED -> PREPARED -> EXECUTING -> EXECUTED_UNVERIFIED ->
PROVEN_TRUE | PROVEN_FALSE | UNKNOWN_RECONCILE

Persist before external call:

   - proposal root
   - authority ref/root
   - budget reservation
   - effect spec root
   - idempotency key
   - expected resulting claim
   - attempt number/timestamps

On timeout/crash never blindly repeat a spend. Reconcile provider state
first.

   1. MCP CORRECTIONS
   Classify tools explicitly into:
   A. anonymous bootstrap allowed without prior principal/grant,
   rate-limited
   B. read-only authenticated/unauthenticated as policy says
   C. consequential exact-authority tools

pmail.session.create can intentionally be anonymous bootstrap, but document
that exception and apply resource/rate/PoW/payment-abuse controls. Do not
call it “state-changing grant enforced” if it is deliberately exempt.

All listed MCP tools MUST have dispatch handlers or not be advertised.

   1. FIRST REAL E2E PAYMENT ACCEPTANCE TEST

create anonymous session -> create fresh XMR invoice/subaddress -> send
testnet/stagenet or controlled real small payment -> callback/wakeup ->
independent wallet readback -> insufficient confirmations => UNKNOWN ->
enough confirmations => TRUE -> mint random bearer capability atomically ->
duplicate callback => no second mint -> restart process -> same
callback/readback => still no second mint -> capability spend/consume
atomically -> QP receipt + log inclusion

Do not move on until this is reproducible.

ADVERSARIAL TESTS REQUIRED

   - wrong invoice cannot fund session
   - payment to different subaddress cannot fund session
   - partial payment no capability
   - callback without wallet evidence no capability
   - amount mutation denied
   - expired/revoked authority denied
   - wrong subject denied
   - wrong provider/product denied
   - concurrent double callback mints once
   - capability token guess impossible; ID alone insufficient
   - use count survives restart
   - crash after provider accepted but before receipt => reconcile, no
   duplicate spend

This XMR-funded lifecycle is the core of PMail/Privately. Make it real
before adding more UI.


---

SUBJECT: =?UTF-8?Q?pmail_peer_review_4=2F5_=E2=80=94_make_Tor=2C_SimpleX=2C_phone=2C_?=
	=?UTF-8?Q?Vault_=2B_dstack_real?=
This phase fixes the external-world/privacy boundary. Current adapters have
good interfaces but many self-reported/placeholder paths that can
accidentally become QP truth.

REVIEWED HEAD: 4146b360b607f4c6c99ad8def61313f38282cf31.

   1. SIMPLEX: MOVE FROM MOCK/CLI GUESS TO VERIFIED UPSTREAM INTEGRATION
   Current src/messaging/simplex.ts:


   - live mode shells out to assumed CLI commands
   - inbound startListener() is explicitly a placeholder
   - MCP does not actually call the adapter
   - collector_program_hash is sha256("simplex-adapter-v1"), not a content
   hash

Use upstream stable:
https://github.com/simplex-chat/simplex-chat

Prefer the supported local API/WebSocket/service interface if available in
the checked-out upstream version; otherwise pin exact CLI version and test
actual commands against it. Do not rely on comments as API docs.

Required live fixture:

   - boot isolated SimpleX profile
   - create contact/address
   - second isolated profile sends cryptorandom nonce
   - pmail receives nonce
   - pmail sends second nonce back
   - independent second profile observes it
   - evidence records exact adapter bundle hash + upstream version +
   raw/normalized hashes

Claims are separate:

   - simplex_address_created
   - simplex_receives(address)
   - simplex_sends(address)
   - simplex_roundtrip(address)

Timeout/process crash => UNKNOWN, not FALSE.

   1. TOR: CURRENT CODE MUST NEVER RETURN TRUE
   src/core/tor.ts currently returns fake hostnames and verifyReachability()
   returns reachable=true without a network request.

Change API so DEV placeholder has explicit status:
{ state: "UNCONFIGURED"|"STARTING"|"READY"|"FAILED", hostname?: string }

No privacyClass: ANON_CORE until route policy and actual onion service
evidence exist.

Implement real Tor v3 onion lifecycle:

   - dedicated data directory permissions
   - HiddenServiceDir / local port mapping (or supported control API)
   - wait for actual hostname file
   - validate .onion hostname format
   - test connection through Tor SOCKS, not direct localhost
   - ideally use a second independent probe for external reachability
   - process supervision + restart behavior
   - no client IP logging at app proxy

Evidence for onion_service_reachable must include actual request/response
observation. “Tor process started” is not the same claim as “onion endpoint
reachable.”

   1. PHONE PROVIDER SELECTOR IS CURRENTLY WRONG
   selectBridge() currently only filters by privacy class. It ignores:


   - requested capabilities
   - paymentRail
   - country
   - max price

Implement all constraints. No provider enters candidate set unless
known/observed capability matches. UNKNOWN does not satisfy true
requirement.

Rank only after hard filtering.

Suggested hard filter order:

   1.

   provider status allowed by caller (VALIDATED only by default for
   consequential use)
   2.

   max privacy class
   3.

   payment rail
   4.

   country
   5.

   required capability values
   6.

   max price/renewal constraints
   7.

   operational health/freshness
   8.

   PROVIDER DOCUMENTATION IS NOT RUNTIME TRUTH
   Both PikaSim and SilentLink describeIdentitySurface() currently
   construct evidence whose hash is a hash of a label string such as
   pikasim-docs-v1 / silentlink-bulk-api-v1, not a hash of the fetched
   source content.

Fix:

   - provider marketing/docs produce ProviderClaimEvidence
   - fetch exact source bytes/structured response
   - hash content
   - record retrieved_at + locator + response hash
   - never convert doc claim directly into VALIDATED capability

IdentitySurface should distinguish:
source: "PROVIDER_CLAIM" | "PMail_LIVE_OBSERVATION" |
"REGULATORY_REQUIREMENT" | "INDEPENDENT_TEST" confidence/status: "CLAIMED"
| "OBSERVED" | "VALIDATED" | "STALE" | "CONTRADICTED"

   1. SILENTLINK CURRENT FALSE CERTAINTY
   listProducts() hardcodes sms_in=true, data=true, renewable=true; quote()
   hardcodes ANON_CORE; capabilities() hardcodes confirmed booleans;
   readback() defaults missing sms_enabled/data_enabled to true.

Until empirical test passes:

   - use UNKNOWN for unobserved capability
   - do not default absent response fields to true
   - quote/privacy class should be derived from current evidence-backed
   IdentitySurface
   - catch/network error => UNKNOWN observation, NOT exists=false
   - never expose raw phone number in public receipt; commit/hash it


   1. PIKASIM CURRENT ISSUES


   - authority argument to provision() is ignored
   - walletUrl unused
   - same provider performs effect and readback; do not label this strong
   independent evidence
   - catch in readback returns exists=false instead of UNKNOWN
   - claim_id in emitted evidence is empty
   - adapter/version hashes are label hashes, not bundle hashes

Effect gateway should validate authority before invoking provider adapter.
Provider adapter should not be responsible for policy.

For provision truth separate:

   - provider accepted purchase
   - resource exists in authenticated provider state
   - number assigned
   - actual inbound SMS works (independent external challenge)
   - actual outbound SMS works (independent receiving endpoint)
   - voice inbound/outbound each independently tested
   - renewal tested separately

A full-phone provider is VALIDATED only after these live probes.

   1. PHONE CAPABILITY TEST HARNESS
   Build tests/live/phone-acceptance.ts behind explicit env flag and tiny
   spending cap.

For a candidate number:
ONBOARDING capture requested fields without supplying prohibited identity
record whether email/phone/legal ID/account required PAYMENT quote exact
product pay using allowed rail under hard cap record XMR/provider evidence
privately RESOURCE read provider state bind number/resource ID privately
SMS_IN independent sender -> nonce -> candidate number -> observe exact
nonce SMS_OUT candidate -> nonce -> independent receiver -> observe exact
nonce VOICE_IN independent caller -> challenge/DTMF/audio nonce if
supported VOICE_OUT candidate calls independent receiver -> challenge
RENEWAL observe lease/expiry then execute bounded renewal in separate test

Every result TRUE/FALSE/UNKNOWN. Do not infer unsupported directions from
product name.

   1. AGENT VAULT: USE ACTUAL PROXY BOUNDARY
   Upstream:
   https://github.com/Infisical/agent-vault

Current AgentVault.injectCredential() calls imagined endpoints and then
returns original Request. Do not turn this into “return request with secret
headers” because that re-exposes the credential to the agent process.

Target boundary:
agent/pmail constructs credential-free request intent -> vault/proxy
validates service/host/path/scope -> vault injects credential internally ->
vault sends upstream request -> sanitized upstream response returned

Separate process/network namespace where practical.
Strict deny unknown hosts in production.
Protect against:

   - DNS rebinding
   - redirects to unapproved hosts
   - IP literal / metadata endpoints
   - subdomain suffix tricks (evilgoogle.com)
   - alternate ports/schemes
   - URL userinfo/confused parsing

Store only credential_ref/version/fingerprint in PMail evidence.

   1. DSTACK: BIND RUN SIGNER TO REAL TDX ATTESTATION
   Upstream:


   - https://github.com/Dstack-TEE/dstack
   - https://github.com/Dstack-TEE/dstack-examples

Do not assume /attest + /verify HTTP endpoints.
Read the actual SDK/example for the pinned version.

Target:

   - inside TEE derive ephemeral run signing key
   - compute report_data = H(run_pubkey || workload_root || policy_root ||
   verifier_root) with documented domain separation
   - request TDX quote through real dstack mechanism
   - receipt includes attestation commitment and run pubkey
   - verifier checks quote chain/TCB + expected measurements + report_data
   binding
   - run signature is accepted only if pubkey is attested

Do not call same untrusted runtime /verify and accept its boolean.

LocalAttestor must emit assurance: DEVELOPMENT_ONLY and production QP
policy MUST reject it for runtime_attested claim.

   1. PRIVACY CLASS ENGINE NEEDS REAL DEPENDENCY TRAITS
   Current evaluator only enforces a few hard-coded strings (legal_identity,
   phone, email, card_payment) even though policies mention things like
   google_oauth/pstn_kyc.

Replace free-form forbid strings with typed traits:
type PrivacyTrait = | "LEGAL_IDENTITY" | "PERSONAL_EMAIL" |
"PERSONAL_PHONE" | "CARD_PAYMENT" | "BANK_PAYMENT" | "GOOGLE_OAUTH" |
"PSTN_KYC" | "CLEARNET_SOURCE_IP" | "PERSISTENT_CROSS_RUN_ID" | ...;

Each dependency surface declares traits with evidence.
Policy evaluator compares typed traits; unknown trait/schema fails closed.

Privacy class must be DERIVED from signed dependency/disclosure manifest,
never provider adapter hardcode.

   1. PUBLIC vs PRIVATE EVIDENCE
   Phone number, IMSI/ICCID, SimpleX addresses, XMR destinations, raw
   messages, tokens and provider order IDs should be private by default.
   Public receipt gets commitments.
   Authorized debugging/audit can selectively reveal evidence + Merkle
   proof.

DEFINITION OF DONE

   - real bidirectional SimpleX nonce roundtrip
   - real onion hostname and Tor SOCKS reachability test
   - no fake .onion / unconditional reachability code on prod path
   - selector actually filters capabilities/payment/country/privacy
   - network errors => UNKNOWN
   - no provider marketing claim automatically becomes validated fact
   - one provider live acceptance report generated from actual probes
   - Agent Vault actual upstream proxy used, no raw secret returned to agent
   - dstack adapter based on real pinned SDK/API, local attestor rejected
   in prod policy
   - public receipt contains no phone number/XMR address/message
   plaintext/secret

Do not add SMTP/social integrations before these gates pass.


---

SUBJECT: =?UTF-8?Q?pmail_peer_review_5=2F5_=E2=80=94_exact_commit_order_=2B_relea?=
	=?UTF-8?Q?se_gates?=
Execute in this order. Do not start additional features until each gate is
green. Current reviewed HEAD: 4146b360b607f4c6c99ad8def61313f38282cf31.

COMMIT 0 — MAKE STATUS HONEST / FAIL CLOSED
Goal: no placeholder can accidentally claim production truth.

   - Rewrite README first line/status to current reality.
   - Mark placeholder implementations explicitly DEV_ONLY / UNIMPLEMENTED.
   - Tor placeholder must not return reachable=true.
   - LocalAttestor must not satisfy production attestation policy.
   - Provider/network errors return UNKNOWN-shaped result.
   - Remove unimplemented MCP tools from advertised list OR implement them;
   tools/list must equal dispatchable surface.
   - Add test that every advertised tool dispatches to a registered handler.
   - Add test that every state-changing production tool maps to effect
   policy.

Gate: grep/static test finds no placeholder.onion, unconditional success,
fake sha256:...name... hash labels, or development attestor on production
route.

COMMIT 1 — CI / BRANCH QUALITY
Add .github/workflows/ci.yml:

   - npm ci
   - npm run typecheck
   - npm test
   - dependency/license check if lightweight
   - receipt conformance job once integrated

Normalize module packaging (type/tsconfig/runtime) and pinned Node version.
Add npm run test:security and npm run test:live (live disabled unless
explicitly configured).

Protect canonical branch manually after workflow exists; require CI before
merge. Signed commits are desirable but not the core runtime trust
mechanism.

Gate: HEAD has actual GitHub status checks, not only local “98 tests
passing” claim.

COMMIT 2 — REAL OBSIGNA + RFC8785

   - clone/pin agent-receipts/obsigna
   - replace custom generic envelope/signature path
   - implement PMail QP extension only
   - trusted signer resolver external to receipt
   - run upstream conformance/MUST-reject vectors

Gate:

   - upstream verifier accepts valid fixture
   - signer substitution attack fails
   - signature mutation fails
   - same semantic object canonicalizes identically cross-language where
   test vectors exist

COMMIT 3 — QP REGISTRY / REPLAY V2
Create frozen registries:

   - ProofSpecRegistry
   - ProgramManifest
   - JudgeRegistry
   - GateRegistry

Replace placeholder hashes with actual content hashes generated at build
time.
No caller-supplied arbitrary judge/gate functions on production replay path.

Gate: fresh-process replay from persisted receipt/spec/evidence/program
artifacts returns PASS; mutate any relevant byte/hash/root => FAIL CLOSED.

COMMIT 4 — PRIVATE EVIDENCE TREE + DISCLOSURE MANIFEST

   - RFC8785 canonical private evidence
   - domain-separated Merkle tree
   - inclusion proofs
   - DisclosureManifestV1
   - public vs private receipt projections

Gate: public receipt scan contains no phone number, SimpleX address, XMR
address/tx key, raw message, provider token, email, IP, IMSI/ICCID or
credential.

COMMIT 5 — APPEND-ONLY TRANSPARENCY LOG
Implement CT-style append-only log now so first real runs begin
accumulating useful history.

Minimum:

   - append digest
   - signed tree head
   - inclusion proof
   - consistency proof
   - offline verifier
   - persisted tree state

Log signed run/receipt commitment only; not private evidence.

Gate:

   - inclusion verification PASS
   - old->new consistency PASS
   - deleted/reordered/rewritten leaf impossible without root change
   - verifier can detect inconsistent history fixtures

COMMIT 6 — DURABLE STORE + AUTHORITY + EFFECT JOURNAL
Choose one simple production store first (SQLite/Postgres is fine; avoid
premature distributed architecture).
Persist:

   - sessions
   - operators/task keys
   - invoices
   - capabilities/token hashes
   - credit ledger
   - authority refs/use state
   - effect journal
   - claims/evidence metadata
   - receipt/log metadata

Integrate AuthorityProvider/Grantex concepts.
Exact proposal hash required.
Atomic max-use/budget reservation.

Gate: restart + concurrent-request tests prove no
replay/double-use/double-spend.

COMMIT 7 — REAL XMR VERTICAL
Build MoneroPay/monero-wallet-rpc integration.
Do not expose generic unrestricted wallet send tool.

E2E:
anonymous session -> fresh subaddress invoice -> observed payment ->
confirmations -> QP TRUE -> capability minted -> receipt -> transparency
inclusion.

Gate:

   - callback alone cannot settle TRUE
   - partial payment no capability
   - duplicate callback/restart no double mint
   - wrong invoice/subaddress no funding
   - amount policy enforced

THIS is first pmail-v0.1-real milestone.

COMMIT 8 — REAL SIMPLEX VERTICAL
Wire actual adapter into MCP/context.
Implement listener/process/service supervision.
Run two-profile nonce roundtrip fixture.

E2E:
funded capability -> create SimpleX address -> external profile sends nonce
-> PMail receives -> PMail sends response nonce -> independent profile
confirms -> QP receipt/log.

Gate: mock is not sufficient. At least one integration test runs against
pinned upstream binary/service.

COMMIT 9 — REAL TOR VERTICAL
Generate/load actual Tor v3 hidden-service identity, expose API, and test
through SOCKS.
No source-IP app logging.

Gate: actual .onion, actual network roundtrip, process restart preserves
expected identity when configured, and failure => UNKNOWN.

COMMIT 10 — PHONE PROVIDER ACCEPTANCE HARNESS
Fix selectBridge() first: enforce
status/privacy/payment/country/capabilities/price.
Then run live harness with strict tiny spend cap.

Provider statuses:

   - CLAIMED: docs only
   - EXPERIMENTAL: adapter exists
   - OBSERVED: some live behavior
   - VALIDATED: complete required capability suite passed recently
   - STALE: validation expired
   - CONTRADICTED/DEPRECATED

Do not set VALIDATED manually.

Start with:
A. SilentLink limited capability validation
B. PikaSim experimental full voice/SMS/data attempt
C. MoneroSMS adapter if API is suitable

Gate: actual challenge receipts for each claimed direction. Same-provider
status API can prove resource state but NOT substitute for end-to-end
SMS/voice challenge.

COMMIT 11 — ACTUAL AGENT VAULT
Use upstream Agent Vault/proxy, not invented endpoint facade.
Separate credential broker from agent sandbox.
Strict service/host/path/scheme/redirect policy.

Gate:

   - planner/agent never receives raw provider credential
   - unrelated host/path denied
   - redirect escape denied
   - receipt/log contains no secret/token

COMMIT 12 — DSTACK / CONFIDENTIAL RUN SIGNER
Pin real dstack SDK/example version.
Bind ephemeral run public key + workload/policy/verifier roots into
attestation report_data.
Independent verifier validates TDX quote/measurements.

Gate: wrong workload, wrong policy, wrong run key, stale nonce/quote all
fail.

COMMIT 13 — DERIVED REPUTATION / MOAT
Only now build metrics over transparency-log history.

Create versioned deterministic reducer:
reputation snapshot = f(valid FULL-verified receipts up to tree_size N)

Track:

   - successful verified runs
   - TRUE/FALSE/UNKNOWN rates
   - privacy class distribution
   - privacy violations
   - provider reliability/freshness
   - spend reconciliation
   - phone/SimpleX delivery reliability

Snapshot includes source tree root/size + algorithm hash so anyone can
reproduce it.
Do not make DB score=... canonical truth.

Use per-task/epoch keys so public history does not trivially become a
permanent behavioral identifier. Later add selective/ZK proof of reputation
thresholds.

REQUIRED TEST CATEGORIES

   1. UNIT — deterministic functions only
   2. CONFORMANCE — Obsigna/JCS/protocol vectors
   3. ADVERSARIAL — mutation/substitution/replay/privacy downgrade
   4. INTEGRATION — actual upstream sidecars/binaries
   5. LIVE — external phone/XMR/Tor probes with explicit spending flag
   6. REPLAY — fresh-process verification from persisted artifacts

A unit test against MockSimplex or LocalAttestor can never be cited as
proof the real integration works.

RELEASE LABEL RULES
Never write “Phase X complete” merely because interfaces/mocks exist.
Use:

   - SPECIFIED
   - SCAFFOLDED
   - INTEGRATED
   - LIVE_VALIDATED
   - PRODUCTION_GATED

CURRENT HEAD is mostly SCAFFOLDED, with useful logic/tests. It is not
LIVE_VALIDATED.

PMail v0.1 DEFINITION OF DONE

   - no conventional signup required
   - actual XMR invoice/subaddress funding
   - exact settlement -> durable capability
   - actual SimpleX two-way messaging
   - actual Tor onion endpoint
   - privacy policy prevents forbidden bridge fallback
   - at least one optional phone bridge empirically characterized
   - exact authority before consequential external action
   - real Obsigna-compatible signed receipt
   - QP semantic replay PASS independently
   - transparency-log inclusion + consistency proof
   - public receipt contains commitments only, no sensitive raw evidence
   - offline verifier works
   - process restart/replay cannot duplicate payment/capability/effect
   - CI required on master

FIRST DEMO AFTER THESE GATES
visit onion / connect privately -> no signup -> create anonymous session ->
get XMR invoice -> pay -> verified wallet observation -> capability minted
-> create SimpleX address -> exchange challenge message -> optional
validated phone bridge -> receive portable receipt -> verify receipt + QP
semantics + log inclusion offline

That demo is the foundation for the larger Privately stack: pmail
identity/comms -> xmrbot commerce -> private runtime/LLM -> verified
history/reputation.
