---
title: Six-Layer Stack
description: Syn_OS from silicon to story — Hardware → Kernel → Core Platform → Application → Experience → Narrative. Every component has exactly one home.
---

Syn_OS is structured as a six-layer stack from silicon to story, with strict separation of concerns. When a new component is proposed the first question is *which layer does it belong to?*; every Rust crate, systemd unit, and syscall fits into exactly one. This is the architectural skeleton.

## The stack

```
╔══════════════════════════════════════════════════════════════╗
║  NARRATIVE LAYER — The Story                                ║
║  Three Factions (Crimson Spire, Neon Collective, The Warden)║
║  RICO contract dispersal, faction wars, boss contract chains║
║  GRIMOIRE lore, Neural Command branding                     ║
╠══════════════════════════════════════════════════════════════╣
║  EXPERIENCE LAYER — Bevy 0.14 Desktop                       ║
║  8 plugins: Cutscene, Cyberspace, FactionHQ, Mindmap,       ║
║  RetroFilter, SkillTree, Rehoboam system monitor, Twin       ║
║  synos-ops TUI (multi-tab: system, mesh, PQ-posture, …)     ║
╠══════════════════════════════════════════════════════════════╣
║  APPLICATION LAYER                                          ║
║  GRIMOIRE 1.0 (117 labs, 13 categories, 110+ modules)       ║
║  synos-gamification (~53k LOC)                              ║
║  Security Arsenal (600+ tools + 3,400+ Distrobox)           ║
║  spider-web intel dashboard, grimoire-mobile companion      ║
╠══════════════════════════════════════════════════════════════╣
║  CORE PLATFORM — 239 Rust Crates                            ║
║  ALFRED + 9 brain crates + nucleus root-of-trust            ║
║  Arcanum Hive (controller, attestor, profiler, tests)       ║
║  synos-fragment-field (energy IDS pipeline, 3,002 LOC)      ║
║  synos-icarus (ML-KEM, ML-DSA, SLH-DSA)                     ║
║  synos-tenant, synos-audit-trail, synos-bevy                ║
║  synos-attest, synos-build-attest, synos-curtain-tokens     ║
║  synos-federation, synos-raas-engine, synos-cortex-q (MPS)  ║
║  + ~140 more supporting crates                              ║
╠══════════════════════════════════════════════════════════════╣
║  CUSTOM LINUX KERNEL — 6.19-synos-ai                        ║
║  CONFIG_RUST=y · KSPP hardening · 12 CONFIG_SYNOS_* knobs   ║
║  Capability-gated, signed Rust kernel-module interface      ║
║  Loadable Rust kernel modules (CAP_SYS_ADMIN-gated, signed) ║
║  5 eBPF monitors: memory, network, process, security, perf ║
║  LSM integration · Riftrunner safe-bytecode VM (v52)        ║
║  Snapshot crate · Observability crate · Attest crate        ║
╠══════════════════════════════════════════════════════════════╣
║  HARDWARE LAYER                                             ║
║  x86_64 (Haswell+) · Intel RAPL · PMU counters · TPM 2.0    ║
║  GPU via Vulkan (Bevy rendering)                            ║
║  SDR/RF hardware (GRIMOIRE sdr labs)                        ║
║  Tailscale overlay · WireGuard fallback · VLAN 66 mesh      ║
╚══════════════════════════════════════════════════════════════╝
```

## The biological model

Underneath the six-layer stack is a **four-layer biological organism** that explains the *why* of every architectural decision:

```
┌──────────────────────────────────────────────────────────────┐
│  MAMMALIAN CNS                                               │
│  ALFRED consciousness layer (9 brain crates)                 │
│  Higher cognition, decision-making, memory consolidation     │
├──────────────────────────────────────────────────────────────┤
│  FUNGAL MYCELIUM                                             │
│  Distributed mesh (Tailscale, WireGuard, Arcanum Hive)       │
│  Information transport between nodes; fault-tolerant routing │
├──────────────────────────────────────────────────────────────┤
│  EUKARYOTIC CELL                                             │
│  Userspace services (encryption, pipelines, routing, TUI)    │
│  Organelles: synos-tenant, synos-audit-trail, synos-bevy,   │
│  synos-gamification, synos-icarus, synos-fragment-field,    │
│  synos-ops, 600+ security tools                              │
├──────────────────────────────────────────────────────────────┤
│  PROKARYOTIC CELL                                            │
│  Kernel / Ring 0 (capability-gated kernel interface, Rust LKMs, drivers) │
│  Primitive, fast, always-on. Mitochondria for the whole org. │
└──────────────────────────────────────────────────────────────┘
```

Every Rust crate, every systemd unit, every syscall fits into exactly one layer. The eukaryotic organelles are the meat of the userspace — when proposing a component, the second question is *what is its role in digestion of raw signal?*

## The three axioms

Every architectural decision is checked against three design axioms.

### 1. The Synaptic Gap

The name is not decorative. A synapse is the junction where a signal crosses from one neuron to the next — electrical impulse → neurotransmitter diffusion → receptor binding → electrical impulse again. **The gap is where raw signal becomes meaning.** In Syn_OS, the operating system itself *is* the synaptic cleft:

```
Pre-synaptic neuron    = Hardware
Synaptic cleft         = Syn_OS (kernel + userspace + ALFRED)
Post-synaptic neuron   = Application consciousness (ALFRED decisions, user processes)
Neurotransmitters      = Kernel interface calls (capability-gated, signed)
Receptors              = Capability-gated kernel handlers
Synaptic plasticity    = Adaptive kernel modules + ALFRED's learning loops
```

The underscore in `Syn_OS` is the visual representation of this gap. It is **always** written with an underscore — never `SynOS`, never `synos` in prose (lowercase is used in filenames and crate names).

### 2. The Biological Model

Each layer of the biological organism implements a recognisable biological function in silicon. When a new component is proposed, the first question is which biological layer does it belong to?

### 3. The Consciousness Fusion

ALFRED is **not "an LLM wrapper."** It is a fusion engine that routes every incoming event through four parallel processing paths and combines their outputs into a single decision vector:

1. **Traditional AI** — decision trees, Bayesian inference, rule engines, signature matching. Fast-path for known-unknown threats.
2. **Neuromorphic computing** — spiking neural networks (LIF, Izhikevich, Hodgkin-Huxley, AdEx, SRM models). Biologically-plausible path for temporal pattern recognition.
3. **Quantum coherence collapse theory** — Penrose-Hameroff Orchestrated Objective Reduction, clock-edge collapse model, fragment superposition. Research path for detecting energy-topology anomalies via Fragment Field IDS. Runs on kernel-visible signals exposed through the capability-gated interface.
4. **Theory of Neuronal Group Selection (TNGS)** — Gerald Edelman's neural Darwinism applied to attack pattern evolution. Path for recognising new attacks by analogy to past ones.

The fusion engine is not aspirational. Path 1 runs on every event. Path 2 runs on temporal anomalies. Path 3 runs on kernel-visible signals via the capability-gated kernel module interface. Path 4 runs during idle consolidation cycles in the Default Mode Network. Their outputs are weighted by `ConsciousnessState` (coherence, activity, mode, decision latency) and combined into ALFRED's decisions.

## What each layer is for

- **Hardware** — Physical substrate. Nothing application-specific lives here.
- **Kernel** — Ring 0. The custom syscalls, kernel modules, eBPF programs, and LSM integration. Everything here is *cycles per operation*; if a feature can live in userspace, it does.
- **Core Platform** — The 239-crate Rust workspace. The actual product. ALFRED v6.0, Icarus, Fragment Field, Curtain, Forge, RaaS, federation, the brain crates, and the supporting infrastructure.
- **Application** — Things you run *on* Syn_OS. GRIMOIRE labs, security arsenal tools, the spider-web intelligence dashboard, the mobile companion.
- **Experience** — The shell. Bevy desktop plugins, the synos-ops TUI, Cinnamon DE customisation, branding assets.
- **Narrative** — The story that makes the rest cohere. Faction lore, RICO contracts, boss-contract chains, the Sovereign Operator Path.

When in doubt: code goes in Core Platform; rendering goes in Experience; lore goes in Narrative.

## Where to read next

- **[ALFRED →](/architecture/alfred/)** — the AI daemon and the brain crates
- **[Custom Kernel →](/architecture/kernel/)** — syscalls, modules, eBPF
- **[Icarus →](/architecture/icarus/)** — post-quantum cryptography
- **[ARCANUM Mesh →](/architecture/arcanum/)** — the distributed nervous system
- **[Curtain →](/architecture/curtain/)** — capability tokens & weaponization ceiling
- **[Forge →](/architecture/forge/)** — reproducible builds & supply chain
