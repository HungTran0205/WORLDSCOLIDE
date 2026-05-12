---
title: "Atmospheric WebGPU TSL Parity"
description: "Bring HD-2D atmospheric post-stack (Vignette, ColorGrade, ACES, ChromAb, Tilt-Shift) to WebGPU via custom TSL nodes — DOF/GodRays stay WebGL-only."
status: pending
priority: P2
effort: 4d
branch: feature/WC-UI-GAME-POLISH
tags: [webgpu, tsl, postprocessing, atmospheric, hd2d]
created: 2026-05-12
---

## Goal

Close WebGPU parity gap in `atmospheric-webgpu-pass.tsx` (Bloom-only today) by adding five custom TSL nodes — Vignette, ColorGrade, ACES Tonemap, Chromatic Aberration, Tilt-Shift — plus a TSL fog node chained after Bloom, fed by the same `AtmospherePreset` already driving the WebGL stack. Removes the one-time parity warning in `world-atmospheric-post.tsx`.

**Fog scope added 2026-05-12:** A first attempt at fog via global `scene.fog` (Phase 04 follow-up patch on parent plan) was reverted because it broke r3f-vfx TSL particle compile pipeline on WebGPU. Fog must therefore route through the TSL chain (`fogNode` reading depth from `pass(scene, camera)`) rather than scene-level. Treat as Phase 03 companion effect (color + density both per-room from preset, lerps already wired in `use-lerped-atmosphere`).

## Non-Goals (explicit)

- **DOF on WebGPU** — needs depth-texture wiring; deferred to follow-up plan. Note: tilt-shift's masked blur can fake DOF on the orthographic camera with constant camera-to-room distance (Phase 02 of parent plan's rationale). Tracked, not planned here.
- **GodRays on WebGPU** — 100–150 LOC light-projection TSL shader; not worth the spike. Stays WebGL-only.
- **Noise (film grain)** — already covered visually by tilt-shift + bloom on WebGPU; not in scope.

## Reference Docs

- Researcher report: `d:\WORLDCOLIDE\plans\reports\researcher-260512-2035-webgpu-postprocessing-options.md`
- WebGPU current pass: `src/scene/atmospheric/atmospheric-webgpu-pass.tsx`
- WebGL composer (reference behavior): `src/scene/atmospheric/atmospheric-effect-stack.tsx`
- Renderer branch: `src/scene/atmospheric/world-atmospheric-post.tsx`
- Preset shape: `src/scene/atmospheric/atmosphere-types.ts`
- Tuned presets: `src/scene/atmospheric/atmosphere-presets.ts`
- TSL examples to mine: `node_modules/three/examples/jsm/tsl/display/*` + `https://threejs.org/examples/?q=webgpu+post`

## Phases

| ID | Title | Effort | Status | Depends |
|----|-------|--------|--------|---------|
| 01 | TSL pipeline scaffold + depth-spike | 0.5d | done | — |
| 02 | Vignette + ColorGrade nodes | 1d | done | 01 |
| 03 | ACES Tonemap node (chain tail) + TSL fog node | 0.75d | pending | 02 |
| 04 | Chromatic Aberration node | 0.5d | pending | 03 |
| 05 | Tilt-Shift node (Gaussian masked blur) | 1.5d | pending | 03 |
| 06 | Cross-renderer parity validation + perf | 0.5d | pending | 05 |

Total: 4.5 dev-days (within researcher's 3–4d estimate plus buffer).

## Key Risks (cross-phase)

- **TSL uniform binding pattern** — `bloomNode.strength.value = x` works for bundled nodes. For custom nodes use `uniform(float).value =` (mutable handle returned from `tsl.uniform()`). Phase 01 verifies pattern before all later phases adopt it.
- **Depth texture in TSL `pass()` on orthographic camera** — researcher Q3 open. Spike in Phase 01 (2–4h). If unavailable, locks in DOF-on-WebGPU non-goal permanently (acceptable). Tilt-shift doesn't need depth (uses screen-Y mask), so no blocker.
- **ACES must be last** — every phase adding an effect inserts BEFORE the tonemap node. File ownership rule below enforces single-chain owner.
- **Async module import races** — `atmospheric-webgpu-pass.tsx` already handles `cancelled` flag; Phase 01 preserves it.

## File Ownership (no parallel-phase collisions)

| File | Owning phase |
|------|--------------|
| `atmospheric-webgpu-pass.tsx` | All phases edit sequentially — never parallel |
| `tsl/vignette-node.ts` (new) | Phase 02 |
| `tsl/color-grade-node.ts` (new) | Phase 02 |
| `tsl/aces-tonemap-node.ts` (new) | Phase 03 |
| `tsl/chromatic-aberration-node.ts` (new) | Phase 04 |
| `tsl/tilt-shift-node.ts` (new) | Phase 05 |
| `world-atmospheric-post.tsx` | Phase 03 (drops parity warning), Phase 06 (final review) |

## Rollback Strategy

Each phase = single commit. Revert is `git revert <sha>`; chain restored to pre-phase state. No DB / save migration. Preset shape unchanged.

## Cross-Plan Dependencies

- Does NOT block phases 05/06/07 of `260512-1520-guild-hall-hd2d-atmospheric-depth` (they run on WebGL composer). Ship in parallel.
- Once Phase 03 lands, the one-time `webgpuParityWarned` console.warn in `world-atmospheric-post.tsx` gets removed.

## Definition of Done

- WebGPU renderer renders Vignette + ColorGrade + ACES + ChromAb + Tilt-Shift driven by active preset, identical to WebGL within visible-difference tolerance per room.
- Frame budget < 8ms post-stack on WebGPU (researcher report target).
- 9-room visual diff captured in `reports/`.
- Parity warning console.warn deleted.
- `npm run lint` + `npm run typecheck` clean.

## Unresolved Questions

1. Tilt-shift Gaussian kernel size — 9-tap separable vs 13-tap? Decide in Phase 05 after first prototype.
2. Whether to expose per-effect leva toggles for A/B comparison during validation (Phase 06) — punt unless Phase 06 needs it.
