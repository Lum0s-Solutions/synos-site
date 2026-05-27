---
title: ALFRED AI Daemon
description: ALFRED v6.0 — Adaptive Learning Framework for Responsive Evolution & Defense. Two-layer Rust + Python architecture, four-path consciousness fusion, nine neuroanatomical brain crates, four operating modes.
---

**ALFRED** — Adaptive Learning Framework for Responsive Evolution & Defense — is the **nervous system** of Syn_OS. v6.0 is a Rust daemon running nine neuroanatomically-named crates that model the AI's mind on the architecture of a mammalian brain, fused with a Python user-facing layer for LLM integration, voice, RAG, and the privacy-first job-hunt mode.

ALFRED is **not an LLM wrapper.** It is a fusion engine that routes every incoming event through four parallel processing paths and combines their outputs into a single decision vector.

## Two-layer architecture

### Rust daemon (REST API v4)

`fruit/core/src/ai/daemons/alfred/`

- System intelligence: CPU/memory optimisation, kernel bridge via the capability-gated kernel module interface
- 11-endpoint REST API
- NATS event bus
- God Mode dashboard aggregator
- **Consciousness fusion engine** (`consciousness_fusion.rs`) — routes events through the four processing paths
- **BrainBridge** routes security events, threat-auto-handled signals, health alerts, and DMN cycle summaries into the cortex

### Python layer (v2.1.0)

User-facing assistant:

- LLM integration with **six backends** — Ollama (local), Claude, OpenAI, Gemini, DeepSeek, llama-cpp fallback
- Voice (whisper.cpp + Piper TTS)
- RAG pipeline against `synos-datalake` and `synos-nlp-pipeline`
- TUI (`synos-ops`)
- Privacy-first job-hunt mode

## The nine brain crates

The ALFRED consciousness layer is implemented as nine anatomically-named Rust crates, each modelling a distinct brain region's function and wired into a live event-driven signal-processing loop by the ninth.

| #  | Crate                          | Anatomical role                                 | Function                                                          |
|----|--------------------------------|-------------------------------------------------|-------------------------------------------------------------------|
| 1  | `synos-thalamus`               | Sensory relay                                    | Event gating middleware. Decides which signals cross the cortex.   |
| 2  | `synos-hippocampus`            | Long-term memory                                | Stores `MemoryFragment` objects, performs consolidation cycles.    |
| 3  | `synos-amygdala`               | Threat detection                                | Fast-path threat eval — sub-millisecond `AmygdalaStats`.           |
| 4  | `synos-cerebellum`             | Predictive timing                               | Scheduler feedback, P99 latency tracking via `LatencyReport`.      |
| 5  | `synos-insula`                 | Interoception                                   | System health awareness. Event-driven, not polling.                |
| 6  | `synos-corpus-callosum`        | Inter-hemisphere bridge                         | Red ↔ Blue team IPC, hemisphere coordination.                      |
| 7  | `synos-default-mode-network`   | Idle / consolidation                            | 30-second consolidation cycles when CPU load < 10%.                |
| 8  | `synos-glial`                  | Support / pruning                               | Adaptive caching, memory pruning. `MyelinCache::get()`.            |
| 9  | `synos-brainstem`              | Pipeline runtime                                | **Wires the eight peer crates into the live signal loop.**         |

A tenth crate — `synos-nucleus` — models root-of-trust governance per the biological metaphor.

The **signal flow** through brainstem runs:

```
external event
  → thalamic gate (relevance filter)
  → amygdala fast-path (sub-millisecond threat eval)
  → ALFRED full analysis (four-path fusion)
  → hippocampus storage (glial-accelerated cache)
```

The brainstem `VALIDATION.md` documents 17 critical API corrections that had to be applied across the crate interfaces — a measure of how much iteration went into making the nine anatomical regions actually speak to each other.

## Consciousness fusion — the four paths

Every incoming event goes through **all four** in parallel:

| Path | Speciality | Runs on | Implementation |
|------|------------|---------|---------------|
| **Traditional AI** | Known-unknown threats — signature matching, decision trees, Bayesian inference, rule engines | Every event | `consciousness_fusion::traditional` |
| **Neuromorphic SNN** | Temporal pattern recognition | Temporal anomalies | LIF / Izhikevich / Hodgkin-Huxley / AdEx / SRM models |
| **Quantum coherence** | Energy-topology anomaly detection | Kernel signals via the observability interface | Penrose-Hameroff Orch-OR, clock-edge collapse, fragment superposition |
| **TNGS** (neural Darwinism) | Novel attacks recognised by analogy | Idle consolidation cycles in the Default Mode Network | Edelman's Theory of Neuronal Group Selection |

A fifth path — the **MPS cortex** (`synos-cortex-q`) — is a tensor-network matrix-product-state inference path for high-dimensional pattern compression, added in v53.

Outputs are weighted by `ConsciousnessState` (coherence, activity, mode, decision latency) and combined into ALFRED's decisions.

## Four operating modes

| Mode         | Authority           | Use case                                             | Sandbox                                |
|--------------|---------------------|------------------------------------------------------|----------------------------------------|
| **Advisory** | Read-only           | Default. System inspection, recommendation only      | Full read-only ACLs                    |
| **GameMode** | Lab-scoped          | GRIMOIRE lab execution, contained per lab            | AppArmor `synos.grimoire.lab` + seccomp 18-syscall deny |
| **Master**   | Full execution      | Master ISO operators, C2 integration, fleet telemetry| No guardrails — Curtain v3 admin token required |
| **Mesh**     | Distributed         | Gossip protocol, distributed consciousness across ARCANUM | Tenant-scoped per peer       |

Mode switching:

```bash
synos-alfred-mode set advisory       # default
synos-alfred-mode set gamemode       # for labs
synos-alfred-mode set master         # full execution (Master ISO only)
synos-alfred-mode set mesh           # mesh consciousness
```

Every command on public profiles passes through `CommandSafetyChecker` before execution. On GoodLife profile, ALFRED is built with the `research-mode` cargo feature and loads `ResearchModeSettings` from `~/.config/alfred/research.toml`.

## REST API

Eleven endpoints exposed on `http://localhost:7437/v4/`:

| Endpoint                  | Purpose                                            |
|---------------------------|----------------------------------------------------|
| `GET  /health`            | Daemon health + brainstem signal-loop status       |
| `GET  /consciousness`     | Current `ConsciousnessState` snapshot              |
| `POST /event`             | Submit an event for fusion processing              |
| `GET  /metrics`           | Decision counters, latency histogram               |
| `GET  /memory`            | Hippocampus query interface                        |
| `POST /memory/consolidate`| Force a consolidation cycle                        |
| `GET  /amygdala`          | Active threat signatures                           |
| `GET  /cerebellum`        | Latency report                                     |
| `GET  /dmn`               | Default Mode Network status                        |
| `POST /mode`              | Set operating mode (Advisory/GameMode/Master/Mesh) |
| `GET  /godmode`           | Aggregate dashboard data                           |

## How to talk to ALFRED

```bash
synos-ops                    # multi-tab TUI
synos-alfred chat            # interactive Python chat layer
synos-alfred ask "..."       # one-shot query
synos-alfred status          # daemon + brain pipeline state
```

## Related reading

- **[Custom Kernel →](/architecture/kernel/)** — the kernel module interface ALFRED talks to
- **[ARCANUM Mesh →](/architecture/arcanum/)** — distributed consciousness federation
- **[Curtain →](/architecture/curtain/)** — capability gating between modes
