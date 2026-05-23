# Phase 3: Combat Mask Composite Atlas Integration

**Date**: 2026-05-22 12:33
**Severity**: Medium
**Component**: Combat sprite rendering / visual masking
**Status**: Resolved

## What Happened

Integrated the composite atlas builder (Phase 2) into the combat idle sprite renderer, replacing legacy floating overlay. `combat-idle-sprite.tsx` rewritten to load blocking frames + mask texture, build 3 masked composite atlases per ally (idle/attack/blocking), select by animation state. Death always uses plain body atlas (unmasked). Added DEV-only leva tuner `combat-mask-dev-tuner.tsx` for frame/position debugging. Disposed composite atlas cache on battle unmount to prevent GPU texture leaks. Deleted: `combat-mask-overlay.tsx`, `combat-mask-tuner.tsx`, `combat-mask-placement.ts`. No dangling imports, 0 TypeScript errors.

## The Brutal Truth

Phases 1 and 2 were already done, so Phase 3 was pure integration. The composite atlas cache pattern (keyed by charId|maskId|anim|frameCount) made this clean—`useMemo` calls the builder, gets cached result on re-render. **The tricky bit**: `useLoader` must be called unconditionally (React hook rules). Solved with a sentinel mask path (`mask-01 east`) for non-masked entities. All 15 masks preload on app boot, so this is a cache hit—no extra fetch. No clever workarounds needed, just respecting the rules.

## Technical Details

**`combat-idle-sprite.tsx` changes:**
- `lastAnimStateRef` and `currentAnim` widened to include `'blocking'` state.
- Three `useMemo` calls build composite atlases for idle, attack, blocking (using the Phase 2 builder).
- Death animation always uses plain `bodyAtlas` (unmasked).
- `BLOCKING_FPS = 10` hardcoded for blocking animation speed.

**Composite cache pattern:**
- Key: `${charId}|${maskId}|${anim}|${frameCount}`.
- On re-render with same params, builder returns cached texture immediately (no rebuild).

**GPU cleanup:**
- `disposeCombatMaskCompositeAtlasCache()` called on unmount (via `useEffect` return).
- Prevents texture leaks across multiple battles in a session.

**DEV tuner:**
- Leva panel (charId, anim, frame selector; x/y/size sliders).
- Apply/Export buttons.
- Mounted in `combat-scene-shell` behind `import.meta.env.DEV`.

## Lessons Learned

- **Hook call order beats cleverness.** `useLoader` doesn't branch. Sentinel paths + preloading = simpler than trying to conditionally invoke the hook.
- **Cache keys need all variants.** Missing frameCount in the key = building atlases with wrong frame ranges on anim speed changes. Make the key exhaustive.
- **GPU cleanup is not optional.** Unmount disposal prevents silent texture leaks. Add it upfront, not as a "fix later" task.

## Next Steps

- Monitor GPU memory in multi-battle sessions (if texture count grows unbounded, disposal isn't firing).
- Validate blocking animation 10 FPS feels right in-game (may need tuning based on playtest feedback).
- Phase 4: integrate with other character types (currently idle sprites only).

## Verification

- `npx tsc --noEmit` clean (0 errors).
- No dangling imports (deleted files had no external references).
- Composite atlas builds correctly for all 3 anim states per ally, death unmasked.
- Cache hits verified (same charId|anim|frameCount reuses texture, no rebuild).
