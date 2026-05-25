# Map Playground Tool: Phases 3-10 Complete

**Date**: 2026-04-17 14:30
**Severity**: Low (feature delivery)
**Component**: tools/map-playground + game integration
**Status**: Resolved

## What Happened

Shipped phases 3–10 of the Map Playground editor tool without breaking the main game build. The tool now provides full scene authoring: asset browsing, property manipulation, atmospheric VFX, lighting control, and code generation that produces valid BiomeConfig TypeScript. Both the tool and game compile clean (0 errors, tsc --noEmit).

## The Technical Reality

This was a feature sprint with no major failures, which felt weird after the R3F setup pain. The modularization strategy paid off immediately: splitting the Zustand store into three 200-LOC files (scene-types, history-helpers, scene-store) meant each phase could touch one concern without cascading rewrites. Undo/redo history (50 entries, Ctrl+Z/Y) materialized in one afternoon because the architecture already assumed immutable state updates.

The real friction point wasn't code complexity—it was library expectations. Leva 0.10.x doesn't support top-level onChange in schema configs; you have to capture the return value from useControls and wire it through useEffect. That cost 30 minutes of debugging slider updates silently failing. Similarly, r3f-vfx exports Blending as numeric literals, not THREE.Blending enum values, which broke initial light calculations until we matched the types exactly.

One design decision that proved solid: slider UX split into updatePropLive (immediate visual feedback, no history) and commitPropUpdate (onPointerUp → history entry). This killed the undo spam problem where a single drag created 50 history entries. Released feels fluid now.

## What Surprised

The BiomeConfig code generator was trivial—just walk the scene tree and stringify. Expected more edge cases around serializing VFX parameters, but the r3f-vfx preset system kept things simple. The backward-compatibility layer for existing BiomeConfigs (new AtmosphericVFXPlacement field is optional) required exactly zero refactoring in the game.

## Lessons

Modular store architecture scales. Library quirks (Leva, r3f-vfx) cost more than algorithmic complexity if you guess wrong. Test compiler output, not just runtime behavior—caught type mismatches early because tsc was strict.

## Next Steps

None blocking. Tool is production-ready for level design iteration. Designers can now build arena dioramas without touching code.
