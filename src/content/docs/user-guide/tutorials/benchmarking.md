---
title: Benchmarking
description: The three benchmarking layers in Syn_OS — the in-daemon lite check, the system baseline collector, and Criterion micro-benchmarks for developers.
---

This guide walks through the benchmarking tooling in Syn_OS: a lightweight
in-daemon health check for everyday users, a full system baseline collector
for admins and release engineers, and Criterion micro-benchmarks for
contributors.

## Overview

| Layer | Who it's for | When it runs | Where results go |
|---|---|---|---|
| **Lite benchmark** (in-daemon) | End users | Periodically, inside `synos-daemon` | `/var/lib/synos/benchmark-lite.json` |
| **System baseline** (`benchmark-baseline.sh`) | Admins / release engineers | Manual + first ISO boot | `/var/lib/synos/benchmark-baseline-*.txt` |
| **Criterion micro-benchmarks** | Developers | `cargo bench` | `target/criterion/` (HTML reports) |

---

## 1 — Lite Benchmark (End-User)

The lite benchmark runs automatically inside `synos-daemon` and collects two
low-overhead metrics:

- **Available memory** (from `/proc/meminfo`)
- **IPC socket bind latency** (create + close a Unix datagram socket)

### View the latest result

```bash
cat /var/lib/synos/benchmark-lite.json
```

```json
{
  "collected_at": "uptime:42.37",
  "mem_available_mib": 5210,
  "mem_total_mib": 7939,
  "socket_bind_us": 42,
  "memory_status": "ok"
}
```

| `memory_status` | Meaning |
|---|---|
| `ok` | ≥ 20% of total RAM available |
| `low` | 5–19% available — consider closing applications |
| `critical` | < 5% available — system may become unresponsive |

### Adjust or disable

```toml
# /etc/synos/synos-daemon.toml
[benchmark]
enabled = true
interval_secs = 300   # minimum 60
output_path = "/var/lib/synos/benchmark-lite.json"  # "" = log-only
```

```bash
sudo systemctl restart synos-daemon
```

### Read results from the system log

```bash
journalctl -u synos-daemon -f | grep lite-bench
```

---

## 2 — System Baseline (`benchmark-baseline.sh`)

Captures a Markdown report suitable for comparing across installs, updates,
and hardware.

```bash
# From the Syn_OS repository root:
./benchmark-baseline.sh

# Or on any installed system:
bash /usr/share/synos/scripts/benchmark-baseline.sh

# With options
./benchmark-baseline.sh --output-dir /tmp/my-benchmarks --iterations 10
```

Output lands in `reports/benchmark-baseline-<YYYYMMDD-HHmmss>.txt`.

### What's measured

| Section | Data collected |
|---|---|
| Memory Footprint | Total, used, available, buffers, cached (MiB) |
| Boot Time | `systemd-analyze`, with `/proc/uptime` fallback |
| Daemon Startup Latency | Time to first log line, N samples (min/max/mean) |
| Running Services | `systemctl` snapshot of relevant units |

On a fresh install, the Calamares post-installer automatically captures a
baseline on first boot — this becomes the reference point for future
comparisons on that hardware.

---

## 3 — Criterion Micro-Benchmarks (Developers)

Exercises hot paths in `synos-daemon` with the
[Criterion](https://bheisler.github.io/criterion.rs/book/) framework —
statistical noise rejection, warm-up runs, HTML reports.

```bash
cargo bench -p synos-daemon
# or, via the justfile:
just bench
```

| Benchmark | What it measures |
|---|---|
| `quest_toml_parse_single` | TOML parse latency for one quest file |
| `quest_validation_valid` / `quest_validation_reject` | Validation throughput |
| `quest_batch_load/1` … `/100` | Full scan → parse → validate for N files |
| `unix_socket_bind` | Unix datagram socket bind + drop latency |

View the HTML report:

```bash
xdg-open target/criterion/report/index.html
```

Criterion flags a **regression** when the new mean falls statistically
outside the confidence interval of the previous run.

---

## 4 — Quick Reference

```bash
cat /var/lib/synos/benchmark-lite.json          # latest lite benchmark
journalctl -u synos-daemon -f | grep lite-bench # follow live daemon log
./benchmark-baseline.sh                         # full system baseline
just bench-lite                                 # lite benchmark, developer shortcut
just bench                                      # Criterion micro-benchmarks
ls -lt reports/benchmark-baseline-*.txt         # list past reports
```

---

## 5 — Troubleshooting

**Lite benchmark not writing output**

1. Check `benchmark.enabled = true` in `/etc/synos/synos-daemon.toml`.
2. Verify the output directory is writable: `ls -la /var/lib/synos/`
3. Check daemon logs: `journalctl -u synos-daemon --since "5 min ago"`

**`benchmark-baseline.sh` shows "binary not found"**

```bash
cargo build --release -p synos-daemon
./benchmark-baseline.sh
```

**Criterion benchmarks fail to compile**

`synos-daemon` needs `systemd` headers, installed via pacman:

```bash
sudo pacman -S systemd-libs
cargo bench -p synos-daemon
```

---

## 6 — For ISO Builders

The baseline script is wired into the Calamares post-install sequence and
runs as root on first boot of a freshly installed Master ISO. To bundle it
into a custom ISO rootfs:

```bash
install -m 755 benchmark-baseline.sh \
  "${ROOTFS}/usr/share/synos/scripts/benchmark-baseline.sh"
```
