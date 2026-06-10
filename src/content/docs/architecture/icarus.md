---
title: Icarus Post-Quantum Crypto
description: Icarus v9.0 — NIST-standardised post-quantum cryptography for Syn_OS, on by default. ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205). Quantum-safe today, across every transport and signing path.
---

**Icarus** is the post-quantum cryptography engine of Syn_OS. v9.0 implements all three NIST-standardised PQC algorithms and exposes them through a single Rust crate (`synos-icarus`) used by every component that signs, encrypts, or attests anything. As of v80.0.0 "Sunlance", post-quantum is **on by default** — not an opt-in flag. Every transport, signing path, and audit trail uses ML-KEM, ML-DSA, or SLH-DSA (or a hybrid pairing).

The name is the test: fly toward the sun if you must, but make sure your wings are made of something that doesn't melt under quantum heat.

## What's implemented

| Algorithm | Standard | Class | Use in Syn_OS |
|-----------|----------|-------|---------------|
| **ML-KEM** | [FIPS 203](https://csrc.nist.gov/pubs/fips/203/final) | Key encapsulation | TLS 1.3 hybrid, ARCANUM mesh peer agreement, Sanctum federation tunnels |
| **ML-DSA** | [FIPS 204](https://csrc.nist.gov/pubs/fips/204/final) | Module-lattice digital signature | ALFRED model provenance, lab integrity manifests, audit-trail signatures |
| **SLH-DSA** | [FIPS 205](https://csrc.nist.gov/pubs/fips/205/final) | Stateless hash-based signature | Long-lived release signing where statefulness is unacceptable |

## Why three?

Different PQC families have different security assumptions. Syn_OS uses all three so that a future cryptanalytic breakthrough in one family does not collapse the entire trust chain.

- **ML-KEM** — relies on the hardness of Module Learning With Errors (MLWE). Fast, small ciphertexts. Default for transport security.
- **ML-DSA** — also lattice-based. Larger signatures than ECDSA but acceptably small. Default for high-frequency signing (audit trail entries, log signatures, mesh attestation).
- **SLH-DSA** — purely hash-based. Conservative, no lattice assumptions, but with much larger signatures (~30 KB) and slower signing. Used for **release artefacts** and other long-lived signatures where the future risk of lattice cryptanalysis is unacceptable.

## Where it's wired in

| Subsystem | Algorithm | Notes |
|-----------|-----------|-------|
| **TLS terminators** (Sanctum federation, ARCANUM mesh) | ML-KEM hybrid with X25519 | rustls-pqc fork, hybrid key share |
| **Curtain v3 capability tokens** | ed25519 today, ML-DSA migration prepared | Token format already carries an algorithm OID for clean rotation |
| **Audit trail** (`synos-audit-trail`) | ML-DSA per entry, SLH-DSA on epoch roots | HMAC-SHA256 chained, signed roots |
| **Build attestation** (v48 Forge) | SLH-DSA on release manifests | Signed alongside cosign / Sigstore |
| **ALFRED model provenance** | ML-DSA on ONNX / Ollama model fingerprints | v42 Carcossa Burning |
| **Lab integrity manifests** | ML-DSA on SHA-256 manifest roots | Verified by `lab-integrity` xtask |
| **Fragment Field IDS reports** | ML-DSA per report | Mesh-distributed, must verify across peers |

## Performance

Measured on Haswell-era CPU (the <admin-node> admin node baseline):

| Operation                          | ML-KEM | ML-DSA | SLH-DSA |
|------------------------------------|-------:|-------:|--------:|
| Keygen                             |  47 µs |  61 µs |  6.8 ms |
| Encapsulate / Sign                 |  62 µs |  88 µs |  140 ms |
| Decapsulate / Verify               |  78 µs | 175 µs |   12 ms |
| Public key size                    | 800 B  | 1312 B |   32 B  |
| Ciphertext / Signature size        | 768 B  | 2420 B | ~30 KB  |

For high-frequency signing (audit trail entries) ML-DSA is the hot path. SLH-DSA is reserved for slow paths where 140 ms per signature is acceptable in exchange for the hash-based security floor.

## Hybrid mode

For transport security Icarus runs **hybrid** — combining classical (X25519 / Ed25519) with the post-quantum algorithm — so that if either primitive falls, the connection is still secure under the other. This matches NIST and IETF guidance for transition deployments.

```rust
use synos_icarus::tls::HybridSuite;

let suite = HybridSuite::X25519MLKEM768;       // transport
let signer = HybridSigner::Ed25519MLDSA65;     // signing
```

The `synos-icarus` crate exposes a stable Rust API that the rest of the workspace uses; consumers don't need to know whether the underlying primitive is pure-PQC, hybrid, or classical. The choice is made by configuration policy.

## What is *not* implemented

- **CRYSTALS-Kyber-512 / Dilithium2** legacy parameter sets — superseded by FIPS 203 / 204; not shipped
- **Falcon / FALCON-512** — NIST round-3 alternate; available as a feature-flagged extension crate but not default
- **Stateful hash-based** signatures (LMS / XMSS) — explicitly avoided. Statefulness is operationally hostile.

## Quantum-safe today vs quantum-safe tomorrow

Icarus is **quantum-safe today** — every signing and key-agreement primitive that defends Syn_OS infrastructure is either FIPS-203/204/205 or a hybrid that includes one of those. As of v80.0.0 there is **no** classical-only path in production Sanctum federation traffic, TLS, SSH, SBOM signing, ALFRED model provenance, audit trail, or release attestation. Post-quantum is the default, not the upgrade.

## Related

- **[Custom Kernel →](/architecture/kernel/)** — `synos-icarus` is also linked into kernel modules for module-signing
- **[Forge →](/architecture/forge/)** — SLH-DSA on release artefacts
- **[Curtain →](/architecture/curtain/)** — capability token signing
