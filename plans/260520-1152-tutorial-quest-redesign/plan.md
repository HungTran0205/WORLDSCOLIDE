---
title: "Tutorial Quest Redesign — The First Tremor / Bear the Bear"
description: "Rebuild onboarding into one core-loop chain with a reusable coachmark, playable Moonbear fight, and scripted economy beats."
status: in-progress
priority: P1
effort: ~26h
progress: 6/7 phases complete (01–06)
branch: develop
tags: [tutorial, onboarding, combat, economy, ux]
created: 2026-05-20
---

# Tutorial Quest Redesign

Turn the trivial slime tutorial into a full core-loop onboarding chain (drum → quest → dispatch → combat → reward → build → assign → produce → spend) with guided coachmarks, a playable guaranteed-win Moonbear boss, and scripted economy beats. Design is LOCKED in [tutorial-quest-design.md](./tutorial-quest-design.md) (GDD) — phases below implement it, no re-design.

## Phase Table

| # | Phase | Status | Deps | Effort | Owns (no overlap) |
|---|-------|--------|------|--------|-------------------|
| 01 | [Coachmark foundation](./phase-01-coachmark-foundation.md) | ✅ done | — | 6h | `src/ui/coachmark/*` (new), drum-tooltip-arrow.tsx/.css |
| 02 | [Quest + Moonbear data](./phase-02-quest-and-moonbear-data.md) | ✅ done | — | 3h | tutorial-data.ts, missions.ts, enemies.ts |
| 03 | [Economy: build-cost + first-haul](./phase-03-economy-build-cost-and-first-haul.md) | ✅ done | 02 | 4h | facility-definitions.ts, guild-slice.buildFacility, facility UI, first-haul splash |
| 04 | [Combat tutorial wiring](./phase-04-combat-tutorial-wiring.md) | ✅ done | 02 | 4h | combat-engine.ts (HP-floor), combat-skill-bar coach, retry |
| 05 | [Narrative beats](./phase-05-narrative-beats.md) | ✅ done | — | 3h | npc-alarm-modal (new), world-board-modal.tsx |
| 06 | [State machine 9→14 + migration](./phase-06-state-machine-and-migration.md) | ✅ done | 01,02,03,04,05 | 4h | tutorial-manager.ts, game-state TutorialStep, save-migrations, game-screen wiring |
| 07 | [Integration + tune pass](./phase-07-integration-and-tune.md) | pending | 06 | 2h | cross-cutting verify only |

Phases 01–05 are independently compilable. 06 is the integration spine (wires every prior phase into the step state machine). 07 is the playthrough/balance pass.

## Key Risks

- **R1 (High):** Step-ID churn. GDD §5 proposes 14 NEW ids (`arrival-alarm`…); current code uses 8 different ids. Save migration must remap old→new AND preserve the existing v11→v12 / OLD_STEPS handling. → Phase 06, save migration v25→v26.
- **R2 (Med):** HP-floor must not corrupt non-tutorial combat. Guard by tutorial-mode flag scoped to the Moonbear mission only. → Phase 04.
- **R3 (Med):** Coachmark world-target tracks the drum each frame via `camera.project()`; perf + re-point on panel open/close. → Phase 01.
- **R4 (Low):** Gating (`blockOutside`) could trap the player if `advanceOn` never fires. Every gated step needs an escape (esc/skip-debug) + an always-reachable advance condition. → Phase 01 + 07.

## Cross-Plan Note

- Plan `260515-1844-tavern-facility` (branch `feature/wc-tavern`, 6/7 done, blockedBy [], blocks []) is the recruitment hub — it does **NOT** touch `buildFacility`, `facility-definitions.ts`, or `save-migrations.ts` (verified). Merge-conflict risk is **LOW**.
- Single real coordination point: **save version**. Latest migration is `v24→v25` (`SAVE_VERSION = 25`). Our new migration is **v25→v26**. If the tavern plan lands another migration first, rebase our migration onto the new tail version before merge. Flag, not a blocker.
- `blockedBy: []`, `blocks: []`.

## Verified Findings (affect scope)

- **Copy language = ENGLISH** (user-confirmed 2026-05-20). All player-facing strings in every phase must be English; GDD's Vietnamese beat captions are design notes only. (Drum caption fixed → "Beat the drum to view quests".)
- Founder ALWAYS gets `getDefaultSkill('warrior')` in `createFounder` — the GDD's "fixed mồi skill regardless of civ/archetype" concern is already satisfied. Phase 04 just verifies + surfaces it on the hotbar (YAGNI: no new skill-assignment code).
- `consumeItems(cost)` / `hasItems(cost)` already exist on inventory-slice — Phase 03 wires them into `buildFacility`, no new mechanic from scratch.
- `SAVE_VERSION = 25`; combat result/victory is decided by `CombatEngine.getResult()` (`enemiesAlive===0` → victory) — HP-floor hooks `target.currentHp -=` sites (combat-engine.ts ~L446, ~L534).

## Links

- GDD: [tutorial-quest-design.md](./tutorial-quest-design.md)
- Reports dir: `d:/WORLDCOLIDE/plans/reports/`
- Dev rules: `.claude/rules/development-rules.md`, `.claude/rules/documentation-management.md`
