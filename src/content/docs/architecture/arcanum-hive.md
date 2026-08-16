---
tags: [hive mesh distributed]
title: ARCANUM Hive
description: ARCANUM Hive
---
tags: [hive mesh distributed]

# ARCANUM Hive

:::note[Note]
ARCANUM Hive is Syn_OS's horizontally-scalable encrypted mesh. It combines a Tailscale backbone for trusted transport, a single-tenant K3s cluster per node for workload orchestration, custom Kubernetes CRDs for cross-node policy, an OTA update system, remote attestation of every peer before it is trusted, and hardware-tier profiling so the controller can schedule work where it makes sense.
:::

Hive is what makes Syn_OS feel like more than one machine. A single
workstation running Syn_OS is useful on its own; two or more running it
and linked over Tailscale join a mesh that the [ALFRED](./alfred.md)
daemon and the [GRIMOIRE](./grimoire.md) raid labs can reason about
collectively.

## Topology

The mesh has no fixed size — it is designed to scale horizontally.
Tailscale provides the encrypted transport between nodes, so the physical
network topology is irrelevant: nodes can be in the same rack, on the same
LAN, or continents apart, and the hive treats them identically. Capacity
grows by commissioning additional nodes, and the controller schedules work
by hardware tier rather than against any hard-coded slot count.

The authoritative node map is the canonical
[`ARCANUM_STRATEGY.md`](../../../../../fruit/distribution/deployment/deploy/arcanum/docs/ARCANUM_STRATEGY.md);
that document wins if this summary ever disagrees. Current and planned node
classes:

| Node class | Role | Hardware | Status |
|---|---|---|---|
| Sanctum (laptop) | Control plane, build oracle, master identity seed | ASUS X550CA, i5-3337U | Live — `the build-oracle node` |
| Compute (desktop) | GPU / AI-brain, build compute, local model inference | Gaming PC, Haswell + GPU | Live — `the GPU node` (Windows today; Syn_OS dual-boot planned) |
| Mobile (phone) | Field / companion node (Termux + `mobile-bridge`) | Android handset | Live |
| Workers (×4) | Elastic research/build workers; Rowhammer hardware-security lab | 4× Lenovo ThinkCentre M900, DDR4 (reclaimed) | Provisioning |
| Cloud exit | Always-on Tailscale exit node / cloud anchor | DigitalOcean droplet | Planned (blocked on provider) |
| Salvage (later) | Hardware-security teardown targets — post-build only | Sony PS3 + PS4 | Future — **not** mesh nodes; air-gapped engagement plane |

The "sanctum" designation means the laptop holds the master identity seed
and is the only node authorized to sign new commissioning blobs. Worker and
compute nodes join the mesh as capacity and accept scheduled workloads but
do not issue commissioning certs. The salvage hardware (PS3/PS4) is
deliberately kept off the mesh: it is a future air-gapped teardown /
hardware-security plane, not a compute node, and is scoped for after the
current build milestone.

When a node boots, it discovers its peers through the Tailscale coordinate
plane rather than through a static config file. This is deliberate —
static peer lists rot the moment a node moves subnets, and Tailscale
gives the mesh an authoritative membership view for free.

## Components

The hive runtime is four crates under `fruit/crates/`. Each has a
specific role and can be developed independently.

### `synos-hive-controller`

The K8s operator. Approximately 4,377 lines of Rust across the
controller's reconciler loop, the CRD definitions, the OTA update
subsystem, and the RBAC scaffolding. Test coverage sits at 162+ tests as
of v111, and it is the crate that drives the rest of the hive.

Responsibilities:

- Reconcile `ArcanumNode` CRDs against the current Tailscale membership.
  When a new node joins Tailscale, the controller sees its presence,
  looks up whether it has already been attested, and either scheduled
  workloads toward it or quarantines it.
- Run the OTA update subsystem. This is a staged rollout controller that
  takes a new ISO image hash, verifies its signature against the sanctum
  keyring, rolls it out to one node at a time, and gates each successive
  rollout on the post-update attestation of the previous one.
- Manage the `ArcanumRaid` CRD, which is what GRIMOIRE raid labs use to
  claim hive-scoped resources for a cooperative scenario.
- Publish controller health on a metrics endpoint that ALFRED's
  `synos-insula` crate consumes.

The compiled controller binary is deployed to `/usr/local/bin/` by stage
11b of the [ISO build pipeline](./iso-build-pipeline.md).

### `synos-hive-attestor`

Remote attestation. Approximately 1,680 lines of Rust with 59 tests.
The attestor's job is to decide whether a peer on the mesh is trustworthy
enough to accept workloads from or schedule workloads onto. It checks:

- **Kernel version** — the peer must be running a `6.19-synos-ai` kernel
  on a version this node knows how to talk to. Older kernels are
  quarantined.
- **SSH hardening posture** — verifies sshd config against the hive
  baseline (no password auth, no root login, modern ciphers only).
- **SUID audit** — runs an inventory of SUID binaries on the peer and
  compares against an allowlist. Any unexpected SUID binary fails
  attestation.
- **CVE scan** — cross-references the peer's package inventory against a
  known-vulnerabilities database shipped with the attestor.

A failing attestation does not bring the mesh down. The node is placed
in a quarantine state where the controller will not schedule any new
workloads onto it, but existing workloads keep running and operators can
diagnose the failure without a rollback.

### `synos-hive-profiler`

Hardware tiering. Approximately 1,395 lines of Rust with 57 tests. The
profiler runs once on first boot and then on a weekly schedule. It
detects:

- CPU generation and feature flags (AVX-512, VT-x, etc.).
- GPU presence and VRAM capacity.
- NVMe presence and measured read/write throughput.
- Mesh latency to every peer (via Tailscale ping).

It writes a hardware tier to the node's state file — `tier-1` through
`tier-4` where 1 is the highest-capacity — and the controller uses that
tier as a scheduling hint. Heavy GRIMOIRE raid scenarios and AI model
fine-tuning jobs request a tier-1 node; lightweight utility containers
schedule anywhere.

### `synos-hive-tests`

Integration harness. Approximately 1,049 lines. This is not a runtime
component; it is the test crate that exercises the three runtime crates
together under a namespaced K3s cluster. It validates:

- **Namespace isolation** — workloads in one raid namespace cannot read
  secrets from another.
- **RBAC** — the controller's service account has exactly the
  permissions it needs and no more.
- **Network policies** — the Cilium-style policies pushed by the
  controller actually block the traffic they claim to block.

`synos-hive-tests` is the crate you run before trusting a controller
change. It spins up a local K3s, deploys the controller, runs the
scenario suite, and tears everything down.

## systemd unit

The controller runs as `synos-hive-controller.service`, a systemd unit
installed by stage 11b. Its unit file is gated on K3s being present:

```ini
[Unit]
Description=ARCANUM Hive Controller
After=network-online.target k3s.service
Wants=network-online.target
ConditionPathExists=/etc/rancher/k3s/k3s.yaml

[Service]
ExecStart=/usr/local/bin/synos-hive-controller
Restart=on-failure
RestartSec=10s
# plus hardening: NoNewPrivileges, ProtectSystem, etc.

[Install]
WantedBy=multi-user.target
```

The `ConditionPathExists` is load-bearing. If K3s is not installed, the
controller has nothing to talk to, and systemd marks the unit as
`inactive (condition not met)` rather than failing it. That matters for
two reasons: first, an unconditional failure would trigger the
`Restart=on-failure` path and show up as a recurring incident in the
hive logs; second, operators can install K3s later without having to
manually re-enable the unit.

Stage 11b is also where the unit file is installed. If you are
debugging a hive-controller that never starts, check that stage 11b
actually ran in the build — a common symptom of a stage 11b failure is
that `/usr/local/bin/synos-hive-controller` exists but the unit file
does not.

## Mesh identity

Every hive node has a unique ed25519 keypair. The private key is
generated on first boot by a small binary called `node-identity` (part
of `synos-hive-attestor`'s dev-dependencies but also shipped as a
standalone utility). The keypair is written to
`growth/arcanum/keyring/nodes/<hostname>/` and protected with strict permissions
— the directory is 0700, the private key file is 0600, owned by the
`arcanum` system user.

Identity is what the attestor uses to sign attestation reports and what
the controller uses to verify those reports. A node with a missing or
corrupt identity file cannot be trusted by its peers and is treated as
a brand-new, unattested node — which in practice means it cannot host
workloads until an operator re-commissions it.

The sanctum node's identity is special in that it is the root of trust
for the OTA update system. A compromised sanctum key is the worst
failure mode the hive has, and the recovery procedure for it is
documented separately in the operations runbooks — it involves
physically re-flashing the sanctum node from a trusted ISO and
re-issuing commissioning blobs for every other node.

## K3s deployment

K3s is deployed by a set of scripts under `growth/development/scripts/k3s/`. The
important ones:

- **`install-k3s-sanctum.sh`** — 307 lines. Downloads the K3s installer,
  verifies its SHA-256 against a pinned value baked into the script, and
  runs it. The SHA-256 pin is critical: there is no `curl | sh` pattern
  in this script and there never has been. Every update to K3s is an
  explicit PR that bumps the pinned hash.
- **`deploy-arcanum-stack.sh`** — deploys the controller, attestor, and
  profiler manifests into the running K3s. Idempotent — re-running it
  over an existing deployment performs a rolling update.
- **`teardown-arcanum.sh`** — the mirror-image script that removes the
  stack cleanly. Useful during development when you want to reset a
  local K3s without nuking the cluster itself.
- **`test-arcanum-deployment.sh`** — post-deploy sanity check. Runs a
  short battery of kubectl probes to verify the controller is up, the
  CRDs are registered, and the attestor has completed its first pass.

These scripts are also the ones wrapped by the `just k8s-*` recipes —
see the "just recipes" section at the end of this page.

## Tetragon sidecar

Each hive node runs a Tetragon sidecar with four tracing-policy rules
that produce mesh-wide telemetry:

1. **`shell_exec_in_worker`** — any shell process started inside a
   worker pod's namespace. Legitimate worker images do not shell out,
   so this is a high-signal anomaly flag.
2. **`exec_from_tmp_or_devshm`** — any `execve` of a binary whose path
   starts with `/tmp/` or `/dev/shm/`. Common malware staging
   pattern.
3. **`network_connect_egress`** — egress connections from a pod to any
   destination not on the allowlist. Paired with the pod's network
   policy for defense in depth.
4. **`sensitive_path_write_nonroot`** — writes to
   `/etc/shadow`, `/etc/sudoers`, or `/boot` by any non-root UID.

The policies are small, focused, and deliberately chosen so their
combined false-positive rate is near zero. The attestor consumes the
Tetragon event stream and folds it into the per-node trust signal — a
node that is reporting clean Tetragon events is healthier than one that
is not, even if no individual event is a hard quarantine trigger.

## Hive-aware boot

Every Syn_OS node, hive or not, runs a small boot-time probe to figure
out what kind of node it is. The probe lives at
`fruit/core/src/hive/boot-detect.sh` — 298 lines of bash — and runs as
`synos-hive-boot.service` early in the boot sequence.

Its job, in order:

1. Detect whether a Tailscale interface exists at all. If not, the node
   is a standalone workstation and the probe exits cleanly.
2. If Tailscale is present, probe the 100.68.0.0/16 range for other
   hive nodes. This range is where all hive nodes live; a response
   from it means there is already a mesh running.
3. Based on the probe results, either register as a worker (by writing
   an entry into `/var/lib/synos/hive-state.json`) or declare itself as
   a potential master (by writing a different entry that the controller
   will later read and act on).
4. Exit with a zero status regardless of what it found. The hive boot
   probe is never allowed to fail the boot — if the mesh is partitioned
   or Tailscale is flaky, the node must still boot to usability.

`/var/lib/synos/hive-state.json` is the authoritative local record of
what the node thinks its role is. Reading it from a shell is the fastest
way to ask a freshly-booted node whether it came up as a worker or not.

## Commissioning flow

Putting it all together, a fresh node's commissioning sequence looks
like this:

1. **Boot.** Syn_OS starts. `synos-hive-boot.service` runs the probe and
   writes the initial hive-state file.
2. **systemd starts hive-controller.** Only if K3s is present (the
   `ConditionPathExists` gate). If K3s is missing, the unit stays
   inactive and waits.
3. **Controller reads CRDs.** The controller sees the new node's
   self-declaration in the hive-state file and creates a pending
   `ArcanumNode` CRD for it.
4. **Attestor verifies.** The attestor picks up the pending CRD, runs
   its kernel-version / SSH / SUID / CVE checks against the peer, and
   either promotes the CRD to `attested` or to `quarantined`.
5. **Profiler tags hardware.** In parallel with the attestor, the
   profiler runs its hardware detection pass and writes a tier label
   into the CRD.
6. **Controller schedules.** Once the CRD is both attested and tiered,
   the controller marks the node as schedulable and any pending work
   that matches the node's tier begins to flow to it.

The whole sequence is a few minutes on a fast network and under a
minute on a warm mesh.

## Failure modes

**Split-brain.** The mesh partitions — two subsets of nodes can each
see themselves but not the other. The controller on each partition
continues to schedule work onto the nodes it can see. When the partition
heals, the controllers reconcile: whichever partition held the sanctum
node wins any conflicts, because sanctum is the root of trust. Nodes
on the losing side of the reconciliation may have their workloads
drained and rescheduled. The hive's design assumes that split-brain is
rare and that the right operational response is to prefer the
sanctum side rather than try to merge state.

**K3s down.** If K3s crashes on a node, the controller service goes
inactive (because `ConditionPathExists` on `k3s.yaml` starts failing)
rather than crashing in a restart loop. The node remains on the mesh
as a plain worker but does not host Kubernetes workloads until K3s is
restored. Other nodes' controllers notice that this node's CRD is no
longer being updated and may move workloads off it depending on
their failover policy.

**Attestation failure.** The peer fails the attestor's checks. The CRD
is moved to `quarantined`. No new workloads are scheduled to it. Any
existing workloads keep running, but their completion events are not
trusted until attestation passes again. Operators are expected to
investigate — usually by looking at the attestor's log for the specific
check that failed — and either fix the issue (e.g., reapply the SSH
hardening baseline) or decommission the node.

## `just k8s-*` recipes

The `Justfile` at the repo root exposes the following recipes for
operators who do not want to remember the underlying script paths:

- `just k8s-setup` — installs K3s on the current node using
  `install-k3s-sanctum.sh`.
- `just k8s-render` — renders the hive manifests without applying them.
  Useful for reviewing exactly what is about to be deployed.
- `just k8s-deploy` — applies the rendered manifests via
  `deploy-arcanum-stack.sh`.
- `just k8s-render-prod` — the same render, but with the production
  overlay applied (higher replica counts, stricter resource limits,
  production-only RBAC).
- `just k8s-deploy-prod` — the production deploy. Expected to be run
  only on sanctum or in CI; regular development happens on the
  non-prod recipes.

Every recipe is a thin wrapper around the underlying script. If a
recipe is failing, run the script directly with `bash -x` to see what
it is actually doing — the recipes do not swallow output or add logic
beyond argument passing.
