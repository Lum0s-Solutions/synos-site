# synos-package-manager — Package management abstraction

**Classification:** PUBLIC  
**Crate:** `fruit/crates/synos-package-manager/`  
**Milestone:** v1+  
**License:** MIT OR Apache-2.0  
**Version:** v111.0.0 "Last Light"

## What It Is

`synos-package-manager` is a high-performance, Rust-based package management abstraction for Syn_OS, handling package discovery, dependency resolution, installation, rollback, and security validation. It supports multiple repository sources, GPG signature verification, parallel download/install pipelines, and integrates with the build system for reproducible installs. A consciousness integration module hooks package operations into the broader Syn_OS AI ecosystem.

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `core` | Core `Package`, `PackageManager`, `PackageSource`, and `PackageStatus` types |
| `repository` | Repository manager for multi-source package discovery and metadata caching |
| `dependency` | Graph-based dependency resolver using `petgraph` for conflict detection and topological ordering |
| `install` | Installation engine with parallel download, extraction, and verification pipelines |
| `rollback` | Rollback manager with snapshot-based system state recovery |
| `security` | Security validator for GPG signatures, hash verification, and capability whitelisting |
| `cli` | Rollback command definitions for the `synos-pkg` CLI binary |
| `consciousness` | Consciousness integration layer reporting package operation metrics to `syn-ai` |
| `build_integration` | Build system hooks for workspace-level feature orchestration and reproducible builds |

### How It's Wired

1. **syn-ai consciousness** — The `consciousness` module reports `PerformanceMetrics` (operation duration, memory, cache hit ratio) back to the AI engine, allowing it to optimize repository selection and parallel download counts over time.
2. **Security validation** — The `security` module validates package signatures using `ring` for Ed25519/RSA verification, with `SecurityLevel` enum (`Minimal`, `Standard`, `Enhanced`, `Paranoid`) controlling strictness.
3. **Database layer** — Dual storage: `sqlx` + SQLite for async metadata queries and `rusqlite` for synchronous index operations, both using `bundled` SQLite for portability.
4. **Archive support** — `tar`, `flate2`, and `xz2` handle package extraction; `blake3` provides fast content hashing for cache keys.

## Future Ideas

1. Add a `synos-package-manager-sandbox` module that installs packages into isolated Bubblewrap/WASM environments for pre-flight validation.
2. Implement delta-patching using `xz2` block-level diff to reduce bandwidth for large package updates.
3. Expose a `synos-raas-api` endpoint for MSSP clients to query package compliance status across managed tenants.
