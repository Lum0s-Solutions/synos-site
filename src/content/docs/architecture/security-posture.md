---
tags: [general]
title: "Security Posture — Understanding Your System's Defenses"
description: "Security Posture — Understanding Your System's Defenses"
---
tags: [general]

# Security Posture — Understanding Your System's Defenses

This guide explains how to check and interpret your Syn_OS system's security posture. You'll learn what each defense mechanism does and how to verify it's working.

---
tags: [general]

## Quick Overview

Syn_OS includes multiple layers of defense:

1. **Mandatory Access Control (AppArmor)** — restricts what processes can do
2. **Kernel Hardening** — hardens kernel behavior against exploitation
3. **Module Signing Enforcement** — verifies kernel modules are signed before loading
4. **Post-Quantum Supply Chain Verification** — fail-closed package verification
5. **Firewall** — controls network traffic
6. **Secure Boot** — verifies boot components (when available)

You check these with a single command:

```bash
synos-posture
```

---
tags: [general]

## Understanding synos-posture Output

### Run the Command

```bash
synos-posture
```

### Example Output (Master Node)

```
╔══════════════════════════════════════════════════════╗
║   Syn_OS SECURITY POSTURE                              ║
╚══════════════════════════════════════════════════════╝
  ●  AppArmor MAC           module enabled, 7 profiles in enforce mode
  ●  Kernel lockdown        mode: integrity (kprobes enabled for telemetry)
  ○  Module sig enforce     sig_enforce=N (modules are signed but not enforced)
  –  Secure Boot            state unknown (VM/UEFI firmware limitation)
  ●  PQ supply chain        enforcing, fail-closed, 1 signer enrolled
  ○  Host firewall          no active firewall
  ●  Kernel hardening       3/3 sysctls set (ASLR, DEP, kptr_restrict)

  GRADE  B+  (72/90 · 80%)
```

### Understanding the Symbols

- **●** (filled circle) = **WORKING / ENFORCING** ✓ — This defense is active
- **○** (empty circle) = **AVAILABLE BUT NOT ENFORCED** — Present but in informational/permissive mode
- **–** (dash) = **NOT AVAILABLE / UNKNOWN** — Either not applicable to your hardware (VMs), or firmware doesn't expose the setting

### Understanding Each Field

#### AppArmor MAC (Mandatory Access Control)

```
●  AppArmor MAC    module enabled, 7 profiles in enforce mode
```

**What it does:** Restricts what processes can access — even if a process gets compromised, AppArmor limits its reach.

**●** means:
- AppArmor is loaded
- 7 application profiles are in **enforce mode** (actively restricting: ALFRED, GRIMOIRE, security tools)
- Violations are logged and blocked

**If it shows ○ (permissive):** Violations are logged but not blocked (warning-only mode). Master node should show ●.

**Check the details:**
```bash
sudo apparmor_status
```

Output shows:
- Number of profiles loaded
- How many are in enforce vs. complain vs. unconfined mode
- Which processes are currently confined

Example good state:
```
apparmor module is loaded.
7 profiles are loaded.
7 profiles are in enforce mode.
0 profiles are in complain mode.
1 processes have profiles defined.
1 processes are in enforce mode.
  /opt/synos/alfred/bin/alfred (1234)
```

---
tags: [general]

#### Kernel Lockdown

```
●  Kernel lockdown    mode: integrity (kprobes enabled for telemetry)
```

**What it does:** Locks down privileged kernel features to prevent tampering. On `integrity` mode, kprobes (used for real-time system monitoring) are allowed but immutable.

**●** means: Lockdown is active.

**Modes:**
- `integrity` = **preferred** — allows telemetry via kprobes, blocks privileged load
- `confidentiality` = strict; blocks even kprobes (rarely used)
- `none` = lockdown off (not recommended on master)

**If it shows – (unknown):** Likely a VM without lockdown kernel support. This is non-critical on non-production systems.

**Verify:**
```bash
cat /sys/kernel/security/lockdown
```

Expected: `integrity`

---
tags: [general]

#### Module Signature Enforcement

```
○  Module sig enforce    sig_enforce=N (modules are signed but not enforced)
```

**What it does:** Verifies kernel modules are signed before loading them. This prevents loading malicious or tampered kernel code.

**What you're seeing:** Modules ARE signed (the build enforces this), but the kernel is not *enforcing* verification at load time yet.

**Why ○, not ●?** The enforce flag (`module.sig_enforce=1`) is typically set in release builds for production. On development/test systems, it's off for flexibility.

**Check the boot parameter:**
```bash
cat /proc/cmdline | grep sig_enforce
```

Output:
- `module.sig_enforce=0` or empty = not enforced (●would show as ○)
- `module.sig_enforce=1` = enforced (shows as ●)

**On master production node,** this should be `1` and show as **●**.

---
tags: [general]

#### Secure Boot

```
–  Secure Boot    state unknown (VM/UEFI firmware limitation)
```

**What it does:** UEFI firmware verifies the bootloader and kernel haven't been tampered with before handing control to the OS.

**Why –?** Most common reasons:
- Running in a virtual machine (QEMU/Hyper-V don't expose Secure Boot status to the OS)
- BIOS mode (not UEFI) — Secure Boot is a UEFI feature
- Firmware doesn't support UEFI Secure Boot

**On physical hardware with UEFI firmware,** you can enable it:
1. Reboot and enter BIOS/UEFI settings (usually `F2` or `Del` at boot)
2. Find Security → Secure Boot
3. Set to Enabled
4. Save and exit

After reboot, `synos-posture` should show it as ● or ○ depending on enrollment status.

---
tags: [general]

#### Post-Quantum Supply Chain

```
●  PQ supply chain    enforcing, fail-closed, 1 signer enrolled
```

**What it does:** Verifies package signatures using post-quantum cryptography. If a signer is enrolled, package verification is **fail-closed** — installation fails unless the package is signed correctly.

**●** means: PQ verification is active and a signer is enrolled.

**What it tracks:**
```bash
synos-pq-trust list
```

Output:
```
trust roster: /etc/synos/pq-trust
  [ENFORCED] synos-master-pq-2026-08  (both keys present — signatures required)
```

This shows:
- `[ENFORCED]` = verification is fail-closed for this signer
- `synos-master-pq-2026-08` = the signer's identity (timestamp indicates key rotation cycle)
- `both keys present` = ML-DSA (signing key) + ML-KEM (encryption key) both enrolled

**Adding a signer (advanced):**
```bash
synos-pq-trust add /path/to/pubkey.pem
# Now packages from that key's signer MUST be signed or installation fails
```

**Removing a signer:**
```bash
synos-pq-trust remove synos-master-pq-2026-08
```

---
tags: [general]

#### Host Firewall

```
○  Host firewall    no active firewall
```

**What it does:** Controls inbound/outbound network traffic using iptables/nftables rules.

**Why ○?** No systemwide firewall is actively running. However:
- GRIMOIRE labs have isolated networking (Docker/firecracker)
- SSH is open (needed for operator access)
- GRIMOIRE port 8090 is open (local-only by default)

**Check the firewall ruleset (nftables — ufw is intentionally inactive):**
```bash
sudo nft list ruleset
```

Output might show:
```
Status: inactive
```

**If you want to enable it (advanced):**
```bash
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 8090  # GRIMOIRE daemon
sudo ufw show added
```

---
tags: [general]

#### Kernel Hardening

```
●  Kernel hardening    3/3 sysctls set (ASLR, DEP, kptr_restrict)
```

**What it does:** Enables Linux kernel security hardening settings that make exploitation harder.

**●** means all 3 are set:
- **ASLR** (Address Space Layout Randomization) = randomizes memory layout
- **DEP** (Data Execution Prevention) = prevents executing code in data regions
- **kptr_restrict** = hides kernel pointer values from user processes

**Verify manually:**
```bash
# Check ASLR
cat /proc/sys/kernel/randomize_va_space
# Output: 2 = full ASLR (good)

# Check DEP (usually kernel compile-time)
cat /proc/sys/kernel/kptr_restrict
# Output: 2 = most restrictive (good)
```

---
tags: [general]

### Understanding GRADE

```
GRADE  B+  (72/90 · 80%)
```

The grade is calculated as a percentage of security hardening features enabled:

| Grade | Percentage | What it means |
|-------|-----------|---------------|
| **A** | 90–100% | Excellent — all defenses active |
| **B** | 80–89% | Good — most defenses active, minor gaps |
| **C** | 70–79% | Fair — some defenses missing or in permissive mode |
| **D** | 60–69% | Weak — multiple key defenses disabled |
| **F** | <60% | Critical — significant gaps |

**B+ (72/90) = Good state** — ALFRED, GRIMOIRE, and kernel hardening are active. The "missing" 20 points typically come from:
- No active host firewall (○)
- Secure Boot unknown (–)
- Module signature enforcement not enforced (○)

These are acceptable gaps on a test/dev system but should be addressed on production master nodes.

---
tags: [general]

## Advanced: Checking Individual Subsystems

### AppArmor Violations and Denials

If an AppArmor profile is too restrictive and blocking legitimate activity, denials are logged:

```bash
sudo grep -i apparmor /var/log/audit/audit.log | tail -20
# or
sudo dmesg | grep apparmor | tail -20
```

If you see `DENIED` messages for legitimate tools, the profile may need adjustment (contact the security team).

### Checking Kernel Module Loading

Verify that kernel modules are being verified:

```bash
sudo dmesg | grep -i "signature verification"
```

Or, monitor live module loading:

```bash
sudo modprobe <module_name>  # loads a module
sudo dmesg | grep -i "signature\|module" | tail -5
```

### NATS Message Bus (GRIMOIRE comms)

Verify the NATS server is running:

```bash
systemctl --user status nats-server
# or
sudo systemctl status nats-server  # system-wide on some profiles
```

---
tags: [general]

## Troubleshooting Low Security Scores

If your grade drops below `C` (70%), investigate:

1. **Check which defenses are missing:**
   ```bash
   synos-posture
   ```

2. **For AppArmor issues:**
   ```bash
   sudo systemctl status apparmor
   sudo journalctl -u apparmor -n 50
   ```

3. **For kernel hardening issues:**
   ```bash
   cat /proc/cmdline  # check boot parameters
   sysctl -a | grep security  # check all sysctl settings
   ```

4. **If you made a change and want to revert:**
   ```bash
   # Most hardening is read-only at runtime
   # You'd need to reboot with proper kernel cmdline / sysctl defaults
   sudo sysctl kernel.dmesg_restrict=1  # example re-enable
   ```

---
tags: [general]

## Best Practices

1. **Run `synos-posture` monthly** to track your security posture over time.

2. **Escalate GRADE drops** — if your grade falls more than 5 points, investigate immediately.

3. **Don't disable AppArmor** — even if a profile seems restrictive. Instead, report the issue so it can be fixed.

4. **Keep kernel module signature enforcement on production** — set `module.sig_enforce=1` in the boot cmdline for production master nodes.

5. **Use the PQ trust roster carefully** — once you add a signer, all packages from unknown signers will be rejected. Only add trusted signers.

---
tags: [general]

## Reference: Security Profiles

Different Syn_OS profiles have different security baselines:

| Profile | AppArmor | Firewall | PQ Trust | Grade |
|---------|----------|----------|----------|-------|
| **Master** | 7 enforce | Optional | Enrolled | B+ |
| **GRIMOIRE** | 5 enforce | Optional | Enrolled | B |
| **GoodLife** | 3 enforce | Disabled | Disabled | C |

The master profile (v111) maintains B+ posture by default. All profiles support upgrading their posture.

---
tags: [general]

## Verified On

- **Syn_OS v111.0.0 "Last Light"**
- **Profile:** Master
- **Reference node:** a representative Syn_OS v111 master install
- **Date:** 2026-08-05

Last verified: 2026-08-05
