---
title: Customizing Your Desktop
description: Personalize the Syn_OS Cinnamon desktop — themes, wallpaper, panels, keybindings, terminal, and the synos-ops color scheme.
---

This tutorial walks you through personalizing your Syn_OS desktop. Syn_OS
ships **Cinnamon** as the primary desktop environment and **Xfce4** as a
lighter alternative, both themed against the Red Phoenix / Syn_OS Dark Red
palette out of the box. Everything below is reversible — the defaults live
in `/etc/skel` and are deployed at first login, so you can always wipe
`~/.config/` and log back in to restore factory defaults.

## What You'll Learn

- How the stock Cinnamon theme is laid out and where the assets live.
- How to install additional GTK and icon themes via `pacman` and the AUR.
- How to replace the wallpaper, rebind panels, and customize keyboard shortcuts.
- How to recolor the `synos-ops` TUI dashboard.
- Where the Xfce4 variant lives if you prefer a lighter session.

## Prerequisites

- A running Syn_OS desktop session (live or installed).
- An account with `sudo` for any `pacman` installs.
- Basic familiarity with `dconf` / `gsettings` helps but isn't required.

---

## 1. The Stock Red Phoenix Theme

| Asset | Path |
|---|---|
| GTK theme | `/usr/share/themes/Syn_OS-Dark-Red/` |
| Icon theme | `/usr/share/icons/Syn_OS-Phoenix/` |
| Cursor theme | `/usr/share/icons/Syn_OS-Cursors/` |
| Cinnamon theme | `/usr/share/cinnamon/theme/` |
| Plymouth boot theme | `/usr/share/plymouth/themes/syn_os/` |
| GRUB theme | `/boot/grub/themes/syn_os/` |
| Wallpapers | `/usr/share/backgrounds/synos/` |

Per-user overrides live under `~/.config/` and `~/.local/share/`. New users
are seeded from `/etc/skel/`, so that's the "factory" copy you can compare
against.

---

## 2. Switching GTK and Icon Themes

```bash
ls /usr/share/themes/
ls /usr/share/icons/

# Install from the official repositories
sudo pacman -S arc-gtk-theme papirus-icon-theme

# Or from the AUR (paru)
paru -S whitesur-gtk-theme-git
```

Apply it in Cinnamon:

```bash
gsettings set org.cinnamon.desktop.interface gtk-theme 'Arc-Dark'
gsettings set org.cinnamon.desktop.interface icon-theme 'Papirus-Dark'
gsettings set org.cinnamon.desktop.interface cursor-theme 'Syn_OS-Cursors'
```

Or use **Menu → Preferences → Themes**. Manual installs from `.tar.gz`
archives go under `~/.themes/` (GTK) and `~/.icons/`. Restart Cinnamon
(`cinnamon --replace &`) if a new theme doesn't show up in the picker.

---

## 3. Wallpaper Management

```bash
gsettings set org.cinnamon.desktop.background picture-uri \
  "file:///usr/share/backgrounds/synos/red-phoenix-circuit-4k.png"
```

Or right-click the desktop → **Change Desktop Background**. Drop your own
PNG/JPEG files into `~/.local/share/backgrounds/` to add them to the picker.

---

## 4. Panel Customization

```bash
# Back up the current layout
dconf dump /org/cinnamon/ > ~/cinnamon-backup.dconf

# Add a second bottom panel
gsettings set org.cinnamon panels-enabled "['1:0:top', '2:0:bottom']"
gsettings set org.cinnamon panels-height "['1:32', '2:32']"
```

Right-click a panel to add applets (menu, workspace switcher, systray,
network monitor). Restore the factory layout with:

```bash
dconf load /org/cinnamon/ < /etc/skel/.config/cinnamon/panels.dconf
```

---

## 5. Keyboard Shortcut Rebinding

Inspect current bindings:

```bash
dconf dump /org/cinnamon/desktop/keybindings/
```

Or **Menu → Preferences → Keyboard → Shortcuts**. Syn_OS ships these on top
of the Cinnamon defaults:

| Shortcut | Action |
|---|---|
| `Ctrl+Alt+A` | Launch `synos-ops` TUI dashboard |
| `Ctrl+Alt+G` | Launch GRIMOIRE |
| `Ctrl+Alt+L` | Lock screen |
| `Super+E` | Open file manager |
| `Super+D` | Show desktop |

Rebinding is usually easiest through the GUI — Cinnamon creates the
`custom0`/`custom1` slots automatically the first time you add a binding.

---

## 6. Terminal Customization

The default terminal reads themes from `~/.config/tilix/` (or the
`org.gnome.Terminal.Legacy.Profiles` dconf schema if using `gnome-terminal`
as a fallback). Import a palette via **Preferences → Advanced → Import
Scheme** — Syn_OS ships a `Red-Phoenix.json` palette under
`/usr/share/tilix/schemes/`.

Install more fonts via pacman:

```bash
sudo pacman -S ttf-jetbrains-mono-nerd ttf-firacode-nerd
```

---

## 7. `synos-ops` TUI Color Scheme

The `synos-ops` dashboard reads its palette from `~/.config/synos/ops.toml`:

```toml
[ops.theme]
name    = "red-phoenix"
bg      = "#0B0B0F"
fg      = "#F5F5F5"
accent  = "#CC0000"
warn    = "#FFB400"
err     = "#FF4040"
ok      = "#50FA7B"
muted   = "#6272A4"
```

Copy `/etc/skel/.config/synos/ops.toml`, edit the hex values, then reload
without restarting:

```bash
pkill -HUP synos-ops
```

---

## 8. Using the Xfce4 Variant

Pick **Xfce4** from the login-screen session menu for a lighter session:

```bash
xfconf-query -c xsettings -p /Net/ThemeName -s "Syn_OS-Dark-Red"
xfconf-query -c xsettings -p /Net/IconThemeName -s "Syn_OS-Phoenix"
```

---

## 9. Restoring Defaults

```bash
rm -rf ~/.config/cinnamon ~/.config/tilix ~/.config/synos/ops.toml
cp -a /etc/skel/.config/cinnamon ~/.config/
cp -a /etc/skel/.config/tilix   ~/.config/
cp -a /etc/skel/.config/synos   ~/.config/
cinnamon --replace &
```

---

## Troubleshooting

**Theme not showing up in the picker.** Confirm it's in a standard path
(`/usr/share/themes/`, `~/.themes/`), then restart Cinnamon or log out and
back in.

**Colors look wrong on high-DPI displays.** Set
`org.cinnamon.desktop.interface text-scaling-factor` to `1.25` or `1.5`.

**`synos-ops` palette changes ignored.** Confirm you edited
`~/.config/synos/ops.toml` (not the read-only `/etc/skel/` copy) and sent
`SIGHUP`.

**Wallpaper reverts after reboot.** On a live-boot ISO, `~/.config/` changes
don't persist — install to disk first.

## Related Tutorials

- [Using AI Features](/user-guide/tutorials/using-ai-features/) — customize the ALFRED widget appearance.
- [First Security Scan](/user-guide/tutorials/first-security-scan/) — put the customized environment to work.
- [Benchmarking](/user-guide/tutorials/benchmarking/)
