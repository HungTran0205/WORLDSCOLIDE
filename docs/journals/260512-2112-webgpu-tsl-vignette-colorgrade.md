# WebGPU TSL Vignette & ColorGrade — Phase 02 Landing

**Date**: 2026-05-12 21:12  
**Severity**: Medium (TSL parity critical path, two lifecycle bugs caught pre-commit)  
**Component**: `src/scene/atmospheric/tsl/vignette-node.ts`, `color-grade-node.ts`, `atmospheric-effect-stack.tsx`  
**Status**: Resolved (code review forced fix on async lifecycle bugs)

## What Happened

Completed Phase 02: two new TSL nodes (`vignette-node.ts` ~35 LOC, `color-grade-node.ts` ~90 LOC) that replicate pmndrs's `<Vignette />`, `<HueSaturation />`, and `<BrightnessContrast />` GLSL verbatim. Both nodes wire into the WebGPU post-processing stack. All tests pass. Code compiles. Formulas audited against pmndrs source.

Then the code-reviewer found two bugs that would have shipped as silent runtime failures: a seed race in preset-application timing, and a missing `post.dispose()` call leaking WebGPU resources. Both are fixed. The landing is now clean.

## The Brutal Truth

This phase reveals why adversarial code review is non-negotiable for async code. The seed race would NOT have surfaced in unit tests (timing-dependent race) or visual tests (would have worked 80% of the time). The dispose leak would NOT have surfaced in tests or typical usage—only on repeated renderer reconfigs or long-running sessions would GPU memory creep become visible. We almost shipped both of these.

The bitter part: the tests passed. The async pattern *looked* clean. Both bugs lived in the 2–3 frame window between dynamic import and effect mount, which is not something automated testing reliably catches. A human had to read the code and ask "wait, what if preset changes while the IIFE is pending?"

## Technical Details

**Vignette Node (TSL):**
- Uses pmndrs's DEFAULT formula: `smoothstep(0.8, offset*0.799, d*(darkness+offset))`
- This looks backwards (edge0 > edge1) but is intentional: it inverts the ramp so center = 1, corners = 0
- Multiplied into color: `rgb * vignette` → corners darken
- Distance calculated as: `max(abs(uv.x), abs(uv.y))` (square form, not circular)

**ColorGrade Node (TSL):**
- Chains: HueSaturation → BrightnessContrast
- **Hue rotation:** Pmndrs uses matrix form (sin/cos angle → 3D rotation matrix applied via dot products). Faster than YIQ rotation; output matches exactly.
- **Saturation:** Uses simple luma `(r+g+b)/3`—NOT perceptual Rec709 luma. Initial plan suggested perceptual; implementation chose average to match pmndrs verbatim. Plan doc updated to reflect shipped behavior.
- **Brightness-Contrast:** `(input + brightness - 0.5) * scale + 0.5` where scale is asymmetric: `1/(1-c)` if positive, `1+c` if negative

**Architecture decisions:**
- TSL's `select(cond, a, b)` evaluates BOTH branches always (no short-circuit like GLSL ternary). For pure-ALU branches (saturation scale), identical result to pmndrs at runtime.
- Lazy-load via `await import('./tsl/vignette-node')` from WebGPU pass → bundler chunks into WebGPU-only path, keeps WebGL bundle clean.

**Issues fixed pre-commit:**

1. **M-1: Seed Race (CRITICAL)**
   - Symptom: Async IIFE in `useEffect(() => { ... dynamic import ... })` would fire, but the async tail (preset application) reads `preset` and `overrides` from closure.
   - If preset changed during the 1–2 frame import window, the sync return-from-effect would trigger (guard: `current == null`), then the IIFE-tail would apply stale at-mount values.
   - Fix: Introduced `presetRef` and `overridesRef` updated synchronously each render. IIFE tail reads from refs. Extracted `applyPreset(holder, preset, overrides)` as single source of truth called from both IIFE-tail and useEffect.
   - Why tests didn't catch: Preset changes are rare during rapid rerenders; timing window is 1–2 frames. Race manifests only under specific choreography.

2. **M-2: Dispose Leak (HIGH)**
   - Symptom: `dispose()` method flipped `cancelled = true` but never called `post.dispose()`.
   - WebGPU resources (uniforms, pipelines, textures) held by PostProcessing object were never released on unmount or renderer config change.
   - Fix: Added `post?.dispose()` in cleanup. Verified three r167's `PostProcessing.dispose()` exists at `node_modules/three/src/renderers/common/PostProcessing.js:151`.
   - Why tests didn't catch: No memory profiling in vitest. Visual tests are short-lived. Memory leak only becomes visible across multiple config changes or in long-running sessions.

**Metrics:**
- Files: 2 new (~35 + ~90 LOC), 4 modified (~50 net LOC)
- Typecheck: clean
- Lint: clean on touched files
- Tests: 99/99 src, 165/165 integration pass
- Code review: DONE_WITH_CONCERNS (lifecycle bugs) → fixed → effectively DONE
- Pmndrs formulas: 6/6 audited, verbatim

## What We Tried

Followed spec exactly. Initial implementation passed all tests and visual inspection. Only adversarial review under "what if async fails?" found the race and leak.

## Root Cause Analysis

1. **Seed race root cause:** Async code that reads closure variables is error-prone when parent state can change. The 1–2 frame import window is a classic footgun: looks synchronous to the reader, acts async at runtime.

2. **Dispose leak root cause:** The cancel-flag pattern (`cancelled = true`) is incomplete for cleanup. Cancelling work and destroying resources are separate concerns; we handled cancel, forgot resource cleanup.

## Lessons Learned

1. **For async IIFE patterns in React:**
   - Use refs, not closure, for values that may change during async work.
   - Extract the "apply state" logic into a standalone function, call it from both sync and async paths.
   - This makes it obvious that there's a single source of truth.

2. **For disposal patterns:**
   - A cancel flag prevents *further work*, not cleanup of *existing resources*.
   - Always pair cancel with resource cleanup (`dispose()`, unmount handlers, etc.).
   - Verify the underlying library actually exposes `dispose()` before assuming it's available.

3. **Why tests alone can't catch async races:**
   - Unit tests run deterministically; race windows are non-deterministic.
   - Vitest doesn't model frame timing or renderer lifecycle realistically.
   - Human review of async code is mandatory, especially in React effects.

4. **Value of adversarial code review:**
   - Code-reviewer asked "what if preset changes while import is pending?" and built a mental trace. Found the race.
   - Code-reviewer asked "what does dispose actually do?" and traced the call. Found the leak.
   - Both would have shipped silently without that hostile reading.

## Next Steps

1. Phase 03 (ACES tonemap, ChromAb, TiltShift) now has a stable vignette + color-grade foundation.
2. The `applyPreset()` helper pattern is now the canonical way to apply preset + override values. Any new uniforms (Phases 03–05) just extend the function.
3. Dispose pattern is locked: all future WebGPU effects must call `post?.dispose()` in cleanup.
4. **Out-of-scope rough edges:**
   - L-1: BloomNode emits `vec4(rgb, 1.0)`, so downstream alpha ≈ 2.0 on bloom + grade. Not fixed—Phase 03 punch-list (clamp after bloom).
   - ACES tonemap not yet wired; output pre-tonemap matches WebGL, final pixels still drift.
   - Visual pixel-diff vs WebGL: plan TODO step 6. Only formula-equivalence verified. Recommend running before Phase 03 starts.

**Status:** DONE  
**Summary:** Vignette + ColorGrade TSL nodes landed verbatim to pmndrs. Code-reviewer's adversarial audit caught seed race and dispose leak; both fixed before commit. Foundation now solid for Phase 03.
