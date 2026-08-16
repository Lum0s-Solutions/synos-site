---
tags: [general]
title: Build Runbook
description: Build Runbook
---
tags: [general]

# Build Runbook

This runbook covers what to do when an ISO build fails. It assumes the
[Build Observatory](build-observatory.md) is running — if it is not, start there
first.

The runbook is ordered by severity. Read from the top; stop when the problem is
resolved.

---
tags: [general]

## Step 1 — Read the wizard `watch_fail` block

Before touching a terminal, look at the wizard pane. The `WATCH FOR` section
lists the failure patterns that the stage author identified as load-bearing. If
one of those patterns appears in the log pane, you have a categorized failure
with a known mitigation path.

```
WATCH FOR:
  ✓ Post-install hooks complete via nspawn
  ✓ Base system created
  ✗ CA bundle is suspiciously small     ← if this lit up, see Incident #001
  ✗ command terminated by signal 11
  ✗ Post-install hook bootstrap failed
```

If the wizard does not have a file for the failed stage (the pane shows
`no wizard content for stage XX`), that is a documentation gap — author one
before closing the incident. See the
[wizard format reference](build-observatory.md#wizard-markdown-format).

---
tags: [general]

## Step 2 — Identify the failing stage

The master log at `growth/output/iso-build-logs/master-generation-*.log`
records every stage transition with `[STAGE N]` markers. Find the last
`[STAGE` entry before the failure.

The stage-specific log at
`fruit/iso/iso-build/scripts/logs/<NN>-<name>.log`
contains full unfiltered output.

Color-pipe either log for faster reading:

```bash
tail -200 fruit/iso/iso-build/scripts/logs/04-arch-base.log \
  | bash fruit/iso/iso-build/scripts/observability/synos-log-color
```

---
tags: [general]

## Step 3 — Check resume state before doing anything else

If the build failed partway through, some stages may have clean checkpoints. Do
not relaunch the full build without knowing which stages would replay.

```bash
bash fruit/iso/iso-build/scripts/observability/synos-resume-inspector.sh
```

Sample output:

```
┌─ Resume Inspector — Syn_OS v60 ─────────────────────────────────────────┐
│ What would happen if I run master-generation-run-kit.sh right now?       │
├──────┬────────────────────────────────────────┬─────────┬──────────────┤
│ #    │ Stage                                  │ Action  │ Reason       │
├──────┼────────────────────────────────────────┼─────────┼──────────────┤
│ 01   │ 01-preflight                           │ SKIP    │ checkpoint   │
│ 02   │ 02-kernel                              │ SKIP    │ checkpoint   │
│ 03   │ 03-bootloader                          │ SKIP    │ checkpoint   │
│ 04   │ 04-arch-base                           │ RE-RUN  │ no artifact  │
...
```

If stage 02 (kernel build, ~90 min) shows SKIP, do not clean the build
directory before relaunching.

---
tags: [general]

## Step 4 — Replay the failing stage in isolation

Once you have identified the failing stage, replay it without the orchestrator
overhead:

```bash
bash fruit/iso/iso-build/scripts/observability/synos-only-stage.sh 04-arch-base
```

Use `--resume` to preserve any state the stage itself created in a prior partial
run:

```bash
bash fruit/iso/iso-build/scripts/observability/synos-only-stage.sh 04-arch-base --resume
```

**When to use this:** anytime you are patching a stage script and want to
test the fix in 15 seconds rather than 3 hours.

**Caution:** some stage scripts carry implicit ordering dependencies (they assume
the previous stage's artifacts exist). Check the wizard's `NEXT:` field backward
to verify. When in doubt, use the resume inspector first.

---
tags: [general]

## Step 5 — Open a tracked issue

If the failure is not immediately reproducible from the stage replay, or you
need to hand off to another operator, file an issue automatically:

```bash
bash fruit/iso/iso-build/scripts/observability/synos-fail-issue.sh \
  04-arch-base \
  fruit/iso/iso-build/scripts/logs/04-arch-base.log \
  1
```

`synos-fail-issue.sh` attaches:
- Last 200 lines of the stage log (ANSI stripped)
- Last-known-good commit hash and message
- Triggered `watch_fail` patterns from the wizard
- Host kernel version, load average, and disk free at failure time

The `gh` CLI must be authenticated with repo write permission. Install with
`pacman -S github-cli` if absent.

---
tags: [general]

## Stage-Specific Guidance

### Stage 04 — arch-base

Stage 04 is the most fragile stage in the pipeline. It creates the minimal Arch
chroot that every subsequent stage depends on. A silent failure here propagates
as confusing errors 3–5 stages downstream.

**Primary diagnostic:** check the CA bundle size.

```bash
stat -Lc %s build/base-system/etc/ssl/certs/ca-certificates.crt
```

- `>50000` bytes: bundle is real; TLS will work downstream
- `49` bytes: the `update-ca-trust` post-install hook did not run; stage failed silently

If the CA bundle is 49 bytes, the root cause is a post-transaction scriptlet
segfault under the host kernel. See
[Incident #001](../../internal/eyesonly/incidents/index.md) for the full
timeline, root cause, and the nspawn-based mitigation that resolved it.

**Secondary diagnostics:**

```bash
# Were the post-install hook prerequisites present?
wc -l build/base-system/etc/group         # expect 40+ lines; root only = bad
find build/base-system/usr/share/ca-certificates/trust-source -type f | wc -l
```

**Check the pacman cache hit ratio** after stage 04 to confirm the bind-mounted
cache is working:

```bash
bash fruit/iso/iso-build/scripts/observability/synos-cache-stats.sh \
  fruit/iso/iso-build/scripts/logs/04-arch-base.log
```

A ratio below 50% on a warm cache indicates the bind mount was not active or
the cache directory was cleared.

### Stage 02 — kernel

The kernel build is the longest stage (~90 min on sanctum). If it times out or
hangs, check load average and available RAM before assuming a kernel bug.

Use the progress parser to get real-time ETA during a replay:

```bash
tail -F fruit/iso/iso-build/scripts/logs/02-kernel.log \
  | bash fruit/iso/iso-build/scripts/observability/synos-stage-progress-parser.sh kernel
```

### Stage 18a — squashfs

The squashfs stage is the most disk-intensive. Ensure at least 20 GB free on
the repo root filesystem before it runs.

```bash
df -h ~/Syn_OS
```

Use the progress parser to monitor compression progress:

```bash
tail -F fruit/iso/iso-build/scripts/logs/18a-squashfs.log \
  | bash fruit/iso/iso-build/scripts/observability/synos-stage-progress-parser.sh squashfs
```

---
tags: [general]

## Timing Regressions

If a build succeeds but takes significantly longer than expected, run the
leaderboard to identify which stage regressed:

```bash
# Full leaderboard (median / p95 / max per stage)
bash fruit/iso/iso-build/scripts/observability/synos-stage-leaderboard.sh

# Only stages running >2σ above their historical mean
bash fruit/iso/iso-build/scripts/observability/synos-stage-leaderboard.sh --regression
```

Data source: `.synos-build-metrics.jsonl` at the repo root. This file accumulates
across builds — the leaderboard is only meaningful after 3+ builds on the same
machine.

---
tags: [general]

## Baseline Drift

`synos-success-diagnostic.sh` captures diagnostic snapshots on stage success
so future failures can diff against known-good values.

```bash
# Diff current build against the last captured baseline for stage 04:
bash fruit/iso/iso-build/scripts/observability/synos-success-diagnostic.sh \
  diff 04-arch-base
```

Stages that declare `DIAGNOSTIC_PROBES=(...)` run this automatically. If a stage
does not yet have probes, add them — the pattern is described in the script header
at `observability/synos-success-diagnostic.sh:14-24`.

---
tags: [general]

## Integrity and Chain of Custody

If the build is for a release candidate, verify the attestation chain after
completion:

```bash
bash fruit/iso/iso-build/scripts/observability/synos-stage-attest.sh chain
```

This prints all signed stage checkpoints and their cosign signatures. A gap in
the chain (a stage without a signature) means either the stage was run without
`COSIGN_KEY` set, or the checkpoint was tampered with after signing.

Set `COSIGN_KEY` to the build oracle's ed25519 private key path before starting
the build. The attest script no-ops if the variable is absent — safe for
developer builds where a signing ceremony has not been done.

---
tags: [general]

## Postmortem Template

When a build failure causes a P0 incident (blocks a release), document it using
the template at:

`growth/development/docs/internal/incidents/INCIDENT_TEMPLATE.md`

File the completed postmortem under:

`growth/development/docs/internal/incidents/<NNN>-<slug>.md`

Then add an entry to the
[Incidents Index](../../internal/eyesonly/incidents/index.md).

See [Incident #001](../../internal/eyesonly/incidents/index.md) for the canonical
example: the pacman post-tx hooks segfault that blocked the v60 master ISO release
for four build cycles.

---
tags: [general]

## Quick Reference

| Situation | Command |
|---|---|
| Build failed — what stage? | `tail growth/output/iso-build-logs/master-generation-*.log` |
| Resume safe? Which stages re-run? | `bash observability/synos-resume-inspector.sh` |
| Replay a single stage | `bash observability/synos-only-stage.sh <stage>` |
| File a GitHub issue | `bash observability/synos-fail-issue.sh <stage> <log> <exit>` |
| Colorize a log | `tail -F <log> \| bash observability/synos-log-color` |
| Stage 04 CA bundle size | `stat -Lc %s build/base-system/etc/ssl/certs/ca-certificates.crt` |
| Pacman cache hit ratio | `bash observability/synos-cache-stats.sh logs/04-arch-base.log` |
| Kernel build progress | `tail -F logs/02-kernel.log \| bash observability/synos-stage-progress-parser.sh kernel` |
| Timing regressions | `bash observability/synos-stage-leaderboard.sh --regression` |
| Attestation chain | `bash observability/synos-stage-attest.sh chain` |

All `observability/` paths are relative to
`fruit/iso/iso-build/scripts/`.
