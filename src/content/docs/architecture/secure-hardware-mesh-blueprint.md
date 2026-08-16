---
title: Secure Hardware-Sharing Mesh — Reference Blueprint
description: Secure Hardware-Sharing Mesh — Reference Blueprint
---

# Secure Hardware-Sharing Mesh — Reference Blueprint

**Audience:** Syn_OS operators building a multi-node setup that shares compute,
storage, build, and services across heterogeneous hardware (Linux build hosts,
desktops, phones, SBCs) **securely**.
**Scope:** a *generalizable, replicable* zero-trust pattern with customization
options. It documents the **what and why**, not any one deployment's exact keys,
addresses, or policy. (See *Curtain note* at the end.)

---

## 1. Intent

Share hardware across nodes without trusting the network. A laptop, a build
oracle, a desktop, and a phone should be able to cooperate (distribute builds,
serve a cache, push updates, run agents) such that **possessing network access is
never sufficient** — a node must *prove who it is and that it's healthy* before it
reaches anything sensitive, and every service is exposed on a need-to-reach basis.

## 2. Principles (non-negotiable)

1. **Identity over perimeter** — authorize by node identity/role, not by subnet.
2. **Least privilege, deny-by-default** — a node reaches only the specific
   services its role requires; everything else is denied.
3. **Attestation-gated** — full access is granted to *attested-healthy* nodes,
   not merely *connected* ones.
4. **Signed everything** — software/config/updates carry signatures verified
   against pinned keys; unsigned = rejected, fail-closed.
5. **Defense-in-depth** — overlay policy AND host firewall AND service bind-scope
   each independently constrain reach (no single point of failure).
6. **Fail-closed & reversible** — a broken policy denies (not allows), and every
   change is revertible (version history, snapshots).

## 3. Reference components (pattern → options)

Each layer states the **pattern** and **customization options** — pick per your
threat model and hardware.

| Layer | Pattern | Options to customize |
|-------|---------|----------------------|
| **1. Encrypted overlay** | A WireGuard-based mesh so all node-to-node traffic is encrypted + NAT-traversing | Tailscale (managed) · Headscale/Netbird (self-hosted) · raw WireGuard + a config tool |
| **2. Identity & roles** | Tag/label every node with a role (`apex`/`control`, `workstation`, `mobile`, `builder`, `ephemeral`) | Tag taxonomy; per-user vs per-device identity; SSO/OIDC binding |
| **3. Least-privilege policy** | Deny-by-default ACL/grants; per-role grants to specific dst:port. **The key move: remove any `allow-all` rule.** | Grant granularity (host vs port vs app-capability); break-glass admin path; SSH policy |
| **4. Attestation-gated admission** | Only nodes that pass a health/integrity check get full grants; failing nodes get a quarantine/limited role | TPM2 measured boot · posture checks (patch level, firewall on, disk crypto) · consensus quorum |
| **5. Signed distribution / OTA** | Updates + shared artifacts are signed (ideally hybrid classical+PQ) and verified against ISO-pinned keys; A/B + rollback | Signature scheme; canary→fleet rollout; cache-proxy trust |
| **6. Host hardening** | Host firewall scopes the overlay to needed ports; services bind to LAN/overlay, **not** all interfaces (esp. NAT-less IPv6); signed kernel modules | Firewall (ufw/nftables); per-service bind addr; lockdown/secure-boot |
| **7. Segmentation** | Untrusted devices (IoT/guest) isolated from trusted nodes (separate VLAN/SSID) | VLAN vs separate AP; east-west rules |
| **8. Observability & audit** | Mesh flow logs + append-only audit of admission/policy changes | Flow-log sink; SIEM; tamper-evident chain |

## 4. Maturity ladder

Climb it; don't skip. Each rung is independently valuable.

- **L0 — Flat & open**: one subnet, services on all interfaces. *(Where most homelabs start; avoid.)*
- **L1 — Encrypted overlay**: WireGuard mesh; traffic encrypted, but still allow-all.
- **L2 — Least-privilege**: deny-by-default policy; per-role grants; **allow-all removed**. Host firewalls scope services. *(Strong baseline.)*
- **L3 — Attestation-gated**: admission + grants conditioned on node health/integrity; signed OTA. *(Best-in-class for most.)*
- **L4 — Consensus + TEE**: control-plane actions require quorum (BFT); hardware-rooted attestation (TPM/TEE) tiers trust. *(High-assurance.)*

## 5. Customization matrix (decide these per deployment)

- **Overlay**: managed vs self-hosted (data-sovereignty trade-off).
- **Trust root**: account-based vs network-lock/node-key-signing (rogue-node resistance).
- **Attestation depth**: none → posture checks → TPM2 measured boot → TEE tiers.
- **Policy granularity**: host-level → port-level → app-capability.
- **Update cadence**: manual → canary nightly → full auto (per node criticality).
- **Break-glass**: how an admin recovers if attestation/policy locks everyone out (keep this path *always* open).

## 6. Considerations checklist (the things people miss)

- [ ] Removed the `allow-all` rule (an overlay defaults to it — that's L1, not L2).
- [ ] Every exposed service bound to LAN/overlay, **not** `*`/`::` — IPv6 has **no NAT**, so an all-interfaces bind is internet-facing if the edge firewall lapses.
- [ ] Edge (gateway) inbound-IPv6 firewall verified, not assumed.
- [ ] Policy has **automated tests** that fail the change if it breaks the control-plane or locks out admin.
- [ ] SSH/break-glass path that no policy change can sever.
- [ ] Updates signed + verified against **pinned** keys (not trust-on-first-use).
- [ ] Quarantine role for un-attested/unhealthy nodes (don't just deny — observe).
- [ ] Audit trail for admission + policy edits (append-only).
- [ ] Untrusted devices segmented from trusted nodes.
- [ ] Ephemeral/short-lived keys for transient nodes (build agents, throwaway VMs).

## 7. Anti-patterns

- "It's on the VPN so it's trusted" → flat trust = one compromised node owns all.
- Services on `0.0.0.0`/`::` "because it's behind NAT" → v6 has no NAT.
- ACL edits with no tests, applied live during critical operations.
- Trust-on-first-use for update keys.
- No break-glass → a bad policy bricks the fleet.

## 8. How Syn_OS helps you build it

Syn_OS ships building blocks for the higher rungs (compose them; they aren't a
turn-key product):

- Node attestation + hardware profiling + consensus (`synos-hive-*` crates).
- Hardware-rooted attestation (`synos-attest-tpm2`, `synos-attest-cli`).
- Signed OTA + rollback (the OTA subsystem) with hybrid (classical+PQ) signatures.
- Append-only audit (`synos-audit-trail`), multi-tenant isolation (`synos-tenant`).
- Signed kernel modules + lockdown posture.

The **GRIMOIRE lab `homelab/secure-mesh-build-201`** walks you through assembling
this hands-on, with a Red→Blue capstone.

---

## Curtain note

This blueprint is the **generalizable pattern**. Concrete operational details of
any specific deployment — exact node identities, addresses, signing keys,
attestation thresholds, and the precise policy file — are **environment-specific
and intentionally not published here**. Build *your* mesh from the pattern +
options above; do not assume a reference deployment uses any particular value.
The accompanying lab teaches you to make these choices yourself rather than
copying a fixed answer.
