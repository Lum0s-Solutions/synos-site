---
title: Build from Source
description: Clone the Church of Malware forge and build the real churchofmalware image yourself. No keys, no unlock step — plaintext source, and one guarantee it will never produce a master image.
---

The source is open now, at the **Church of Malware** forge — a public mirror of the Syn_OS codebase, published as plaintext. Clone it, build it, it's yours: no keys, no unlock step, no waiting on a maintainer to hand you something.

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

That's the whole build key requirement: none. This runs the same ISO pipeline the maintainer's own builds use, and produces the real, fully-functional `churchofmalware` image — the education/offensive-training profile, not a stub or a teaser. The same forge also builds the `grimoire` and `goodlife` profiles (`just iso grimoire`, `just iso goodlife`); it's one open tree with three buildable profiles.

## What's in the tree, and what isn't

| Component | Status on this forge |
|-----------|------------------------|
| Kernel, base userspace, GRIMOIRE engine, ALFRED Rust daemon, Curtain capability tokens, `synos_rootkit`, `synos-specter`, the anonymity-tooling shelf, tier gating, build-attest | Open, plaintext, buildable. This is the real churchofmalware image, not a redacted one. |
| Fleet-C2 controller (`godmode.rs`), fleet OTA push (`synos-ota`), key escrow + MSSP tenant crypto (`synos-sovereign-keyring`), the `master` ISO profile itself | **Absent from this tree.** Not encrypted, not gated behind a key — the source files simply aren't here. They live only in the private canonical repo. |

## No master image, by design

This forge cannot produce a master (internal) image, and that's deliberate — not a limitation anyone needs to work around. Three independent layers guarantee it:

1. **The master profile doesn't exist here.** `fruit/iso/profiles/master.toml` and its package lists aren't in this tree, so `build.sh --profile master` hard-aborts at profile validation before any build work runs.
2. **The crates it depends on aren't here either.** The fleet-C2 controller, fleet-OTA push, and key-escrow/tenant-crypto modules are absent from the forge, so even a hand-rolled `master.toml` wouldn't compile against this source.
3. **The public profile already disables the capability.** `churchofmalware.toml` ships `god_mode = false` and `fleet_management = false` regardless.

The community can build the full churchofmalware/grimoire/goodlife education and offensive-training images — and cannot accidentally, or deliberately, walk out with internal fleet-command tooling.

## Keeping an installed system updated

CoM ships `synos-update`, a pacman/AUR-based host updater with supply-chain gates (signature verification, changelog diffing) for keeping an installed system current. There's no fleet-OTA in the community image — that push mechanism is master-only, per the exclusion above. `synos-update` is the member update path, full stop.

## `/claim` is a separate thing entirely

Running `/claim` in the Church of Malware Discord DMs a signed **runtime membership token** — a faction loadout, an XP head-start, and member-exclusive GRIMOIRE labs, applied to a booted image. It has nothing to do with building:

- `/claim` gets you runtime perks on a booted image.
- It is not a build key, and it's not required to build the ISO — anyone can clone and build with zero Discord interaction.

## Related

- **[Three ISOs →](/guides/download/)** — the ISO family this profile belongs to
- **[FAQ: Is the source open? →](/reference/faq/#is-the-source-open)** — the short version of this page
- **[Curtain Capability Tokens →](/architecture/curtain/)** — the runtime capability ceiling that still applies inside every built image
- **[Reproducible Builds →](/architecture/forge/)** — how a build can be verified against the published digest
