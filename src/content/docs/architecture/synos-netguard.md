---
tags: [general]
title: synos-netguard — eBPF-powered per-process egress firewall for Syn_OS
description: synos-netguard — eBPF-powered per-process egress firewall for Syn_OS
---
tags: [general]

# synos-netguard — eBPF-powered per-process egress firewall for Syn_OS

**Classification:** PUBLIC
**Crate:** `fruit/crates/synos-netguard/`
**Milestone:** v0+
**License:** MIT

## What It Is

`synos-netguard` eBPF-powered per-process egress firewall for Syn_OS.

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `ebpf_loader` | ! synos-netguard — eBPF per-process egress firewall ! ! Attaches cgroup/connect4 programs to enforce per-process netw... |
| `error` | `error` module |
| `monitor` | `monitor` module |
| `policy` | `policy` module |

### How It's Wired

1. **Internal** — self-contained crate

## Future Ideas

1. Expand module coverage and integration points
