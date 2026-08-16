---
title: synos-kernel-process — Syn_OS kernel process management reference logic — PCB, MLFQ scheduler, context switching (std-testable); real asm context switch is kernel-build only
description: synos-kernel-process — Syn_OS kernel process management reference logic — PCB, MLFQ scheduler, context switching (std-testable); real asm context switch is kernel-build only
---

# synos-kernel-process — Syn_OS kernel process management reference logic — PCB, MLFQ scheduler, context switching (std-testable); real asm context switch is kernel-build only

**Classification:** PUBLIC
**Crate:** `fruit/crates/synos-kernel-process/`
**Milestone:** v0+
**License:** MIT OR Apache-2.0

## What It Is

`synos-kernel-process` Syn_OS kernel process management reference logic — PCB, MLFQ scheduler, context switching (std-testable); real asm context switch is kernel-build only.

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `ProcessStats` | `ProcessStats` module |
| `ProcessManager` | `ProcessManager` module |
| `init` | `init` module |
| `get` | `get` module |
| `start` | `start` module |
| `stop` | `stop` module |
| `create_process` | `create_process` module |
| `terminate_process` | `terminate_process` module |
| `get_process` | `get_process` module |
| `current_process` | `current_process` module |

### How It's Wired

1. **`synos-kernel-memory`** — dependency integration

## Future Ideas

1. Expand module coverage and integration points
