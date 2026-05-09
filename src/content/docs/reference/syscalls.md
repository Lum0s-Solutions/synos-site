---
title: Syscall Reference
description: All 17 Syn_OS custom syscalls (469–485). Consciousness fusion (469–479) plus Glasswalker observability (480–485). 17/17 wired in v60.
---

Syn_OS extends the Linux syscall table with **17 custom syscalls** (469–485). All 17 are wired with full handlers, copy-to/from-user paths, LRU caches, ring buffers, eBPF monitor tables, and host tests.

The 50-syscall ceiling discussed in early FEV documents was an aspirational maximum. The practical scope landed at **17** covering all kernel-side observability + AI-cortex needs.

## Consciousness fusion (469–479) — v41 Wave 8

Implemented in `synos_syscall` kernel module. Hold `fragment_field.rs` for 475/476/477.

| #     | Name                          | Returns / Effect                                                       |
|-------|-------------------------------|-------------------------------------------------------------------------|
| **469** | `GET_CONSCIOUSNESS_STATE`   | `struct consciousness_state` — coherence, activity, mode, decision latency |
| **470** | `PROCESS_AI_STIMULUS`       | Enqueues a stimulus into the fusion pipeline; returns request handle    |
| **471** | `MAKE_AI_DECISION`          | Synchronous fused decision over a posed problem; latency-bounded         |
| **472** | `UPDATE_AI_MEMORY`          | Append a `MemoryFragment` into hippocampus storage                       |
| **473** | `GET_AI_METRICS`            | Decision counters + latency histogram                                   |
| **474** | `OPTIMIZE_MEMORY_LAYOUT`    | Apply fragment-aware allocator hints from `synos-memory`                |
| **475** | `GET_QUANTUM_STATE`         | Returns Fragment Field IDS energy signature                             |
| **476** | `CREATE_MEM_ENTANGLE`       | Establish correlated memory regions for energy-topology IDS             |
| **477** | `GET_MEM_RECOMMEND`         | Allocator hints based on observed entanglement                          |
| **478** | `ENABLE_EBPF_MONITOR`       | Toggle one of the 5 eBPF monitors (memory / network / process / security / perf) |
| **479** | `GET_EBPF_STATS`            | Read eBPF monitor stats from kernel-side ring buffer                    |

## Glasswalker observability (480–485) — v45

Implemented in `synos-observability-module` (`fruit/core/kernel/observability/`). eBPF-friendly counters and perf ring buffers.

| #     | Name                      | Returns / Effect                                                |
|-------|---------------------------|----------------------------------------------------------------|
| **480** | `OBS_REGISTER_COUNTER`  | Register a kernel-observability counter; returns counter ID    |
| **481** | `OBS_INCREMENT_COUNTER` | Atomic counter increment from userspace context                |
| **482** | `OBS_READ_COUNTER`      | Read counter value                                             |
| **483** | `OBS_PERF_RING_OPEN`    | Open a perf ring buffer for high-throughput event streaming    |
| **484** | `OBS_PERF_RING_SUBMIT`  | Submit an event to the ring                                    |
| **485** | `OBS_PERF_RING_DRAIN`   | Userspace drain of accumulated events                          |

## Calling convention

Standard Linux x86_64 syscall ABI. Argument registers: `rdi`, `rsi`, `rdx`, `r10`, `r8`, `r9`. Return value in `rax`.

```c
#include <syn_os/syscalls.h>     /* SYS_GET_CONSCIOUSNESS_STATE etc. */
#include <syn_os/types.h>

struct consciousness_state s;
long rc = syscall(SYS_GET_CONSCIOUSNESS_STATE, &s);
if (rc < 0) {
    /* errno set; ENOSYS if Curtain v3 tier denies the claim */
}

if (s.coherence > 0.85 && s.mode == ALFRED_MODE_ADVISORY) {
    struct ai_request  req  = { .kind = AI_DECISION_RECON, /* ... */ };
    struct ai_response resp = { 0 };
    syscall(SYS_MAKE_AI_DECISION, &req, &resp);
}
```

## Tier gating

The Curtain v3 LSM hook intercepts each syscall and consults the calling process's tier token before dispatching:

| Syscall range | grimoire-public          | goodlife                 | master   |
|---------------|--------------------------|--------------------------|----------|
| 469           | ✅ allowed (read-only)    | ✅ allowed (read-only)    | ✅       |
| 470–474       | ❌ `ENOSYS`               | ✅ allowed (research-mode)| ✅       |
| 475–477       | ⚠️ userspace-only path    | ✅ kernel + userspace     | ✅       |
| 478–479       | ✅ allowed                | ✅ allowed                | ✅       |
| 480–485       | ✅ allowed                | ✅ allowed                | ✅       |

Read more: [Curtain Capability Tokens →](/architecture/curtain/)

## Header

The userspace header is shipped in the `synos-headers` package:

```c
#include <syn_os/syscalls.h>   /* syscall numbers */
#include <syn_os/types.h>      /* consciousness_state, ai_request, etc. */
#include <syn_os/curtain.h>    /* tier-related typedefs */
```

## Errors

| errno         | Meaning                                                                |
|---------------|------------------------------------------------------------------------|
| `ENOSYS`      | The syscall is denied by Curtain v3 for this tier (most common reason) |
| `EPERM`       | The kernel taint flag is set; Master claims revoked                    |
| `EAGAIN`      | The fusion pipeline is at capacity — back off and retry                |
| `EINVAL`      | Argument structure failed validation                                   |
| `EFAULT`      | `copy_from_user` / `copy_to_user` failed                               |
| `ETIMEDOUT`   | Synchronous decision exceeded its latency budget                       |

## Reading the kernel side

```bash
/proc/synos/consciousness         # current ConsciousnessState (469 mirror)
/proc/synos/fragment-field        # Fragment Field IDS energy state (475 mirror)
/proc/synos/observability/*       # registered counters (480–482 mirror)
/proc/synos/attest/ledger         # HMAC-SHA256 attestation chain
dmesg | grep -i synos
```

:::note
These syscalls are implemented via Rust kernel modules using the rust-for-linux framework. They are available only on Syn_OS kernels — calling them from a non-Syn_OS Linux installation will return `ENOSYS` from the upstream kernel.
:::

## Related

- **[Custom Kernel →](/architecture/kernel/)** — module architecture, eBPF monitors, LSM hook
- **[ALFRED →](/architecture/alfred/)** — the consciousness fusion engine that drives 469–474
- **[Curtain →](/architecture/curtain/)** — tier-based access control for syscalls
