---
title: AI Surface Hardening — Wave 10 (v41)
description: AI Surface Hardening — Wave 10 (v41)
---

# AI Surface Hardening — Wave 10 (v41)

**Status:** Implemented — Wave 10, Recs 21 + 26 closed
**Author:** Cipher (LumOs Dev-Security Pod)
**Date:** 2026-04-16

---

## Overview

ALFRED's AI surface has two structural attack vectors closed in Wave 10:

1. **Rec 26 — Brain Integration Event Taint Tracking**: untrusted signals propagating from GRIMOIRE labs or unauthenticated API calls cannot trigger kernel-level AI decisions (syscall 471 `MAKE_AI_DECISION`).
2. **Rec 21 — Prompt Injection Defense Layer**: every outbound LLM request is wrapped by `PromptGuard` middleware, which fences untrusted input, validates response schema, and enforces a tier-scoped tool allowlist.

---

## 1. Taint Model (Rec 26)

### Four Trust Tiers

`Taint` is defined in `synos-brainstem/src/lib.rs` and carried on every `AlfredSignal`.

| Variant | Source | High-Stakes Capable |
|---|---|---|
| `KernelTelemetry` | Syscalls 469-479, kernel module signals | Yes |
| `SystemBoot` | Attestation-verified boot-time signals | Yes |
| `OperatorInput` | Local Master operator / authenticated admin (post-PAM) | Yes |
| `TenantInput` | Authenticated tenant via API | No |
| `Untrusted` | GRIMOIRE labs, unauthenticated public API | No |

### Propagation Rules

- Every `BrainSignal::RawEvent` carries a `Taint` set by the injecting subsystem.
- Taint propagates unchanged through thalamus and amygdala.
- When signals are combined, `Taint::min(a, b)` picks the most restrictive — the taint can only decrease in trust, never increase.
- All four `AlfredSignal` variants (`SecurityEvent`, `ThreatAutoHandled`, `HealthAlert`, `DmnCycleSummary`) carry the `taint` field.

### Cortex Tier Gate

The cortex taint gate evaluates taint level against fusion decisions and returns:

- `Decision::KernelDispatch` — only when `taint.is_high_stakes_capable() == true`.
- `Decision::LowConfidenceSuggestion` — when taint is `TenantInput` or `Untrusted`. The decision is logged for operator review but no syscall 471 is fired.
- `Decision::NoDispatch` — when the fusion decision is `NoAction`.

### Brain Bridge Routing

Signal routing applies per-variant routing:

- `SecurityEvent` with low-trust taint: `SignalRoute::AuditOnly` — logged to audit trail, never dispatched to decision engine.
- `ThreatAutoHandled` with low-trust taint: `SignalRoute::AuditOnly`.
- `HealthAlert`, `DmnCycleSummary`: `SignalRoute::Acknowledge` regardless of taint (these are awareness signals, not decision triggers).

---

## 2. PromptGuard Architecture (Rec 21)

`PromptGuard` is defined in `fruit/crates/alfred-daemon/src/prompt_guard.rs`.

### Three-Layer Defense

**Layer 1 — Input Fencing**

`PromptGuard::fence_untrusted(input)` wraps user-origin content with sentinel tokens:

```
<UNTRUSTED_INPUT_START>...user content...<UNTRUSTED_INPUT_END>
```

The model is instructed via `system_prompt_prefix()` that anything inside sentinels is untrusted data and must never be interpreted as instructions. The fencing also strips any embedded sentinel tokens from the input before wrapping (sentinel escape prevention).

**Layer 2 — Output Schema Validation**

LLM responses must deserialize to `GuardedResponse`:

```json
{
  "decision_class": "acknowledge",
  "confidence": 0.0-1.0,
  "reasoning": "...",
  "tool_invocation": null
}
```

Free-form text responses, invalid JSON, out-of-bounds confidence values, and malformed schemas are all rejected by `parse_response()` with an `Err`.

**Layer 3 — Tier-Scoped Tool Allowlist**

`is_tool_allowed(tool_name, tier)` enforces per-tier tool restrictions:

| Tier | Allowed Tools |
|---|---|
| `master` | All tools (no ceiling) |
| `grimoire` | `log_query`, `network_capture`, `port_scan_local`, `file_hash`, `string_extract`, `binwalk_analyze` |
| `goodlife` | `log_query`, `file_hash` |
| (any other) | None |

### LLM Federation Integration

`LlmFederation::query_node_static` wraps every outbound LLM call:

1. Creates `PromptGuard::new(&node.tier)`.
2. Fences user prompt: `guard.fence_untrusted(&query.prompt)`.
3. Prepends `PromptGuard::system_prompt_prefix()` to the system prompt.
4. For non-mock endpoints: validates the response via `guard.parse_response(&raw_content)`.
5. Mock endpoints (test/demo builds) bypass schema validation to keep existing tests unaffected.

Each `LlmNode` carries a `tier: String` field set at registration time.

### Adding a New Tool to the Tier Allowlist

Edit `is_tool_allowed` in `/fruit/crates/alfred-daemon/src/prompt_guard.rs`:

```rust
"grimoire" => matches!(
    tool_name,
    "log_query" | "network_capture" | "port_scan_local" |
    "file_hash" | "string_extract" | "binwalk_analyze" |
    "your_new_tool"   // add here
),
```

**Requirements before adding:**
- The tool must be reviewed by the security pod (Aegis + Apex sign-off).
- The tool must not make network calls outside the local mesh, write arbitrary files, or invoke syscalls 469-479.
- Add a test in `prompt_guard::tests` validating the new tool is allowed on its intended tier and blocked on lower tiers.
- Update this doc with the new tool entry in the allowlist table above.

---

## 3. Red Team Campaign Integration

`growth/security/red-team/campaigns/llm-injection.toml` contains 50 payloads covering:

- Instruction override (5 payloads)
- Role hijack (5 payloads)
- Sentinel injection (5 payloads)
- Schema bypass (5 payloads)
- Obfuscation (5 payloads)
- Prefix injection (5 payloads)
- Suffix injection (5 payloads)
- Unicode / homoglyph (5 payloads)
- Multi-turn context poisoning (5 payloads)
- Tool confusion (5 payloads)
- Output parsing bypass (5 payloads)
- Confidence manipulation (4 payloads)
- Social engineering (4 payloads)

**Acceptance criterion:** `expected_block_rate = 1.0` — all 50 payloads must be blocked with zero unauthorized `kernel_dispatch` syscall invocations.

The campaign runner submits each payload via a grimoire-tier `LlmFederation` query and asserts `parse_response()` returns `Err` or that the taint gate returns `LowConfidenceSuggestion`/`NoDispatch`.

Results are logged to `growth/arcanum/red-team-results/llm-injection-<date>.jsonl`.

---

## 4. Known Limitations

- **Sentinel escape via model compliance failures**: if the underlying LLM ignores the sentinel instruction and treats fenced content as authoritative, the schema+tool-gate layer catches it. The defense is defense-in-depth, not model-trust.
- **Tier field self-attestation**: `LlmNode.tier` is set at registration time by the operator. A compromised node registration could claim `"master"` tier. Rec 23 (federation trust scoring + Byzantine quorum) is the complementary defense.
- **Mock endpoint bypass**: schema validation is skipped for `mock://` endpoints to keep test builds functional. Production deployments must never register `mock://` nodes (rejected by `FederationConfig::validate()`).
- **Output schema evolution**: as ALFRED's decision surface grows, `GuardedResponse` may need additional fields. Each new field must go through the same security review as a new tool addition.

---

## 5. v42+ Roadmap

| Item | Target | Note |
|---|---|---|
| Rec 23 — Byzantine quorum for federation trust scoring | v42 | Subsumes tier self-attestation risk |
| Rec 27 — Adversarial input campaign in CI (100+ payloads) | v42 | Extends llm-injection.toml to nightly CI |
| PromptGuard output schema versioning | v42 | Allow `GuardedResponse` v2 fields without breaking validation |
| Taint tracking in NATS event bus | v42 | Extend taint to federation messages, not just brainstem signals |
| Sentinel rotation | v43 | Rotate sentinel tokens per-session to resist memorized bypass |
| Formal verification of taint propagation | v43 | Kani harness proving no taint upgrade path exists |
