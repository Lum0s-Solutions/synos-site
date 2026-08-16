---
tags: [general]
title: synos-riftrunner — v52 Riftrunner — safe bytecode VM with verifier for client-uploaded policy probes
description: synos-riftrunner — v52 Riftrunner — safe bytecode VM with verifier for client-uploaded policy probes
---
tags: [general]

# synos-riftrunner — v52 Riftrunner — safe bytecode VM with verifier for client-uploaded policy probes

**Classification:** PUBLIC
**Crate:** `fruit/crates/synos-riftrunner/`
**Milestone:** v0+
**License:** MIT OR Apache-2.0

## What It Is

`synos-riftrunner` v52 Riftrunner — safe bytecode VM with verifier for client-uploaded policy probes.

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `OpClass` | `OpClass` module |
| `AluOp` | `AluOp` module |
| `JmpOp` | `JmpOp` module |
| `Instruction` | `Instruction` module |
| `decode` | `decode` module |
| `encode` | `encode` module |
| `is_exit` | `is_exit` module |
| `is_jump` | `is_jump` module |
| `jump_offset` | `jump_offset` module |
| `is_mem_access` | `is_mem_access` module |

### How It's Wired

1. **Internal** — self-contained crate

## Future Ideas

1. Expand module coverage and integration points
