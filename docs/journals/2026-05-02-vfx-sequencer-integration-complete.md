# VFX Sequencer Integration — DAW-Style Skill Choreography Complete

**Date**: 2026-05-02 16:00
**Severity**: Medium
**Component**: tools/vfx-playground — Sequencer Mode + Integration
**Status**: Resolved

## What Happened

Integrated a DAW-style Skill Choreography Sequencer into tools/vfx-playground alongside the existing Effect Designer. Built from scratch across 7 phases with 15 new files in `src/sequencer/` and supporting components. Mode switcher tabs added to the app layout with zero regression in Effect Designer mode. TypeScript compile clean, all phases complete.

## The Brutal Truth

This was a **relief to finish**, not a struggle. The architecture patterns already existed (RAF-based playback from Effect Designer, WebGPU renderer setup), so we could focus purely on the sequencer logic without fighting infrastructure. The biggest decision was **not adding a new dependency** — we used `crypto.randomUUID()` instead of `nanoid` because the playground is intentionally minimal. That felt right: don't bloat a demo tool with extra packages.

The satisfaction here: **we built a working DAW timeline with real playback in 7 focused phases**. Clips scrub, drag, resize, delete. Add clips with right-click. All clip metadata persists in localStorage. Export generates play-and-drop React components. This isn't mock-up work; it's a functional mini-editor.

## Technical Details

### Core Architecture (4 files)

- **`sequence-types.ts`**: `TrackKind` union (7 types), `SequenceClip` (id, track, kind, start, duration, payload), `SkillSequence` container
- **`track-registry.ts`**: `TRACK_META` record mapping 7 track kinds to UI metadata (icon, color, description); `TRACK_KINDS` lookup table for clip subtypes (e.g., 'shake'|'zoom-in'|'zoom-out' for camera track)
- **`use-sequence-runtime.ts`**: RAF-based playback hook with `computeLiveClips()` filter. Scrubbing increments `remountGen` to force VFX remount when seeking backward.
- **`engine-adapters.ts`**: Context-based engine abstraction. `NoopEngineAdapter` for demo, `SkillEngineCtx` for game integration.

### Track Types (7 total)

| Track | Icon | Use | Payload |
|-------|------|-----|---------|
| vfx | ✨ | Particle/meshline preset | preset.id |
| motion | 🏃 | Target position path | easing type (linear/arc/sine/orbit/pingpong) |
| camera | 📷 | Shake/zoom/pan | intensity, freq, direction |
| time | ⏱️ | Hit-stop / slowmo | scale factor |
| flash | 💥 | Screen flash overlay | color, alpha |
| sfx | 🔊 | Sound effect trigger | sound key, volume |
| event | 📡 | Game event callback | onHit, onComplete, custom |

### UI Components (7 files)

- **`sequencer-layout.tsx`**: Top-level container. WebGPURenderer wrapper, Canvas setup mirrors Effect Designer pattern.
- **`timeline-daw.tsx`**: DAW-style timeline. Horizontal scroll, track header, clip bars. Left-click to select, drag to move, right-edge to resize. Right-click context menu to add/delete.
- **`clip-inspector.tsx`**: Right sidebar. Shows selected clip details (id, track, kind, payload fields). Inline edit for payload.
- **`skill-picker.tsx`**: Dropdown + CRUD buttons (new, duplicate, delete). Persists skill list to localStorage.
- **`sequence-renderer.tsx`**: Live preview. Renders active clips to the 3D canvas using existing `EffectRenderer` + custom adapters.
- **`export-dialog.tsx`**: Generates `.tsx` file. Uses `codegen.ts` to bake `SkillSequence` JSON into component code.
- **`skill-library.ts`**: Hook managing skill CRUD, localStorage serialization, import/export.

### Codegen Output

Generated `.tsx` components are **standalone and plug-and-play**:
- Import sequence JSON as const
- `useFrame` loop computes live clips each frame
- Fire engine callbacks (camera shake, hit-stop, sfx, flash, onHit event) based on clip track kind
- Integrate directly into game systems via `SkillEngineCtx` provider

Example:
```tsx
const SEQUENCE = { id: '...', clips: [...], duration: 2500 } as const
export function MySkill({ onHit, onComplete, autoPlay = true }) {
  const engine = useContext(SkillEngineCtx)
  // ...
}
```

### Mode Integration

- **App state**: `useState<AppMode>('effect' | 'sequencer')`
- **ModeTabs**: Top UI bar with `🎨 Effect Designer` | `🎬 Skill Sequencer` buttons
- **Layout branching**: `mode === 'sequencer' ? <SequencerLayout /> : <Effect Designer />`
- **Zero Effect Designer changes**: Old mode untouched, no regressions

## What We Tried

1. **nanoid for clip IDs**: Rejected—adds 4KB dep to playground. `crypto.randomUUID()` is native.
2. **Shared canvas between modes**: Rejected—each mode needs different setup (Effect Designer tweaks bloom per preset, Sequencer renders multiple clips). Separate Canvas instances are simpler.
3. **Live scrubbing without remount**: Rejected—VFX particles cache initial state. Scrubbing backward requires `remountGen++` to reset.

## Root Cause Analysis

Success here wasn't fighting fundamental problems; it was **applying proven patterns**. The RAF playback loop came from Effect Designer's prototype work. The WebGPU renderer async init was already in `layout.tsx`. The component generation strategy (bake JSON into output code) avoided runtime parsing overhead.

The real design choice: **use Context for engine abstraction, not props**. This lets generated components inject game-specific behavior (camera shake, SFX) without coupling to game code. `NoopEngineAdapter` in the playground means the sequencer runs standalone for previewing.

## Lessons Learned

1. **Mining existing patterns saves phases**: Don't invent new playback/rendering logic if you've solved it before. Copy the pattern, adapt the domain.
2. **Codegen outputs real code, not bytecode**: Baking `SkillSequence` JSON into `.tsx` components means exported skills run in the game loop with zero deserialization cost.
3. **localStorage for prototyping saves state round-trips**: Skill library persists automatically. No server, no API setup—just JSON serialization.
4. **Mode tabs > URL routing for switching**: Much simpler state management than route changes. App holds the mode, Layout branches on it.
5. **Test remounting during scrubbing early**: We caught this once—backward seek needs `remountGen++` to reset particle cache. Document for future maintainers.

## Next Steps

- **Phase 08**: Skill timeline templates (predefined arrangements for common attack patterns)
- **Phase 09**: Multi-select clips for batch drag/delete
- **Phase 10**: Keyboard shortcuts (space = play/pause, delete = remove, etc.)
- **Phase 11**: MIDI input for timeline sync (optional—nice-to-have)
- **Game Integration**: Hook `SkillEngineCtx` in game's skill system, wire up callbacks to actual camera/sfx/hit systems
- **Monitor**: Zero regressions in Effect Designer so far; keep CI green during game integration

**Owner**: Complete. Sequencer is production-ready for demo; game integration deferred to next work package.
