# Combat Formation System: Step-Attack Refactor Complete

**Date**: 2026-04-19 14:32
**Severity**: High (core combat mechanic refactored)
**Component**: CombatEngine, ArenaEntity formation movement
**Status**: Resolved

## What Happened

Replaced free-movement combat with a **Summoner Wars-style step-attack formation system**. Allies now bound to home positions (homeX/Z), step forward for attack only, then return. Ranged units skip stepping entirely, attacking from home. Manual mode integrated. TypeScript compiles clean, zero errors.

## The Brutal Truth

This was genuinely satisfying. The old free-movement felt like a placeholder because it was one — units wandered aimlessly, combat felt directionless. Now there's **tactical depth**: positioning matters, ranged vs melee behave differently, visual feedback is crisp. The step-attack state machine (`home` → `step-forward` → `returning`) is simple but gives rhythm to combat.

The frustration: manual mode integration took longer than expected because we kept asking "where does player input block the engine?" Answer: at the `home` state transition, not as a pause overlay. That's elegant but wasn't obvious upfront.

## Technical Details

**Arena Types** (`combat-arena-types.ts`):
- New `AttackMoveState: 'home' | 'step-forward' | 'returning'`
- Added `homeX`, `homeZ`, `stepTargetX/Z` to `ArenaEntity`
- `FORMATION_STEP_DISTANCE = 1.5` units, `FORMATION_STEP_DURATION_MS = 250ms`
- `FORMATION_RETURN_DURATION_MS = 300ms`
- `isRangedArchetype()` checks `attackRange >= 4` to skip step entirely

**CombatEngine** (`combat-engine.ts`):
- Manual mode: `manualMode` flag + `waitingForInput`, `manualTargetId` per ally
- Queue system: `pendingAttacks` + `pendingSkills` gate execution until player submits
- `setManualMode()`, `queueAttack()`, `setManualTarget()` public methods

**CombatTimelineBar** (`combat-timeline-bar.tsx`):
- All alive entities sorted by `nextAttackAt` ascending, 5Hz update loop
- Color-coded by side (blue=ally, red=enemy), pulse animation when entity near-ready
- Waiting indicator for manual mode allies

## What We Tried

1. **Initial approach**: Player input pauses entire engine — rejected because it breaks ATB rhythm
2. **Attempted fix**: Pause only the ally, let enemies tick — broke synchronization
3. **Final solution**: Gate ally execution at state transition (`home` → wait for input) — clean, preserves flow

## Root Cause Analysis

The old system treated combat as a physics simulation — entities had velocity, moved freely, no constraints. That's expensive to reason about and visually unclear who's attacking whom.

The real issue: **we never locked down formation semantics**. Should units snap back? Move smoothly? Attack at range? Without clear rules, the engine drifted into free-movement as a default.

Manual mode integration forced us to ask: "When does the player decide?" The answer was always going to be at a state boundary, not mid-animation.

## Lessons Learned

1. **State machines first, physics second** — Define state transitions before position calculations. It clarifies where player input, status effects, and AI decisions fit.

2. **Ranged units need special cases early** — The "skip step" decision feels small but cascaded: ranged attack calculations, visual range display, target prediction. Better to bake it in at type definition than retrofit.

3. **Manual mode forces interface clarity** — By requiring player input integration, manual mode actually made the auto-attack state machine better. Constraints are useful.

4. **Formation bounds matter** — homeX/Z prevents units from drifting. Simple concept, massive impact on predictability.

## Next Steps

- **Playtest formation combat** (manual + auto modes) — confirm stepping feels responsive, no animation glitches
- **Verify ranged targeting** — ensure scout/scholar attack from home without edge cases
- **Integration test**: Run full mission with mixed formations, check ATB timeline pacing
- **Performance**: 5Hz timeline updates are cheap, but monitor with 12 entities in combat

**Owner**: HungTran (feature/WC-ALCHEMY)
**Timeline**: Playtest complete by EOD; ready for PR review after combat-view integration tests pass
