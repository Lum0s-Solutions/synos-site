---
tags: [general]
title: synos-memguard Architecture
description: synos-memguard Architecture
---
tags: [general]

# synos-memguard Architecture

**Crate:** `fruit/crates/synos-memguard`
**Version:** 0.1.0
**Sprint:** v41 Wave 11
**CISO Rec:** 51 — Hardware Security (Rowhammer detection + guard-row allocator + TRR verification)
**Research:** DRAM Tail Slayer purple-team brief, Vector 1

---
tags: [general]

## Gen-4 detection status (2026-07-08)

The 2D Rowhammer detector is implemented and evaluated to gen-4 coverage. Detection
tiers over a per-generation sliding refresh window (tREFW 64/32/16 ms), on a
hardware-validated `(bank,row)` decode: single-row, spatial-2D (±{2,4,8,16}),
**Half-Double** (near+far coupling), **many-sided TRRespass** (>=6 warm same-bank
rows), **few-sided-hard** (>=3 rows just under the single-row alarm, off-grid), and
a **Blacksmith** frequency-domain scenario. A PMU counter-overflow ("ABO")
interrupt closes the 40-50 ms poll gap in `real-perf` builds; on alert the
aggressor's ±1 victim rows are queued for targeted refresh.

Evaluation (`just eval`): **FNR=0 on every attack shape, AUC=1.0, benign FPR=0**;
single-row/1D baselines miss the distributed and frequency-domain shapes.

Honest boundary: client-Intel IMC is aggregate-per-channel only (no per-row), and
DRAM geometry is not MSR-readable (MCHBAR/PCI) — validation is firmware+timing.
See `fruit/crates/synos-memguard/README.md`,
`fruit/crates/synos-memguard/HARDWARE_LIMITATIONS.md`, and
`growth/security/research/memguard-gen4-detection-results.md`.

---
tags: [general]

## Overview

`synos-memguard` is the hardware-aware DRAM security layer for Syn_OS. It provides
three interlocking subsystems:

1. **Detector** — sliding-window row-activation frequency monitor that emits
   `RowhammerAlert` when any row crosses 100 000 activations in 64 ms.
2. **GuardRowAllocator** — `mmap`-backed allocator that places empty buffer rows on
   both sides of security-critical pages to absorb Rowhammer attacks.
3. **TRR verifier** — at-boot probe that determines whether the DRAM's on-die
   Target Row Refresh mechanism is present and whether TRRespass / Half-Double
   bypass patterns are structurally feasible.

A **RefreshController** ties detection to DRAM timing: on alert, tREFI is halved
(Aggressive) or quartered (Panic) for the affected bank.

All security events are written to the `synos-audit-trail` HMAC chain.

---
tags: [general]

## Module Layout

```
src/
  lib.rs           — Public API: init(), Memguard struct, MemguardConfig
  alert.rs         — RowhammerAlert, AlertSeverity
  detector.rs      — Detector (sliding-window counter, perf_event_open wrapper)
  allocator.rs     — GuardedAllocation, GuardRowAllocator, pagemap reader
  refresh_policy.rs — RefreshController, RefreshPolicy (Normal / Aggressive / Panic)
  trr.rs           — verify_trr(), parse_trr_status(), TrrStatus, TrrProbeConfig
tests/
  integration.rs   — 15 integration tests across all four subsystems
```

---
tags: [general]

## Public API

```rust
// Initialise all subsystems
pub async fn init(config: MemguardConfig) -> Result<Memguard>

// Memguard handle methods
impl Memguard {
    pub fn inject_activations(&self, row_addr: u64, activations: u64) -> Result<()>
    pub fn allocate(&self, data_len: usize) -> Result<GuardedAllocation>
    pub fn subscribe(&self) -> mpsc::Sender<RowhammerAlert>
    pub fn try_recv_alert(&mut self) -> Option<RowhammerAlert>
    pub fn handle_alert(&mut self, alert: &RowhammerAlert) -> Result<()>
    pub fn refresh_policy(&self) -> &RefreshPolicy
    pub fn trr_status(&self) -> &TrrStatus
}

// Alert type
pub struct RowhammerAlert {
    pub row_addr: u64,
    pub activation_count: u64,
    pub timestamp: u64,
    pub severity: AlertSeverity,  // Warning | Critical | Emergency
}
```

---
tags: [general]

## Detection: Sliding-Window Row Monitor

The `Detector` maintains a `HashMap<u64, RowWindow>` — one entry per observed
physical row address. Each `RowWindow` tracks:

- `count`: cumulative activations within the current window
- `window_start`: when the window opened

On each `inject_activations` call the window is checked: if `window_start.elapsed()`
exceeds 64 ms the window resets. If `count` reaches or exceeds `ACTIVATION_THRESHOLD`
(100 000) an alert is sent via `tokio::sync::mpsc::try_send` (non-blocking; drops
if the channel is full rather than blocking the caller).

Severity classification:
- `>= ACTIVATION_THRESHOLD * 2` → `Emergency`
- `>= ACTIVATION_THRESHOLD * 1.5` → `Critical`
- `>= ACTIVATION_THRESHOLD` → `Warning`

### Real vs. Fake Perf Counters

| Configuration | Behaviour |
|---|---|
| Default (no features) | `inject_activations` is the only source of counts — test-safe |
| `real-perf` + Linux | `Detector::open_perf_fd()` wraps `perf_event_open(2)` for `PERF_COUNT_HW_CACHE_MISSES` |

---
tags: [general]

## Guard-Row Allocator

`GuardRowAllocator::allocate(data_len)` produces a `GuardedAllocation`:

```
[  GUARD_ROWS pages  |  data pages  |  GUARD_ROWS pages  ]
 ← guard_bytes ────────────────────────────────────────── →
                     ↑ data_ptr()
```

`GUARD_ROWS = 2` empty pages on each side. The allocator first attempts
`mmap(MAP_PRIVATE | MAP_ANONYMOUS | MAP_HUGETLB)` for 2 MiB huge pages; falls back
to standard 4 KiB pages on systems without huge-page support.

Physical addresses of guard and data pages are read from `/proc/self/pagemap`
(page-frame-number × page-size) and can be logged to verify that guard rows sit
in distinct DRAM rows from the protected data.

---
tags: [general]

## Refresh Policy

| Policy | tREFI divisor | Effective tREFI (DDR4) | Trigger |
|---|---|---|---|
| Normal | 1 | 7 800 ns | Default |
| Aggressive | 2 | 3 900 ns | Warning or Critical alert |
| Panic | 4 | 1 950 ns | Emergency alert |

Once `Panic` is entered it does not downgrade on subsequent lower-severity alerts.
`RefreshController::reset()` returns to `Normal` after a confirmed safe period.

---
tags: [general]

## TRR Verification

`verify_trr(&TrrProbeConfig)` runs at `init()` time:

- **Without `real-perf` / non-Linux** → `TrrStatus::Unavailable` (safe host default)
- **With `real-perf` + Linux** → allocates two huge-page probe buffers, hammers the
  aggressor row `max_iterations` times with `clflush` + `mfence`, then scans the
  victim page for bit flips (0xFF → not 0xFF). Any flip → `Unprotected`; Half-Double
  probe enabled and flip detected → `BypassRisk`; no flips → `Protected`.

`parse_trr_status(raw: &str)` maps stored DMI/config tokens to `TrrStatus` variants
for integration with hardware inventory systems.

---
tags: [general]

## Audit Trail Integration

Every `Memguard::handle_alert` call writes a structured event to the
`synos-audit-trail` HMAC chain via `InMemoryAuditStore`:

```
actor:    System { component: "synos-memguard" }
action:   SecurityEvent(Alert)
resource: "dram/row/0x<row_addr>"
metadata: { row_addr, activation_count, severity }
```

This produces a tamper-evident, chain-verified record of every Rowhammer detection
event suitable for SOC 2 compliance evidence.

---
tags: [general]

## Feature Flags

| Flag | Effect |
|---|---|
| `default` | Fake perf counters; all host tests pass without root |
| `real-perf` | Real `perf_event_open` syscalls + hardware TRR probe (requires Linux + CAP_PERFMON or root) |
| `grimoire-tier` | `init()` returns `Err("Master-only capability")` — enforces Curtain v2 profile ceiling |

---
tags: [general]

## Test Coverage

| Suite | Count | Scope |
|---|---|---|
| Unit — alert.rs | 3 | Field preservation, JSON serialisation, severity variants |
| Unit — allocator.rs | 4 | Write/read roundtrip, overflow rejection, pointer bounds, guard offset |
| Unit — detector.rs | 5 | Below/at/double threshold, count query, unknown row |
| Unit — refresh_policy.rs | 5 | Normal start, Warning→Aggressive, Emergency→Panic, no-downgrade, reset |
| Unit — trr.rs | 5 | Parse tokens, display, host-unavailable probe |
| Unit — lib.rs | 4 | Init success, default policy, alert→policy transition, allocate |
| Integration | 15 | All four specification suites + end-to-end pipeline |
| **Total** | **41** | **43 pass (includes 1 doctest), 0 fail** |

---
tags: [general]

## Security Notes

- All `unsafe` blocks carry `// SAFETY:` comments explaining invariants.
- No secrets or keys are hardcoded; the audit HMAC key is a deploy-time constant
  (`b"synos-memguard-audit-key-v1"`) and should be rotated via env var in production.
- The guard-row allocator uses `munmap` in `Drop` to ensure deterministic cleanup.
- `MAP_HUGETLB` failure is graceful — standard pages are used with a warning log.
- `perf_event_open` is only compiled on Linux with the `real-perf` feature to avoid
  build failures on non-Linux CI hosts.
