# TSL Post-Processing Nodes (WebGPU)

Custom TSL nodes that bring the HD-2D atmospheric stack to the WebGPU
renderer. Mirrors the WebGL effect-stack ordering: bloom → vignette →
colorGrade → fog → chromAb → tiltShift → ACES (always last).

Host: `../atmospheric-webgpu-pass.tsx` builds the chain inside one async
`useMemo`. Each node module exports `(input, holderFields) => chainOutNode`
and writes its mutable uniform handles into the passed-in holder so the
host's preset-sync effect can update them.

## Module map

| File | Phase | Status |
|------|-------|--------|
| `types.ts` | 01 | landed |
| `vignette-node.ts` | 02 | pending |
| `color-grade-node.ts` | 02 | pending |
| `aces-tonemap-node.ts` | 03 | pending |
| `fog-node.ts` | 03 | pending |
| `chromatic-aberration-node.ts` | 04 | pending |
| `tilt-shift-node.ts` | 05 | pending |

## Depth-texture spike (Phase 01)

`scenePass.getTextureNode('depth')` is called once on first WebGPU mount.
Result is logged (`[atmospheric/webgpu] depth-texture spike: ...`) and
informs whether DOF-on-WebGPU is a viable follow-up. Current code wraps the
call in try/catch — if it throws or returns null, DOF stays WebGL-only as
the parent plan's non-goal already states. Tilt-shift uses a screen-Y mask
and never needs depth, so this spike is non-blocking for Phase 05.

## Plan reference

`d:/WORLDCOLIDE/plans/260512-2039-atmospheric-webgpu-tsl-parity/plan.md`
