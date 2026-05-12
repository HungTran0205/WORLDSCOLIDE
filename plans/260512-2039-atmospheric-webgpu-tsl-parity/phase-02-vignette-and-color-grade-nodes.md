# Phase 02 — Vignette + ColorGrade TSL Nodes

## Context Links

- Plan: `./plan.md`
- Prev phase: `./phase-01-tsl-pipeline-scaffold.md`
- WebGL semantics to match: `src/scene/atmospheric/atmospheric-effect-stack.tsx` — `<HueSaturation />`, `<BrightnessContrast />`, `<Vignette />`
- Preset: `src/scene/atmospheric/atmosphere-types.ts` — `VignetteConfig`, `ColorGradeConfig`
- Pmndrs reference (color math): `node_modules/postprocessing/src/effects/{HueSaturationEffect.js,BrightnessContrastEffect.js,VignetteEffect.js}`

## Overview

- **Priority:** P1
- **Status:** done
- **Effort:** 1d

Two simplest TSL nodes, shipped together. Vignette = radial mask multiply on input color. ColorGrade = sequential Hue → Saturation → Brightness → Contrast pipeline. Match WebGL `HueSaturation` + `BrightnessContrast` + `Vignette` output within visible-difference tolerance.

## Key Insights

- Vignette in pmndrs uses `offset` (where darkening starts) + `darkness` (max darkness at corners). Match those exact semantics — no rename.
- WebGL `HueSaturation.hue` is in **radians** (pmndrs convention). Match exactly — preset values are already in radians (see `atmosphere-presets.ts` `colorGrade.hue: 0.04` etc.).
- `BrightnessContrast` semantics: `brightness ∈ [-1, 1]` adds; `contrast ∈ [-1, 1]` scales around 0.5 midpoint. Verify by reading pmndrs source before implementing.
- Order in WebGL stack: `HueSaturation → BrightnessContrast → Vignette → Noise → ChromAb → ToneMapping`. We're inserting ColorGrade (= HueSat + BC) THEN Vignette, BEFORE the future ACES node. This matches the WebGL order.

## Requirements

### Functional

- `vignetteNode(input, offsetU, darknessU): Node` — input × radial-mask formula.
- `colorGradeNode(input, hueU, saturationU, brightnessU, contrastU): Node` — four-step grade.
- `AtmosphericWebGPUPass` inserts both into the chain after bloom-add, before ACES insertion point.
- Per-frame: write `preset.vignette.{offset,darkness}` and `preset.colorGrade.{hue,saturation,brightness,contrast}` to uniform handles.

### Non-Functional

- Vignette ≤ 10 TSL LOC. ColorGrade ≤ 30 TSL LOC.
- Total file size each ≤ 80 lines incl. comments & imports.
- No allocations in render loop (uniforms reused).

## Architecture

```
chain = sceneColor.add(bloomNode)
chain = colorGradeNode(chain, hueU, satU, brightU, contU)   // Phase 02
chain = vignetteNode(chain, offsetU, darknessU)             // Phase 02
// Phase 03: chain = acesTonemapNode(chain)                 ← still pending
post.outputNode = chain
```

### Vignette Math (matches pmndrs)

```
d = length(uv - 0.5) * 2.0           // 0 center, ~1.4 corner
mask = smoothstep(offset, offset + darkness, d)
color.rgb *= 1 - mask                // 0 at center, darkens toward edge
```

### ColorGrade Math (4 stages, sequential)

1. **Hue rotation:** convert RGB → YIQ, rotate IQ by `hue`, convert back. Or use pmndrs's matrix form (faster, same result).
2. **Saturation:** `mix(luma(rgb).xxx, rgb, 1 + saturation)`.
3. **Brightness:** `rgb + brightness`.
4. **Contrast:** `(rgb - 0.5) * (1 + contrast) + 0.5`.

(Order matters — must match pmndrs sequence so WebGL/WebGPU outputs converge.)

## Related Code Files

**Create:**
- `src/scene/atmospheric/tsl/vignette-node.ts`
- `src/scene/atmospheric/tsl/color-grade-node.ts`

**Modify:**
- `src/scene/atmospheric/atmospheric-webgpu-pass.tsx` — import new nodes, insert at chain marker, add uniform handles to holder, sync in effect.
- `src/scene/atmospheric/tsl/types.ts` — extend `TslChainHolder` with `vignette` + `colorGrade` fields (required, not optional, this phase).

**Read for parity:**
- `node_modules/postprocessing/src/effects/HueSaturationEffect.js`
- `node_modules/postprocessing/src/effects/BrightnessContrastEffect.js`
- `node_modules/postprocessing/src/effects/VignetteEffect.js`

## Implementation Steps

1. Read three pmndrs source files; copy the exact math formulas to a comment block at the top of each TSL node file (so future maintenance has the reference).
2. Implement `vignetteNode.ts`. Export `vignetteNode(input, offsetU, darknessU)`. Use TSL `uv`, `length`, `smoothstep`, multiplicative blend.
3. Implement `color-grade-node.ts`. Export `colorGradeNode(input, hueU, satU, brightU, contU)`. Four-stage pipeline, each stage a sub-function for readability. Match pmndrs's HueSat math verbatim — average luma `(r+g+b)/3`, NOT perceptual luma (pmndrs uses uniform average).
4. In `atmospheric-webgpu-pass.tsx`:
   - Import `vignetteNode`, `colorGradeNode`, `uniform`, `float` from `three/tsl`.
   - Create 6 uniforms (`vignetteOffsetU`, `vignetteDarknessU`, `hueU`, `satU`, `brightU`, `contU`) inside the async useMemo.
   - Insert into chain at the marker.
   - Push handles into `holder.current`.
5. In the uniform-sync `useEffect`, write `preset.vignette.offset → vignetteOffsetU.value`, etc. List `[preset]` (and `overrides`) as deps.
6. Side-by-side visual test: open `guild-hall` on WebGL, screenshot; switch renderer to WebGPU, screenshot; diff. Acceptable: imperceptible drift due to ACES not yet wired (Phase 03 fixes this).
7. Lint + typecheck. Commit: `feat(atmospheric/webgpu): vignette + color-grade TSL nodes (phase 02)`.

## Todo List

- [x] Read pmndrs source for the 3 effects; copy formulas to file headers
- [x] Write `tsl/vignette-node.ts`
- [x] Write `tsl/color-grade-node.ts`
- [x] Extend `TslChainHolder` type
- [x] Wire 6 uniforms into pipeline + holder
- [x] Per-frame uniform sync in effect
- [x] Visual diff vs WebGL (note ACES gap is expected)
- [x] Lint + typecheck clean
- [x] Commit phase 02

## Success Criteria

- Vignette darkens screen corners per preset values (visible swap between rooms with different `darkness`, e.g. infirmary 0.6 vs training-yard 0.35).
- ColorGrade shifts hue/sat/bright/cont per preset (visible swap between rooms, e.g. workshop +hue warm vs alchemy −hue cool).
- Output before tonemap matches WebGL output before tonemap (Phase 03 closes the tonemap gap).
- No frame-rate regression measured against Phase 01 baseline.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Hue rotation matrix mismatch vs pmndrs | Med | Low | Copy math verbatim; visual diff catches it |
| `smoothstep` arg order differs in TSL vs GLSL | Low | Low | TSL mirrors GLSL `smoothstep(edge0, edge1, x)` |
| Uniform write before holder ready (race) | Med | Low | Holder-null guard exists from Phase 01; reuse |
| `tsl.uniform()` typing inferred wrong | Low | Low | Cast result through `TslUniformHandle<number>` in types.ts |

## Security Considerations

None.

## Next Steps

Phase 03 adds ACES tonemap as the final chain link, closing the visible-difference gap to WebGL.
