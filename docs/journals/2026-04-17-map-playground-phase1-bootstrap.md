# Map Playground Phase 1: Vite Bootstrap Complete

**Date**: 2026-04-17
**Component**: Tools / Map Playground (`tools/map-playground/`)
**Status**: Phase 1 Done — Server running, API verified

## What Was Built

Bootstrapped `tools/map-playground/` as standalone Vite 8 app on port 5175, separate from vfx-playground (5174).

**Custom Vite plugin** handles two routes:
- `/api/asset-manifest` — scans `public/arena/` + `public/tiles/` at startup, returns categorised JSON tree (props3D, tiles, bgLayers, dioramas)
- `/game-assets/*` — streams files from `../../public/` with path traversal guard (`full.startsWith(PUBLIC_ROOT + sep)`)

**Verified output from `/api/asset-manifest`:**
- cave 3D props: 9 GLBs, forest 3D props: 8 GLBs
- tiles: 6 GLBs
- cave bg layers: 3 PNGs, forest bg layers: 4 PNGs
- dioramas: 2 GLBs (groundcave + forestground)

Cold start: **421ms** (well under 5s target).

## Key Decision: Version Pinning

Plan spec said `vite ^6`, `@vitejs/plugin-react ^4`, `@react-three/drei ^9`. Used monorepo root versions instead: **vite ^8**, **plugin-react ^6**, **drei ^10**.

Why: monorepo consistency > dated spec. Separate `node_modules` in `tools/map-playground/` so no conflict risk, but aligning majors avoids future upgrade pain when phases 2–4 pull in shared patterns from the main app.

## File Structure

```
tools/map-playground/
├── package.json        (react 19 / three 0.182 / zustand v5 / leva)
├── tsconfig.json       (mirrors vfx-playground config)
├── vite.config.ts      (game-assets plugin, port 5175, publicDir: false)
├── index.html
└── src/
    ├── main.tsx
    ├── app.tsx         (3-col shell: 260px | 1fr | 300px)
    ├── ui/styles.css
    └── store/scene-store.ts  (Zustand stub — PlacedProp, BgLayerConfig, LightingConfig)
```

## Next

Phase 2: R3F canvas + OrbitControls + camera setup in the center viewport.
