---
title: Custom Kernel
description: Linux 6.19-synos-ai with CONFIG_RUST=y, 17 custom syscalls (469–485), 17 loadable Rust modules, 5 eBPF monitors, LSM attestation, and the in-kernel Riftrunner safe-bytecode VM.
---

The Syn_OS kernel is built from upstream Linux **6.19** with the `CONFIG_RUST=y` toolchain enabled, hardened with KSPP defaults, and extended with **17 custom syscalls**, **17 loadable Rust kernel modules**, an in-kernel safe-bytecode VM, an LSM attestation hook, and 5 eBPF monitors. It is the prokaryotic-cell layer of the biological model — primitive, fast, always-on; the mitochondria for the whole organism.

## Build configuration

| Setting | Value |
|---------|-------|
| **Upstream version** | Linux 6.19 |
| **Build target** | `6.19-synos-ai` |
| **Toolchain** | LLVM/Clang + Rust (no GCC) |
| **`CONFIG_RUST`** | `y` |
| **`CONFIG_MODVERSIONS`** | `n` (disabled — Rust modules don't use it) |
| **Hardening** | KSPP defaults + Sanctum overlays |
| **Custom config knobs** | 12 — all under `CONFIG_SYNOS_*` |
| **Module signing** | cosign-attested keys (v41 Wave 9), validator escalates with sudo when key is root-readable (v43.2 fix) |

## The 17 custom syscalls

### Consciousness fusion (469–479) — v41 Wave 8

| #     | Name                          | Purpose                                                              |
|-------|-------------------------------|----------------------------------------------------------------------|
| 469   | `GET_CONSCIOUSNESS_STATE`     | Coherence, activity, mode, decision latency snapshot                  |
| 470   | `PROCESS_AI_STIMULUS`         | Submit a stimulus event for fusion processing                         |
| 471   | `MAKE_AI_DECISION`            | Trigger a fused decision over a posed problem                         |
| 472   | `UPDATE_AI_MEMORY`            | Write to hippocampus storage                                          |
| 473   | `GET_AI_METRICS`              | Decision counters, latency histogram                                  |
| 474   | `OPTIMIZE_MEMORY_LAYOUT`      | Fragment-aware allocator hints from `synos-memory`                    |
| 475   | `GET_QUANTUM_STATE`           | Fragment Field IDS signature                                          |
| 476   | `CREATE_MEM_ENTANGLE`         | Establish correlated memory regions for energy-topology IDS           |
| 477   | `GET_MEM_RECOMMEND`           | Allocator hints based on observed entanglement                        |
| 478   | `ENABLE_EBPF_MONITOR`         | Toggle one of the 5 eBPF monitor programs                             |
| 479   | `GET_EBPF_STATS`              | Read eBPF monitor stats from the kernel-side ring buffer              |

### Glasswalker observability (480–485) — v45

| #   | Name                          | Purpose                                                              |
|-----|-------------------------------|----------------------------------------------------------------------|
| 480 | `OBS_REGISTER_COUNTER`        | Register a kernel-observability counter                              |
| 481 | `OBS_INCREMENT_COUNTER`       | Atomic counter increment from userspace context                      |
| 482 | `OBS_READ_COUNTER`            | Read counter value                                                   |
| 483 | `OBS_PERF_RING_OPEN`          | Open a perf ring buffer for high-throughput event streaming           |
| 484 | `OBS_PERF_RING_SUBMIT`        | Submit an event to the ring                                          |
| 485 | `OBS_PERF_RING_DRAIN`         | Userspace drain of accumulated events                                |

```c
#include <syn_os/syscalls.h>

struct consciousness_state state;
syscall(SYS_GET_CONSCIOUSNESS_STATE, &state);

if (state.coherence > 0.85 && state.mode == ALFRED_MODE_ADVISORY) {
    /* AI is alert and read-only — safe to ask for a decision */
    syscall(SYS_MAKE_AI_DECISION, &request, &response);
}
```

The 50-syscall ceiling discussed in early FEV documents was an aspirational maximum. The practical scope landed at **17** covering all kernel-side observability + AI-cortex needs.

## The 17 loadable Rust modules

Eleven canonical loadable `.ko` modules live in `fruit/core/src/linux-kernel/rust-modules/`:

| Module                    | Role                                                |
|---------------------------|-----------------------------------------------------|
| `synos_consciousness`     | Hosts the consciousness-fusion kernel interface     |
| `synos_hardening`         | Runtime hardening hooks (LSM glue)                   |
| `synos_interrupts`        | IRQ-affinity tuning, RPS/XPS adjustments             |
| `synos_memory`            | Fragment-aware allocator hints                       |
| `synos_modloader`         | Signed-module load gate                              |
| `synos_network`           | eBPF network monitor controller                       |
| `synos_power`             | Intel RAPL telemetry, CPU governor guard (v43.1 fix)|
| `synos_procfs`            | `/proc/synos/*` exposure                             |
| `synos_scheduler`         | Predictive scheduler hints from cerebellum           |
| `synos_security`          | Capability-gating LSM hook                           |
| `synos_syscall`           | Holds `fragment_field.rs` + 469–485 dispatch         |

Plus six new crates introduced through Operation Warp Speed:

- `synos-attest` (v46 Threadwalker) — LSM attestation module + HMAC-SHA256 chained `synos-attest-ledger` + PromptGuard receipts
- `synos-observability-module` (v45 Glasswalker) — kernel observability counters + perf ring buffers
- `kernel/snapshot` (v51 Storm Glass) — kernel snapshot crate, digital-twin substrate
- `kernel/observability` (v45) — eBPF-friendly counters, perf ring-buffer hooks
- `kernel/attest` (v46) — LSM attestation kernel-side crate
- `kernel/riftrunner` (v52) — in-kernel safe-bytecode VM (22-instruction eBPF subset, in-kernel verifier + interpreter)

The remaining nine subdirectories under `rust-modules/` are support infrastructure (shared crates, test harnesses, build tooling, future module placeholders).

## eBPF monitors

Five eBPF programs are always-loaded under the kernel's BPF infrastructure:

| Monitor      | Watches                                                  |
|--------------|----------------------------------------------------------|
| `memory`     | Allocator hot-paths, page faults, OOM events             |
| `network`    | Connection-tracking, anomalous flows, DNS exfil patterns |
| `process`    | exec/clone/exit, command-line capture                    |
| `security`   | Privilege transitions, capability use, namespace ops     |
| `perf`       | Soft-IRQ counts, scheduler latency, cache miss patterns  |

Each monitor exposes its stats through syscalls **478** / **479** and contributes events to the Fragment Field IDS pipeline.

## LSM integration — capability gating

Syn_OS ships its own Linux Security Module hook that consults Curtain v3 capability tokens before allowing privileged operations. The integration lives in:

- `synos-security` kernel module — the LSM hook itself
- `synos-curtain-tokens` user-space crate — token issuance, ed25519 signature
- `synos-attest` (v46) — LSM attestation receipt chained into `synos-attest-ledger`

Operations gated by Curtain tokens include: AI dispatch syscalls (470–474), Fragment Field IDS access (475–477), perf ring open (483), and any tier-jump request from a userspace process.

## In-kernel safe-bytecode VM (Riftrunner, v52)

`fruit/core/kernel/riftrunner/` ships an in-kernel **22-instruction eBPF subset** with an in-kernel verifier and interpreter. Use cases:

- ALFRED-driven detection rules that can be hot-loaded without a kernel rebuild
- Lightweight policy bytecode for tenant isolation (`synos-tenant`)
- Late-binding telemetry pipelines

The verifier rejects programs that attempt unbounded loops, unaligned memory access, or syscall invocation. Forward horizon: more opcodes are queued in `FEV.md` v61+.

## Snapshot crate (Storm Glass, v51)

`fruit/core/kernel/snapshot/` exposes a snapshot interface that powers the **Twin** Bevy plugin and the digital-twin substrate. The kernel emits snapshots of selected memory regions and observable state into the substrate, where ALFRED's MPS cortex can play with them without affecting the live system.

## Reading the kernel

```bash
/proc/synos/consciousness       # current ConsciousnessState
/proc/synos/fragment-field      # Fragment Field IDS energy state
/proc/synos/observability/*     # registered counters
/proc/synos/attest/ledger       # HMAC-SHA256 chained attestation log

dmesg | grep -i synos
synos-doctor --kernel
```

## Related

- **[ALFRED →](/architecture/alfred/)** — the daemon that drives 469–479
- **[Curtain →](/architecture/curtain/)** — capability tokens consulted by the LSM hook
- **[Forge →](/architecture/forge/)** — reproducible kernel module signing
- **[Syscall reference →](/reference/syscalls/)** — the full table
