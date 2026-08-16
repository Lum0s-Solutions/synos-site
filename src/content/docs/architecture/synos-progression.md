# synos-progression — GRIMOIRE Progression Daemon

**Classification:** PUBLIC  
**Crate:** `fruit/crates/synos-progression/`  
**Milestone:** v40+  
**License:** MIT OR Apache-2.0

## What It Is

`synos-progression` is the GRIMOIRE progression daemon — it manages the
catalog, resolver, tool installer, and lab materializer for the GRIMOIRE
training platform. It determines which tools and labs a player can access
based on their progression state.

## Architecture

### Components

| Component | Purpose |
|-----------|---------|
| `catalog` | Master catalog of all tools and labs |
| `resolver` | Determines availability based on player state |
| `installer` | Installs tools when unlocked |
| `materializer` | Prepares lab environments on demand |

### How It's Wired

1. **synos-gamification** — `synos-progression` is the backend for `synos-gamification`
2. **grimoire-tui** — queries progression state via gRPC
3. **synos-tenant** — tenant-scoped progression (GRIMOIRE vs Master)
4. **synos-security-boundary** — enforces capability ceiling

## Future Ideas

1. **Dynamic content** — server-driven tool/lab catalog updates
2. **Leaderboard integration** — progression-linked competitive features
3. **Achievement system** — badges and titles for milestones
4. **Custom paths** — player-selectable progression tracks
