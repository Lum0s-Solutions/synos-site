---
tags: [general]
title: synos-engine — Primary execution engine
description: synos-engine — Primary execution engine
---
tags: [general]

# synos-engine — Primary execution engine

**Classification:** PUBLIC  
**Crate:** `fruit/crates/synos-engine/`  
**Milestone:** v14+  
**License:** Apache-2.0  
**Version:** v111.0.0 "Last Light"

## What It Is

`synos-engine` is the Fallout-inspired game engine core for Syn_OS's GRIMOIRE gamification system. It provides arena allocators, triple-renderer abstraction (TUI, Web Canvas, GPU/WGPU, Bevy), hybrid sandboxing (Docker, Bubblewrap, WASM), and a build-tier capability gate that controls which features are available in public-beta, master-ISO, and education-only builds. The engine is designed so that all offensive-tools primitives live behind `master-iso` feature flags and are never compiled into public-facing builds.

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `allocator` | Arena allocators (`ArenaAllocator`, `FrameArena`, `GameArena`) for hot-path memory management |
| `build_tier` | Build tier detection (`BuildTier`) and capability gating (`require_capability`) |
| `events` | Event sourcing system (`EventBus`, `EventStore`) for game state history |
| `parsers` | Syn_Engine file format parsers for DAT, FRM, PRO, MAP, ACM, and SSL assets |
| `renderer` | Triple render engine abstraction with TUI, Web, GPU, and Bevy backends |
| `sandbox` | Hybrid sandboxing (Docker via Bollard, Bubblewrap, WASM via Wasmtime) with resource limits |
| `security` | Seccomp-BPF profiles (`SeccompProfile`), capability management, and audit logging |
| `simd` | SIMD-optimized math primitives (`Vec2`, `Vec3`, `Vec4`, `Mat4`) using portable-simd or `wide` |
| `lzss` | LZSS compression for DAT archive unpacking |

### How It's Wired

1. **Build-tier feature flags** — `profile-master` pulls `master-iso` + `god-mode` (offensive-tools, network-scanning, exploit-frameworks). `profile-grimoire` pulls `public-beta` + `game-mode` (sandbox-enforcement, ctf-labs). `profile-goodlife` and `profile-enterprise` pull `education-only` + `safe-mode` (simulated-targets-only).
2. **Renderer backend selection** — TUI (`ratatui` + `crossterm`), Web (`wasm-bindgen` + `web-sys`), GPU (`wgpu` + `winit`), and Bevy (`bevy` + `bevy_egui`) are independent feature flags; `create_renderer` selects the active backend at runtime.
3. **Sandbox isolation** — The `SandboxManager` drives `ExecutionResult` from whichever backend is enabled. WASM sandboxing uses `wasmtime` 46.0.1, patched against RUSTSEC-2026-0149.
4. **Security hardening** — `seccompiler` generates BPF profiles at runtime; `caps` manages Linux capability sets. These are enforced before any sandboxed code executes.

## Future Ideas

1. Add a `synos-engine-web` thin wrapper that serves the Bevy renderer over WebRTC for cloud-lab scenarios.
2. Expose `EventStore` snapshots via `synos-findings-store` so CTF progress and lab events feed into the security findings pipeline.
3. Port the `parsers` module to a standalone `synos-engine-asset` crate for use by `grimoire-iso` and other asset consumers.
