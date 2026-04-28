# Shadow & Bloom Settings Toggle

**Date**: 2026-04-27 12:00
**Severity**: Low
**Component**: Graphics Settings, Post-Processing Pipeline
**Status**: Resolved

## What Happened

Implemented end-to-end graphics quality toggles: shadows (native PCFShadowMap) and bloom (Bloom + N8AO SSAO) now controllable from Settings Panel. All three phases — state layer, UI, scene effects — completed in a single session with zero TypeScript errors. Subsequently refactored shadow system to use native Three.js PCFShadowMap (WebGL + WebGPU compatible) instead of WebGL-only drei ContactShadows component, with reactive `ShadowController` for zero-reload toggles.

## The Brutal Truth

This was straightforward implementation. The only friction was architectural clarity: Leva debug UI vs. user-facing Settings Panel ownership. Decided cleanly: Leva owns internal tuning (bloom strength/radius), Settings Panel owns user-exposed config (on/off, threshold). Defaults are opt-in (false) to protect existing player performance.

## Technical Details

**State Layer** (`src/game/state/game-state.ts`, `src/game/state/guild-slice.ts`):
- Added `shadowsEnabled: boolean`, `bloomEnabled: boolean`, `bloomThreshold: number` to `GameSettings`
- localStorage getters return boolean/number with sensible defaults
- Zustand store fully reactive

**Settings UI** (`src/ui/panels/settings-panel.tsx`):
- Toggle buttons in Graphics Quality section
- Bloom Threshold slider conditionally rendered (appears only when `bloomEnabled === true`)
- No page reload — pure reactive state

**Scene Effects (v1.24 Graphics Refactor)**:
- Renamed `WorldBloomPost` → `WorldPostProcessing`, removed internal Leva `enabled` control
- WebGL path: N8AO SSAO + Bloom in same EffectComposer (order matters: darken then brighten)
- WebGPU path: TSL Bloom only (N8AO incompatible with WebGPU EffectComposer)
- **Shadow System (REFACTORED)**: Replaced drei `ContactShadows` with native Three.js `PCFShadowMap`
  - `ShadowController` component in `src/scene/world.tsx` reactively toggles `gl.shadowMap.enabled` when `shadowsEnabled` changes (no scene reload)
  - `directionalLight` has `castShadow` + orthographic frustum sized for 10×7 guild hall
  - `linh-son-floor.tsx` Clone has `receiveShadow`
  - `furniture-model.tsx` Clone has `castShadow receiveShadow`
  - Works on both WebGL and WebGPU backends

## What We Tried

**Original Implementation**: N8AO in WebGPU path initially — doesn't work with WebGPU EffectComposer, abandoned for that target. WebGL gets both; WebGPU gets Bloom only. Acceptable tradeoff.

**Graphics Refactor (v1.24)**: Replaced drei ContactShadows with native PCFShadowMap to enable cross-backend compatibility and eliminate WebGL-only dependency. Added `ShadowController` to make shadow toggles reactive without scene reload.

## Root Cause Analysis

No issues. State-driven design (Zustand as source of truth) made this clean. Separating debug UI from user UI forced correct ownership boundaries.

## Lessons Learned

- Opt-in defaults are right when adding perf-intensive features to avoid regressing existing players
- Leva + Settings Panel can coexist cleanly: Leva = dev internal, Panel = player-exposed
- EffectComposer layer ordering matters; N8AO must run before Bloom

## Next Steps

Monitor player feedback on shadow/bloom defaults. If adoption is low, may need tutorials or onboarding hints. No blocking work.
