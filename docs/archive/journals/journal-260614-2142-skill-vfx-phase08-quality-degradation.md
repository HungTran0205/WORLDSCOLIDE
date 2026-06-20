# Journal — Skill-VFX Phase 08: Quality Degradation + Tests

**Date**: 2026-06-14 21:42
**Branch**: feature/WC-UpgradeUI
**Plan**: plans/260611-2244-skill-vfx-foundation-pierce-poc/phase-08-integration-test-tuning.md
**Commit**: 6f072ff

## What

Closed the **automated** gates of Phase 08 (final integration phase of the Pierce skill-VFX POC):
- `mesh-fx-quality.ts` — single helper (`getMeshFxQuality` / `isLowMeshFxQuality`) wrapping the existing binary `graphics-quality` setting. No new settings UI — degradation is the existing high/low boolean.
- Wired the remaining `'low'`-tier consumers: weapon-trail skip + scatter-particle halving (in `combat-skill-vfx-layer.tsx`, via the reactive store quality), and lance dissolve-noise drop (compile-time shader variant in `thrust-lance-material.ts`, read once per `pool.warm()`). Distortion + camera-shake guards already existed → 5 consumers total.
- Unit tests: `skill-cue-dispatcher.test.ts` (3 — cue order/timing/payload, mesh+trail ignored), `hitstop-clock.test.ts` (6 — clamp 80–150ms, stall, expiry, extend-not-shorten, reset).

## Verification

- `tsc -b --force` clean (the real typecheck gate here — `--noEmit` is vacuous on this solution tsconfig).
- vitest A/B: baseline 959 passed / 4 failed → **968 passed / 4 failed** (+9 mine, **0 new failures**; the 4 are known `.codex`/infra noise).
- Determinism: `src/game/systems` imports **0** VFX/hitstop/distortion modules — sim stays presentation-decoupled.
- code-reviewer: DONE, no critical/high. Key invariant confirmed: HIGH path is full-quality by construction (`lowQuality` defaults false at every entry point).

## Decisions / Notes

- **Compile-time shader variant** for the lance dissolve (drop the `mx_fractal_noise_float` / `meshFxNoise` eval entirely on low) rather than a runtime uniform branch — avoids wasted per-fragment ALU.
- **Quality source lockstep**: React layer reads store `settings.graphicsQuality`; non-React pool warm reads localStorage via `getStoredGraphicsQuality`. `updateSettings` (guild-slice.ts) writes both, so they can't diverge.
- Mid-fight quality toggle applies to the lance shader on the *next* combat-open (warm reads once); the React consumers react immediately. Cosmetic, documented, acceptable for POC.
- Scatter-halving only affects cues with an **explicit** count — Pierce's `gen-hit:30` / `gen-burst:15` both qualify.

## Still Open (NOT done — needs the running game)

The visual acceptance gates can't be automated:
1. `npm run vfx` — 4 primitives on WebGPU + forced-WebGL + pooling reuse.
2. Real combat Pierce on WebGPU (bloom + distortion ripple) and WebGL (rings carry it, no null meshes).
3. 6-entity FPS + `graphics-quality=low` legibility eyeball.
4. Tuning pass — POC constants left as-is (`RING_DISTORTION_STRENGTH=0.04`, hitstop 110ms, lance/ring/shake values); tune only with eyes on screen.

Phase status left **in-progress** until these are confirmed.
