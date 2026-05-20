# Phase 06 — State Machine 9→14 + Coach Wiring + Save Migration

## Context Links
- GDD §5 (14-beat table w/ step ids, coach configs, advance conditions), §6 (coach controller schema): [tutorial-quest-design.md](./tutorial-quest-design.md)
- Steps: `src/game/systems/tutorial-manager.ts` (`TUTORIAL_STEPS`, `TutorialStepConfig`, advance helpers)
- Union: `src/game/state/game-state.ts` `TutorialStep` (~L353, 8 ids today)
- Quest handler: `src/game/systems/tutorial-quest-handler.ts` (`handleTutorialQuestComplete`, hardcodes `tutorial-into-the-clearing` + step `tutorial-quest-active`)
- Mission tick: `src/game/systems/mission-tick.ts` (calls `handleTutorialQuestComplete(active.missionId)` ~L129)
- Overlays mount: `src/ui/screens/game-screen.tsx` (renders by `tutorialStep`)
- Migration: `src/game/save/save-migrations.ts` (`MIGRATIONS` chain, last = v24→v25), `src/game/save/save-types.ts` (`SAVE_VERSION = 25`)
- Coach component + `CoachConfig`: Phase 01 (`src/ui/coachmark/`)

## Overview
- **Priority:** P1 (integration spine — wires Phases 01–05 into the guided flow)
- **Status:** done
- **Description:** Expand `TUTORIAL_STEPS` from 8 → 14 per GDD §5, add a `coach?: CoachConfig` field per step, update the `TutorialStep` union, update the 3 stale `tutorial-into-the-clearing` references to `tutorial-bear-the-bear` and new step ids, render `<TutorialCoachmark>` driven by the current step, and add save migration v25→v26 remapping old step ids → new ones (preserving existing OLD_STEPS handling). Depends on ALL prior phases.

## Key Insights
- **Step-id reconciliation (R1, the core risk).** Current union (8): `char-creation, world-board, tutorial-quest-dispatch, tutorial-quest-active, tutorial-kael-rescue, tutorial-reward, build-logging-site, assign-kael, complete`. GDD §5 proposes 14 ids: `char-creation, arrival-alarm, open-quest-board, accept-bear-quest, assign-and-dispatch, quest-travel, moonbear-combat, kael-rescue, reward-splash, build-logging-site, assign-kael, first-haul-reward, build-tavern, complete`. → New union must be the 14 GDD ids. Migration maps every legacy id forward (table below).
- **3 stale references to fix** (Phase 02 changed the quest id): (1) `tutorial-quest-handler.ts` string `'tutorial-into-the-clearing'` → `'tutorial-bear-the-bear'` AND step guard `'tutorial-quest-active'` → `'kael-rescue'` advance target; (2) `tutorial-manager.ts` advanceCondition referencing `tutorial-into-the-clearing` → new id; (3) `mission-tick.ts` calls the handler by missionId — no literal there, but verify. quest-board filter uses `startsWith('tutorial-')` → still matches new id (no change).
- **Coach per step:** add `coach?: CoachConfig` to `TutorialStepConfig`. Steps with guidance (open-quest-board=world drum, accept-bear-quest=dom card, assign-and-dispatch=dom slot→dispatch, quest-travel=dom active-missions, moonbear-combat=dom skill-hotbar, build-logging-site=dom build chain, assign-kael=dom worker slot, build-tavern=dom build chain) carry a config. Game-screen renders `<TutorialCoachmark {...config} active={tutorialStep===step}/>`.
- **advanceOn → advanceCondition:** GDD's `advanceOn` enum maps to existing `autoAdvance + advanceCondition(state)` predicates. Reuse the existing pattern (e.g. `state.activeMissions.some(m=>m.missionId==='tutorial-bear-the-bear')` for dispatch; facility built; member assigned). New conditions: combat-victory (combat panel result), first-haul (handler advances), build-tavern (`facilities.some(tavern lv>0)`).
- **Migration v25→v26:** remap legacy `tutorialStep` values. Mid-tutorial legacy saves are rare (tutorial is short), so collapse ambiguous legacy mid-states to the nearest safe new step; preserve `complete` and the existing OLD_STEPS→complete rule from v11→v12 (those are already complete by the time they reach v25, so just pass through).
- **Cross-plan save race:** if tavern-facility lands a migration after v25 first, rebase this onto the new tail (e.g. v26→v27). Coordinate at merge (see plan.md cross-plan note).

### Legacy → new step-id remap (migration v25→v26)
| Legacy id | New id |
|---|---|
| `char-creation` | `char-creation` (same) |
| `world-board` | `arrival-alarm` (then user re-sees trimmed board → alarm) — or keep at `arrival-alarm` start |
| `tutorial-quest-dispatch` | `open-quest-board` |
| `tutorial-quest-active` | `quest-travel` |
| `tutorial-kael-rescue` | `kael-rescue` |
| `tutorial-reward` | `reward-splash` |
| `build-logging-site` | `build-logging-site` (same) |
| `assign-kael` | `assign-kael` (same) |
| `complete` | `complete` (same) |
> Forward-only collapse; never lands a player on a step whose prerequisites (Kael, permit) are missing. Verify each mapped target's preconditions hold given the legacy state.

## Requirements
**Functional**
- `TutorialStep` union = the 14 GDD ids.
- `TUTORIAL_STEPS` = 14 ordered configs, each with `message`, `autoAdvance`, optional `advanceCondition`, optional `coach: CoachConfig`.
- `<TutorialCoachmark>` mounted in game-screen, driven by current step's coach config.
- 3 stale id references updated; quest-handler advances to `kael-rescue`.
- Overlays (NPC alarm, world-board, kael-rescue, reward-splash, first-haul splash, graduation toast) mounted by their new step ids.
- Migration `migrateV25toV26` added to `MIGRATIONS`; `SAVE_VERSION = 26`.

**Non-functional**
- Every gated step has a reachable `advanceCondition` (no soft-locks). Graduation step (`complete`) surfaces next chain quest only, no forced push (§12.5).

## Architecture
```
TutorialStepConfig { step, message, autoAdvance, advanceCondition?, coach?: CoachConfig }
game-screen:
  const cfg = getCurrentStep(tutorialStep)
  {cfg?.coach && <TutorialCoachmark {...cfg.coach} active onAdvance=.../>}
  step-keyed overlays: arrival-alarm→NpcAlarmModal, world-board→WorldBoardModal,
    kael-rescue→KaelRescueDialogue, reward-splash→TutorialRewardSplash,
    first-haul-reward→TutorialFirstHaulSplash, complete→graduation toast
advance: existing shouldAdvanceTutorial(step,state) loop in tick (verify caller) + handler-driven steps
```

## Related Code Files
**Modify**
- `src/game/state/game-state.ts` — replace `TutorialStep` union with 14 ids.
- `src/game/systems/tutorial-manager.ts` — rewrite `TUTORIAL_STEPS` (14 entries + `coach`); extend `TutorialStepConfig` with `coach?: CoachConfig`.
- `src/game/systems/tutorial-quest-handler.ts` — quest id → `tutorial-bear-the-bear`; step guard + advance → new ids (`quest-travel`/`kael-rescue` chain).
- `src/ui/screens/game-screen.tsx` — mount coachmark by step; mount all overlays by new step ids (NPC alarm, first-haul splash, graduation toast); remove DEBUG coach mount from Phase 01.
- `src/ui/components/world-board-modal.tsx` — finalize advance to `arrival-alarm` (coordinated from Phase 05).
- `src/ui/components/tutorial-dialogue-overlays.tsx` — update `setTutorialStep` targets (`tutorial-reward`→`reward-splash`, `build-logging-site` chain) to new ids.
- `src/game/save/save-migrations.ts` — add `migrateV25toV26` (step remap) + register in `MIGRATIONS`.
- `src/game/save/save-types.ts` — `SAVE_VERSION = 26`.
- `src/ui/panels/quest-board.tsx` — verify `startsWith('tutorial-')` still gates correctly; add graduation: when `complete`, also surface next `chain-first-tremor`/`crumbling-path` quest (per OPEN Q2).

**Create**
- `src/ui/components/tutorial-graduation-toast.tsx` — beat 14 toast (or reuse hint bar). Small.

**Delete** — none (Phase 07 may remove the legacy drum-tooltip-arrow.css if fully superseded).

## Implementation Steps
1. Update `TutorialStep` union → 14 GDD ids.
2. Extend `TutorialStepConfig` with `coach?: CoachConfig` (import type from Phase 01).
3. Rewrite `TUTORIAL_STEPS` (14 entries) with messages, autoAdvance, advanceCondition predicates, and coach configs per GDD §5 table (drum world target `[5,1.2,3.5]`; dom selectors for cards/slots/hotbar/build — coordinate `data-coach` selectors with Phases 03/04).
4. Fix `tutorial-quest-handler.ts`: mission id + step guard/advance to new ids; keep Kael+permit grant.
5. Mount coachmark + all step overlays in `game-screen.tsx`; remove Phase 01 DEBUG mount.
6. Update overlay `setTutorialStep` targets to new ids (world-board, kael-rescue, reward-splash, first-haul handler from Phase 03).
7. Add `data-coach` selectors to the DOM targets that don't have them yet (quest card, assign slot, dispatch button, active-missions item, build button/slot/card/confirm). Keep selectors stable + documented.
8. Add `migrateV25toV26` (step remap table above) → register in `MIGRATIONS`; bump `SAVE_VERSION` to 26.
9. Graduation: at `complete`, surface next chain quest on board (OPEN Q2) without forcing.
10. `npx tsc --noEmit` → fix the union/exhaustiveness errors (any `switch` on `TutorialStep` must handle new ids).

## Todo List
- [x] `TutorialStep` union = 14 ids
- [x] `TutorialStepConfig.coach?` + 14-entry `TUTORIAL_STEPS`
- [x] quest-handler ids fixed (mission + steps)
- [x] coachmark + overlays mounted by step; DEBUG mount removed
- [x] overlay advance targets → new ids
- [x] `data-coach` selectors added to all DOM targets
- [x] `migrateV25toV26` + `SAVE_VERSION = 26`
- [x] graduation surfaces next chain quest (no force)
- [x] `npx tsc --noEmit` clean (exhaustive switches handled)

## Success Criteria
- A fresh game walks all 14 beats in order, each guided step shows the correct coach, each advances only on its real condition.
- No soft-lock: every gated step is escapable via its advance condition.
- Legacy saves (any v25 mid-tutorial / complete) load without error and land on a valid step with prerequisites satisfied.
- `npx tsc --noEmit` passes; no unhandled `TutorialStep` cases.

## Risk Assessment
- **R1 step churn (High):** mismapped legacy step → soft-lock/missing prereqs. Mitigation: remap table verified against prereqs; collapse ambiguous mid-states forward to the nearest safe step; test load of representative legacy saves in Phase 07.
- **Exhaustiveness (Med):** widening the union may break `switch`/`Record<TutorialStep,...>` elsewhere. Mitigation: `tsc` surfaces them; grep `TutorialStep` usages and fix.
- **Selector drift (Med):** `data-coach` selectors must match the actual rendered DOM. Mitigation: add selectors in the owning components (Phases 03/04 + here), verify in Phase 07.
- **Save-version race (Low):** cross-plan migration collision → rebase onto new tail at merge.

## Security Considerations
- Migration must be defensive (never throw on missing/unknown legacy step → fall back to `complete` like existing OLD_STEPS rule).

## Next Steps
- Phase 07: full playthrough, edge cases (GDD §9), balance + copy pass; legacy-save load test.
