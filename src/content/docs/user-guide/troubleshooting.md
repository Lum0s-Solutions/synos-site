---
title: Troubleshooting
description: Fixes for common Syn_OS issues — boot failures, black screens, no network, ALFRED not starting, and GRIMOIRE lab problems.
---

This guide covers common issues encountered when booting or using Syn_OS.

## Boot Failures

### The machine doesn't boot from USB

**Symptoms:** Machine boots into the existing OS, ignoring the USB.

1. Enter your firmware/BIOS settings (usually `F2`, `F10`, `F12`, or `Delete` at power-on).
2. Navigate to **Boot Order** / **Boot Priority**.
3. Move the USB device to the top of the boot order.
4. Save and exit. Ensure the USB is seated in a USB 3.0 (blue) port if available.

If the machine still ignores the USB, try a different port — rear desktop
ports are often more reliable than front-panel ports.

### The USB is not detected in the BIOS

- The USB was written incorrectly — re-flash with `dd` or Rufus.
- Secure Boot is blocking unsigned media — disable it in **Security** or
  **Boot** settings.

### GRUB shows but selecting an entry causes an immediate reboot

The ISO was likely written incorrectly or is corrupt.

1. Re-verify the checksum: `sha512sum -c SHA512SUMS`
2. Re-flash the USB with `dd` or Rufus (avoid unetbootin — it modifies the ISO).

### The installer (Calamares) won't start, or fails "cannot find the live filesystem"

**Cause:** The ISO was booted through a **loopback / multi-boot USB tool**
rather than a direct-written stick. Those tools boot the image through a
loopback mount, and Calamares can't locate the live root (squashfs) to unpack
onto disk.

**Fix:** Write the ISO **directly** to a USB stick:

- **Windows** — [Rufus](https://rufus.ie), choose **DD Image** mode.
- **Windows / macOS / Linux** — [balenaEtcher](https://etcher.balena.io).
- **Linux** — `sudo dd if=<image>.iso of=/dev/sdX bs=4M status=progress oflag=sync`.

---

## Default Live Credentials

The live session auto-logs in, but if you need to authenticate manually (a
TTY, `sudo`, or a crashed session):

- **Username:** `synos`
- **Password:** `toor`

The installer forces a password change on first login to an installed
system — the live-session password above only applies to the live/USB boot.

---

## Black Screen After GRUB

### Black screen with a cursor (KMS failure)

The kernel mode-setting driver failed to initialize for your GPU.

1. At the GRUB menu, select the **Safe Mode** entry.
2. This disables KMS and falls back to the generic VESA framebuffer.
3. Once booted, check your GPU: `lspci | grep VGA`

If you have a hybrid GPU (Intel + NVIDIA), the NVIDIA card may be taking
over — Safe Mode forces the Intel integrated GPU, which is fully supported.

### Black screen with no cursor

The display server or session manager failed to start.

1. Press `Ctrl+Alt+F2` to switch to a TTY.
2. Log in with the default live credentials (see below).
3. Check the display-manager log: `journalctl -u lightdm -b 0`
4. Check the Xorg log: `cat /var/log/Xorg.0.log | grep EE`

Common culprits:

- Missing GPU driver — the ISO ships Intel, AMD, and Nouveau drivers;
  proprietary NVIDIA is not included by default.
- A GPU-accelerated session failing to start: try the lighter Xfce4 session
  from the login screen if the default Cinnamon session won't come up.

### Screen works but desktop doesn't load (wallpaper only, no panel)

The desktop session crashed after login.

```bash
# Restart the Cinnamon session process
cinnamon --replace &

# Or restart the whole session from a TTY
pkill -u synos cinnamon-session
```

---

## No Network

### No wired Ethernet after boot

1. Check the cable and physical connection.
2. Run `ip link show` — you should see an `eth0`- or `enp*`-style device.
3. Start NetworkManager: `sudo systemctl start NetworkManager`
4. Request DHCP: `sudo nmcli dev connect <interface_name>`

### Wi-Fi adapter not detected

Run `lspci` and `lsusb` to identify your adapter. Common problem adapters:

| Adapter | Issue | Fix |
|---------|-------|-----|
| MT7630e / MT76x0e (MediaTek) | Driver needs out-of-tree package | `paru -S mt76-git` (AUR) |
| Realtek RTL8188EUS | In-tree driver unstable | `modprobe r8188eu` or `8188eu` |
| NETGEAR A6210 (MT7612) | Needs firmware | `sudo modprobe mt76x2u` |

Broadcom (BCM) adapters: install `broadcom-wl-dkms` from AUR.

### Connected to Wi-Fi but no internet access

1. Check DNS: `nslookup google.com`
2. Check the default route: `ip route show | grep default`
3. Flush the resolver cache: `sudo systemd-resolve --flush-caches`
4. On hotel/campus Wi-Fi, open a browser and complete the captive portal.

---

## ALFRED Not Starting

### `alfred status` shows "inactive" or "failed"

```bash
systemctl --user status alfred
journalctl --user -u alfred -b 0 -n 50
```

**Common causes:**

1. **The daemon isn't running as a user service.** ALFRED runs under
   `systemd --user`, not system-wide:
   ```bash
   systemctl --user enable alfred
   systemctl --user start alfred
   ```
2. **Socket permission error.** ALFRED listens on a Unix socket at
   `~/.local/run/alfred.sock`; verify the directory is writable by your user.
3. **Missing model files.** ALFRED's local model manager wraps Ollama —
   check `alfred models list` and re-pull if a model is missing.

### ALFRED starts but doesn't respond to queries

```bash
alfred status                   # shows compute mode, active model, KB size
journalctl --user -u alfred -b 0 -f
```

If `alfred status` reports `cpu-only` unexpectedly on a machine with a GPU,
reinstall the matching `ollama-cuda` / `ollama-rocm` pacman package and
restart the daemon.

---

## GRIMOIRE Lab Issues

### "Database not initialized" on first launch

GRIMOIRE's player/lab catalog database is SQLite-backed
(`/var/lib/synos/grimoire/grimoire.db` by default, overridable with the
`GRIMOIRE_DB` environment variable). On a fresh live session it seeds on
first run automatically; if seeding failed:

```bash
grimoire-seed --init-db
```

### Lab fails to start

GRIMOIRE labs run in an isolated sandbox (Firecracker microVM-backed, via the
`synos-lab-sandbox` service). If a lab won't launch:

```bash
systemctl --user status grimoire-daemon
journalctl --user -u grimoire-daemon -b 0 -n 50
```

Restart the lab from the GRIMOIRE menu rather than retrying the same launch —
a stuck sandbox is usually cleared by a fresh lab start.

---

## Performance Issues

### The desktop is slow or stuttering

On hardware with less than 4 GB RAM or integrated graphics only:

1. Switch to the lighter **Xfce4** session at the login screen instead of
   the default Cinnamon session.
2. Disable Cinnamon effects: **System Settings → Effects**.

### High memory usage from ALFRED

ALFRED's active model typically uses 1–4 GB RAM depending on size. On a 4 GB
system, pin a smaller model:

```bash
alfred models default llama3.2:3b
```

---

## Getting More Help

- **GitHub Issues** on the project repository (tag with your image profile and version).
- **Security issues:** [contact@churchofmalware.org](mailto:contact@churchofmalware.org) — do not post these publicly.

When opening an issue, include:

```bash
uname -a
cat /etc/synos-release 2>/dev/null || echo "no synos-release file"
journalctl -b 0 -p err --no-pager | tail -30
```
