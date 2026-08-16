# synos-kernel-snapshot — v51 Storm Glass — kernel snapshot/restore primitives for digital-twin substrate

**Classification:** PUBLIC
**Crate:** `fruit/crates/synos-kernel-snapshot/`
**Milestone:** v0+
**License:** MIT OR Apache-2.0

## What It Is

`synos-kernel-snapshot` v51 Storm Glass — kernel snapshot/restore primitives for digital-twin substrate.

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `SnapshotId` | `SnapshotId` module |
| `as_bytes` | `as_bytes` module |
| `from_bytes` | `from_bytes` module |
| `ProcessHandle` | `ProcessHandle` module |
| `FdTableDigest` | `FdTableDigest` module |
| `MemoryMapDigest` | `MemoryMapDigest` module |
| `NamespaceHandles` | `NamespaceHandles` module |
| `KernelSnapshot` | `KernelSnapshot` module |
| `new` | `new` module |
| `is_non_empty` | `is_non_empty` module |

### How It's Wired

1. **Internal** — self-contained crate

## Future Ideas

1. Expand module coverage and integration points
