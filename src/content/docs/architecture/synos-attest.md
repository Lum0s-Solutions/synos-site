---
tags: [general]
title: synos-attest — v46 Threadwalker — process-level LSM attestation (bprm_check_security hook)
description: synos-attest — v46 Threadwalker — process-level LSM attestation (bprm_check_security hook)
---
tags: [general]

# synos-attest — v46 Threadwalker — process-level LSM attestation (bprm_check_security hook)

**Classification:** PUBLIC
**Crate:** `fruit/crates/synos-attest/`
**Milestone:** v0+
**License:** MIT OR Apache-2.0

## What It Is

`synos-attest` v46 Threadwalker — process-level LSM attestation (bprm_check_security hook).

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `ExecMeasurement` | `ExecMeasurement` module |
| `compute_measurement` | `compute_measurement` module |
| `compute_entry_hmac` | `compute_entry_hmac` module |
| `LedgerEntry` | `LedgerEntry` module |
| `encode` | `encode` module |
| `decode` | `decode` module |
| `hmac_str` | `hmac_str` module |
| `AttestRing` | `AttestRing` module |
| `new` | `new` module |
| `push` | `push` module |

### How It's Wired

1. **Internal** — self-contained crate

## Future Ideas

1. Expand module coverage and integration points
