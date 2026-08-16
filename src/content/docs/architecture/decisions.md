# Architecture Decision Records

This page tracks the architectural decisions that shaped Syn_OS. Each record follows a compact
**Context → Decision → Consequences** format. Decisions are listed chronologically; where a
later decision supersedes an earlier one, that is noted in-line.

The canonical decision log is maintained in `docs/internal/eyesonly/architecture/SYNOS_MASTER_ARCHITECTURE.md`
and in the "Key Decisions" section of `.claude/CLAUDE.md`. This page is the public-facing
summary.

---

## ADR-001 — Apache 2.0 Base with `LicenseRef-Proprietary` Modules

**Status:** Accepted (v35 — resolves the v26–v34 license contradiction)
**Date:** 2026 Q2

**Context.** Through v34, the root `LICENSE` file declared MIT while individual crate
manifests declared `LicenseRef-Proprietary`. This contradiction blocked the v35 public release
because third parties could neither redistribute the ALFRED daemon under MIT nor build the
public GRIMOIRE image without pulling in proprietary lab content.

**Decision.** Move the project to an explicit **open-core** model:
- The root `LICENSE` is **Apache 2.0**, with a `NOTICE` file capturing required attributions.
- The majority of Rust crates inherit Apache 2.0 via `license = "Apache-2.0"` in their `Cargo.toml`.
- A small, explicit set of modules declare `license = "LicenseRef-Proprietary"`: the ALFRED
  consciousness engine internals, proprietary GRIMOIRE labs, `synos-tenant`, `synos-audit-trail`,
  `synos-fragment-field`, and `growth/security/red-team/campaigns/`.
- Commercial use of the proprietary modules requires a separate licensing agreement.

**Consequences.** Contributors can freely work on the Apache-licensed majority of the workspace.
Downstream builders can repackage the public profiles without legal friction. The curtain
enforces the boundary at build time so proprietary symbols never leak into the public ISOs.
The v35 ship-gate license check now passes.

---

## ADR-002 — Shift Base Distribution from Debian/Parrot to Arch Linux

**Status:** Accepted (v30, March 2026)
**Date:** 2026-03-20

**Context.** Through v29, Syn_OS claimed to be a "Parrot-based" / "Debian-based" distribution.
In practice the entire development environment was Arch/EndeavourOS, and every new feature
(pacman-driven tooling, AUR packages, rolling-release kernel assumptions) was written against
Arch. The mismatch between the documented base and the actual build environment was a constant
source of drift and bugs.

**Decision.** Officially rebase Syn_OS on **Arch Linux** as of v30. The ISO pipeline transitions
from `debootstrap` to `mkarchiso`/`archiso` + `pacstrap`. The AUR ecosystem is a first-class
source of security tooling. The target kernel tracks rolling mainline Linux (with Syn_OS
patches on top). Docker-wrapped `mkarchiso` on the sanctum node produces reproducible images.

**Consequences.** Alignment between dev host and target OS tightened dramatically. Packaging
stories simplified — one tool (`pacman`) instead of three (`apt` + `dpkg` + `snap`/`flatpak`).
Rolling releases eliminate long backports. The downside is that Syn_OS can no longer advertise
the Debian stability story and users expecting long-term support must switch to `linux-lts`.

---

## ADR-003 — Pin Bevy to 0.14 (Defer Bevy 0.16)

**Status:** Accepted
**Date:** 2026 Q1

**Context.** `synos-bevy` (7,129 LOC, 7 plugins) powers the desktop experience. Bevy 0.16
introduced `FullscreenMaterial` and a new render-graph API that would simplify the CRT
post-processing stack in `RetroFilterPlugin`. However, 0.16 also reworked the ECS scheduler
in a way that breaks `RehoboamPlugin` and requires rewriting `FactionHQPlugin`'s reputation
system.

**Decision.** Pin to **Bevy 0.14** for v34 and v35. Revisit for v36 after the ECS scheduler
work in Bevy 0.16+ stabilises. Document the manual render pipeline used by `RetroFilterPlugin`
so the upgrade path is clear.

**Consequences.** Short-term: more hand-rolled code in `RetroFilterPlugin` (4 WGSL shaders
maintained manually). Long-term: v36 inherits a large one-time upgrade cost but avoids
rewriting two plugins under deadline pressure.

---

## ADR-004 — Build the Custom Kernel with LLVM and `CONFIG_RUST=y`

**Status:** Accepted
**Date:** 2026 Q1

**Context.** The Syn_OS custom kernel (`6.19-synos-ai` target) integrates 17 Rust kernel
modules covering network, scheduler, memory, security, interrupts, module loader, power,
hardening, syscall, consciousness, procfs, and bridge layers. Rust-for-Linux requires
`CONFIG_RUST=y`, which in turn requires building with LLVM/clang rather than gcc.

**Decision.** Build the kernel with the **LLVM toolchain** (`make LLVM=1`) and enable
`CONFIG_RUST=y`. Ship 12 `CONFIG_SYNOS_*` build options so each Rust module can be
compiled in or out per profile.

**Consequences.** The kernel build environment is reproducible on any host with `clang`
and `rust-src`. The Syn_OS-specific modules can be toggled per profile without touching
the core kernel config. The downside is that the kernel build requires a matching Rust
nightly toolchain (pinned in `rust-toolchain.toml`) and will break on arbitrary nightly
upgrades — version bumps are gated behind a pre-sprint check.

---

## ADR-005 — Three-Image Strategy (Master / GRIMOIRE Public / GoodLife)

**Status:** Accepted
**Date:** 2026 Q1

**Context.** Syn_OS serves three audiences with very different threat models: internal
developers need every capability, students need a sandboxed education image, and AI
researchers need something in between with no offensive tooling. Shipping one omnibus
image would either over-expose sensitive capabilities or require end users to opt into
dangerous features.

**Decision.** Build **three ISO profiles** from the same workspace:

- **Master** (4+ GB) — developer-only, every capability enabled, internal distribution.
- **GRIMOIRE Public** (~3 GB) — education image, GRIMOIRE labs and game engine, safe
  toolset, proprietary content curtained out.
- **GoodLife** (~3 GB) — AI research image, ALFRED daemon and LLM engine, no offensive tooling.

A build-time **curtain** (ELF symbol scanner + feature audit + lab-integrity manifests)
enforces the boundary for the two public profiles.

**Consequences.** Each profile is optimised for its audience without duplicating code.
The curtain catches accidental leakage at build time rather than at release time.
Maintenance cost scales with profiles, so the number is capped at three.

**Update (2026-08):** superseded — now 4 images incl. the ChurchOfMalware members-only tier.

---

## ADR-006 — Tailscale Backbone with WireGuard Fallback for ARCANUM Hive

**Status:** Accepted
**Date:** 2026 Q1

**Context.** ARCANUM Hive is a horizontally-scalable encrypted mesh. Initial designs used pure WireGuard,
which required manual key distribution and a flat IP plan. Tailscale provides NAT traversal,
identity management, ACLs, and magic DNS out of the box, but adds a dependency on a SaaS
coordinator.

**Decision.** **Tailscale is the primary backbone**; **WireGuard is the fallback** with
static IPs on VLAN 66 (10.66.0.0/24) and a separate WG subnet (10.99.0.0/24). Each node
holds both configurations so a Tailscale outage does not sever the mesh.

**Consequences.** Day-to-day operations benefit from Tailscale's ergonomics. Critical
control-plane traffic (hive controller, attestor, profiler) also succeeds on WireGuard
when Tailscale is unreachable. Nodes maintain two routing tables and two firewall
rule sets, which is added complexity but keeps the mesh resilient.

---

## ADR-007 — ed25519 Node Identity for ARCANUM Hive

**Status:** Accepted
**Date:** 2026 Q1

**Context.** Mesh nodes must prove their identity to each other before exchanging
workloads or attestations. X.509 certificates were considered but carry heavy tooling,
rotation, and CRL baggage for a small fleet.

**Decision.** Every hive node generates an **ed25519 keypair** at first boot.
Public keys are committed to `growth/arcanum/keyring/nodes/<hostname>/` alongside a
`NODE_IDENTITY.md` describing the hardware tier and role. Node-to-node authentication
uses ed25519 signatures over ephemeral challenges.

**Consequences.** No CA infrastructure, rotations are a single file update, and the
attestor can verify identities offline. The tradeoff is that a compromised node's
key must be revoked by pushing a new commit to the keyring — acceptable for a
small, centrally-controlled fleet.

---

## ADR-008 — `cargo xtask` as the Single Workspace Orchestrator

**Status:** Accepted
**Date:** v26 ("The Curtain", March 2026)

**Context.** Pre-v26, workspace-wide checks were scattered across shell scripts, Python
helpers, and one-off binaries. Reproducibility suffered and each new check added a new
entry point.

**Decision.** Consolidate workspace-wide operations into a single `cargo xtask` crate at
`growth/xtask/` with subcommands. As of v34.0.2 the subcommand list is: `check-versions`,
`validate-profiles`, `doc-dedup`, `pre-sprint`, `stats`, `gen-labs`, `curtain-check`,
`feature-audit`, `lab-integrity`, `release`, and `audit-unsafe` (added this codesprint).

**Consequences.** One tool, one dependency set, one test suite. New checks are added as
subcommands rather than new binaries. CI invokes the same `cargo xtask` commands that
developers run locally.

---

## ADR-009 — 34-Stage ISO Build Pipeline with Per-Stage Idempotency

**Status:** Accepted (grown from 20 stages in v1.0 → 30 in v31 → 34 in v34)
**Date:** 2026 Q1 – Q2

**Context.** The ISO build is long, expensive, and historically fragile. Early versions
were monolithic shell scripts where a failure halfway through forced a full restart. As
the feature set grew (kernel build → Rust compile → Arch base → desktop → security tools
→ ALFRED daemon → AI models → GRIMOIRE → squashfs → SBOM), splitting the pipeline became
essential.

**Decision.** Implement the ISO build as a **34-stage pipeline** under
`fruit/iso/iso-build/scripts/stages/`, each stage being an idempotent bash script named
`NN-description.sh`. Stages run sequentially under `SYNOS_STRICT=1` with per-stage logs,
checkpoint/resume support, and an adaptive watchdog.

**Consequences.** Failures can be resumed from the last successful stage. New stages can
be inserted without renaming existing ones (lettered suffixes: `02b-synos-rust-modules.sh`).
Each stage has a single responsibility and can be tested in isolation. The downside is that
the pipeline is now 34 shell scripts totalling thousands of lines — which required the
Batch L1–L5 build-infra code freeze to harden against landmines.

---

## ADR-010 — Consciousness Fusion Engine for ALFRED (Traditional + Neuromorphic + Quantum + TNGS)

**Status:** Accepted (v5.1)
**Date:** 2026 Q1

**Context.** ALFRED is the AI daemon. A single ML backend (ONNX, Ollama, or a custom
neuromorphic layer) was insufficient — each has different strengths for different tasks,
and no single approach covers the research goals around quantum-inspired coherence and
Edelman's Theory of Neural Group Selection (TNGS).

**Decision.** Implement a **consciousness fusion engine** in the `alfred` daemon that
combines four layers — **Traditional** (ONNX/Ollama classical inference), **Neuromorphic**
(spiking-network approximations), **Quantum** (coherence-window estimation), and **TNGS**
(neural-group selection dynamics) — and routes queries to the appropriate layer(s)
based on task type and confidence thresholds.

**Consequences.** ALFRED can reason about threats with multiple complementary models.
The fusion logic is complex and becomes the hardest-to-test part of the daemon, which is
why ALFRED internals are `LicenseRef-Proprietary` — the fusion engine contains original
research that is not yet ready for open publication.

---

_Updated: v111.0.0 Last Light, August 2026. For the authoritative list of
decisions including superseded ones, see `docs/internal/eyesonly/architecture/SYNOS_MASTER_ARCHITECTURE.md`._
