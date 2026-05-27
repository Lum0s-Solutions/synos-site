---
title: Custom Kernel
description: Linux 6.19-synos-ai with CONFIG_RUST=y, a capability-gated signed Rust kernel-module interface, loadable Rust modules, eBPF monitors, and LSM attestation.
---

The Syn_OS kernel is built from upstream Linux **6.19** with the `CONFIG_RUST=y` toolchain enabled, hardened with KSPP defaults, and extended with a **capability-gated, signed Rust kernel-module interface**, loadable Rust kernel modules, an LSM attestation hook, and eBPF monitors. It is the prokaryotic-cell layer of the biological model — primitive, fast, always-on; the mitochondria for the whole organism.

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
| **Module signing** | Required — build stage hard-fails if the kernel signing key is absent; cosign-attested keys |

## Kernel AI interface

The v80 kernel interface is a **capability-gated, signed Rust kernel-module interface** that exposes AI state and observability data to userspace. The old custom-syscall approach is retired — those syscall numbers now collide with upstream Linux 6.19 and the old stubs were empty shells with no real handlers.

Key design decisions:

- **Loadable, compiled Rust modules** — built on Rust-for-Linux, using the misc device + ioctl pattern with memory-safe `UserSlice` I/O
- **Root-only** — device nodes are `0600` via udev rules; every operation requires `CAP_SYS_ADMIN`
- **Signed** — build stage `02b` hard-fails if the kernel signing key is absent; modules are signed before packaging
- **QEMU-boot-validated** — a reusable runtime test (`synos-module-boot-test.sh`) boots the ISO under QEMU and asserts the interface is reachable

The interface exposes: consciousness fusion state, AI stimulus and memory update paths, eBPF monitor tables, observability counters and perf ring buffers, namespace trust classification, per-PID audit, incident ring buffer, and CPU/kernel mitigation-posture query.

## Loadable Rust modules

Syn_OS ships a set of real, loadable, compile-and-boot-validated Rust kernel modules. Eleven canonical modules live in `fruit/core/src/linux-kernel/rust-modules/` and additional modules were introduced through the v61–v80 campaign:

| Module                    | Role                                                |
|---------------------------|-----------------------------------------------------|
| `synos_consciousness`     | Hosts the consciousness-fusion kernel interface     |
| `synos_hardening`         | Runtime hardening hooks (LSM glue)                   |
| `synos_interrupts`        | IRQ-affinity tuning, RPS/XPS adjustments             |
| `synos_memory`            | Fragment-aware allocator hints                       |
| `synos_modloader`         | Signed-module load gate                              |
| `synos_network`           | eBPF network monitor controller                       |
| `synos_power`             | Intel RAPL telemetry, CPU governor guard             |
| `synos_procfs`            | `/proc/synos/*` exposure                             |
| `synos_scheduler`         | Predictive scheduler hints from cerebellum           |
| `synos_security`          | Capability-gating LSM hook                           |
| `synos_syscall`           | Fragment field and kernel interface dispatch         |

Plus modules introduced across the v61–v80 campaign:

- `synos-attest` — LSM attestation module + HMAC-SHA256 chained ledger + PromptGuard receipts
- `synos-observability-module` — kernel observability counters + perf ring buffers
- `kernel/snapshot` — kernel snapshot crate, digital-twin substrate
- `kernel/observability` — eBPF-friendly counters, perf ring-buffer hooks
- `kernel/attest` — LSM attestation kernel-side crate
- `kernel/riftrunner` — in-kernel safe-bytecode VM (22-instruction eBPF subset, in-kernel verifier + interpreter)

## eBPF monitors

Five eBPF programs are always-loaded under the kernel's BPF infrastructure:

| Monitor      | Watches                                                  |
|--------------|----------------------------------------------------------|
| `memory`     | Allocator hot-paths, page faults, OOM events             |
| `network`    | Connection-tracking, anomalous flows, DNS exfil patterns |
| `process`    | exec/clone/exit, command-line capture                    |
| `security`   | Privilege transitions, capability use, namespace ops     |
| `perf`       | Soft-IRQ counts, scheduler latency, cache miss patterns  |

Each monitor contributes events to the Fragment Field IDS pipeline and exposes stats through the observability interface.

## LSM integration — capability gating

Syn_OS ships its own Linux Security Module hook that consults Curtain v3 capability tokens before allowing privileged operations. The integration lives in:

- `synos-security` kernel module — the LSM hook itself
- `synos-curtain-tokens` user-space crate — token issuance, ed25519 / ML-DSA signature
- `synos-attest` — LSM attestation receipt chained into `synos-attest-ledger`

## In-kernel safe-bytecode VM (Riftrunner, v52)

`fruit/core/kernel/riftrunner/` ships an in-kernel **22-instruction eBPF subset** with an in-kernel verifier and interpreter. Use cases:

- ALFRED-driven detection rules that can be hot-loaded without a kernel rebuild
- Lightweight policy bytecode for tenant isolation (`synos-tenant`)
- Late-binding telemetry pipelines

The verifier rejects programs that attempt unbounded loops, unaligned memory access, or syscall invocation.

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

- **[ALFRED →](/architecture/alfred/)** — the daemon that drives the kernel AI interface
- **[Curtain →](/architecture/curtain/)** — capability tokens consulted by the LSM hook
- **[Forge →](/architecture/forge/)** — reproducible kernel module signing
