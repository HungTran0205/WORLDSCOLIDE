# Phase 05 Review — Tilt-Shift TSL Node

## Scope
- `src/scene/atmospheric/tsl/tilt-shift-node.ts` (NEW, 73 LOC)
- `src/scene/atmospheric/tsl/types.ts` (TiltShiftUniforms simplified)
- `src/scene/atmospheric/atmospheric-webgpu-pass.tsx` (wiring)

## Overall
Clean, matches sibling style. Mask math is correct vs pmndrs across `strength ∈ [0,1]`. One real lifecycle bug, one redundancy.

## Critical

**1. GaussianBlur render-target leak on unmount.**
`PostProcessing.dispose()` only frees `_quadMesh.material` (see `three/src/renderers/common/PostProcessing.js:151-155`). It does NOT walk child TempNodes. `GaussianBlurNode` owns two `RenderTarget` instances (`_horizontalRT`, `_verticalRT` allocated in ctor at lines 80/89) with a working `dispose()` at line 292 — but nobody calls it. Every WebGPU pass remount (HMR, preset rebuild trigger, scene swap) leaks two GPU textures.

Fix: capture the `gaussianBlur` node handle in the holder, call `.dispose()` in the `setup.dispose()` path alongside `c.post.dispose?.()`. Same issue will recur for any future GaussianBlur-using node (DOF spike), so consider a generic `disposables: any[]` list in the holder.

## High

**2. Double `convertToTexture` on the blur input.**
`gaussianBlur` already calls `convertToTexture(node)` internally (factory at `GaussianBlurNode.js:361`). Passing `tex` (already converted) wraps twice. Likely a no-op in TSL's graph (idempotent), but the cleaner pattern is: `convertToTexture(input)` once for the sharp tap, then `gaussianBlur(input, ...)` direct. Sibling `chromatic-aberration-node.ts` only needs one materialization because no helper does it internally.

## Verified Correct

- **Mask math, edges.** At `strength=0`: halfWidth=0.5, bandDist = abs(uv.y-0.5)-0.5 ≤ 0 ∀ uv.y∈[0,1] → smoothstep→0 → mask=0 → mix returns `sharp`. Confirmed sharp pass-through. At `strength=1`: halfWidth=0 → bandDist=abs(uv.y-0.5)∈[0,0.5]. With FEATHER=0.3, mask=1 for |y-0.5|≥0.3 (top/bottom 20% each); center 30% still smooths to mask<1. Matches pmndrs `focusArea=0` semantics (full blur with feather skirt).
- **TSL idioms.** `convertToTexture`/`sample(uv())`/`mix`/`smoothstep`/`float` usage matches sibling nodes. `vec2(1,1)` direction is correct — multiplied by internal `_passDirection` per pass (line 248).
- **Disabled-state.** `applyPreset` correctly clamps strength to 0 when `tiltShift.enabled === false`. Math collapses to identity. Gaussian pass still runs (~half-res cost) — acknowledged in plan, deferred to Phase 06.
- **Chain position.** Post-bloom / pre-grade is reasonable on WebGPU (no DOF available). Matches WebGL "tilt-shift before color grade" intent.
- **`applyPreset` access.** `preset.tiltShift.enabled` read is safe — all 9 presets define `tiltShift` (verified in `atmosphere-presets.ts`); type guarantees presence in `AtmospherePreset`.

## Low

- Three `as any` casts on TSL imports — consistent with siblings, not worth fixing in isolation.
- JSDoc on `tiltShiftNode` could mention `strengthU` must be a `uniform(float)` (not raw number) — minor.

## Recommended Actions
1. Add `gaussianBlur` node handle to `TslChainHolder`, dispose in `setup.dispose()`. (Critical, ~5 LOC)
2. Drop outer `convertToTexture` on the blur arg; pass `input` direct to `gaussianBlur`, keep `convertToTexture(input)` only for the sharp tap. (Minor)

## Unresolved Questions
- Should the holder-disposables list be introduced now (DRY for future Gaussian-using nodes) or deferred until a second consumer lands? Current YAGNI lean: do it inline for tilt-shift only.

**Status:** DONE_WITH_CONCERNS
**Summary:** Mask math + integration correct; one real RT leak on unmount needs fixing before merge.
**Concerns:** GaussianBlurNode internal RTs not disposed by `post.dispose()`.
