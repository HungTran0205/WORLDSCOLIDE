# Phase 04: Combat Tutorial Wiring — HP Floor + Guaranteed Victory

**Date**: 2026-05-20 16:45
**Severity**: Medium
**Component**: Tutorial Quest Redesign / Combat Engine
**Status**: Resolved

## What Happened

Phase 04 shipped combat safety rails for the Moonbear tutorial fight (`tutorial-bear-the-bear`): an HP floor that clamps ally health to a minimum of 1 HP, guaranteeing victory once enemies fall. Floored to combat engine, headless simulator, and mission-tick for offline auto-resolve. Added soft-retry button in result panel for safety-net re-entry. Placed `data-coach="skill-hotbar"` selector on primary skill button for Phase 06 coachmark.

## The Brutal Truth

We widened scope beyond the plan's 2-site proposal to 8 sites (4 engine + 4 simulator). Defensive overkill for Moonbear, which has zero DoT/ally-skills that could slip past auto-attack clamp. But honest reasoning: we're writing tutorial-only code that must never fail. Better to over-engineer the guard rails than explain to QA why a child lost to RNG. Retry button is unreachable in normal play (floor guarantees victory), but exists because `endCombat` doesn't clear `formation` — only `exitArena` does — so `setPhase('battle')` safely re-inits a full-HP fight.

The risk is complexity. 8-site clamp is 8 places where future engine changes can forget the floor. Mitigated by single source of truth: `TUTORIAL_BEAR_MISSION_ID` from `tutorial-data.ts`, flag checked ONLY there.

## Technical Details

- `CombatEngine.hpFloorActive` boolean (default false) + `clampTutorialAllyFloor` helper: clamps floored ally HP to ≥ 1 after poison effect-tick, ThienLu clone, auto-attack, and skill. Placed BEFORE death check (`<= 0`) so floored allies never reach `getResult()` death code path.
- `combat-simulator.ts`: `runCombatLoop`, `simulateCombat`, `simulateCombatFromSnapshot` all gained optional `hpFloor` param. Clamp at same 4 ally-damage sites. Skip button, mid-fight reload, offline auto-resolve all honor the floor.
- `CombatFightController.tsx`: floor enabled ONLY when `isCurrentMission(TUTORIAL_BEAR_MISSION_ID)`. Zero behavioral change for all other combats (flag false everywhere else).
- `src/game/systems/mission-tick.ts`: checks same mission ID, passes floor to simulator.
- UI: `data-coach="skill-hotbar"` on primary skill button (hook for Phase 06 coachmark). Result panel shows "Try again" button when outcome !== 'victory' (tutorial-only soft-retry; unreachable in normal play because floor prevents non-victory).
- `src/game/data/tutorial-data.ts`: exported `TUTORIAL_BEAR_MISSION_ID = 'tutorial-bear-the-bear'` as single source of truth.

## What We Tried / Decisions

- **Clamp all 8 sites vs. just 2 (plan scope)**: chose 8. Poison/clone/skill cannot bypass floor, even though Moonbear never uses them. Reasoning: tutorial code must be failure-proof; live play exercises auto-attack clamp (good enough for now); defensive breadth costs nothing (simple `if (hpFloorActive) clamp()` blocks).
- **Retry as safety net vs. unreachable feature**: chosen as unreachable-in-normal-play. Defensive again. If floor logic breaks, retry catches it in QA instead of hard-locking the tutorial progression. Cost is one button, one code path. Benefit: confidence.
- **Deferred: result-panel banner predicate (`!== 'full-wipe'`) vs. retry predicate (`!== 'victory'`)**: only matters if panel is reused for non-floored partial-victory fights (e.g., bonus-challenge side quests). Deferred to Phase 06 when we know reuse intent. Current code works fine.

## Lessons Learned

- **Tutorial code is defensive code.** Normal engine wants elegance; tutorial wants robustness. Guard rails that look redundant (8-site clamp for 2-site problem) are justified when the cost is low and the failure mode is silent (player stuck in tutorial loop).
- **Single source of truth prevents flag-rot.** One exported mission ID checked in all 4 controller/tick/engine/simulator sites. If we later move or rename the mission, grep finds it instantly. Spread the flag across magic strings and it vanishes into production noise.
- **Soft-retry is worth the code even if unreachable.** If floor logic breaks in QA, player hits "Try again" instead of hard-locking. One button, zero logic change (re-enter at full HP is already how `exitArena` → `setPhase('home')` works). Costs less than debugging a soft-lock report.

## Next Steps

- **Phase 05** (skill/ability tutorial): shares same combat controller; will inherit `hpFloorActive = false` by default (no blocker).
- **Phase 06** (coachmark + step ordering): mounts the `data-coach="skill-hotbar"` coachmark, validates result-panel retry behavior in scripted mission flow, resolves H1 autoAdvance race (Phase 03 deferred).
- **Owner**: combat systems + tutorial scripting
- **Timeline**: Phase 05 can run in parallel (skill tutorial uses normal combat); Phase 06 integrates coachmark + retry logic into tutorial state machine.

## Verification

- `npx tsc --noEmit` clean.
- `combat-simulator.test.ts`, `combat-engine-sequential-turns.test.ts`, `combat-skip-snapshot.test.ts`: all pass.
- `mission-tick.test.ts`: 4 pre-existing failures (test mock store lacks `tavern` slice; fails identically on baseline, not regressions).
- Code reviewer: DONE, no blocking issues.
- Not committed (user chose to hold pending Phase 05 completion).
