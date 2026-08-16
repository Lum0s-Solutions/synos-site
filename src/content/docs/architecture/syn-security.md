# syn-security — Security orchestration crate

**Classification:** PUBLIC  
**Crate:** `fruit/crates/syn-security/`  
**Milestone:** v4+  
**License:** Apache-2.0  
**Version:** v111.0.0 "Last Light"

## What It Is

`syn-security` is the security orchestration framework for Syn_OS, implementing authentication, cryptography, audit logging, input validation, and zero-trust networking primitives. It bridges the AI engine (`syn-ai`) into security policy decisions via a `consciousness_bridge` module, and provides both standard and quantum-resistant security enhancements through modular feature flags.

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `audit` | Audit logging subsystem for compliance and forensic trails |
| `auth` | Authentication framework with session management and policy enforcement |
| `consciousness_bridge` | Bridge between `syn-ai` neural states and security trust decisions |
| `crypto` | Cryptographic primitives for hashing, key derivation, and secure comparison |
| `ebpf_integration` | eBPF-based kernel-level monitoring via `libbpf-rs` (optional) |
| `encryption` | Symmetric and asymmetric encryption with ChaCha20-Poly1305 and AES-GCM |
| `enhanced_monitoring_minimal` | Minimal-footprint behavioral monitoring for constrained environments |
| `quantum_auth` | Quantum-resistant authentication primitives |
| `validation` | Input validation and sanitization framework |
| `zero_trust` | Zero-trust networking policies and service-mesh enforcement |
| `security_enhancements` | Behavioral analytics, anomaly detection, and adaptive trust levels |

### How It's Wired

1. **syn-ai consciousness bridge** — The `consciousness_bridge` module consumes `AIState` from `syn-ai` and translates neural activation levels and pattern counts into `TrustLevel` and anomaly scores, directly influencing zero-trust policy enforcement.
2. **eBPF live integration** — The `ebpf-integration` feature flag enables `libbpf-rs`-based kernel monitoring; `ebpf-live` (off-by-default) activates real ring-buffer readers once the data pipeline is fully wired.
3. **Quantum security** — `quantum-security` feature flag enables PQC auth paths that delegate to `synos-icarus` primitives in future milestones.
4. **Compliance crates** — `mssp-platform` and `blue-team-defense` feature bundles compose `audit-logging`, `threat-detection`, `quantum-security`, and `ebpf-integration` for MSSP operator profiles.

## Future Ideas

1. Replace the hand-rolled `security_enhancements` behavioral analytics with a dedicated `syn-security-behavior` crate backed by `synos-threat-hunting` timeline analysis.
2. Add `libbpf-rs` CO-RE (Compile Once — Run Everywhere) support so eBPF programs work across kernel versions without recompilation.
3. Expose `syn-security` event types via `synos-findings-store` so all security decisions are content-addressed and deduplicated across the hive.
