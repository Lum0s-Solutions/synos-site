# Syn_OS World Server

**Binary:** `synos-world-server` | **Status:** shipping in v111 (GRIMOIRE multiplayer backend)

The world server is the authoritative multiplayer backend for GRIMOIRE — it hosts the **single
shared world** that every Syn_OS image joins, so faction wars, co-op labs, and competitive
contracts play out across all players/nodes at once.

## Shared-world model
There is **one world**, not a world per image:

- **All images join the same world** — master, GRIMOIRE (public/GitHub), and ChurchOfMalware (CoM)
  clients all connect to the same `synos-world-server` instance.
- **CoM players have advantages** — CoM images unlock special access and perks (the SkillGated
  arsenal) *within* the shared world; they are stronger participants, not a separate server.
- **On-launch join** — the client connects on game launch to the endpoint in its config (see
  *Endpoint configuration*), so a player is in the shared world without any manual setup.

## Featherweight design (players do the work)
The server is deliberately **light** so it can run on modest hardware (a single mesh node) without
bogging down:

- **Client-heavy** — each player node does the bulk of the simulation/render work locally. The
  server owns only the **integrity-critical** shared state (scores, faction control, contract
  progress) and the **20 Hz authoritative tick** that reconciles it.
- **Server-authoritative for cheating-sensitive state only** — this is the integrity boundary for
  competitive play (complements the anti-tamper property tests + the Curtain), while keeping the
  host's per-player cost near-trivial.
- **Sharding** — the world is sharded (`WORLD_MAX_SHARDS`) so load scales without a heavyweight box.

## Hosting
Runs on a **dedicated mesh node** (native Linux — **Arch preferred** as the Syn_OS-native base,
provisioned by `growth/development/scripts/deploy/mesh-server-kit/setup-mesh-server.sh`; the static
musl binary also runs on Parrot or any native Linux). Native Linux is required:
Tailscale there uses a real TUN, so plain `ws://` over the tailnet works *and* the full systemd
sandbox applies.

> **Why not arcanum (WSL)?** Tailscale on WSL2 runs in userspace-networking mode, which does **not**
> forward raw inbound TCP — a server can't accept `ws://` connections there (SSH works only because
> it is proxied by Tailscale-SSH). The MMO host must be native Linux. The mesh node is that host.

### Featherweight tuning (shared box)
`fruit/core/config/systemd/synos-world-server.service.d/10-workhorse.conf` keeps the server a good
neighbour when it shares a machine:

| Knob | Value | Effect |
|---|---|---|
| `Nice` / `CPUWeight` / `IOWeight` | 15 / 10 / 10 | yields to interactive work |
| `CPUQuota` | 100% | at most one core |
| `MemoryMax` | 384M | hard cap |
| `WORLD_MAX_SHARDS` | 2 | bounded world size |

## Security posture (no lateral movement)
Three independent layers, so a compromise of the game process cannot pivot into the host or the
tailnet:

1. **Tailnet ACL** (`fruit/core/config/network/tailscale/tailscale-acl.jsonc`) — default-deny +
   funnel-deny. `tag:grimoire-player` may reach `tag:grimoire-server` on **ports 9000/8080 only**;
   nothing else. Posture-gated SSH stays separate.
2. **systemd sandbox** (`synos-world-server.service`) — `CapabilityBoundingSet=` (none),
   `SystemCallFilter=@system-service` minus `@privileged`, `ProtectSystem=strict`,
   `ProtectProc=invisible`, `RestrictSUIDSGID`, `MemoryDenyWriteExecute`, private tmp/devices.
3. **Egress lockdown** — `IPAddressDeny=any` + `IPAddressAllow=localhost 100.64.0.0/10`: the
   process can talk to the tailnet and loopback and **nothing else** — no arbitrary outbound.

Transport is `ws://` **bound to the node's tailnet IP** (`WORLD_SERVER_ADDR=<tailnet-ip>:9000`, set
by the mesh-kit's drop-in); the tailnet (WireGuard) provides the encryption, and the server never
listens on `0.0.0.0` (the setup script asserts no `0.0.0.0:9000` leak before declaring success).

## Endpoint configuration
Clients pick the world by config, so moving/adding a host is **not a rebuild**:

- **Default (baked):** `WORLD_PRESETS[0] = ws://localhost:9000` — a safe default (graceful
  "disconnected" if there is no local server, never a dead address).
- **Shared world (env override):** set `SYNOS_WORLD_SERVER=ws://<mesh-node-tailnet-ip>:9000` (and
  `SYNOS_GRIMOIRE_API=http://<...>:8080`) per image at deploy. `setup-mesh-server.sh` prints the
  exact value after it brings the node up. `field_display()` in `settings.rs` reads the env first,
  then the preset.

## Deployment
- **Provision the host:** `mesh-server-kit/setup-mesh-server.sh` (installs the static binary + the
  hardened unit, joins the tailnet as `tag:grimoire-server`, binds the tailnet IP, verifies no leak).
- **Push the ACL:** `tailscale set --policy-file fruit/core/config/network/tailscale/tailscale-acl.jsonc`.
- **Point clients:** set `SYNOS_WORLD_SERVER` (above); truth-test with `nc -zv <tailnet-ip> 9000`.

## Relationship to other systems
- **[GRIMOIRE / gamification](grimoire.md)** — the world server is its multiplayer substrate.
- **Arcanum Hive / mesh** — the deployment fabric (a native-Linux mesh node is the host).
- **`synos-bevy` MultiplayerPlugin** — the client side (connects on launch to the configured endpoint).

## Key files
- `fruit/crates/synos-world-server/` — the server (binary; static musl build is portable to any Linux)
- `fruit/crates/synos-bevy/src/plugins/settings.rs` — `WORLD_PRESETS` / `SYNOS_WORLD_SERVER`
- `fruit/core/config/systemd/synos-world-server.service{,.d/10-workhorse.conf}` — hardened unit + tuning
- `fruit/core/config/network/tailscale/tailscale-acl.jsonc` — tailnet ACL
- `growth/development/scripts/deploy/mesh-server-kit/` — the node setup kit
