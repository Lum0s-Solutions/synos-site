---
title: Build Observatory
description: Build Observatory
---

# Build Observatory

The Build Observatory is the operator-facing instrumentation layer that ships with
Syn_OS v60. It answers one question while the build runs: **not just what is
happening, but why it matters and what to watch for next.** The 53-stage ISO build
takes 3–5 hours on the sanctum oracle; without WHY-context, operators stare at
scrolling log lines with no frame of reference for whether a 3-minute pause in
stage 04 is normal or a hang.

The Observatory consists of four interlocking components:

| Component | Entry point | Purpose |
|---|---|---|
| Build Wizard | `synos-build-wizard.sh` | Narrative panel: WHY / WHAT / WATCH FOR / NEXT |
| Dashboard | `synos-build-dashboard.sh` | tmux layout wiring all panes together |
| HTTP Mesh Viewer | `synos-status-http.py` | Web projection of the wizard to mesh nodes |
| Observability Tools | `observability/synos-*.sh` | 13 diagnostic and analysis scripts |

All scripts live under:
`fruit/iso/iso-build/scripts/dashboard/` and
`fruit/iso/iso-build/scripts/observability/`

---

## The WHY-While-It-Runs Concept

Every build stage has a wizard Markdown file (`dashboard/wizard/<NN>-<name>.md`)
that the wizard renderer reads at runtime. The wizard panel answers four questions
in the operator's language, not the machine's:

- **WHY** — why this stage exists in the pipeline and what breaks if it goes wrong
- **WHAT** — the load-bearing actions the stage is performing right now
- **WATCH FOR** — specific success tokens and failure patterns to look for in the
  log panes below
- **NEXT** — what stage follows, so the operator can anticipate the next 5 minutes

This is the key insight: most build tooling surfaces *what* (log lines) but not
*why*. An operator who does not know that stage 04 creates the chroot that every
later stage depends on will not understand why a CA bundle warning on line 74 of
the stage 04 log means "abort and fix now," not "probably fine."

The wizard does not replace the logs. It sits above them and contextualizes them.

---

## Dashboard Quick Start

### Prerequisites

- `tmux` installed on the build oracle
- Build already launched via `master-generation-run-kit.sh` (or in flight)

### Launch

```bash
# From the Syn_OS repo root:
bash fruit/iso/iso-build/scripts/dashboard/synos-build-dashboard.sh
```

This creates a tmux session named `synos-build` and attaches immediately. The
session persists until explicitly killed — SSH disconnects do not destroy it.

### Re-attach after disconnection

```bash
tmux attach -t synos-build
```

### Launch without attaching (for mesh nodes running headless)

```bash
bash fruit/iso/iso-build/scripts/dashboard/synos-build-dashboard.sh --no-attach
echo "Dashboard ready — attach with: tmux attach -t synos-build"
```

### Named session override

```bash
SYNOS_BUILD_TMUX_SESSION=my-build bash synos-build-dashboard.sh
tmux attach -t my-build
```

### Pane layout

```
┌──────────────────────────── WIZARD ────────────────────────────────┐
│ Stage narrative: WHY / WHAT / WATCH FOR / NEXT                      │
├──────────────────────────────────────────────────────────────────── │
│  build.log (master tail)    │  <NN>-<stage>.log (current stage)    │
├─────────────────────────────┴──────────────────────────────────────┤
│ disk / mem / cpu / metrics ticker (5s refresh)                      │
└─────────────────────────────────────────────────────────────────────┘
```

The wizard pane (`synos-build-wizard.sh`) polls
`fruit/iso/iso-build/scripts/logs/state/progress.state` every
`SYNOS_WIZARD_POLL` seconds (default: 10) and re-renders on every stage
transition.

---

## Wizard Markdown Format

Contributors author wizard files to document new build stages. Without a wizard
file, the pane prints `(no wizard content for stage XX — author it at <path>)`.

### File naming

```
dashboard/wizard/<NN>-<stage-name>.md
```

Match the stage script name exactly: `04-arch-base.sh` → `04-arch-base.md`.

### Frontmatter schema

```yaml
---
stage: 04-arch-base          # stage identifier — must match the script basename
why: >                        # one paragraph: why this stage exists; what breaks
                              # downstream if it goes wrong
what: |                       # multi-line block: load-bearing actions in bullet form
  - Action one
  - Action two
  - Action three
watch_success:                # list: tokens that appear in the log on happy path
  - "Post-install hooks complete via nspawn"
  - "Base system created"
watch_fail:                   # list: patterns that indicate real failure
  - "command terminated by signal 11"
  - "CA bundle is suspiciously small"
next: 05-rootfs               # stage that follows — the wizard displays this as NEXT
expected_seconds: 180         # expected wall-clock; used to draw the progress bar
notes: |                      # optional: version-specific ops notes, dated
  v60.1 (2026-05-08) replaced pacstrap → plain pacman + nspawn hooks.
---
```

### Canonical example

`fruit/iso/iso-build/scripts/dashboard/wizard/04-arch-base.md` is the
reference implementation. It documents the pacstrap → nspawn pivot from Incident
#001. See the full context at
[Incident #001](../../internal/eyesonly/incidents/index.md).

### Authoring guidance

- The `why` field is the hardest and most valuable to write. It should answer: "if
  I were a new operator watching this stage, what would I need to know to
  understand why a failure here is serious?"
- `watch_fail` patterns should match actual log output exactly — they become the
  dashboard's red-highlight triggers.
- `expected_seconds` drives the progress bar. Under-estimate rather than
  over-estimate; a bar that fills early is better than one that reads 0% for
  3 minutes.
- `notes` is for ephemeral operational context that applies to a specific kernel or
  build configuration. Keep it dated so it is easy to prune.

---

## HTTP Mesh Viewer

`synos-status-http.py` exposes the wizard output as a web page visible from any
node in the Tailscale mesh. It renders the same wizard + last 30 lines of the
master log + last 25 lines of the current stage log. The page auto-refreshes
every 3 seconds.

### Launch

```bash
# Bind to Tailscale IP (default — sanctum only visible to mesh)
python3 fruit/iso/iso-build/scripts/dashboard/synos-status-http.py

# Custom port
python3 fruit/iso/iso-build/scripts/dashboard/synos-status-http.py --port 8081

# Explicit bind (0.0.0.0 exposes to all interfaces — not recommended)
python3 fruit/iso/iso-build/scripts/dashboard/synos-status-http.py --bind 0.0.0.0
```

### Access from mesh nodes

```
http://100.64.0.1:8080/
```

Replace `100.64.0.1` with the sanctum Tailscale IP. Any node with an active
Tailscale connection to sanctum can read the page.

### Endpoints

| Path | Response |
|---|---|
| `/` | Full HTML dashboard — wizard, logs, build state |
| `/raw` | Plain-text wizard output — useful for `curl` + `watch` |
| `/health` | `200 ok` — for health probes from mesh scripts |

### Security model

The server binds exclusively to the Tailscale interface by default (`tailscale ip
-4`). Tailscale connections are authenticated via WireGuard keypairs — no
unauthenticated node can reach the port. The fallback if Tailscale is absent is
`127.0.0.1` (loopback only).

Do not use `--bind 0.0.0.0` on any node reachable from the public internet.

### `SYNOS_WIZARD_POLL` in low-resource environments

The wizard script sleeps for `SYNOS_WIZARD_POLL` seconds between renders
(default: 10). On the sanctum oracle (2c/11GB), the default is adequate. On a
node with fewer resources, or when running the HTTP server alongside a heavy
build, increase the interval to reduce CPU overhead:

```bash
SYNOS_WIZARD_POLL=30 python3 synos-status-http.py
```

Note: the HTTP server also internally bounds each wizard render to a 2-second
`timeout` call, so a slow render cannot block a request indefinitely.

---

## Observability Tools Reference

All 13 tools live under
`fruit/iso/iso-build/scripts/observability/`. Invoke them directly;
most are also called from stage hooks or the orchestrator's `stage_end` handler.

| Script | When to reach for it |
|---|---|
| `synos-only-stage.sh` | Replay a single stage in isolation during a bug hunt without re-running the full orchestrator. Pass `--resume` to skip cleanup. |
| `synos-resume-inspector.sh` | Before re-launching a build: shows which stages would be SKIPPED (checkpoint present) vs RE-RUN, with estimated wall-clock. Run this first to avoid surprise kernel rebuilds. |
| `synos-fail-issue.sh` | On stage failure: creates a pre-populated GitHub issue with the last 200 log lines, last-known-good commit, and tripped `watch_fail` patterns. Requires `gh` CLI with repo write access. |
| `synos-stage-leaderboard.sh` | Answer "where should I optimize?" — reads `.synos-build-metrics.jsonl` and emits a per-stage timing table (median, p95, max). Use `--regression` to surface only stages running >2σ above their mean. |
| `synos-regression-alarm.sh` | Called from the `stage_end` hook after every stage completes. Outputs a machine-readable verdict (`ok`, `warn`, `critical`) and sets the exit code accordingly. Wire into alerting if you want push notifications. |
| `synos-auto-journal.sh` | Appends a per-stage journal entry to the daily dev journal (`docs/internal/dev-journal/YYYY-MM-DD.md`). Called from `stage_end` hooks; captures duration, file count delta, warnings, and host fingerprint automatically. |
| `synos-build-graph.sh` | Emits a Graphviz DOT file of the full pipeline stage dependency graph. Pipe to `dot -Tsvg` for an SVG. Risk-coded: green = documented, yellow = historically fragile, red = critical path. |
| `synos-stage-progress-parser.sh` | Pipe a kernel or squashfs log through this to get a real `pct=` / `eta_s=` line per second instead of a generic spinner. Supported kinds: `kernel`, `squashfs`. |
| `synos-log-color.sh` | Pipe any build log through for ANSI severity colorization. Portable (awk only) — works inside nspawn, containers, over SSH. |
| `synos-cache-stats.sh` | Compute the pacman package cache hit ratio for a stage 04 log. Tells you whether the bind-mounted `/var/cache/pacman/pkg` is actually saving download time. |
| `synos-pacman-scriptlet-audit.sh` | Extract every `.INSTALL` scriptlet from stage 04's `BASE_PACKAGES`. Produces a markdown report listing exactly which scriptlets `--noscriptlet` suppressed and which the nspawn hook replay must cover. |
| `synos-stage-attest.sh` | Sign each successful stage checkpoint with a cosign ed25519 key. Creates a tamper-evident chain of custody. No-ops gracefully if `COSIGN_KEY` is not set. Use `chain` subcommand to print the full attestation chain. |
| `synos-success-diagnostic.sh` | Capture happy-path baseline diagnostics on stage success (CA bundle size, group count, rootfs size) so future failures can auto-diff against known-good values. Stages that adopt `DIAGNOSTIC_PROBES=(...)` get this automatically. |

---

## Library Helpers

The Observatory depends on three sourced libraries in
`fruit/iso/iso-build/scripts/lib/`:

| Library | Purpose |
|---|---|
| `telemetry.sh` | Emits JSONL events (`stage_start`, `stage_end`, `checkpoint`, `warn`, `error`) to `.synos-build-metrics.jsonl`. Schema includes `duration_s`, `rootfs_kb_delta`, `host_kernel`, `host_load_1m`. Source this in any stage to get free metrics. |
| `conditions.sh` | Pre/post-condition validator framework. Stages declare `STAGE_PRECONDITIONS` and `STAGE_POSTCONDITIONS` arrays; the orchestrator calls `assert_preconditions` and `assert_postconditions`. Predicates: `file:`, `exec:`, `var:`, `disk_free_gb:`, `sudo_cached`, `min_size:`, `group_in_chroot:`, `no_segv_in:`. |
| `snapshot.sh` | btrfs copy-on-write snapshot helpers (`snapshot_create`, `snapshot_restore`, `snapshot_drop`). On btrfs: instant rollback to pre-stage state after a failure, no re-running the kernel build. On ext4/xfs: no-ops harmlessly. |

---

## Related

- [Build Runbook](build-runbook.md) — what to do when a build fails
- [Incident #001 — Stage 04 pacman post-tx hooks segfault under kernel 6.18.26-lts](../../internal/eyesonly/incidents/index.md)
- Wizard source: `fruit/iso/iso-build/scripts/dashboard/wizard/`
- Telemetry sink: `.synos-build-metrics.jsonl` (repo root, gitignored)
