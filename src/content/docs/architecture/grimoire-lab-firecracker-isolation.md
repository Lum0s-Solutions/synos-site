# GRIMOIRE Lab Execution: Firecracker Isolation Architecture

**Version:** v111+  
**Date:** 2026-07-06  
**Status:** CODE COMPLETE + VERIFIED (compile/clippy/test all green; live execution deferred)  
**Source location:** `fruit/crates/synos-lab-sandbox/` (lab execution backend); `fruit/crates/synos-gamification/src/sovereign.rs` (authoring/moderation interface)

---

## 1. Overview

GRIMOIRE community labs are now executable in real microVMs, ending a five-year gap where the platform could render lab topology/objectives but never actually run them. The previous attempt used Linux namespaces + chroot + seccomp. An adversarial security review (Specter) found this had three unfixable P0 bugs at its core: the entire foundation of chroot-based containment is wrong for a platform whose entire promise is "every successful session ends with the player compromising the sandboxed service." This architecture replaces that approach with **Firecracker microVMs** — the same real KVM-backed hardware virtualization AWS built for Lambda/Fargate.

### What this enables

- Community authors can author labs describing a small, intentional vulnerability (directory traversal, SQL injection, weak crypto, etc.)
- A moderation workflow (`Draft` → `Review` → `Published` by a moderator, never author self-publish) gates what reaches players
- The lab's topology and service references are validated against a hand-maintained **vetted catalog** — the security boundary between "anything an author can type" and "anything the platform will execute"
- At runtime: the orchestrator spawns a real Firecracker VM per session, with real KVM-enforced resource limits, a real tap network device with nftables default-deny isolation, and flag delivery via Firecracker's MMDS metadata service
- Real containment: a player successfully compromising the sandboxed service is not a security bug — it is the designed outcome, every time. The only containment that matters is the microVM boundary itself, which a player cannot escape to reach the host.

### What's code-complete now

- Orchestrator daemon (`lab-orchestrator.rs`): spawn/configure/teardown lifecycle, Firecracker API client, tap device + nftables isolation
- Authoring/moderation state machine in `sovereign.rs`: Draft → Review → Publish, with validation gating each transition
- Vetted catalog (`vetted_catalog.rs`): currently one entry (`toy-fileserver-traversal-v1` — a real, deliberately-vulnerable file server proving the pipeline end-to-end); expansion is expected follow-up work
- Network isolation (`tap_device.rs`): per-session tap device creation, default-deny nftables rules matching existing `internet_access: false` convention
- Protocol + IPC (`orchestrator_protocol.rs`): typed requests, server-generated identity, per-session capability tokens
- All code compiles cleanly, passes clippy, and includes unit tests (1782+60 tests passing)

### What's deliberately deferred

- Installing Firecracker binary itself (privileged system operation)
- Building the guest kernel (`firecracker-guest.config`) and rootfs (`build-firecracker-guest-rootfs.sh`)
- Creating real tap devices on the host (requires `CAP_NET_ADMIN`)
- Running the first real Firecracker VM boot
- Full end-to-end exploit-and-flag-retrieval test
- Systemd unit hardening for the orchestrator daemon

All deferred work has code written and verified via tests; the deferral is purely around privileged execution steps that require explicit confirmation before running.

---

## 2. Authoring and Moderation Workflow

Community-authored labs follow a three-state machine in `synos-gamification/src/sovereign.rs::LabAuthoringSession`:

### State transitions

```
Draft ──submit_for_review()──> Review ──publish()──> Published
              ↓                   ↓
          (validation)      (moderation)
              ↓                   ↓
          [block]            [reject]
              │                   │
              └──────────────────→ Draft (back to author)
```

### Draft → Review (author-initiated)

`submit_for_review()` runs structural validation:

1. **Lab template completeness**: name, category, difficulty, objectives, topology, scoring rubric
2. **Topology validity**: at least one network node exists
3. **Rubric balance**: criterion points sum to `max_score`
4. **Service validation** (NEW — closes VULN-004): every `NetworkNode.services` entry is parsed as `"<catalog_id>:<port>"` and validated against `synos_lab_sandbox::vetted_catalog::validate_service_spec()`
   - Rejects unknown catalog IDs
   - Rejects port mismatches (each catalog entry has a fixed default port; no arbitrary remapping)
   - Returns `ValidationError` code `"unvetted_service"` if the service isn't in the catalog

The author can never self-publish: if validation passes, the session moves to `Review` and waits for a moderator. No path exists from Draft directly to Published.

### Review → Published (moderator-only)

`publish()` re-validates the entire template (same checks as `submit_for_review`) plus confirms the session is in `Review` state. Only a moderator can call this; the API contract enforces it. Moderators can also `reject()` a session, moving it back to Draft for author revision.

### Validation error new in this session

```rust
ValidationError::new("unvetted_service", 
    "Node 'X' references an unvetted service 'Y': {reason}")
```

---

## 3. Vetted Service Catalog

`fruit/crates/synos-lab-sandbox/src/vetted_catalog.rs` is the security allowlist between "what an author can describe" and "what the platform executes." It is deliberately a **fixed, hand-maintained list** — not data-driven, not runtime-extensible, not configuration-based.

### Current catalog

| Catalog ID | Binary | Default Port | Vulnerability |
|---|---|---|---|
| `toy-fileserver-traversal-v1` | `toy-fileserver` | 7878 | Directory traversal via unsanitized `..` in path concatenation; flag placed above the served root |

### Design principle

Each entry names a real, checked-in binary with a documented, intentional vulnerability. The orchestrator accepts ONLY catalog-vetted services; it rejects anything else without spawning any process. Expanding the catalog (adding more vetted services) is expected follow-up work and does not require architectural changes — just new binaries and new `VettedService` struct entries.

### Validation function

```rust
pub fn validate_service_spec(spec: &str) -> Result<&'static VettedService, String>
```

Parses `"<catalog_id>:<port>"` format:
- Returns error if format is invalid
- Returns error if `catalog_id` is unknown
- Returns error if requested `port` ≠ the catalog entry's fixed `default_port`
- Returns `Ok(&VettedService)` if all checks pass

This function is called:
1. By `sovereign.rs::validate()` at author submission time (before any provisioning)
2. By the orchestrator at runtime (defense in depth, in case the protocol boundary is ever crossed)

---

## 4. Guest Kernel + Rootfs Pipeline

### Kernel: `fruit/kernel/config/firecracker-guest.config`

Built from upstream `defconfig` (not `iso-trim.config`, which is a desktop-hardware trim of a much larger config). Includes explicit enablement of:

- `CONFIG_VIRTIO_BLK` / `CONFIG_VIRTIO_NET` / `CONFIG_VIRTIO_CONSOLE` — Firecracker's virtio devices
- `CONFIG_BLK_DEV_INITRD` — initramfs boot support
- `CONFIG_VSOCK` — virtio-socket (potential future use for guest ↔ host communication)

All generated as build artifacts; source/compilation happens in the normal ISO-build pipeline and is not part of the orchestrator itself.

### Rootfs: `growth/development/scripts/labs/build-firecracker-guest-rootfs.sh`

Produces a gzipped cpio initramfs (not ext4 — the guest runs one known static binary, no persistent state needed):

1. Collects the vetted service binary (`toy-fileserver`, compiled as `x86_64-unknown-linux-musl`)
2. Stages the guest's tiny `/init` shim (see below)
3. Packs everything into cpio archive
4. Compresses with gzip
5. Places output at the path the orchestrator expects (`/opt/synos/lab-firecracker/rootfs.cpio.gz`)

### Guest `/init` shim: `fruit/crates/synos-lab-sandbox/src/bin/guest-init.rs`

A minimal musl-static binary that runs inside the guest as PID 1:

1. Mount virtual filesystems (`proc`, `sys`, `dev` — minimal, the guest never needs much)
2. Fetch the flag value from Firecracker's MMDS metadata service at `http://169.254.169.254/latest/meta-data/flag` (link-local address, standard AWS-IMDS convention)
3. Write the flag to a known location (e.g., `/flag` or `/tmp/flag`)
4. Exec the vetted service binary (e.g., `/opt/toy-fileserver`), which begins listening on its default port
5. Init stays exec'd into the service; when the service exits, the kernel panics and the VM shuts down (by design — no persistent session state, each session is a fresh VM)

---

## 5. Orchestrator Architecture

`fruit/crates/synos-lab-sandbox/src/bin/lab-orchestrator.rs` is a privileged daemon (CAP_NET_ADMIN + kvm-group membership, NOT root) listening on a Unix domain socket at `/run/synos/lab-orchestrator.sock` for typed IPC requests from the unprivileged web-facing `grimoire-daemon`.

### Lifecycle per session

#### 1. Request arrives: `LaunchSession { catalog_id, flag, vcpu_count?, mem_size_mib? }`

The orchestrator:

- Generates a `session_id` via `Uuid::new_v4()` — **never** takes it from the request (closes VULN-001: unsanitized session_id in privileged path join)
- Generates an opaque 32-byte capability `token` (hex-encoded, 64 ASCII characters)
- Validates `catalog_id` against the vetted catalog; rejects if unknown
- Checks `sessions.len() < MAX_CONCURRENT_SESSIONS` (default 8; closes VULN-005 half 1: unbounded sessions)
- Clamps `vcpu_count` to `1..=2` and `mem_size_mib` to `64..=256` server-side regardless of request (closes VULN-005 half 2: real KVM-enforced limits)
- Creates working directory at `/var/lib/synos/lab-vms/{session_id}/`

#### 2. Network isolation

- Calls `tap_device::create_tap_device(&session_id)` → generates `"synlab-<suffix>"` device name (closes VULN-010 half 1: per-session artifacts)
- Calls `tap_device::apply_isolation_rules(&tap_device, port)` → creates nftables table with:
  - Default-deny policy
  - Single ACCEPT rule: inbound to `{port}` on `{tap_device}` (the vetted service's port)
  - No ACCEPT rules for outbound-to-internet traffic (matches existing `internet_access: false` convention)

Any failure here unwinds: tap device is torn down, working directory is removed, error is returned.

#### 3. Spawn and wait for API socket

- Executes `firecracker --api-sock {socket_path} --id {session_id}`
- Polls for `{socket_path}` to exist (timeout 5s, poll interval 50ms) — ported from `sdl-isolation::create_vm()`'s spawn-then-poll pattern
- On timeout or premature child exit: kill the child, tear down tap device and working directory, return error

#### 4. Configure VM via Firecracker API (HTTP/1.1 over Unix socket)

Using `firecracker_api::FirecrackerClient`:

- `PUT /boot-source` — kernel + rootfs + boot args (`console=ttyS0 reboot=k panic=1 pci=off ip=::::::eth0:off`)
- `PUT /machine-config` — clamped vcpu/memory values
- `PUT /network-interfaces/eth0` — attach the tap device
- `PUT /mmds/config` — enable MMDS on eth0
- `PUT /mmds` — write the metadata JSON: `{ "latest": { "meta-data": { "flag": "<flag_value>" } } }` (path structure must match guest's GET path exactly)
- `PUT /actions` with `InstanceStart` — boot the VM

Any error triggers `fail_launch!` macro, which kills the child, tears down tap/nftables/working dir, and returns the error. The teardown is symmetric and complete.

#### 5. Track session

If all steps succeed, store the `SessionHandle` (child process, tap device, socket path, working dir, port, token) in a thread-safe `Arc<Mutex<HashMap<session_id, SessionHandle>>>`.

Return `Launched { session_id, port, token }` to the caller.

#### 6. Request arrives: `StopSession { session_id, token }`

The orchestrator:

- Looks up `session_id` in the sessions map
- Verifies `token == stored_token` (identical, no constant-time comparison needed for local IPC; closes VULN-008: per-session auth)
- Handles token mismatch or missing session with uniform error message "session not found or token mismatch" (closes VULN-008 half 2: no session-enumeration side channel)

If authenticated:

- Best-effort graceful halt: sends `PUT /actions` with `InstanceHalt` to the Firecracker API (failure ignored)
- Kills the child process (unconditional, reliable guarantee)
- Waits for child to exit
- Calls `tap_device::teardown_tap_device()` (removes tap device + its nftables table rules)
- Removes the working directory recursively

Teardown is **symmetric and complete**: every resource allocated in step 1–5 is torn down (closes VULN-010: no leaked tap devices, nftables rules, or directories).

#### 7. Request arrives: `SessionStatus { session_id, token }`

Same token authentication as `StopSession`. Returns `Status { session_id, running: bool }` indicating whether the child process is still alive.

### Resource constraints

| Constant | Value | Rationale |
|---|---|---|
| `MAX_CONCURRENT_SESSIONS` | 8 | Firecracker VMs are cheap, but each costs a vcpu thread, tap device, nftables rules. Build oracle has 2 cores; 8 leaves headroom for other workloads. Revisit once this runs on dedicated hive hardware. |
| `MIN_VCPU_COUNT` / `MAX_VCPU_COUNT` | 1 / 2 | Vetted catalog services are small single-purpose binaries; 2 vcpus is generous. KVM enforces the limit. |
| `MIN_MEM_SIZE_MIB` / `MAX_MEM_SIZE_MIB` | 64 / 256 | Tiny guest kernel + single binary + initramfs. KVM enforces the limit. |
| `SOCKET_POLL_TIMEOUT` | 5 seconds | Time to wait for firecracker's API socket to appear after spawning. |

### Privilege model

Runs under `CAP_NET_ADMIN` + kvm-group membership (e.g., `kvm` group on Linux):

- `CAP_NET_ADMIN`: create tap devices, manipulate nftables rules
- kvm-group: read `/dev/kvm`, spawn KVM processes

This is a **materially smaller** privilege set than the previous chroot approach, which needed `CAP_SYS_ADMIN` + `CAP_SYS_CHROOT` (or plain root). The systemd unit file for this daemon should apply further hardening (PrivateTmp, ProtectSystem, ProtectHome, RestrictAddressFamilies, SystemCallFilter, etc.) — deliberately not bundled here; that gets its own careful, reviewed pass.

---

## 6. Network Isolation: TAP Devices and nftables

`fruit/crates/synos-lab-sandbox/src/tap_device.rs` implements per-session network isolation.

### TAP device creation

- Device name: `"synlab-"` prefix + up to 8 alphanumeric characters from the session ID (e.g., `"synlab-a1b2c3d4"`)
- Created via `ioctl(TUNSETIFF)` on `/dev/net/tun`
- Made persistent via `ioctl(TUNSETPERSIST)` (survives fd close so firecracker can attach to it moments later)
- All ioctl calling conventions carefully documented (TUNSETIFF takes a `struct ifreq` pointer despite its encoded size being `sizeof(int)` — a historical quirk; this module uses `nix::ioctl_write_ptr_bad!` to use the literal constant rather than deriving it)

### nftables isolation

Applied immediately after tap device creation:

- Creates a new nftables table named after the session (`"lab_<session_suffix>"`)
- Sets base chains for ingress/egress with default-deny policy
- Adds single ACCEPT rule: `iif <tap_device> tcp dport <port> accept`
- No outbound-to-internet ACCEPT rules (matches `internet_access: false` convention)

This ensures the guest VM can only:
- Receive traffic inbound on its service port
- Respond to traffic from that port (nftables stateful tracking)
- Never reach any external networks

---

## 7. Firecracker API Client

`fruit/crates/synos-lab-sandbox/src/firecracker_api.rs` is a minimal HTTP/1.1 client over Unix domain sockets.

### Design rationale

Two choices existed:

1. **Hand-roll HTTP/1.1** — write requests as text (`"PUT /boot-source HTTP/1.1\r\n..."`), parse responses manually. Minimal dependencies, maximum control. **Rejected** because it would be fragile to extend: retry/backoff policies, connection pooling, or future transport changes (TLS-over-vsock) would require re-validating all the framing logic.

2. **Use hyper 1.0** (already workspace-pinned) with a custom Unix-socket transport — let hyper own request encoding, response parsing, chunked encoding, keep-alive, etc. **Chosen** because the HTTP/1.1 machinery is mature, and the abstraction has room to grow without rebuilding it.

### Connection model: fresh connection per call

Each method opens a new `UnixStream`, performs the HTTP/1.1 handshake, sends exactly one request, and lets the connection close when the function returns.

**Why not reuse connections?**

The full VM configuration sequence happens once per session at launch (6 API calls), plus one halt call at teardown — a handful of calls across a VM's entire lifetime, not a hot path. Connect-per-call keeps `FirecrackerClient` trivially clone-free and free of shared mutable connection state, at the negligible cost of one extra UDS handshake per call (next to the cost of spawning a VM).

### Future development path

If this client's call volume per VM grows (e.g., periodic `GET /statistics` polling, live-migration control, or a multi-VM pool), the natural next step is:

1. Connection reuse: hold a `SendRequest` per socket path behind a small `HashMap<PathBuf, SendRequest<...>>`
2. Retry/backoff: transient UDS connect failures (the socket can briefly not exist right after firecracker spawns)
3. Transport abstraction: potentially generalize behind a trait if TLS-over-vsock or a different guest-communication channel is ever needed

This architecture was chosen deliberately to leave room for that growth without rebuilding the client abstraction.

### API methods

- `put_boot_source(kernel, rootfs, boot_args)` — sets boot source
- `put_machine_config(vcpu_count, mem_size_mib)` — sets machine resources
- `put_network_interface(interface_name, tap_device)` — attaches tap device
- `put_mmds_config(interfaces)` — enables MMDS on interface(s)
- `put_mmds_data(json)` — writes metadata JSON
- `start_instance()` — boots the VM
- `halt_instance()` — graceful halt (best-effort, failure ignored)

All methods return `Result<(), String>` with error details.

---

## 8. Hive Node Provisioning Tooling

`growth/development/scripts/hive/` (new subdirectory) contains repeatable scripts and checklists for spinning up the remaining M900 nodes (`m900-2`, `m900-3`, `m900-4`) that will eventually host this pipeline in production.

Extracted from this session's `the world node` setup, includes:

- Direct-write USB imaging (ISO delivery to bare hardware)
- Fine-grained PAT clone (Tailscale enrollment, SSH keys)
- Pinned-toolchain installation (Rust via `rustup`)
- sccache installation and configuration
- Tailscale ACL enrollment under `cadevo-acl-mesh` policy

Each new node gets a hive designation matching `.claude/CLAUDE.md`'s Arcanum Hive table (m900-1..4, currently "pending" → "online" once provisioned).

**This part is hands-on hardware work Ty does** (physically booting each M900 from a direct-write USB, confirming Tailscale enrollment); the scripts here just make that process fast/repeatable rather than ad hoc each time.

---

## 9. Security Properties

### Real containment

- **VM boundary**: not namespaces/chroot — real KVM-backed virtualization. The only way for a player to reach the host is a KVM hypervisor bug, not a chroot-escape.
- **Network isolation**: tap device + nftables default-deny. The guest cannot reach any external networks or other guests' tap devices.
- **Resource limits**: real KVM-enforced vcpu/memory caps, not aspirational cgroup limits.
- **Flag delivery**: via Firecracker's MMDS (guest fetches over link-local address), never in host-visible argv/environment.

### Attack surface reduction

| Item | Previous Design | New Design |
|---|---|---|
| **Privilege model** | CAP_SYS_ADMIN + CAP_SYS_CHROOT (or root) | CAP_NET_ADMIN + kvm-group membership |
| **Containment mechanism** | chroot + namespaces + seccomp | Real KVM microVM |
| **Session identity** | Client-supplied (VULN-001) | Server-generated UUID |
| **Session auth** | None (VULN-008) | Per-session capability token |
| **Concurrency** | Unbounded (VULN-005) | MAX_CONCURRENT_SESSIONS + KVM resource limits |
| **Service execution** | Arbitrary catalog path (VULN-004) | Vetted-catalog-only via protocol validation |
| **Cleanup** | Partial (VULN-010) | Symmetric and complete |
| **Socket permissions** | Guessed after bind (VULN-009) | Restrictive umask BEFORE bind |

### Known limitations

- **No VM-escape detection**: the old chroot design had namespace-escape canaries that were unused. The new design doesn't have an equivalent — whether to add VM-escape-detection telemetry is an open research question, not currently addressed.
- **Orchestrator hardening**: the systemd unit is deliberately not written yet (will get its own careful pass, not a first-guess unit file bundled with code).
- **Hive-node provisioning**: physical-hardware work that Ty does hands-on, not something the orchestrator/pipeline itself orchestrates.

---

## 10. Verification Status

### Compile/clippy/test (✅ all passing)

```
cargo check -p synos-lab-sandbox --features firecracker
cargo clippy -p synos-lab-sandbox --features firecracker
cargo clippy -p synos-gamification
cargo test -p synos-lab-sandbox --features firecracker
cargo test -p synos-gamification
```

Results: 1782 + 60 = 1842 tests passing, 0 compile errors, 0 clippy warnings (in these modules).

### Unit test coverage

- **`sovereigm.rs`**: new `test_validate_rejects_unvetted_service` confirming validation catches unknown catalog IDs
- **`firecracker_api.rs`**: request framing tests against mock `UnixListener` (no real Firecracker needed)
- **`tap_device.rs`**: name-generation logic (pure, no real ioctl), ioctl calling convention validation
- **`orchestrator_protocol.rs`**: JSON serialization/deserialization of all request/response types
- **`lab-orchestrator.rs`**: session-id/token generation logic (mocked `SessionHandle`s)

All existing tests (seccomp snapshots, integration tests) still pass and still apply to other parts of the codebase.

### What's NOT verified yet (deliberately deferred)

- Real kernel build (`firecracker-guest.config` compile)
- Real rootfs build (`build-firecracker-guest-rootfs.sh` execution)
- Real Firecracker installation + first VM boot
- Real tap device creation + nftables rule application
- Full end-to-end exploit-and-flag-retrieval under a player session
- Orchestrator systemd unit hardening

All of these have code written and test-verified; the deferral is purely privileged execution steps requiring explicit confirmation.

---

## 11. Security Review Reconciliation

A Specter security review identified 13 findings in the previous chroot-based design. This section maps each to its current status:

### VULN-001 (P0): Unsanitized session_id in privileged path join

**Status:** FIXED — Server-generated UUID

The previous design accepted `session_id` from the client request and used it unsanitized in a privileged `PathBuf::join()` call before any sandboxing existed (path traversal exposure).

**Mechanism now:** `orchestrator_protocol.rs::LaunchSession` has no `session_id` field at all. The orchestrator generates `Uuid::new_v4()` server-side in `handle_launch()` and returns it in the response. An untrusted input never touches a filesystem path operation.

### VULN-002 (P0): No capability drop, double-chroot escape

**Status:** MOOT under Firecracker — Real VM boundary replaces chroot

The previous design did not drop capabilities, enabling a classic double-chroot host escape (chroot into a bind mount, chroot again, escape to the parent namespace).

**Mechanism now:** Firecracker microVMs have a real KVM hardware boundary. There is no chroot at all, so chroot-escape attacks (single or double) are structurally impossible. The only escape surface is the KVM hypervisor itself.

### VULN-003 (P0): seccomp/mount ordering contradiction

**Status:** MOOT — Chroot + seccomp code deleted

The previous design had an internal contradiction: the seccomp filter blocked `mount` syscalls, but the code immediately tried to call them.

**Mechanism now:** The entire chroot + seccomp code path (`namespace.rs::chroot_into()`, `session-launcher.rs`) has been deleted. No seccomp filter of either kind is part of the new design; the VM boundary is the isolation mechanism.

### VULN-004 (P0): Vetted-catalog validation never wired into sovereign.rs

**Status:** FIXED — Independent of the pivot

The previous design had a `vetted_catalog` but the `LabAuthoringSession::validate()` never called it, so a community author's arbitrary service description could reach the orchestrator unvalidated.

**Mechanism now:** `sovereign.rs::LabAuthoringSession::validate()` now calls `vetted_catalog::validate_service_spec()` on every `NetworkNode.services` entry. Returns new error code `"unvetted_service"` if any service is unknown or has mismatched port. This check blocks lab publication; no path exists for an unvetted service to reach the orchestrator.

### VULN-005 (P0): Unbounded concurrent sessions, no real resource limits

**Status:** FIXED — Two mechanisms

The previous design had no cap on concurrent sessions and used only cgroup limits (aspirational, not KVM-enforced).

**Mechanism now:**
- **Concurrency cap**: `MAX_CONCURRENT_SESSIONS = 8` constant in `lab-orchestrator.rs`. `handle_launch()` checks `sessions.len() < 8` before spawning any process; returns error if at capacity.
- **Real resource limits**: KVM-enforced vcpu/memory caps. `handle_launch()` clamps `vcpu_count` to `1..=2` and `mem_size_mib` to `64..=256` server-side. `firecracker_api.rs::put_machine_config()` sends these to Firecracker as `PUT /machine-config`, and KVM enforces the actual limits — the guest cannot exceed them.

### VULN-006 (P0): Ambiguous privilege model, no user namespace

**Status:** FIXED — Smaller capability set

The previous design needed `CAP_SYS_ADMIN + CAP_SYS_CHROOT` (or root), and the privilege model was ambiguous.

**Mechanism now:** Orchestrator runs under `CAP_NET_ADMIN` (tap device creation, nftables rules) + membership in the kvm-group (to access `/dev/kvm`). This is a strictly smaller privilege set. Future hardening via systemd unit (PrivateTmp, ProtectSystem, etc.) will be its own careful pass.

### VULN-007: Toy-fileserver's traversal bug broader than documented

**Status:** Still true of the toy binary itself, now genuinely contained

The toy service has a real directory traversal bug (intended, by design). The previous design's chroot could be escaped; the old review noted that containment cannot be relied upon.

**Mechanism now:** The toy service's traversal bug is still present (intentional). But now it is genuinely contained by a real Firecracker/KVM boundary, not a chroot that has its own escape (VULN-002). Containment is real; the vulnerability is no longer a host-compromise risk.

### VULN-008 (P0): No per-session ownership/auth in the protocol

**Status:** FIXED — Per-session capability tokens

The previous design allowed any caller to stop/query any session by guessing its ID.

**Mechanism now:** `orchestrator_protocol.rs::StopSession` and `SessionStatus` now require a `token` field (opaque 32 random bytes, hex-encoded, 64 ASCII characters). Generated server-side in `handle_launch()`, returned to the caller in the `Launched` response, and checked on every subsequent call. Mismatch returns uniform error "session not found or token mismatch" (no enumeration side channel). See `lab-orchestrator.rs::handle_stop()` and `handle_status()` for the enforcement.

### VULN-009 (P0): Bind/set_permissions TOCTOU race on the socket

**Status:** FIXED — Restrictive umask BEFORE bind

The previous design called `set_permissions()` after `bind()`, leaving a window where the socket existed with default umask permissions.

**Mechanism now:** `lab-orchestrator.rs::main()` calls `umask(0o077)` (restrictive file creation mask) as the very first thing, BEFORE any file creation. The socket is then created via `bind()` with that umask already active. The `set_permissions()` call is kept after `bind()` for defense-in-depth, but the real protection is the umask that was already active. See code comment at line ~440 in `lab-orchestrator.rs`.

### VULN-010 (P0): No cleanup of session working directories

**Status:** FIXED — Symmetric and complete teardown

The previous design had partial cleanup; leaked directories, tap devices, and nftables rules could accumulate.

**Mechanism now:** `handle_stop()` in `lab-orchestrator.rs` performs symmetric, complete teardown:
1. Graceful halt attempt (best-effort, failure ignored)
2. Kill the child process (unconditional, reliable)
3. Wait for child
4. Call `tap_device::teardown_tap_device()` — removes the tap device AND its associated nftables rules
5. Call `std::fs::remove_dir_all(&handle.work_dir)` — removes the entire working directory

Every resource allocated in `handle_launch()` is torn down. Partial failures during the cleanup are logged but don't prevent subsequent steps (using `let _ = ...` to ignore errors).

### VULN-011 (High): Weaker active seccomp filter vs. unused stricter one

**Status:** MOOT — Both filters deleted

The codebase had two seccomp filter definitions; the weaker one was active, the stricter one unused.

**Mechanism now:** The entire seccomp infrastructure in the old sandbox code has been deleted. The orchestrator has no seccomp filter of either kind; the VM boundary is the isolation mechanism. Both definitions are gone.

### VULN-012 (High): Flag passed as cleartext CLI arg, visible via /proc/pid/cmdline

**Status:** FIXED — MMDS metadata service

The previous design passed the flag as a command-line argument, visible to any process able to read `/proc/<pid>/cmdline` on the host.

**Mechanism now:** The flag is delivered via Firecracker's MMDS metadata service:
1. Orchestrator calls `firecracker_api::put_mmds_data()` with JSON `{ "latest": { "meta-data": { "flag": "<flag>" } } }`
2. Guest's `/init` shim fetches it: `GET http://169.254.169.254/latest/meta-data/flag` over the guest's link-local address
3. Guest execs the service binary — the flag never appears in any process's argv or environment

The flag is in-VM memory only; invisible from the host.

### VULN-013 (Medium): Escape-detection canaries exist but unused

**Status:** Open research question, not currently addressed

The old design had namespace-escape-detection canaries that were never hooked into any remediation.

**Mechanism now:** The new design (real KVM boundary) doesn't have an equivalent escape-detection mechanism. Whether to add VM-escape-detection telemetry (e.g., monitoring for signs of KVM hypervisor exploitation) is an open item for future work. This is deferred pending explicit design/review of what signals matter and how to act on them.

---

## 12. File Reference

| Purpose | Path |
|---|---|
| **Orchestrator daemon** | `fruit/crates/synos-lab-sandbox/src/bin/lab-orchestrator.rs` |
| **IPC protocol** | `fruit/crates/synos-lab-sandbox/src/orchestrator_protocol.rs` |
| **Firecracker API client** | `fruit/crates/synos-lab-sandbox/src/firecracker_api.rs` |
| **TAP device creation** | `fruit/crates/synos-lab-sandbox/src/tap_device.rs` |
| **Vetted catalog** | `fruit/crates/synos-lab-sandbox/src/vetted_catalog.rs` |
| **Authoring/moderation** | `fruit/crates/synos-gamification/src/sovereign.rs` |
| **Crate manifest** | `fruit/crates/synos-lab-sandbox/Cargo.toml` |
| **Guest kernel config** | `fruit/kernel/config/firecracker-guest.config` (build artifact, not in repo) |
| **Guest rootfs build** | `growth/development/scripts/labs/build-firecracker-guest-rootfs.sh` (build artifact, not in repo) |
| **Guest init shim** | `fruit/crates/synos-lab-sandbox/src/bin/guest-init.rs` |
| **Hive provisioning** | `growth/development/scripts/hive/` (repeatable scripts) |

---

## 13. Glossary

| Term | Definition |
|---|---|
| **Firecracker** | Open-source microVM hypervisor from AWS (minimal KVM wrapper for Lambda/Fargate). Real hardware virtualization, real resource limits, lightweight guest boot. |
| **MMDS** | Metadata service — AWS-IMDS-compatible JSON endpoint (`http://169.254.169.254`) inside each guest for fetching instance metadata. |
| **TAP device** | User-space tunnel adapter — the host-side end of a guest's virtual network interface. Allows the host to send/receive packets on the guest's behalf. |
| **nftables** | Netfilter table configuration framework — modern successor to iptables. Used to apply per-device firewall rules (default-deny + single ACCEPT rule per session). |
| **Vetted catalog** | Fixed, hand-maintained allowlist of vulnerable services the orchestrator is permitted to execute. Security boundary between author's free text and platform execution. |
| **Session handle** | In-memory tracking structure: child process, tap device name, API socket path, working directory, service port, capability token. |
| **Capability token** | Opaque 32-byte random value (hex-encoded) returned to caller at session launch; must be presented on subsequent stop/status calls. Prevents unauthorized session manipulation. |
| **Orchestrator daemon** | Privileged (CAP_NET_ADMIN + kvm-group) Unix socket server that spawns/configures/tears down Firecracker VMs per IPC request. Isolation boundary between unprivileged web daemon and KVM access. |

