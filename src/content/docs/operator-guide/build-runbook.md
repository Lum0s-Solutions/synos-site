---
title: Build Runbook
description: What to do when a Syn_OS ISO build fails — reading the wizard, identifying the failing stage, and replaying it in isolation.
---

This runbook covers what to do when an ISO build fails. It assumes the
[Build Observatory](/operator-guide/build-observatory/) tooling is
available — if you're not using it yet, start there first.

Read from the top; stop when the problem is resolved.

## Step 1 — Read the wizard's "watch for" block

Before touching a terminal, look at the wizard pane if you're running the
dashboard. The **WATCH FOR** section lists failure patterns the stage
author flagged as load-bearing. If one of those patterns appears in the log
pane, you have a categorized failure with a known angle of attack.

```
WATCH FOR:
  check   Post-install hooks complete
  check   Base system created
  fail    CA bundle is suspiciously small
  fail    command terminated by signal 11
  fail    Post-install hook bootstrap failed
```

## Step 2 — Identify the failing stage

The master log records every stage transition with `[STAGE N]` markers —
find the last one before the failure. The stage-specific log under
`growth/development/scripts/iso-build/logs/<NN>-<name>.log` has the full
unfiltered output.

## Step 3 — Check resume state before doing anything else

If the build failed partway through, some stages may already have clean
checkpoints. Don't relaunch the full build without knowing which stages
would replay:

```bash
bash growth/development/scripts/iso-build/observability/synos-resume-inspector.sh
```

If the kernel stage shows `SKIP`, don't clean the build directory before
relaunching — you'd force a multi-hour kernel rebuild for nothing.

## Step 4 — Replay the failing stage in isolation

```bash
bash growth/development/scripts/iso-build/observability/synos-only-stage.sh <stage-name>

# Preserve state from a prior partial run:
bash growth/development/scripts/iso-build/observability/synos-only-stage.sh <stage-name> --resume
```

Use this when you're patching a stage script and want to test the fix in
seconds rather than re-running the whole orchestrator. Some stages assume
the previous stage's artifacts already exist — check the resume inspector
first if you're unsure.

## Step 5 — File an issue

If the failure isn't immediately reproducible from a stage replay, or you
need to hand off to another contributor:

```bash
bash growth/development/scripts/iso-build/observability/synos-fail-issue.sh \
  <stage-name> \
  growth/development/scripts/iso-build/logs/<stage-name>.log \
  <exit-code>
```

This attaches the last 200 log lines, the last-known-good commit, and any
tripped `watch_fail` patterns. Requires the `gh` CLI authenticated with repo
write access (`pacman -S github-cli` if absent).

---

## Stage-Specific Guidance

### Base system creation (pacstrap stage)

The stage that creates the minimal Arch chroot is the most fragile in the
pipeline — every later stage depends on it, so a silent failure here shows
up as confusing errors several stages downstream.

**Primary diagnostic — check the CA bundle size:**

```bash
stat -Lc %s build/base-system/etc/ssl/certs/ca-certificates.crt
```

A bundle over ~50,000 bytes means TLS will work downstream; a bundle at
exactly 49 bytes means the `update-ca-trust` post-install hook didn't run —
the stage failed silently.

**Check the pacman cache hit ratio:**

```bash
bash growth/development/scripts/iso-build/observability/synos-cache-stats.sh \
  growth/development/scripts/iso-build/logs/<stage-name>.log
```

A ratio below 50% on a warm cache means the bind-mounted package cache
isn't actually active.

### Kernel stage

The longest stage in the pipeline. If it hangs or times out, check load
average and available RAM before assuming a kernel configuration bug:

```bash
tail -F growth/development/scripts/iso-build/logs/<kernel-stage>.log \
  | bash growth/development/scripts/iso-build/observability/synos-stage-progress-parser.sh kernel
```

### squashfs stage

The most disk-intensive stage — ensure at least 20 GB free on the repo root
filesystem before it runs:

```bash
df -h ~/Syn_OS
```

```bash
tail -F growth/development/scripts/iso-build/logs/<squashfs-stage>.log \
  | bash growth/development/scripts/iso-build/observability/synos-stage-progress-parser.sh squashfs
```

---

## Timing Regressions

```bash
# Full leaderboard (median / p95 / max per stage)
bash growth/development/scripts/iso-build/observability/synos-stage-leaderboard.sh

# Only stages running significantly above their historical mean
bash growth/development/scripts/iso-build/observability/synos-stage-leaderboard.sh --regression
```

Meaningful only after 3+ builds on the same machine.

## Baseline Drift

```bash
bash growth/development/scripts/iso-build/observability/synos-success-diagnostic.sh \
  diff <stage-name>
```

Stages that declare diagnostic probes run this automatically on success, so
future failures can diff against known-good values.

## Integrity and Chain of Custody

For a release-candidate build, verify the attestation chain:

```bash
bash growth/development/scripts/iso-build/observability/synos-stage-attest.sh chain
```

This prints every signed stage checkpoint. A gap means either the stage ran
without a signing key set, or the checkpoint was tampered with after
signing. The attest script no-ops gracefully if signing isn't configured —
safe for a regular developer build.

---

## Quick Reference

| Situation | Command |
|---|---|
| Build failed — what stage? | `tail growth/output/iso-build-logs/master-generation-*.log` |
| Resume safe? Which stages re-run? | `bash observability/synos-resume-inspector.sh` |
| Replay a single stage | `bash observability/synos-only-stage.sh <stage>` |
| File a GitHub issue | `bash observability/synos-fail-issue.sh <stage> <log> <exit>` |
| Pacman cache hit ratio | `bash observability/synos-cache-stats.sh logs/<stage>.log` |
| Kernel build progress | `tail -F logs/<kernel-stage>.log \| bash observability/synos-stage-progress-parser.sh kernel` |
| Timing regressions | `bash observability/synos-stage-leaderboard.sh --regression` |
| Attestation chain | `bash observability/synos-stage-attest.sh chain` |

All `observability/` paths are relative to
`growth/development/scripts/iso-build/`.

## Related

- [Build Observatory →](/operator-guide/build-observatory/)
- [ISO Build — How It Works →](/operator-guide/iso-build-deep-dive/)
