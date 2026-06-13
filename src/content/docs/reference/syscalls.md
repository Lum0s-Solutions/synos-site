---
title: Kernel Interface Reference
description: The Syn_OS capability-gated Rust kernel-module interface — exposes AI/observability state to userspace. Root-only, CAP_SYS_ADMIN-gated, signed modules. Replaces the retired custom-syscall approach.
---

:::note[Interface re-architecture — v80]
The old "17 custom syscalls 469–485" approach is **retired**. Those numbers collide with upstream Linux 6.19 (`file_setattr`, `listns`, …) and the original stubs were empty shells with no real handler bodies. Syn_OS v80 ships a **capability-gated, signed Rust kernel-module interface** instead — real, loadable, QEMU-boot-validated modules using the misc device + ioctl pattern.
:::

## The interface model

Syn_OS exposes AI state and observability data to userspace through a set of **loadable Rust kernel modules** built on Rust-for-Linux. The interface pattern is: misc character device + ioctl, with memory-safe `UserSlice` I/O.

Security model:

| Property | Value |
|----------|-------|
| **Access gate** | `CAP_SYS_ADMIN` required on every operation |
| **Device nodes** | Root-only (`0600`) via udev rules |
| **Module signing** | Enforced — build stage `02b` hard-fails if the kernel signing key is absent |
| **Boot validation** | QEMU boot + ioctl assertion test (`synos-module-boot-test.sh`) |

## What the interface exposes

The kernel-module interface covers the following domains:

| Domain | Description |
|--------|-------------|
| **Consciousness state** | AI decision cache, stimulus submission, AI-memory update, eBPF monitor table, quantum state, metrics — with real `ktime` latency instrumentation |
| **Namespace trust** | Namespace trust classification for container/process isolation |
| **io_uring audit** | Per-PID `io_uring` operation audit |
| **Incident ring buffer** | Kernel-side incident event sink, ring-buffered |
| **Mitigation state** | CPU and kernel mitigation-posture query (NIST-aligned) |
| **Observability counters** | Kernel-observable counters and perf ring buffers |

## Tier gating

The Curtain v4 LSM hook intercepts each interface call and consults the calling process's capability token before dispatching:

| Operation domain | grimoire-public | goodlife | master |
|------------------|-----------------|----------|--------|
| Consciousness state (read-only) | allowed (read-only) | allowed (read-only) | allowed |
| AI dispatch / memory update | `ENOSYS` | allowed (research-mode) | allowed |
| Fragment Field IDS state | userspace-only path | kernel + userspace | allowed |
| Observability counters | allowed | allowed | allowed |
| Incident sink | allowed | allowed | allowed |
| Mitigation state | allowed | allowed | allowed |

Read more: [Curtain Capability Tokens →](/architecture/curtain/)

## Errors

| errno | Meaning |
|-------|---------|
| `ENOSYS` | Operation denied by Curtain v4 capability token for this tier |
| `EPERM` | The kernel taint flag is set; Master claims revoked |
| `EAGAIN` | The fusion pipeline is at capacity — back off and retry |
| `EINVAL` | Argument structure failed validation |
| `EFAULT` | `copy_from_user` / `copy_to_user` failed |
| `ETIMEDOUT` | Synchronous decision exceeded its latency budget |

## Reading the kernel side

```bash
/proc/synos/consciousness         # current ConsciousnessState
/proc/synos/fragment-field        # Fragment Field IDS energy state
/proc/synos/observability/*       # registered counters
/proc/synos/attest/ledger         # HMAC-SHA256 attestation chain
dmesg | grep -i synos
synos-doctor --kernel
```

:::note
The kernel modules are built with Rust-for-Linux and are available only on Syn_OS kernels. Calling them from a non-Syn_OS Linux installation will return `ENOSYS` from the upstream kernel.
:::

## Related

- **[Custom Kernel →](/architecture/kernel/)** — module architecture, eBPF monitors, LSM hook
- **[ALFRED →](/architecture/alfred/)** — the consciousness fusion engine that drives the AI interface
- **[Curtain →](/architecture/curtain/)** — tier-based access control
