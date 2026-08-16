---
tags: [general]
title: synos-alpm-pin — SHA-256 content-pinning for pacman/ALPM packages — v69 Glasswing track A/G supply-chain trust
description: synos-alpm-pin — SHA-256 content-pinning for pacman/ALPM packages — v69 Glasswing track A/G supply-chain trust
---
tags: [general]

# synos-alpm-pin — SHA-256 content-pinning for pacman/ALPM packages — v69 Glasswing track A/G supply-chain trust

**Classification:** PUBLIC
**Crate:** `fruit/crates/synos-alpm-pin/`
**Milestone:** v0+
**License:** Apache-2.0

## What It Is

`synos-alpm-pin` SHA-256 content-pinning for pacman/ALPM packages — v69 Glasswing track A/G supply-chain trust.

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `PinEntry` | `PinEntry` module |
| `PinManifest` | `PinManifest` module |
| `new` | `new` module |
| `add_package` | `add_package` module |
| `verify_package` | `verify_package` module |
| `load` | `load` module |
| `save` | `save` module |
| `VerifyResult` | `VerifyResult` module |
| `is_permitted` | `is_permitted` module |
| `verdict` | `verdict` module |

### How It's Wired

1. **Internal** — self-contained crate

## Future Ideas

1. Expand module coverage and integration points
