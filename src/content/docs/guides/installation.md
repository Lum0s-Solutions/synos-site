---
title: Installation
description: Burn a USB, boot Syn_OS, and install with the Calamares wizard. Optional Ventoy multi-boot, FIDO2/TPM unlock, and persistence.
---

Syn_OS uses the **Calamares** graphical installer with a custom Syn_OS branding module and the v43.2 first-boot wizard rewrite. The installation flow is identical across the three ISOs; the difference is which profile flag the ISO carries internally.

## Burn the USB

Pick one. All ISOs are bootable on UEFI and Legacy BIOS.

### dd (Linux / macOS)

```bash
sudo dd if=synos-grimoire-public-v80.0.0.iso of=/dev/sdX bs=4M status=progress conv=fsync
sync
```

Replace `/dev/sdX` with your USB device. **Double-check** with `lsblk` first — `dd` overwrites the target without prompting.

### Rufus (Windows)

1. Download the ISO and verify SHA-256 against the published checksum
2. Open Rufus, select the ISO, set **Partition scheme** to GPT, **Target system** to UEFI
3. Leave file system as FAT32 (Rufus will create a hybrid layout)
4. Click **Start** → **Write in DD Image mode** when prompted

### Ventoy multi-boot

Syn_OS ISOs are Ventoy-compatible. Drop the ISO onto a Ventoy USB drive (`/ventoy/iso/`) alongside other distributions and select Syn_OS from the Ventoy boot menu. Ventoy plugin support includes locked menu (admin PIN) and ISO signature verification — the v42 USB power toolkit ships a `ventoy.json` template.

## Boot the live ISO

1. Plug in the USB and reboot into the firmware boot menu (commonly **F12** / **F11** / **Esc** / **F2**)
2. Select the USB drive
3. The Syn_OS GRUB menu appears with Phoenix branding (Crimson Spire theme)
4. Default option boots the live system; advanced options expose memtest, forensic mode, and EFI shell

The first-boot animation is **Plymouth** with the Phoenix decay sequence — `decay_000` → `decay_002` cross-fading into the neural-node sigil.

## Install with Calamares

From the live desktop, double-click **Install Syn_OS** on the desktop or in the application menu. The installer walks through:

1. **Welcome** — language, region, keyboard layout
2. **Partitioning** — guided (replace, alongside, encrypted) or manual
   - LUKS2 encrypted root is supported with optional **FIDO2 / TPM 2.0 unlock** (v42 USB power toolkit)
3. **Users** — username, hostname, root account policy
4. **Profile selection** — confirms which ISO profile is active (you cannot cross-install)
5. **Summary** — review before commit
6. **Install** — Calamares deploys the squashfs, runs `customize_airootfs` (stage 18), regenerates initramfs, installs GRUB
7. **Finish** — reboot into the installed system

### What the installer does that vanilla Calamares doesn't

- Re-runs `synos-cradle-verify` after first boot to validate the kernel module signing chain (`synos-cradle-verify.service`)
- Bootstraps the v43.2 first-boot wizard (display-manager singleton enforcement, failed-services rewrite)
- Pulls the brand metadata from `/etc/synos/brand-meta.toml` for hostname / motd / issue
- Schedules the daily ConMon collector if compliance posture is enabled (FedRAMP / CMMC / SOC2)

## Optional: persistence on USB (no install)

GRIMOIRE Public USB drives can run with **LUKS2-encrypted persistence** so XP and unlocked labs survive across boots without installing to disk. From the live system:

```bash
sudo synos-usb-persistence init --device /dev/sdX --size 16G
```

This creates a LUKS2 container, mounts it at first boot, and overlays `/home`, `/var/lib/grimoire`, and `~/.config/alfred`.

## Verify the install

After first boot:

```bash
synos-doctor                 # 41-stage post-install validation wizard
synos-ops                    # ALFRED TUI (23 tabs: system, benchmark, hive, services, ALFRED, PQ-posture, supply-chain, and more)
grimoire status              # GRIMOIRE state + unlocked tools
```

If `synos-doctor` reports anything red, head to the [Reference / Troubleshooting](/reference/) section.

## Next: [First Boot →](/guides/first-boot/)
