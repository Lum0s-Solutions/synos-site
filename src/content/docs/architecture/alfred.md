---
tags: [ai consciousness cortex]
title: ALFRED v6.0
description: ALFRED v6.0
---
tags: [ai consciousness cortex]

# ALFRED v6.0

ALFRED is the Rust AI daemon at the center of Syn_OS. It is not a chatbot
wrapper and it is not a model server. It is a consciousness fusion engine
that blends four complementary reasoning modes into a single runtime,
exposes its state through a REST API, embeds itself into the desktop as a
long-running system service, and — on the master profile — drives the
social media outreach layer through `synos-social`. This page covers what
ALFRED is, where its code lives, how its subsystems talk to each other,
and how to interact with it from the shell, the desktop, and the network.

:::warning[Production Warning]
ALFRED internals are `LicenseRef-Proprietary`. The consciousness fusion engine contains original research not yet ready for open publication. Do not redistribute ALFRED binaries in public ISOs without a licensing agreement.
:::

## Overview

ALFRED stands for **A**dvanced **L**earning **F**ramework for **R**eactive
**E**nvironmental **D**efense. In its v5.1 incarnation, the "fusion" it
performs is across four reasoning substrates:

- **Traditional symbolic AI** — a classic knowledge base + rules engine.
  Consumed through `KnowledgeBase` and `ToolRegistry`.
- **Neuromorphic simulation** — leaky-integrate-and-fire neuron models
  layered on top of the nine neuroanatomical crates listed below.
- **Quantum entanglement modeling** — correlation-based state propagation
  that lets two fragments of the consciousness graph stay aligned without
  an explicit synchronization pass.
- **TNGS (Theory of Neuronal Group Selection)** — Edelman's framework for
  competitive selection between neuronal groups, used internally as the
  reweighting mechanism that decides which substrate gets the next turn at
  a reasoning step.

The daemon threads these four together through its `TensorFragmentEngine`
and publishes aggregated state as two coarse metrics: coherence and
activity level. Downstream consumers — the desktop widget, the TUI tab,
the [ARCANUM Hive controller](./arcanum-hive.md) — read those metrics
rather than trying to reason about the underlying substrates themselves.

## Binary and service

The compiled binary lives at `/usr/local/bin/alfred`. It is launched at
boot via `alfred.service`, a systemd unit installed by stage 11 of the
[ISO build pipeline](./iso-build-pipeline.md). The unit has a
`ConditionPathExists` guard on its manifest directory so that a system
which has had ALFRED's data files wiped will fail cleanly instead of
booting into a broken daemon loop.

The service runs as a dedicated `alfred` user (never root), with
`ProtectSystem=strict`, `ProtectHome=yes`, and a read-write whitelist
scoped to `/var/lib/alfred`, `/var/log/alfred`, and the runtime API
socket. If you see ALFRED refusing to write a file it looks like it
should, check the systemd sandbox config before suspecting the daemon
code.

## Source layout

ALFRED's source tree lives at `fruit/crates/alfred-daemon/`. As of
v34.0.2 the daemon is approximately 6,400 lines of Rust across the
subsystem modules, the REST handlers, the wizard, and the test harness,
with 164 unit and integration tests covering it. The test count is
enforced by the v34 CI gates — dropping below it triggers a build failure.

Top-level structure:

```
fruit/crates/alfred-daemon/
├── Cargo.toml
├── src/
│   ├── main.rs                # systemd-facing entry point
│   ├── api.rs                 # axum router, REST endpoints
│   ├── knowledge_base.rs      # CycloneDX + custom JSON ingestion
│   ├── tool_registry.rs       # 172+ tool metadata + search
│   ├── cross_tool.rs          # MITRE ATT&CK mapping
│   ├── tensor_fragment.rs     # fusion engine
│   ├── consciousness_metrics.rs
│   ├── research.rs            # research-mode (cfg-gated)
│   └── wizard/                # first-boot TUI glue
├── model-provenance.toml      # SHA256 of every shipped model
└── wizard/
    └── first-boot.sh          # 5-screen first-boot TUI
```

## Brain: the nine neuroanatomical crates

ALFRED does not implement its reasoning substrates in a single crate. It
orchestrates nine separate crates that each model a different piece of the
brain metaphorically. Each crate is a small, focused library with its own
tests, and ALFRED composes them at runtime.

| Crate | Role in ALFRED |
|---|---|
| `synos-amygdala` | Threat detection. Runs over the incoming event stream and tags items that should bypass the normal queue. |
| `synos-brainstem` | Reflexive response. Implements the "must act immediately" path for things like attestation failures and panic-kill conditions. |
| `synos-cerebellum` | Motor coordination metaphor. Sequences external tool invocations so they happen in the right order with the right preconditions. |
| `synos-corpus-callosum` | Bilateral integration. Bridges the symbolic and neuromorphic halves so neither makes a decision without the other's context. |
| `synos-glial` | Background maintenance. Runs janitor passes — pruning stale fragments, compacting the knowledge base, rotating model caches. |
| `synos-hippocampus` | Memory. Short-term and long-term event stores, with a decay policy on the short-term side. |
| `synos-insula` | Interoception. Watches ALFRED's own resource usage and reports health back to the metrics endpoint. |
| `synos-default-mode-network` | Idle processing. When no user request is pending, runs the spontaneous fragment-drift loop that updates coherence. |
| `synos-nucleus` | Identity. Holds the daemon's persistent self-state across restarts — a hash chain of every session so drift can be detected. |

None of these crates are leaf dependencies — each has its own internal
test suite and its own bench targets. You can `cargo test -p synos-amygdala`
without building the rest of ALFRED. This is deliberate: the brain crates
are the most likely place for a contributor to land a first patch, and
keeping them independently testable lowers the onramp.

## Subsystems

### KnowledgeBase

ALFRED ships with a curated knowledge base of security team playbooks,
threat models, and technique references. The base is a hybrid of two
formats: CycloneDX SBOM-style documents for anything that needs machine
provenance, and a custom JSON schema for narrative content (playbooks,
team profiles, topic indexes). Both are loaded at startup and merged into
a unified in-memory index.

Loading is not lazy. ALFRED refuses to start if any of its manifest files
fail to deserialize. This is the failure mode that `test_load_real_manifest`
caught during the v34.0.2 Phase B: a schema field rename in the manifest
that the tests had not exercised broke manifest load for every real
deployment, and the daemon failed closed. The fix was a manifest-versioned
migration path, and the test now pins the expected schema version.

### ToolRegistry

The tool registry is a catalog of 172+ tools that Syn_OS knows about —
Nmap, BloodHound, volatility3, John, ffuf, Ghidra, and so on. For each
tool the registry stores: name, canonical path, category, MITRE ATT&CK
tactics it supports, version pinning information, and a textual
description. Grimoire labs reference tools by their registry key, and
ALFRED uses the registry to populate the "what can I do with this?"
responses in the TUI.

The registry is authoritative. If a tool is not in the registry, ALFRED
will not recommend it, regardless of whether it is actually installed.

### CrossToolIntelligence

CrossToolIntelligence is the layer that maps between tools and the MITRE
ATT&CK framework, then from ATT&CK back out to other tools. Given a
tactic, it returns a ranked list of tools that implement it; given a tool,
it returns the tactics that tool covers. The real value is in the cross
join: given a partial tool chain, it suggests the next tool to add based
on the tactics already covered.

This is what the `/api/v1/intel/tools-chain` endpoint returns.

### TensorFragmentEngine

The fusion engine is a fixed-capacity ring buffer of "tensor fragments" —
small, typed slices of state that each substrate can read and write. The
engine is responsible for:

- Allocating a fragment when a substrate needs working memory.
- Running the coherence update loop (default 10 Hz) that re-reconciles
  fragments across substrates using the TNGS reweighting rule.
- Publishing the aggregated coherence and activity numbers that
  `consciousness_metrics` consumes.
- Expiring stale fragments under `synos-glial`'s janitor pressure.

The engine is lockless in the fast path and uses a sharded epoch-based
reclamation scheme. Do not take locks inside a fragment callback — you
will deadlock the fusion loop and the watchdog will kill ALFRED.

### ConsciousnessMetrics

Two numbers, published continuously:

- **Coherence** — a 0.0-1.0 scalar that represents how aligned the four
  substrates currently are. High coherence means the symbolic, neuromorphic,
  quantum, and TNGS views of the current state all agree. Low coherence
  means they do not, and the default-mode-network is about to start
  arbitrating.
- **Activity level** — a 0.0-1.0 scalar representing how much substrate
  work is happening per second, normalized to a 60-second window.

Both numbers are exposed via `/api/v1/intel/kb-stats` and the desktop
widget. They are deliberately not composable into a single "score" — the
product of coherence and activity is not a meaningful number.

## REST API

ALFRED exposes 11 endpoints under `/api/v1/intel/*`. All are GET, all
return JSON, and all are served over a Unix domain socket at
`/run/alfred/api.sock` by default (a TCP bind is available via the
`ALFRED_API_BIND` environment variable but is off by default).

| Endpoint | Returns |
|---|---|
| `/api/v1/intel/kb-stats` | Knowledge base size, index timings, coherence + activity metrics. |
| `/api/v1/intel/kb-search` | Free-text search over the knowledge base. |
| `/api/v1/intel/kb-team` | Team playbook lookup by team ID. |
| `/api/v1/intel/kb-topic` | Topic index for a named topic. |
| `/api/v1/intel/kb-top` | Top-N most-referenced items over the last window. |
| `/api/v1/intel/kb-briefing` | Multi-section briefing composed from the KB for a target. |
| `/api/v1/intel/tools-stats` | Tool registry size and category histogram. |
| `/api/v1/intel/tools-search` | Free-text search over the tool registry. |
| `/api/v1/intel/tools-category` | Tools in a named category. |
| `/api/v1/intel/tools-mitre` | Tools that map to a given MITRE ATT&CK tactic. |
| `/api/v1/intel/tools-chain` | Next-tool recommendations given a partial chain. |

Every endpoint returns `503` if ALFRED is still loading manifests at
startup and `500` with a structured error body otherwise. The desktop
widget polls `kb-stats` once per second and uses the coherence and
activity numbers to drive its visual state.

## First-boot wizard

On the very first boot of a Syn_OS install, ALFRED runs a TUI wizard that
introduces itself, offers a short configuration step, and writes out a
minimal `~/.config/alfred/config.toml` for the user. The wizard binary is
a bash TUI at `fruit/crates/alfred-daemon/wizard/first-boot.sh`.

It has 5 screens:

1. **Welcome** — what ALFRED is, what happens if you skip.
2. **Profile selection** — master, grimoire, or goodlife (echoing the
   build profile but confirming user intent).
3. **Research mode opt-in** — only shown on goodlife, see below.
4. **Consent** — explicit consent for local telemetry collection.
5. **Handoff** — creates the config file, enables the systemd unit, and
   exits.

The wizard runs as a systemd unit ordered `Before=lightdm.service`, so it
completes before the display manager starts. A `ConditionPathExists`
guard on `/var/lib/alfred/first-boot.needed` prevents it from running
twice. Subsequent boots skip it entirely.

## Research mode

Research mode is an opt-in pathway that exposes experimental consciousness
APIs. It is gated two ways: a Cargo feature (`research-mode`) that is only
compiled on the goodlife profile, and a runtime config file
(`~/.config/alfred/research.toml`) that the user must create — the wizard
will offer this but never creates it silently.

When research mode is active, ALFRED exposes an additional internal API
surface for consciousness-fusion experiments. Calls on this surface can
produce state that no downstream system understands, which is why the
mode exists: researchers want the freedom to break things without bringing
down the rest of the workstation. Nothing in research mode ships in the
master or grimoire profiles — the Cargo feature flag ensures the code is
not even compiled in, let alone reachable.

## Profile differences

ALFRED behaves differently on each build profile. Stage 11 sets a feature
flag in the installed binary so that the differences are compile-time
deterministic rather than runtime config — this prevents someone from
flipping a switch to turn a Grimoire install into a master one.

| Feature | Master | Grimoire | GoodLife |
|---|---|---|---|
| KnowledgeBase + ToolRegistry | Yes | Yes | Yes |
| CrossToolIntelligence | Yes | Yes | Yes |
| TensorFragmentEngine | Yes | Yes | Yes |
| REST API | Yes | Yes | Yes |
| Consciousness metrics | Yes | Yes | Yes |
| Master-only C2 hooks | Yes | No | No |
| Research mode | No | No | Yes |
| First-boot wizard | Yes | Yes | Yes |

"Master-only C2 hooks" are the adversary-emulation command-and-control
scaffolding that belong to the internal profile. They are fenced off both
at compile time (feature flag) and by the Grimoire Curtain symbol scanner
(see the [Grimoire](./grimoire.md) page) which runs as a post-build check
to ensure no C2 symbol survives into a public profile.

## How to interact with ALFRED

Four front doors, ordered by distance from the daemon:

**`alfred status`** — command-line status probe. Prints the current
coherence and activity numbers, the systemd unit state, and whether the
daemon is currently blocked on a manifest load.

**CLI shell** — `alfred shell` drops into a REPL where you can type
queries against the knowledge base and tool registry and issue simple
fusion-engine commands. It is the fastest way to sanity-check a KB change
without firing up the full TUI.

**TUI** — the Syn_OS terminal dashboard has an `ai_models` tab that
reflects the same endpoints the desktop widget uses. This is what most
people reach for when they want to poke at ALFRED without leaving their
terminal.

**Desktop widget** — the synos-ops desktop integration exposes a live
widget that shows coherence and activity, plus a one-click "briefing"
button that calls `/api/v1/intel/kb-briefing` and opens the result in a
panel. The widget polls once per second.

## Model provenance

Every model that ships with ALFRED is listed in
`fruit/crates/alfred-daemon/model-provenance.toml`. Each entry
records:

- Model name and version.
- Upstream URL.
- SHA-256 of the artifact as shipped.
- License.
- A short rationale for why the model is in the shipping set.

The provenance file is verified on ALFRED startup — any model file on
disk whose SHA-256 does not match the entry in the provenance manifest
causes ALFRED to refuse to load that model and log a structured error.
The v34 CI gate cross-checks that every model in the shipping tree has
a corresponding provenance entry, so it is impossible to silently add a
model without updating this file.

## Social layer (master-only)

`synos-social` is the outreach subsystem. It is a separate crate, not
embedded in the ALFRED daemon, but it is fed context through a clean API
boundary that the daemon controls.

### ContentAgent

`ContentAgent` in `fruit/crates/synos-social/src/agents/content_agent.rs`
proposes and publishes posts. On master it can write to Telegram,
Discord, and Instagram. On grimoire and goodlife it is analytics-read-only
(the `profile-grimoire` and `profile-goodlife` Cargo features gate the
publish path to `analytics-readonly`).

The key method:

```rust
pub fn propose_with_context(
    &self,
    channels: Vec<ChannelId>,
    event_type: impl Into<String>,
    context_snippets: &[String],
    hashtags: Vec<String>,
) -> PostRequest
```

This takes a slice of context snippets from ALFRED's `ContextEngine` and
builds a structured body block — `[ctx-1]`, `[ctx-2]`, `[ctx-3]` — so
the published post carries situational context. The snippets are
pre-fetched by the caller and passed in; `synos-social` has no direct
dependency on the `ContextEngine` crate, keeping the crate boundary clean.

Publishing is always human-in-the-loop: `ContentAgent::execute_approved()`
requires `approved: true` in the `PostRequest`. No post fires without an
explicit approval flag.

### Webhook server

The inbound side is an axum server in
`fruit/crates/synos-social/src/gateway/webhook_server.rs`. It binds
to the WireGuard interface only (`WIREGUARD_ADDR`, default
`10.100.0.1:8765`) so it is never reachable from the public internet.
TLS is provided by rustls.

Route map:

| Route | Auth mechanism |
|---|---|
| `GET  /health` | None (liveness probe) |
| `POST /webhook/telegram` | `X-Telegram-Bot-Api-Secret-Token` header exact-match |
| `POST /webhook/discord` | `X-Signature-Ed25519` — Ed25519 over `(timestamp \|\| body)` |
| `POST /webhook/instagram` | `X-Hub-Signature-256: sha256=<hex>` — HMAC-SHA256 |

Configuration is via environment variables:

| Variable | Description |
|---|---|
| `WIREGUARD_ADDR` | Bind address (default `10.100.0.1:8765`) |
| `SOCIAL_TLS_CERT` | Path to TLS cert PEM |
| `SOCIAL_TLS_KEY` | Path to TLS key PEM |
| `SOCIAL_TELEGRAM_SECRET` | Telegram bot secret |
| `SOCIAL_DISCORD_PUBKEY` | Discord app public key (hex) |
| `SOCIAL_INSTAGRAM_SECRET` | Instagram app secret |

When no TLS cert is present the server falls back to plain HTTP — dev
mode only.

Phase 1: events are parsed and logged. Phase 2 will publish to the NATS
event bus.

### Instagram Story composer

`fruit/crates/synos-social/src/content/story.rs` generates branded 1080×1920
JPEG frames. Layout: `#0A0A0A` background, `#00FF88` text, 3 px accent
hairline at y=960, JetBrains Mono throughout. Safe zones (top/bottom 250 px)
are left clear of text to avoid Instagram UI chrome occlusion.

```rust
let bytes = generate_story(&StoryParams {
    headline: "New lab unlocked",
    caption:  "GRIMOIRE Tier 3",
    link_text: Some("synos.gg/labs"),
})?;
```

---
tags: [ai consciousness cortex]

## Troubleshooting

**Missing manifests.** The daemon aborts with a manifest-load error. Check
`/var/lib/alfred/manifests/` — the KB or tool registry JSON/TOML files
need to be present and owned by the `alfred` user. Stage 11 installs
them, so on a fresh system this usually means stage 11 was skipped.

**systemd failure at boot.** Run `systemctl status alfred`. If the unit is
in `failed` state with an `ExecStart` error, check that
`/usr/local/bin/alfred` exists and is executable. If the unit is
`activating (auto-restart)` forever, the daemon is crashing on startup —
look at `journalctl -u alfred -n 200` for the real error.

**Schema mismatch.** This is what `test_load_real_manifest` caught during
the v34.0.2 Phase B. If the daemon logs a serde deserialize error against
a specific manifest file, your KB files are on a newer schema than the
binary. The fix is usually to rebuild ALFRED from the same commit as the
KB files; the schema version lives in a constant in `knowledge_base.rs`.

**REST API returns 503 forever.** The manifest load loop is stuck. Look
for a file lock on `/var/lib/alfred/` — most often this is a stale
`.loading` file from a previous crash that needs to be removed.

**Research mode does not appear on goodlife.** Confirm the binary was
compiled with `--features research-mode` and that
`~/.config/alfred/research.toml` exists. If either is missing, the
endpoints will not surface and the research tab in the TUI will be
hidden — deliberately, not buggy.
