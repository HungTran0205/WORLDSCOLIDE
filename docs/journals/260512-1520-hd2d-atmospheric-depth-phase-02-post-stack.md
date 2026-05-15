# HD-2D Atmospheric Depth Phase 2 — World Post-FX Composer

**Date**: 2026-05-12 15:20
**Severity**: Medium
**Component**: `src/scene/atmospheric/` (new), postprocessing stack
**Status**: Resolved

## What Happened

Replaced singleton `world-bloom-post.tsx` with preset-driven `EffectComposer` architecture under `src/scene/atmospheric/`. Five new modules introduced: entry composer, WebGL effect stack (9 passes: N8AO → DOF → TiltShift → Bloom → GodRays → HueSat → BrightnessContrast → Vignette → Noise → ChromaticAberration → ToneMapping), WebGPU bloom-only parity pass, Leva control schema, and light-source registry for Phase 5.

Also patched Phase 1 latent bug: `resetGameState()` omitted `atmosphericEnabled` from settings literal. Test fixtures now validate.

## Technical Surprises (Non-obvious for Future Devs)

**1. EffectComposer children type is strict.** Accepts `JSX.Element | JSX.Element[]` only — no `false | null | undefined`. The idiom `{cond && <X/>}` fails to compile. Workaround: `cond ? <X/> : <></>`. Empty fragment is a no-op in the chain.

**2. LUT3DEffect is not exported from @react-three/postprocessing@3.0.4.** Only `LUT` object is exported. Resolved via fallback B: HueSaturation + BrightnessContrast combo (verified via `node -e` probe of the package).

**3. Effect re-creation churn hazard.** The postprocessing wrapper uses `useMemo([JSON.stringify(props)])` internally. Every numeric prop mutation triggers GPU Effect re-instantiation. Phase 2 values are baked (dormant risk). **Phase 4 blocker:** Diverging per-room values during lerps will churn at 60Hz. Fix required before shipping — either imperative uniform refs or discrete swap-at-lerp-end. Documented in `atmospheric-effect-stack.tsx` header.

**4. WebGPU detection idiom:** `'isWebGPURenderer' in gl` (not a blessed R3F discriminator). Matches combat-post patterns — preserve when adding platform branches.

**5. DOF dynamic targeting via reference identity.** Allocate Vector3 once in `useMemo`, pass as prop, mutate inside `useFrame`. The wrapper assigns `effect.target = providedVec` at mount; subsequent mutations visible because effect holds the same instance. Empirically verified against DepthOfField wrapper source.

**6. bloomEnabled setting is functionally dead.** Atmospheric composer runs Bloom always (when atmosphericEnabled is on). The GameSettings toggle still exists and controls `bloomThreshold` only. Phase 6 UI work should decide: remove toggle or wire it through.

## Validation & Status

- `npm run build` passes
- 264/264 game tests pass
- Lint clean on new files

**Status:** RESOLVED
**Summary:** Preset atmospheric composer stack complete; Phase 2 plan delivered. Five non-obvious technical patterns documented for Phase 4+ devs. One backward-compat regression flagged (bloomEnabled toggle).
