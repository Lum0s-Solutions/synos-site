---
title: synos-attest-tpm2 — TPM2 attestation CLI
description: synos-attest-tpm2 — TPM2 attestation CLI
---

# synos-attest-tpm2 — TPM2 attestation CLI

**Classification:** PUBLIC  
**Crate:** `fruit/crates/synos-attest-tpm2/`  
**Milestone:** v42+  
**License:** Apache-2.0  
**Version:** v111.0.0 "Last Light"

## What It Is

`synos-attest-tpm2` is a TPM 2.0 PCR attestation CLI and library for Syn_OS, reading PCRs 0-7+14 via `tss-esapi` and producing serde-serialisable `AttestationReport` records that can be verified against operator-supplied `PcrPolicy` files. It gracefully degrades when no TPM hardware is present, returning `AttestResult::TpmUnavailable` instead of panicking. The crate replaces the legacy `synos-tpm-attest` envelope API via compatibility re-exports, making migration a simple crate-name change.

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `pcr` | PCR read path: `read_pcrs()` opens ESAPI context, reads PCRs 0-7+14, returns `PcrSet` |
| `report` | Attestation report generation (`attest`) and `AttestationReport` serde serialization |
| `policy` | `PcrPolicy` loader from TOML files and `verify()` pure-function policy checker |
| `findings` | Findings emission to `/var/log/synos/findings.jsonl` for integration with `synos-findings-store` |
| `compat` | Legacy API compatibility layer re-exporting `EnvelopeReport`, `produce_report_tpm`, `produce_report_simulated`, etc. |
| `error` | `AttestError` type with IO, TPM, and policy error variants |

### How It's Wired

1. **tss-esapi** — The `pcr` module uses `tss-esapi` (already a workspace dependency, zero new Cargo.lock entries) for hardware PCR reads. When `/dev/tpmrm0` or `/dev/tpm0` are absent, context open fails gracefully.
2. **synos-findings-store** — The `findings` module emits attestation results as structured findings to `/var/log/synos/findings.jsonl`, making TPM state observable to ALFRED, `synos-doctor`, and the security findings pipeline.
3. **Policy verification** — `verify()` is a pure function: it never performs I/O, making it safe to call from async contexts, test harnesses, and policy-as-code pipelines.
4. **Compatibility API** — `compat` re-exports the full `synos-tpm-attest` envelope API (`EnvelopeReport`, `PcrMeasurement`, `ReportMode`, `produce_report_simulated`, `produce_report_tpm`, `read_envelope_report`, `write_envelope_report`) so consumers migrate by changing only the crate name.
5. **TOML policy** — `toml` 0.8 parses operator-supplied `/etc/synos/attest-policy.toml` files into `PcrPolicy` structures for expected PCR value assertions.

## Future Ideas

1. Add `synos-attest-tpm2-remote` for TPM 2.0 remote attestation using the Attestation Key (AK) and EK certificate chain.
2. Implement `policy` as a Datalog-like DSL for complex PCR correlation rules across multiple boot events.
3. Wire attestation results into `synos-icarus` so that PQC key generation can be gated on verified TPM boot state.
