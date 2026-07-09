---
title: GoodLife Sovereign ISO
description: GoodLife — the full sovereign build of Syn_OS. Full ALFRED, full AI cortex, full ARCANUM mesh, the complete 245-crate stack, and a dedicated Research Division. Operational offensive tooling is not included. No telemetry, air-gap capable, local models.
---

**GoodLife** is the **full sovereign build** of Syn_OS. Same custom 7.0-synos-ai kernel, same 245-crate Rust workspace, the full ALFRED v6.0 daemon, the full AI cortex and dispatch, the complete ARCANUM mesh, and a dedicated **Research Division** (Jupyter, local models, ML lab) layered on top. **Operational offensive tooling is simply not included** — GoodLife is a complete AI-and-development platform, not an offensive-operations profile. It keeps Syn_OS's sovereign values — no telemetry, air-gap capable, local models by default — so you get a complete, self-owned platform without becoming a target by accident. Free for personal and sovereign use; commercial or organizational deployment requires a license.

## What's in the box

| Component | What you get |
|-----------|--------------|
| **Kernel** | 7.0-synos-ai with `CONFIG_RUST=y`, capability-gated signed Rust kernel modules — same as every other profile |
| **ALFRED** | v6.0, full daemon — full AI cortex, dispatch, and consciousness fusion, with a dedicated Research Division workspace added (not a capability-restricted build) |
| **Local LLMs** | Ollama pre-configured with `qwen2.5:7b` + `llama3.2:3b` (~6.5 GB pre-pulled in stage 12); ISO is offline-capable |
| **Notebook stack** | Jupyter Lab + JupyterText + Quarto, all locally hosted |
| **ML tooling** | PyTorch, TensorFlow, scikit-learn, polars, duckdb, sentence-transformers, transformers |
| **Vector DB** | LanceDB local + Qdrant containerised option |
| **RAG pipeline** | `synos-nlp-pipeline` + `synos-datalake` wired into ALFRED's hippocampus crate |
| **Voice** | whisper.cpp local transcription + Piper TTS |
| **Desktop** | Cinnamon DE with the GoodLife wallpaper set (`goodlife-abstract`, `goodlife-nebula`, `goodlife-space`) |
| **Bevy plugins** | Cutscene, Mindmap, RetroFilter, Cyberspace, SkillTree, Rehoboam, Twin (FactionHQ disabled — no GRIMOIRE on GoodLife) |

## What's not in the box (by design)

GoodLife is the full sovereign build, but it is **not** the offensive-operations profile. Operational offensive tooling is simply not part of the image:

- **No operational offensive tooling** — no live C2, no offensive kernel modules, no operations engine. The public images carry none of it; C2 framework binaries are scrubbed at build time.
- **No GRIMOIRE gamified lab catalogue** — the gamification stack is built, but the sandboxed lab catalogue and faction MMO ship on the GRIMOIRE Public profile, not here
- **No internet-facing services** — sshd is disabled by default, Sanctum federation is opt-in
- **No telemetry** — local-first by construction; nothing leaves your machine without explicit consent
- **No cloud LLM defaults** — Ollama is the default; cloud backends (Claude / OpenAI / Gemini / DeepSeek) are off until you configure keys

## The Research Division

GoodLife adds a dedicated **Research Division** — a Jupyter/local-model/ML workspace layered on top of the full ALFRED daemon. This is an **added workspace, not a capability restriction**: ALFRED runs at full capability on GoodLife (full AI cortex, dispatch, and consciousness fusion), and the Research Division is where you drive local models, notebooks, and experiments. Sovereign defaults keep everything local:

```toml
# ~/.config/alfred/research.toml
[backends]
default = "ollama"            # cloud backends optional, off by default
[[backends.allowed]]
name = "ollama"
[[backends.allowed]]
name = "llama-cpp"            # local fallback

[privacy]
job_hunt_mode = true          # privacy-first, no cross-context bleed
context_isolation = "tenant"  # each conversation is its own tenant
```

What GoodLife does **not** ship is operational offensive tooling. Curtain v4 holds the public images to a capability ceiling from the kernel side: GoodLife tokens cannot acquire the claims that would escalate the image to the licensed Enterprise Edition. Everything else Syn_OS can do is on the table.

## Salvaged-hardware mesh

GoodLife is the easiest entry point to the **ARCANUM Hive**: turn a stack of discarded laptops into a distributed inference mesh. The Salvage Yard quest arc lives in GRIMOIRE, but the underlying capability is a first-class GoodLife feature:

```bash
synos-hive-bootstrap --tier goodlife
synos-hive-add-node <mesh-ip> --role inference
synos-hive-add-node <mesh-ip> --role embedding
ollama serve --hive  # automatically shards across the mesh
```

A 4-node i5-class mesh outperforms a single mid-range workstation on memory-bound LLM workloads at near-zero hardware cost.

## What GoodLife is for

- **A complete sovereign platform** — the full 245-crate stack, full ALFRED, and the full AI cortex + dispatch, all self-owned
- **Local AI research** — sovereign LLM inference, no cloud bills, no telemetry
- **Federated inference experiments** — the mesh is the substrate
- **RAG / embedding pipelines** against your own corpus
- **Privacy-first job hunt / writing / chat** — context isolation by tenant
- **The Research Division** — Jupyter, local models, and the ML lab as a first-class workspace
- **Salvage operators** building a sustainable home/office AI stack

## What GoodLife is *not* for

- **Operational offensive tooling** — GoodLife ships none of it; sandboxed offensive *training* lives on GRIMOIRE Public
- **Production multi-tenant deployment** — multi-tenant ARCANUM federation and fleet management are **Enterprise Edition** capabilities, available under a commercial license
- **Compliance-evidence generation** — the **Enterprise Edition** ships the FedRAMP / CMMC / SOC2 control maps and ConMon evidence collector

## Getting started

1. Boot GoodLife (live or installed)
2. First-boot wizard runs the ALFRED introduction and sets up the Research Division
3. Open Jupyter from the desktop, or `ollama run qwen2.5:7b` in a terminal
4. Optional: `synos-hive-bootstrap --tier goodlife` to add a second node

## Next: [Included Tools →](/goodlife/tools/)
