# synos-lab-agent — Laboratory agent runtime

**Classification:** PUBLIC  
**Crate:** `fruit/crates/synos-lab-agent/`  
**Milestone:** v14+  
**License:** Apache-2.0  
**Version:** v111.0.0 "Last Light"

## What It Is

`synos-lab-agent` is the OS-native half of the GRIMOIRE "enter a node → a real Firecracker lab boots locally and opens in a terminal" loop. It solves the gap between the Cloudflare-hosted game client (which cannot open local `ws://` connections due to browser CORS/mixed-content restrictions) and the `synos-lab-sandbox` orchestrator (which had zero callers before this crate). The agent verifies Ed25519-signed Launch Grants offline, drives the orchestrator's Unix-socket protocol, and opens a terminal into the resulting Firecracker microVM.

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `grant` | Launch Grant verification gate — offline Ed25519 verification of `synos_member_token`-format tokens against baked world-server public key |
| `url_scheme` | `synos://` URL parsing and validation for `x-scheme-handler/synos` dispatch |
| `ipc` | Unix domain socket IPC server for receiving launch requests from the URL handler |
| `orchestrator_client` | Orchestrator protocol client driving `synos-lab-sandbox`'s Unix-socket API |
| `terminal` | Terminal spawn and PTY management for opening user-facing shell into Firecracker microVM |
| `status_server` | Loopback WebSocket status server (ws/wss) for the browser game UI to subscribe to lab state |
| `register_client` | Localhost HTTP client for the grimoire-daemon register-flag endpoint |
| `flag` | Random flag generation and management for CTF lab scenarios |

### How It's Wired

1. **synos-member-token** — The `grant` module verifies Launch Grants offline using the same baked `SYNOS_MEMBER_TOKEN_PUBKEY` the member-token gate trusts. No network call is required; a forged, expired, or replayed grant is rejected before any orchestrator call.
2. **synos-lab-sandbox** — `orchestrator_client` drives the `lab-orchestrator`'s Unix-socket protocol as its first real client. The agent deliberately uses only the always-compiled `orchestrator_protocol` module (not the `firecracker`-gated `tap_device`/`firecracker_api` modules).
3. **grimoire-daemon** — `register_client` calls the localhost register-flag endpoint to notify the daemon when a lab is launched or exited.
4. **WebSocket status server** — `status_server` uses `tokio-rustls` for `wss://` when operator-provisioned cert/key pairs are present, falling back to `ws://` otherwise. The browser game UI subscribes to lab state transitions.
5. **Two binaries** — `synos-lab-agent` is the long-running daemon. `synos-lab-url-handler` is a thin binary registered as the desktop's `x-scheme-handler/synos` target with zero verification logic of its own, ensuring the one and only trust boundary is the daemon.

## Future Ideas

1. Add `synos-lab-agent-broker` for multi-lab scheduling across a local cluster of Firecracker-capable hosts.
2. Implement `grant` renewal so long-running labs can refresh their Launch Grant without user interaction.
3. Wire `flag` module into `synos-threat-hunting` so CTF flags become `HuntFinding` artifacts in the unified findings store.
