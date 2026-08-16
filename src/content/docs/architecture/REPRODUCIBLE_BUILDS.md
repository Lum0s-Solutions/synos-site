# Reproducible Builds — Architecture Decision Record

**Scope:** Syn_OS ISO build pipeline  
**Status:** Implemented (v41 Wave 9G, CISO Rec 30)  
**Owner:** Cipher (LumOs dev-security pod)  
**Acceptance criterion:** Two ISOs built from the same git commit on the same oracle
produce byte-identical `sha256sum` output, regardless of wall-clock time between builds.

---

## Why reproducibility matters for Syn_OS

Syn_OS ships a single-oracle build (sanctum). With active-passive oracle (Rec 17)
in progress, reproducibility becomes the verification mechanism: if both oracles
produce the same ISO hash, neither is compromised. Without reproducibility,
hash comparison across oracles is meaningless.

Additionally, SLSA-3-style build provenance (Rec 28) only provides meaningful guarantees when
the artifact being attested is deterministic. A non-reproducible build could produce
a different binary on every run, making provenance chains unfalsifiable.

---

## Why `SOURCE_DATE_EPOCH` and not another approach

Three approaches were considered:

| Approach | Verdict |
|----------|---------|
| **`SOURCE_DATE_EPOCH` (chosen)** | Industry standard. Supported natively by tar, mksquashfs, xorriso, and most build tools. Zero external dependencies. |
| Nix-style content-addressed store | Correct but requires migrating the entire 53-stage build pipeline to Nix. Out of scope for v41. |
| Post-build normalisation (zero out timestamps with `libguestfs`) | Fragile — requires mounting the ISO after build, and misses non-timestamp sources of divergence (sort order, UIDs, etc.). |

`SOURCE_DATE_EPOCH` is the [reproducible-builds.org](https://reproducible-builds.org/specs/source-date-epoch/)
standard. Setting it to `git log -1 --pretty=%ct` ties every build of a given tag
to the same epoch, making the ISO a deterministic function of the source tree.

---

## Why Arch Linux archive snapshot pinning instead of lockfile hash pinning

Pacman does not have a built-in lockfile mechanism equivalent to Cargo.lock or
package-lock.json. The two options are:

1. **Archive snapshot pinning** (chosen): Set the mirrorlist to
   `archive.archlinux.org/repos/<YYYY/MM/DD>` where the date is derived from
   `SOURCE_DATE_EPOCH`. Package versions are frozen at that snapshot. Any build
   of the same commit fetches exactly the same packages.

2. **Hash pinning via a custom repo**: Capture every `.pkg.tar.zst` hash and
   re-serve via a local server. Correct, but requires gigabytes of storage per
   snapshot and a long-running package cache service on sanctum.

Snapshot pinning is simpler, requires no additional infrastructure, and is the
same mechanism used by `docker.io/archlinux` reproducible image builds.

**Limitation:** `archive.archlinux.org` retains snapshots for approximately 3
years. Builds from tags older than 3 years will fall back to live mirrors unless
the archive is manually extended.

---

## Known non-reproducibility sources and mitigations

| Source | Mitigation | Status |
|--------|-----------|--------|
| File timestamps in tar archives | `--mtime=@SOURCE_DATE_EPOCH --clamp-mtime` via `deterministic_tar()` | Done (lib/reproducible-build.sh) |
| `mksquashfs` inode UIDs/GIDs | `-all-root -force-uid 0 -force-gid 0` flags | Done (stage 18a) |
| `mksquashfs` NFS export table | `-no-exports` flag | Done (stage 18a) |
| `mksquashfs` append mode accumulation | `-noappend` flag | Done (stage 18a) |
| `mksquashfs` per-file mtime drift | `-all-time ${SOURCE_DATE_EPOCH}` pins every inode mtime | Done v60.0.2 T4-1 (stage 18a) |
| `mksquashfs` superblock creation time | `-mkfs-time ${SOURCE_DATE_EPOCH}` pins the fs-level timestamp | Done v60.0.2 T4-1 (stage 18a) |
| `mksquashfs` nondeterministic fragment packing | `-no-fragments` disables fragments; each file gets its own block, ordering is deterministic | Done v60.0.2 T4-1 (stage 18a) |
| ISO modification date in xorriso output | `--modification-date=SOURCE_DATE_EPOCH` | Done (stage 19) |
| `mktemp`-derived temp path in embedded data | Replaced with `det_mktemp()` seeded by BUILD_ID | Done (lib/reproducible-build.sh) |
| Pacman package versions (rolling release) | Snapshot URL pinned to `archive.archlinux.org/repos/<date>` | Done (stages 01, 04) |
| `date +%s` in config files (/etc/issue, /etc/os-release) | Use `${SOURCE_DATE_EPOCH}` instead of `$(date +%s)` | Staged — apply via `stamp_file_epoch()` in stage 07 |
| Kernel module build timestamps | `KBUILD_BUILD_TIMESTAMP=$(date -u -d @${SOURCE_DATE_EPOCH})` in stage 02 | Pending (Wave 9H kernel work) |
| initramfs mtime | `mkinitcpio` does not embed wall-clock time; initramfs is reproducible once kernel modules are | Inherited |

---

## How to investigate a reproducibility regression

When `cargo xtask verify-reproducible` exits 1:

### Step 1 — Read the report

```
cat build/reproducibility-report.md
```

The report shows the SHA-256 hashes of both ISOs. If they differ, at least one
non-determinism source was introduced.

### Step 2 — Mount and diff the ISOs

Prefer the v60.0.2 structured-diff tool over manual mount + `diff -rq` —
it walks both squashfs trees, classifies findings (added / removed /
mutated-by-content / new host-leaks), and emits JSON for further
processing:

```bash
fruit/iso/iso-build/scripts/utils/iso-diff.sh \
    build/repro-run-1/iso/Syn_OS-*.iso \
    build/repro-run-2/iso/Syn_OS-*.iso \
    --json /tmp/repro-diff.json
```

`--quick` skips per-file sha256 (paths + size only; faster on large ISOs).
`--paths-only` is the fastest mode. Exit 1 on regression.

Manual mount + diff is still useful for deep inspection:

```bash
mkdir -p /tmp/iso1 /tmp/iso2
sudo mount -o loop build/repro-run-1/iso/Syn_OS-*.iso /tmp/iso1
sudo mount -o loop build/repro-run-2/iso/Syn_OS-*.iso /tmp/iso2

# Find differing files
diff -rq /tmp/iso1 /tmp/iso2 | head -40

# Check squashfs differences
sudo unsquashfs -lc /tmp/iso1/live/x86_64/airootfs.sfs > /tmp/sq1.txt
sudo unsquashfs -lc /tmp/iso2/live/x86_64/airootfs.sfs > /tmp/sq2.txt
diff /tmp/sq1.txt /tmp/sq2.txt
```

### Step 3 — Identify the non-deterministic file

Common culprits:
- A config file with `$(date)` embedded
- A log file written during the build
- A file whose mtime was not pinned with `stamp_file_epoch()`
- A generated UUID or nonce (e.g. in `/etc/machine-id` or `/var/lib/dbus/machine-id`)

### Step 4 — Apply the fix

- Timestamps: use `stamp_file_epoch <file>` in the responsible stage
- UUIDs: truncate to empty or a fixed placeholder; the live system regenerates them at boot
- Sorted inputs: pipe `find` output through `LC_ALL=C sort` before `tar`/`mksquashfs`
- Random seeds: seed from `SOURCE_DATE_EPOCH` instead of `/dev/urandom`

### Step 5 — Verify the fix

Re-run `cargo xtask verify-reproducible` to confirm both ISOs now match.

---

## Environment variables

| Variable | Set by | Purpose |
|----------|--------|---------|
| `SOURCE_DATE_EPOCH` | `build.sh` (from `git log -1 --pretty=%ct`) | Universal timestamp anchor |
| `TZ` | `build.sh` | Forces UTC for all `date` calls |
| `BUILD_ID` | `lib/reproducible-build.sh` | Seed for `det_mktemp()` (short git hash) |
| `BUILD_DIR` | `build.sh` | Root for `det_mktemp()` paths |
| `SYNOS_VERIFY_REPRO_PROFILE` | Operator or CI | Override profile for `verify-reproducible` |

---

*Reference: [reproducible-builds.org](https://reproducible-builds.org/) |
[SOURCE_DATE_EPOCH spec](https://reproducible-builds.org/specs/source-date-epoch/) |
[Arch Linux archive](https://archive.archlinux.org/)*
