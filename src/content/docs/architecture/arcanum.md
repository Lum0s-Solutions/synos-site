---
title: ARCANUM Mesh
description: ARCANUM Hive — distributed Syn_OS mesh on Tailscale + WireGuard with a Kubernetes operator. Running today across 3 nodes; the Stoneglass Ansible playbooks scale it further. Federated consciousness, salvaged-hardware AI, multi-tenant Sanctum.
---

**ARCANUM Hive** is the fungal-mycelium layer of the biological model — the distributed nervous system that lets a fleet of Syn_OS nodes act as one organism. It runs on a **Tailscale** primary backbone with **WireGuard** fallback and is orchestrated by a Kubernetes operator (`synos-arcanum` — 4 crates: controller, attestor, profiler, tests).

The v55 **Stoneglass** release shipped the Ansible playbook set that bootstraps a node into the mesh. The live mesh runs today across **3 nodes**; the vision behind scaling it further is described in `SALVAGED_HARDWARE_MESH_VISION.md`: turn discarded laptops and office workstations into a distributed inference mesh; drop the accessibility ceiling for sovereign AI from "needs a $2,000 GPU" to "needs a working laptop." Growing the fleet (additional reclaimed nodes are being provisioned) is on the roadmap, not yet complete.

## Why a mesh at all

Three reasons:

1. **Distributed inference** — local LLMs are good but small; sharding inference across a mesh of reclaimed i5-class laptops spreads memory-bound models across cheap, otherwise-idle hardware. We have not published a formal benchmark against a comparable single workstation — treat any performance comparison as anecdotal until we do.
2. **Federated consciousness** — ALFRED in **Mesh** mode runs gossip across peer instances, so observation, threat detection, and Fragment Field signal aggregate across the fleet.
3. **E-waste reduction as load-bearing thesis** — Syn_OS is designed to be cheaper to deploy on reclaimed laptops than on one new GPU box. The Salvage Yard quest arc in GRIMOIRE is the user-facing instantiation of this thesis.

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
        ┌───────┼─────────────────────────┐
        │       │   Tailscale + WireGuard │
        │       │                          │
   ┌────▼──┐ ┌──▼───┐ ┌──────┐        ┌ ─ ─ ─ ─
   │ Node1 │ │ Node2│ │ Node3│          more   │
   │  i5    │ │laptop│ │laptop│        │ nodes
   │  oracle│ │      │ │      │          (roadmap)
   └────────┘ └──────┘ └──────┘        └ ─ ─ ─ ─
```

The 3-node boxes are live today; the dashed box is the planned fleet expansion (additional reclaimed hardware is being provisioned, not yet online). The Sanctum-A/B/C federation layer above is the multi-tenant control-plane design — a single mesh can host several tenant Sanctums regardless of physical node count.

## The four operator crates

| Crate                  | Role                                                                |
|------------------------|---------------------------------------------------------------------|
| `arcanum-controller`   | Reconciliation loop, custom resource definitions, scheduling        |
| `arcanum-attestor`     | mTLS bootstrap, peer attestation, Curtain v4 token issuance         |
| `arcanum-profiler`     | Per-node hardware profiling, model placement decisions               |
| `arcanum-tests`        | Integration test harness                                             |

## Bootstrapping a node — Stoneglass (v55)

The v55 Stoneglass release shipped Ansible playbooks for the full bootstrap:

```bash
# from a control node:
ansible-playbook hive-bootstrap.yml -i inventory --extra-vars "tenant=tenant1"
ansible-playbook master-image-distribute.yml
```

<details>
<summary>Full bootstrap sequence (v55 Stoneglass)</summary>

1. **System prep** — `hive-bootstrap.yml` configures the OS, installs Tailscale, WireGuard, and the Kubernetes operator.
2. **Image distribution** — `master-image-distribute.yml` pushes the Syn_OS ISO image to all nodes.
3. **Attestation** — `arcanum-attestor` bootstraps mTLS and issues Curtain v4 tokens.
4. **Profiling** — `arcanum-profiler` runs hardware benchmarks and reports model placement suitability.
5. **Verification** — `arcanum-tests` runs integration tests against the live mesh.

</details>

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

The live 3-node deployment runs `qwen2.5:7b` sharded across the mesh for chat workloads, with failover to the remaining nodes if one drops. Dedicating a node to embedding generation is a configuration option once the fleet grows beyond 3.

## Federated consciousness

Distinct from inference, **consciousness** federation is the gossip-protocol layer where ALFRED's 11 brain crates aggregate state across peers:

- **Hippocampus** — long-term memory consolidation across the fleet (lab solutions, threat sightings, novel attack patterns)
- **Amygdala** — threat-signature gossip (a sighting on one node propagates to all peers within ~2 seconds)
- **Default-mode-network** — distributed idle consolidation (peer X consolidates while peer Y serves traffic)
- **Insula** — cluster-wide health awareness (each node's interoception feeds a fleet-level pulse)

Federation messages are **always** signed: ML-DSA signature on every gossip frame, with epoch roots signed via SLH-DSA for archival integrity. The audit-trail HMAC-SHA256 chain captures every accepted message.

## Sanctum federation (v49 Crystal Net)

Multi-tenant federation runs above the mesh layer. Each Sanctum is a tenant boundary; tenants federate selectively to share threat intelligence, lab solutions, or compute. The federation server is `axum` + `reqwest` + `rustls`, with:

- **Replica join** — bring a new Sanctum online and join the federation with cryptographic enrolment
- **Federation health endpoint** — peer reachability matrix exposed for Mission Control dashboards
- **Tier isolation** — GRIMOIRE-tier Sanctums federate only with GRIMOIRE peers; Enterprise Edition tenants federate freely; cross-tier traffic is gated by Curtain v4

## Failure modes

The mesh is designed to lose nodes gracefully:

- Tailscale primary down → WireGuard fallback (sub-second cutover)
- Single-node failure → workloads rescheduled, model shards re-replicated within minutes
- Federation split-brain → audit trails diverge but never corrupt; merge happens cryptographically when partition heals (v51 Storm Glass twin-substrate replays)
- Active-passive build oracle → an Ansible playbook (v41 Wave 8) exists to promote a warm-spare to build oracle; the spare itself isn't deployed yet

## Hardware reality check

The mesh runs today on a small fleet of reclaimed, commodity hardware — no new gear, no GPUs required:

- a primary build/inference oracle (i5-class laptop, ~11 GiB RAM)
- two worker nodes for sharded inference and lab hosting

A warm-spare oracle for active-passive build failover is designed but not yet deployed — it's on the roadmap alongside the second build oracle. Tailscale glues the off-LAN nodes together. The point stands even at this scale: none of it is new, none of it is expensive, and it runs the full stack.

## Related

- **[ALFRED →](/architecture/alfred/)** — Mesh mode, consciousness federation
- **[Curtain →](/architecture/curtain/)** — token-gated mesh peering
- **[Icarus →](/architecture/icarus/)** — ML-KEM hybrid TLS, ML-DSA gossip signatures
- **[Forge →](/architecture/forge/)** — cross-oracle reproducibility verify
