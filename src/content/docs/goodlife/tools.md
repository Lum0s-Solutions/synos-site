---
title: Included Tools
description: The full GoodLife AI Research stack — Ollama, Jupyter, PyTorch, the synos-nlp-pipeline, voice transcription, and the offline ML toolchain.
---

GoodLife ships a curated AI research stack pre-configured and offline-capable on first boot. Everything below is included by default; you don't need to `pacman -S` your way through a setup. All tooling is local-first; no telemetry, no cloud defaults.

## Local LLM inference

| Tool                | Notes                                                         |
|---------------------|---------------------------------------------------------------|
| **Ollama**          | Pre-configured. `qwen2.5:7b` and `llama3.2:3b` pre-pulled (~6.5 GB) — usable offline on first boot |
| **llama-cpp**       | Fallback inference engine for restricted-RAM nodes            |
| **vLLM** (opt-in)   | High-throughput batching server for multi-user setups         |
| **synos-cortex-q**  | v53 Quantumweave MPS (matrix-product-state) inference path    |

```bash
ollama run qwen2.5:7b              # interactive chat, local
ollama list                        # see what's pulled
synos-alfred chat --backend ollama # ALFRED on top of Ollama
```

## Notebook & analysis

| Tool          | Use                                                |
|---------------|----------------------------------------------------|
| **JupyterLab**| Default notebook IDE, pre-configured kernels       |
| **Quarto**    | Reproducible analysis docs, publish to PDF/HTML    |
| **VSCodium**  | Editor with notebook support                       |
| **Polars**    | DataFrames — faster than pandas for large data     |
| **DuckDB**    | In-process OLAP database; SQL on parquet/arrow     |
| **Pandas**    | Available; not the default for new code            |

## Deep learning frameworks

| Framework          | Notes                                       |
|--------------------|---------------------------------------------|
| **PyTorch**        | Default. CUDA + ROCm + CPU builds available  |
| **TensorFlow**     | Available                                   |
| **JAX + Flax**     | Available                                   |
| **scikit-learn**   | Classical ML                                |

GPU support is automatic when a discrete GPU is present; CPU-only is the fallback path. The Salvage Yard mesh deployment scenario (4× i5-class laptops, no GPU) is a first-class supported config.

## NLP & embeddings

| Tool                          | Notes                                          |
|-------------------------------|------------------------------------------------|
| **Transformers (HF)**         | Hugging Face model hub client + local cache    |
| **sentence-transformers**     | Embedding models with offline cache            |
| **synos-nlp-pipeline**        | Syn_OS-native pipeline with hippocampus integration |
| **synos-datalake**            | Curated local corpus for RAG                   |
| **LanceDB**                   | Embedded vector DB                             |
| **Qdrant** (containerised)    | Standalone vector DB option                    |

## Voice & audio

| Tool          | Use                                            |
|---------------|------------------------------------------------|
| **whisper.cpp** | Local speech-to-text — fast on CPU            |
| **Piper TTS**   | Local text-to-speech                          |
| **PortAudio + SoX** | Audio capture / processing                |

ALFRED in GoodLife defaults to text I/O; voice is opt-in.

## ALFRED (research-mode)

```toml
# ~/.config/alfred/research.toml
[mode]
default = "advisory"
allow_promotion = false

[backends]
default = "ollama"

[privacy]
job_hunt_mode = true
context_isolation = "tenant"
```

Cloud backends (Claude, OpenAI, Gemini, DeepSeek) are **available** — but off until you configure keys. Privacy-first job-hunt mode keeps each conversation in its own tenant scope so résumé context doesn't bleed into general chat.

## Mesh tooling (ARCANUM Hive)

| Tool                              | Use                                                   |
|-----------------------------------|-------------------------------------------------------|
| **synos-hive-bootstrap**          | Bring up a mesh from an empty node (Stoneglass v55)   |
| **arcanum-controller** (k8s)      | Workload scheduler across the mesh                    |
| **Tailscale + WireGuard**         | Mesh transport                                        |
| **Ollama hive mode**              | Sharded inference across mesh nodes                   |

## Bevy desktop plugins (GoodLife subset)

| Plugin             | Function                                              |
|--------------------|-------------------------------------------------------|
| **Cutscene**       | Typewriter dialogue / onboarding                      |
| **Mindmap**        | Visualise concept graphs from notes / transcripts     |
| **RetroFilter**    | Aesthetic CRT/scan-line overlay (toggle)              |
| **Cyberspace**     | 3D file/process visualisation                         |
| **SkillTree**      | Capability map (research-mode variant)                |
| **Rehoboam**       | System monitor overlay (CPU/RAM/GPU/inference stats)  |
| **Twin** *(v51)*   | Digital-twin substrate visualisation                  |

The **FactionHQ** plugin is disabled on GoodLife (no GRIMOIRE faction system on this profile).

## What's *not* installed (by design)

- offensive security tooling (metasploit, aircrack, the C2 frameworks)
- Distrobox/BlackArch on-demand expansion (Enterprise Edition only)
- the GRIMOIRE lab catalogue
- operational offensive tooling — no live C2, no operations engine (scrubbed from the public images)

If you want any of these, you're in the wrong profile — see [Three ISOs](/guides/download/).

## Where to dig in next

- **[GoodLife Overview →](/goodlife/overview/)** — what this profile is for
- **[ARCANUM Mesh →](/architecture/arcanum/)** — distributing inference across salvaged hardware
- **[ALFRED →](/architecture/alfred/)** — the consciousness fusion engine in research-mode
