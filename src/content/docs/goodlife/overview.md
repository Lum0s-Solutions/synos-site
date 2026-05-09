---
title: GoodLife AI Research ISO
description: GoodLife — the AI-research profile of Syn_OS. Same kernel, same Rust workspace, ALFRED in research-mode, Ollama pre-configured, no offensive tooling, no internet-facing services by default.
---

**GoodLife** is the AI-research profile of Syn_OS. Same custom 6.19-synos-ai kernel, same 160-crate Rust workspace, same Sanctum federation — but ALFRED is built with the `research-mode` cargo feature, Ollama is pre-configured offline-capable, and the offensive security tooling is gone. It is the right profile if you want a sovereign local AI lab without becoming a target by accident.

## What's in the box

| Component | What you get |
|-----------|--------------|
| **Kernel** | 6.19-synos-ai with `CONFIG_RUST=y`, 17 syscalls, 17 Rust modules — same as every other profile |
| **ALFRED** | v5.1, built with `research-mode` cargo feature; loads `ResearchModeSettings` from `~/.config/alfred/research.toml` |
| **Local LLMs** | Ollama pre-configured with `qwen2.5:7b` + `llama3.2:3b` (~6.5 GB pre-pulled in stage 12); ISO is offline-capable |
| **Notebook stack** | Jupyter Lab + JupyterText + Quarto, all locally hosted |
| **ML tooling** | PyTorch, TensorFlow, scikit-learn, polars, duckdb, sentence-transformers, transformers |
| **Vector DB** | LanceDB local + Qdrant containerised option |
| **RAG pipeline** | `synos-nlp-pipeline` + `synos-datalake` wired into ALFRED's hippocampus crate |
| **Voice** | whisper.cpp local transcription + Piper TTS |
| **Desktop** | Cinnamon DE with the GoodLife wallpaper set (`goodlife-abstract`, `goodlife-nebula`, `goodlife-space`) |
| **Bevy plugins** | Cutscene, Mindmap, RetroFilter, Cyberspace, SkillTree, Rehoboam, Twin (FactionHQ disabled — no GRIMOIRE on GoodLife) |

## What's not in the box (by design)

GoodLife is a research profile, not an offensive tools distro:

- **No GRIMOIRE labs** — the gamification stack is built but the lab catalogue is excluded
- **No offensive security tools** — no metasploit, no aircrack, no C2 frameworks
- **No internet-facing services** — sshd is disabled by default, Sanctum federation is opt-in
- **No telemetry** — local-first by construction; nothing leaves your machine without explicit consent
- **No cloud LLM defaults** — Ollama is the default; cloud backends (Claude / OpenAI / Gemini / DeepSeek) are off until you configure keys

## Sandbox model

GoodLife treats the ALFRED daemon as a **research participant**, not an admin tool. Mode is locked to **Advisory** by default:

```toml
# ~/.config/alfred/research.toml
[mode]
default = "advisory"
allow_promotion = false       # cannot escalate to GameMode/Master/Mesh

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

Curtain v3 enforces this from the kernel side: research-mode tokens cannot acquire claims for offensive syscalls or cross-tier federation peering.

## Salvaged-hardware mesh

GoodLife is the easiest entry point to the **ARCANUM Hive**: turn a stack of discarded laptops into a distributed inference mesh. The Salvage Yard quest arc lives in GRIMOIRE, but the underlying capability is a first-class GoodLife feature:

```bash
synos-hive-bootstrap --tier goodlife
synos-hive-add-node 10.66.0.42 --role inference
synos-hive-add-node 10.66.0.43 --role embedding
ollama serve --hive  # automatically shards across the mesh
```

A 4-node i5-class mesh outperforms a single mid-range workstation on memory-bound LLM workloads at near-zero hardware cost.

## What GoodLife is for

- **Local AI research** — sovereign LLM inference, no cloud bills, no telemetry
- **Federated inference experiments** — the mesh is the substrate
- **RAG / embedding pipelines** against your own corpus
- **Privacy-first job hunt / writing / chat** — context isolation by tenant
- **Teaching environment** for AI labs (Cognitive Warfare, AI Security in GRIMOIRE are not here, but `synos-bevy` and `synos-nlp-pipeline` are open for inspection)
- **Salvage operators** building a sustainable home/office AI stack

## What GoodLife is *not* for

- **Offensive cybersecurity work** — boot GRIMOIRE Public for that
- **Production multi-tenant SaaS** — boot Master with a customer agreement
- **Compliance-evidence generation** — Master ships the FedRAMP / CMMC / SOC2 control maps; GoodLife is research-only

## Getting started

1. Boot GoodLife (live or installed)
2. First-boot wizard runs ALFRED introduction in Advisory mode
3. Open Jupyter from the desktop, or `ollama run qwen2.5:7b` in a terminal
4. Optional: `synos-hive-bootstrap --tier goodlife` to add a second node

## Next: [Included Tools →](/goodlife/tools/)
