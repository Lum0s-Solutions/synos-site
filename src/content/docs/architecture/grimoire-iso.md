---
tags: [general]
title: grimoire-iso — ISO build orchestration
description: grimoire-iso — ISO build orchestration
---
tags: [general]

# grimoire-iso — ISO build orchestration

**Classification:** PUBLIC  
**Crate:** `fruit/crates/grimoire-iso/`  
**Milestone:** v14+  
**License:** Apache-2.0  
**Version:** v111.0.0 "Last Light"

## What It Is

`grimoire-iso` is the lean Bevy 0.18 isometric world client for the GRIMOIRE gamification layer, serving as a thin 2D view over the render-agnostic gamification daemon and world-server. It renders server-authoritative game state — dimetric diamond overworld, discrete iso interiors, and arrow-key player movement — while all game logic remains in `synos-gamification` consumed via the daemon REST API. The crate is deliberately view-only: it sends intents and renders state, never owning game authority.

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `iso` | Pure-math isometric coordinate helpers and dimetric projection utilities |
| `tiles` | Tilemap primitives for chunked dimetric diamond rendering with frustum culling |
| `overworld` | Overworld scene plugin for `WorldNode` POI rendering and arrow-key walking |
| `interior` | Discrete iso interior scene plugin for building/environment exploration |
| `player` | Player movement, ground transform sync, and camera follow systems |
| `state` | `GameState` Bevy state machine (`Overworld ⇄ Interior`) and `ActiveInterior` resource |
| `net` | Backend seam layer: REST polling for `/api/v1/world/nodes` and WebSocket reachability/live session |

### How It's Wired

1. **Bevy 0.18 2D feature set** — `default-features = false` + `features = ["2d"]` drops 3D drivers (`bevy_pbr`, `bevy_gltf`, `ktx2`, zstd tonemapping LUTs), keeping the binary lean. `bevy_ecs_tilemap` provides dimetric diamond tilemap with built-in chunking.
2. **World-server REST seam** — `reqwest` polls `GET /api/v1/world/nodes` on the gamification daemon for POI data. The `WorldNodes` resource caches results and falls back to local fallback data when offline.
3. **WebSocket seam** — `tokio-tungstenite` provides live session connectivity (Milestone 2) and reachability probes against `synos-world-server`.
4. **Single-plugin assembly** — `GrimoireIsoPlugin` adds all scene plugins, systems, and the persistent camera in one `build()` call, designed for inclusion in a Bevy `App` that already has `DefaultPlugins`.

## Future Ideas

1. Add a `grimoire-iso-asset` module for prefab-based interior spawning, reducing runtime tilemap generation.
2. Implement the Milestone 2 WebSocket live session protocol with `tokio-tungstenite` for real-time node state sync.
3. Expose `grimoire-iso` state via a `grimoire-iso-replay` crate that records and replays player movement for demo/debug purposes.
