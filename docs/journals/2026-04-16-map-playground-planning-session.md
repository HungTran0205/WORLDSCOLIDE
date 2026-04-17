# Map Playground Dev Tool: Planning Session & Approach Selection

**Date**: 2026-04-16 14:30
**Severity**: Medium
**Component**: Tools / Map Playground (`tools/map-playground/`)
**Status**: Planning Complete — Ready for Phase 1 Implementation

## What Happened

Completed day-long planning session for **Map Playground**, a visual combat arena editor tool that lets designers place 3D props, background layers, atmospheric VFX, and lighting without touching code. The tool generates TypeScript code that pastes directly into `arena-biome-config.ts`.

This is a critical blocker for the Guild Hall VFX polish work — designers need a fast feedback loop to iterate on arena aesthetics without waiting for code reviews.

## Key Decisions Made

### 1. UI Approach: Click-to-Place + Properties Panel (Approach B)
**Rejected alternatives:**
- Pure Leva controls (too abstract for spatial placement)
- Full gizmo editor with transform handles (overengineered for MVP, browser WebGL stability concerns)
- Drag-and-drop asset palette (requires collision detection overhead)

**Chosen:** Click on canvas to place asset from browser → ghost preview appears → drag to position → properties panel adjusts xyz/rotation/scale. Familiar Three.js pattern, proven in vfx-playground.

### 2. Architecture: Port 5175 (Standalone Vite App)
- **NOT embedded in main game** — separate dev server like vfx-playground (port 5174)
- **Code reuse**: Exact same asset manifest plugin pattern from vfx-playground
- **No monorepo refactoring** — tool-specific imports keep the build clean
- **Design decision**: Isolation prevents accidental dependency bloat in main game bundle

### 3. Undo/Redo: Zustand History Snapshots
- Cap at 50 state snapshots (memory/performance tradeoff)
- Full serialization on each action (simple, immutable)
- **Not deferred** — essential UX for spatial editing
- Fallback: localStorage auto-save every 10 seconds

### 4. Asset Browser: Icon + Filename Only
- **No thumbnails in MVP** — would require mesh previewing, which adds complexity
- Use game asset directory icons/metadata already available
- Post-MVP: lazy-loaded 3D thumbnails via WebWorker if needed

### 5. No Multi-Select (Post-MVP)
- Single-select model in v1 keeps code generation simple
- Multi-select requires group transforms + serialization complexity
- Deferred to Phase 11 (post-launch optimization)

### 6. BiomeConfig Extension: Backward Compatible
```typescript
interface BiomeConfig {
  // ... existing fields ...
  atmosphericVFX?: AtmosphericVFXPlacement[];  // Optional, gracefully ignored by old code
}
```
- Extend type in `src/scene/arena-biome-config.ts`
- Maintains forward/backward compatibility
- **Decision**: Optional field prevents breaking existing CAVE_CONFIG, FOREST_CONFIG exports

## The Brutal Truth

This planning felt like a necessary evil. We spent 8 hours designing a tool to save 2 minutes per arena iteration. But that math changes with scale: 50+ arenas × 20 iterations each = 2000 minutes of designer time saved. The friction of code-edit-rebuild-test was genuinely killing iteration velocity.

What stung: We almost built Approach C (full gizmo transform controls) before realizing the browser WebGL perf hit would kill responsiveness with complex meshes. Dodged a 3-week timesink.

The relief: `vfx-playground` already exists and works. We're not inventing wheels—just extending the pattern. Copy-paste 80% of the codebase, adapt the data model.

## Technical Details

**Stack Replication from vfx-playground:**
- Vite (dev server on 5175)
- React + React Three Fiber
- Zustand (state management)
- Leva (lighting controls panel only — not for prop placement)
- Custom asset manifest plugin (serves game-assets/ over HTTP)

**Critical Dependency:**
- r3f-vfx 0.6.0 (confirmed WebGPU-compatible in Phase 1 spike for guild-hall)
- Three.js raycaster for canvas click detection

**Source of Truth:**
- `src/scene/arena-biome-config.ts` → BiomeConfig type definition
- `CAVE_CONFIG`, `FOREST_CONFIG` → existing implementations to learn from
- Game asset loader pattern from main game (`useAsset` hook)

## What We Tried

1. **Approach A: Pure Leva UI** — Rejected. Too abstract for placement. Designers couldn't visualize spatial relationships without 3D preview.

2. **Approach C: Full Gizmo Transform Editor** — Rejected. Prototyped transform handles in Three.js; caused WebGL context thrashing with 20+ props. Browser would stall on complex scenes. Not worth the perf debt.

3. **Approach B: Click-to-Place + Panel** — **CHOSEN**. Matches vfx-playground pattern, proven perf, familiar UX.

## Root Cause Analysis

Why did we spend so long planning?

The real issue: We didn't have a clear constraint on complexity. Early designs tried to solve "what if designers want multi-select group transforms?" and "what if we need custom VFX blend modes?" before even validating the single-select model works.

**The Fix**: Ruthless MVP scope definition. Write it down. Commit to it. Post-MVP deferral is OK if documented.

**Why this matters**: Scope creep in dev tools is insidious because "it's just for internal use" feels low-risk. But it compounds: a 3-week tool that was supposed to take 1 week means 3 phases of main game work get delayed.

## Lessons Learned

1. **Pattern reuse saves weeks**: vfx-playground pattern is battle-tested. We should've cloned it on day 1, not spent 4 hours designing from scratch.

2. **Browser perf constraints are real**: Transform handles sounded cool until we hit the wall. Test performance assumptions early (WebGL context limits, raycaster overhead with complex meshes).

3. **Backward compatibility isn't free, but it's worth it**: Optional fields in BiomeConfig add <5 lines. Skipping them would require migration code later—not worth the savings.

4. **UI pattern matters more than tech stack**: The vfx-playground pattern (click-to-place, properties panel) works because it matches designer mental models. Don't optimize away the UX because the tech is "cleaner."

5. **Undo/redo is non-negotiable for creative tools**: Designers expect it. Zustand history isn't fancy, but it's reliable. The 50-snapshot cap is a reasonable tradeoff (10 minutes of work compressed).

## Next Steps

**Immediate (Phase 1):**
1. Clone vfx-playground structure into tools/map-playground/
2. Adapt asset manifest plugin for arena props
3. Implement ortho camera (35° angle) + floor plane raycaster
4. Start Phase 2 implementation (Phase 1 is 1-day scaffold work)

**Timeline:**
- Estimated: 7.5 days (10 phases, ~4.5-8 hours per phase depending on VFX complexity)
- Bottleneck: Phase 7 (VFX panel) — needs r3f-vfx atmospheric preset integration + visual testing
- Risk: Phase 5 (parallax backgrounds) may need custom shader work if Babylon parallax material doesn't port cleanly

**Ownership:**
- Implementation: Lead (map-playground dev tool is critical path, can't afford hand-offs)
- Testing: Delegate to tester agent for Phase 9-10 integration tests (main game biome-config injection)

**Success Criteria:**
- Designers can place 20 props, save config, paste TypeScript into arena-biome-config.ts, run game—arena renders identically
- Code generator output is human-readable (no minified/obfuscated strings)
- Undo/redo works across all 10 phases without data loss

## Unresolved Questions

- **WebWorker for Asset Loading**: Should asset manifest plugin use a worker to prevent main thread blocking? (Deferred: test first, optimize if perf issue emerges)
- **Background Layer Parallax**: What blend modes do we need? (Start with simple depth-based parallax, iterate based on designer feedback)
- **VFX Atmospheric Presets**: Should we ship with cave-ember, fog-mist, forest-spore, dust-motes? (Yes, but add config UI to customize parameters post-MVP)
- **Auto-Save Frequency**: localStorage every 10 seconds or 30? (Test user behavior, start with 10s, lower if it causes thrashing)
