---
title: ISO Build — How It Works
description: What happens when you build a Syn_OS ISO from source — the pipeline stages, key tools, and hardware constraints that shape the build.
---

Building a Syn_OS ISO is a chain of staged scripts, checkpointed so a
failure partway through doesn't force a full restart. This page is a
conceptual tour for anyone building from source via the
[Church of Malware public forge](/contributing/onboarding/); for
troubleshooting a specific failed build, see the
[Build Runbook](/operator-guide/build-runbook/).

## The pipeline at a glance

The orchestrator (`build.sh`) runs a sequence of stage scripts under
`growth/development/scripts/iso-build/stages/`, writing a checkpoint file
after each success so a re-run skips completed stages in milliseconds.

| Group | Purpose |
|---|---|
| **Pre-flight** | Verify the host has required tools, no half-mounted leftovers, branding assets present |
| **Kernel + Rust modules** | Build the custom kernel and the capability-gated Rust kernel-module interface |
| **Userspace Rust** | Compile the full workspace in release mode |
| **Base system** | `pacstrap` a minimal Arch root, then overlay Syn_OS-specific files |
| **Desktop + boot** | Cinnamon + Xfce4, display manager, bootloader configuration |
| **Security** | AppArmor profiles (enforce mode), security tool install, kernel hardening |
| **AI + Hive** | ALFRED daemon, mesh bootstrap, attestation, model staging |
| **Content** | GRIMOIRE labs, container overlays, multi-distro tool environments |
| **Image assembly** | squashfs compression, ISO bootloader wrap (BIOS + UEFI) |
| **Validation + publish** | Integration tests, a QEMU boot matrix, SBOM generation |

## Why the build is slow (and why that's expected)

The heaviest single stage is compiling the full Rust workspace in release
mode with `opt-level = 3`, `codegen-units = 1`, and full LTO — the
combination that gives the best runtime performance for a daemon that's
supposed to run 24/7, at the cost of a much slower build than a debug
profile. The kernel compile and the squashfs compression stage are the
other two long poles; on modest hardware (2 cores, ~11 GB RAM) a full build
can take several hours.

## Tool glossary

- **airootfs** — the Arch ISO root filesystem template; its contents become
  the running root after the squashfs mounts.
- **archiso / mkarchiso** — Arch's own ISO build framework and high-level
  builder. Syn_OS's stages break `mkarchiso` apart so each phase can be
  checkpointed independently rather than run end-to-end.
- **squashfs** — a read-only compressed filesystem; the entire live OS lives
  in one squashfs file inside the ISO.
- **LTO (Link-Time Optimization)** — re-running the LLVM optimizer at link
  time across crate boundaries, after all crates have compiled individually.
- **MOK (Machine Owner Key)** — the per-machine Secure Boot trust anchor
  used to sign a non-Microsoft bootloader and kernel.
- **checkpoint** — a small file written after a stage succeeds; on re-run,
  the orchestrator skips any stage with a valid checkpoint.

## Hardware constraints shape the pipeline

Syn_OS's own build oracle is modest hardware (2 physical cores, ~11 GB RAM,
no swap partition — ZRAM only). That constraint is visible throughout the
pipeline's defaults: sequential (non-parallel) stages, a moderate zstd
compression level chosen for a reasonable build time rather than maximum
compression ratio, and a `--jobs` count tuned to the available hardware
threads rather than assumed high core counts. If you're building on faster
hardware, these defaults are conservative — see the justfile for how to
override them.

## Quick reference

```bash
# Launch a build (as your normal user — never as root at the top level;
# individual stages elevate internally via sudo where needed)
./growth/development/scripts/iso-build/build.sh --profile grimoire --release

# Resume from a specific stage
./growth/development/scripts/iso-build/build.sh --profile grimoire --resume-from 03

# List all stages
./growth/development/scripts/iso-build/build.sh --list-stages

# Pre-flight readiness check
just iso-audit

# Test the finished ISO in QEMU
just qemu-iso
```

## Related

- [Build Runbook →](/operator-guide/build-runbook/) — what to do when a build fails
- [Build Observatory →](/operator-guide/build-observatory/) — live build monitoring
- [Reproducible Builds →](/architecture/forge/)
- [Contributor Onboarding →](/contributing/onboarding/)
