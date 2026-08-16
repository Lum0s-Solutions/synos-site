---
tags: [kernel security]
title: synos-kernel-memory — Syn_OS kernel memory management reference logic — heap + slab allocation (std-testable); paging + GlobalAlloc are kernel-build only
description: synos-kernel-memory — Syn_OS kernel memory management reference logic — heap + slab allocation (std-testable); paging + GlobalAlloc are kernel-build only
---
tags: [kernel security]

# synos-kernel-memory — Syn_OS kernel memory management reference logic — heap + slab allocation (std-testable); paging + GlobalAlloc are kernel-build only

**Classification:** PUBLIC
**Crate:** `fruit/crates/synos-kernel-memory/`
**Milestone:** v0+
**License:** MIT OR Apache-2.0

## What It Is

`synos-kernel-memory` Syn_OS kernel memory management reference logic — heap + slab allocation (std-testable); paging + GlobalAlloc are kernel-build only.

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `MemoryManager` | `MemoryManager` module |
| `MemoryStats` | `MemoryStats` module |
| `init` | `init` module |
| `get` | `get` module |
| `allocate` | `allocate` module |
| `deallocate` | `deallocate` module |
| `map_page` | `map_page` module |
| `unmap_page` | `unmap_page` module |
| `allocate_slab` | `allocate_slab` module |
| `deallocate_slab` | `deallocate_slab` module |

### How It's Wired

1. **Internal** — self-contained crate

## Future Ideas

1. Expand module coverage and integration points
