---
tags: [grimoire gamification]
title: Progressive Unlock System — Grimoire Public Design Spec
description: Progressive Unlock System — Grimoire Public Design Spec
---
tags: [grimoire gamification]

# Progressive Unlock System — Grimoire Public Design Spec

**Date:** 2026-04-17 (v40 Wave 7.5 strategic pivot)
**Status:** DESIGN — implementation targeted v41
**Scope:** **Grimoire Public ONLY.** Master ISO has pass-through mode that auto-grants all unlocks at boot. GoodLife ignores this subsystem entirely.
**Parent doc:** `SALVAGED_HARDWARE_MESH_VISION.md`

---
tags: [grimoire gamification]

## 1. Behavior per profile

| Profile | Progression behavior |
|---|---|
| **Master** | `synos-progression-daemon` runs in `--godmode` flag. All unlocks granted at boot. XP ledger is a no-op. Tool installation is unrestricted. This is non-negotiable: Master is the devops environment that builds Grimoire's content. |
| **Grimoire Public** | Full progression system active. Starter kit unlocked; everything else gated by XP/quest/faction milestones. Cannot be disabled by user (enforced by curtain v2 runtime ceiling). |
| **GoodLife** | No progression system. Research tools available as configured by profile. |

**Curtain enforcement rule:** if `/etc/synos/profile` reads `grimoire`, the progression daemon MUST be running and MUST NOT be in pass-through mode. `synos-grimoire-ceiling-check` service validates this at boot and panics (service-level) if bypass detected.

---
tags: [grimoire gamification]

## 2. State model

### Per-player state
`~/.local/share/synos/progression/state.toml` (per-user):

```toml
[player]
xp = 0
level = 1
active_faction = "none"           # none | crimson_spire | neon_collective | warden
faction_reputation = {}            # faction_name → 0..100

[unlocks]
tools = ["nmap", "wireshark", "netcat", "curl", "tcpdump", "strace", "ltrace", "hexdump", "binwalk", "strings"]  # 10 starter tools
labs_unlocked = ["intro-networking", "intro-packet-capture", "intro-log-triage", "intro-scripting", "intro-ssh"]
labs_completed = []
faction_missions_completed = []

[mesh]
joined = false
role = "standalone"                # standalone | edge | worker | master_candidate
peer_count = 0
benchmarking_score = 0             # XP awarded for distributed compute participation

[telemetry_optin]
anonymized_metrics = false         # opt-in only, for community leaderboard
```

### System-wide unlock catalog
`/opt/synos/progression/catalog.toml` (ships in ISO, signed):

```toml
[tools.metasploit]
unlock_level = 15
prerequisites = ["intermediate-exploitation", "lab-port-scanning-advanced"]
faction_reputation_required = { crimson_spire = 40 }

[tools.hashcat]
unlock_level = 8
prerequisites = ["intro-crypto", "intermediate-passwords"]
faction_reputation_required = {}

[tools.sliver]
unlock_level = 25
prerequisites = ["advanced-c2-theory", "sandbox-labs-complete"]
faction_reputation_required = { crimson_spire = 75 }

[labs.mesh-your-first-node]
unlock_level = 5
prerequisites = ["intro-networking"]
rewards = { xp = 500, tool_unlocks = ["synos-hive-profiler-cli"], faction_reputation = { "The Warden" = 10 } }
faction_specific = false

[labs.salvage-yard-intro]
unlock_level = 7
prerequisites = ["mesh-your-first-node"]
rewards = { xp = 1000, tool_unlocks = ["synos-hive-attestor-cli"], achievement = "first-salvaged-node" }
```

---
tags: [grimoire gamification]

## 3. Event bus + triggers

`synos-progression-daemon` (Rust binary in `fruit/crates/synos-progression/`) subscribes to:

### Input events (from GRIMOIRE game engine)
- `lab_completed` — player finishes a lab instance with passing score
- `faction_mission_completed` — player completes a faction mission
- `achievement_unlocked` — named achievement triggered
- `mesh_node_joined` — a new mesh node successfully attested + registered

### Output events (to system)
- `unlock_tool_request { name }` — daemon invokes `synos-tool-installer` which calls `pacman -S` or `docker load` from the pre-bundled archive
- `unlock_lab_request { name }` — daemon flips lab visibility in GRIMOIRE UI + extracts lab assets
- `unlock_config_preset { preset }` — daemon overlays config templates onto user's ~/.config

### The unlock path (concrete example)
1. Player completes `intro-networking` lab with score 85/100
2. GRIMOIRE game engine emits `lab_completed{name="intro-networking", score=85}`
3. Progression daemon reads event, credits 500 XP, checks catalog for labs whose prerequisites are now satisfied
4. Catalog says `mesh-your-first-node` requires `intro-networking` → unlocked
5. Daemon writes updated state, fires `unlock_lab_request{name="mesh-your-first-node"}`
6. Lab loader extracts lab assets from the pre-bundled archive (reusing the content-addressable storage Cipher A built for Docker labs)
7. GRIMOIRE UI shows the new lab as available
8. Player's XP ticker animates, new-lab notification fires

---
tags: [grimoire gamification]

## 4. Auto-extract on unlock

Leverage the existing content-addressable bundle architecture from Wave 7 Cipher A:

- The entire ISO ships with ALL Grimoire tools + ALL lab assets pre-bundled (compressed, deduped)
- On unlock, the daemon triggers selective extraction from the bundle — NOT a re-pull
- Bundle index at `/opt/synos/progression/bundle-index.toml` maps unlock-name → list of sha256 blobs → extraction destination
- Extraction is atomic (temp dir → rename) and idempotent (re-triggering reuses existing extraction)

**Advantages:**
- First-install experience is fast (bundle is single compressed artifact)
- Progressive unlock doesn't require network (offline-capable)
- Same mechanism works for tools (extract to `/usr/local/`), configs (overlay to `~/.config/`), labs (materialize to `~/.local/share/grimoire/labs/`)

---
tags: [grimoire gamification]

## 5. Master pass-through mode

On Master ISO:

1. `synos-progression-daemon` starts with `SYNOS_PROFILE=master` environment
2. At boot, daemon reads `/etc/synos/profile` — if "master", enters pass-through mode
3. Pass-through mode: reads catalog, generates full unlock event stream as if every prerequisite was met
4. All tools extracted to `/usr/local/` on first boot (via Cipher A's systemd one-shot)
5. All labs materialized to `/opt/synos/grimoire/labs/` (via Cipher A's image loader)
6. Daemon exits cleanly after pass-through flood, marks `~/.local/share/synos/progression/.master-godmode` flag

The pass-through state is explicit and auditable — a Master operator can verify everything is unlocked by checking the flag file + running `synos-progression status`.

---
tags: [grimoire gamification]

## 6. Curtain v2 — runtime capability ceiling (Grimoire only)

**Separate from progressive unlock.** Unlocks are capability gates WITHIN Grimoire's scope. The ceiling is a harder boundary.

**Enforcement points:**
- Kernel syscall dispatch — syscalls 470-474 (AI dispatch) return `ENOSYS` on Grimoire; 469/475/476/477 work normally
- ALFRED consciousness cortex — high-stakes decisions flagged for Master-tier tenants are silently dropped on Grimoire
- LLM federation — discovery protocol tagged by tier; Grimoire nodes refuse federation with Master nodes and vice versa
- Audit chain — HMAC root key for Grimoire is different; Grimoire chains cannot be merged with Master chains
- Fragment Field IDS — kernel detection disabled; userspace measurement only
- C2 framework binaries — scrubbed at build time by `cargo xtask grimoire-ceiling-check`

**Bypass attempts:**
- Editing `/etc/synos/profile` to forge "master" — blocked because the file is on an immutable verity-protected rootfs (Rec 12 immutable rootfs is prerequisite)
- Recompiling ALFRED with master features — blocked because the restricted crates (LicenseRef-Proprietary) are not in the Grimoire source tree at all
- Loading a master-signed kernel module — blocked because Grimoire's kernel MOK key is different and `module.sig_enforce=1`

---
tags: [grimoire gamification]

## 7. v40 vs v41 scope

### v40 ships (this session if time permits, else next session)
- This design doc ✓
- Grimoire-minimal starter profile (`fruit/iso/profiles/grimoire-minimal.toml`) with starter 10 tools
- Catalog file skeleton at `fruit/iso/progression/catalog.toml.template`
- Project roadmap update documenting the pivot ✓

### v41 implements
- `fruit/crates/synos-progression/` full crate implementation
- `synos-progression-daemon` + `synos-tool-installer` userspace binaries
- Event bus wiring into GRIMOIRE game engine
- Bundle-index generator in stage 14
- Master pass-through mode at daemon startup
- Grimoire ceiling enforcement (first pass: syscall-level + cargo xtask grimoire-ceiling-check)
- 8-10 new Salvage Yard labs teaching mesh construction

### v42 hardens
- Curtain v2 runtime ceiling full enforcement (immutable rootfs, tier-tagged federation, audit chain separation)
- Hardware mesh auto-discovery + profiler tier classification
- E-waste reduction metrics (anonymized leaderboard opt-in)
- The Salvage Yard quest arc expansion

---
tags: [grimoire gamification]

*This design spec is derived from `SALVAGED_HARDWARE_MESH_VISION.md`. Any conflict between this doc and the parent is resolved in favor of the parent.*
