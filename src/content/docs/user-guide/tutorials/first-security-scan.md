---
title: Your First Security Scan
description: Chain nmap, whatweb, nuclei, and nikto against a safe GRIMOIRE lab target — and see how GRIMOIRE rewards real-world tool usage with XP.
---

This tutorial walks you through your first security scan on Syn_OS, using
the native tools baked into every image profile. You'll chain `nmap`,
`whatweb`, `nuclei`, and `nikto` to go from "nothing known" about a target
to a structured set of findings, then see how GRIMOIRE rewards real-world
tool usage with experience points.

:::caution[Safety and ethics — read this first]
**Only scan systems you own or have explicit written permission to test.**
Unauthorized scanning is illegal in most jurisdictions (CFAA in the US,
Computer Misuse Act in the UK, and similar statutes worldwide) regardless of
intent. Syn_OS ships GRIMOIRE lab targets specifically so you can practice
against disposable, sandboxed services without legal exposure. When in
doubt, scan `127.0.0.1` or a GRIMOIRE lab. This tutorial uses `127.0.0.1`
throughout.
:::

## What You'll Learn

- How to set up a safe scan target (a GRIMOIRE lab or localhost).
- How to run `nmap`, `nuclei`, `whatweb`, and `nikto`, and interpret the output.
- How GRIMOIRE tracks XP for real-world tool usage.
- How to wrap the pipeline in a reproducible scan script.

## Prerequisites

- A Syn_OS installation (live or installed) — any profile.
- `sudo` for the `nmap` scan types that need raw sockets.
- About 30 minutes.

---

## 1. Spin Up a Safe Target

The safest first target is a GRIMOIRE lab. Launch GRIMOIRE and pick a
beginner recon lab:

```bash
grimoire
# Menu → Labs → Beginner → Recon 101 → Start
```

GRIMOIRE boots the lab in an isolated sandbox with a deliberately vulnerable
HTTP service exposed on a local port (the lab brief tells you which one —
`8080` in the examples below). Confirm the target is listening before you scan:

```bash
ss -tln | grep 8080
```

---

## 2. Nmap — Port and Service Discovery

```bash
sudo nmap -sS -sV -sC -oA ~/scans/first-scan/nmap-tcp 127.0.0.1
```

- `-sS` — TCP SYN ("stealth") scan; needs `sudo` for raw sockets.
- `-sV` — version detection on open ports.
- `-sC` — default NSE script set.
- `-oA` — write all output formats under one base name.

Example output:

```
PORT     STATE SERVICE VERSION
8080/tcp open  http    nginx 1.25.3
|_http-title: Welcome to Recon 101
|_http-server-header: nginx/1.25.3
```

Three things jump out: the service is `nginx 1.25.3`, the page title is
known, and the server header is intact. Cross-reference the version against
a CVE feed to see if anything matches.

For a full-port scan add `-p-`. For UDP, add `-sU` — but expect it to be
much slower.

---

## 3. WhatWeb — Web Technology Fingerprinting

```bash
whatweb -v -a 3 http://127.0.0.1:8080 --log-json=~/scans/first-scan/whatweb.json
```

`-a 3` is aggressive mode (fine for labs, not for production targets). Look
for technology stacks — a framework, a CMS, a version number — each becomes
a lead for the next tool.

---

## 4. Nuclei — Template-Driven Vulnerability Scanning

```bash
nuclei -u http://127.0.0.1:8080 \
  -severity medium,high,critical \
  -o ~/scans/first-scan/nuclei.txt \
  -json-export ~/scans/first-scan/nuclei.json
```

Update templates before every engagement:

```bash
nuclei -update-templates
```

Each hit names a template ID, a severity, and evidence. Low-severity hits
are often informational; medium and above deserve a manual look. False
positives happen — always verify by hand before reporting.

---

## 5. Nikto — Web Server Misconfiguration Sweep

```bash
nikto -h http://127.0.0.1:8080 -output ~/scans/first-scan/nikto.txt -Format txt
```

Nikto is noisy on purpose. Read its output skeptically — many "OSVDB"
references are pre-2017 and no longer relevant, but findings like "Server
leaks information via X-Powered-By header" are genuine and actionable.

---

## 6. GRIMOIRE XP for Real-World Tool Usage

Running these tools against a GRIMOIRE lab grants XP in the matching skill
tree; running them against non-lab targets grants a reduced amount, so
practicing against real (authorized) targets still counts, just not as a
shortcut to leveling up.

| Tool | Skill tree |
|---|---|
| `nmap` | Recon |
| `whatweb` | Recon |
| `nuclei` | Vulnerability Analysis |
| `nikto` | Web Security |

---

## 7. A Reproducible Scan Workflow

```bash
#!/usr/bin/env bash
# ~/scans/workflows/first-scan.sh
set -euo pipefail

TARGET="${1:-127.0.0.1}"
OUTDIR="${HOME}/scans/$(date +%Y%m%d-%H%M%S)-${TARGET//\//_}"
mkdir -p "$OUTDIR"

echo "[+] nmap TCP fingerprint..."
sudo nmap -sS -sV -sC -oA "$OUTDIR/nmap-tcp" "$TARGET"

echo "[+] whatweb..."
whatweb -v -a 3 "http://$TARGET" --log-json="$OUTDIR/whatweb.json"

echo "[+] nuclei medium+..."
nuclei -u "http://$TARGET" \
       -severity medium,high,critical \
       -o "$OUTDIR/nuclei.txt" \
       -json-export "$OUTDIR/nuclei.json"

echo "[+] nikto..."
nikto -h "http://$TARGET" -output "$OUTDIR/nikto.txt" -Format txt

echo "[+] Done — findings at $OUTDIR"
```

Save it, `chmod +x`, and run with `~/scans/workflows/first-scan.sh 127.0.0.1`.

---

## Troubleshooting

**`nmap` "Operation not permitted".** You forgot `sudo` — raw sockets need
`CAP_NET_RAW`.

**`nuclei -update-templates` fails.** Check network connectivity and write
permissions on `~/.local/share/nuclei-templates/`.

**Lab target connection refused.** GRIMOIRE labs run in an isolated sandbox
network; if the port isn't reachable, restart the lab from the GRIMOIRE menu.

## Related Tutorials

- [Customizing Your Desktop](/user-guide/tutorials/customizing-desktop/)
- [Using AI Features](/user-guide/tutorials/using-ai-features/) — ask ALFRED to summarize your findings.
- [Benchmarking](/user-guide/tutorials/benchmarking/)

_Remember: only scan what you own or have written permission to test._
