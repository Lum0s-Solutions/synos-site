---
tags: [general]
title: synos-hydra — Multi-head coordination runtime
description: synos-hydra — Multi-head coordination runtime
---
tags: [general]

# synos-hydra — Multi-head coordination runtime

**Classification:** PUBLIC  
**Crate:** `fruit/crates/synos-hydra/`  
**Milestone:** v7+  
**License:** MIT OR Apache-2.0  
**Version:** v111.0.0 "Last Light"

## What It Is

`synos-hydra` is the sovereign mesh VPN and zero-trust networking runtime for Syn_OS, implementing the "Three Pillars of the Sanctum" architecture: a Sovereign Keyring for portable trusted computing, a Scavenged Substrate for dormant node lifecycle management, and a Cryptographic Mesh for Headscale/WireGuard connectivity. It coordinates the Warden alpha node, Trinity beta/gamma/delta Proxmox nodes, and Astral Shells (Windows endpoints) into a single resilient network fabric.

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `keyring` | Sovereign Keyring (Pillar I): pSLC + Argon2id + FIDO2 portable TCB |
| `substrate` | Scavenged Substrate (Pillar II): Warden + Trinity node lifecycle and Wake-on-LAN |
| `mesh` | Cryptographic Mesh (Pillar III): Headscale coordination and WireGuard interface management |
| `cloaking` | Forensic countermeasures: MAC randomization, TTL manipulation, timestamp obfuscation |
| `hydration` | Tactical deployment via USB trigger for air-gapped initialization |
| `types` | Shared data types for NodeId, NodeRole, HydraConfig, and error types |

### How It's Wired

1. **synos-distributed** — The `HydraSanctum` orchestrator embeds `DistributedRuntime` from the v6.0 distributed framework, unifying mesh coordination with the broader runtime graph.
2. **Headscale/WireGuard** — The `mesh` module manages `CryptographicMesh` and `WireGuardInterface` objects, providing zero-trust network overlays across the mesh.
3. **Feature flags** — `keyring`, `substrate`, `mesh`, `hydration`, and `cloaking` are independently toggleable, allowing operators to deploy partial Sanctum configurations (e.g., mesh-only without cloaking).
4. **Async runtime** — All pillar initialization runs on `tokio`, with `Arc<RwLock>` guards protecting shared substrate state.

## Future Ideas

1. Implement `hydration` as a USB gadget-mode driver for direct hardware provisioning.
2. Add `substrate` telemetry exporters (Prometheus, OpenTelemetry) for dormant node observability.
3. Extend `cloaking` with dynamic traffic shaping to resist traffic-analysis attacks on the mesh.
