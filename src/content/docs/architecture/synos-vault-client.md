---
title: synos-vault-client — Vault client integration
description: synos-vault-client — Vault client integration
---

# synos-vault-client — Vault client integration

**Classification:** PUBLIC  
**Crate:** `fruit/crates/synos-vault-client/`  
**Milestone:** v1+  
**License:** MIT OR Apache-2.0  
**Version:** v111.0.0 "Last Light"

## What It Is

`synos-vault-client` is a production-ready HashiCorp Vault integration for Syn_OS secret management, providing multiple authentication methods (Token, AppRole, Kubernetes), KV v2 secrets engine support with versioning, dynamic secret generation, automatic token renewal, and secret rotation capabilities. It uses `secrecy` for in-memory secret protection and `zeroize` for secure key material cleanup, with a caching layer built on `DashMap` for high-concurrency read paths.

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `auth` | Authentication framework with `TokenManager`, `AuthMethod` (Token, AppRole, Kubernetes), and automatic renewal |
| `secrets` | KV v2 secret manager with versioning, metadata, and `SecretVersion` tracking |
| `dynamic` | Dynamic secret manager for database credentials, AWS keys, and other lease-based secrets |
| `error` | Vault-specific error types (`VaultError`) with retry-able classification |
| `http` | HTTP transport layer (private) with TLS verification, CA cert support, and request signing |

### How It's Wired

1. **Auth methods** — `AuthMethod` enum supports Token, AppRole, and Kubernetes auth, each gated by a feature flag (`auth-token`, `auth-approle`, `auth-kubernetes`). Default build enables all three.
2. **Secret lifecycle** — `SecretManager` wraps KV v2 operations with version awareness; `DynamicSecretManager` handles lease renewal and revocation for time-bound credentials.
3. **Concurrency** — `DashMap` provides lock-free read caching for frequently accessed secrets; `tokio::RwLock` guards mutable Vault client state.
4. **Security primitives** — `secrecy::SecretString` prevents accidental secret logging; `zeroize` ensures key material is scrubbed from stack memory on drop.
5. **TLS** — `VaultConfig` supports custom CA certs, client certificates, and optional TLS verification toggle for development environments.

## Future Ideas

1. Add a `synos-vault-client-transit` module for Vault Transit Secrets Engine (encryption-as-a-service) integration.
2. Implement a `synos-vault-client-agent` sidecar that caches and renews secrets locally, reducing Vault server round-trips.
3. Wire `synos-vault-client` into `syn-security` so that `encryption` module keys are sourced from Vault with automatic rotation.
