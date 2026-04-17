# Map Playground Phase 2: R3F Canvas + Ortho Camera

**Date**: 2026-04-17
**Component**: Tools / Map Playground (`tools/map-playground/src/scene/`)
**Status**: Phase 2 Done — Canvas live, diorama loading, camera verified

## What Was Built

Wired the R3F Canvas into the center viewport column with:
- **Ortho camera** `zoom:76, position:[0,7.5,15]` — exact match to `combat-arena.tsx` (plan had wrong values: `zoom:60, pos:[0,8.4,12]`)
- **Static cave preview** — `groundcave.glb` scale:12 y:-1 inside `<Suspense fallback={null}>`
- **Invisible floor plane** — captures `onPointerDown` for Phase 3 click-to-place
- **Stubs**: `PlacedProps` (returns null) and `ParallaxBg` (returns null) — Phase 3/5

Also added `"types": ["vite/client"]` to `tsconfig.json` for `import.meta.env.DEV`.

## Key Bug Fixed (code-review catch)

Code reviewer caught that `<primitive object={scene}>` with a cached `useGLTF` scene would silently reparent the shared Three.js object in Phase 3 when multiple components load the same GLB URL. Fixed with `<Clone object={scene}>` from drei — clones the scene graph safely without touching the loader cache.

**Rule for Phase 3+:** Every `useGLTF`-derived `<primitive>` must use `<Clone>` or `scene.clone(true)` + dispose on unmount. Establishing this now before `PlacedProps` implements it.

## Other Fixes Applied

- Removed `onPointerMove` stub (undecided behaviour that would break OrbitControls pan)
- Grid helper gated on `import.meta.env.DEV` (won't appear in builds)
- `<Suspense>` wrapper around `StaticCavePreview` handles async GLB load gracefully

## Camera Value Discovery

Plan spec had `zoom:60, position:[0,8.4,12]`. Actual game (`combat-arena.tsx:114`) uses `zoom:76, position:[0,7.5,15]`. Always verify against source — plan was written from memory/estimates.

## Files

```
src/scene/
├── arena-viewport.tsx   (R3F Canvas, camera, lights, floor, static preview)
├── placed-props.tsx     (stub — Phase 3)
└── parallax-bg.tsx      (stub — Phase 5)
```

## Next

Phase 3: Asset browser panel + click-to-place prop system (store `placeProp` action, ghost preview on hover, render `PlacedProps` from store).
