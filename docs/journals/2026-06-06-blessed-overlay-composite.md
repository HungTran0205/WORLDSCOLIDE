# Phase 5: Blessed Overlay Composite — Ancestral Blessings VFX

**Date**: 2026-06-06 11:47
**Severity**: Medium (POC complete, frame-count mismatch risk flagged)
**Component**: Combat VFX / Ancestral Blessings
**Status**: Resolved (phase 5/7 complete)

## What Happened

Completed Phase 5 of the Ancestral Blessings pipeline: overlay compositing. The blessed buff now renders a gold-outline + tattoo composite onto Linh Sơn combat sprites (idle/attack/blocking only) when `entity.blessed` is active. Reused the identity-mask composite atlas pipeline to keep WebGPU and WebGL rendering paths identical. POC covers LS-SWORD-M only.

## The Brutal Truth

This phase felt straightforward until code review returned—you guessed it—a latent frame-count mismatch trap. All three findings stemmed from one root cause: **overlay frames and body frames come from independent sources with no enforced sync**. The overlay PNG was authored to match body frame counts (8 idle, 8 attack, 4 blocking), but the code had no guardrail to catch a future artist or reexport that breaks that contract. Fixed proactively; still stings to ship with a known crack in the foundation, even for a POC.

## Technical Details

**Files modified:**
1. `src/scene/combat/combat-mask-composite-atlas.ts` — extended `buildCombatMaskCompositeAtlas` with optional `blessedOverlay` layer. Widened `maskId` to `string|null`, made `maskTexture` optional (blessed-only ally can still composite). Added overlay cell clamping: `Math.min(i, frameCount-1)` prevents body/overlay frame-count drift bleeding across animation segments. Cache key discriminator: `b<offset>:<count>`.

2. `src/scene/combat/blessed-overlay-manifest.ts` (new) — descriptor for `Ancestral-lv1-overlay.png` (2560×128, single-row, 128px frames). Segment map: idle{0,8}, attack{8,8}, blocking{16,4}. Name reserves `lv1` for future rank tiers.

3. `src/scene/combat/combat-idle-sprite.tsx` — unconditional overlay-sheet load (sentinel fallback for chars without overlay keeps hook count stable), 3 memoized blessed atlases (idle/attack/blocking). Selection prefers blessed → identity-mask → plain body. Death and casting branches precede blessed branches to preserve their own atlases.

**Tests**: 22 targeted tests + 54 combat-adjacent pass; added cross-check test (`blessed-overlay-manifest.test.ts`) verifying segment counts match `COMBAT_*_FRAME_COUNT` constants. TypeScript: `0 errors`. Build: succeeds.

## What We Tried

Code review: identified missing validation for overlay frame-count parity with body. Addressed with segment clamp + test. No rework required; protection is passive (clamp) + active (test).

## Root Cause Analysis

Overlay and body frame counts were treated as independently known truths rather than a contract that needed enforcement. Two independent texture atlases, two independent frame-count sources, zero runtime or test validation that they stay in sync. The POC shipped correct on disk, but the codebase was brittle.

## Lessons Learned

- **Descriptive names don't prevent bugs.** Naming the overlay manifest `lv1` doesn't prevent an artist from reexporting a `lv1` with 7 idle frames instead of 8.
- **Canvas composite isn't a silver bullet.** Reusing the identity-mask pipeline kept rendering uniform, but it inherited no validation logic—had to rebuild it for overlays.
- **Test cross-references matter more than you think.** The test comparing segment counts to frame constants caught the trap before a second character was added. Without it, the bug stays dormant until production.
- **Preemptive guards > post-incident fixes.** The clamp at `Math.min(i, frameCount-1)` costs ~1 line and prevents a 6-hour debug session later if a frame count does drift.

## Next Steps

1. **Phase 6**: Golden aura particle system (breathing glow around blessed units). Owned by animator.
2. **Phase 7**: Integration test suite + manual arena QA. Ensure blend order, color correctness, and frame sync under combat load.
3. **Second character POC**: When a second archetype gets an overlay, re-run cross-check test. If it fails, the test caught a real discrepancy before it shipped.
4. **Canvas pixel output**: Manual QA in live arena—JSDOM can't test canvas pixel values, so visual confirmation is the remaining gate.

All code committed; 22 tests green; no blocking issues for phase 6.
