---
title: Systemd Hardening — Syn_OS Service Isolation
description: Systemd Hardening — Syn_OS Service Isolation
---

# Systemd Hardening — Syn_OS Service Isolation

**Wave 10 | CISO Rec 03 (seccomp) + Rec 09 (ProtectProc)**
**Version:** 1.0.0 | **Date:** 2026-04-16

---

## Why Every synos-* Daemon Gets ProtectProc=invisible

Syn_OS runs GRIMOIRE lab containers alongside ALFRED in the same PID namespace on hive nodes. Without `/proc` isolation, any process in a lab (or any process running as the `grimoire` user) can:

- Enumerate ALFRED's PID via `ps aux` or `/proc/*/cmdline`
- Read ALFRED's memory maps via `/proc/<pid>/maps` — exposing ASLR layout
- Attempt to inject or attach via ptrace (mitigated separately by `@debug` seccomp block but defense-in-depth applies)

`ProtectProc=invisible` restricts each service's view of `/proc` so it sees only its own processes. Combined with `ProcSubset=pid`, non-process kernel files disappear from the service's `/proc` view entirely. This is the structural fix that makes the lab/daemon co-tenancy safe — the alternative (separate PID namespaces for every lab container) carries significantly more orchestration overhead.

---

## Scope Matrix

The hardening library (`lib/systemd-hardening.sh`) applies one of three profiles:

| Scope | Who Uses It | Deviation from Default |
|-------|------------|----------------------|
| `default` | `alfred.service`, `grimoire-daemon.service`, `grimoire-api.service`, `synos-hive-boot.service`, `synos-hive-bootstrap.service` | Full isolation: `PrivateUsers=true`, `ProtectKernelModules=true` |
| `high-priv` | `synos-hive-controller.service` | `PrivateUsers=false` — K8s node enrollment requires real UID/GID resolution against the host user namespace |
| `kernel-access` | `synos-consciousness.service` | `ProtectKernelModules=false` — runtime dlopen() of Rust kernel modules required |

Every scope applies the following base directives:

```
ProtectProc=invisible
ProcSubset=pid
PrivateTmp=true
PrivateDevices=true
ProtectSystem=strict
ProtectHome=true
ProtectHostname=true
ProtectClock=true
ProtectKernelTunables=true
ProtectKernelLogs=true
ProtectControlGroups=true
RestrictNamespaces=true
RestrictRealtime=true
RestrictSUIDSGID=true
LockPersonality=true
MemoryDenyWriteExecute=true
SystemCallArchitectures=native
```

---

## Per-Service Hardening Summary

### alfred.service (Rec 03 + Rec 09)

alfred.service receives both the ProtectProc block (from the helper) **and** a full seccomp filter inlined directly in the unit:

```ini
SystemCallFilter=@system-service
SystemCallFilter=~@privileged @module @mount @swap @reboot @raw-io @debug
SystemCallFilter=469 470 471 472 473 474 475 476 477 478 479
SystemCallErrorNumber=EPERM
SystemCallArchitectures=native
```

The excluded classes and their rationale:

| Class | Syscalls blocked | Reason |
|-------|-----------------|--------|
| `@privileged` | sethostname, reboot, CAP_SYS_ADMIN variants | ALFRED never needs to elevate |
| `@module` | init_module, finit_module, delete_module | Only `synos_modverify.ko` loads modules |
| `@mount` | mount, umount, pivot_root | ALFRED never mounts filesystems |
| `@swap` | swapon, swapoff | Never |
| `@reboot` | reboot, kexec_load, kexec_file_load | Never |
| `@raw-io` | iopl, ioperm | Pure userspace daemon |
| `@debug` | ptrace, process_vm_readv/writev, perf_event_open | Espionage and injection vectors |

Custom syscalls 469-479 are added numerically (no symbolic names exist for custom syscalls). `SystemCallErrorNumber=EPERM` is used instead of the default `SIGSYS` so Tokio handles blocked calls gracefully.

The full human-readable allowlist is at:
`fruit/iso/iso-build/scripts/assets/alfred-seccomp-allowlist.conf`

**Expected systemd-analyze security score:** ~1.4–1.6 (SAFE band). Run on the installed system:

```bash
systemd-analyze security alfred.service
```

Target: score **>= 1.5**.

### grimoire-daemon.service / grimoire-api.service (Rec 09)

Default scope. Both services run as `User=grimoire` with `CapabilityBoundingSet=` already set. The helper adds ProtectProc and companion directives without touching the existing filesystem isolation (`ReadWritePaths=`, `PrivateTmp=`, etc.).

**Expected score:** ~1.6–1.8 (SAFE).

### synos-hive-controller.service (Rec 09, high-priv)

High-priv scope: `PrivateUsers=false`. All other directives apply. The K8s enrollment flow requires real UID/GID resolution; a private user namespace would break `kubectl auth` credential mapping.

**Expected score:** ~1.8–2.0 (SAFE).

### synos-hive-boot.service / synos-hive-bootstrap.service (Rec 09)

Default scope. Both are oneshot services that run briefly at boot. Full isolation is appropriate — they do not need cross-process visibility.

**Expected score:** ~1.5–1.7 (SAFE).

---

## Adding Hardening to a New Service

1. Write the service unit file as normal inside your stage script.
2. Source the library and call `apply_systemd_hardening` after the unit is written:

```bash
local _hw_lib="${LIB_DIR}/systemd-hardening.sh"
if [[ -f "${_hw_lib}" ]]; then
    source "${_hw_lib}"
    apply_systemd_hardening "${chroot_dir}/etc/systemd/system/my-new.service" "default"
fi
```

3. Choose the correct scope:
   - Most daemons: `"default"`
   - Needs real host UIDs (K8s, LDAP, etc.): `"high-priv"`
   - Must load kernel modules at runtime: `"kernel-access"`

4. If your service needs a writable path that `ProtectSystem=strict` blocks, add a `ReadWritePaths=` directive in the `[Service]` block **before** calling the helper. The helper inserts after `[Service]` and will not remove existing directives.

5. If `MemoryDenyWriteExecute=true` breaks a JIT-using dependency (e.g. a Python extension with a JIT compiler), note the deviation in a comment and remove that specific directive via a custom scope case in `lib/systemd-hardening.sh`.

---

## Debugging: When Hardening Breaks Legitimate Functionality

**Step 1 — Check the journal:**
```bash
journalctl -u my-service.service -p err
```
Seccomp denials appear as `Operation not permitted` with the syscall name if `auditd` is running, or as signal 31 (SIGSYS) if `SystemCallErrorNumber` is not set. Because all Syn_OS services use `SystemCallErrorNumber=EPERM`, the process should log an error rather than crash.

**Step 2 — Trace the missing syscall:**
On a dev system (not ISO), run the daemon under `strace -f -e trace=all` to identify which syscall is being blocked. Add it to the service's `SystemCallFilter=` or report it to Cipher for allowlist expansion.

**Step 3 — ProtectProc conflicts:**
If a daemon legitimately reads another process's `/proc` entry (e.g. a monitoring daemon), switch its scope to `"high-priv"` or add `ProtectProc=ptrace` instead of `invisible`. Do not revert to no protection.

**Step 4 — MemoryDenyWriteExecute conflicts:**
Python, LuaJIT, and some glibc signal trampolines require W+X pages. If a dependency breaks under this directive, document it with a comment in the unit file and remove only `MemoryDenyWriteExecute` for that specific service.

**Step 5 — Verify the idempotency marker:**
The helper will not apply twice if the marker `# Syn_OS hardening applied` is already in the unit. If you need to re-apply (e.g. after editing the scope), remove the marker line and the hardening block from the unit file, then re-run the stage script.

---

## Idempotency

The helper checks for `# Syn_OS hardening applied` before inserting the block. Subsequent calls to `apply_systemd_hardening` on an already-hardened unit file are safe no-ops. The marker line is the canonical signal — do not remove it unless intentionally re-hardening.

The `apply_hardening_to_all_synos_units` function iterates over glob patterns and skips any file that does not contain a `[Service]` section, so oneshot helper scripts written as shell scripts (not unit files) will not be affected.

---

## Reference

- CISO Research: `growth/development/docs/internal/eyesonly/development/project-status/v40-sprint/v41-ciso-research.md`
- Seccomp allowlist: `fruit/iso/iso-build/scripts/assets/alfred-seccomp-allowlist.conf`
- Helper library: `fruit/iso/iso-build/scripts/lib/systemd-hardening.sh`
- Stage 11 (ALFRED): `fruit/iso/iso-build/scripts/stages/11-alfred-daemon.sh`
- Stage 11b (Hive): `fruit/iso/iso-build/scripts/stages/11b-hive-boot.sh`
- Stage 14 (GRIMOIRE): `fruit/iso/iso-build/scripts/stages/14-grimoire-platform.sh`
