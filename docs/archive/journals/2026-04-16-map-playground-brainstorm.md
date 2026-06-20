# Map Playground Brainstorm Session

**Date**: 2026-04-16
**Component**: Development Tools / Arena Map Editor
**Status**: Planned

## What Happened

Defined architecture for a new visual map editor tool to replace manual TypeScript config editing for arena biome layouts. The tool will allow designers to click-place 3D assets, adjust properties, and generate `BiomeConfig` code for immediate use.

## Key Decisions

- **Location**: Standalone Vite tool at `tools/map-playground/` (port 5175)
- **Interaction Model**: Click-to-place with ghost preview, properties panel for xyz/scale/rotation
- **Output**: BiomeConfig TypeScript object (copy-paste into `arena-biome-config.ts`)
- **Tech**: React Three Fiber 9, Three.js 0.182, Leva, r3f-vfx, Zustand (copied from vfx-playground)
- **VFX Integration**: Embed atmospheric VFX panel; extend BiomeConfig with optional `atmosphericVFX` field
- **Asset Serving**: Vite plugin with `/api/asset-manifest` endpoint + `/game-assets/*` route

## Why This Matters

Currently arena configs are hand-coded numbers. This eliminates guesswork and visual iteration cycles, letting mapmakers work directly in 3D space. Pattern borrowed from vfx-playground reduces dev friction.

## Unresolved

- GLB thumbnail previews (icon-only for MVP)
- Load existing configs for editing (deferred)
- Undo/redo scope

**Report**: `d:/WORLDCOLIDE/plans/reports/brainstorm-260416-2227-map-playground.md`
