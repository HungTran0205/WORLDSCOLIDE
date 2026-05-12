# Code Review — Phase 02 Vignette + ColorGrade TSL Nodes

**Verdict:** DONE_WITH_CONCERNS

Parity formulas verified verbatim against pmndrs build. Two real concerns: a uniform-seeding race during the dynamic-import window and a missing `post.dispose()` on cleanup. Neither blocks landing for Phase 02's success criteria (visible-difference parity in steady state), but both should be on the Phase 03 punch-list.

## Scope

- `src/scene/atmospheric/tsl/vignette-node.ts` (new, 35 LOC)
- `src/scene/atmospheric/tsl/color-grade-node.ts` (new, 91 LOC)
- `src/scene/atmospheric/tsl/types.ts` (vignette + colorGrade flipped to required)
- `src/scene/atmospheric/atmospheric-webgpu-pass.tsx` (6 uniforms + chain inserts + sync writes)
- `src/scene/atmospheric/tsl/README.md` (phase status)

Pmndrs reference cross-checked against `node_modules/postprocessing/build/index.js` (the source is stripped from this install, but the built bundle still contains all GLSL strings + JS setters verbatim).

## Parity Verification (formula-by-formula)

All three pmndrs originals confirmed via `node_modules/postprocessing/build/index.js`:

| pmndrs source | Build line | TSL port | Status |
|---|---|---|---|
| `smoothstep(0.8, offset*0.799, d*(darkness+offset))` | 13614 | vignette-node.ts:33 | exact |
| `vec3(dot(c,hue.xyz), dot(c,hue.zxy), dot(c,hue.yzx))` | 7306 | color-grade-node.ts:48-52 | exact |
| `hue.set((2c+1)/3, (-√3·s-c+1)/3, (√3·s-c+1)/3)` | 7367-7372 | color-grade-node.ts:43-47 | exact |
| `if(sat>0) color+=diff*(1-1/(1.001-sat)); else color+=diff*-sat` | 7306 | color-grade-node.ts:57-61 | exact |
| `min(color, 1.0)` (HueSat tail) | 7306 | color-grade-node.ts:88 | exact |
| `color = in + (brightness-0.5); if(c>0) /= (1-c) else *= (1+c); +0.5` | 4355 | color-grade-node.ts:66-70 | exact |

Specific items raised in the request:

1. **Vignette reversed smoothstep** — intentional and verbatim from pmndrs `VIGNETTE_TECHNIQUE == 0`. ✓
2. **Hue rotation matrix-form** — sin/cos coefficients match the JS-side `hue` setter exactly; rgb dot products use `hue.xyz / zxy / yzx` swizzles. ✓
3. **Saturation `select` with both branches evaluated** — TSL semantics. Functionally equivalent to GLSL `mix(a, b, step(0, sat))` and to pmndrs's branched GLSL (compilers de-branch anyway). No correctness impact. Both branches are pure (no I/O), so doubling the ALU is the only cost. ✓
4. **Brightness-Contrast** — `(input + brightness - 0.5) * scale + 0.5`, asymmetric scale, both signs covered. ✓
5. **Chain order** `bloom → colorGrade(HueSat+BC) → vignette → (future ACES)` matches WebGL stack `effect-stack.tsx:104-128` exactly. ✓
6. **Avg-luma vs perceptual luma** — pmndrs uses `(r+g+b)/3`, NOT `dot(rgb, vec3(0.2126,0.7152,0.0722))`. The plan file mentioned the perceptual form (step 3), but the implementation correctly chose to match pmndrs's actual code. Parity-correct. ✓

## Critical Issues

None.

## High Priority

None.

## Medium Priority

### M-1 — Uniform-seeding race during dynamic-import window
**File:** `src/scene/atmospheric/atmospheric-webgpu-pass.tsx:36-147`

**Repro window:** Component mounts → `useMemo` returns immediately with `holder.current = null` → async IIFE starts importing `three/webgpu` + `three/tsl` + node modules. While the imports resolve (~1 frame to several frames on cold load), if `preset` prop changes, the sync effect at L135-147 fires, sees `getCurrent() === null`, and returns early. When the IIFE finally completes at L99-117, it seeds uniforms from the **closed-over preset at mount time** (L89-94). No subsequent effect fires unless preset/overrides change again, so the new uniforms hold stale values until the next room-transition or leva tweak.

**Why it matters:** Likely invisible in steady-state play, but a fast room-swap during initial WebGPU mount (e.g. user spawns into transition or HMR hot-swap) leaves the chain frozen on the previous preset until the next mutation.

**Suggested fix:** Either
- Track ready state with `useState(false)` set true at the end of the IIFE; include in the sync effect's deps so it re-runs once the chain is built; OR
- Move the seed assignment into a shared `applyPreset(holder, preset, overrides)` helper and call it from BOTH the IIFE (after `holder.current = ...`) and the effect.

The second form is preferable — single source of truth for "preset → uniform" mapping, and it removes the L89-94 initial-seed values entirely (they become L138-146's job).

### M-2 — No `post.dispose()` on cleanup
**File:** `src/scene/atmospheric/atmospheric-webgpu-pass.tsx:122-124, 133`

`setup.dispose()` only sets `cancelled = true`. On unmount or `[gl, scene, camera]` change, the old `PostProcessing` instance is left for GC. Render targets, internal materials, and any sub-passes won't release WebGPU resources until the JS GC eventually frees the instance — which on long-lived sessions can mean GPU memory pressure after several renderer-config changes.

**Suggested fix:**
```ts
dispose: () => {
  cancelled = true;
  if (holder.current) {
    holder.current.post.dispose?.();
    holder.current = null;
  }
},
```

Check `three/webgpu` PostProcessing API for the actual dispose method name — three r167 exposes `.dispose()` on most pipeline-builder classes.

## Low Priority

### L-1 — Bloom alpha pollutes downstream `input.a`
**File:** `src/scene/atmospheric/atmospheric-webgpu-pass.tsx:99`

`sceneColor.add(bloomNode)` adds rgba. BloomNode emits `vec4(diffuseSum, 1.0)` (verified at `BloomNode.js:501`), so the chain's `.a` becomes `sceneAlpha + 1.0` ≈ 2.0 for opaque scenes. `colorGradeNode` and `vignetteNode` propagate this via `vec4(graded, input.a)` and `vec4(rgb.mul(factor), input.a)`. Visually harmless on opaque canvas (alpha is discarded), but diverges from WebGL semantics where the composer keeps alpha = 1.0.

**Suggested fix (1-liner):** Clamp the chain alpha once after the bloom add:
```ts
let chain: any = sceneColor.add(bloomNode);
chain = vec4(chain.rgb, float(1));  // restore opaque alpha
```

Or pass the original `sceneColor.a` forward in each node. Either is fine; mention here for tracking only.

### L-2 — Plan file recommended perceptual luma; implementation chose pmndrs avg
**File:** `plans/260512-2039-atmospheric-webgpu-tsl-parity/phase-02-vignette-and-color-grade-nodes.md:87`

The plan suggested `dot(rgb, vec3(0.2126, 0.7152, 0.0722))` for the saturation step. The implementation correctly uses `(r+g+b)/3` to match pmndrs. The plan's wording is stale — consider editing it to reflect what shipped, so future Claude doesn't try to "fix" it back to the wrong formula.

### L-3 — `as any` cast volume
**Files:** vignette-node.ts (5 params), color-grade-node.ts (all node params), atmospheric-webgpu-pass.tsx (~9 sites)

Following the established scaffold pattern from Phase 01, which is reasonable given `three/tsl` has weak typing. Future cleanup could introduce a `TslNode` opaque alias in `types.ts`:
```ts
export type TslNode = any & { readonly __tsl: unique symbol };
```
…but that buys very little for the readability cost. Not a blocker; keep as-is.

### L-4 — Saturation Inf at sat = 1.001 exactly
**File:** `color-grade-node.ts:59`

`1.001 - sat` divides by zero if a preset ever sets `saturation = 1.001`. Inherited pmndrs quirk — same divergence in WebGL. If you ever want to defend against this, clamp `sat` to `[-1, 1]` before the formula. Not landing-blocking.

## Edge Cases Scouted (from request items 3 + 4)

- **Lazy-load chunk discipline (item 3):** Verified. The static `import { ... } from 'three/tsl'` in vignette-node.ts:19 and color-grade-node.ts:33 are pulled into the same chunk as their containing module, which is itself reached via `await import('./tsl/...')` at atmospheric-webgpu-pass.tsx:45-46. No other file in `src/` statically imports either node module or `three/tsl` (grep verified). WebGPU chunk stays isolated from the WebGL bundle path. ✓
- **TslChainHolder consumer breakage (item 4):** Grepped `TslChainHolder` across the whole repo — only `tsl/types.ts` (declaration) and `atmospheric-webgpu-pass.tsx` (sole consumer). Flipping `vignette` + `colorGrade` from optional to required has zero external impact. ✓
- **`select` branch evaluation (item 1c):** Confirmed — both branches always run. Pure-ALU on both sides for sat + brightness-contrast, so no side effects. Functional parity preserved. ✓
- **TSL identifier collisions (item 2):** Only `min` collides with `Math.min`. Aliased correctly as `tslMin`. `select`, `negate`, `greaterThan`, `distance` all unique to TSL namespace — no shadowing risk. ✓

## Positive Observations

- File-header comment blocks quote the pmndrs GLSL verbatim — makes audit trivial, this review took ~10 min instead of 40.
- The `applyHueRotation` / `applySaturation` / `applyBrightnessContrast` split keeps each stage at ~5 lines; readability matches a graphics-textbook progression.
- Chain-build comment at atmospheric-webgpu-pass.tsx:96-105 documents the future insertion order — Phase 03-05 work becomes near-mechanical.
- `holder.current = null` guard pattern reused from Phase 01 — consistent.
- `min(saturated, vec3(1))` applied OUTSIDE the saturation helper (color-grade-node.ts:88), matching the fact that pmndrs's `min` is the HueSat *stage tail*, not part of the saturation math itself. Subtle but correct.

## Recommended Actions

1. **Before Phase 03 starts:** address M-1 (uniform-seeding race) — pulling the preset-apply into a shared helper is the cleanest fix and will make Phase 03's ACES uniform sync trivial. Recommend a 15-min refactor.
2. **Same PR or follow-up:** add `post.dispose()` to the cleanup (M-2). Confirm three r167's PostProcessing dispose method name first.
3. **Optional:** add the L-1 alpha-clamp one-liner; documents the intent and prevents accidental alpha-aware downstream code from misreading it.
4. **Doc-only:** update plan file's step 3 (L-2) to reflect the actual `(r+g+b)/3` formula used.

## Metrics

- Files reviewed: 7 (5 changed + 2 reference)
- Total changed LOC: ~160
- Parity formulas audited: 6/6 verbatim match
- Typecheck: clean (verified via `npx tsc -b`)
- Lint: clean (per submitter, not re-run)
- Tests: 99/99 pass (per submitter, not re-run)
- Critical: 0  High: 0  Medium: 2  Low: 4

## Unresolved Questions

1. Does `three/webgpu` PostProcessing expose a `.dispose()` method in r167, or is the cleanup name different (e.g. `.destroy()`, `.release()`)? Worth checking before applying M-2 fix.
2. Phase 03 plan calls for `chain = aces(chain)` as the final link — should that ALSO restore opaque alpha (L-1), or leave it as a no-op since ACES typically only touches RGB? If ACES preserves alpha as-is, the L-1 issue persists.
3. Side-by-side WebGL vs WebGPU screenshot diff was a plan TODO (step 6) — did this happen? Without it, "visible-difference tolerance" is unverified, only formula-equivalence is. Recommend doing it before merging Phase 02 even if everything looks right on paper.
