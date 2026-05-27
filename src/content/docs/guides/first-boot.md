---
title: First Boot
description: What to expect the first time you boot Syn_OS — Plymouth, the wizard, ALFRED's introduction, and your first lab.
---

The first boot of an installed Syn_OS system runs the v43.2 first-boot wizard (rewritten in Crimson Spire to enforce display-manager singleton, with the failed-services pre-flight rewritten as a clean status pipeline). Here's what to expect.

## The boot sequence

```
GRUB (Phoenix-themed)
  ↓
6.19-synos-ai kernel + signed Rust kernel modules load
  ↓
Plymouth — Phoenix decay sequence (decay_000 → decay_002 → neural-node sigil)
  ↓
systemd-fsck, then synos-cradle-verify.service confirms the module-signing chain
  ↓
SDDM (Cinnamon greeter, Crimson Spire theme)
  ↓
Cinnamon DE with Rehoboam system monitor overlay
```

Boot time on a modest SSD lands at ~30 seconds to login prompt; ~86 seconds to a usable desktop with all services healthy (verified by `synos-copilot-vm play 02-service-health`).

## The wizard (one-time)

After the first login, the **Syn_OS Onboarding Wizard** appears — a Bevy-rendered fullscreen UI with the Cutscene plugin's typewriter dialogue.

1. **ALFRED introduction** — the daemon introduces itself, asks for consent to operate in Advisory mode, and explains the four operating modes (Advisory / GameMode / Master / Mesh).
2. **Profile confirmation** — the ISO profile is read from `/etc/synos/brand-meta.toml`. You cannot cross-promote here; promotion to Master requires a customer agreement and a fresh image.
3. **Security baseline** — the Sanctum hardening profile is applied: AppArmor enforce, seccomp filters, kernel lockdown, eBPF monitor enable.
4. **Network setup** — optional **ARCANUM Hive** enrollment via Tailscale + WireGuard. If you skip, you can re-run `synos-hive-bootstrap` later.
5. **GRIMOIRE onboarding** *(GRIMOIRE Public only)* — pick your faction (Crimson Spire / Neon Collective / The Warden), accept the Sovereign Operator Path agreement, receive the 10-tool starter kit and your first lab assignment.

The wizard writes its completion state to `/var/lib/synos/wizard.completed` so it never re-runs unless you delete that flag.

## ALFRED is talking — what's going on?

ALFRED runs as a **two-layer architecture**:

- **Rust daemon (v6.0)** — system intelligence: CPU/memory optimization, kernel bridge via the capability-gated kernel module interface, an 11-endpoint REST API, NATS event bus, the God Mode dashboard aggregator, and the consciousness fusion engine.
- **Python layer (v2.1.0)** — user-facing assistant: LLM integration, voice, RAG, TUI, and the privacy-first job-hunt mode.

On first boot ALFRED starts in **Advisory mode**: read-only system inspection, no command execution. You can promote it to GameMode (lab sandboxing) or Master (full execution) via:

```bash
synos-alfred-mode set advisory   # default
synos-alfred-mode set gamemode   # for GRIMOIRE labs
synos-alfred-mode set master     # full execution (Master ISO only)
synos-alfred-mode set mesh       # gossip-protocol distributed consciousness
```

## The TUI

`synos-ops` is a 23-tab terminal UI for everything ALFRED can see. Core tabs:

| Tab              | Shows                                                                 |
|------------------|-----------------------------------------------------------------------|
| **System**       | CPU / memory / temperature / kernel module status                     |
| **Benchmark**    | `synos-bench` results, neural inference throughput, latency P99       |
| **Hive**         | ARCANUM mesh node grid (gossip state, mTLS health, peer reachability) |
| **Services**     | systemd unit status, ALFRED REST API, NATS bus, Fragment Field IDS    |
| **ALFRED**       | Consciousness state — coherence, activity, mode, decision latency     |
| **Node grid**    | Per-node CPU / RAM / GPU + assigned models                            |
| **Models**       | Loaded LLM / ONNX models, Ollama queue, inference stats               |
| **PQ-posture**   | Post-quantum crypto status across transports and signing paths        |
| **Supply-chain** | SBOM drift, Forge attestation status, Sigstore Rekor entries          |

Additional tabs surface multiplayer state, observability counters, and other subsystems. Cycle tabs with `Tab` / `Shift+Tab`. Quit with `q`.

## Your first lab (GRIMOIRE Public)

```bash
grimoire start
```

This launches the Bevy faction-HQ scene. Pick **Beginner** in your chosen faction, accept the lab brief, and the Docker overlay spins up an isolated environment. Submit the flag, earn XP, watch the SkillTree plugin animate the unlock.

After 5 intro labs you have enough XP to spend on your first tool unlock — typically `nikto`, `gobuster`, or `enum4linux`. The catalogue is **already on disk**; XP just grants execution permission via Curtain v3 capability tokens.

## Recovering from a bad boot

If anything fails the boot sequence:

```bash
# from a recovery shell or rescue ISO:
synos-doctor --diagnose          # full 41-stage post-install validation
journalctl -u synos-cradle-verify
systemctl --failed
```

The most common failure mode pre-v43.2 was a `customize_airootfs` race; the v43.2 fix matrix closed that with the new stage 17e pre-squashfs validation gate (9 assertions blocking broken rootfs before squashfs is sealed).

## Next steps

- **[GRIMOIRE Overview →](/grimoire/overview/)** — what the game is about
- **[Six-Layer Stack →](/architecture/layers/)** — what's actually running on your machine
- **[ALFRED →](/architecture/alfred/)** — the AI daemon in depth
