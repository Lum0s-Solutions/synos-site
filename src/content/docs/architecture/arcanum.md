---
title: ARCANUM Mesh
description: ARCANUM Hive — distributed Syn_OS mesh on Tailscale + WireGuard with a Kubernetes operator. 8-node Stoneglass GA. Federated consciousness, salvaged-hardware AI, multi-tenant Sanctum.
---

**ARCANUM Hive** is the fungal-mycelium layer of the biological model — the distributed nervous system that lets a fleet of Syn_OS nodes act as one organism. It runs on a **Tailscale** primary backbone with **WireGuard** fallback and is orchestrated by a Kubernetes operator (`synos-arcanum` — 4 crates: controller, attestor, profiler, tests).

The v55 **Stoneglass** release brought the full 8-node Ansible playbook set to GA. The vision behind it is described in `SALVAGED_HARDWARE_MESH_VISION.md`: turn discarded laptops and office workstations into a distributed inference mesh; drop the accessibility ceiling for sovereign AI from "needs a $2,000 GPU" to "needs a working laptop."

## Why a mesh at all

Three reasons:

1. **Distributed inference** — local LLMs are good but small; sharded inference across a 4-node mesh of i5-class laptops outperforms a single mid-range workstation on memory-bound models, at near-zero hardware cost.
2. **Federated consciousness** — ALFRED in **Mesh** mode runs gossip across peer instances, so observation, threat detection, and Fragment Field signal aggregate across the fleet.
3. **E-waste reduction as load-bearing thesis** — Syn_OS is genuinely cheaper to deploy on five reclaimed laptops than on one new GPU box. The Salvage Yard quest arc in GRIMOIRE is the user-facing instantiation of this thesis.

## Topology

```
                  ┌──── Sanctum Federation (v49 Crystal Net) ────┐
                  │   axum + reqwest + rustls server endpoints   │
                  └──────────────┬───────────────────────────────┘
                                 │ ML-KEM hybrid TLS
                ┌────────────────┼────────────────┐
                │                │                │
        ┌───────▼──────┐ ┌───────▼──────┐ ┌───────▼──────┐
        │  Sanctum A   │ │  Sanctum B   │ │  Sanctum C   │
        │  (tenant 1)  │ │  (tenant 2)  │ │  (tenant 3)  │
        └───────┬──────┘ └──────────────┘ └──────────────┘
                │  Hive Controller (k8s operator)
        ┌───────┼─────────────────────────────────┐
        │       │       Tailscale + WireGuard     │
        │       │                                  │
   ┌────▼──┐ ┌──▼───┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
   │ Node1 │ │ Node2│ │ Node3│ │ Node4│ │ Node5│ │ Node6│ │ Node7│ ...
   │ i5-3337│ │ Pi 5 │ │laptop│ │laptop│ │ Mac  │ │ NUC  │ │ ...  │
   │  oracle│ │      │ │      │ │      │ │      │ │      │ │      │
   └────────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘
```

## The four operator crates

| Crate                  | Role                                                                |
|------------------------|---------------------------------------------------------------------|
| `arcanum-controller`   | Reconciliation loop, custom resource definitions, scheduling        |
| `arcanum-attestor`     | mTLS bootstrap, peer attestation, Curtain v3 token issuance         |
| `arcanum-profiler`     | Per-node hardware profiling, model placement decisions               |
| `arcanum-tests`        | Integration test harness                                             |

## Bootstrapping a node — Stoneglass (v55)

The v55 Stoneglass release shipped Ansible playbooks for the full bootstrap:

```bash
# from a control node:
ansible-playbook hive-bootstrap.yml -i inventory --extra-vars "tenant=tenant1"
ansible-playbook master-image-distribute.yml
ansible-playbook sanctum-federation-join.yml --extra-vars "federation=primary"
```

The playbooks:

- enrol the node into Tailscale (with auth key rotation)
- generate a node-scoped Curtain capability token signed by the federation root
- install the synos kernel + signed Rust kernel modules (capability-gated kernel-module interface)
- pull the appropriate ALFRED model fingerprints and verify ML-DSA signatures
- register with the Hive controller and request a workload assignment

A node can be brought from "freshly-imaged" to "scheduled and running its first inference" in about 4 minutes on a wired LAN.

## Federated inference

ALFRED in **Mesh** mode treats the cluster as a unified inference substrate. Models are sharded by the profiler crate across nodes based on:

- available RAM
- GPU presence + VRAM
- network latency to the requesting client
- current workload pressure

A typical deployment runs `qwen2.5:7b` sharded across 3 nodes for chat workloads while reserving a 4th for embedding generation, with hot-failover if any node drops.

## Federated consciousness

Distinct from inference, **consciousness** federation is the gossip-protocol layer where ALFRED's nine brain crates aggregate state across peers:

- **Hippocampus** — long-term memory consolidation across the fleet (lab solutions, threat sightings, novel attack patterns)
- **Amygdala** — threat-signature gossip (a sighting on one node propagates to all peers within ~2 seconds)
- **Default-mode-network** — distributed idle consolidation (peer X consolidates while peer Y serves traffic)
- **Insula** — cluster-wide health awareness (each node's interoception feeds a fleet-level pulse)

Federation messages are **always** signed: ML-DSA signature on every gossip frame, with epoch roots signed via SLH-DSA for archival integrity. The audit-trail HMAC-SHA256 chain captures every accepted message.

## Sanctum federation (v49 Crystal Net)

Multi-tenant federation runs above the mesh layer. Each Sanctum is a tenant boundary; tenants federate selectively to share threat intelligence, lab solutions, or compute. The federation server is `axum` + `reqwest` + `rustls`, with:

- **Replica join** — bring a new Sanctum online and join the federation with cryptographic enrolment
- **Federation health endpoint** — peer reachability matrix exposed for Mission Control dashboards
- **Tier isolation** — GRIMOIRE-tier Sanctums federate only with GRIMOIRE peers; Master tenants federate freely; cross-tier traffic is gated by Curtain v3

## Failure modes

The mesh is designed to lose nodes gracefully:

- Tailscale primary down → WireGuard fallback (sub-second cutover)
- Single-node failure → workloads rescheduled, model shards re-replicated within minutes
- Federation split-brain → audit trails diverge but never corrupt; merge happens cryptographically when partition heals (v51 Storm Glass twin-substrate replays)
- Active-passive build oracle → `<admin-node>` warm-spare ready to take over from `<build-oracle>` (v41 Wave 8 Ansible playbook)

## Hardware reality check

The reference deployment (active production):

- **<build-oracle>** — sanctum oracle (Intel i5-3337U, 11 GiB RAM, 281 GiB free) — primary build oracle
- **<admin-node>** — Windows admin / WSL Parrot, warm-spare oracle
- **the-void-of-ty** — Tailscale relay, ARCANUM gossip aggregator
- **Hive workers (4× Lenovo)** — sharded inference + lab hosting
- **PS3, Minecraft server, NOC node** — auxiliary mesh participants

VLAN 66 carries the in-LAN portion of the mesh; Tailscale glues the off-LAN nodes.

## Related

- **[ALFRED →](/architecture/alfred/)** — Mesh mode, consciousness federation
- **[Curtain →](/architecture/curtain/)** — token-gated mesh peering
- **[Icarus →](/architecture/icarus/)** — ML-KEM hybrid TLS, ML-DSA gossip signatures
- **[Forge →](/architecture/forge/)** — cross-oracle reproducibility verify
