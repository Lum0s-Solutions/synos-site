---
tags: [general]
title: synos-driver-wrappers — Userspace Driver Interfaces
description: synos-driver-wrappers — Userspace Driver Interfaces
---
tags: [general]

# synos-driver-wrappers — Userspace Driver Interfaces

**Classification:** PUBLIC  
**Crate:** `fruit/crates/synos-driver-wrappers/`  
**Milestone:** v101+  
**License:** MIT OR Apache-2.0

## What It Is

`synos-driver-wrappers` provides userspace Rust wrappers for NIC, NVMe, ALSA,
and i915 driver interfaces. These wrappers enable the Syn_OS char-device modules
to be managed from userspace without requiring root privileges for all operations.

## Architecture

### Wrappers

| Wrapper | Purpose |
|---------|---------|
| `nic` | Network interface card configuration and statistics |
| `nvme` | NVMe device management and SMART data |
| `alsa` | Audio device control and mixer |
| `i915` | Intel GPU management (i915 kernel driver) |

### How It's Wired

1. **Char-device modules** — wrappers communicate with `/dev/synos_*` devices
2. **CAP_SYS_ADMIN** — required for device access; gated by Curtain
3. **synos-ai-interaction** — uses NIC/GPU wrappers for AI inference acceleration
4. **ALFRED** — uses wrappers for hardware monitoring

## Future Ideas

1. **AMD GPU support** — add amdgpu wrappers
2. **RDMA** — remote direct memory access for mesh networking
3. **DPDK** — data-plane development kit for high-performance networking
4. **GPU compute** — OpenCL/Vulkan compute wrappers for AI acceleration
