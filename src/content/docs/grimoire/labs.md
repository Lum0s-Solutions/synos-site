---
title: Lab Catalog
description: 108 GRIMOIRE labs across 13 categories (catalog 1.0), every one with Docker overlays, MITRE ATT&CK + UKC tags, difficulty rating, and SHA-256 integrity manifests.
---

Every lab in GRIMOIRE ships with a Docker overlay (the majority with full network-isolated environments), a MITRE ATT&CK tag, a Unified Kill Chain (UKC) phase tag, a difficulty rating, and an XP reward. Labs are verified by the `lab-integrity` xtask; SHA-256 manifests are regenerated on every merge to `main`. The full catalogue is **pre-bundled** in every GRIMOIRE Public ISO — unlocks just grant execution permission, never download anything.

## The 13 categories

| Category                     | Labs |   Difficulty range      | Highlights                                                                |
|------------------------------|:----:|:-----------------------:|---------------------------------------------------------------------------|
| **Network Fundamentals**     |   8  | Beginner → Intermediate | TCP/IP deep-dives, Wireshark analysis, VLAN hopping                        |
| **OSINT & Recon**            |   7  |   Beginner → Advanced   | Shodan, FOCA, Maltego automation, passive DNS pivoting                    |
| **Web Application Security** |  10  |    Beginner → Expert    | SQLi, SSRF, deserialization chains, JWT forgery, CORS abuse                |
| **Active Directory**         |   9  |   Intermediate → Expert | AS-REP roasting, DCSync, Kerberoast, BloodHound analysis                  |
| **Exploitation Basics**      |   7  | Beginner → Intermediate | Buffer overflows, shellcode, ROP chains (x86_64)                          |
| **Reverse Engineering**      |   6  | Intermediate → Advanced | Ghidra workflows, anti-debug bypass, packer unpacking                     |
| **Malware Analysis**         |   6  |  Intermediate → Expert  | Static + dynamic YARA authoring, sandbox evasion detection                |
| **Cloud Security**           |   6  |  Intermediate → Expert  | AWS misconfiguration enumeration, Azure AD attacks, IAM privesc           |
| **AI Security**              |   5  |  Intermediate → Expert  | Prompt injection, model inversion, adversarial examples, LLM red-teaming  |
| **Cognitive Warfare**        |   4  |    Advanced → Expert    | Influence-op simulation, deepfake detection, PSYOP analysis               |
| **Blockchain Security**      |   4  |  Intermediate → Expert  | Smart-contract reentrancy, frontrunning, bridge exploits                  |
| **Purple Team / Detection**  |  14  |  Intermediate → Expert  | Detection engineering, Sigma rule authoring, SIEM correlation             |
| **API Security**             |   8  | Intermediate → Advanced | REST / GraphQL abuse, OAuth misconfigurations, mass assignment            |

**Total: 108 labs, 13 categories (catalog 1.0), ~110+ game modules wrapping them.**

## What every lab ships with

- **Briefing** — narrative mission context (faction-aware), objective, success criteria, XP award
- **Environment** — Docker overlay or local sandbox, network-isolated, content-addressable + zstd-L22 deduplicated for fast first-boot loading
- **MITRE ATT&CK tag** — tactic + technique + sub-technique, surfaced in the SkillTree plugin
- **UKC phase tag** — Recon / Weaponize / Deliver / Exploit / Install / C2 / Actions on Objectives
- **Difficulty rating** — Beginner / Intermediate / Advanced / Expert / Legendary
- **Progressive hint system** — each hint costs XP; full walkthrough after completion
- **Debrief** — annotated walkthrough showing the "right" path *and* common alternative solutions submitted by other players
- **Lab integrity manifest** — SHA-256 hash of every file in the lab, verified at unlock time

## Docker overlay architecture

71+ labs ship with content-addressable Docker overlays:

- **Dedup layer** — common base images (`synos/lab-base:v80`, `synos/lab-network:v80`, `synos/lab-ad:v80`) are stored once and overlay-mounted per lab
- **Compression** — zstd level 22 inside the squashfs; first-boot loader expands hot paths into `/var/lib/grimoire/labs/`
- **Network isolation** — each lab spins on its own bridge (`grimoire-lab0`, `lab1`, …) with no path to the host LAN by default
- **Sandbox** — seccomp BPF filter (`synos-lab-sandbox`) blocks an 18-syscall deny list, validates x86_64 architecture, and enforces AppArmor profile `synos.grimoire.lab`

## Lab integrity & build provenance

Every lab is hashed and signed during the v48 Forge reproducible-build pipeline:

```bash
grimoire verify-lab web-sqli-blind-002
# → SHA-256 manifest matches signed release attestation
# → Sigstore Rekor entry: https://rekor.sigstore.dev/api/v1/log/entries/...
# → SLSA-3 provenance: ✓
```

If a lab manifest fails verification, the SkillTree plugin refuses to unlock it and the `lab-integrity` xtask flags the binary for re-extraction.

## Faction missions vs free-play

- **Faction missions** — narrative arcs that unlock contracts, tools, and mesh capabilities. Required for Sovereign Operator Path advancement.
- **Free-play labs** — pick any unlocked lab from the catalogue and run it standalone for XP.
- **War-game scenarios** — live ALFRED-driven adversary rotation; only available in Competition Mode.

## What's not in GRIMOIRE Public

The following are **scrubbed at build time** for the public profile (Curtain v3 enforcement):

- Cobalt Strike, Empire, Covenant, Sliver C2 binaries (game-only stand-in: `synos-c2-sandbox`)
- Master-tier AI dispatch operations (capability-token enforcement; return `ENOSYS` on GRIMOIRE)
- Real-target offensive labs (anything tagged `master-only` in the manifest)
- Federation peering with non-GRIMOIRE Sanctum tenants

[Read the weaponization ceiling →](/architecture/curtain/)

## Next: [XP & Progression →](/grimoire/progression/)
