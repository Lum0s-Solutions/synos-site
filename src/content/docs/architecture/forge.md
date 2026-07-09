---
title: Reproducible Builds (Forge)
description: Forge (v48) — bit-for-bit reproducible Syn_OS builds. Cosign + Sigstore Rekor attestation, deterministic squashfs, cross-oracle verify, SLSA-3 provenance, FedRAMP / CMMC / SOC2 control maps.
---

**Forge** is the supply-chain hardening release of Syn_OS. The v48 codename. Its job: make it possible for someone who does not trust the build infrastructure to **independently verify** that a Syn_OS ISO is the exact image it claims to be — and to chain that verification into FedRAMP Moderate, CMMC L2, and SOC2 evidence.

## Reproducibility

Forge guarantees **bit-for-bit reproducibility** when an ISO is rebuilt on a different oracle node. This is achieved via:

| Technique | What it fixes |
|-----------|---------------|
| **`SOURCE_DATE_EPOCH` propagation** | All file timestamps in the ISO derive from a single epoch value tracked in `VERSION.epoch` — no host-clock dependency |
| **Deterministic `mktemp`** | All build temp dirs derive their name from a hash of the build inputs, not from the system random |
| **Sorted `tar` and `mksquashfs`** | File ordering inside archives is alphabetical, not filesystem-walk-order |
| **Pacman snapshot pin** | The Arch repository state is pinned to a fixed snapshot (Rec 30); pacman only sees that snapshot for the build |
| **Locale archive verification** | The `glibc` locale archive is rebuilt deterministically (v43.2 fix) |
| **Squashfs canonicalisation** | mksquashfs invoked with `-no-fragments -reproducible -force-uid 0 -force-gid 0` |

The result: two oracle nodes, building from the same commit, produce ISOs whose SHA-256 digests are identical.

## Cross-oracle verifier

```bash
# on a second oracle:
synos-rebuild-verify.sh \
    --release v111.0.0 \
    --commit 8fee198a \
    --reference https://releases.synos-linux.pro/v111.0.0/synos-goodlife-v111.0.0.iso.sha256

# →   PASS — local digest matches reference
#     Sigstore Rekor entry verified
#     SLSA-3 provenance verified
```

The `synos-rebuild-verify.sh` script in `growth/development/scripts/iso-build/` is the canonical cross-oracle verification entry point.

## Cosign + Sigstore Rekor

Every release artefact is signed with **cosign** and the signature is published to the **Sigstore Rekor** transparency log. Verification:

```bash
cosign verify-blob \
    --certificate synos-goodlife-v111.0.0.iso.cert \
    --signature  synos-goodlife-v111.0.0.iso.sig \
    --certificate-identity-regexp '.*@lumossolutions\.io$' \
    --certificate-oidc-issuer https://github.com/login/oauth \
    synos-goodlife-v111.0.0.iso

rekor-cli search --artifact synos-goodlife-v111.0.0.iso
```

Public Rekor index entries make every release independently verifiable forever, even if Lumos goes dark — the transparency log is operated by Sigstore, not by Lumos.

## SLSA-3 provenance

Forge wires `slsa-github-generator` into `release-publish.yml`, producing SLSA-3 build provenance for every release. Provenance attests:

- The exact source commit
- The build environment (runner image hash)
- The build steps (`.github/workflows/release-publish.yml`)
- The output artefact digests

The provenance is signed by Sigstore and stored alongside the release. SLSA-4 (two-witness) is deferred until the second build oracle is provisioned via the Stoneglass Ansible (queued behind second-oracle provisioning).

## SBOM + dependency drift

Every release ships a **CycloneDX SBOM** generated from the Cargo workspace + the Arch package set + the kernel module manifest. The build pipeline includes an SBOM drift detector (`growth/development/scripts/monitoring/sbom-diff.sh`) that flags newly-introduced transitive dependencies between releases.

The dependency advisory register lives at `docs/security/SECURITY_ADVISORIES.md`. Open advisories are triaged on a 7-day cadence.

## Compliance posture

Forge underpins the compliance evidence shipped in v47 (Beachhead) + v59 (Doublecross):

- **CMMC L2** — control map at `fruit/distribution/legal/CMMC_L2_CONTROL_MAP.md`
- **SOC2** — exporters generate Type 2 evidence packs from `synos-attest-ledger`
- **FedRAMP Moderate** — NIST SP 800-53 Rev 5 control map at `fruit/distribution/legal/FEDRAMP_MODERATE_CONTROL_MAP.md`, daily ConMon collector at `growth/development/scripts/monitoring/fedramp-monitor.sh`

Each control points to the technical mechanism that satisfies it (e.g. SI-7 *Software, Firmware, and Information Integrity* points to the Forge cosign + SLSA-3 chain).

## Module signing

Kernel modules are signed via cosign-attested keys (v41 Wave 9), applied during the sealed module-signing build stage. Signing material stays on the build oracle and is never included in the released image.

The signing chain is:

1. Cosign-attested release key (federation root)
2. → Module signing intermediate (rotated per release)
3. → Per-module signature
4. → MOK shim chain on SecureBoot-enabled installs (v41 Wave 9)

## Reproducible kernel

The Linux kernel build itself is reproducible:

- LLVM/Clang (no GCC) — fewer non-determinism sources
- `KBUILD_BUILD_TIMESTAMP=$SOURCE_DATE_EPOCH`
- `KBUILD_BUILD_HOST` and `KBUILD_BUILD_USER` pinned to known values
- `vmlinuz` is installed both into stage 04 and validated by stage 07a (accepts `mkinitcpio` exit-1 if the initramfs is real)

## What Forge enables

- A federal customer can hand the released ISO + Rekor entry + provenance + SBOM to their ATO process
- A security researcher can independently rebuild and verify any release on their own hardware
- A supply-chain attack on the oracle is detectable: an ISO whose Rekor signature is missing, or whose digest doesn't match cross-oracle rebuild, is by definition not a real release
- A regulated buyer can pull SOC2 / CMMC / FedRAMP evidence directly from `synos-attest-ledger` without trusting Lumos's attestation

## Related

- **[Curtain →](/architecture/curtain/)** — capability tokens issued under the same key chain
- **[Icarus →](/architecture/icarus/)** — SLH-DSA on long-lived release signatures
- **[Custom Kernel →](/architecture/kernel/)** — module signing chain
- **[ARCANUM Mesh →](/architecture/arcanum/)** — federation gossip is signed under the same root
