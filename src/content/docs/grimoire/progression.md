---
title: XP & Progression
description: How the GRIMOIRE progressive-unlock system works — XP, tier gates, certification mapping, and the Sovereign Operator Path.
---

GRIMOIRE Public is built around **earned-not-given progression**. You start with a 10-tool starter kit and 5 intro labs, and you build the rest of your toolkit, your authority, and your reputation through play. Everything ships pre-bundled in the ISO; XP grants execution permission via Curtain v3 capability tokens.

The system is implemented in the `synos-progression` crate — 57 tests, 111-entry seed catalog, integrated with the Bevy SkillTree plugin for visual unlock animation.

## The starter kit

Out of the box on GRIMOIRE Public:

| Tool       | Why it's in the starter kit                              |
|------------|----------------------------------------------------------|
| `nmap`     | Port scanning — universal language of recon              |
| `wireshark`| Packet capture — see what's actually on the wire          |
| `netcat`   | The Swiss Army knife of TCP                              |
| `curl`     | HTTP probing, header manipulation                        |
| `tcpdump`  | Headless packet capture for SSH-only sessions            |
| `strace`   | Trace syscalls — understand what a binary actually does  |
| `ltrace`   | Trace library calls — one layer up from `strace`         |
| `hexdump`  | Read raw bytes when text utilities lie                   |
| `binwalk`  | Find embedded files and entropy boundaries               |
| `strings`  | Extract printable strings — the dumbest tool that wins   |

Plus 5 intro labs covering basic recon, web inspection, and binary analysis.

## How XP works

```
XP = base × difficulty_multiplier × (1 - hint_penalty) + faction_bonus + cert_track_bonus
```

| Difficulty       | Base XP | Multiplier |
|------------------|--------:|-----------:|
| Beginner         |     100 |       1.0× |
| Intermediate     |     250 |       1.5× |
| Advanced         |     500 |       2.0× |
| Expert           |   1,000 |       3.0× |
| Legendary        |   2,500 |       5.0× |

- **Hint penalty** — each hint reduces the lab's XP award by 10–25 % depending on hint depth
- **Faction bonus** — completing a lab inside your faction's specialty stack multiplies the award
- **Cert track bonus** — labs aligned with an active cert path you're pursuing pay extra
- **Streak bonus** — 5 in a row without hints unlocks a cooldown-skip token

## Unlock tiers

The progression system organises content into **five tiers**. Each tier requires both XP threshold *and* completion of a tier-gate lab.

| Tier | Threshold       | Tier gate                                  | Sample unlocks                                           |
|------|-----------------|--------------------------------------------|----------------------------------------------------------|
| **0 — Initiate** | 0 XP    | First boot wizard                          | Starter kit + 5 intro labs                               |
| **1 — Apprentice**| 1,500 XP | "First Foothold" Beginner lab gate         | `nikto`, `gobuster`, `enum4linux`, `dig`, `whois`, AD recon labs |
| **2 — Journeyman**| 6,000 XP | "Pivot or Perish" Intermediate gate        | `metasploit-framework`, `crackmapexec`, `bloodhound`, web app labs |
| **3 — Master Class**| 18,000 XP | Advanced certification-aligned challenge  | RE labs, malware sandbox, cloud labs, full Purple Team track |
| **4 — Expert**   | 50,000 XP | Expert-tier boss contract                  | AI security labs, blockchain labs, war-game participation |
| **5 — Sovereign**| 150,000 XP | Salvage Yard chapter complete + peer-verified solution | Full ALFRED Master mode (where allowed by Curtain), mesh node leadership |

## Certification mapping

GRIMOIRE labs are tagged with the cert paths they prepare you for. Activating a cert track in your profile triples relevant lab payouts and gives you a study-roadmap view in the SkillTree plugin.

| Cert family               | Tracks supported                                    |
|---------------------------|-----------------------------------------------------|
| **Offensive Security**    | OSCP · OSEP · OSWE · OSCE³                          |
| **SANS / GIAC**           | GPEN · GWAPT · GCIH · GCFA · GREM · GMON            |
| **(ISC)²**                | CISSP · CCSP                                        |
| **EC-Council**            | CEH · CHFI                                          |
| **INE**                   | eJPT · eCPPT                                        |
| **Cloud**                 | AZ-500 · SC-100 · CCSP-AWS                          |
| **Defensive vendor**      | Splunk Core/Power · Sentinel · Elastic              |

Activating a track does not commit you — you can swap any time. The SkillTree plugin animates a "what's next?" recommendation engine driven by ALFRED's hippocampus crate (long-term memory consolidation of your performance patterns).

## The Sovereign Operator Path

A long-form questline that graduates a player from CTF novice to running their own encrypted mesh:

1. **Initiate** — finish the 5 intro labs
2. **Apprentice** — pick a faction, complete the faction onboarding chapter
3. **Journeyman** — complete one lab from each of 8 of the 13 categories
4. **Master Class** — earn one peer-verified solution (your write-up reviewed by a tier-3+ player)
5. **Expert** — survive a full war-game season and finish in the top 25 % of your faction
6. **Sovereign** — complete the **Salvage Yard** arc (build a 3-node ARCANUM mesh from reclaimed hardware, run a local LLM on it, host an instance of GRIMOIRE for at least one other player)

Sovereign-tier players can host their own GRIMOIRE instances, federate (within the GRIMOIRE tier) with other Sovereigns, and earn the Sovereign Operator credential — peer-issued, verifiable on-chain via the `synos-audit-trail` HMAC-SHA256 chain.

## What XP does *not* unlock

XP does not promote you to Master. It cannot. Curtain v3 enforces a hard ceiling regardless of progression:

- AI dispatch syscalls 470–474 always return `ENOSYS`
- LLM federation stays tier-isolated to GRIMOIRE peers
- Audit chain HMAC roots stay separated
- Fragment Field IDS kernel-side detection stays Master-only

This is by design: GRIMOIRE produces operators; Master is what gets sold to customers who need the actual weapon for actual work.

## Next: [Competition Mode →](/grimoire/competition/)
