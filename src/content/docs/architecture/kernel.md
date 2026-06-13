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

Syn_OS ships **28 real, loadable, QEMU-boot-validated Rust kernel modules** (65/65 PASS). All live in `fruit/core/src/linux-kernel/rust-modules/`, register a root-only (`0600`) `/dev/synos_*` device node with a `CAP_SYS_ADMIN`-gated ioctl ABI, and are signed at build stage `02b`.

### AI Char-Device Interface (8)

| Module                  | Role |
|-------------------------|------|
| `synos_consciousness`   | 11 ioctls: decision LRU cache, stimulus ring, AI memory, eBPF monitor, quantum/recommend, ktime latency. **Push-channel source** — ALFRED reads `synos_stimulus_record` structs via blocking `read()` with no polling. |
| `synos_ns_trust`        | Live nsproxy/cred walk, namespace trust classification |
| `synos_io_uring_audit`  | Per-PID io_uring audit |
| `synos_incident_sink`   | Incident ring buffer (report/drain) |
| `synos_mitigation_state`| CPU/kernel mitigation posture (`is_module_sig_enforced` + lockdown) |
| `synos_security`        | Capability check + signed token control (LSM hook) |
| `synos_scheduler`       | Run-queue telemetry, predictive hints from cerebellum |
| `synos_memory`          | AI memory-pool accounting, fragment-aware allocator hints |

### Security Capability (6)

| Module              | Role |
|---------------------|------|
| `synos_capability`  | SipHash-2-4 keyed-MAC capability tokens (issue / verify / revoke; forged-tier → `BAD_MAC`) |
| `synos_audit`       | NIST 800-53 tamper-evident SipHash-chained control log |
| `synos_policyvm`    | Safe 16-reg bytecode VM + static verifier (max 1M steps, no kernel API surface) |
| `synos_observability`| Real `si_meminfo` / ktime telemetry (Glasswalker) |
| `synos_attest`      | Per-PID measurement ledger + SipHash chain (Threadwalker) |
| `synos_twin`        | Snapshot lineage registry with generation/hash tracking (Storm Glass) |

### System Interface (7)

| Module            | Role |
|-------------------|------|
| `synos_hardening` | CR4 posture via inline asm (SMEP/SMAP/UMIP/lockdown/modsig readout) |
| `synos_interrupts`| IRQ accounting, RPS/XPS adjustments |
| `synos_power`     | Thermal/cpufreq stats, Intel RAPL telemetry, CPU governor guard |
| `synos_network`   | Per-ifindex rx/tx counters via RCU, eBPF network monitor |
| `synos_procfs`    | `/proc/synos/info` aggregator |
| `synos_modloader` | Module notifier event counts, signed-module load gate |
| `synos_syscall`   | ABI-map device (legacy 469–491 range → consciousness ioctl ops) |

### Defensive Telemetry (5)

| Module              | Role |
|---------------------|------|
| `synos_forensics`   | Volatile memory snapshot |
| `synos_detect`      | Posture detection — blue-team pair for `synos_rootkit` |
| `synos_lsm`         | Caller capability + lockdown posture |
| `synos_audit_bridge`| Emits real kernel audit records via `audit_log_start`/`audit_log_end` |
| `synos_pcap`        | Netfilter packet counter (`NF_ACCEPT`-only) |

### Enforcement (1 — all profiles)

| Module            | Role |
|-------------------|------|
| `synos_modverify` | kprobe on `__x64_sys_finit_module` + blocking notifier; monitor or enforce mode (`NOTIFY_BAD` → `EPERM`). PROVEN: 27/27 synos module loads counted; deny path returns `EPERM`. |

### Offensive (1 — Master + ChurchOfMalware only)

| Module          | Role |
|-----------------|------|
| `synos_rootkit` | RESOLVE (kallsyms via kprobe), PRIVESC (`commit_creds` + `prepare_kernel_cred(&init_task)`), HOOK (live kprobe on `__x64_sys_getdents64`; `hits=1` PROVEN). Always paired with `synos_detect`. CAP_SYS_ADMIN-gated, `0600`. |

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

Syn_OS ships its own Linux Security Module hook that consults Curtain v4 capability tokens before allowing privileged operations. The integration lives in:

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
