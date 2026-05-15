# Phase 05 — Tilt-Shift TSL Node (Gaussian Masked Blur)

## Context Links

- Plan: `./plan.md`
- Prev phase: `./phase-04-chromatic-aberration-node.md`
- WebGL match: `src/scene/atmospheric/atmospheric-effect-stack.tsx` — `<TiltShift focusArea={1 - preset.tiltShift.strength} feather={0.3} />`
- Preset: `TiltShiftConfig` — `strength: number, enabled: boolean`
- Pmndrs reference: `node_modules/postprocessing/src/effects/TiltShiftEffect.js` (look at horizontal blur band + focus mask)

## Overview

- **Priority:** P1 (strongest contributor to HD-2D vibe of the five)
- **Status:** pending
- **Effort:** 1.5d (time-boxed; fallback to box-blur if Gaussian variance is hard on TSL)

Tilt-shift = horizontal-band blur with a sharp focal strip across the screen. Two parts: (1) Gaussian blur node (separable horizontal+vertical passes for perf), (2) focus-band mask that lerps between sharp input and blurred input based on screen-Y distance from focal strip.

## Key Insights

- **WebGL semantics:** `focusArea = 1 - strength` (narrower band = stronger tilt-shift). `feather = 0.3` (constant fade width).
- **Two-pass Gaussian:** sample N taps horizontally → store → sample N taps vertically. TSL `pass()` doesn't natively expose intermediate RTs — we may need a manually-managed `RenderTarget` for the H pass output. **Spike before committing to 2-pass.**
- **Fallback plan:** If 2-pass is hard on TSL (intermediate target wiring), ship a single-pass 9-tap box blur first (cheaper visual, lands in <1d). Iterate to Gaussian later.
- **Mask:** `bandDist = abs(uv.y - 0.5) - focusBandHalfWidth` ; `mask = smoothstep(0, feather, bandDist)`; `out = mix(sharp, blurred, mask)`.
- **Critical limit:** This node operates AFTER vignette/colorGrade. Tilt-shift sharp+blurred both already-graded. Match WebGL order (which puts TiltShift right after DOF, BEFORE bloom — but on WebGPU we don't have DOF, so insert tilt-shift right after the bloom-add, BEFORE colorGrade). Reconsider during visual diff in Phase 06.

### Chain Position Decision

WebGL stack order:
```
DOF → TiltShift → Bloom → GodRays → HueSat → BrightCont → Vignette → Noise → ChromAb → ToneMapping
```

WebGPU (this plan):
```
Bloom-add → TiltShift (NEW) → ColorGrade → Vignette → ChromAb → ACES
```

Decision: Insert tilt-shift **right after bloom**, before colorGrade, matching the WebGL "tilt-shift before grade" ordering. Phase 06 will validate via visual diff — if a different position looks better, we move it.

## Requirements

### Functional

- `tiltShiftNode(input, strengthU): Node` — returns mix(sharp, blurred, mask).
- `strengthU` is `uniform(float)` ; preset `strength ∈ [0, 1]`; higher = stronger blur on the out-of-band region.
- `feather` is a literal `0.3` constant (matches WebGL hard-coded value).
- When `preset.tiltShift.enabled === false`, write `strengthU = 0` so mask result is "all sharp" everywhere. No rebuild.
- Inserted right after bloom-add, before colorGrade, before ACES.

### Non-Functional

- Time-box: 1.5 days. If at end of day 1 the Gaussian 2-pass isn't working, drop to 9-tap single-pass box blur and ship that for now.
- Frame cost budget: ≤ 3ms on WebGPU at 1080p (perf measured Phase 06).

## Architecture

### Option A — Separable Gaussian (preferred)

```
hBlur = horizontalGaussian(input, kernelSize=9)
vBlur = verticalGaussian(hBlur, kernelSize=9)
blurred = vBlur

bandDist = abs(uv.y - 0.5) - focusBandHalfWidth(strength)
mask = smoothstep(0, feather, bandDist)
out = mix(input, blurred, mask)
```

### Option B — Single-pass 9-tap (fallback)

```
blurred = sum_over_9_taps(input.uv + offset_i * texelSize) / 9
... rest identical
```

### Insertion in Chain

```
chain = sceneColor.add(bloomNode)
chain = tiltShiftNode(chain, tiltStrengthU)   // Phase 05 ← NEW
chain = colorGradeNode(chain, …)
chain = vignetteNode(chain, …)
chain = chromaticAberrationNode(chain, …)
// === ACES MUST BE LAST ===
chain = acesTonemapNode(chain)
```

## Related Code Files

**Create:**
- `src/scene/atmospheric/tsl/tilt-shift-node.ts` (40–60 LOC target)
- `src/scene/atmospheric/tsl/gaussian-blur-helper.ts` if Gaussian separable pass works — shared utility module. Only created if Option A succeeds.

**Modify:**
- `src/scene/atmospheric/atmospheric-webgpu-pass.tsx` — insert tilt-shift, add `tiltStrengthU` uniform, sync from preset.
- `src/scene/atmospheric/tsl/types.ts` — extend holder with `tiltShift: { strength }`.

**Read:**
- `node_modules/postprocessing/src/effects/TiltShiftEffect.js`
- TSL render-target examples in `node_modules/three/examples/jsm/tsl/` (search for `RenderTarget`).

## Implementation Steps

### Day 1 — Spike + base implementation

1. **Spike (≤2h):** can a TSL node sample its own input twice (sharp + blurred derived)? Confirm separable pass mechanism — does TSL `pass()` chain accept intermediate RTs, or must we use a manually-bound `RenderTarget` outside the chain?
2. If spike succeeds → Option A: write `gaussian-blur-helper.ts` (9-tap horizontal, 9-tap vertical, pre-baked weights `[0.05, 0.09, 0.12, 0.15, 0.18, 0.15, 0.12, 0.09, 0.05]`).
3. If spike fails → Option B: write a single-pass 9-tap box blur sampler inline in `tilt-shift-node.ts`. Commit Option B same day; revisit Gaussian later.

### Day 1 (cont) — Mask + composition

4. Implement `tiltShiftNode(input, strengthU)`:
   - Compute `focusBandHalfWidth = mix(0.5, 0.0, strengthU)` (higher strength → narrower band).
   - `bandDist = abs(uv.y - 0.5) - focusBandHalfWidth`.
   - `mask = smoothstep(0.0, 0.3, bandDist)`.
   - `return mix(input, blurred, mask)`.

### Day 1.5 — Integration + tuning

5. Insert in chain at marker; add `tiltStrengthU` uniform; sync from preset.
6. When `tiltShift.enabled === false`, write `strengthU = 0` (mask → 0 everywhere → all sharp).
7. Visual A/B: workshop preset (`strength: 0.3`) vs WebGL render. Tune kernel weights / focus-width formula until close.
8. Lint + typecheck.
9. Commit: `feat(atmospheric/webgpu): tilt-shift TSL node (phase 05)` — note in body whether Option A or B shipped.

## Todo List

- [x] Spike: separable blur RT wiring in TSL
- [x] Decide Option A vs B based on spike
- [x] If A: write `tsl/gaussian-blur-helper.ts`
- [x] Write `tsl/tilt-shift-node.ts`
- [x] Wire uniform + holder + sync
- [x] Insert in chain at correct position (between bloom + colorGrade)
- [x] Visual A/B against WebGL on workshop (highest strength preset)
- [x] Disabled-path verification (`enabled: false` → sharp everywhere)
- [x] Lint + typecheck
- [x] Commit phase 05 (note which Option shipped)

## Success Criteria

- Tilt-shift band visibly softens top/bottom of screen across all 9 rooms with `tiltShift.enabled: true` (workshop, tavern, alchemy-lab — strongest visible effect).
- `enabled: false` setting → no visible blur (verified by temp toggling).
- Visual match to WebGL within "good enough for diorama" tolerance.
- Frame budget under 3ms on dev machine.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Separable blur RT wiring impossible / hard on TSL | High | Med | Option B box-blur fallback locked in plan; ship that |
| Mask formula doesn't match WebGL "focusArea" semantics | Med | Low | Visual tuning during step 7; preset value range is small (0.2–0.5) |
| Kernel size 9 too narrow → blur looks pixelated | Med | Med | Bump to 13 if visual fails; perf trade documented |
| Tilt-shift position relative to colorGrade looks wrong | Low | Low | Phase 06 can re-order one line |

## Security Considerations

None.

## Completion Notes

**Option A (Gaussian separable blur) shipped.** Leveraged three's built-in `gaussianBlur(node, direction, sigma, {resolutionScale})` helper from `GaussianBlurNode.js`, eliminating manual render-target wiring. SIGMA=4 (11-tap each pass), resolutionScale=0.5 (half-res blur for perf). Mask formula matches WebGL pmndrs semantics: `focusBandHalfWidth = (1 - strength) * 0.5`, smoothstep feather = 0.3. Disabled state: strength = 0 → mask = 0 everywhere → output = sharp input. No chain rebuild on toggle.

**GPU texture leak fix:** Added `chainDisposables` array in pass closure to collect node-owned dispose closures (tilt-shift returns `{ output, dispose }`). Called in `setup.dispose()` alongside `post.dispose()` to free two internal blur render targets per module reload/HMR cycle.

**Lint + typecheck clean** for tilt-shift-node.ts, types.ts, and atmospheric-webgpu-pass.tsx modifications.

## Next Steps

Phase 06 — cross-renderer parity validation + perf.
