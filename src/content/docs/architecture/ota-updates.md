# OTA Updates

**Version**: v111.0.0 "Last Light"
**Source**: `fruit/crates/synos-hive-controller/src/ota/`
**Tests**: 113 unit tests
**Status**: Production (single-master) — multi-master deferred to v38

---

## Overview

Syn_OS ships a mesh-coordinated over-the-air update system for ARCANUM Hive nodes.
The master node advertises available patches through an HTTP manifest endpoint;
worker nodes pull the manifest on a schedule, verify and download any
applicable patches, apply them atomically with a pre-apply btrfs snapshot
for rollback, and report status back through the hive controller.

> **Two OTA systems — don't conflate them.** This document covers the **hive-coordinated,
> patch-level** OTA in `synos-hive-controller` (mesh nodes pull patches from a master). The
> **standalone, image-level** A/B updater — `synos-ota` (v62 "Hollow Point"), which a single
> Syn_OS install uses to update *itself* by swapping whole rootfs slots with QEMU-verify +
> watchdog rollback — is documented separately in
> **[synos-ota — standalone A/B client](ota-standalone.md)**.

The system is built on top of `synos-hive-controller` — the same crate that
runs the Kubernetes operator managing `ArcanumNode` custom resources — so OTA
lifecycle events share the phase state machine and alert plumbing already used
for node attestation and workload scheduling.

The v34.0.2 hardening pass closed twelve production gaps identified during the
pre-build readiness audit. The most load-bearing of those are:

- Atomic state persistence — the previous implementation called
  `std::fs::write` directly, which could corrupt `state.json` if the process
  was killed mid-write. The new path writes to a sibling tempfile, fsyncs, and
  renames over the target.
- Streaming downloads with progress reporting — the 0.1 implementation
  buffered the entire patch payload into memory before writing to disk. v34
  streams the body in 256 KiB chunks and broadcasts progress to `state.json`
  every 64 KiB.
- Canary-group-aware manifest queries — nodes are stably hashed into Canary /
  Stable / LTS cohorts, and patches carry a `min_canary_group` gate that
  excludes higher-risk nodes from receiving patches not yet promoted to their
  cohort.

This page documents the architecture as it exists in v34.0.2. For the
operator's perspective of installing and running the hive, see
[`hive-operations.md`](./hive-operations.md). For the patch format itself,
see the [Patch format](#patch-format) section below.

---

## Source layout

The OTA subsystem is ten modules under
`fruit/crates/synos-hive-controller/src/ota/`:

| Module | Responsibility |
| ------ | -------------- |
| `mod.rs` | Public exports, `OtaError`, re-exports for the parent crate |
| `patch.rs` | `OtaPatch`, `PatchKind`, `CanaryGroup`, signature helpers |
| `state.rs` | `OtaNodeState`, the 8-state FSM, atomic persistence |
| `client.rs` | `OtaClient` — worker-side pull loop, manifest query, verify, apply |
| `server.rs` | `OtaServer` — master-side manifest store, profile/version filtering |
| `dispatch.rs` | `PatchDispatcher` — kind-aware apply routing |
| `sbom.rs` | `SystemSbom` — CycloneDX loader, pre-apply component version checks |
| `snapshot.rs` | `SnapshotManager` — btrfs snapshot create/list/prune/rollback-marker |
| `http_transport.rs` | `HttpMasterTransport` — reqwest client with CA pinning + bearer |
| `http_server.rs` | `axum` router for the three manifest endpoints |

`tests.rs` at the same level houses the 113 unit tests that exercise every
layer of this stack, plus an end-to-end happy-path test that spins up an
`OtaServer` behind `HttpMasterTransport` and drives an `OtaClient` through a
real download-verify-apply cycle against mocked dispatch backends.

---

## Architecture layers

The subsystem has five cooperating pieces. None of them talk to the network
directly except `OtaClient` (through a `MasterTransport`) and
`http_server.rs` (through `axum`).

### 1. OtaServer (master side)

The master node owns the authoritative manifest. `OtaServer` holds an
in-memory `HashMap<PatchId, Arc<OtaPatch>>` keyed by patch id, plus a
second `HashMap<PatchId, PayloadBytes>` for the compressed patch payloads.
On startup the master loads patches from a spool directory (one patch per
subdirectory, with `patch.json` describing metadata and `payload.bin` holding
the signed blob).

Queries are filtered in three dimensions:

1. **Profile** — a patch with `target_profile = Some("grimoire")` is only
   served to nodes that advertise that profile in their manifest query. A
   patch with `target_profile = None` is universal.
2. **Version** — nodes send their current `OtaPatch` id as `version`; the
   server only returns patches whose id is lexicographically greater (patches
   are versioned in monotonic format).
3. **Canary group** — the node's canary group is hashed from its `node_id`
   and sent with the manifest query; the server excludes any patch whose
   `min_canary_group` outranks the node's cohort.

`OtaServer::query_manifest` returns a `ManifestResponse { patches:
Vec<OtaPatch>, server_time: SystemTime }`. The `server_time` field lets
clients detect clock skew and is not currently used for any other purpose.

### 2. OtaClient (worker side)

Every ARCANUM worker runs an `OtaClient` as part of
`synos-hive-controller.service`. The client owns three things:

- A `MasterTransport` implementation (production: `HttpMasterTransport`).
- A persistent `OtaNodeState` loaded from `/var/lib/synos/ota/state.json`.
- A `PatchDispatcher` configured with the paths needed to apply each patch
  kind (kernel module root, systemd unit directory, pacman wrapper path, and
  so on).

The client's main loop is:

```rust
loop {
    let manifest = transport.fetch_manifest(
        node_id,
        profile.as_deref(),
        state.current_version.as_deref(),
    )?;

    for patch in manifest.patches {
        state.transition(PatchEvent::Discovered(&patch))?;
        match client.process(&patch) {
            Ok(()) => state.persist(&state_path)?,
            Err(err) => {
                state.transition(PatchEvent::Failed(err))?;
                state.persist(&state_path)?;
            }
        }
    }

    thread::sleep(poll_interval);
}
```

The check-in cadence is `poll_interval` (default 15 minutes, configurable
through `/etc/synos/ota/client.toml`). The client backs off exponentially on
transport errors, capped at one hour, and resets the backoff on the next
successful manifest fetch.

### 3. PatchDispatcher

`PatchDispatcher::apply(&OtaPatch, &Path)` routes an already-verified patch
to the appropriate apply backend based on its `PatchKind`:

| PatchKind | Apply path |
| --------- | ---------- |
| `KernelModule(name)` | `modprobe -r name` → copy `.ko` into `/lib/modules/$(uname -r)/extra/` → `depmod -a` → `modprobe name` |
| `UserspaceBinary(path)` | Atomic rename the new file over the target path, then `systemctl try-restart` any unit listed in the patch's optional `restart_units` field |
| `Configuration(path)` | Atomic rename into place, then `systemctl reload` (or `systemctl try-restart` if the unit doesn't support reload) |
| `RustCrate(spec@version)` | Replace the crate's installed binary (same atomic rename dance) and restart the associated systemd unit; primarily used for in-place updates of other hive daemons |
| `FullSystem` | `pacman -Syu --noconfirm` inside a transaction, then write `/var/lib/synos/ota/reboot-required` as a marker for the node operator |

`FullSystem` patches do not reboot the node themselves — that is a policy
decision for the hive operator and is left to the `synos-hive-rollback`
service (see [Rollback](#rollback)).

Every apply backend is idempotent: applying the same patch twice is a
no-op on the second attempt, and the state machine (see
[State machine](#state-machine)) refuses to transition a patch into
`Applying` if it is already in `Applied`.

### 4. SnapshotManager

Before every apply, `PatchDispatcher` asks `SnapshotManager::pre_apply` to
create a read-only btrfs snapshot of `/` and `/home` (configurable). The
snapshot is named `synos-ota-{patch_id}-{timestamp}` and is recorded in
`/var/lib/synos/ota/snapshots.json` with a TTL.

```bash
btrfs subvolume snapshot -r / /.snapshots/synos-ota-<patch_id>-<ts>
```

The default TTL is seven days; snapshots older than that are pruned on the
next apply cycle. If the node is not on btrfs (for example, in a container
or VM image used for testing), the snapshot manager degrades gracefully: it
logs a warning, records the snapshot as a no-op in the journal, and lets the
apply proceed. This is the correct behaviour for non-production hosts — the
loss is only that rollback becomes a manual operation.

### 5. SystemSbom

`SystemSbom::load(path)` parses a CycloneDX 1.5 JSON SBOM from
`/var/lib/synos/sbom/current.json` and builds a `HashMap<ComponentRef,
Version>` indexed by purl. When `OtaClient` sees a patch that targets a
component (`RustCrate(spec@version)` or `UserspaceBinary(path)` with an
associated purl), it queries the SBOM for the currently-installed version
and refuses to apply the patch if the installed version is already at or
ahead of the patch target.

This is the final line of defence against replay attacks: even if an
attacker got a signed patch past the signature check, the SBOM check
prevents downgrading a hive node to a known-vulnerable version.

---

## Patch format

A patch is described by `OtaPatch`:

```rust
pub struct OtaPatch {
    pub id: String,                    // e.g. "2026.04.15-kmod-synos-lsm-hotfix"
    pub version: String,                // semver of the payload
    pub created_at: SystemTime,         // ISO-8601 in JSON
    pub checksum_sha256: [u8; 32],      // SHA-256 of the payload
    pub signature_ed25519: [u8; 64],    // ed25519(checksum_sha256)
    pub size_bytes: u64,
    pub target_profile: Option<String>, // "master" / "grimoire" / "goodlife" / None
    pub kind: PatchKind,
    pub min_canary_group: CanaryGroup,  // Canary / Stable / Lts
}
```

`PatchKind` has five variants — `KernelModule(String)`,
`UserspaceBinary(PathBuf)`, `Configuration(PathBuf)`,
`RustCrate { spec: String, version: String }`, and `FullSystem`. The
variants are deliberately coarse: adding a new kind requires a matching
dispatcher arm and a new round of tests.

The patch is serialized as JSON on disk and over the wire, which trades
compactness for human-debuggability. The payload itself is raw bytes —
binary for kernel modules and userspace binaries, tarball for
`FullSystem` patches, and UTF-8 for `Configuration` patches.

The `min_canary_group` field is new in v34.0.2. Patches produced before
v34.0.2 (which did not have the field) are loaded with a default of
`CanaryGroup::Canary`, which means they are released to every node — the
conservative choice for backwards compatibility.

### Manifest schema v2

The patch-generator that runs on the build oracle produces a separate
metadata file alongside each patch: `manifest.json` conforming to
`ManifestV2`:

```json
{
  "schema_version": 2,
  "patch_id": "2026.04.15-kmod-synos-lsm-hotfix",
  "patch_sha256": "a3f1...",
  "cve_ids": ["CVE-2026-18234"],
  "changelog_url": "https://syn-os.org/changelog/2026.04.15",
  "severity": "High",
  "signature_ed25519_hex": "7c...",
  "min_canary_group": "Stable"
}
```

`severity` is one of `None / Low / Medium / High / Critical` and is used by
the hive controller TUI (see [`hive-operations.md`](./hive-operations.md)
for the TUI tab) to colour-code pending patches.

The generator signs the manifest at build time. The signing key path is
read from the patch-generator TOML config under `signing_key_path`, with
`SYNOS_SBOM_SIGN_KEY` as an environment-variable override for CI.

---

## State machine

Every patch transition the client observes is captured by the 8-state
`PatchState` enum:

```
Unknown → Current
      ↓
      Pending
      ↓
      Downloading
      ↓
      Verifying
      ↓
      Applying
      ↓
      Applied

(any state) → Failed
```

The transitions are:

| From | Event | To |
| ---- | ----- | -- |
| Unknown | Discovered (patch newer than current) | Pending |
| Unknown | Discovered (patch equal to current) | Current |
| Pending | DownloadStarted | Downloading |
| Downloading | DownloadComplete | Verifying |
| Verifying | VerifyOk | Applying |
| Verifying | VerifyFailed | Failed |
| Applying | ApplyOk | Applied |
| Applying | ApplyFailed | Failed |
| Failed | RetryRequested | Pending |
| Applied | Discovered (newer patch) | Pending |

The state is persisted to `/var/lib/synos/ota/state.json` atomically after
every transition:

```rust
fn persist(state: &OtaNodeState, path: &Path) -> Result<(), OtaError> {
    let tmp = path.with_extension("json.tmp");
    let mut f = File::create(&tmp)?;
    serde_json::to_writer(&mut f, state)?;
    f.sync_all()?;
    std::fs::rename(&tmp, path)?;
    Ok(())
}
```

This is the fix for v34.0.2 Gap #4. Prior to this pass, the client called
`std::fs::write(path, serde_json::to_string(state)?)` directly, which opens
the target for truncation before writing — if the process was killed or the
machine lost power between truncate and write, `state.json` would be empty
or partial on the next boot and the client would refuse to start.

The property-test suite for the state machine (`tests.rs`, 13 tests under
`mod state_machine_properties`) verifies that every transition is valid,
that `Failed → Applied` is impossible without an intermediate retry, and
that the JSON serialization is a bijection under `serde_json`.

---

## Verification chain

When a patch is downloaded, the client runs three checks in order before
handing it to `PatchDispatcher`:

1. **Size** — the downloaded file must match `OtaPatch::size_bytes`
   exactly. Mismatches abort the apply and transition to `Failed`.
2. **SHA-256** — the downloaded file is hashed with SHA-256 and compared
   to `OtaPatch::checksum_sha256`. Computed via `sha2::Sha256` using a
   512-byte streaming buffer so the full payload is never held in memory.
3. **ed25519 signature** — the signature is verified over
   `checksum_sha256.as_bytes()` (not over the payload directly — signing the
   hash is 32 bytes instead of potentially hundreds of megabytes) using the
   master public key loaded from
   `/etc/synos/arcanum/keyring/master.pub`.

The master public key is provisioned on node enrollment and is not rotated
through OTA — rotation is an enrollment-time operation handled by
`synos-hive-attestor`. A rotated key is a new enrollment.

The sign/verify roundtrip has five dedicated tests
(`mod signature_roundtrip`), including explicit tamper detection: flipping a
single bit in the checksum, the signature, or the payload must all cause
verification to fail.

---

## Canary rollout

`CanaryGroup` is an ordered enum:

```rust
pub enum CanaryGroup {
    Canary = 0,  // 5%  of nodes
    Stable = 1,  // 50% of nodes
    Lts    = 2,  // 100% (all remaining nodes)
}
```

Each node is assigned to a group at enrollment time by hashing its
`node_id` with SHA-256 and mapping the first byte into one of the three
buckets according to the percentages above. The assignment is stable: a
given `node_id` always lands in the same group.

A patch is only offered to a node if `node.canary_group >=
patch.min_canary_group`. In practice this means the release cadence for
a production-quality patch is:

1. Build, sign, publish with `min_canary_group = Canary`. Only the 5%
   canary cohort fetches and applies it.
2. After a bake period (typically 24 hours of no alerts from the canary
   cohort), re-publish with `min_canary_group = Stable`. The 50% stable
   cohort now fetches and applies it.
3. After a second bake period, re-publish with `min_canary_group = Lts`.
   All remaining nodes now fetch.

Re-publishing means producing a new `OtaPatch` with the same payload but
an incremented `id` suffix — the signature is over the checksum so the same
payload is re-signable trivially. The patch-generator has a
`--promote-to-group` flag that does this in one command.

Canary distribution is tested with seven dedicated tests in
`mod canary_distribution` that verify the hash distribution is roughly
uniform across 10,000 synthetic node ids and that the group ordering
(`Canary < Stable < Lts`) is enforced in the `PartialOrd` impl.

---

## Streaming downloads

`OtaClient::download_patch` used to buffer the entire payload into a
`Vec<u8>` before writing to disk. For kernel-module patches this is fine —
they are typically under a megabyte. For `FullSystem` patches that can run
hundreds of megabytes, it is a problem on nodes with 4 GiB of RAM or less.

v34.0.2 replaces that with a streaming path using `reqwest`'s blocking
body reader:

```rust
let mut response = transport.download_patch_stream(&patch.id)?;
let mut tmp = File::create(&tmp_path)?;
let mut buf = [0u8; 256 * 1024];
let mut total = 0u64;
let mut last_progress = 0u64;
loop {
    let n = response.read(&mut buf)?;
    if n == 0 { break; }
    tmp.write_all(&buf[..n])?;
    total += n as u64;
    if total - last_progress >= 64 * 1024 {
        state.progress = Some(total);
        state.persist(&state_path)?;
        last_progress = total;
    }
}
tmp.sync_all()?;
std::fs::rename(&tmp_path, &final_path)?;
```

The chunk size (256 KiB) is a compromise between syscall overhead and
latency of progress reporting. The progress interval (64 KiB) is chosen so
that the progress bar in the TUI updates roughly every few seconds on a
typical hive-mesh connection.

The `sync_all` before `rename` is not optional — without it, a machine
lost power after rename but before fsync could boot with a zero-length
file where the patch should be. This is the same invariant the state
machine relies on, and for the same reason.

---

## Transport

`MasterTransport` is a trait with two methods:

```rust
pub trait MasterTransport: Send + Sync {
    fn fetch_manifest(
        &self,
        node_id: &str,
        profile: Option<&str>,
        version: Option<&str>,
    ) -> Result<ManifestResponse, OtaError>;

    fn download_patch_stream(
        &self,
        patch_id: &str,
    ) -> Result<Box<dyn Read + Send>, OtaError>;
}
```

Two implementations ship in v34.0.2:

- **HttpMasterTransport** — production. Wraps a `reqwest::blocking::Client`
  configured with optional PEM CA certificate pinning and a bearer token for
  authentication. The CA cert path and token are loaded from
  `/etc/synos/ota/client.toml`. Certificate pinning is not required but is
  strongly recommended for hives that cross an untrusted network.
- **MockMasterTransport** — tests. In-memory patch store, used by every
  `tests.rs` integration test to avoid spinning up real HTTP servers.

The trait design means a future transport (for example, a peer-to-peer
mesh overlay for hives that cannot reach the master directly) can be
dropped in without touching the client's main loop.

---

## Server endpoints

The master-side HTTP service is built with `axum` and exposes three
endpoints:

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/ota/health` | Liveness probe — returns `200 OK` with `{ "status": "ok", "patches": <count> }` |
| `GET` | `/ota/manifest?node_id=X&profile=Y&version=Z` | Returns `ManifestResponse` filtered as described in [OtaServer](#1-otaserver-master-side) |
| `GET` | `/ota/download/:patch_id` | Streams the payload for the given patch id |

The router is mounted by the hive controller via:

```rust
let state = OtaHttpState::new(server, keyring_path);
let router = ota::http_server::router(state);
// merged into the hive-controller's top-level axum router
```

Bearer-token authentication is enforced at the router level via an
`axum::middleware::from_fn` middleware. Nodes send
`Authorization: Bearer <token>`; the token is checked against
`/etc/synos/ota/server-tokens.json` (a mapping of node_id → token) and
rejected with 401 on mismatch. Token rotation is a separate operator
procedure, not an OTA path.

---

## Rollback

`SnapshotManager::request_rollback(patch_id)` writes a marker file to
`/var/lib/synos/ota/pending-rollback.json` containing the snapshot name
that should be restored on next boot. The marker is JSON so the rollback
service can read it without needing the full `synos-hive-controller`
crate.

The actual subvolume swap happens in a separate service —
`synos-hive-rollback.service`, a first-boot-only unit scheduled for v35 —
which runs:

```bash
btrfs subvolume set-default <subvolid-of-snapshot>
```

and reboots. The reason for splitting the marker-write and the subvolume
swap is that the hive controller process is running from the subvolume that
is about to be swapped out; it cannot correctly finish the swap from
within itself. A tiny early-boot service with no dependencies on the
running system is the safe place for the operation.

Until v35 lands, rollback is a manual operation: an operator reads
`pending-rollback.json`, runs `btrfs subvolume set-default` by hand, and
reboots. This is documented in the runbook the hive controller emits at
`/var/log/synos/ota/rollback-instructions.txt` when a failed apply triggers
a rollback request.

---

## Deployment on the ISO

Two binaries are deployed by the ISO build pipeline:

- `/usr/local/bin/synos-hive-controller` — the full hive controller,
  including the OTA server and client code.
- `/usr/local/bin/node-identity` — small helper that computes the node's
  `node_id` and canary group from hardware characteristics at first boot.

Both are built from the `synos-hive-controller` workspace member during
ISO stage 03 (`install-rust-toolkits.sh`), which is the same stage that
lays down the other critical Rust binaries. The binaries are added to
`critical_binaries` in the stage's manifest so a missing one is a hard
failure rather than a warning.

The systemd unit `synos-hive-controller.service` is installed by stage 11b
(`install-services.sh`), but it does not start at boot on a fresh system.
It carries a `ConditionPathExists=/usr/local/bin/k3s` gate, which means it
only starts on nodes that have been promoted to hive participants — that
is, nodes on which k3s has been installed by the node-wizard. This
prevents the installer ISO from attempting to join a hive before the
operator has made that decision.

---

## Testing

The 113 OTA unit tests break down roughly as:

| Area | Tests |
| ---- | ----- |
| State machine transitions (property testing) | 13 |
| Sign / verify roundtrip + tamper detection | 5 |
| SBOM schema + version compare | 13 |
| Canary distribution + group ordering | 7 |
| Streaming progress reporter | 1 |
| Dispatch (all 5 PatchKinds with mock backends) | 11 |
| Server manifest filtering (profile + version + canary) | 9 |
| HTTP transport (with `httpmock` on a random port) | 14 |
| Snapshot manager (no-op path + TTL pruning) | 6 |
| Integration (end-to-end via MockMasterTransport) | 34 |

The integration tests use `MockMasterTransport` to stand up a full
client-server-dispatcher pipeline in a single process. They exercise every
`PatchKind` through the dispatcher with a mock backend that records calls
rather than executing them, so the tests run without needing root or a
real btrfs filesystem.

---

## Out of scope

Several features are deliberately not implemented in v34.0.2 and are on
the roadmap:

- **Multi-master leadership** (v38) — the current design has a single
  master node publishing the manifest. A hive with multiple master nodes
  would need a consensus layer for which master owns the manifest, and
  the client would need to fail over between them on transport errors.
- **Tenant-scoped patches** (v38) — integration with `synos-tenant` so
  that patches can be scoped to a single tenant's workloads rather than
  to the entire profile.
- **Signed-but-revoked patches** (v39) — a mechanism for the master to
  revoke a signed patch after publication (for example, after discovering
  a regression post-release). The current design relies on superseding
  the patch with a new id, which does not stop a node that already
  downloaded the old one from applying it if the node was offline during
  the supersession.

See the hive operations guide for how to monitor the fleet while the
above limitations still apply.
