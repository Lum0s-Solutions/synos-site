---
title: Using AI Features
description: A tour of ALFRED — the local AI daemon on every Syn_OS install — from the command line, the desktop widget, and the synos-ops Models tab.
---

This tutorial introduces ALFRED — the local AI daemon that ships with every
Syn_OS install — and shows you how to interact with it from the command
line, the desktop widget, and the `synos-ops` Models tab.

## What You'll Learn

- What ALFRED is and what runs locally on your machine.
- How to chat with ALFRED from the CLI and the desktop widget.
- How to use **research mode** for long-form investigation.
- How to query the local knowledge base.
- How to manage Ollama models from `synos-ops`.
- How to enable voice input where hardware permits.

## Prerequisites

- A Syn_OS installation (Master, GRIMOIRE Public, GoodLife, or Church of Malware).
- 8+ GB free RAM for LLM inference (16 GB recommended for anything larger than a 7B model).
- A discrete NVIDIA or AMD GPU for accelerated inference — CPU-only mode works everywhere, just slower.

---

## 1. What Is ALFRED

**ALFRED** (v6.0 as of the current release) is the AI daemon at the heart of
Syn_OS's security-assistant surface. It runs as a per-user
`systemd --user` service and owns several subsystems:

- **Consciousness fusion engine** — routes queries across parallel
  processing paths (traditional inference, neuromorphic/spiking
  approximations, and other fusion layers described in the
  [ALFRED architecture doc](/architecture/alfred/)).
- **Knowledge base** — a local vector store plus metadata index.
- **Model manager** — wraps Ollama to pull, pin, and version-check local LLMs.

ALFRED listens on a local Unix socket and exposes a small local API for
clients like the desktop widget and `synos-ops`.

Check the daemon is healthy:

```bash
systemctl --user status alfred
alfred status
```

`alfred status` prints the active model, RAM footprint, knowledge-base size,
and which fusion layers are available.

---

## 2. CLI Interaction

```bash
# Simple query
alfred ask "Explain the Spectre v1 attack in two paragraphs."

# Pipe a file in as context
cat report.md | alfred ask --stdin "Summarise this report in five bullet points."

# Multi-turn session (REPL)
alfred chat

# Stream output token-by-token
alfred ask --stream "Write a Python script that scans for open SMB shares."
```

Useful flags:

- `--model <name>` — override the active model for one invocation.
- `--temperature <n>` — `0.0` deterministic, `0.7` creative.
- `--no-kb` — skip the knowledge-base lookup and talk to the raw model.
- `--json` — machine-readable output.

Set your preferred defaults in `~/.config/alfred/client.toml` rather than
passing flags every time.

---

## 3. The Desktop Widget

Cinnamon (the default desktop) includes a persistent ALFRED chat widget in
the system tray. Click the phoenix icon, or use your configured shortcut, to
bring up the chat window. It shares state with the CLI — a question asked in
one shows up in the other's history.

---

## 4. Research Mode

For long-form investigation, ALFRED has a research mode that opens a durable
session and logs every prompt/response for later export:

```bash
# Start a named session
alfred research start forensics-case-042

# Ask questions — each one is logged
alfred research ask "What indicators should I look for on a compromised SSH server?"

# Attach a file to the running session
alfred research attach /var/log/auth.log

# Export as Markdown for a report
alfred research export forensics-case-042 --format markdown > case-042.md

# Close the session
alfred research close forensics-case-042
```

This is a good fit for incident response, literature review, and anything
where you want a reproducible audit trail.

---

## 5. Knowledge Base Queries

```bash
# Index a single file
alfred kb add ~/notes/pentest-methodology.md

# Index a directory recursively
alfred kb add ~/reports --recursive

# List what's indexed
alfred kb list

# Search the KB directly, bypassing the fusion engine
alfred kb search "privilege escalation Linux sudo"
```

KB lookups happen automatically on every `alfred ask` unless you pass
`--no-kb`.

---

## 6. Ollama Integration and the `synos-ops` Models Tab

The `synos-ops` TUI dashboard has a **Models** tab showing installed models,
disk usage, and provenance verification status. From the command line:

```bash
alfred models pull llama3.1:8b-instruct-q4_K_M
alfred models list
alfred models default llama3.1:8b-instruct-q4_K_M
alfred models rm llama3.1:70b-instruct-q4_K_M
alfred models verify   # checks each model's hash against the pinned manifest
```

---

## 7. Voice Input (Where Hardware Supports It)

On systems with a working microphone, ALFRED can accept voice input via a
local Whisper-based transcription pipeline:

```bash
alfred voice enable       # grants mic access + pulls the whisper model
alfred voice model whisper-medium   # swap the default model
alfred voice disable
```

Voice runs entirely locally — no audio leaves the machine.

---

## 8. Privacy and Local-Only Operation

Everything above runs on your machine. ALFRED does not phone home by
default. The only network egress the daemon performs by default is optional
threat-intel feed refresh and explicit Ollama/voice model pulls. Disable the
threat-intel refresh for a fully air-gapped setup:

```bash
alfred config set threat_intel.enabled false
```

---

## Troubleshooting

**`alfred: unable to connect to daemon`.** The user service isn't running:
`systemctl --user start alfred`, then check `journalctl --user -u alfred`.

**Responses are slow on the first query.** The fusion engine is loading the
model into memory; subsequent queries reuse it.

**`alfred models verify` reports a mismatch.** Either the manifest is stale
(`alfred models verify --refresh-manifest`) or the model file was tampered
with — delete it and re-pull.

**GPU not used even though I have one.** Check the `compute` field in
`alfred status`. `cpu-only` means drivers are missing or Ollama was built
without CUDA/ROCm — reinstall the matching `ollama-cuda` / `ollama-rocm`
pacman package and restart the daemon.

## Related Tutorials

- [First Security Scan](/user-guide/tutorials/first-security-scan/) — ask ALFRED to interpret scan output.
- [Customizing Your Desktop](/user-guide/tutorials/customizing-desktop/) — change the ALFRED widget theme.
- [Benchmarking](/user-guide/tutorials/benchmarking/) — measure inference latency across models.
