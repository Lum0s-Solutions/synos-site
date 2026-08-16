# The 34-Stage ISO Build Pipeline

Syn_OS is assembled by a deterministic, checkpoint-driven, strict-mode
build pipeline that runs 53 stage scripts in a fixed order under the
`build.sh` orchestrator. The pipeline produces one of three ISO profiles —
master, grimoire public, or goodlife — and the same stage scripts run for
all three; the differences between profiles are expressed through feature
flags, package selection, and strip passes rather than through separate
build trees.

This page documents what each stage does (grouped semantically), how the
strict mode guarantees work, which environment gates are recognized for
phased builds, where logs and checkpoints live, how the build dashboard
is implemented, the expected build times and output sizes, and the
troubleshooting checklist you reach for when a stage fails at 2am.

## Overview

The orchestrator lives at `fruit/iso/iso-build/scripts/build.sh`. It is the
single entry point into the pipeline — `just iso <profile>` is a thin
wrapper around it — and its job is to set up the environment, choose a
profile, enforce strict mode, and then run the 53 stage scripts in
`fruit/iso/iso-build/scripts/stages/` in strict lexical order.

Every stage is:

- **Idempotent.** Re-running a stage against a tree that has already had
  that stage applied is a no-op. This makes `--resume-from N` safe.
- **Checkpoint-guarded.** Each stage writes a checkpoint file on
  success, and the orchestrator will skip stages whose checkpoints are
  already present unless forced.
- **Loud on failure.** Under `SYNOS_STRICT=1` (the default), any stage
  failure aborts the pipeline immediately. There are no non-fatal
  stages in strict mode.

The orchestrator itself is about 900 lines of bash with a strict error
mode (`set -Eeuo pipefail`) and traps that guarantee log files are
flushed before the process exits.

## Profiles

Three build profiles are supported. The profile is selected by a flag
on `build.sh` or by the `just iso <profile>` recipe.

- **Master** — the internal, full-fat build. Includes every crate,
  every lab, the master-only C2 hooks, and the full ALFRED feature set.
  Typically around 10-13 GB squashfs.
- **Grimoire Public** — the public training ISO. Includes the 100
  GRIMOIRE labs, the gamification system, GRIMOIRE's full UI, but
  strips all master-only surfaces through a combination of Cargo
  feature flags and the [Grimoire Curtain](./grimoire.md) symbol
  scanner. Typically around 6-8 GB.
- **GoodLife AI Research** — the AI research ISO. Grimoire's base plus
  the ALFRED `research-mode` feature, research-specific models, and
  the idle-time consciousness-fusion experiments. Typically around
  5-7 GB because it drops some of GRIMOIRE's larger lab artifacts.

Profile selection propagates through environment variables that every
stage can read, and the critical profile-sensitive stages (stages 11,
11b, 14, and 17a) branch on it explicitly rather than relying on
upstream strip passes.

## The 34 stages

The stages are grouped semantically here. On disk they are strictly
ordered by their numeric prefix, and the orchestrator runs them in that
order every time.

### Preflight and base (00, 00a, 01)

**`00-branding-assets.sh`** generates and stages the branding assets
(ISO label, boot splash, GRUB theme, wallpaper) used by later stages.
This is stage zero because several downstream stages depend on its
outputs — staging it first means those stages can fail loudly on
missing branding rather than producing unbranded ISOs.

**`00-preflight.sh`** runs the top-level sanity checks before any work
begins: disk space, required binaries, kernel source presence, network
reachability for package mirrors, and `SYNOS_STRICT` assertion. A
failure here aborts the pipeline before the cache is touched.

**`00a-mount-sanity.sh`** verifies the state of any loop mounts,
bind mounts, and temp mount points used by later stages. This exists
because earlier Syn_OS versions had a stage that left a bind mount
behind after a crash and the next build would silently inherit it;
00a catches that case.

**`01-dependencies.sh`** installs and verifies the host packages needed
to run the rest of the pipeline: `clang`, `lld`, `bindgen`, `pacman`,
`xorriso`, `mkarchiso`, and the various build-time Rust targets.

### Kernel and runtime (02, 02b, 03)

**`02-kernel.sh`** builds the `6.19-synos-ai` kernel. This is the single
longest stage in the pipeline and is covered in detail on the
[custom kernel](./custom-kernel.md) page. The stage enforces the
`CONFIG_RUST=y` survival assert, the `SYNOS_*` option count floor, and
the proprietary config restore after `localmodconfig`.

**`02b-synos-rust-modules.sh`** compiles the 17 loadable Rust kernel
modules against the kernel tree built in 02. Modules are signed with
the Syn_OS signing key and deployed to the staging rootfs under
`/lib/modules/6.19-synos-ai/extra/synos/`.

**`03-rust-crates.sh`** builds the userspace Rust workspace — all 171
workspace crates that ship as binaries or libraries. This stage uses
the cached `cargo` artifacts under `growth/cache/cargo/` to keep warm
builds fast. It was also the site of the v111 Phase 2 "root-owned
fingerprints" bug where the cached `.fingerprint` directories were
being written as root and breaking the next run's cache lookups — the
fix was to chown the cache to the build user as the last step of the
stage.

### Rootfs bootstrap (04, 05)

**`04-arch-base.sh`** runs `pacstrap` to materialize the base Arch
Linux rootfs into the staging directory. The package set is pinned and
lives in a profile-specific list under `fruit/iso/iso-build/scripts/config/`.

**`05-rootfs.sh`** overlays the Syn_OS-specific rootfs fragments onto
the Arch base. This is where `/etc/synos/`, custom `/usr/share/synos/`
data, and default-user home skeletons are installed.

### User-facing (06, 06b, 07, 07a)

**`06-desktop-environment.sh`** installs the dual-desktop environment:
Cinnamon as the default desktop and Xfce4 as the fallback. A user at
the display manager login screen can choose which to start. The
dual-DE approach is a v34 addition; earlier versions shipped Cinnamon
only, but several user reports on older hardware showed Cinnamon's
compositor was the weak link, so Xfce4 was added as a lightweight
escape hatch.

**`06b-pxe-server.sh`** builds out the PXE server payload — the small
in-ISO HTTP server and kernel/initrd set that lets a live-booted
Syn_OS image serve the same image to other machines on the LAN for
mass deployment.

**`07-system-configuration.sh`** writes out the system configuration:
hostname defaults, locale, keyboard, `/etc/synos/` defaults, systemd
unit enablement, and the user skeleton.

**`07a-bootloader.sh`** installs GRUB2 with the custom "neural-command"
theme — the GRUB theme that matches the Syn_OS branding. UEFI and BIOS
paths are both configured. An earlier sprint fixed a UEFI boot failure
that happened when GRUB was installed before the theme files existed;
07a now installs the theme first and GRUB second.

### Security (08, 09, 10)

**`08-apparmor-policy.sh`** installs the AppArmor policy bundle. Every
Syn_OS daemon (ALFRED, hive controller, etc.) has a profile and is
confined at boot.

**`09-security-tools.sh`** installs the 2849-package BlackArch tools
group for security testing. This is a heavy stage and is often the
first candidate to phase out during phased builds via
`SYNOS_SKIP_BLACKARCH_GROUP=1`. During the v111 Phase 2 bug-kill
this stage also had a regex false-positive in its package-validation
path that caused it to mark a perfectly valid package as missing; the
fix tightened the regex anchors.

**`10-kernel-hardening.sh`** applies the runtime kernel hardening
sysctls, writes out the `/etc/sysctl.d/` drop-ins that pin them, and
reconciles them with AppArmor.

### AI and Hive (11, 11b, 12)

**`11-alfred-daemon.sh`** installs the ALFRED binary, manifests,
`model-provenance.toml`, systemd unit, first-boot wizard, and the
profile-specific feature flags. This stage also branches on profile:
it installs `research.toml` only on goodlife, and it omits the
master-only C2 manifests from grimoire builds.

**`11b-hive-boot.sh`** installs the [ARCANUM Hive](./arcanum-hive.md)
boot probe, the hive-controller binary, and the
`synos-hive-controller.service` unit file with its `ConditionPathExists`
K3s gate. During the v111 Phase 2 bug-kill, this stage had a file
permission bug where the `growth/arcanum/keyring/nodes/` directory was being
created with mode 0750 instead of 0700, which failed the identity
store's permission check. The fix pinned the mode explicitly in the
install command.

**`12-ai-models.sh`** pulls the shipping set of Ollama models into the
ISO's model cache directory. Each model is verified against its
`model-provenance.toml` entry before install. This stage had a bug in
v111 where `pip` was missing in the stage's subshell environment
and the model installer helper failed with an obscure `ImportError`;
the fix was to install pip as part of stage 01 dependencies.

### Platform (13, 13b, 14, 15, 16, 16b, 17, 17a, 17f)

**`13-ebpf-framework.sh`** installs the eBPF support libraries and
headers, plus the Syn_OS eBPF programs that feed ALFRED's telemetry
pipeline.

**`13b-lab-dockerfiles-preflight.sh`** (v60.0.2) — static lint gate on
every GRIMOIRE lab Dockerfile before stage 14 spends 30 min building
them. Wraps `utils/lab-dockerfiles-preflight.sh` and halts the build on
any CRITICAL finding (missing FROM, curl|sh patterns, invalid lab.json).
Non-strict by default (warnings don't block). Emergency override:
`SYNOS_SKIP_LAB_PREFLIGHT=1`. Promote to strict via
`SYNOS_LAB_PREFLIGHT_STRICT=1` once the v60.0.3 backlog cleans the
existing 29 `--no-install-recommends` warnings.

**`14-grimoire-platform.sh`** installs the [GRIMOIRE](./grimoire.md)
platform: the 71-lab tree, the gamification crate binaries, the
competition mode runtime, the first-boot wizard (bash + Rust layers),
and the XDG autostart entry. The Docker lab image bundler at the end
of this stage is opt-in-prebuild via `SYNOS_PREPULL_LAB_IMAGES=1`
(v60.0.2 T2-6): when set, `utils/grimoire-images-prebuild.sh` walks
every Dockerfile and runs `docker build` on the build oracle before
the bundler packages images into `_image-bundle/grimoire-labs-images.tar.zst`.
Without the env var, the bundle ships empty and Docker labs require
internet on first boot. On profiles where GRIMOIRE is not shipped
(none currently — all three public profiles ship GRIMOIRE), this stage
would be a no-op.

**`15-container-integration.sh`** installs Docker / Podman runtime
support, default container templates, and the Syn_OS-specific
container policies (seccomp, AppArmor).

**`16-system-optimization-and-utilities.sh`** applies the runtime
optimization tweaks: IO scheduler selection, tmpfs sizing, cgroup v2
delegation, and the default set of utility binaries.

**`16b-k3s-runtime.sh`** installs the K3s runtime and the
`install-k3s-sanctum.sh` helper script. K3s is not started during the
build — the hive-controller unit's `ConditionPathExists` gate handles
that at first boot.

**`17-multi-distro-environments.sh`** sets up the distrobox-based
multi-distro environments. This is the stage that takes
`SYNOS_SKIP_DISTROBOX_PREPULL=1` when phased builds want to skip the
initial container image pulls.

**`17a-blank-slate.sh`** runs the blank-slate secret strip. Any file
in the staged rootfs that matches a secret-like pattern (API key,
private key, `.env`) is removed. This stage is a hard floor on the
pipeline's secret hygiene — even if something slipped through an
earlier stage, 17a is where it dies.

**`17f-rootfs-smoke.sh`** (v60.0.2) — pre-squashfs smoke gate. Runs
`utils/iso-audit.sh --rootfs build/rootfs/` against the in-place rootfs
after the 17e validation gate, BEFORE 18a-squashfs spends ~90 minutes
sealing the image. Walks the same 11 defect classes (desktop launchers,
session PATH, systemd symlinks, ExecStart targets, dconf, host-leak
paths, image bundle, etc.) and halts the build on any CRITICAL. Emergency
override: `SYNOS_SKIP_22B=1`.

### Assembly (18, 18a, 19)

**`18-optimization.sh`** runs the final rootfs optimizations: package
cleanup, cache cleanup, log truncation, and the file-level dedup pass.

**`18a-squashfs.sh`** compresses the rootfs into a squashfs image. The
compression parameters are tuned for balance: `xz` with a dictionary
size that keeps decompression memory use reasonable on the minimum
supported hardware.

v60.0.2 T4-1 adds reproducibility: `mksquashfs` is invoked with
`-no-fragments`, `-all-time ${SOURCE_DATE_EPOCH}`, and
`-mkfs-time ${SOURCE_DATE_EPOCH}`. With these flags the same source tree
produces a byte-identical squashfs, which makes `utils/iso-diff.sh`
regression reports surgically precise (every changed binary in the diff
is a real source change, not mtime drift).

**`19-iso-assembly.sh`** assembles the squashfs, the kernel, the
initrd, and the bootloader into the final ISO using `xorriso` via the
`mkarchiso` wrapper. Hybrid BIOS/UEFI boot is set up here.

### Validation (20, 21, 22, 23, 24)

**`20-postflight.sh`** runs the post-assembly checks, including a
re-run of the Grimoire Curtain symbol scanner against every shipped
binary inside the final squashfs. A symbol leak at this stage is a
build abort, not a warning.

**`21-automated-testing.sh`** runs the in-ISO automated test suite.
This is where smoke tests for ALFRED startup, hive boot-probe, and
GRIMOIRE wizard dry-run live. Failure at this stage means the ISO is
bad even though it assembled cleanly.

**`22-validation-qa.sh`** runs the QA validation profile — a broader
pass than stage 21 that includes slower checks, boot-time latency
measurements, and a boot-into-qemu smoke test.

**`23-patch-generation.sh`** generates the delta patch from the
previous release to the current one, for use by the hive-controller's
OTA update subsystem.

**`24-publish-sbom.sh`** emits the CycloneDX SBOM for the built
profile, signs it with SHA-256, and optionally with GPG if
`SYNOS_SBOM_SIGN_KEY` is set. Output lands alongside the ISO in
`growth/output/iso/sbom/`.

## Strict mode

`SYNOS_STRICT=1` is the default and any stage failure is fatal. There
are no "non-fatal under strict" stages — the flag is either on or off,
and off is only used during very early development of a new stage.
Stages that want to distinguish between "this is a genuine failure"
and "this is an expected skip under a phase flag" do so by checking
the phase flag *before* doing any work, so the decision never gets
mixed up with a real error.

## Environment gates for phased builds

Syn_OS supports phased builds — the common case being to run the first
half of the pipeline, hand off the output to another machine, and pick
up the second half there. The environment gates for this workflow are:

- **`SYNOS_SKIP_MULTI_DE=1`** — skip the dual-desktop install in stage
  06. Useful when testing on headless hardware.
- **`SYNOS_SKIP_BLACKARCH_GROUP=1`** — skip the BlackArch 2849 package
  install in stage 09. Useful when iterating on stages after 09 and not
  wanting to re-download the group on every rebuild.
- **`SYNOS_SKIP_DISTROBOX_PREPULL=1`** — skip the distrobox image
  prepull in stage 17. The resulting ISO still ships distrobox, just
  without the pre-cached container images.
- **`SYNOS_SKIP_KB_CLONE=1`** — skip the ALFRED knowledge base clone in
  stage 11. The resulting ISO has ALFRED's manifest directory empty
  and the daemon will fail to start without manual intervention —
  useful for pipeline debugging, not for shipping.

Two convenience launchers wrap these flags for common splits:

- **`build-phase1.sh`** — runs stages 00 through 12 with the flags set
  to maximize cacheability.
- **`build-phase2.sh`** — runs stages 13 through 24, expecting the
  phase-1 output to already be in place.

## Checkpoints

Per-stage checkpoint files live in `growth/output/iso-checkpoints/`.
Each successful stage writes a file like `02-kernel.checkpoint`
containing a JSON blob with the stage name, profile, start time, end
time, and a hash of the stage script as it existed when it was run.

The orchestrator supports `--resume-from <N>` to skip every stage
earlier than stage N by validating the earlier checkpoints and then
starting from N. If a checkpoint is missing, corrupt, or its script
hash no longer matches the current script, the orchestrator treats it
as invalid and will not skip over it — this prevents the "silent stale
checkpoint" class of bugs that plagued an earlier pipeline design.

## Progress tracking and the dashboard

Progress state is tracked in a shared file updated by every stage. The
implementation is in `fruit/iso/iso-build/scripts/lib/progress-state.sh`.
It uses `flock(1)` for concurrency and `sed` for in-place updates, and
as of v111 it uses `\x01` as the delimiter character in the sed
program rather than the previous `/` — the older delimiter was
occasionally appearing inside the values being written and corrupting
the file during dashboard updates. The fix was a one-line delimiter
change plus a regression test.

The dashboard is implemented in `fruit/iso/iso-build/scripts/lib/dashboard.sh`
together with `iso-status.sh`. It reads the shared progress file and
renders a live status view that you can watch from a separate terminal
while the build runs. The dashboard is read-only — it never writes to
the progress state — so it is safe to run multiple dashboards against
the same build.

## Expected build time

On the primary build oracle (i5-3337U, 2c/4t, NVMe, 16 GB RAM):

- **Cold build (no cache)** — approximately 3 hours for the master
  profile. The kernel is the long pole at about 2 hours of that budget;
  everything else runs in parallel where it can.
- **Warm build (cargo + kernel object cache primed)** — approximately
  1.5 hours for master. Most of the speedup comes from the warm kernel
  object cache turning a 2-hour stage 02 into a 30-45 minute one.

Warmer hardware scales roughly linearly on the kernel stage up to the
4-thread limit; beyond that, ccache and the squashfs compression start
to dominate.

## Expected ISO size

Output sizes are profile-dependent:

- **Master** — 10-13 GB.
- **Grimoire Public** — 6-8 GB.
- **GoodLife AI Research** — 5-7 GB.

Variance inside a profile is mostly driven by the BlackArch group and
the model cache. A master build with `SYNOS_SKIP_BLACKARCH_GROUP=1` is
about 4 GB lighter than a full one.

## Output layout

The assembled ISO and its sidecars land under `growth/output/iso/`:

```
growth/output/iso/
├── Syn_OS-v34.0.X-master-2026-04-15-x86_64.iso
├── Syn_OS-v34.0.X-master-2026-04-15-x86_64.iso.sha256
├── Syn_OS-v34.0.X-grimoire-2026-04-15-x86_64.iso
├── Syn_OS-v34.0.X-grimoire-2026-04-15-x86_64.iso.sha256
└── sbom/
    ├── master.cdx.json
    ├── master.cdx.json.sig
    ├── grimoire.cdx.json
    └── grimoire.cdx.json.sig
```

The `.sha256` sidecar for each ISO is created immediately after the
ISO itself, by stage 19. If the SHA-256 file is older than the ISO it
sits next to, something went wrong — compare timestamps before
distributing the image.

## SBOM publish

Stage 24 generates a CycloneDX SBOM per profile. The SBOM enumerates
every package installed into the rootfs, every Rust crate that shipped
as a binary or library, every model in the model cache (cross-linked
to `model-provenance.toml`), and every kernel module. Each SBOM is
SHA-256-signed unconditionally and can optionally be GPG-signed by
setting `SYNOS_SBOM_SIGN_KEY` to a key ID in the build user's keyring.

The SBOMs live alongside the ISO in `growth/output/iso/sbom/` and are
the authoritative record of what is inside the image. Any downstream
audit (including the post-release CVE tracking) reads them rather than
trying to re-derive the inventory from the squashfs.

## Troubleshooting

**Finding logs.** Every stage writes to
`fruit/iso/iso-build/scripts/logs/<NN-stagename>.log`. The orchestrator
also writes a top-level `build.log` that captures the stage
transitions. When a stage fails, start with `build.log` to find the
stage that failed, then read that stage's log for the actual error.

**Resuming a failed build.** Find the last checkpoint that succeeded,
then re-run with `--resume-from <next stage number>`. The orchestrator
will validate the earlier checkpoints and pick up cleanly.

**A stuck stage.** The dashboard will show the stage as active but
progress not advancing. Attach to the build with
`tail -f fruit/iso/iso-build/scripts/logs/<NN-stage>.log` to see what the
stage is currently doing. The most common stuck-stage cases are a
kernel build waiting on a slow source download (stage 02), a package
sync waiting on a mirror (stages 04, 09), and an OCI image pull
waiting on Docker Hub (stage 17).

**Corrupt checkpoint.** Delete the offending checkpoint file in
`growth/output/iso-checkpoints/` and re-run. The orchestrator will
re-execute the stage. Never edit a checkpoint file by hand — the
validation logic re-hashes the stage script and will reject a
tampered checkpoint.

**Post-assembly curtain failure.** Stage 20 caught a master-only
symbol in a public binary. This is almost always a code change that
failed to gate a master-only function behind the `#[cfg(...)]` flag.
Look at stage 20's log for the exact symbol name and track it back to
its defining crate; the fix is always to add the missing feature flag
and rebuild from stage 03.
