---
tags: [general]
title: ISO Profiles
description: ISO Profiles
---
tags: [general]

# ISO Profiles

**Version**: v111.0.0 "Last Light"
**Profile configs**: `fruit/iso/profiles/master.toml`, `grimoire.toml`, `goodlife.toml`
**Build stages**: 51 total — profile-aware stages are 03, 11, 12, 17a, 20

---
tags: [general]

## Rationale

Syn_OS ships three ISO images from a single source tree. The split
exists because the audiences and constraints are genuinely different:

- **Master** is a private, god-mode development build. It carries
  every capability the project can produce — offensive tooling without
  restriction, the full C2 framework, the ARCANUM hive platform,
  fleet management, and the proprietary Fragment Field IDS. Master is
  not distributed publicly. It is the build the core team runs on
  their own machines and the surface used for red-team exercises
  against their own infrastructure.

- **GRIMOIRE Public** is the education ISO. It exists to ship the
  100-lab GRIMOIRE platform to students and community contributors
  under a mixed Apache 2.0 + `LicenseRef-GRIMOIRE-Public` license
  model. It retains the full game experience — cutscenes, faction
  HQs, skill tree — and the same lab set as master, but it gates
  dangerous tools behind the skill-level progression system and
  excludes the proprietary research crates entirely.

- **GoodLife** is the AI research platform. It targets researchers
  working on machine-learning pipelines, NLP tooling, and
  consciousness-adjacent experimental work. It ships Jupyter with a
  curated ten-package research stack and enables ALFRED's
  `research-mode` cargo feature, which unlocks extended analysis
  paths that are disabled in other profiles. It uses LUKS
  partitioning for encrypted research data and shares the same
  public-safe tool restrictions as grimoire.

A single source tree producing three ISOs forces the project to think
carefully about profile boundaries — what is shared, what is gated,
what is excluded entirely. The mechanism is a set of profile TOML files
plus profile-aware build stages that read them.

This page documents how profiles are defined, how each build stage
consumes them, and what you need to do to add a new profile. For the
Grimoire Curtain scanner that enforces the public/private boundary at
build time, see [The Grimoire Curtain](#the-grimoire-curtain) below.

---
tags: [general]

## Profile configuration

All three profile definitions live in `fruit/iso/profiles/` as TOML
files with a consistent shape:

```toml
[profile]
name = "grimoire"
display_name = "GRIMOIRE Public"
description = "Education-focused Syn_OS release"
version = "34.0.2"
license = "Apache-2.0 AND LicenseRef-GRIMOIRE-Public"

[features]
god_mode = false
c2_framework = false
arcanum_platform = false
fleet_management = false
dead_mans_switch = false
offensive_tools_unrestricted = false
skillgate_enabled = true
total_labs = 100

[grimoire]
curtain_profile = "grimoire"
alfred_cargo_features = ""
research_mode = false

[crate_exclusions]
excluded_crates = [
  "synos-fragment-field",
  "synos-tenant",
  "synos-audit-trail",
]
```

The exact keys and shape vary by profile — master has no
`[crate_exclusions]`, goodlife has an additional `[jupyter]` table,
and so on — but the top-level sections are consistent so the build
stages can parse them generically.

### Master profile

```toml
[profile]
name = "master"
display_name = "Syn_OS Master"
license = "LicenseRef-Proprietary"

[features]
god_mode = true
c2_framework = true
arcanum_platform = true
fleet_management = true
dead_mans_switch = true
offensive_tools_unrestricted = true
skillgate_enabled = false
total_labs = 100

[grimoire]
curtain_profile = "master"
alfred_cargo_features = ""
```

Master is permissive by default: no feature gating, no skillgate,
no crate exclusions, everything unlocked. The
`curtain_profile = "master"` setting tells the curtain scanner to
skip its forbidden-symbol checks entirely, because on master those
symbols are expected to be present.

### GRIMOIRE Public profile

```toml
[profile]
name = "grimoire"
display_name = "GRIMOIRE Public"
license = "Apache-2.0 AND LicenseRef-GRIMOIRE-Public"

[features]
god_mode = false
c2_framework = false
arcanum_platform = false
fleet_management = false
skillgate_enabled = true
total_labs = 100

[grimoire]
curtain_profile = "grimoire"
alfred_cargo_features = ""
research_mode = false

[crate_exclusions]
excluded_crates = [
  "synos-fragment-field",
  "synos-tenant",
  "synos-audit-trail",
]
```

The `skillgate_enabled = true` flag puts a progression gate in front of
Metasploit, Burp Suite, sqlmap, and the rest of the aggressive toolchain.
Students unlock the tools by completing labs that teach their safe use —
the gate is not a DRM scheme, just a guardrail to prevent a curious
new user from running `hashcat -m 0 -a 0 rockyou.txt` against a random
target on day one.

### GoodLife profile

```toml
[profile]
name = "goodlife"
display_name = "Syn_OS GoodLife"
license = "Apache-2.0"

[features]
god_mode = false
c2_framework = false
arcanum_platform = false
fleet_management = false
skillgate_enabled = true
total_labs = 100
research_tools = true
nlp_pipeline = true

[grimoire]
curtain_profile = "goodlife"
alfred_cargo_features = "research-mode"
research_mode = true

[crate_exclusions]
excluded_crates = [
  "synos-fragment-field",
  "synos-tenant",
  "synos-audit-trail",
]

[jupyter]
packages = [
  "jupyterlab",
  "numpy",
  "scipy",
  "scikit-learn",
  "pandas",
  "matplotlib",
  "seaborn",
  "transformers",
  "spacy",
  "nltk",
]
```

Two things differ from grimoire: ALFRED is built with the
`research-mode` cargo feature, which enables its extended analysis
backends, and a `[jupyter]` section drives stage 12 to provision a
JupyterLab environment with the ten packages listed.

The `crate_exclusions` list was harmonized with grimoire in
v34.0.2 (Gap #14 in the pre-build audit). Prior to that, goodlife
did not exclude `synos-fragment-field`, which meant a goodlife ISO
could theoretically ship the proprietary research crate — a defence
against that is the curtain rescan in stage 20, but the
configuration-level fix is more robust.

GoodLife also uses LUKS research partitioning for data at rest. The
partitioning scheme is defined in
`fruit/distribution/installer/profiles/goodlife-partitioning.yaml`
and creates an encrypted `/var/research` partition with a
user-chosen passphrase during installation.

---
tags: [general]

## The Grimoire Curtain

The Grimoire Curtain is the mechanism that enforces the
public/private boundary at build time. It has two parts:

1. **Binary symbol scanner** — walks every ELF executable in the
   staging rootfs, pulls out its dynamic and static symbol tables,
   and checks for any symbol on the profile's forbidden list.
2. **Source pattern scanner** — scans source files that ship in
   `/usr/share/synos/src/` (on profiles that include them) for any
   string on the profile's forbidden source pattern list.

Both scanners are driven by a `CurtainProfile` enum with three
variants:

```rust
pub enum CurtainProfile {
    Master,     // Skips all checks
    Grimoire,   // Education-focused forbidden list
    GoodLife,   // Stricter research-focused forbidden list
}
```

The `GoodLife` variant carries the strictest list:

- **24 forbidden tool names**: `metasploit`, `msfconsole`, `msfvenom`,
  `sqlmap`, `hydra`, `hashcat`, `john`, `mimikatz`, `bloodhound`,
  `responder`, `empire`, `cobaltstrike`, `beef`, `setoolkit`,
  `veil`, `shellter`, `powersploit`, `nishang`, `evil-winrm`,
  `chisel`, `gost`, `rustscan`, `nuclei`, `subfinder`.
- **23 forbidden source patterns**: substring matches against the
  same tool names plus common configuration markers
  (`rshell_payload`, `windows/x64/meterpreter`, and so on).

Grimoire's forbidden list is narrower — it allows most of the red-team
toolkit to ship, but puts the most aggressive items behind the
skillgate rather than excluding them outright. Master's list is
empty (the curtain is skipped).

### Curtain v3 — ED25519 token verification

Curtain v3 adds cryptographic signature verification for embedded
capability tokens (`growth/xtask/src/curtain_v3.rs`). When the
environment variable `SYNOS_CURTAIN_PUBKEY_HEX` is set (64 hex chars,
a raw 32-byte Ed25519 verifying key), every scanned binary whose
embedded `EmbeddedToken` carries a `signature` field is verified
against that key.

The signed message is the token JSON with the `"signature"` key
removed, re-serialized with BTreeMap-ordered keys (deterministic).
A valid signature produces a `PASS` verdict; an invalid signature
produces a `FAIL` regardless of the symbol scan result. When the env
var is absent, signature verification is skipped and the existing
structural scan applies.

To generate a keypair and activate verification:

```bash
# generate (store private key securely — never commit it)
openssl genpkey -algorithm ed25519 -out curtain_signing.key
openssl pkey -in curtain_signing.key -pubout -outform DER | xxd -p -c 0 | tail -c 64 | tr -d '\n'
# → paste the 64-char hex as SYNOS_CURTAIN_PUBKEY_HEX
export SYNOS_CURTAIN_PUBKEY_HEX=<64-hex-chars>
cargo xtask curtain-check --profile grimoire --strict
```

### `profile-grimoire` Cargo feature (synos-social)

`synos-social` uses Cargo feature flags to gate publish capability at
compile time. The three variants:

| Feature | Enabled capabilities |
|---|---|
| `profile-master` | Full publish (Telegram-admin, Discord-bot, Instagram) |
| `profile-grimoire` | `analytics-readonly` only — no publish |
| `profile-goodlife` | `analytics-readonly` only — no publish |

Stage 03 passes `--features profile-grimoire` (or the appropriate
variant) when building `synos-social` for a non-master profile. This
means a grimoire ISO binary cannot publish — the publish code path is
not compiled in.

The curtain runs twice per build:

- **Stage 03** — excludes the forbidden crates from the cargo build
  entirely by passing `--exclude` for each entry in
  `[crate_exclusions].excluded_crates`. This is the primary defence
  and the one that actually prevents proprietary code from reaching
  a public ISO.
- **Stage 20 (postflight)** — re-runs the curtain scanner against
  the assembled rootfs as a defence in depth. v34.0.2 fixed the
  path binding in this stage (Gap #19) — the previous
  implementation was scanning a stale directory from an earlier
  build, which masked any violations introduced in the interim.

The curtain is also runnable manually:

```bash
cargo xtask curtain-check --profile grimoire --strict
```

`--strict` causes any violation to return a non-zero exit code
rather than a warning, which is the mode the build pipeline uses.

---
tags: [general]

## Profile-specific build stages

The 51-stage ISO build pipeline treats most stages as profile-agnostic
— they do the same thing regardless of which profile is being built.
A few stages read the profile TOML and branch:

### Stage 03 — install-rust-toolkits.sh

Reads `[crate_exclusions].excluded_crates` from the profile TOML and
passes one `--exclude` flag per entry to `cargo build --workspace`.
This is the single load-bearing mechanism that keeps proprietary crates
out of public ISOs. If the TOML parse fails, the stage aborts with a
hard error rather than silently defaulting to "exclude nothing".

The stage also reads `critical_binaries` from its own manifest
(distinct from the profile TOML) — a list of Rust binaries that must
be present in the final staging rootfs. A missing critical binary is
a build failure, which catches the case where an exclusion
accidentally drops a binary the profile still needs.

### Stage 11 — install-alfred.sh

Reads `[grimoire].alfred_cargo_features` and passes it as a
`--features` flag to the ALFRED daemon's cargo build. Only goodlife
currently sets this to a non-empty value (`research-mode`); master
and grimoire leave it empty.

The `research-mode` feature unlocks ALFRED's extended analysis
backends — the ones that do offline model exploration and paper
ingestion — which are not useful on a master or grimoire profile
and would only bloat the binary.

### Stage 12 — install-ai-models.sh

Reads the profile TOML's `[ai_models]` section to determine which
models to download and pre-warm. On goodlife, ollama is a
ship-critical dependency — the stage hard-fails if ollama cannot
pull the configured model set. On master and grimoire, ollama is
a soft dependency — the stage logs a warning and continues if the
pull fails, so a transient network issue does not break the build.

The different failure modes reflect the different expectations:
goodlife users expect to be able to run the full research stack on
first boot, while master and grimoire users have other AI paths
available.

### Stage 17a — blank-slate.sh

Strips master-only binaries from the staging rootfs when building
non-master profiles. This is a belt-and-braces stage that runs after
the main install steps — even if a master-only binary somehow ended
up in the rootfs despite the stage 03 exclusions, this stage would
catch it.

The list of master-only binaries is kept in the stage's own config
rather than in the profile TOML, because it describes the thing
being stripped rather than the profile doing the stripping.

### Stage 20 — postflight.sh

Runs the curtain re-check on non-master profiles as a defence in
depth. Also performs the final filesystem integrity checks, the
SBOM generation pass, and the ISO signing step. This is the last
stage that touches the rootfs before `mkarchiso` produces the
final image.

The v34.0.2 fix mentioned earlier — the path binding correction
(Gap #19) — was specifically in this stage. The scanner was being
pointed at a path that no longer existed in the current
build's working directory, silently passing because there was
nothing to scan. The fix binds the scan path to the actual
staging rootfs at the moment of the scan.

---
tags: [general]

## Build commands

The justfile wraps the three profile builds:

```bash
just iso master      # Build the master profile (private, god-mode)
just iso grimoire    # Build the GRIMOIRE Public profile
just iso goodlife    # Build the GoodLife research profile
```

Each command resolves to the same `build.sh` orchestrator with a
different `--profile` flag, which in turn selects the matching
TOML file in `fruit/iso/profiles/`. The orchestrator runs the 34
stages in order and emits status lines to
`/tmp/synos-build-logs/<profile>-<date>.log`.

A lower-level cargo-only build path is available for local
iteration:

```bash
just build-profile master     # cargo check --workspace minus excludes
just build-profile grimoire
just build-profile goodlife
```

These commands do not run the full ISO pipeline — they only do a
`cargo check` with the profile's exclusion list applied. Use them
when iterating on a crate to verify it still builds under a given
profile without waiting for the full ISO build.

The ISO output names follow a consistent pattern:

```
Syn_OS-v34.0.2-master-20260415-x86_64.iso
Syn_OS-v34.0.2-grimoire-20260415-x86_64.iso
Syn_OS-v34.0.2-goodlife-20260415-x86_64.iso
```

The date is the build date in `YYYYMMDD` format, and the
architecture is always `x86_64`.

---
tags: [general]

## Validating a profile

Two verification commands are available:

```bash
just verify-profiles
```

This runs `cargo xtask curtain-check` against each of the three
profiles in sequence and reports any violations. It is the quickest
way to check "is my current working tree consistent with all three
profile definitions" without actually building any ISOs.

```bash
cargo xtask curtain-check --profile grimoire --strict
```

This runs the curtain scanner against a single profile with
strict exit codes. It is what the CI pipeline runs on every pull
request. On a clean tree the output is a single line per profile
confirming zero violations.

Neither command builds an ISO — they only check that the source
tree would produce a clean ISO if it were built. This matters for
CI speed: running the full 51-stage build on every PR is not
practical on the build oracle's hardware (an Intel i5-3337U with
2 cores and 11 GiB of RAM), so the curtain check is the pre-build
gate instead.

---
tags: [general]

## Adding a new profile

Adding a profile is a four-step process. It is not cheap —
expect to touch stage 03 at minimum, and possibly stages 11, 12,
17a, and 20 depending on what the new profile needs.

1. **Create the TOML** — copy the closest existing profile TOML to
   a new file in `fruit/iso/profiles/<new_name>.toml` and edit the
   `[profile]` and `[features]` sections. Decide what the profile's
   `curtain_profile` should be: an existing variant, or a new one.

2. **Add the CurtainProfile variant** — if the new profile needs
   its own forbidden list (distinct from master, grimoire, and
   goodlife), add a new variant to
   `fruit/crates/synos-gamification/src/grimoire/curtain.rs` and
   update the pattern matches accordingly. If the new profile can
   reuse an existing curtain variant, skip this step.

3. **Update stage 03 exclusion logic** — if the new profile is a
   public profile, review whether any additional crates need to be
   excluded beyond the default list. The most common reason to add
   an exclusion is that a crate contains proprietary logic that the
   new profile should not distribute.

4. **Update stage-12/17a/20 as needed** — if the new profile
   needs AI models (stage 12), a custom binary strip (stage 17a),
   or a custom postflight check (stage 20), update those stages to
   recognize the new profile name. The stages currently branch on
   a string match against the profile name rather than a trait
   implementation, so the changes are minor.

5. **Add the profile to the justfile** — add a new recipe target
   so `just iso <new_name>` works, and add it to the
   `just verify-profiles` list so CI covers it.

Finally, run `just verify-profiles` and a full
`just iso <new_name>` build to validate. The first ISO build of a
new profile is typically where latent issues surface — TOML keys
that are silently ignored, stages that defaulted to master
behaviour, and so on.

---
tags: [general]

## Related reading

- [`ota-updates.md`](./ota-updates.md) — how patches are scoped
  to profiles via `OtaPatch::target_profile`
- [`fragment-field-ids.md`](./fragment-field-ids.md) — the
  proprietary crate excluded from grimoire and goodlife
- [`bevy-engine.md`](./bevy-engine.md) — the game engine whose
  plugins are feature-gated per profile
