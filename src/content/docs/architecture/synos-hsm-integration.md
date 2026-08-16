---
tags: [general]
title: synos-hsm-integration — Hardware Security Module integration for Syn_OS
description: synos-hsm-integration — Hardware Security Module integration for Syn_OS
---
tags: [general]

# synos-hsm-integration — Hardware Security Module integration for Syn_OS

**Classification:** PUBLIC
**Crate:** `fruit/crates/synos-hsm-integration/`
**Milestone:** v1+
**License:** MIT OR Apache-2.0

## What It Is

`synos-hsm-integration` Hardware Security Module integration for Syn_OS.

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `secure_storage` | `secure_storage` module |
| `sgx` | `sgx` module |
| `tpm` | `tpm` module |
| `yubikey` | `yubikey` module |

### How It's Wired

1. **Internal** — self-contained crate

## Future Ideas

1. Expand module coverage and integration points
