---
title: AppArmor Enforcement in Syn_OS
description: AppArmor enforcement profiles for ALFRED, GRIMOIRE, and consciousness engine daemons.
---

# AppArmor Enforcement in Syn_OS

**v41 Wave 10 — CISO Rec 02 closure**
**Applies to:** all ISO profiles (master, grimoire, goodlife)

---

## Why enforce mode is non-negotiable

ALFRED talks to Ollama, the brainstem, 11 custom syscalls (469-479), and federation
peers across the Arcanum Hive. GRIMOIRE runs labs that execute exploit code inside
containers. A single successful LLM prompt-injection attack against ALFRED in
**complain mode** would write arbitrary files to disk without producing any blocking
event — only a log line that nobody may ever read.

Complain mode is a development aid, not a production posture. Syn_OS ships with
four daemon profiles in enforce mode. A CI gate prevents any PR from regressing them.

:::danger[CI Gate]
A CI gate prevents any PR from regressing AppArmor profiles from enforce to complain mode. This is enforced in the build pipeline and must not be bypassed.
:::

---

## Profile inventory

| Profile file | Protects | Key denials |
|---|---|---|
| `usr.local.bin.alfred` | ALFRED AI daemon | `/dev/mem`, `/dev/kmem`, `/proc/*/mem`, firmware, `/etc/shadow`, `/boot` writes |
| `usr.local.bin.grimoire-daemon` | GRIMOIRE backend daemon | `/dev/mem`, firmware, `/boot` writes |
| `usr.local.bin.grimoire-api` | GRIMOIRE HTTP API server | `/dev/mem`, firmware, `/etc/shadow`, `/boot` writes |
| `usr.local.bin.synos-consciousness` | Consciousness engine / brainstem | `/dev/mem`, `/dev/kmem`, `/proc/*/mem`, firmware, `/etc/shadow` |

All four profiles carry `flags=(enforce)` in the profile header. The AppArmor service
loads them at boot in enforce mode — no runtime `aa-enforce` call is needed after
first boot, but stage 08 still runs it for belt-and-suspenders coverage.

---

## Troubleshooting a legitimate denial

### 1. Locate the denial event

AppArmor denials appear in the audit log and kernel ring buffer:

```
journalctl -k -g "apparmor.*DENIED"
ausearch -m AVC -ts recent
```

The denial line contains the profile name, the denied operation, and the target path.

### 2. Identify the access pattern

Determine whether the denied access is genuinely required by the daemon. Check
`/var/log/synos-ai/` or `journalctl -u alfred.service` for context around the time
of the denial.

### 3. Widen the profile — do not drop to complain

If the access is legitimate, widen the profile in
`fruit/iso/iso-build/scripts/stages/08-apparmor-policy.sh`. Add the
minimal rule that permits the operation. Do not add `/**` wildcards without a comment
explaining why. Submit the change through the normal PR process — the CI gate will
confirm the profile still carries `flags=(enforce)`.

Example — adding read access to a new config path:

```
# Allow ALFRED to read tenant config injected by the MSSP provisioner
/etc/synos/tenants/** r,
```

### 4. Temporary debug on a dev instance ONLY

On a non-production development machine you may temporarily switch a profile to
complain mode to capture the full access trace:

```bash
aa-complain /etc/apparmor.d/usr.local.bin.alfred
# reproduce the problem
ausearch -m AVC -ts recent > /tmp/alfred-denials.txt
aa-enforce /etc/apparmor.d/usr.local.bin.alfred
```

This is **not permitted on production or MSSP customer deployments**. The ops
dashboard flags any node whose ALFRED profile is not in enforce mode.

---

## CI gate — adding new profiles

The CI gate (`apparmor-enforce-gate.yml`) runs `cargo xtask apparmor-check` on every
PR that touches:

- `fruit/iso/iso-build/scripts/stages/08-apparmor-policy.sh`
- `fruit/core/src/apparmor/**`
- `growth/xtask/src/commands/apparmor_check.rs`

To add a new synos-* daemon profile to the gate:

1. Write the profile with `flags=(enforce)` in its header.
2. Install it in stage 08 under `/etc/apparmor.d/usr.local.bin.<daemon>`.
3. Add the profile filename to `REQUIRED_PROFILES` in
   `growth/xtask/src/commands/apparmor_check.rs`.
4. Add a corresponding profile file under
   `fruit/core/src/apparmor/profiles/usr.local.bin.<daemon>` so the xtask can read it.
5. Submit a PR. The gate will verify the new profile carries `flags=(enforce)` before
   it can merge.

---

## Kernel lockdown interaction

Syn_OS v41 promotes `lockdown=confidentiality` from the hardened boot entry to
`CMDLINE_BASE`, affecting all profiles (CISO Rec 01). The interaction with AppArmor
is additive: AppArmor enforces MAC policy at the process level; lockdown enforces
integrity at the kernel level. They are complementary.

What lockdown=confidentiality blocks that AppArmor does not cover directly:

- `/dev/mem` and `/dev/kmem` direct reads (AppArmor denies these too, but lockdown
  makes the kernel reject them regardless of DAC/MAC permissions)
- kprobes and tracing interfaces that could exfiltrate kernel memory
- Unprivileged BPF program loading (CAP_BPF is still required)
- kmsg read restrictions for unprivileged processes

If a synos daemon legitimately needs an operation that lockdown blocks, the correct
fix is to grant the required capability (`AmbientCapabilities=` in the systemd unit)
rather than downgrading lockdown mode. The opt-out boot entry
("Troubleshoot — lockdown=integrity") is strictly for diagnostic use.

AppArmor profile rules that deny `/dev/mem` are retained even with lockdown enabled
because defense-in-depth requires both layers to enforce independently.

---

*Last updated: v41 Wave 10 | Author: Cipher | CISO Recs 01+02*
