---
title: GRIMOIRE Overview
description: GRIMOIRE — the competitive hacker training platform built into Syn_OS. 117 labs, 13 categories, 110+ game modules, faction wars, and a Sovereign Operator Path. Catalog 1.0.
---

**GRIMOIRE** — Gamified Reconnaissance, Intelligence, Malware Operations, Intrusion Response & Exploitation — is the cybersecurity training layer of Syn_OS. It is not a tool collection bolted onto a distro; it is a complete **progression system** for mastering offensive, defensive, and purple-team cybersecurity, preparing for industry certifications, and competing globally to be the best hacker in the game.

:::tip[Play GRIMOIRE now]
GRIMOIRE is a **playable shared-world hacking MMO** — spawn into the Weave, walk to a contested world-node, solve its real lab, and capture that territory for your faction. **The exploit *is* the objective**, and rivals can interrupt you mid-hack. GRIMOIRE ships with the Syn_OS desktop; there is no public browser build.
:::

## What GRIMOIRE covers

- **Blue Team mastery** — log analysis, SOC workflows, SIEM queries, incident response, threat hunting, forensics, detection engineering
- **Red Team tradecraft** — reconnaissance, exploitation, privilege escalation, lateral movement, C2 operations *(sandboxed)*, persistence, OPSEC discipline
- **Purple Team fusion** — collaborative exercises, detection validation against real attacks, rainbow-team coordination, war-game scenarios
- **Certification preparation paths** — OSCP / OSEP / OSWE / OSCE³ (Offensive Security), GIAC certifications (SANS), CISSP / CCSP (ISC²), CEH / CHFI (EC-Council), eJPT / eCPPT (INE), Cloud Security (AZ-500, SC-100, CCSP-AWS), and defensive tracks (Splunk, Sentinel, Elastic)
- **War games** — ongoing live scenarios with rotating threats, seasonal campaigns, and emergent gameplay driven by the ALFRED adversary AI
- **Competitive ranking** — a global leaderboard scoring who is actually the best hacker in the GRIMOIRE ecosystem (XP + lab score + war-game standing + faction reputation + peer-verified solutions)
- **Hardware mesh missions** — the **Salvage Yard** quest arc teaches players to reclaim discarded hardware and build personal inference meshes for running local AI. E-waste reduction tracked as an in-game metric.

## By the numbers

| Metric                   | Value                                                                |
|--------------------------|----------------------------------------------------------------------|
| **Labs**                 | **117 across 13 categories** (catalog **1.0**) — 71+ with full Docker overlays |
| **Game modules**         | 110+ (~53,000 LOC of `synos-gamification`)                           |
| **Engine**               | Bevy 0.14 — `synos-bevy` 7,129+ LOC                                  |
| **Bevy plugins**         | 8 — Cutscene, Mindmap, RetroFilter, Cyberspace, SkillTree, FactionHQ, Rehoboam, Twin |
| **Factions**             | 3 — Crimson Spire, Neon Collective, The Warden                       |
| **Cert paths mapped**    | 11+ professional credentials                                         |
| **Engine offline**       | All 117 labs ship pre-bundled in the ISO                             |
| **Lab integrity**        | SHA-256 manifests verified by `lab-integrity` xtask on every merge   |

## The progressive unlock system (v41+)

GRIMOIRE Public starts with a **10-tool starter kit**:

`nmap` · `wireshark` · `netcat` · `curl` · `tcpdump` · `strace` · `ltrace` · `hexdump` · `binwalk` · `strings`

…and **5 intro labs**. Players unlock additional tools, advanced labs, ALFRED capabilities, and mesh features by:

- completing labs and earning XP
- progressing faction quests
- contributing peer-verified solutions
- finishing chapters of the Salvage Yard arc

The `synos-progression` crate (57 tests, 111-entry seed catalog) drives all of this. The entire toolchain is **pre-bundled** in the ISO for offline extraction on unlock — no internet required once installed.

## The factions

| Faction              | Identity                                                                 | Thematic focus                                |
|----------------------|--------------------------------------------------------------------------|-----------------------------------------------|
| **Crimson Spire**    | The corporate-fortress red team — apex predator, brand of fire and edge  | Offensive tradecraft, purple kill-chains      |
| **Neon Collective**  | The decentralised blue team — community-defended, brand of cyber-neon    | Detection engineering, SIEM, threat hunting   |
| **The Warden**       | The lawful neutral — supply-chain integrity, the inevitable audit        | Compliance, governance, forensics, IR         |

Faction choice affects RICO contract dispersal, available boss-contract chains, mission board priorities, and faction reputation economics.

## The capability ceiling

GRIMOIRE Public **cannot** escalate to the licensed Enterprise Edition, no matter how far a player progresses, and it carries no operational offensive tooling. The **Curtain v4** runtime ceiling enforces:

- AI dispatch operations return `ENOSYS` on GRIMOIRE (capability-token enforcement)
- LLM federation is tier-isolated (GRIMOIRE nodes federate only with GRIMOIRE peers)
- Audit chain HMAC roots are separated between GRIMOIRE and the Enterprise Edition
- Fragment Field IDS kernel detection is enabled only in the licensed Enterprise Edition; GRIMOIRE gets userspace-only access
- C2 framework binaries (cobalt-strike, empire, covenant, sliver) are scrubbed at build time

This is the bedrock of the LumOs commercial model: GRIMOIRE is the talent funnel that produces the best cybersecurity operators in the world; the Enterprise Edition is the commercial product LumOs sells to organizations that need Syn_OS's full capability at scale, with multi-tenant federation and a compliance posture, under a license.

[Read the Curtain Capability Tokens deep dive →](/architecture/curtain/)

## Where to next

- **[Lab Catalog →](/grimoire/labs/)** — the 117 labs, by category
- **[XP & Progression →](/grimoire/progression/)** — how unlock works
- **[Competition Mode →](/grimoire/competition/)** — leaderboards, war games, and the Sovereign Operator Path
