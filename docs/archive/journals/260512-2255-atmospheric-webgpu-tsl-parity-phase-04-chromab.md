# WebGPU TSL Parity Phase 04: Chromatic Aberration Spike Resolved, Deferred to Parity Validation

**Date**: 2026-05-12 22:55
**Severity**: Low
**Component**: Atmospheric / WebGPU TSL post-processing
**Status**: Resolved (with deferred validation)

## What Happened

Phase 04 shipped the chromatic aberration TSL node and closed the upstream chain-sampling spike question ("can arbitrary-UV sampling happen on a bare graph node?"). Implementation is complete; visible-effect validation deferred to Phase 06.

## The Brutal Truth

The spike was legit. You *cannot* call `.sample(uv)` on a raw graph output—graph nodes are value objects. But `convertToTexture(input)` from `three/tsl` materializes the upstream chain into a render target, enabling arbitrary-UV sampling downstream. This is the exact pattern three.js's own `examples/jsm/tsl/display/ChromaticAberrationNode.js` uses. Reading that source killed the uncertainty. No research dead-end; just a documentation gap in the tsl library.

## Technical Details

`chromatic-aberration-node.ts` (35 lines) implements pmndrs's sign convention verbatim:
- R channel: UV + offset
- G channel: center (original)
- B channel: UV - offset  
- Alpha: center sample

Matches pmndrs WebGL source (verified in `node_modules/postprocessing/build/index.js` line 4513).

**One accepted parity deviation:** pmndrs WebGL multiplies Y offset by aspect ratio; the TSL node does not. Invisible today—all 9 presets have `chromaticAberration: null`. Revisit in Phase 06 if a preset opts in.

**Disabled state:** Zero-vec2 offset, no chain rebuild. Center sample shared between G and A so zero-offset chain folds to 3 identical samples → driver collapses to one.

Lint and typecheck clean.

## What We Tried

Debated whether to bake aspect-ratio multiplication now (conservative). Deferred—add if Phase 06 validation catches visible Y-axis artifacts.

## Root Cause Analysis

Spike was justified. Documentation and example code were the fix, not architecture.

## Lessons Learned

1. **Graph-to-texture materialization is the idiomatic bridge** for arbitrary-UV post-chain sampling in TSL. Document this in onboarding if we hire TSL-heavy devs.

2. **Deferred validation is honest.** Zero presets use chromaticAberration today. Shipping an untested effect because the architecture is sound is premature. Validation belongs in Phase 06 when presets are finalized.

## Next Steps

Phase 05 (Tilt-Shift) inserts before ACES. Phase 06 flips presets on one by one and validates visual parity. If chromatic aberration is enabled and Y-axis looks wrong, bake aspect-ratio.

---

**Files changed:** `src/scene/atmospheric/tsl/chromatic-aberration-node.ts` (new), `src/scene/atmospheric/atmospheric-webgpu-pass.tsx`
