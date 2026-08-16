---
title: common — Common utilities for Syn_OS
description: common — Common utilities for Syn_OS
---

# common — Common utilities for Syn_OS

**Classification:** PUBLIC
**Crate:** `fruit/crates/common/`
**Milestone:** v4+
**License:** MIT OR Apache-2.0

## What It Is

`common` Common utilities for Syn_OS.

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `config` | ! # Syn_OS Common Utilities ! ! Shared infrastructure used across all Syn_OS crates: configuration ! management, stru... |
| `error` | Structured error types with `thiserror` integration. |
| `logging` | Lightweight logger with level-based output. |
| `metrics` | Basic system metrics collection (CPU, memory, consciousness). |
| `performance_minimal` | `no_std`-compatible performance optimization primitives. |

### How It's Wired

1. **Internal** — self-contained crate

## Future Ideas

1. Expand module coverage and integration points
