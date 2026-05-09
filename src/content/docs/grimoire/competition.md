---
title: Competition Mode
description: Real-time CTF, war games, faction wars, and the global leaderboard. Compete to be the best hacker in GRIMOIRE.
---

Competition Mode is where GRIMOIRE stops being a training simulator and becomes a sport. Three formats run side-by-side: **CTF events**, **war-game seasons**, and **faction wars**. All three feed the same global leaderboard.

## CTF events

Standard capture-the-flag tournaments — head-to-head or team — over a fixed time window. Hosted on a Sovereign-tier player's mesh, federated through the GRIMOIRE tier of Sanctum (v49 Crystal Net), scored against the same SHA-256-attested lab manifests as free-play.

**Formats supported**:

- **Jeopardy** — solve labs from a categorised board within a time window
- **Attack–Defence** — each team gets a vulnerable service; defend yours, exploit theirs
- **King of the Hill** — control a contested machine; XP per minute of uptime
- **Boss Contract** — single legendary-difficulty multi-phase lab; first team to complete wins

Every CTF lab solution is **peer-verified**: at least one tier-3+ player from a different faction must reproduce your write-up before the score commits to the leaderboard. This is enforced by the `synos-audit-trail` HMAC-SHA256 append-only chain.

## War-game seasons

Season-long campaigns driven by the **ALFRED adversary AI** rotating through threat profiles. The adversary uses real attack patterns (catalogued in MITRE ATT&CK) but with novel chaining and timing. Players defend their own infrastructure and attack adversary-controlled assets.

The adversary's behaviour comes from ALFRED's four-path consciousness fusion engine:

| Path                      | Role in the adversary                                     |
|---------------------------|-----------------------------------------------------------|
| **Traditional AI**        | Known-attack signature replay, baseline recon              |
| **Neuromorphic SNN**      | Temporal pattern recognition — picks moments to strike     |
| **Quantum coherence**     | Fragment Field anomaly seeding (the AI hides in physics)   |
| **TNGS (neural Darwinism)** | Generates novel attacks by analogy to past ones          |

Seasons last 30–60 days. Final standings carry forward as faction reputation, individual ranking, and Sovereign Operator Path progression credit.

## Faction wars

Persistent low-intensity conflict between **Crimson Spire**, **Neon Collective**, and **The Warden**. Every faction has a war-board listing contested objectives — control of certain mission types, leaderboard positions in specific cert-track challenges, narrative chapters in the metaplot.

Faction reputation feeds into:

- **RICO contract dispersal** — high-rep players get first refusal on new boss contracts
- **Faction HQ unlocks** — the Bevy FactionHQ plugin renders rooms, NPCs, and cutscenes that unlock based on faction war state
- **Inter-faction rivalry bonuses** — completing a lab against your faction's current rival faction pays bonus XP

## The global leaderboard

A single ranked list across **all** GRIMOIRE players, scoring:

- Total XP earned
- Lab score (weighted: harder lab = more weight)
- War-game finals position across the last 4 seasons
- Faction reputation
- Peer-verified solutions submitted *and* peer-verifications performed for others

The leaderboard is hosted on the v49 Crystal Net Sanctum federation. Each Sovereign-tier instance contributes scoring deltas; the canonical board is computed by federated aggregation with cryptographic receipts (PromptGuard + `synos-attest-ledger`, v46 Threadwalker).

## Anti-cheat

GRIMOIRE takes cheating seriously because it would erode the entire point of the leaderboard.

- **Lab integrity manifests** — every lab is SHA-256-hashed; tampering invalidates the run
- **Submission attestation** — every solution submission carries a v48 Forge cosign signature with Rekor transparency log entry
- **Telemetry signing** — Bevy plugin events sign their stream with the player's tenant-scoped key (`synos-tenant`)
- **Peer verification** — no high-tier solution counts toward leaderboard until at least one tier-3+ player from a different faction independently reproduces the result
- **ALFRED behavioural baseline** — the cerebellum + amygdala stack flags submissions whose interaction profile diverges sharply from the player's training history (typing cadence, tool use, error patterns); flagged solutions get extra scrutiny rather than auto-rejected

## How to host

Sovereign-tier players can host CTF events and small war-game scrimmages on their own mesh:

```bash
grimoire host create --type ctf --duration 4h --max-teams 16
grimoire host federate --tier grimoire-public
grimoire host invite --discord <invite-code>
```

Hosted events publish their finals to the global leaderboard on completion (with HMAC-SHA256 chain receipts), and the host earns Sovereign reputation for running clean events.

## Next: [Six-Layer Stack →](/architecture/layers/)
