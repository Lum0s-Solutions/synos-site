---
tags: [general]
title: Curtain v2 — Runtime Capability Ceiling
description: Curtain v2 — Runtime Capability Ceiling
---
tags: [general]

# Curtain v2 — Runtime Capability Ceiling

**Status:** v41 deliverable (Wave 13, Cipher parallel batch)
**Owners:** dev-security pod (Cipher — kernel gate + build scrubber; Cipher T — ALFRED + federation; Cipher U — audit chain + fragment field)

---
tags: [general]

## 1. Tier Model

:::note[Milestone]
Syn_OS v111.0.0 ships with three ISO profiles: Master, Grimoire, and GoodLife. Each profile maps to a capability tier that controls kernel interfaces, daemons, and packaged binaries.
:::

Syn_OS ships three ISO profiles. Each profile maps to a capability tier that controls which kernel interfaces, daemons, and packaged binaries are accessible.

| Tier | ISO | Description |
|------|-----|-------------|
| **Master** | master.iso | Full capabilities. Red-team tooling, all AI-dispatch syscalls, synos-c2-framework, fragment-field loader. Developer and operator builds only — never distributed publicly. |
| **Grimoire** | grimoire.iso | Education + game mode. AI-dispatch syscalls 470-474 return ENOSYS. C2 frameworks and master-only binaries are absent. ALFRED cortex tier-gated. |
| **GoodLife** | goodlife.iso | AI research and safe-tools subset. Inherits all Grimoire restrictions. Offensive security tooling removed. |

The capability ceiling is enforced at multiple layers so that no single bypass vector is sufficient.

---
tags: [general]

## 2. Seven Enforcement Points

### 2.1 Kernel Syscall Gate (THIS cipher — v41 Wave 13)

File: `fruit/core/src/linux-kernel/rust-modules/synos_consciousness/src/tier_gate.rs`

When `synos_consciousness` is compiled with `--features grimoire`, the `grimoire_gate!()` macro fires at the top of each restricted handler and returns `ENOSYS` (-38) before any handler logic runs.

**Restricted syscalls (470-474):**

| Nr | Name | Reason |
|----|------|--------|
| 470 | PROCESS_AI_STIMULUS | Full AI dispatch pipeline |
| 471 | MAKE_AI_DECISION | LRU decision cache + ALFRED netlink path |
| 472 | UPDATE_AI_MEMORY | Fragment-field memory write |
| 473 | GET_AI_METRICS | Perf counter read (exposes ring depth) |
| 474 | OPTIMIZE_MEMORY_LAYOUT | Memory compaction / NUMA rebalance |

**Unrestricted syscalls:**

- 469 (GET_CONSCIOUSNESS_STATE) — read-only coherence snapshot
- 475-477 (quantum state, memory entanglement, memory recommendations) — read-only informational
- 478-479 (eBPF monitor/stats) — independently gated by CAP_SYS_ADMIN; profile tier does not apply

The `tier_gate` module exposes `is_grimoire_tier()` and `is_syscall_restricted(nr)` as `const fn` so the compiler eliminates the check entirely on master builds (zero runtime overhead).

### 2.2 ALFRED Cortex Tier Gate (Wave 13 Cipher T)

The ALFRED daemon reads a build-time profile constant and refuses to load the full consciousness fusion pipeline on Grimoire builds. The cortex remains functional for GoodLife task routing but AI-dispatch NLMSG handlers are disabled.

### 2.3 Federation Tier Isolation (Wave 13 Cipher T)

Hive federation channels carry a tier header. Grimoire nodes reject peering with Master nodes on the privileged control channel. This prevents lateral escalation via the mesh.

### 2.4 Audit Chain Root Separation (Wave 13 Cipher U)

Master and Grimoire/GoodLife ISO profiles use separate HMAC-SHA256 root keys. A Grimoire audit log cannot be replayed as a Master audit log; the root proof diverges at the genesis block.

### 2.5 Fragment Field Grimoire Cap (Wave 13 Cipher U)

The `synos-fragment-field-kernel-loader` binary is excluded from the Grimoire rootfs at ISO build time. The fragment field read-only API (syscall 477) remains available; write operations (syscall 472) are blocked by enforcement point 2.1.

### 2.6 Build-Time Scrubber xtask (THIS cipher — v41 Wave 13)

File: `growth/xtask/src/commands/grimoire_ceiling_check.rs`
Command: `cargo xtask grimoire-ceiling-check --rootfs <path>`

Walks the assembled Grimoire rootfs and fails the build if any forbidden binary is present.

**Forbidden names (exact filename match):**
- `cobalt-strike`, `empire`, `covenant`, `sliver` — external C2 frameworks
- `synos-c2-framework`, `synos-fragment-field-kernel-loader` — Syn_OS master-only

**Forbidden filename patterns (substring):**
- `master-only` — convention for master-exclusive components
- `_godmode` — convention for unrestricted privilege escalation tools

The scrubber is invoked as the final stage of the Grimoire ISO build pipeline, after the rootfs is assembled but before squashfs compression. Exit code 0 = clean. Exit non-zero = build rejected with violation list on stderr.

### 2.7 ELF Symbol Curtain (v26 — already exists)

File: `growth/xtask/src/curtain.rs`
Command: `cargo xtask curtain-check --profile grimoire`

Scans compiled ELF binaries for 13 forbidden symbols and 8 forbidden string patterns that must not appear in Grimoire or GoodLife builds. This is a symbol-level complement to the filesystem-level scrubber (2.6) — it catches binaries that were renamed to avoid the name-based check.

---
tags: [general]

## 3. Verification

The QEMU red-team suite (`growth/tests/integration/curtain-v2/`) attempts the following bypass vectors against a Grimoire ISO boot. All must fail.

| Test | Vector | Expected result |
|------|--------|-----------------|
| `syscall_470_direct` | `syscall(470, ...)` from userspace | Returns -ENOSYS |
| `syscall_474_direct` | `syscall(474, ...)` with CAP_SYS_ADMIN | Returns -ENOSYS |
| `alfred_cortex_invoke` | POST to ALFRED cortex NLMSG endpoint | Connection refused / tier rejected |
| `fragment_loader_exec` | Execute `synos-fragment-field-kernel-loader` | Binary not present (exit 127) |
| `master_peer_federation` | Attempt Master-tier hive peering | Federation rejected (tier mismatch) |
| `c2_binary_exec` | Execute `cobalt-strike` | Binary not present (exit 127) |
| `godmode_pattern_exec` | Execute `synos_godmode_binary` | Binary not present (exit 127) |

---
tags: [general]

## 4. Build Integration

```sh
# Check the assembled Grimoire rootfs before squashfs compression:
cargo xtask grimoire-ceiling-check --rootfs /tmp/grimoire-rootfs

# Check for ELF symbol leaks in compiled binaries:
cargo xtask curtain-check --profile grimoire --strict

# Feature flag audit (Cargo metadata level):
cargo xtask feature-audit --profile grimoire

# Full quality gate (runs curtain-check + feature-audit as part of pre-sprint):
just gate
```

---
tags: [general]

## 5. v41 Deliverables

This document records the v41 Wave 13 scope. The table below tracks which cipher owns which enforcement point and the completion status at merge time.

| Point | Cipher | Status |
|-------|--------|--------|
| 2.1 Kernel syscall gate | Wave 13 Cipher (this batch) | Complete |
| 2.6 Build-time scrubber | Wave 13 Cipher (this batch) | Complete |
| 2.2 ALFRED cortex gate | Wave 13 Cipher T | Parallel |
| 2.3 Federation isolation | Wave 13 Cipher T | Parallel |
| 2.4 Audit chain separation | Wave 13 Cipher U | Parallel |
| 2.5 Fragment field cap | Wave 13 Cipher U | Parallel |
| 2.7 ELF symbol curtain | v26 (complete) | Shipped |
