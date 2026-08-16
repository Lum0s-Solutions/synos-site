---
title: synos-actor — Active-inference planner that minimizes prediction error over the world-model (F3.3/A3)
description: synos-actor — Active-inference planner that minimizes prediction error over the world-model (F3.3/A3)
---

# synos-actor — Active-inference planner that minimizes prediction error over the world-model (F3.3/A3)

**Classification:** PUBLIC
**Crate:** `fruit/crates/synos-actor/`
**Milestone:** v0+
**License:** Apache-2.0

## What It Is

`synos-actor` Active-inference planner that minimizes prediction error over the world-model (F3.3/A3).

## Architecture

### Modules

| Module | Purpose |
|--------|---------|
| `WorldState` | `WorldState` module |
| `Action` | `Action` module |
| `WorldModel` | `WorldModel` module |
| `new` | `new` module |
| `add_state` | `add_state` module |
| `add_action` | `add_action` module |
| `observe` | `observe` module |
| `plan` | `plan` module |
| `execute` | `execute` module |
| `current_belief` | `current_belief` module |

### How It's Wired

1. **`synos-task-engine`** — dependency integration

## Future Ideas

1. Expand module coverage and integration points
