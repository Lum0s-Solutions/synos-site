# synos-threat-intel — Threat intelligence processing

**Classification:** PUBLIC  
**Crate:** `fruit/crates/synos-threat-intel/`  
**Milestone:** v1+  
**License:** MIT OR Apache-2.0  
**Version:** v111.0.0 "Last Light"

## What It Is

`synos-threat-intel` integrates multiple threat intelligence feed sources into the Syn_OS security pipeline, normalizing IOCs (Indicators of Compromise) from MISP, AlienVault OTX, abuse.ch (URLhaus, Feodo, SSL Blacklist), and custom feeds into a unified schema. It performs cross-tool IOC correlation against persisted findings and exposes correlation results for downstream consumers like `synos-threat-hunting`.

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `abusech_connector` | Connector for abuse.ch feeds (URLhaus, Feodo, SSL Blacklist) |
| `misp_connector` | MISP platform connector for event and attribute ingestion |
| `otx_connector` | AlienVault OTX connector for pulse and indicator retrieval |
| `connectors` | Unified connector framework for feed management and scheduling |
| `correlate` | IOC correlation engine matching threat intel against persisted findings |
| `ioc` | Core `IOC` type definitions, hashing, and taxonomy (`IOCType`, `ThreatSeverity`) |

### How It's Wired

1. **synos-findings-store** — The `correlate` module reads from the append-only JSONL sink at `/var/log/synos/findings.jsonl`, matching feed IOCs against stored findings and emitting enriched correlation records. This is the v67 Wirewalker Track I integration.
2. **VirusTotal URL ID encoding** — `base64` is used to encode URL identifiers for VirusTotal API queries, wired through the `connectors` module.
3. **Regex IOC extraction** — The `regex` crate extracts structured IOCs from unstructured text (log files, threat reports) before persisting normalized records.
4. **Dual CLI surface** — The `synos-threat-intel` binary handles feed polling, while `synos-threat-intel-correlate` is a dedicated correlation runner for cron/CI integration.

## Future Ideas

1. Add a `synos-threat-intel-stix` module for STIX 2.1 bundle export/import to interoperate with enterprise TIPs.
2. Implement feed caching with `sqlx` + SQLite so operators can run offline and replay feeds on reconnect.
3. Wire `correlate` results back into `synos-vuln-research` as `FuzzingEngine` input seeds for targeted fuzzing campaigns.
