---
title: "synos-art — v67 Wirewalker Track F — Atomic Red Team wrapper: run ART test IDs, map to ATT&CK, pipe results into synos-findings-store"
description: "synos-art — v67 Wirewalker Track F — Atomic Red Team wrapper: run ART test IDs, map to ATT&CK, pipe results into synos-findings-store"
---

# synos-art — v67 Wirewalker Track F — Atomic Red Team wrapper: run ART test IDs, map to ATT&CK, pipe results into synos-findings-store

**Classification:** PUBLIC
**Crate:** `fruit/crates/synos-art/`
**Milestone:** v0+
**License:** Apache-2.0

## What It Is

`synos-art` v67 Wirewalker Track F — Atomic Red Team wrapper: run ART test IDs, map to ATT&CK, pipe results into synos-findings-store.

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `models` | ! # synos-art — v67 Wirewalker Track F ! ! Atomic Red Team (ART) test wrapper. Parses ART test IDs (`T1059.001#1`), !... |
| `runner` | `runner` module |

### How It's Wired

1. **`synos-attck`** — dependency integration
2. **`synos-findings-store`** — dependency integration

## Future Ideas

1. Expand module coverage and integration points
