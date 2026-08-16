---
tags: [kernel security]
title: The 7.0-synos-ai Kernel
description: The 7.0-synos-ai Kernel
---
tags: [kernel security]

# The 7.0-synos-ai Kernel

Syn_OS ships its own Linux kernel fork, branded `7.0-synos-ai`. It is not a
cosmetic rebuild. The fork exists because the stock Arch kernel does not
expose the surface area that [ALFRED](./alfred.md), the
[ARCANUM Hive](./arcanum-hive.md) attestor, and the consciousness-fusion
eBPF telemetry need. Rather than shim around the upstream kernel, Syn_OS
builds it with the features baked in and the Rust-for-Linux toolchain lit up.

## Base

The fork tracks upstream `v7.0` as its base with full Rust-for-Linux (R4L)
support. The build pulls the official tarball, verifies its signature, unpacks
into a scratch tree, and then layers the Syn_OS patches and config on top.
No out-of-tree kernel ever ships — every customization is a patch against mainline.

Key upstream features Syn_OS assumes are present:

- `CONFIG_RUST=y` — the Rust-for-Linux integration, enabled by compiling with
  `LLVM=1` and a nightly `rustc` that matches the pinned toolchain.
  As of v80.1 the pinned toolchain is `nightly-2026-06-11` (rustc 1.98),
  which also matches `rust-toolchain.toml` for the userspace workspace.
- `CONFIG_MODULES=y` plus `CONFIG_MODULE_SIG=y` — Syn_OS uses loadable Rust
  modules heavily; monolithic kernel builds are not supported.
- `CONFIG_BPF=y`, `CONFIG_BPF_SYSCALL=y`, `CONFIG_DEBUG_INFO_BTF=y` — eBPF
  telemetry pipes kernel state up to ALFRED.
- `CONFIG_SECURITY`, `CONFIG_SECURITY_NETWORK`, `CONFIG_AUDIT` — prerequisites
  for `synos_lsm` and `synos_audit_bridge`.
- `CONFIG_KPROBES=y` — required by `synos_modverify` and the offensive module (master/CoM only)
  (both use `register_kprobe`/`unregister_kprobe`).

Building with LLVM is non-negotiable. Stage 02 refuses to continue if the
detected toolchain cannot produce an `LLVM=1` kernel, because the Rust
modules will silently stop linking otherwise and the failure will not surface
until stage 02b tries to load them.

## Build process

The kernel is produced by `fruit/iso/iso-build/scripts/stages/02-kernel.sh`.
The script is idempotent and checkpoint-gated.

```bash
# 1. Fetch the upstream 7.0 tarball, verify GPG signature
download_kernel_source 7.0

# 2. Apply the Syn_OS patch set in lexical order
apply_patches fruit/kernel/patches/kernel-patches/

# 3. Merge the Syn_OS config fragment into the base defconfig
merge_config arch/x86/configs/x86_64_defconfig fruit/kernel/synos.config

# 4. Reconcile config options
make olddefconfig

# 5. Trim to what the build oracle will actually load
make localmodconfig LSMOD=/tmp/build-oracle.lsmod

# 6. Restore the SYNOS_* fragment (localmodconfig strips it)
restore_synos_fragment

# 7. Compile
make LLVM=1 KRUSTFLAGS="-Zunstable-options" -j4 bzImage modules
```

**Important:** after a bzImage-only build, `vmlinux.symvers` must be copied
to `Module.symvers` before out-of-tree modules can be built:

```bash
cp build/kernel-source/linux-7.0/vmlinux.symvers \
   build/kernel-source/linux-7.0/Module.symvers
```

## Patches

All kernel patches live under `fruit/kernel/patches/kernel-patches/` and are
applied in lexical order by stage 02.

| Patch | Purpose |
|---|---|
| `0100-r4l-irq-request-static-bound-rustc198.patch` | Adds `T: 'static` to 3 IRQ callback shims in `rust/kernel/irq/request.rs`. Required for rustc 1.98 (nightly-2026-06-11) — E0310 lifetime tightening. The bound is already guaranteed at all call sites; pure annotation fix. Re-apply after kernel source updates. |

## Config options

The fork adds twelve `CONFIG_SYNOS_*` options:

| Option | Purpose |
|---|---|
| `CONFIG_SYNOS_AI` | Master switch; gates every other `SYNOS_*` option. |
| `CONFIG_SYNOS_CONSCIOUSNESS` | In-kernel consciousness-fusion hook points and tensor fragment plumbing. |
| `CONFIG_SYNOS_SCHEDULER` | CFS coherence hints consumed by the phase 4 scheduler patch. |
| `CONFIG_SYNOS_MEMORY` | Tensor-fragment-aware page allocation tuning. |
| `CONFIG_SYNOS_PROCFS` | `/proc/synos/*` entries exposed by `synos_procfs`. |
| `CONFIG_SYNOS_SECURITY` | Hooks for the `synos_lsm` LSM stack. |
| `CONFIG_SYNOS_HARDENING` | KASLR, stack canaries, and W^X enforcement beyond upstream defaults. |
| `CONFIG_SYNOS_NETWORK` | Packet-capture hooks consumed by `synos_pcap`. |
| `CONFIG_SYNOS_INTERRUPTS` | Interrupt accounting surfaced to `synos_interrupts`. |
| `CONFIG_SYNOS_POWER` | Thermal + wake-lock integration for laptop profiles. |
| `CONFIG_SYNOS_MODLOADER` | Signed-module loader enhancements used by `synos_modloader`. |
| `CONFIG_SYNOS_MODVERIFY` | Module load enforcement kprobe and blocking notifier. |

All twelve are set to `y` on `master`, `goodlife`, `grimoire`, and
`churchofmalware` builds.

## Loadable Rust kernel modules

Stage 02b (`02b-synos-rust-modules.sh`) compiles the out-of-tree Rust modules
against the matching `KBUILD` tree. There are **33 modules** as of v111.0.0 —
all pure Rust-for-Linux (zero Syn_OS-authored C since v111 "Last Light"),
all char-device + ioctl implementations, QEMU-boot-validated (67/67 PASS on
the v101 core set; 5 new v102-v108 modules built and wired, QEMU harness pending).

The interface is a **misc character-device + ioctl** design. Earlier
iterations reserved custom syscall numbers 469–491; **that approach is dead**
for two reasons: upstream Linux 6.19 assigned those numbers to `file_setattr` (the
collision is the historical cause — 7.0 inherits the same assignment)
(469) and `listns` (470), and the old modules were print-only stubs with no
real handlers. The char-device/ioctl interface has no number-collision risk
and is the idiomatic Rust-for-Linux pattern.

### AI char-device interface (8 core)

| Module | Device | Ops | Purpose |
|---|---|:---:|---|
| `synos_consciousness` | `/dev/synos_consciousness` | 11 | Decision LRU cache, stimulus ring, AI-memory, eBPF monitor, quantum/recommend, real `ktime` latency |
| `synos_ns_trust` | `/dev/synos_ns_trust` | 1 | Namespace trust classification (live `nsproxy`/`cred` walk) |
| `synos_io_uring_audit` | `/dev/synos_io_uring_audit` | 1 | Per-PID io_uring audit |
| `synos_incident_sink` | `/dev/synos_incident_sink` | 2 | Incident ring buffer (report/drain) |
| `synos_mitigation_state` | `/dev/synos_mitigation_state` | 1 | CPU/kernel mitigation posture (`is_module_sig_enforced` + lockdown) |
| `synos_security` | `/dev/synos_security` | 4 | Capability check + signed token control |
| `synos_scheduler` | `/dev/synos_scheduler` | 2 | Run-queue telemetry |
| `synos_memory` | `/dev/synos_memory` | 1 | AI memory-pool accounting |

### Security capability modules (6)

| Module | Device | Purpose |
|---|---|---|
| `synos_capability` | `/dev/synos_capability` | SipHash-2-4 keyed-MAC capability tokens (issue/verify/revoke); forged-tier rejected (BAD_MAC) |
| `synos_audit` | `/dev/synos_audit` | NIST 800-53 tamper-evident SipHash-chained control log |
| `synos_policyvm` | `/dev/synos_policyvm` | Safe 16-reg bytecode VM + static verifier + bounded steps |
| `synos_observability` | `/dev/synos_observability` | Real si_meminfo/ktime telemetry (Glasswalker) |
| `synos_attest` | `/dev/synos_attest` | Per-PID measurement ledger + SipHash chain (Threadwalker) |
| `synos_twin` | `/dev/synos_twin` | Snapshot lineage registry with generation/hash tracking (Storm Glass) |

### System interface modules (7)

| Module | Device | Purpose |
|---|---|---|
| `synos_hardening` | `/dev/synos_hardening` | CR4 posture readout via inline asm (SMEP/SMAP/UMIP/FSGSBASE/PKE/NX/lockdown/modsig) |
| `synos_interrupts` | `/dev/synos_interrupts` | IRQ accounting (`irq_get_nr_irqs()` + `nr_cpu_ids`) |
| `synos_power` | `/dev/synos_power` | Thermal/cpufreq stats (`cpufreq_quick_get`/`cpufreq_get_hw_max_freq`) |
| `synos_network` | `/dev/synos_network` | Per-ifindex rx/tx via `dev_get_by_index_rcu` + `dev_get_stats` under RCU |
| `synos_procfs` | `/proc/synos/info` | Real `/proc` aggregator via `proc_mkdir`+`proc_create_single_data`+`seq_write` |
| `synos_modloader` | `/dev/synos_modloader` | Module notifier event counts (COMING/LIVE/GOING via `register_module_notifier`) |
| `synos_syscall` | `/dev/synos_syscall` | ABI-map device — maps the legacy syscall number range to the correct consciousness ioctl op |

### Defensive telemetry (10 — 5 original + 5 added in v101-v108 campaign)

| Module | Device | Purpose | Added |
|---|---|---|---|
| `synos_forensics` | `/dev/synos_forensics` | Volatile memory snapshot (si_meminfo + ktime + uts) | original |
| `synos_detect` | `/dev/synos_detect` | Posture detection + module-event notifier count; blue-team pair for the offensive module (master/CoM only) | original |
| `synos_lsm` | `/dev/synos_lsm` | Caller capability (CAP_SYS_ADMIN/MODULE/NET_ADMIN/BPF) + lockdown posture + hook invocation counters (inode_permission / bprm_check / socket_connect) + threat score | original + v102 |
| `synos_audit_bridge` | `/dev/synos_audit_bridge` | Emits real kernel audit records via `audit_log_start`/`audit_log_end` | original |
| `synos_pcap` | `/dev/synos_pcap` | Netfilter counter (NF_ACCEPT-only) + 32-slot per-conn ring + 5-second PPS window | original + v106 |
| `synos_vfs_audit` | `/dev/synos_vfs_audit` | kprobe on `vfs_open`/`vfs_write`/`vfs_unlink` + per-op counters + churn score | v101 |
| `synos_crypto` | `/dev/synos_crypto` | Kernel-side HMAC-SHA256, SHA256 measurement, TPM-style attestation chain via `crypto_shash` | v103 |
| `synos_netpolicy` | `/dev/synos_netpolicy` | 64-slot NF_INET_LOCAL_IN first-match firewall (Allow / Block / Audit) via `nf_register_net_hook` | v106 |
| `synos_block_audit` | `/dev/synos_block_audit` | kprobe on `submit_bio` + per-device I/O counters + ransomware score (writes×2 + discards×8) | v107 |
| `synos_mm_audit` | `/dev/synos_mm_audit` | Read-only memory pressure: `nr_free_pages` + `global_zone_page_state` + `si_meminfo` → pressure_score 0-255 | v108 |

### Enforcement (1 — all profiles)

`synos_modverify` — `/dev/synos_modverify`

Implements module load enforcement without requiring `CONFIG_MODULE_SIG_FORCE`:

- **kprobe** on `__x64_sys_finit_module` (symbol-name based; kprobe infra resolves
  internally — no kallsyms export dance) counts every `finit_module` syscall.
- **Blocking module notifier** at `MODULE_STATE_COMING` reads `mod->name` at
  pahole-verified offset 24 (state(4)+hole(4)+list(16)=24; stable across 6.19→7.0).
  Syn_OS modules (prefix `synos_`) are counted; in enforce mode returns
  `NOTIFY_BAD` (0x8002) → `notifier_to_errno` → `-EPERM` → load aborted.
- **Monitor mode** (default): counts, never denies.
- **Enforce mode**: deny-on-load for all unsigned Syn_OS modules.

QEMU-proven: 27/27 synos loads counted; deny PROVEN (errno=EPERM via rmmod+reload).

### Offensive capability (1 — master + ChurchOfMalware only)

One additional signed module ships only in the `master` and `churchofmalware`
profiles (gated in stage-02b's `OFFENSIVE_MODULES` array): a CAP_SYS_ADMIN-gated,
root-only (`0600`) red-team primitive set for authorized offensive-security work.
Its operational detail is master/CoM-only and is documented in the internal
kernel reference — intentionally omitted from this public doc.

Its defensive counterpart, `synos_detect`, ships on **all** profiles and surfaces
`mod_events` counts and posture flags for blue-team visibility.

## Module signing

`CONFIG_MODULE_SIG=y` is always enabled.

- **Live ISO**: `CONFIG_MODULE_SIG_FORCE=n` — lets users sideload research
  modules during training sessions without re-enrolling a signing key.
- **Installed systems**: stage 17 flips to `CONFIG_MODULE_SIG_FORCE=y` and
  enrolls the Syn_OS signing key into the MOK store. Every `synos_*` module
  is signed during stage 02b with the kernel's own signing key (baked into
  the in-kernel trusted keyring), so the transition is seamless.

**Important:** stage 02b signs with the kernel's auto-generated
`certs/signing_key.pem` rather than a separate ephemeral key. A module signed
with a key not in the kernel's trusted keyring gets `EKEYREJECTED` at every
insert. Never bypass this by generating a separate signing key unless you also
enroll it in the kernel keyring.

## ZeroC — v111 "Last Light"

As of v111.0.0, **zero Syn_OS-authored C exists in the kernel tree.** All 9 legacy
`*_wrapper.c` stubs (pre-v100 hybrid approach) were deleted. Every kernel module is
pure Rust-for-Linux — the `obj-m := synos_<mod>.o` Kbuild rule resolves directly to
`synos_<mod>.rs` via R4L, no C intermediate.

BPF C files (`synos_sched.bpf.c`, eBPF monitors under `fruit/core/kernel/ebpf/`) are
accepted per upstream-delegation policy — no R4L BPF_STRUCT_OPS binding exists in 7.0.
Lab C (intentionally vulnerable Docker lab content) and QEMU init C are similarly
accepted categories. `growth/development/scripts/zero-c-audit.sh` enforces the boundary at build time.

**R4L migration TODOs for v112:** `ktime_get_seconds()` (annotated in `synos_pcap.rs`),
`copy_from_user` / `copy_to_user` (R4L 7.0 has `UserSlice` in `uaccess.rs`; newer modules
already use it). All other extern "C" FFI is classified (c) upstream-C-accepted — no R4L
7.0 bindings for kprobe, netfilter, crypto_shash, nr_free_pages, etc. Full classification:
`fruit/core/src/linux-kernel/rust-modules/WAVE0_REPORT.md`.

## QEMU validation

All 33 modules build against R4L 7.0.
`fruit/core/src/linux-kernel/qemu-validate/run-validate.sh` validates the v101 core set:

1. Rebuilds all `.ko` files fresh (clean before each to avoid stale CRC mismatches)
2. Compiles a static `/init` that `finit_module()`s each module and exercises
   every ioctl in its UAPI
3. Packs a minimal initramfs, boots the synos bzImage headless under QEMU
4. Parses serial output for `RESULT`/`SUMMARY` markers

Current baseline: **SUMMARY pass=67 fail=0** (v101 core set — 28 original + synos_vfs_audit + synos_lsm v102 ioctls). The 4 additional v103-v108 modules (synos_crypto, synos_netpolicy, synos_block_audit, synos_mm_audit) are compiled, signed, installed, and autoloaded — QEMU harness assertions are the pending v112 sprint item.

`synos_modverify` loads first so its notifier intercepts all 27 subsequent
synos module loads; `test_modverify_final()` runs last to verify accumulated
counts and the enforce deny path.

## Verification gates in stage 02

Stage 02 has three non-negotiable asserts:

1. **`CONFIG_RUST=y` survival** — checked after `olddefconfig`, after
   `localmodconfig`, and after the fragment restore.
2. **`SYNOS_*` floor count** — the post-merge `.config` must contain at least
   10 `CONFIG_SYNOS_*=y` entries (true count is 12; floor is set two lower
   to allow temporary local disables during development).
3. **Proprietary config restoration** — `synos.config` re-applied after
   `localmodconfig`, which always strips options it cannot find a loaded module for.

## Build time profile (i5-3337U, 2c/4t build oracle)

- **Cold kernel build**: ~2 hours wall time; stage 02b adds 6-8 minutes
- **Warm kernel build** (ccache primed): 30-45 minutes

## Building modules directly

```bash
cd /path/to/Syn_OS

# Ensure Module.symvers is present
cp build/kernel-source/linux-7.0/vmlinux.symvers \
   build/kernel-source/linux-7.0/Module.symvers

# Build a single module (clean artifacts first to avoid stale-CRC failures)
MOD=synos_consciousness
rm -f fruit/core/src/linux-kernel/rust-modules/$MOD/*.ko \
      fruit/core/src/linux-kernel/rust-modules/$MOD/*.o
KRUSTFLAGS="-Zunstable-options" make \
    -C build/kernel-source/linux-7.0 \
    LLVM=1 \
    M=$PWD/fruit/core/src/linux-kernel/rust-modules/$MOD \
    modules
```

## Troubleshooting

**`localmodconfig` stripped `CONFIG_RUST=y`.** The build host has no
Rust-for-Linux sample modules loaded so `localmodconfig` treats it as dead
code. Stage 02's restore step re-applies `synos.config`. For manual builds,
re-merge the fragment after `localmodconfig`.

**`bindgen` missing.** Rust-for-Linux needs the standalone `bindgen` binary,
not the Cargo plugin. On Arch: `paru -S rust-bindgen`. Stage 01 checks this.

**`LLVM=1` fails with "unsupported architecture".** `clang` is too old;
floor is clang 17 for kernel 7.0. Stage 01 asserts this.

**Module loads then immediately unloads / `EKEYREJECTED`.** Signature
mismatch — module was compiled without signing, or signed with a key not in
the kernel's trusted keyring. Re-sign with `scripts/sign-file` using the
kernel's own `certs/signing_key.pem`.

**Stale `.ko` fails with `ENOENT` after toolchain bump.** Symbol CRC
mismatch between the old `.ko` and the new kernel. Always `rm -f *.ko *.o`
before rebuilding after a rustc or kernel version change. Do NOT use
`make M= clean` — it deletes generated Kbuild files that some modules
require.

**kprobe registration returns `-ENOENT`.** The symbol name was not found by
the kprobe infrastructure (or the kernel was compiled without `CONFIG_KPROBES`).
For symbol-name probes: verify the symbol exists in `/proc/kallsyms` on a
running kernel. For address-based probes (used by the offensive module): ensure the
resolved address is non-zero before calling `register_kprobe`.
