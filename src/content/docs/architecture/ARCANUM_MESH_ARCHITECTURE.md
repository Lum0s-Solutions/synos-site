# ARCANUM Mesh — Architecture Overview (Public)

**Audience:** collaborators, reviewers, and the public.
**Scope:** high-level architecture only. Exact node addresses, the full access-control
policy, and node inventory are deliberately **not** published here — they live in
internal-only configuration. This document contains **no real IPs**; any address shown is
either a well-known public range or an RFC 5737 documentation example.

## What ARCANUM is
A small, private, defense-in-depth compute fabric that runs the Syn_OS fleet: the
GRIMOIRE members-gated MMO, CI/build/OTA infrastructure, an isolated malware-analysis
sandbox, security monitoring, and local-AI compute — stitched together by an
authenticated overlay mesh and segmented at the physical LAN.

## Node roles (identities/addresses omitted)
| Role | Purpose |
|------|---------|
| **Sanctum** | Operator control-plane + master ISO build oracle. |
| **World-server shard(s)** | GRIMOIRE shared-world MMO host(s); tailnet-bound, egress-locked. |
| **CI-runner / Source / OTA** | Ephemeral CI, source-of-truth host, and OTA publish/pull mirror. |
| **Sandbox** | Isolated Parrot detonation node for malware analysis. **Deny-to-fleet by design** — no other node is granted access to it. |
| **SecOps** | Security monitoring / SIEM (Wazuh). |
| **Compute** | Local-AI inference / build offload. |
| **Hive** | Mesh coordination + build orchestration. |

## Network model (three layers)
1. **Physical LAN — VLAN-segmented.** Managed switches carry separate VLANs for the
   Sanctum, Lab/compute, and auxiliary segments, so classes of device are isolated at
   layer 2. Lab/compute nodes share a private RFC 1918 subnet (example only:
   `10.0.0.0/24`); the sandbox segment is isolated from the rest.
2. **Overlay mesh — Tailscale (WireGuard).** All nodes join an authenticated tailnet in
   the standard CGNAT range (`100.64.0.0/10`). Reachability is governed by a
   **default-deny, posture-gated ACL**: services are scoped to specific ports, lateral
   movement is denied unless explicitly granted, and the sandbox is unreachable from the
   fleet. SSH is posture-gated to a single operator identity.
3. **Public edge — Cloudflare tunnel.** The only public entry point (the MMO world
   socket at `world.synos-linux.pro`) is fronted by a Cloudflare tunnel to a private
   tailnet origin — no origin IP is exposed, and the tunnel token is kept off the process
   command line.

## Security posture (summary)
- **Default-deny everywhere** — the mesh ACL grants only named, port-scoped flows.
- **Sandbox isolation** — the detonation node is deny-to-fleet by omission; nothing routes
  into it.
- **Egress-locked services** — the world-server and game daemon restrict outbound traffic
  to localhost + tailnet only (`IPAddressDeny=any` + explicit allow).
- **Members-gated game** — the MMO connect path requires a verified member token before a
  session is established.
- **No secrets or addresses in public artifacts** — exact IPs, the ACL policy file, node
  inventory, and all keys/tokens are excluded from public mirrors and live only in
  internal config or the encrypted operator keyring.

## What is intentionally omitted here
Exact tailnet + LAN IP assignments, hostnames beyond generic roles, the full ACL policy,
switch port maps, service credentials, and tunnel tokens. Reviewers who need those work
from the internal configuration under access control — not from this document.
