# Phase 05: Tilt-Shift TSL Node — Separable Gaussian Blur Implementation

**Date**: 2026-05-12 23:02
**Severity**: Medium
**Component**: Atmospheric Post-Processing / TSL Effects
**Status**: Resolved

## What Happened

Implemented `tilt-shift-node.ts` — a focal-depth effect with Gaussian-blurred periphery and sharp horizontal band. Integrated into WebGPU post-stack after bloom, before color-grade.

## The Brutal Truth

Phase plan proposed a "spike" to validate separable Gaussian feasibility on TSL. Wasted zero time: three.js ships `gaussianBlur()` helper complete in examples. The fallback box-blur option was dead on arrival. No discovery needed — it was already there.

More importantly: code review exposed a **render target leak** we'd been shipping all phase. `PostProcessing.dispose()` only freed its own quad material; child `GaussianBlurNode` owns two internal `RenderTarget`s that would leak on HMR and scene swaps. Felt like a grenade.

## Technical Details

- **Mask formula**: `focusBandHalfWidth = (1 - strength) * 0.5; mask = smoothstep(0, 0.3, abs(uv.y - 0.5) - halfWidth); out = mix(sharp, blurred, mask)`. Exactly mirrors WebGL pmndrs behavior.
- **Blur config**: `gaussianBlur(tex, 'x', SIGMA=4, resolutionScale=0.5)` — separable 2-pass, ~11 taps per pass via three's built-in helper.
- **Disabled state**: `tiltShift.enabled === false` → strength=0 → halfWidth=0.5 → mask=0 → output = sharp. Zero cost when off.
- **RT leak fix**: Node now returns `{ output, dispose }` closure. PostProcessing collects disposables and invokes on teardown.

## Lessons Learned

- **Read the three.js examples folder first.** We had the answer sitting in `tsl/display/GaussianBlurNode.js` the entire time.
- **Idempotent conversions matter.** `convertToTexture` short-circuits for texture nodes — no double-materialization.
- **Dispose chains are recursive.** Child nodes own memory they must free. Builder pattern + closure collections beat manual cleanup.

## Next Steps

Phase 06: Cross-renderer parity validation + performance profile. This phase ships pending final review.

**Owner**: WebGPU atmospheric pipeline
**Timeline**: Phase 06 unblocked, targeting completion this session
