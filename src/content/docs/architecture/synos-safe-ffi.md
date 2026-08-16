# synos-safe-ffi — synos-safe-ffi

**Classification:** PUBLIC
**Crate:** `fruit/crates/synos-safe-ffi/`
**Milestone:** v0+
**License:** Apache-2.0

## What It Is

`synos-safe-ffi` is a Syn_OS crate providing core functionality.

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `SafetyAnnotation` | `SafetyAnnotation` module |
| `SafetyDocInventory` | `SafetyDocInventory` module |
| `new` | `new` module |
| `add_annotated` | `add_annotated` module |
| `add_unannotated` | `add_unannotated` module |
| `coverage_pct` | `coverage_pct` module |
| `report` | `report` module |
| `SafetyReport` | `SafetyReport` module |
| `ForgetfulStore` | `ForgetfulStore` module |
| `StoredEntry` | `StoredEntry` module |

### How It's Wired

1. **Internal** — self-contained crate

## Future Ideas

1. Expand module coverage and integration points
