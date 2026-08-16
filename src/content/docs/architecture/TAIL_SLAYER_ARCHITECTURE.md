# Tail Slayer Architecture

**Crate:** `synos-tail-slayer`
**CISO Rec:** 53
**Version:** 2.0.0
**Status:** Master-profile runtime; Grimoire can compile + link (GRIMOIRE Tail Chaser lab)

---

## Problem

Under DRAM channel contention a single-reader thread may wait for a row-activation
penalty (40–100 ns).  At P99.99 this serialises into multi-microsecond stalls.
Traditional mitigations (prefetch hints, NUMA binding) are insufficient because
contention is non-deterministic across request bursts.

---

## Solution: Hedged Reads

Issue the same read redundantly to N threads, each pinned to a distinct logical
core (and therefore a distinct hardware prefetcher and DRAM row-buffer state).
Return the first response; discard the rest.  Statistically, at least one reader
wins with a row-buffer hit on every call, collapsing the tail.

---

## Module Map

```
synos-tail-slayer/src/
├── lib.rs              TailSlayer (public entry point), HedgeStrategy enum
├── channel_mapper.rs   discover_channel_map() — boot-time timing sweep
├── hedged_reader.rs    HedgedReader — thread pool, fan-out, first-response select
├── core_pinning.rs     pin_to_core() — sched_setaffinity wrapper
└── huge_pages.rs       HugePageAlloc — mmap + MAP_HUGETLB with fallback
```

---

## Data Flow

```
TailSlayer::new(config)
  │
  ├─ discover_channel_map()        ← timing sweep: 6 strides × 256 samples
  │    returns ChannelMap { boundary_bytes, best_avg_ns }
  │
  └─ HedgedReader::new(cfg)
       ├─ spawn ReaderThread 0  → pin_to_core(0)
       ├─ spawn ReaderThread 1  → pin_to_core(1)
       ├─ spawn ReaderThread N  → pin_to_core(N)
       └─ HugePageAlloc (optional replica buffer)

TailSlayer::read(virt_addr)
  │
  ├─ try_send(ReadRequest) × N          ← no atomics between readers
  │
  └─ crossbeam select! { recv(resp_rx) } → ReadResponse { value, winning_reader, seq }
```

---

## Public API

| Symbol | Kind | Description |
|---|---|---|
| `TailSlayer` | struct | Top-level entry point |
| `TailSlayer::new(config)` | `fn -> Result<Self>` | Runs channel sweep + spawns thread pool |
| `TailSlayer::read(virt_addr)` | `fn -> ReadResponse` | Hedged read; returns first response |
| `TailSlayer::n_readers()` | `fn -> usize` | Active reader thread count |
| `TailSlayerConfig` | struct | `{ strategy, use_huge_pages }` |
| `HedgeStrategy` | enum | `TwoWay` \| `FourWay` \| `EightWay` |
| `ReadResponse` | struct | `{ value, winning_reader, seq }` |
| `ChannelMap` | struct | `{ boundary_bytes, best_avg_ns }` |
| `discover_channel_map()` | `fn -> Result<ChannelMap>` | Boot-time timing sweep |
| `pin_to_core(core_id)` | `fn -> Result<()>` | `sched_setaffinity` wrapper |
| `HugePageAlloc` | struct | `mmap + MAP_HUGETLB` with fallback |
| `available_cores()` | `fn -> usize` | `sysconf(_SC_NPROCESSORS_ONLN)` |

---

## HedgeStrategy Fan-out

| Strategy | Threads | Expected P99.99 gain |
|---|---|---|
| `TwoWay` | 2 | ~3× |
| `FourWay` | 4 | ~7–10× |
| `EightWay` | 8 | ~12–15× |

Target: FourWay P99.99 < 150 ns (validated by Criterion bench `hedged_read/read/4-way`).

---

## Graceful Degradation

| Condition | Behaviour |
|---|---|
| `MAP_HUGETLB` fails | `warn` log + regular page fallback |
| Single-core system | `warn` log + pass-through (n\_readers=1) |
| All readers busy | Direct `read_volatile` fallback + `warn` |
| `sched_setaffinity` EINVAL | `warn` log + OS scheduler fallback |

---

## Safety Contracts

All `unsafe` blocks carry `// SAFETY:` annotations documenting:
- `mmap`/`munmap`: pointer provenance, size invariant, single-free guarantee
- `read_volatile`: caller guarantees `virt_addr` is valid and readable
- `sched_setaffinity`: properly zeroed `cpu_set_t`, pid=0 targets calling thread
- `CPU_SET`/`CPU_ZERO`: POD type, correct initialisation sequence

---

## GRIMOIRE Integration

This crate compiles under the Grimoire profile without a feature gate.
The **Tail Chaser** lab (`synos-grimoire` lab ID: `tail-chaser`) exposes
`discover_channel_map` and `TailSlayer::new` in a sandboxed lab environment
so players can observe DRAM channel topology and hedging effects in real time.
