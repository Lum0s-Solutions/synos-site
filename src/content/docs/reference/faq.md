---
title: FAQ
description: Frequently asked questions about Syn_OS — what it is, who it's for, how it ships, and how it stays safe.
---

## What is Syn_OS?

The **Synaptic Operating System** — an Arch Linux derivative built almost entirely in Rust, with a capability-gated AI kernel interface, a 245-crate workspace, post-quantum crypto by default, gamified cybersecurity training (117 labs), and a distributed mesh layer for federated inference. The OS itself is the security product, not a tool collection on top of one.

[Read the overview →](/guides/overview/)

## Why the underscore?

The underscore in `Syn_OS` is the synaptic gap — the cleft where electrical signal becomes chemical meaning. The OS is the gap. Always written with the underscore. Never `SynOS`, never `synos` in prose (lowercase only in filenames and crate names).

## Is this real or is it vapourware?

It's real. **v111.0.0 "Last Light"** is on `main` — the current shipping release (v101–v111 "Rust Everything" campaign). 245 Rust crates, 0 compile errors. Capability-gated, signed Rust kernel modules — QEMU-boot-validated. Three ISO profiles building from the same codebase. Public release of GRIMOIRE Public and GoodLife is gated on counsel review and cyber-liability binding, not on engineering.

## Where can I download it?

Public ISOs are not yet shipping; they are **code-complete** but gated on legal and compliance milestones — counsel review of the licensing/EULA terms and a cyber-liability binding — not on engineering.

Star [the GitHub repo](https://github.com/Lum0s-Solutions/Syn_OS) and join [Discord](https://discord.gg/synos) for build-day announcements.

## How is GRIMOIRE Public different from Enterprise Edition?

GRIMOIRE Public is the talent funnel: progressive-unlock training that produces operators. The Enterprise Edition is the licensed commercial product LumOs sells to organizations that need Syn_OS's full capability at scale, with multi-tenant federation and a compliance posture. They are built from the same codebase, audited together, and shipped by the same supply chain — but **Curtain v4** makes the boundary between them mechanical, signed, and externally auditable.

GRIMOIRE Public cannot escalate to the Enterprise Edition no matter how far a player progresses:

- AI dispatch operations return `ENOSYS` on GRIMOIRE (capability-token enforcement)
- LLM federation is tier-isolated to GRIMOIRE peers
- Audit chain HMAC roots are separated
- Fragment Field IDS kernel-side detection is limited to the licensed Enterprise Edition
- C2 framework binaries are scrubbed at build time

[Read about Curtain →](/architecture/curtain/)

## Is ALFRED an LLM wrapper?

No. ALFRED v6.0 is a **fusion engine** that routes every event through four parallel processing paths and combines their outputs into a single decision vector. Path 1: traditional AI (decision trees, signature matching). Path 2: neuromorphic spiking neural networks. Path 3: quantum coherence collapse theory (Penrose-Hameroff Orch-OR). Path 4: TNGS / Edelman's neural Darwinism. Plus the MPS cortex tensor-network path.

LLMs (Ollama, Claude, OpenAI, Gemini, DeepSeek, llama-cpp) are *backends* the Python user-facing layer can use. They are not ALFRED.

[Read about ALFRED →](/architecture/alfred/)

## What hardware do I need?

Minimum: x86_64 (Haswell+), 4 GB RAM, 32 GB storage, UEFI firmware. Recommended: 4+ cores with AVX2, 8+ GB RAM (16 GB for AI workloads), 64 GB SSD, UEFI + TPM 2.0 (for Curtain v4 attest), and a Tailscale-capable network.

The Salvage Yard quest in GRIMOIRE assumes you can reclaim 3-4 discarded laptops to build a personal mesh — the hardware floor is "can find a working laptop", not "can buy a $2,000 GPU."

[System requirements →](/guides/download/#system-requirements)

## Is the source open?

Mixed. The plan (pending counsel review) is a **tiered licence model**:

- **Apache 2.0** for the kernel, brain crates, GRIMOIRE engine, ALFRED Rust daemon, Bevy plugins
- **LicenseRef-Proprietary** for the Enterprise Edition, Curtain admin tokens, FedRAMP/CMMC/SOC2 control evidence, and the federation root-signing infrastructure

The `Lum0s-Solutions/Syn_OS` GitHub repo is currently private; it goes public alongside the first GRIMOIRE Public ISO release.

## Why post-quantum crypto already?

Because the migration window is now. Adversaries record encrypted traffic today and decrypt it later — "harvest now, decrypt later." Anything sensitive enough to need encryption in 2026 is sensitive enough to need quantum-safe encryption in 2026.

Syn_OS uses ML-KEM (FIPS 203) for transport, ML-DSA (FIPS 204) for high-frequency signing, and SLH-DSA (FIPS 205) for long-lived release signatures. Hybrid mode pairs each PQC primitive with a classical one so neither alone is load-bearing.

[Read about Icarus →](/architecture/icarus/)

## What's the deal with the consciousness language?

It is not metaphorical decoration. The kernel actually exposes a `consciousness_state` struct via the capability-gated kernel interface (coherence, activity, mode, decision latency); ALFRED's 11 brain crates are wired into a real signal-processing loop by the brainstem; the Default Mode Network actually runs 30-second consolidation cycles when CPU load drops below 10%.

The vocabulary is borrowed from neuroscience because the architecture is borrowed from neuroscience. If you find the vocabulary off-putting, ignore it and read the Rust — the code is unambiguous.

## How do I report a security issue?

`security@lumossolutions.io`. Our PGP key and coordinated-disclosure policy are published in `SECURITY.md` in the GitHub repo.

## What does the v111 status table actually mean?

| Field | Means |
|-------|-------|
| **Capability-gated kernel interface** | Real, loadable, QEMU-boot-validated Rust kernel modules — not stubs. `CAP_SYS_ADMIN`-gated, signed, `0600` device nodes. |
| **245 crates, 0 compile errors** | `cargo check --workspace` clean across 245 crates. |
| **ALFRED v6.0** | GA consolidation: 1.0 stable API, 11 brain crates wired, consciousness fusion engine fully integrated. |
| **GRIMOIRE 1.0** | Catalog promoted to 1.0: 117 labs, 13 categories, SHA-256 manifests verified on every merge. |
| **Post-quantum by default** | No classical-only path in TLS, SSH, SBOM signing, ALFRED models, audit trail, or release attestation. |
| **SLSA-3 reproducible** | Cross-oracle build verification works today; SLSA-4 (two-witness) is queued behind provisioning the second build oracle. |
| **FedRAMP / CMMC / SOC2** | Control maps are written and the daily ConMon collector runs. The audits themselves are gated on a Big-4 engagement kickoff. |

## Who is building this?

**Lumos Solutions, LLC** — an independent cybersecurity and sovereign-AI company: security-focused, sovereign-AI-aligned, e-waste-conscious. Syn_OS is built by a small team working alongside an agent-orchestrated development pipeline — the human work is structured around the agent society.

## I have a question that's not here.

[Open an issue](https://github.com/Lum0s-Solutions/Syn_OS/issues), drop it in [Discord](https://discord.gg/synos), or email `info@lumossolutions.io`.
