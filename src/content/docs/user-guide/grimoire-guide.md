---
title: GRIMOIRE Guide
description: How to play GRIMOIRE — the gamified cybersecurity training platform built into Syn_OS. Launching labs, XP, factions, and the shared world.
---

GRIMOIRE is the gamification layer of Syn_OS, turning cybersecurity learning
into an MMO-style progression system. This guide covers day-to-day play; for
the full catalog and category breakdown see the
[GRIMOIRE overview](/grimoire/overview/) and [Lab Catalog](/grimoire/labs/).

## Launching GRIMOIRE

GRIMOIRE ships as a terminal client (`grimoire-tui`, wrapped by the `grimoire`
command on `PATH`). Launch it from any terminal:

```bash
grimoire
```

On first launch, GRIMOIRE creates your local player profile automatically —
no account or network connection required to start playing. Navigate the TUI
with the arrow keys / `Tab`, and `Enter` to select; press `?` for a
context-specific help panel at any screen.

## Choosing Your Path

GRIMOIRE offers Blue, Red, and Purple team progression tracks that shape
which quest lines and skill trees are emphasized early on — you are not
locked out of the others.

| Path | Focus | Starting quests |
|------|-------|------------------|
| Red Team | Offensive security | Reconnaissance, exploitation |
| Blue Team | Defensive security | Log analysis, incident response |
| Purple Team | Both | Threat hunting, detection engineering |

## Player Progression

### Experience Points (XP)

You earn XP by completing labs, submitting correct flags, finishing daily
and weekly challenges, and — as covered in the
[First Security Scan tutorial](/user-guide/tutorials/first-security-scan/) —
by running real security tools against your own targets and GRIMOIRE lab
targets.

### Leveling and unlocks

GRIMOIRE Public starts every player with a curated tool/lab starter kit and
unlocks additional tools, labs, and ALFRED capabilities as you progress.
See [XP & Progression](/grimoire/progression/) for the full unlock ladder.

## Labs

Labs range from short guided tutorials to open-ended challenge labs and
multi-stage war games. Each lab runs in an isolated sandbox — separate from
your host system — so you can practice safely against a deliberately
vulnerable target.

Start a lab from the TUI: **Menu → Labs → [category] → [lab name] → Start**.
The lab brief lists objectives, available tools, and a difficulty rating
before you begin.

## Achievements

GRIMOIRE tracks achievements across categories — CTF flag captures, lab
completions, tool usage milestones, and community contribution. Check your
progress from the **Profile → Achievements** screen in the TUI.

## Factions

| Faction | Home base | Focus |
|---------|-----------|-------|
| **Dark Army** | Crimson Spire | Offensive tradecraft |
| **Azure Watch** | Sky Citadel | Detection, defense, SOC workflows |
| **Gray Syndicate** | Shadow Nexus | Neutral, all-rounder path |

Choosing a faction shapes your narrative path and mission-board priorities —
it does not lock you out of any lab category. Join or check your faction
from **Menu → Factions** in the TUI.

### Faction Wars — The Shared World

Faction wars, competitive contracts, and co-op labs play out in a **shared
world** that every Syn_OS image can join — Master, GRIMOIRE Public, and
Church of Malware players compete in the same world together. Church of
Malware members carry additional access into it (see
[Membership & /claim](/churchofmalware/membership/)).

By default your image connects to a local, single-player world server — the
safe default. To join a shared/hosted world, set the endpoint your admin
gives you:

```bash
export SYNOS_WORLD_SERVER=ws://<world-server-host>:9000
```

The world server is authoritative: your faction control, contract progress,
and leaderboard standing are owned server-side, so competitive results can't
be tampered with locally. Your machine does the simulation and rendering;
the server just keeps shared state honest. Running your own world for a
private group is a mesh-node setup — see the
[World Server architecture doc](/architecture/arcanum/).

## The GRIMOIRE Daemon API

For integrations and dashboards, `grimoire-daemon` exposes a local REST API
(default `http://127.0.0.1:8090/api/v1/...`) covering player state, labs,
war games, factions, trading, and post-lab debriefs. This is intended for
local tooling (like the `synos-ops` Security tab), not a public network
service — it's not something most players need to touch directly.

## Troubleshooting

**Lab won't start**

```bash
systemctl --user status grimoire-daemon
journalctl --user -u grimoire-daemon -f
```

**Flag not accepted**

- Flags are case-sensitive; check for trailing whitespace.
- Confirm you're submitting against the currently active lab session.

**XP not updating**

```bash
grimoire-seed --seed-labs   # re-sync the local lab catalog if it looks stale
```

If the issue persists, see the general [Troubleshooting guide](/user-guide/troubleshooting/).

## Support

- Bug reports: GitHub Issues on the project repository
- Security issues: [contact@churchofmalware.org](mailto:contact@churchofmalware.org)

## Related

- [GRIMOIRE Overview →](/grimoire/overview/)
- [Lab Catalog →](/grimoire/labs/)
- [XP & Progression →](/grimoire/progression/)
- [Competition Mode →](/grimoire/competition/)
- [Tool Manifest →](/grimoire/tool-manifest/)
