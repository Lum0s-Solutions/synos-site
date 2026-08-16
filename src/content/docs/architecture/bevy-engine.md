# synos-bevy

> **Status: TABLED (2026-07).** GRIMOIRE's front-end has pivoted from this Bevy 0.14 3D client
> to a pure terminal TUI, **`grimoire-tui`** (a second front-end binary in the
> `synos-gamification` crate, built on the Bevy-free engine core). `synos-bevy` is excluded from
> workspace resolution and is not part of the shipping build. This page is retained as a record
> of the tabled 3D work; for the current GRIMOIRE front-end see
> [`grimoire.md`](./grimoire.md) and [`gamification.md`](./gamification.md).

**Version**: v111.0.0 "Last Light"
**Source**: `fruit/crates/synos-bevy/`
**LOC**: 7,129
**Bevy version**: 0.14.2 (pinned)
**Plugins**: 7
**Target hardware**: Intel HD 4400 integrated GPU (build oracle)

---

## Overview

`synos-bevy` is the Rust crate that powers the GRIMOIRE desktop
experience. It is a full Bevy-based application embedded in the
Syn_OS distribution: 7,129 lines of code across seven plugins that
together provide cutscenes, a 3D knowledge mindmap, a CRT post-process
filter, a virtual cyberspace exploration layer, a Fallout-style skill
tree, three faction HQ hubs, and a Westworld-inspired 3D system
monitor.

The crate is not a library in the conventional sense — it does not
expect to be consumed by other Rust code in the normal way. It is a
self-contained application that ships as an XDG autostart binary on
installed systems, and can also be launched on demand by the
`grimoire-daemon ui` subcommand.

This page describes the architecture: the seven plugins, their
shared state, the rendering pipeline, and the integration seams with
the rest of GRIMOIRE. For the student-facing user guide, see
[`user-guide/grimoire-guide.md`](../user-guide/grimoire-guide.md).

---

## Bevy version

synos-bevy is pinned to Bevy 0.14.2 and will not compile against
0.16 or newer without substantial rework. The reason is the
retrofit filter plugin, which uses a manual render pipeline to
composite its four WGSL shaders (scanlines, screen curvature,
chromatic aberration, phosphor glow) over the main camera output.

Bevy 0.15 introduced `FullscreenMaterial`, which is the idiomatic
way to do a fullscreen post-process in modern Bevy. 0.16 made
`FullscreenMaterial` the only supported path by removing the
underlying `Pipeline::specialize` hook that the manual pipeline
relied on. Porting the filter plugin to `FullscreenMaterial` is a
planned v36 work item.

Until the port happens, pinning to 0.14.2 is a correctness choice,
not a preference. Attempting to upgrade the Cargo.toml without
doing the port produces a compile error at the first use of the
manual pipeline machinery.

---

## Source layout

```
fruit/crates/synos-bevy/
├── Cargo.toml             # Bevy 0.14.2 + feature gates
├── src/
│   ├── lib.rs             # SynOsBevyPlugin aggregator
│   ├── plugins/
│   │   ├── cutscene.rs    # 1,007 LOC — narrative cutscenes
│   │   ├── mindmap.rs     # 890 LOC — 3D knowledge graph
│   │   ├── retro_filter.rs# 509 LOC — CRT post-processing
│   │   ├── cyberspace.rs  # 716 LOC — virtual-world exploration
│   │   ├── skills.rs      # 702 LOC — skill tree
│   │   ├── faction_hq.rs  # 1,290 LOC — faction HQ environments
│   │   └── rehoboam.rs    # 659 LOC — 3D sphere system monitor
│   └── ...
├── shaders/
│   ├── retro_scanlines.wgsl
│   ├── retro_curvature.wgsl
│   ├── retro_chroma.wgsl
│   └── retro_phosphor.wgsl
└── examples/
    └── ...                # Individual plugin demos
```

The top-level `lib.rs` defines `SynOsBevyPlugin`, a Bevy
`Plugin` impl that aggregates the seven child plugins and
conditionally adds them based on cargo feature flags. Each child
plugin is behind its own feature, so profile-specific builds can
include or exclude individual plugins.

---

## The seven plugins

### CutscenePlugin — `plugins/cutscene.rs` (1,007 LOC)

The cutscene plugin drives the narrative sequences that introduce new
students to each lab category, unlock faction storylines, and mark
milestone achievements. Cutscenes are authored as RON-format scripts
in `fruit/core/labs/cutscenes/` and loaded asynchronously at runtime
so that the UI stays responsive while a large cutscene is being
parsed.

The plugin implements a small interpreter over the script format: a
cutscene is a sequence of timed events (dialogue, camera moves,
entity spawns, effect triggers, audio cues). The interpreter
advances the current event on a fixed 16.67 ms tick and emits Bevy
events for the rendering systems to consume.

Key components:

- `CutsceneState` — a resource holding the active cutscene, current
  event index, and typewriter-text progress.
- `CutsceneDialogueUi` — the typewriter-text rendering system, which
  reveals one character per frame at a configurable speed.
- `CameraChoreography` — a system that animates the camera along
  the `CameraMove` events in the active cutscene using a catmull-rom
  spline for smooth transitions.

Cutscenes can be triggered from anywhere in the game (including from
GRIMOIRE lab completion events) by sending a `PlayCutscene(name)`
event.

### MindmapPlugin — `plugins/mindmap.rs` (890 LOC)

The mindmap plugin is a 3D knowledge graph that the student can
browse, edit, and save. Nodes represent concepts (GRIMOIRE
categories, MITRE ATT&CK techniques, CVE categories, research
topics); edges represent learned relationships between them.

The layout is force-directed — nodes push each other apart, edges
pull connected nodes together, and the graph settles into a
stable shape over a few hundred simulation ticks. The simulation
is deterministic given a fixed seed, so mindmaps re-open in the
same shape they were closed in.

Persistence is RON on disk, written to
`~/.config/synos/mindmap.ron`. The plugin autosaves every thirty
seconds by default, and also on explicit user request. RON was
chosen over JSON because it supports Rust-native enums (for the
node and edge type tags) without needing a custom serde adapter.

### RetroFilterPlugin — `plugins/retro_filter.rs` (509 LOC)

The retro filter is a fullscreen CRT post-process that composites
four WGSL shaders over the main camera output:

1. **Scanlines** (`retro_scanlines.wgsl`) — horizontal lines at a
   configurable interval and strength, simulating the scan pattern
   of a CRT electron beam.
2. **Curvature** (`retro_curvature.wgsl`) — a fragment-level screen
   distortion that bends the corners outward, simulating the
   physical curvature of a CRT glass tube.
3. **Chromatic aberration** (`retro_chroma.wgsl`) — a small RGB
   channel offset that looks like the colour fringing you get on
   cheap lenses and old monitors.
4. **Phosphor glow** (`retro_phosphor.wgsl`) — a gaussian bloom
   tinted toward green/amber to simulate phosphor persistence.

The filter is optional — it can be toggled at runtime via a key
binding or a menu option — but it is enabled by default on the
GRIMOIRE profile because it sets the visual tone for the whole
experience. On integrated GPUs the filter costs roughly 3 ms of
GPU time per frame, which is just inside the 16.67 ms budget for
60 FPS.

The manual render pipeline that hosts these shaders is the reason
the crate is pinned to Bevy 0.14.

### CyberspacePlugin — `plugins/cyberspace.rs` (716 LOC)

Cyberspace is a virtual-world exploration layer modeled loosely on
TRON and early cyberpunk fiction. The player avatar moves through
a 3D grid of glowing lines, with particle effects representing
data flows between nodes. It is primarily used as the transition
space between labs and as the backdrop for certain cutscenes.

The plugin implements a simple first-person controller, animated
grid lines that pulse to match the game's background music, and
particle systems that emit at grid intersections. Performance is
bounded by keeping the grid extents small (the player can walk
to the edge in about thirty seconds) and by using billboard
quads for particles rather than full 3D meshes.

### SkillTreePlugin — `plugins/skills.rs` (702 LOC)

The skill tree is the Fallout 4-style perk chart that students
progress through by completing GRIMOIRE labs. It has five primary
attributes — Endurance, Intellect, Agility, Cunning, Resolve —
displayed as a pentagon with the current value on each axis, and
a branching tree of perks gated on the attribute values.

Progress is persisted to `~/.config/synos/player.json` alongside
XP and faction alignment. The plugin reads the current state on
startup and subscribes to lab completion events from the rest of
the game to update XP and trigger level-up animations.

The skill tree also drives the skillgate feature on public
profiles: tools like Metasploit are locked until the student has
reached a threshold Cunning value, which requires completing
labs that teach the tool's safe use. See
[`iso-profiles.md`](./iso-profiles.md) for how the skillgate
interacts with the profile system.

### FactionHQPlugin — `plugins/faction_hq.rs` (1,290 LOC)

The largest plugin by LOC. It defines three faction HQ
environments — one per faction in the GRIMOIRE narrative — each
with its own 3D scene, NPC placements, mission boards, and
reputation tracking.

Each HQ is a self-contained Bevy scene: a set of static meshes
for the architecture, a set of NPC entities with associated
dialogue trees, and a mission board entity that reads from the
current lab catalog and surfaces available missions to the
player. Switching HQs is a scene swap rather than a full app
restart.

Reputation is tracked per faction in a `FactionReputation`
resource and is persisted alongside player state. Reputation
affects NPC dialogue, unlock gates for faction-specific labs,
and the colouring of the mindmap plugin's edges when displaying
faction-adjacent concepts.

### RehoboamPlugin — `plugins/rehoboam.rs` (659 LOC)

Rehoboam is a 3D sphere system monitor modeled on the
Westworld computer of the same name. It projects live system
metrics — CPU usage, memory, network I/O, process counts —
onto a rotating sphere as animated shader effects. High CPU
shows as glowing red bands; high memory shows as dense mesh
distortions; network activity shows as arcs between points on
the sphere.

It is the heaviest plugin by GPU cost. It uses a level-of-detail
system that reduces the mesh density and effect count when the
frame time drifts above the 16.67 ms budget, which keeps it
running at 60 FPS on the Intel HD 4400 target even under heavy
system load.

The metric source is `sysinfo` crate readings, polled once per
second on a background task and pushed into a shared resource
that the rendering systems consume.

---

## Feature gates

Each plugin is behind its own cargo feature in the crate's
`Cargo.toml`:

```toml
[features]
default = ["cutscene", "mindmap", "retro_filter", "cyberspace",
           "skills", "faction_hq", "rehoboam"]

cutscene = []
mindmap = []
retro_filter = []
cyberspace = []
skills = []
faction_hq = []
rehoboam = []
```

The default set includes all seven plugins. Profile-specific
builds can override the default and include a subset. The
master profile ships the full set. The grimoire profile ships
the full set (the game experience is the entire point of the
public release). The goodlife profile ships a subset focused on
research visualization — typically `mindmap`, `rehoboam`, and
`retro_filter` — with the cutscene, cyberspace, skill tree, and
faction HQ plugins disabled because they do not fit the
research-oriented user experience.

Which features are enabled for a given profile is set by the
ISO build pipeline's stage that compiles synos-bevy, not by the
profile TOML — at least at present. Moving the feature set into
the profile TOML is on the v35 cleanup list.

---

## Entry point

`src/lib.rs` defines `SynOsBevyPlugin`, a `bevy::prelude::Plugin`
impl that conditionally adds each child plugin based on the cargo
features:

```rust
pub struct SynOsBevyPlugin;

impl Plugin for SynOsBevyPlugin {
    fn build(&self, app: &mut App) {
        #[cfg(feature = "cutscene")]
        app.add_plugins(cutscene::CutscenePlugin);

        #[cfg(feature = "mindmap")]
        app.add_plugins(mindmap::MindmapPlugin);

        #[cfg(feature = "retro_filter")]
        app.add_plugins(retro_filter::RetroFilterPlugin);

        #[cfg(feature = "cyberspace")]
        app.add_plugins(cyberspace::CyberspacePlugin);

        #[cfg(feature = "skills")]
        app.add_plugins(skills::SkillTreePlugin);

        #[cfg(feature = "faction_hq")]
        app.add_plugins(faction_hq::FactionHQPlugin);

        #[cfg(feature = "rehoboam")]
        app.add_plugins(rehoboam::RehoboamPlugin);
    }
}
```

The binary that consumes this plugin is tiny:

```rust
fn main() {
    App::new()
        .add_plugins(DefaultPlugins)
        .add_plugins(SynOsBevyPlugin)
        .run();
}
```

Everything else happens inside the seven plugins.

---

## Persistence

The crate persists three kinds of state to `~/.config/synos/`:

| File | Format | Content | Owner plugin |
| ---- | ------ | ------- | ------------ |
| `player.json` | JSON | Level, XP, attribute values, perks | SkillTreePlugin |
| `mindmap.ron` | RON | Node list, edge list, node positions | MindmapPlugin |
| `events.jsonl` | JSONL | Append-only log of cutscene plays, level-ups, lab completions | Shared |

JSON was chosen for player state because it is human-editable if
the student ever needs to recover from a corrupted save. RON was
chosen for the mindmap because the file is large and benefits
from Rust-native enum support in the serializer. JSONL was
chosen for the event log because the append-only shape is
trivial to implement safely — each event is a single
`println!`-equivalent to an open file handle, with a
`sync_all` at the end of each frame.

The JSON and RON files are written through a temp-and-rename
path similar to the OTA state persistence: write to a sibling
tempfile, fsync, rename over the target. A mid-write crash
leaves the old save intact rather than producing a zero-length
file.

---

## Rendering pipeline

Most of synos-bevy uses Bevy 0.14's standard 3D pipeline — PBR
materials, dynamic directional lighting, shadow mapping at a
configurable resolution. The CRT filter is the exception: it
uses a manual pipeline that composites the four WGSL shaders over
the main camera's render target in a dedicated post-process node.

The WGSL shaders live in `shaders/` and are loaded at runtime by
the `AssetServer`. Hot-reloading is enabled, so a developer can
tweak a shader and see the result without restarting the game —
which matters a lot when iterating on the phosphor glow
parameters.

---

## Performance budget

The target hardware is the build oracle's Intel HD 4400
integrated GPU — a deliberately modest target chosen because it
represents the floor of what the project supports. Anything that
runs at 60 FPS on the oracle will run at 60 FPS everywhere the
project ships.

At steady state with all seven plugins active, the frame time on
the oracle is roughly:

| Component | Frame time |
| --------- | ---------- |
| Bevy core loop + scheduling | ~2 ms |
| 3D scene rendering (PBR + shadows) | ~4 ms |
| Retro filter post-process | ~3 ms |
| Rehoboam sphere (with LOD) | ~4 ms |
| UI + typewriter text | ~1 ms |
| Other plugins (mindmap, cutscene, etc.) | ~2 ms |
| **Total** | **~16 ms** |

That leaves just over a millisecond of slack under the 16.67 ms
budget for 60 FPS. Rehoboam's LOD system is the load-bearing
component here: when the frame time drifts past 16 ms, Rehoboam
reduces its mesh density and effect count until the budget is
met, at the cost of visual fidelity on the sphere.

---

## Integration with GRIMOIRE

synos-bevy is the visual layer of the larger GRIMOIRE system. Most
of the actual game logic — lab progression, boss contracts,
faction wars, the economy — lives in other crates, primarily
`synos-gamification`. The interface between them is a set of
shared events and a small number of shared resources:

- `LabCompletionEvent` — emitted by the lab runner when a
  student finishes a lab; consumed by the skill tree (for XP)
  and the cutscene plugin (to trigger unlock cutscenes).
- `FactionReputationChange` — emitted when an action changes
  a faction's opinion of the player; consumed by the faction
  HQ plugin (for dialogue branching) and the mindmap plugin
  (for edge colouring).
- `PlayerState` — a shared resource holding level, XP, and
  attribute values; read by every plugin that needs to know
  about progression.

synos-bevy runs as an XDG autostart desktop app on installed
systems, so it comes up automatically when the user logs in. It
can also be launched on demand from the GRIMOIRE daemon:

```bash
grimoire-daemon ui
```

This is the path used when the user minimizes the game and later
wants to bring it back without logging out.

---

## Testing

synos-bevy currently has zero `#[test]` markers in its source
tree. This is noted as a coverage gap in the v40 audit and is
scheduled for remediation in the v35 sprint. The remediation will
focus on:

- Component construction tests for each plugin (verifying that
  the correct component set is attached to a spawned entity)
- Event handling tests (sending a known event and asserting the
  expected state change)
- RON and JSON round-trip tests for the persistence files
- Golden-file tests for the cutscene script interpreter

The broader rendering path is hard to unit-test effectively — it
depends on the presence of a GPU, and Bevy does not yet have
first-class headless rendering support — so the v35 plan is to
cover everything except the raw rendering with unit tests and
leave the visual regression work for a later sprint.

---

## Related reading

- [`iso-profiles.md`](./iso-profiles.md) — how synos-bevy
  feature gates interact with ISO profiles
- [`user-guide/grimoire-guide.md`](../user-guide/grimoire-guide.md)
  — the student-facing guide to the GRIMOIRE experience that
  synos-bevy powers
