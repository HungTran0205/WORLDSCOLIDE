# HD-2D Atmospheric Depth — Phase 01 Foundation

**Date**: 2026-05-12 15:20  
**Severity**: Low (foundational, zero visual impact)  
**Component**: `src/scene/atmospheric/` (new module)  
**Status**: Resolved

## What Happened

Completed Phase 01 of the HD-2D atmospheric system: built the type-safe infrastructure for per-room atmospheric theming. Eight new files in `src/scene/atmospheric/`, three modifications to state and world setup. Everything compiles clean; all tests pass. The foundation is ready for Phases 02-05 to layer in actual visual effects.

## The Brutal Truth

This was a textbook smooth phase. No failed attempts, no debugging sessions, no architectural surprises. It's almost suspiciously clean—which is fine. Not every phase needs to be a struggle-narrative. Sometimes the plan works, and you just build what was promised.

## Technical Details

**Architecture locked in:**
- `RoomId` union: 9 rooms (guild-hall, main-hall, tavern, training-yard, infirmary, workshop, logging-site, stone-quarry, alchemy-lab)
- `AtmospherePreset` interface captures all tunable params: bloom, tilt-shift, DOF, color grading, vignette, noise, fog, god rays, particles, hemisphere light
- `useActiveRoomId()` selector derives room from `cameraTarget` position (no hysteresis edge cases—target is discrete)
- `useLerpedAtmosphere()` frame-independent lerp: numeric fields interpolate over ~500ms; discrete fields hard-swap at 0.5 progress
- Provider split into three files (`atmosphere-context-store.ts`, `atmosphere-context.tsx`, `use-atmosphere.ts`) due to `react-refresh/only-export-components` lint rule forbidding non-component exports from `.tsx`

**Test & lint validation:**
- `tsc --noEmit`: 0 errors
- `eslint src/scene/atmospheric/ src/game/state/...`: 0 warnings on new code
- `vitest run --dir src`: 99/99 pass
- `vitest run --dir tests`: 165/165 pass

## What We Tried

Built exactly as specified. No rework needed.

## Root Cause Analysis

N/A—no issues to analyze. Plan was well-scoped, phase boundaries were clear, and research had locked the approach. Implementation followed spec with only necessary deviations (context split, localStorage guard).

## Lessons Learned

1. **React-refresh + Context pattern**: When exporting both a context instance and a provider component from the same file, split into three files (store, component, hook) to satisfy ESLint. This is now a known pattern for the codebase.

2. **Derive state from goals, not live position**: Active room detection works cleanly because it's keyed off `cameraTarget` (discrete, goal-based) rather than `cameraPosition` (continuous, lerping). Avoids hysteresis logic entirely.

3. **Disable at provider level**: The code-reviewer caught that the initial provider called `useLerpedAtmosphere` unconditionally. Fixed by wrapping hooks inside the enabled-check. When disabled, provider = zero runtime cost (not just "effects disabled").

4. **Module load time guards for test compatibility**: `getStoredAtmospheric()` includes `typeof localStorage === 'undefined'` check because vitest runs in Node. Don't push browser APIs into module load; defer to component mount.

## Next Steps

Phase 02 (atmospheric post-stack) begins immediately. Consumers import `useAtmosphere()` and wire preset values into the post-processing composer. Phase 04 will tune preset values per room; Phases 03, 05 layer particles and lights respectively.

No blockers. No tech debt. Move forward.

---

**Status:** DONE  
**Summary:** Pure infrastructure phase completed on schedule. Nine-room atmospheric preset system type-safe and wired; zero visual change by design. All downstream phases unblocked.
