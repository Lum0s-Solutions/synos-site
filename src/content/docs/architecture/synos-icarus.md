---
tags: [general]
title: synos-icarus — Icarus flight system
description: synos-icarus — Icarus flight system
---
tags: [general]

# synos-icarus — Icarus flight system

**Classification:** PUBLIC  
**Crate:** `fruit/crates/synos-icarus/`  
**Milestone:** v9+  
**License:** MIT OR Apache-2.0  
**Version:** v111.0.0 "Last Light"

## What It Is

`synos-icarus` is the post-quantum cryptography crate for Syn_OS v9.0, implementing NIST-standardized PQC algorithms: ML-KEM (CRYSTALS-Kyber, FIPS 203), ML-DSA (CRYSTALS-Dilithium, FIPS 204), and SLH-DSA (SPHINCS+, FIPS 205) via PQClean bindings. It provides hybrid classical + post-quantum modes for defense-in-depth, key exchange protocols, TLS integration, and quantum-safe disk encryption. The crate uses `synos-upside-down` for SIMD acceleration and respects `synos-build-profile` feature gates.

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `lattice` | Lattice-based cryptography: ML-KEM (Kyber) key encapsulation and ML-DSA (Dilithium) digital signatures |
| `hash_sig` | Hash-based signatures: SLH-DSA / SPHINCS+ stateless hash-based signing |
| `hybrid` | Hybrid classical + post-quantum modes combining X25519/Ed25519 with PQC primitives |
| `kex` | Key exchange protocols including X25519-Kyber hybrid KEX |
| `tls` | Post-quantum TLS 1.3 integration points |
| `disk` | Quantum-safe disk encryption primitives |

### How It's Wired

1. **PQClean bindings** — `pqcrypto-mldsa`, `pqcrypto-mlkem`, `pqcrypto-sphincsplus`, and `pqcrypto-traits` provide the real implementations, replacing earlier hand-rolled stubs in `lattice/` and `hash_sig/`.
2. **Classical crypto** — `x25519-dalek` and `aes-gcm` provide the classical half of hybrid modes; `sha2` and `sha3` provide hash-based key derivation.
3. **SIMD acceleration** — `synos-upside-down` (optional) accelerates lattice polynomial operations via AVX2/NEON intrinsics, wired through the `hybrid` module.
4. **Build profile** — `synos-build-profile` (optional) provides `god-mode` feature gating; the `SecurityLevel` enum (Level1, Level3, Level5) maps to NIST security categories.
5. **syn-security integration** — `quantum_auth` in `syn-security` delegates to `synos-icarus` primitives for quantum-resistant authentication flows.

## Future Ideas

1. Add a `synos-icarus-tpm` module that seals PQC private keys to TPM2 PCRs via `synos-attest-tpm2`.
2. Implement `tls` module as a `rustls` post-quantum signature provider for server authentication.
3. Benchmark hybrid KEX against classical X25519 and publish latency/throughput curves for operator guidance.
