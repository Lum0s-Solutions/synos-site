# synos-ota — Standalone A/B Update Client

**Binary:** `synos-ota` | **Crate:** `fruit/crates/synos-ota/` | **Track:** v62 "Hollow Point" Track K

The standalone updater a single Syn_OS install uses to update **itself**. Unlike the
hive-coordinated, patch-level system in [`synos-hive-controller`](ota-updates.md), this swaps whole
**rootfs images** between two **A/B slots**, verifies the new image boots *before* committing, and
rolls back automatically on failure. It needs no Kubernetes and no hive — just an update server and
the trusted signing keys baked into the image.

> **Not conflated with the hive OTA.** Hive OTA = many mesh nodes pull *patches* from a master.
> synos-ota = one machine updates *itself* with a whole signed *image*. This doc is the latter.

## Lifecycle
```
check ──▶ download ──▶ verify ──▶ apply(inactive slot) ──▶ reboot ──▶ confirm | rollback
```
- **check** — HTTPS GET the manifest; `204` = up to date, `200` = a signed `BundleManifest`.
- **download** — stream the payload atomically, then verify.
- **verify** — hash + **hybrid signature** + payload hash (fail-closed; see *Verification*).
- **apply** — write the image to the **inactive** A/B slot, flip the GRUB slot marker.
- **confirm / rollback** — the new slot boots on a probation counter; a successful boot confirms it,
  a boot failure (watchdog) rolls back to the previous slot. QEMU-verify can gate the commit first.

The `nightly --auto` subcommand runs the whole chain unattended (the systemd timer's target).

## Security

### Transport (`transport.rs`, `HttpTransport`)
Production HTTPS, defense-in-depth (not the trust anchor):
- **TLS-enforced** (rustls; refuses non-`https://` in production; TLS 1.2+; no silent redirects).
- **Bearer auth** from `$SYNOS_OTA_TOKEN`.
- **Bounded** connect/read timeouts + hard size caps (1 MiB manifest, 8 GiB payload) so a hostile
  server can't hang the client or fill the disk.
- **Atomic download** (`.part` → fsync → rename).

### Verification (`bundle.rs`, `BundleVerifier`) — the trust anchor
The client holds **only public keys** — never a signing key — and verifies **fail-closed**:
1. `manifest_sha256` covers the unsigned manifest form.
2. **BOTH** the ed25519 **and** the ML-DSA-65 (post-quantum) signatures validate against the trusted
   roster keys (`verify_with_roster`). Either missing/invalid → reject.
3. If a payload is present, its SHA-256 matches the manifest (constant-time compare).

Keys are loaded by `from_trusted_store()` from the baked env (`SYNOS_OTA_ED25519_PUB` /
`SYNOS_OTA_MLDSA65_PUB`) or `/etc/synos/ota/trusted-*.hex`. **No keys → no apply** (and the nightly
timer stays disabled), so an un-provisioned image can never auto-apply anything.

### Profile gate
`apply_image` rejects a bundle whose `target_profile` doesn't match the node's own profile — a
**master** image (which may carry offensive components) cannot be applied to a grimoire/goodlife node
even via a fully compromised transport.

## The signing ceremony
The private signing key is generated once, offline, and never ships. See the
**[ceremony runbook](../../../fruit/core/config/ota/README.md)** for the full procedure; in brief:

| Step | Command / action |
|---|---|
| 1. Keygen (offline) | `synos-ota keygen --out ./ota-keys --signer-id synos-ota-signer-<date>` |
| 2. Bake pubkeys | commit `ota-keys/trusted-*.hex` → `fruit/core/config/ota/`; stage 11c installs them to `/etc/synos/ota/` |
| 3. Sign a bundle | load the keyring (`BundleSignerDev::from_keyring`), sign the manifest |
| 4. Serve | any HTTPS host: `GET /api/v1/update` + `GET /bundles/<v>/image.zst` |

The secret keyring (`ota-signing.keyring`, 0600) stays offline / in the release HSM; a `.gitignore`
in `fruit/core/config/ota/` blocks it from ever being committed.

## CLI
| Command | Purpose |
|---|---|
| `check` | query the server; print current / update-available |
| `download` | check + fetch + verify (no apply) |
| `apply` | check → download → apply to the inactive slot |
| `nightly --auto` | the unattended timer path (full chain) |
| `rollback` | force rollback to the previous slot |
| `status` | OTA state + A/B slot info + boot-attempt counter |
| `keygen` | **ceremony only** — generate a signing keypair + bakeable pubkeys |

Config: `--server-url`/`$SYNOS_OTA_SERVER` (HTTPS in production), `--insecure` (dev only, permits
http://), `--state-dir`/`$SYNOS_OTA_STATE_DIR`.

## Build integration
- **stage 11c** (`11c-ota-update-units.sh`) installs the client binary + the (disabled) nightly
  units + bakes `/etc/synos/ota/trusted-*.hex`.
- Nightly OTA stays **disabled by default** — enabled per fleet once a server + keys exist
  (`systemctl enable --now synos-ota-nightly.timer`).

## Key files
- `fruit/crates/synos-ota/src/{transport,bundle,client,slot,delta,watchdog,qemu_verify}.rs`
- `fruit/crates/synos-alpm-pq-signer/` — the hybrid ed25519 + ML-DSA-65 primitives + roster verify
- `fruit/core/config/ota/README.md` — the signing-ceremony + mirror runbook
- `fruit/iso/iso-build/scripts/stages/11c-ota-update-units.sh` — install + pubkey bake
