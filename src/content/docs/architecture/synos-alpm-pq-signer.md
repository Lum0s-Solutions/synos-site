---
tags: [general]
title: synos-alpm-pq-signer — Hybrid RSA-3072 + ML-DSA-65 signature sidecars for pacman/ALPM packages (v61 Lockstep track G scaffold)
description: synos-alpm-pq-signer — Hybrid RSA-3072 + ML-DSA-65 signature sidecars for pacman/ALPM packages (v61 Lockstep track G scaffold)
---
tags: [general]

# synos-alpm-pq-signer — Hybrid RSA-3072 + ML-DSA-65 signature sidecars for pacman/ALPM packages (v61 Lockstep track G scaffold)

**Classification:** PUBLIC
**Crate:** `fruit/crates/synos-alpm-pq-signer/`
**Milestone:** v0+
**License:** Apache-2.0

## What It Is

`synos-alpm-pq-signer` Hybrid RSA-3072 + ML-DSA-65 signature sidecars for pacman/ALPM packages (v61 Lockstep track G scaffold).

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `PqSignature` | `PqSignature` module |
| `PqSidecar` | `PqSidecar` module |
| `HybridKeyPair` | `HybridKeyPair` module |
| `dev_from_seed` | `dev_from_seed` module |
| `generate` | `generate` module |
| `to_keyring` | `to_keyring` module |
| `from_keyring` | `from_keyring` module |
| `public_hex` | `public_hex` module |
| `sign_message` | `sign_message` module |
| `HybridVerifyingKey` | `HybridVerifyingKey` module |

### How It's Wired

1. **`synos-icarus`** — dependency integration

## Future Ideas

1. Expand module coverage and integration points
