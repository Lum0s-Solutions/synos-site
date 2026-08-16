---
tags: [hive mesh distributed]
title: synos-hive-profiler — Arcanum Hive Hardware Profiler
description: synos-hive-profiler — Arcanum Hive Hardware Profiler
---
tags: [hive mesh distributed]

# synos-hive-profiler — Arcanum Hive Hardware Profiler

**Classification:** PUBLIC  
**Crate:** `fruit/crates/synos-hive-profiler/`  
**Milestone:** v79+  
**License:** MIT OR Apache-2.0

## What It Is

`synos-hive-profiler` is the Arcanum Hive hardware profiler. It detects node
capabilities and classifies tiers, enabling the hive controller to schedule
work where it makes sense.

## Architecture

### Capability Detection

| Capability | Detection Method |
|------------|------------------|
| CPU cores | `/proc/cpuinfo` parsing |
| Memory | `/proc/meminfo` |
| GPU | PCI device enumeration + driver detection |
| NVMe | Block device detection |
| Network | Interface enumeration + speed detection |
| TPM | TPM2 device detection |
| Secure boot | EFI variable inspection |

### Tier Classification

| Tier | Description |
|------|-------------|
| `tier-0` | High-end workstation (32+ cores, 128GB+ RAM, GPU) |
| `tier-1` | Mid-range workstation (8-31 cores, 32-127GB RAM) |
| `tier-2` | Low-end device (4-7 cores, 8-31GB RAM) |
| `tier-3` | Embedded/IoT (1-3 cores, <8GB RAM) |

### How It's Wired

1. **synos-hive-controller** — receives profiler results for workload scheduling
2. **synos-hive-bft** — consensus on node capability assessments
3. **synos-ops** — displays profiler results in the 23-tab dashboard
4. **synos-audit-trail** — logs all profiling events

## Future Ideas

1. **Dynamic profiling** — re-profile nodes periodically for capacity changes
2. **Specialization detection** — identify GPU/NVMe/TPM specializations
3. **Health scoring** — combine capability with reliability metrics
4. **Cost modeling** — estimate energy/performance ratio for scheduling
