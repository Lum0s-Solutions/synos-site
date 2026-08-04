---
title: Build Observatory
description: The operator-facing instrumentation layer for Syn_OS ISO builds — a narrative wizard, live dashboard, and 13 diagnostic tools.
---

The Build Observatory is Syn_OS's operator-facing instrumentation layer for
ISO builds. It answers one question while a multi-hour build runs: **not
just what is happening, but why it matters and what to watch for next.**
Without that context, watching scrolling log lines gives you no way to tell
whether a pause in a given stage is normal or a hang.

The Observatory has four interlocking components:

| Component | Entry point | Purpose |
|---|---|---|
| Build Wizard | `synos-build-wizard.sh` | Narrative panel: WHY / WHAT / WATCH FOR / NEXT |
| Dashboard | `synos-build-dashboard.sh` | tmux layout wiring all panes together |
| HTTP Mesh Viewer | `synos-status-http.py` | Web projection of the wizard to mesh nodes |
| Observability Tools | `observability/synos-*.sh` | 13 diagnostic and analysis scripts |

All scripts live under
`growth/development/scripts/iso-build/dashboard/` and
`growth/development/scripts/iso-build/observability/`.

## The WHY-while-it-runs concept

Every build stage has a wizard Markdown file
(`dashboard/wizard/<NN>-<name>.md`) that the wizard renderer reads at
runtime, answering four questions in the operator's language rather than
the machine's:

- **WHY** — why this stage exists, and what breaks downstream if it fails
- **WHAT** — the load-bearing actions the stage is performing right now
- **WATCH FOR** — success tokens and failure patterns to look for in the log panes
- **NEXT** — the stage that follows, so you can anticipate the next stretch

Most build tooling surfaces *what* (log lines) without *why*. An operator
who doesn't know that an early stage builds the chroot every later stage
depends on won't know whether a particular warning means "abort now" or
"probably fine." The wizard sits above the logs and contextualizes them —
it doesn't replace them.

## Dashboard Quick Start

**Prerequisites:** `tmux` installed, and a build already launched (or in
flight).

```bash
# From the Syn_OS repo root:
bash growth/development/scripts/iso-build/dashboard/synos-build-dashboard.sh
```

This creates a tmux session named `synos-build` and attaches immediately.
The session persists until explicitly killed — an SSH disconnect won't
destroy it.

```bash
# Re-attach after disconnection
tmux attach -t synos-build

# Launch without attaching (headless / mesh nodes)
bash growth/development/scripts/iso-build/dashboard/synos-build-dashboard.sh --no-attach

# Named session override
SYNOS_BUILD_TMUX_SESSION=my-build bash synos-build-dashboard.sh
```

**Pane layout:**

```
┌──────────────────────────── WIZARD ────────────────────────────────┐
│ Stage narrative: WHY / WHAT / WATCH FOR / NEXT                      │
├──────────────────────────────────────────────────────────────────── │
│  build.log (master tail)    │  <NN>-<stage>.log (current stage)    │
├─────────────────────────────┴──────────────────────────────────────┤
│ disk / mem / cpu / metrics ticker                                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Wizard Markdown Format

Without a wizard file, the pane prints "no wizard content for stage XX" —
that's a documentation gap worth filling if you author a new build stage.

**File naming:** `dashboard/wizard/<NN>-<stage-name>.md`, matching the stage
script name exactly.

**Frontmatter schema:**

```yaml
---
stage: 04-arch-base
why: >
  One paragraph: why this stage exists and what breaks downstream if it fails.
what: |
  - Load-bearing action one
  - Load-bearing action two
watch_success:
  - "Post-install hooks complete"
  - "Base system created"
watch_fail:
  - "command terminated by signal 11"
  - "CA bundle is suspiciously small"
next: 05-rootfs
expected_seconds: 180
notes: |
  Dated, ephemeral operational context specific to a kernel or config version.
---
```

**Authoring guidance:**

- The `why` field is the hardest and most valuable to write — answer "what
  would a new operator need to know to understand why a failure here is
  serious?"
- `watch_fail` patterns should match actual log output exactly — they
  become the dashboard's failure-highlight triggers.
- Under-estimate `expected_seconds` rather than over-estimate; a progress
  bar that fills early beats one that reads 0% for several minutes.
- Keep `notes` dated so stale context is easy to prune later.

## HTTP Mesh Viewer

`synos-status-http.py` exposes the wizard output as a web page visible from
any node on your build mesh. It renders the wizard plus the last ~30 lines
of the master log and ~25 lines of the current stage log, auto-refreshing
every few seconds.

```bash
# Bind to the mesh interface (default)
python3 growth/development/scripts/iso-build/dashboard/synos-status-http.py

# Custom port
python3 growth/development/scripts/iso-build/dashboard/synos-status-http.py --port 8081
```

| Path | Response |
|---|---|
| `/` | Full HTML dashboard — wizard, logs, build state |
| `/raw` | Plain-text wizard output — useful for `curl` + `watch` |
| `/health` | `200 ok` — for health probes |

**Security model:** the server binds to a mesh-only interface by default;
falls back to `127.0.0.1` if no mesh interface is present. Do not bind it to
`0.0.0.0` on any host reachable from the public internet.

## Observability Tools Reference

All 13 tools live under `observability/`. Most are also invoked
automatically from stage hooks.

| Script | When to reach for it |
|---|---|
| `synos-only-stage.sh` | Replay a single stage in isolation during a bug hunt. |
| `synos-resume-inspector.sh` | Before relaunching: shows which stages will SKIP vs RE-RUN. |
| `synos-fail-issue.sh` | On failure: creates a pre-populated GitHub issue with logs + context. |
| `synos-stage-leaderboard.sh` | Per-stage timing table (median, p95, max); `--regression` for outliers. |
| `synos-regression-alarm.sh` | Machine-readable pass/warn/critical verdict, called from the stage-end hook. |
| `synos-auto-journal.sh` | Appends a per-stage entry to the daily dev journal. |
| `synos-build-graph.sh` | Emits a Graphviz DOT of the full stage dependency graph. |
| `synos-stage-progress-parser.sh` | Pipe a kernel or squashfs log through this for a real `pct=`/`eta_s=` line. |
| `synos-log-color.sh` | ANSI severity colorization for any build log. |
| `synos-cache-stats.sh` | Pacman package cache hit ratio for a base-system-stage log. |
| `synos-pacman-scriptlet-audit.sh` | Reports exactly which install scriptlets a fast-path build suppressed. |
| `synos-stage-attest.sh` | Signs each successful stage checkpoint; `chain` prints the full attestation chain. |
| `synos-success-diagnostic.sh` | Captures happy-path baseline diagnostics so future failures can auto-diff. |

## Library Helpers

| Library | Purpose |
|---|---|
| `telemetry.sh` | Emits JSONL build events for the metrics file consumed by the leaderboard tools. |
| `conditions.sh` | Pre/post-condition validator framework stages declare against. |
| `snapshot.sh` | btrfs copy-on-write snapshot helpers for instant rollback on failure (no-ops on ext4/xfs). |

## Related

- [Build Runbook →](/operator-guide/build-runbook/)
- [ISO Build — How It Works →](/operator-guide/iso-build-deep-dive/)
