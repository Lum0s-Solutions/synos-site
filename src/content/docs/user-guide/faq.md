---
title: Support FAQ
description: Practical questions about running Syn_OS day to day — hardware, tools, GRIMOIRE, ALFRED, privacy, and how to report bugs.
---

This page covers day-to-day, "I'm running it, how does it work" questions. For the
product/business FAQ (open source model, licensing, what v111 means), see the
[main FAQ](/reference/faq/).

## General

### What is Syn_OS?

Syn_OS is an Arch Linux derivative built for cybersecurity professionals and
students. It combines a native security tool arsenal, the GRIMOIRE gamified
training platform, and ALFRED — a local AI daemon designed for security
operations.

### What is GRIMOIRE?

GRIMOIRE is the gamification layer of Syn_OS. It turns cybersecurity training
into an MMO: you pick a faction, earn XP for completing labs, unlock tools and
perks, and compete on leaderboards. 241 hands-on labs are mapped to MITRE
ATT&CK and to real-world certification tracks (OSCP, GIAC, CEH, and others).

### Is Syn_OS free?

Yes. Syn_OS is open-core. The base OS and the full GRIMOIRE training
platform — all 241 labs — are free and source-buildable, no account or
subscription required. A small set of offensive/member-tier crates are
git-crypt-gated behind a Church of Malware membership key; everything else,
including every lab, is open. There is no per-lab paywall.

### Is Syn_OS stable enough to use as a primary OS?

Syn_OS is built on Arch Linux. If you install it to disk you get rolling
updates like any Arch system. It's a reasonable secondary or primary OS for
practitioners comfortable with Arch's maintenance model. If you're new to
Arch, run it live from USB or in a VM first.

---

## System Requirements

### What are the minimum hardware requirements?

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | x86_64, 2 cores | 4+ cores, Intel VT-x / AMD-V |
| RAM | 4 GB | 8+ GB (16 GB for local AI workloads) |
| Storage (live) | None | — |
| Storage (installed) | 20 GB | 50+ GB SSD |
| Boot mode | BIOS or UEFI | UEFI |

### Does Syn_OS run on ARM or Apple Silicon?

No. Syn_OS targets x86_64 only; ARM is not on the near-term roadmap.

### Can I run Syn_OS in a VM?

Yes — QEMU/KVM, VirtualBox, and VMware Workstation all work. Allocate at
least 4 GB RAM and 2 vCPUs, and enable 3D acceleration in your VM settings
for a smoother desktop session.

---

## Security Tools

### What security tools are included?

Syn_OS ships 155 native security tools on `PATH` out of the box (via
pacman/AUR), plus the full BlackArch, Kali, and Parrot toolsets on demand
through Distrobox container overlays (~2,800 packages). See the
[Tool Manifest](/grimoire/tool-manifest/) for the full breakdown by category
and delivery mechanism.

### Does Syn_OS include Cobalt Strike?

No. Cobalt Strike is commercial software licensed by Fortra. Syn_OS does not
bundle or redistribute it — install your own licensed copy after boot if you
have one.

### Are offensive tools restricted on the GRIMOIRE image?

Yes. The GRIMOIRE profile ships tooling appropriate for training and
authorized testing; C2 framework binaries with no legitimate training use
are scrubbed at build time. Full-arsenal profiles are member-gated.

---

## ALFRED AI Daemon

### What is ALFRED?

ALFRED is the AI daemon built into Syn_OS (v6.0 as of the current release). It
provides a local chat/query interface for security tools, adaptive lab
difficulty, and threat-analysis assistance, routed through a multi-path
consciousness fusion engine described in the
[ALFRED architecture doc](/architecture/alfred/).

### Does ALFRED phone home?

No. ALFRED runs entirely locally. The only default network egress is
optional threat-intel feed refresh and explicit model pulls (`alfred models
pull ...`) — both can be disabled for a fully air-gapped setup.

### ALFRED is not starting. How do I fix it?

See [Troubleshooting → ALFRED](/user-guide/troubleshooting/#alfred-not-starting).

---

## Privacy and Data

### Does Syn_OS collect usage data?

The live ISO collects no telemetry. GRIMOIRE lab progress in a live session
lives in memory and is lost on reboot unless you persist it to an installed
system.

### Where is my lab progress stored?

Locally. GRIMOIRE persists player state and XP to disk on an installed
system; there is no requirement to create an online account to play.

---

## Bugs and Support

### How do I report a bug?

Open an issue on the project's GitHub repository, tagged **Bug Report**, and
include:

- Your Syn_OS version (`cat /etc/synos-release`)
- The image profile (GRIMOIRE / GoodLife / ChurchOfMalware / Master)
- Boot mode (BIOS or UEFI)
- Steps to reproduce
- Relevant logs (`journalctl -b 0 -p err`)

### I found a security vulnerability. What do I do?

Do **not** open a public issue. Email
[contact@churchofmalware.org](mailto:contact@churchofmalware.org) with
details. Coordinated disclosure and researcher credit follow the policy
published in the repository's `SECURITY.md`.
