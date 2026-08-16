---
title: GRIMOIRE — Gamified Security Training
description: GRIMOIRE — Gamified Security Training
---

# GRIMOIRE — Gamified Security Training

**Crate:** `synos-gamification` (~114k LOC, 110+ modules) + `synos-grimoire` (catalog engine)
**Status:** GRIMOIRE 1.0 — shipping in v111

GRIMOIRE turns offensive + defensive security training into a progression game. It is the
education layer of Syn_OS and the heart of the public/CoM image.

## Front-end: `grimoire-tui`

The shipping GRIMOIRE front-end is **`grimoire-tui`**, a pure terminal TUI and a second
front-end binary in the `synos-gamification` crate, built on the Bevy-free engine core. The
earlier Bevy 0.14 3D client (`synos-bevy`) is **tabled** and excluded from workspace resolution.
`grimoire-tui` loads the full lab corpus (`tui/corpus.rs`), runs playable accept / turn-in quests
(persisted sidecar), and hosts the learning-loop engine (see below).

:::tip[Tip]
Use `GRIMOIRE_TUI_VALIDATE=1` to run the content-pipeline validator before committing new labs. This catches integrity errors early.
:::

## Core systems
| System | What it does |
|--------|--------------|
| **Labs** | Full lab corpus across 13 categories, each UKC + MITRE ATT&CK tagged. Integrity-verified via SHA-256 manifests (`xtask lab-integrity`) and gated by the `grimoire-tui` content-pipeline validator (`GRIMOIRE_TUI_VALIDATE=1`), currently 241 labs / 0 errors (~492 quality warnings outstanding). |
| **Learning-loop engine** | Per-lab analytics (time, tries, hints) → post-lab DEBRIEF screen; login streaks; adaptive next-lab recommendation; knowledge-gap heatmap on the MASTERY screen. |
| **Certifications** | Ed25519-signed credentials (`src/cert.rs`) earned per skill track (Practitioner/Adept/Master); issue/verify from the CLI (`GRIMOIRE_TUI_ISSUE_CERTS=1`, `GRIMOIRE_TUI_VERIFY_CERT=<blob>`). Engine-side signing/verify live; production daemon issuer + public `/verify` endpoint are a deploy follow-on. |
| **XP + Skill Tree** | Pentagon stats, XP/alignment curves, and real account-wide prestige passives. Invariants property-tested (`proptest_xp.rs`). Rendered in `grimoire-tui` (the `synos-bevy` SkillTreePlugin is tabled). |
| **Faction Wars** | 3 factions with HQs, NPC mission boards, reputation systems (FactionHQPlugin). |
| **Boss Contracts** | Multi-stage objective chains gating high-tier unlocks. |
| **Economy** | Loot drops, crafting, perk synergies — a closed in-game economy. |
| **Story** | Branching narrative with codex / lore unlocks tied to progression (persisted as `codex:` story flags). (The Bevy CutscenePlugin cinematic layer is tabled with `synos-bevy`.) |
| **Multiplayer** | v71 MultiplayerPlugin — co-op/competitive play backed by the [world server](world-server.md). |

## Public vs private boundary
The **Grimoire Curtain** (`xtask curtain`) enforces what ships in the public/education image vs
the master image — binary symbol scanning (forbidden symbols) + feature audit + lab integrity.
Offensive-grade tooling and master capabilities never cross into the public build.

## Membership perks (ChurchOfMalware)
CoM org members receive faction perks/tools via the `churchofmalware` profile + grimoire-tier
gating (Discord-role verification + shared image + token). See the membership docs.

## Key files
- `fruit/crates/synos-gamification/` — engine (~114k LOC) + the `grimoire-tui` binary
- `fruit/crates/synos-gamification/src/tui/corpus.rs` — full lab corpus loader for the TUI
- `fruit/crates/synos-gamification/src/cert.rs` — Ed25519-signed certifications
- `fruit/crates/synos-grimoire/` — lab catalog
- `fruit/crates/synos-bevy/src/plugins/{skills,faction_hq,cutscene}.rs` — tabled Bevy 3D UI (retained, not shipping)
- `growth/development/docs/public/grimoire/lab-catalog.md` (note: catalog currently under `public/churchofmalware/`)
