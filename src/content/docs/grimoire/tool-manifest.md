---
title: Tool Manifest
description: The security tooling shipped with Syn_OS, by delivery mechanism — native pacman/AUR, Distrobox containers, and per-lab pinned images.
---

Syn_OS is an Arch derivative, so native tooling comes from pacman/AUR; the
long tail comes from containerized distro overlays.

## Native (pacman / AUR) — 155 tools

Installed into the base image and available on `PATH` without containers.

| Category | Examples |
|----------|----------|
| Recon / OSINT | nmap, masscan, amass, theHarvester, recon-ng |
| Web | burpsuite, ffuf, sqlmap, nikto, gobuster, zaproxy |
| Network | wireshark, tcpdump, bettercap, responder, mitmproxy |
| Exploitation | metasploit, exploitdb, sliver, gophish |
| Cred / Hash | hashcat, john, hydra, secretsdump |
| Reversing | ghidra, radare2, gdb, binwalk |
| Wireless | aircrack-ng, kismet, hcxtools |
| Forensics / DFIR | volatility3, sleuthkit, autopsy, yara |
| Blue team | suricata, zeek, osquery, wazuh-agent |

## Containerized (Distrobox) — full BlackArch on demand

For tools not packaged for Arch, or pinned to a specific distro, Syn_OS
ships Distrobox overlays of **Kali**, **BlackArch**, and **Parrot**. Each
overlay is a one-command container giving the full upstream toolset
(~2,800 packages across the combined ecosystem) without polluting the host —
keeps the base image lean while making the entire offensive/defensive
tooling ecosystem reachable.

## GRIMOIRE lab tools

The 241 GRIMOIRE labs bundle their own pinned tooling inside per-lab
container images, so lab exercises are reproducible and isolated from the
host. See the [Lab Catalog](/grimoire/labs/).

## Supply-chain posture

- AUR is **never pulled live** — upstream releases are pinned and hash-verified.
- Module/binary signing plus pacman pinning with build attestation.
- A CycloneDX SBOM is generated per image profile.

## Related

- [GRIMOIRE Overview →](/grimoire/overview/)
- [Support FAQ → What security tools are included?](/user-guide/faq/#what-security-tools-are-included)
