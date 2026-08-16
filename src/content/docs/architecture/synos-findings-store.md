---
tags: [general]
title: synos-findings-store — Security findings persistence
description: synos-findings-store — Security findings persistence
---
tags: [general]

# synos-findings-store — Security findings persistence

**Classification:** PUBLIC  
**Crate:** `fruit/crates/synos-findings-store/`  
**Milestone:** v61+  
**License:** Apache-2.0  
**Version:** v111.0.0 "Last Light"

## What It Is

`synos-findings-store` is an append-only JSONL sink and schema for cross-tool security findings, serving as the foundational data layer for the v61 Lockstep track I tooling cross-intelligence initiative. Every Syn_OS-shipped tool — nmap wrapper, sqlmap wrapper, GRIMOIRE wizard, ALFRED, `synos-doctor`, and build-pipeline gates — emits findings to a shared sink at `/var/log/synos/findings.jsonl`. Each finding is content-addressed by SHA-256 for trivial deduplication across the hive, and downstream consumers reason over the unified corpus.

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `sink` | Append-only JSONL writer with `fd-lock` advisory locking for concurrent large writes |
| `finding` | Core `Finding` type with severity, confidence, source tool, and content-addressed SHA-256 identity |
| `severity` | Severity tier enum (`Info`, `Low`, `Medium`, `High`, `Critical`) matching CVSS-aligned ladder |
| `confidence` | Confidence enum distinct from severity — `Low` heuristic match vs `High` signed PoC |
| `ocsf` | OCSF SIEM export bridge (`synos-findings-ocsf` binary) for v61 Lockstep Track I |
| `schema` | CycloneDX-Findings-inspired schema versioning |

### How It's Wired

1. **ALFRED** — Reads the JSONL sink to reason across all findings and suggest next operational moves.
2. **synos-doctor** — Uses findings as anomaly triggers (v65 Field Surgeon), alerting when tool behavior diverges from historical baselines.
3. **synos-cite** — Chains findings into RAG receipts (v66 Citation), making the JSONL corpus a retrieval target for LLM-assisted reporting.
4. **synos-attck** — Reverse-looksup findings by ATT&CK technique (v66), populating technique coverage matrices from persisted data.
5. **Public threat intel exchange** — v80 publishes opt-in findings to external consumers; `Severity` and `Confidence` filtering gate what is exported.
6. **Concurrency model** — `O_APPEND` writes are atomic on Linux for writes ≤ PIPE_BUF (4096 bytes). Larger records acquire `fd-lock` advisory locks. `SyslogSink` writes to `/dev/log` via Unix datagram socket (RFC 5424).

## Future Ideas

1. Add a `synos-findings-store-query` binary with SQL-like filtering over the JSONL corpus using `sqlx` + SQLite materialized views.
2. Implement a `finding.retention_policy` field with automatic compaction of expired findings below `Info` severity after 90 days.
3. Export findings to Elasticsearch/OpenSearch via a dedicated `synos-findings-store-es` module for SIEM integration.
