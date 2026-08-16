---
tags: [general]
title: GRIMOIRE
description: GRIMOIRE
---
tags: [general]

# GRIMOIRE

GRIMOIRE is the gamified cybersecurity training platform that ships as the
public face of Syn_OS. It wraps 100 hand-authored labs in an XP-driven
progression system, a faction allegiance model, a loot and crafting
economy, branching narrative quests, boss contracts that chain multiple
labs into a single scenario, and leaderboards that let cohorts compare
progress across a mesh. This page describes its structure, how its labs
are laid out on disk, how the gamification and competition systems fit
together, and how the first-boot experience onboards a new user.

GRIMOIRE is distinct from the master internal profile. It is the Public
profile's default AI-assisted training environment and its code, tests,
and data are fully open under the Apache 2.0 license. The
master-only surfaces that the training platform intentionally does not
expose are fenced off by the Grimoire Curtain symbol scanner, which is
covered in a separate architecture note.

## Front-end: `grimoire-tui`

The shipping GRIMOIRE front-end is **`grimoire-tui`**, a pure terminal TUI and a second
front-end binary in the `synos-gamification` crate, built on the Bevy-free engine core. The
earlier Bevy 0.14 3D client (`synos-bevy`) is **tabled** and excluded from workspace resolution.
`grimoire-tui` loads the full lab corpus (`tui/corpus.rs`), runs playable accept / turn-in quests
(persisted sidecar), and adds a learning-loop engine on top of the XP system:

- **Per-lab analytics** — time on lab, tries, and hint usage, surfaced in a post-lab **DEBRIEF**
  screen.
- **Login streaks** and an **adaptive next-lab recommendation** from the learner's real curve.
- A **knowledge-gap heatmap** on the MASTERY screen (per-learner today; population aggregation
  is future work).
- **Real prestige passives** (account-wide XP passive) and **codex / lore unlocks** persisted as
  `codex:` story flags.

Lab authoring is gated by a content-pipeline validator (`GRIMOIRE_TUI_VALIDATE=1 grimoire-tui`),
currently at 241 labs / 0 errors with ~492 non-blocking quality warnings outstanding.

## Overview

A GRIMOIRE session looks like this from the user's point of view:

1. Boot Syn_OS, go through the first-boot wizard, pick a faction.
2. Open `grimoire-tui` from the terminal (or its desktop launcher). Browse the 13 lab
   categories. Pick a lab at your current skill tier.
3. Solve the lab. Submit your answer or artifact. The XP engine credits
   your account, updates your certification-path readiness, records the
   attempt's analytics for the DEBRIEF, and (optionally) advances a quest
   or boss contract.
4. Spend earned currency on loot / crafting, check the leaderboard if
   you are in a cohort, and let the adaptive recommender pick what to tackle next.

The infrastructure that makes this work is split across several crates
under `fruit/crates/` (notably `synos-grimoire` and `synos-gamification`),
a lab content tree at `fruit/core/labs/`, and a Rust + bash wizard
package that lives alongside the grimoire crate.

## The lab corpus

GRIMOIRE ships the full lab corpus of 241 labs across 13 categories. Authoring is gated by
the content-pipeline validator (`GRIMOIRE_TUI_VALIDATE=1 grimoire-tui`) at 241 labs / 0 errors,
and every file in the lab tree is hashed in `fruit/core/labs/INTEGRITY_MANIFEST.toml` and
verified by `cargo xtask lab-integrity --verify`.

The 13 categories, by focus:

| Category | Focus |
|---|---|
| `advanced` | Hard multi-stage exploitation, real-world complexity. |
| `ai-red-team` | Attacks on ML/AI systems and prompt-driven agents. |
| `beginner` | First-contact labs for users with no prior background. |
| `crypto` | Classical + modern crypto attacks and misuses. |
| `defense` | Blue-team detection, hardening, and response. |
| `forensics` | Disk, memory, network, and file-level forensics. |
| `homelab` | Guided setup of a persistent home lab environment. |
| `intermediate` | Skill-bridge labs between beginner and advanced. |
| `mesh` | Labs that exercise the [ARCANUM Hive](./arcanum-hive.md) mesh. |
| `nightmare` | Intentionally punishing end-game scenarios. |
| `privesc` | Local privilege escalation chains on Linux and Windows. |
| `quests` | Narrative branches that chain other labs. |
| `raids` | Multi-user cooperative scenarios. |

If you add a lab, you update the manifest in the same patch or CI rejects the change.

## Lab structure

Each lab lives in its own directory under the category folder. A minimal
lab looks like this:

```
fruit/core/labs/beginner/bash-basics/
├── lab.toml           # metadata: name, difficulty, XP reward, tags
├── README.md          # task description, objectives, hints policy
├── solution.md        # canonical solve-up (gated behind a flag)
└── scripts/
    └── setup.sh       # optional: provisioning run at lab start
```

A richer lab (typically `advanced/` or `raids/`) may add:

```
├── docker-compose.yml # containerized target services
├── payloads/          # pre-built attack payloads
├── artifacts/         # disk images, pcaps, memory dumps
└── hints/             # staged hint files behind paywall / XP gate
```

The `lab.toml` is the only required metadata file. Its schema is defined
in the `synos-grimoire` crate and includes fields for the lab's XP award,
difficulty tier, required tools (looked up against ALFRED's ToolRegistry),
MITRE ATT&CK tactic coverage, prerequisites (by lab ID), and any faction
affinity bonus.

A sample `lab.toml`:

```toml
[lab]
id = "beginner/bash-basics"
name = "Bash Basics"
difficulty = 1
xp_base = 50

[tactics]
mitre = ["TA0002"]

[prerequisites]
labs = []

[rewards]
currency = 10
loot_table = "beginner_tier_1"
```

## XP system

The gamification crate, `synos-gamification`, is the largest single crate
in the GRIMOIRE tree. It is approximately 98,000 lines of Rust with 130
integration tests and 1272 `#[test]` markers across its modules. The size
reflects the surface area: levels, XP sources, multipliers, achievements,
daily / weekly challenges, contribution credit, faction-weighted bonuses,
and the certification-path recommender all live here.

The level curve is a modified logarithmic one. Each level's XP threshold
is computed from a base and a growth factor, with explicit caps at the
prestige boundaries. The exact formula lives in `level.rs` and is
property-tested (see the "Testing" section below).

**XP sources** recognized by the engine:

- Lab completion (base XP from `lab.toml`).
- Lab speed-run bonuses (a multiplier applied if the lab's timer
  threshold is beaten).
- Achievement unlocks (one-time XP grants from a static achievement
  table).
- Daily and weekly challenge completion.
- Upstream contributions merged into the Syn_OS repository — an XP grant
  keyed off a signed commit attestation, so you cannot forge it by
  editing a local file.
- Boss contract completion (see "Boss contracts" below).

**Multipliers** stack multiplicatively (not additively) up to a hard cap,
with the cap enforced by one of the property tests. Faction affinity,
first-time completion, and active event modifiers are the primary
multiplier sources.

## Competition Mode

`fruit/crates/synos-grimoire/src/competition/` implements five competition
modes. The subdirectory is approximately 1,834 lines of Rust split across
`mod.rs`, `scoring.rs`, `state.rs`, and `persistence.rs`.

| Mode | Description |
|---|---|
| `CTF` | Classic capture-the-flag with point-based scoring and flag submissions. |
| `AttackDefense` | Two-team simultaneous red/blue with a service-uptime scoring component. |
| `SpeedRun` | Timed single-lab or lab-chain completions ranked by elapsed time. |
| `KingOfHill` | Persistent-control scoring over a contested target. |
| `Tournament` | Bracketed elimination built out of SpeedRun matches. |

The competition runtime is stateful. `state.rs` defines the persistent
match state that survives restarts; `persistence.rs` handles the
on-disk serialization; `scoring.rs` is the scoring logic split into
per-mode handlers. All five modes share the same event bus so a
tournament can be implemented as a schedule of SpeedRun matches without
the tournament code needing to understand individual lab logic.

Competition mode is off by default — you opt into it from the GRIMOIRE
dashboard, and individual labs can mark themselves as ineligible for
specific modes via a `[competition] eligible` field in `lab.toml`.

## Certification path mapping

`fruit/crates/synos-gamification/src/cert_paths/` implements the cert
readiness recommender. It covers 11 certifications (OSCP, OSEP, CISSP,
CEH, PNPT, CRTO, OSWE, GPEN, GCIH, CCSP, GREM as currently loaded) and
has 15 dedicated tests.

The mapping file for each cert is a TOML document listing the topic
areas the cert covers and the minimum lab coverage depth required per
topic. The recommender walks a user's lab completion history, computes
coverage per topic, and returns a readiness score plus a ranked list of
recommended next labs — the labs that would move the largest number of
low-coverage topics toward threshold.

The recommender is advisory. It does not claim any lab was authored by
or endorsed by the certification body. It is a "what have I practiced"
scorecard, not a shortcut. That distinction is called out explicitly in
the UI text and in the README for each mapping file.

### Ed25519-signed GRIMOIRE certifications

Separate from the advisory cert-readiness recommender, GRIMOIRE issues its own
cryptographically-signed credentials. `grimoire-tui` (`src/cert.rs`) earns a credential per
skill track — Practitioner / Adept / Master — and can issue and verify it from the CLI
(`GRIMOIRE_TUI_ISSUE_CERTS=1`, `GRIMOIRE_TUI_VERIFY_CERT=<blob>`). The engine-side Ed25519
signing and verification are implemented and live; the production issuer is the GRIMOIRE daemon
and a public `/verify` endpoint is a deploy follow-on, not yet stood up.

## Faction system

GRIMOIRE has three factions. Each has a reputation value, a mission
board, NPC dialogue, and story arcs that branch based on faction
allegiance. Faction membership is chosen during the first-boot wizard
and can be changed later at a reputation cost.

The faction plugin is called `FactionHQPlugin` and lives inside the
`synos-grimoire` crate. It hooks the XP engine to apply faction-weighted
multipliers, hooks the lab runner to check faction prerequisites, and
owns the NPC dialogue state machine. The three factions have
distinctive flavor (HQ-Ward, Crimson Spire, and Outer Ring as the
current lineup), but the mechanics they expose are symmetric — no faction
is objectively stronger, only stylistically different.

## Boss contracts

A boss contract is a multi-lab scenario with its own narrative payload
and larger combined XP reward. Instead of a single `lab.toml`, a boss
contract is a directory under `fruit/core/labs/raids/` or
`fruit/core/labs/nightmare/` that contains a `contract.toml` describing
the contract arc, the ordered list of constituent labs, the narrative
beats inserted between them, and the larger final reward.

The engine treats a boss contract as a state machine. Progress through
the contract is persisted to the user's save file, so you can step away
from a boss and come back to it without losing progress. Contracts can
branch — one lab's solution can unlock a different next lab based on
the approach taken — which is how the "quests" category interacts with
the boss system.

## External platform bridges

GRIMOIRE can optionally track progress against external training
platforms (Hack The Box, TryHackMe, OverTheWire). The integration is
implemented behind a Cargo feature flag called `live-bridges`. On the
master profile this feature is off by default and the code paths that
reach out to the external platforms are `unimplemented!()` stubs — they
are compile-time gated, so any attempt to call them from a
production-profile build fails to link. This means the `unimplemented!()`
panics cannot reach a user; they exist for local development only.

The public GRIMOIRE profile ships with `live-bridges` off. There is no
runtime flag that will turn it on in the shipped binary. If you want
external platform tracking, you build from source with
`--features live-bridges` and accept the responsibility of configuring
your own API credentials outside the production profile.

## First-boot wizard

On the first boot of a GRIMOIRE install, a wizard introduces the
platform, asks the user to pick a faction, optionally enables
leaderboard participation, and creates the initial save file. The
wizard is split into two layers:

- **`fruit/crates/synos-grimoire/wizard/first-boot.sh`** — 704 lines of
  bash implementing a 5-screen TUI. This is what a user actually sees.
  The TUI renders via `dialog`, handles the faction-selection UI, and
  shells out to the Rust wizard library for state persistence.
- **`fruit/crates/synos-grimoire/src/wizard/mod.rs`** — 608 lines of
  Rust with 22 tests. This is the state machine, the save-file writer,
  and the validation logic. The bash TUI calls into it through a
  stable CLI surface so the two layers can be tested independently.

Deployment is through an XDG autostart file installed by stage 14 of
the [ISO build pipeline](./iso-build-pipeline.md). The autostart entry
has a once-only guard (`~/.config/synos/grimoire-first-boot.done`) so
it cannot run twice for the same user.

## Grimoire Curtain

The Grimoire Curtain is a binary symbol scanner that runs as a
post-build check during stage 14. It inspects every shipping binary
and asserts that no master-only symbol — identifiable by a prefix list
maintained in the curtain's rules file — has leaked into the public
GRIMOIRE binary. If the curtain finds a banned symbol, the pipeline
fails loudly. The curtain is a belt-and-suspenders defense on top of
the Cargo feature flags that already fence the master code paths off
at compile time.

A deeper walk through the curtain's rules, exceptions, and how to run
it manually against a local build belongs in its own architecture
page; it is referenced here so GRIMOIRE's compile-time / post-build
guarantees are easy to find.

## Lab integrity

Labs are signed. Every file in the lab tree has a SHA-256 hash recorded
in `fruit/core/labs/INTEGRITY_MANIFEST.toml`, and the manifest itself is
generated and verified by the lab integrity xtask:

```bash
# Regenerate the manifest after modifying labs
cargo xtask lab-integrity --generate

# Verify the manifest matches the tree on disk
cargo xtask lab-integrity --verify
```

The verify step is a CI gate. A PR that modifies a lab without
regenerating the manifest is rejected before it can merge. This is how
the platform guarantees that a user's local copy of a lab is the same
one the author published.

## Testing

GRIMOIRE's testing strategy has three layers:

**Unit and integration tests** — 130 integration tests in the
gamification crate alone, plus the per-subsystem tests in competition,
cert-paths, and the wizard. Run the whole suite with
`cargo test -p synos-gamification -p synos-grimoire`.

**Property tests** — `just proptest` runs nine proptest targets that
sample roughly 2,300 random inputs each, checking invariants of the XP
engine. The invariants include:

- Level monotonicity: more XP never produces a lower level.
- Multiplier cap enforcement: the effective XP multiplier never exceeds
  the hard cap, no matter what sequence of events you apply.
- Achievement idempotence: unlocking an already-unlocked achievement
  never grants a second XP payout.

**Benchmarks** — Criterion benchmarks live under `benches/` in each
crate. The ones that matter most are the XP application benches (how
fast can we credit an XP event?) and the cert-path recommender benches
(how fast does the readiness score update after a lab completion?).

The proptest and benchmark targets are not on the default CI path —
they are run nightly by the Syn_OS CI rig against the latest merge.
They catch regressions that unit tests miss and provide the baseline
numbers used to detect performance regressions in the engine.
