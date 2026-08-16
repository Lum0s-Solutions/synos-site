---
title: synos-kernel-observability — v45 Glasswalker — kernel observability primitives (syscalls 480-485)
description: synos-kernel-observability — v45 Glasswalker — kernel observability primitives (syscalls 480-485)
---

# synos-kernel-observability — v45 Glasswalker — kernel observability primitives (syscalls 480-485)

**Classification:** PUBLIC
**Crate:** `fruit/crates/synos-kernel-observability/`
**Milestone:** v0+
**License:** MIT OR Apache-2.0

## What It Is

`synos-kernel-observability` v45 Glasswalker — kernel observability primitives (syscalls 480-485).

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `CgroupNode` | `CgroupNode` module |
| `NetNamespaceEntry` | `NetNamespaceEntry` module |
| `AnonShmemMapping` | `AnonShmemMapping` module |
| `ModuleLoadEntry` | `ModuleLoadEntry` module |
| `SyscallTracePin` | `SyscallTracePin` module |
| `EbpfMapShadowEntry` | `EbpfMapShadowEntry` module |
| `SnapshotHeader` | `SnapshotHeader` module |
| `new` | `new` module |
| `required_buffer_size` | `required_buffer_size` module |
| `build_cgroup_tree_snapshot` | `build_cgroup_tree_snapshot` module |

### How It's Wired

1. **Internal** — self-contained crate

## Future Ideas

1. Expand module coverage and integration points
