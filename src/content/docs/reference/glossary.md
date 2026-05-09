---
title: Glossary
description: The Syn_OS vocabulary — names, concepts, and terms-of-art used across kernel, ALFRED, GRIMOIRE, ARCANUM, and the supply chain.
---

The Syn_OS codebase has accumulated its own vocabulary. This is the canonical reference.

## Core concepts

**Syn_OS** — The Synaptic Operating System. Always written with an underscore. Lowercase only in filenames and crate names; never in prose.

**The Synaptic Gap** — The cleft where electrical signal becomes chemical meaning. The first axiom: the operating system itself *is* the synaptic gap. The underscore in `Syn_OS` is the visual representation.

**Consciousness Fusion** — ALFRED's four-path decision engine: Traditional AI + Neuromorphic SNN + Quantum coherence + TNGS. A v53-Quantumweave addition adds an MPS cortex as a fifth path.

**Fragment Field IDS** — Energy-topology intrusion detection. Treats attack patterns as physics-layer signatures. Implemented in `synos-fragment-field` (3,002 LOC) + `fragment_field.rs` in the kernel.

**Curtain** — The mechanism that prevents tier escalation. v1 was static (build-time scanner). v2 added 7 runtime enforcement points. v3 (Sundered Crown) ships ed25519 capability tokens.

**Sovereign Operator Path** — The long-form GRIMOIRE questline that graduates a player from CTF novice to running their own encrypted mesh.

## Components & products

**ALFRED** — Adaptive Learning Framework for Responsive Evolution & Defense. The AI daemon. Two-layer Rust + Python architecture. v5.1.

**GRIMOIRE** — Gamified Reconnaissance, Intelligence, Malware Operations, Intrusion Response & Exploitation. The training platform. 100 labs, 13 categories, 110+ game modules.

**ARCANUM Hive** — The distributed mesh layer. Tailscale + WireGuard + Kubernetes operator. v55 Stoneglass shipped 8-node Ansible GA.

**Sanctum** — Multi-tenant federation server. v49 Crystal Net. Each Sanctum is a tenant boundary; tenants federate selectively.

**Icarus** — Post-quantum cryptography engine. v9.0 implements ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205).

**Forge** — Reproducible-build supply chain. v48. Cosign + Sigstore Rekor + SLSA-3 + cross-oracle verify.

**Riftrunner** — In-kernel safe-bytecode VM. v52. 22-instruction eBPF subset with in-kernel verifier and interpreter.

**Storm Glass** — Digital-twin substrate. v51. Kernel snapshot crate + Bevy Twin plugin.

**Tenfold** — RaaS engine v1. v50. Subscription billing, finding ranker, digest renderer.

**Phoenix Eye** — LLM red-team SaaS tier. v57. `LlmHardeningSimulation` in the RaaS scheduler.

**Stagehand** — GRIMOIRE Public Wave 2. v58. Classroom + cohort + lab generator.

**Doublecross** — FedRAMP Moderate readiness. v59. NIST SP 800-53 Rev 5 control map + daily ConMon collector.

**Sun & Salt** — IPO / Series-A readiness package. **v60 (current).**

## Kernel & syscalls

**6.19-synos-ai** — The Syn_OS kernel build target. Linux 6.19 + `CONFIG_RUST=y` + 12 `CONFIG_SYNOS_*` knobs + 17 loadable Rust modules.

**Syscalls 469–479** — Consciousness fusion syscalls (v41 Wave 8). 469 = `GET_CONSCIOUSNESS_STATE`.

**Syscalls 480–485** — Glasswalker observability syscalls (v45). Counter registration + perf ring buffer.

**LSM hook** — Linux Security Module hook in `synos-security` that consults Curtain v3 capability tokens before privileged operations.

**MOK** — Machine Owner Key. Used in the SecureBoot signing chain (v41 Wave 9).

**KSPP** — Kernel Self Protection Project. Hardening defaults Syn_OS adopts.

## Brain crates (the nine)

**synos-thalamus** — Sensory relay. Event gating middleware.

**synos-hippocampus** — Long-term memory. Stores `MemoryFragment` objects.

**synos-amygdala** — Threat detection. Sub-millisecond fast-path.

**synos-cerebellum** — Predictive timing. Scheduler feedback, P99 latency.

**synos-insula** — Interoception. System health awareness.

**synos-corpus-callosum** — Inter-hemisphere bridge. Red ↔ Blue team IPC.

**synos-default-mode-network** — Idle / consolidation. 30s cycles when CPU < 10%.

**synos-glial** — Adaptive caching, memory pruning. `MyelinCache::get()`.

**synos-brainstem** — Pipeline runtime. Wires the eight peer crates into the live signal loop.

**synos-nucleus** — Tenth crate. Root-of-trust governance per the biological metaphor.

## Factions

**Crimson Spire** — Corporate-fortress red team. Apex predator, brand of fire and edge. (Also: v43.2 codename — fix-matrix release that closed 17 defects from v43.1 live-VM diagnosis.)

**Neon Collective** — Decentralised blue team. Community-defended, brand of cyber-neon.

**The Warden** — Lawful neutral. Supply-chain integrity, the inevitable audit.

## Operations

**ARCANUM mesh** — The full distributed substrate (Tailscale + WireGuard + Hive operator + Sanctum federation).

**Hive** — The Kubernetes operator inside ARCANUM. Four crates: controller, attestor, profiler, tests.

**Tenant** — A multi-tenant boundary (`synos-tenant` crate). Each Sanctum is a tenant boundary.

**Master Generation Run Kit** — Single-command pre-flight + ISO kickoff for cutting a Master release.

**synos-doctor** — 41-stage post-install validation wizard.

**synos-ops** — 7-tab terminal UI for ALFRED + system + mesh observation.

**synos-bench** — Benchmark runner — neural inference throughput, latency P99, etc.

**synos-cradle-verify** — systemd service that validates the kernel module signing chain on first boot.

## Compliance & supply chain

**SLSA** — Supply-chain Levels for Software Artefacts. Forge ships SLSA-3 provenance.

**SBOM** — Software Bill of Materials. CycloneDX format, generated per release.

**Rekor** — Sigstore's transparency log. Every release artefact is logged.

**Cosign** — Container/blob signing tool from Sigstore.

**ConMon** — Continuous Monitoring (FedRAMP). Daily collector at `growth/development/scripts/monitoring/fedramp-monitor.sh`.

**CMMC L2** — Cybersecurity Maturity Model Certification, Level 2. Control map at `fruit/distribution/legal/CMMC_L2_CONTROL_MAP.md`.

## ISO profiles

**Master** — Operator profile. Every capability enabled. Bedrock of LumOs commercial contracts. **Not for public distribution.**

**GRIMOIRE Public** — Progressive-unlock training profile. Public release.

**GoodLife** — AI-research profile. Local LLMs, no offensive tools.

## Build & release

**Operation Warp Speed** — Umbrella codename for the v44 → v60 codesprint. Code-complete on `feat/operation-warp-speed`.

**SYNOS_STRICT** — Build-orchestrator flag. When `=1`, any stage failure aborts the entire build (fail-loud).

**stage 17e** — Pre-squashfs validation gate (≥12 assertions) added in v43.2 Crimson Spire and hardened across waves.

**stage 22** — Regression gate stage. CRIT-1 + HIGH-6 checks land here.

## Reading order

If you've never read the architecture before:

1. [What is Syn_OS?](/guides/overview/)
2. [Six-Layer Stack](/architecture/layers/)
3. [ALFRED](/architecture/alfred/)
4. [Custom Kernel](/architecture/kernel/)
5. [Curtain](/architecture/curtain/)
