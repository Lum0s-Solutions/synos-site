---
title: Build from Source
description: Clone the Church of Malware forge and build the open parts of Syn_OS yourself. What resolves, what stays sealed, and how the published ISO and runtime membership fit in.
---

The source is open now, at the **Church of Malware** forge — a public open-core mirror of the Syn_OS codebase. Anyone can clone it and build the open parts.

## Clone

```bash
git clone https://git.churchofmalware.org/Diablo_Rain/CoM-Syn_OS-Public-Repo.git
cd CoM-Syn_OS-Public-Repo
```

This is a public HTTPS clone routed through Cloudflare. That path is not independently verified end-to-end from every network, so if the clone is blocked or interrupted, ask in the [Church of Malware](https://churchofmalware.org) for the current mirror endpoint.

## Build

```bash
just iso churchofmalware
```

This runs the same ISO build pipeline the site's other profiles use, targeted at the `churchofmalware` profile.

## What resolves and what doesn't

The forge repo is a single git history, but not everything in it compiles for you:

| Component                                                        | Status for anyone who clones             |
|--------------------------------------------------------------------|-------------------------------------------|
| Kernel, base userspace, GRIMOIRE engine, ALFRED Rust daemon, Bevy plugins | Open. Resolves and builds. |
| Offensive-tier and commercial-tier crates                           | **Maintainer-sealed** with git-crypt. They do not decrypt or compile in your checkout. `cargo build --workspace` fails on them by design. |

The sealed crates are not a member-facing unlock path. The maintainer holds the sole git-crypt key for the forge repo, and decrypting those crates is a maintainer-only step (occasionally extended to a specific, explicitly-chosen co-maintainer, but never a general membership benefit). If you need what's in them, the way in is the **published ISO** the maintainer builds and ships, not your own decrypt.

```bash
# what you get from a clean clone:
just iso churchofmalware
# → builds the open workspace into an image
# → offensive/commercial crates are absent, sealed and unresolved
```

## The published ISO

For the full functional image, sealed crates included, download the ISO the maintainer publishes rather than trying to build it yourself. See [Three ISOs →](/guides/download/).

## `/claim` is a separate thing entirely

Running `/claim` in the Church of Malware Discord issues a **runtime membership token** — a faction loadout, an XP head-start, and member-exclusive GRIMOIRE labs, applied to a booted image (yours or the published ISO). It has nothing to do with source access:

- `/claim` gets you runtime perks on a booted image
- The sealed crates stay sealed regardless of your Discord role or how long you've been a member

Most community members will only ever need `/claim` plus the published ISO. Building from source is for inspecting or extending the open parts of the codebase.

## Why git-crypt

Curtain's build-time boundary (the `xtask` ELF/string scanner and feature audit) enforces what ships in a *built* image. git-crypt enforces a boundary one step earlier, at the *source* level, specifically for the community forge: it lets one public repository host both the fully-open crates and the sealed ones, without the sealed source ever leaving the maintainer's machine. Curtain and git-crypt are complementary, not redundant. See [Curtain Capability Tokens →](/architecture/curtain/) for the runtime/build-time enforcement that applies to every profile, including the maintainer's own sealed builds.

## Related

- **[Three ISOs →](/guides/download/)** — the published-ISO path for the full functional image
- **[FAQ: Is the source open? →](/reference/faq/#is-the-source-open)** — the short version of this page
- **[Curtain Capability Tokens →](/architecture/curtain/)** — the capability ceiling that holds every built image to its tier
- **[Reproducible Builds →](/architecture/forge/)** — how a build can be verified against the published digest
