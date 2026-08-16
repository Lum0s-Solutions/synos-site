---
title: Contributor Onboarding
description: Get a Syn_OS development environment running — repository layout, toolchain, code standards, and how to submit changes.
---

Syn_OS is an Arch Linux derivative built for cybersecurity professionals,
combining a custom AI-aware kernel, the GRIMOIRE gamified training platform,
the ALFRED AI daemon, and post-quantum cryptography — almost entirely in
Rust across a ~226-crate workspace.

## Where the code lives

The active development entry point for community contributors is the Church
of Malware public forge — reachable by anyone, no invite or key required:

```bash
git clone https://git.churchofmalware.org/Diablo_Rain/CoM-Syn_OS-Public-Repo.git
cd CoM-Syn_OS-Public-Repo
rustup show               # installs the pinned nightly toolchain
just check                # cargo check --workspace (open crates only)
```

A small set of offensive/member-tier crates are git-crypt-gated behind a
Church of Malware membership key — see [Membership & /claim](/churchofmalware/membership/)
for how that's separate from runtime membership recognition. Most
contributions don't need this.

## Repository structure at a glance

| Path | Contents |
|------|----------|
| `fruit/crates/` | Rust library crates |
| `fruit/core/` | Shared infrastructure (AI, kernel, security, services, apps) |
| `fruit/core/src/linux-kernel/rust-modules/` | Loadable Rust kernel modules (33, capability-gated char-device/ioctl interface) |
| `fruit/distribution/` | ISO packaging, deployment, installer |
| `fruit/iso/iso-build/stages/` | The `mkarchiso`-based ISO build pipeline |
| `growth/development/docs/` | Public and internal documentation |
| `growth/xtask/` | `cargo xtask` — curtain, feature-audit, lab-integrity, and more |

## Prerequisites

**Required**

- An Arch-based host (EndeavourOS, Arch, Manjaro, or a Dockerized Arch
  environment). Other distros can build the Rust workspace, but the ISO
  pipeline needs `mkarchiso`/`archiso`.
- The pinned Rust nightly toolchain — `rustup show` installs the exact
  version the workspace requires (currently `nightly-2026-06-25`,
  rustc 1.98).
- Git 2.x+.

**Recommended**

- `just` (`cargo install just`) — runs the justfile commands.
- `cargo-deny` (`cargo install cargo-deny`) — license and advisory checks.

## Verify your environment

```bash
cargo check --workspace     # fastest sanity check
cargo fmt --check
cargo clippy --workspace
just gate                   # full quality gate: fmt + clippy + check + deny
```

If `just gate` fails on a pre-existing issue unrelated to your change, note
it and proceed — don't fix unrelated issues in the same PR.

## Encrypted files (optional)

Some files are git-crypt encrypted (kernel internals, ALFRED internals,
security configuration). Most contributors never need access:

1. `gpg --full-generate-key`
2. `gpg --armor --export your@email.com > yourname.gpg`
3. Send the exported key to the project maintainers to be added
4. `git-crypt unlock`

## Code style

- Rust: `cargo fmt` (max_width = 100, edition 2021)
- No `unsafe` without a `// SAFETY:` comment explaining why it's sound
- No `todo!()` / `unimplemented!()` in non-test code
- `thiserror` for library errors, `anyhow` for binaries
- Doc comments (`///`) on public items

## Commit format

Conventional Commits, enforced in CI:

```
feat: add ALFRED subscribe loop
fix: correct XP calculation in the gamification crate
docs: update onboarding guide for nightly toolchain
refactor: extract subject routing into a helper
security: restrict a local API to 127.0.0.1
ci: fix cargo deny license check for a new dependency
chore: bump a dependency version
```

## Testing

```bash
cargo test -p <crate-name> --lib
cargo check --workspace
cargo fmt --check
cargo clippy --workspace
```

## Submitting changes

Push your branch and open a pull/merge request against `main`. A maintainer
reviews within a few days; CI must be green before merge.

**Checklist**

- [ ] `cargo check --workspace` passes
- [ ] `cargo fmt --check` passes
- [ ] `cargo clippy --workspace` passes (no new warnings)
- [ ] Tests added or updated for your change
- [ ] Conventional commit format used

## Useful commands

```bash
just check          # cargo check --workspace
just gate           # full quality gate
just iterate <crate> # rapid check/clippy loop for one crate
cargo xt stats      # workspace metrics (LOC, crate count, test count)
```

## Related

- [GRIMOIRE Guide →](/user-guide/grimoire-guide/)
- [Reproducible Builds →](/architecture/forge/)
