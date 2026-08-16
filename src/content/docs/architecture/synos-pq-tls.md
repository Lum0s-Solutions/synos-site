---
tags: [general]
title: synos-pq-tls — Post-quantum hybrid TLS defaults for Syn_OS services (v68 Bone Sigil Track G)
description: synos-pq-tls — Post-quantum hybrid TLS defaults for Syn_OS services (v68 Bone Sigil Track G)
---
tags: [general]

# synos-pq-tls — Post-quantum hybrid TLS defaults for Syn_OS services (v68 Bone Sigil Track G)

**Classification:** PUBLIC
**Crate:** `fruit/crates/synos-pq-tls/`
**Milestone:** v0+
**License:** Apache-2.0

## What It Is

`synos-pq-tls` Post-quantum hybrid TLS defaults for Syn_OS services (v68 Bone Sigil Track G).

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `PqTlsError` | `PqTlsError` module |
| `install_pq_provider` | `install_pq_provider` module |
| `pq_crypto_provider` | `pq_crypto_provider` module |
| `pq_crypto_provider_federation` | `pq_crypto_provider_federation` module |
| `pq_kx_groups_default` | `pq_kx_groups_default` module |
| `pq_kx_groups_federation` | `pq_kx_groups_federation` module |
| `assert_no_classical_only_groups` | `assert_no_classical_only_groups` module |
| `server_config_builder` | `server_config_builder` module |
| `client_config_builder` | `client_config_builder` module |
| `federation_client_config_builder` | `federation_client_config_builder` module |

### How It's Wired

1. **Internal** — self-contained crate

## Future Ideas

1. Expand module coverage and integration points
