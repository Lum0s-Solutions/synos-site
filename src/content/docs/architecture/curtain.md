---
title: Curtain Capability Tokens
description: Curtain v4 — tier-based ed25519 capability tokens enforced by an LSM hook, with compile-time ELF symbol scanning. The mechanism that holds the free and training images to a capability ceiling below the licensed Enterprise Edition.
---

The **Curtain** is the mechanism that lets Syn_OS ship the same code to a 14-year-old playing GRIMOIRE and to an organization running the licensed Enterprise Edition at scale, without those two systems being interchangeable.

It evolved across four generations:

- **Curtain v1** — build-time ELF symbol scanner + feature audit + lab integrity manifests. Static.
- **Curtain v2** — runtime capability ceiling with seven enforcement points (tier gate + seccomp + AppArmor + taint + prompt guard + syscall filter + mesh).
- **Curtain v3** *(v54 Sundered Crown)* — **tier-based ed25519 capability tokens**, signed and chained, enforced by an LSM hook in `synos-security`.
- **Curtain v4** *(v111.0.0 "Last Light" — current)* — Integrates the compile-time `xtask` scanner (13 forbidden symbols, 8 forbidden strings enforced at build time) with the v3 runtime token system. SipHash-2-4 keyed-MAC capability tokens replace raw ed25519 for per-operation gates; the `synos_capability` kernel module (issue / verify / revoke) makes forged-tier tokens return `BAD_MAC` before the LSM hook is ever reached.

## Why Curtain exists

The Curtain draws the boundaries that let the same codebase ship safely to every audience. The public images — GRIMOIRE Public and personal GoodLife — are held to a **capability ceiling**: they carry no operational offensive tooling and cannot escalate to the licensed **Enterprise Edition**. Everything else Syn_OS can do — the full AI cortex and dispatch, the complete ARCANUM mesh, the whole 245-crate development stack, and the Research Division — is available in the full sovereign build that GoodLife delivers.

GRIMOIRE Public is the talent funnel. The premise is that play produces operators. But play is only valuable if the platform under the play stays educational — if a sufficiently determined player could compile their way out of the public profile and past the capability ceiling, the platform would be a vulnerability vendor disguised as a school. So the boundary Curtain makes mechanical and non-negotiable is the capability ceiling: the public images ship without operational offensive tooling, and no in-band path escalates them to the licensed Enterprise Edition.

Curtain enforces, by construction:

- Public players cannot enable AI dispatch operations (`ENOSYS` on every attempt — capability-token enforcement, no in-band bypass)
- Public Sanctums cannot federate with Enterprise Edition Sanctums
- Public audit trails use a separate HMAC-SHA256 chain root from the Enterprise Edition
- Fragment Field IDS *kernel-side* detection is enabled only in the licensed Enterprise Edition (public gets userspace-only access)
- C2 framework binaries are scrubbed at build time on the public profile

These rules are not enforced by best-effort runtime checks. They are enforced by a refusal to issue, sign, or accept the capability tokens that would allow them.

## Token format

A Curtain v4 capability token is an ed25519-signed envelope containing:

```
{
  "version":   3,
  "issuer":    "<sanctum-fqdn>",
  "tenant":    "<tenant-uuid>",
  "tier":      "grimoire-public" | "goodlife" | "enterprise",
  "subject":   "<process-or-node-uuid>",
  "claims":    [ "kernel:ai-dispatch", "ebpf:enable", "federation:peer" ],
  "issued":    1746813600,
  "expires":   1746900000,
  "nonce":     "<32-byte hex>",
  "parent":    "<token-id>",
  "algorithm": "ed25519"
}
```

…with a signature appended. Tokens are short-lived (typically ≤24 h) and chained: each token references the parent that authorised its issuance, all the way back to the federation root.

The `algorithm` field supports both `ed25519` and **ML-DSA** — post-quantum signing is available for capability tokens and the field was designed from the start to carry an algorithm OID for clean rotation.

## Tiers

| Tier               | Issued by                | Authorised claims                                                  |
|--------------------|--------------------------|--------------------------------------------------------------------|
| `grimoire-public`  | GRIMOIRE federation root | XP-bounded tool unlocks, lab launch, GRIMOIRE-tier mesh peering; optional AI-research tooling unlocked at late progression. No operational offensive tooling; cannot escalate to the Enterprise Edition. |
| `goodlife`         | GoodLife federation root | Full sovereign capability — full ALFRED, AI cortex + dispatch, complete ARCANUM mesh, the whole 245-crate stack, and the Research Division. No operational offensive tooling; no Enterprise Edition peering. |
| `enterprise`       | Enterprise Edition federation root | Everything GoodLife has at organizational scale, **plus** multi-tenant ARCANUM federation and fleet management, and a FedRAMP Moderate / CMMC L2 / SOC2 compliance posture with evidence packs; gated by a commercial license and a hardware attestation |

There is no "elevate" claim. A `grimoire-public` subject cannot acquire an `enterprise` token under any in-band path — the issuance ceremony for an `enterprise` root requires a hardware-attested ceremony with two custodians, and the federation root's signing key never leaves an offline HSM.

## The seven enforcement points (v2, still active under v4)

Curtain v4 inherits and augments the seven runtime enforcement points from v2:

1. **Tier gate** — token tier checked on every privileged operation (LSM hook in `synos-security`)
2. **seccomp BPF** — 18-syscall deny list enforced per-process for lab sandboxes
3. **AppArmor** — `synos.grimoire.lab` profile pins file access
4. **Kernel taint flag** — once set (e.g. an unsigned module loaded), the process loses its Enterprise Edition claims permanently
5. **PromptGuard** — content guard between user prompts and ALFRED's full-execution (Enterprise) actions; signed receipts in `synos-attest-ledger`
6. **Kernel interface filter** — capability-token check on every gated kernel operation (return `ENOSYS` based on tier)
7. **Mesh peering** — federation handshake refuses cross-tier sessions

## Issuance flow

```
1. Subject requests a token from its local Sanctum:
   POST /v3/curtain/request
   { tier: "grimoire-public", claims: [...], duration: 3600 }

2. Sanctum verifies the requesting subject (mTLS + tenant scope).

3. Sanctum consults policy (Riftrunner-VM bytecode, hot-loadable):
   - Is this claim allowed for this tier on this tenant?
   - Does the requesting subject have an unexpired parent token?
   - Are XP / progression gates satisfied (GRIMOIRE)?

4. If approved:
   a. Build the token envelope (see above).
   b. Sign with the tenant-scoped ed25519 key.
   c. Append issuance to `synos-attest-ledger` (HMAC-SHA256 chain).
   d. Return the token to the subject.

5. Subject presents the token on every gated operation.
   The LSM hook verifies the signature, checks the chain, enforces.
```

## Revocation

Tokens are short-lived by default (1–24 h). For longer-lived claims, the Sanctum maintains a per-tenant revocation list that the LSM hook consults on every operation. Revocation propagates through Sanctum federation gossip in seconds.

Mass revocation (e.g. a lost laptop, an incident-response action) is a single tenant-scoped operator action that propagates through the same federation gossip within seconds.

## Receipts and attestation (v46 Threadwalker)

Every Curtain decision produces a **PromptGuard receipt** chained into `synos-attest-ledger`:

- Decision (`grant` / `deny`)
- Subject identity
- Claim requested
- Policy hash
- Timestamp
- HMAC-SHA256 chain link

The ledger is append-only, replicated across Sanctum federation peers, and signed at epoch roots with SLH-DSA. Audit pulls it for SOC2 / CMMC / FedRAMP evidence.

## Why this matters commercially

The Curtain is the bedrock of the LumOs commercial model. GRIMOIRE Public is the free talent funnel that produces the best cybersecurity operators in the world; GoodLife is the full sovereign build — everything Syn_OS can do — free for personal and sovereign use and licensed for commercial or organizational deployment; the **Enterprise Edition** is the commercial product LumOs sells, delivering GoodLife's full capability at organizational scale plus multi-tenant ARCANUM federation, fleet management, and a FedRAMP Moderate / CMMC L2 / SOC2 compliance posture with evidence packs under a commercial license. All three are built from the same codebase, audited together, and shipped by the same supply chain — but Curtain v4 makes the boundary that matters — the capability ceiling that holds the free and training images below the licensed Enterprise Edition — mechanical, signed, and externally auditable.

## Related

- **[GRIMOIRE Overview →](/grimoire/overview/)** — what the public profile gets
- **[Custom Kernel →](/architecture/kernel/)** — the LSM hook that consults tokens
- **[Forge →](/architecture/forge/)** — token signing keys live alongside release signing
- **[ARCANUM Mesh →](/architecture/arcanum/)** — federation refuses cross-tier peering
