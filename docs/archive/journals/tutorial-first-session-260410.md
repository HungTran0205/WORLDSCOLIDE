# Tutorial First-Session Implementation Complete

**Date**: 2026-04-10 21:00
**Severity**: Medium
**Component**: Game Flow, Tutorial System, First-Time User Experience
**Status**: Resolved

## What Happened

Replaced the sandbox-intro placeholder with a narrative-driven first-session tutorial. Players now unlock 4 sequential quests tied to core game mechanics (build a facility, win a mission, defend from an arena attack, explore three locations). The system gates progression on tutorial completion while preserving sandbox play post-tutorial. All 38 game tests pass; zero TypeScript errors.

## The Brutal Truth

This felt like balancing simplicity with integration depth. We had a tutorial system that was half-baked—just a `tutorialStep` field with no actual progression flow. Building it out meant touching 16 files across state, UI, game loop, and quest systems. The relief: we didn't create a new Zustand slice. Everything pivoted off the existing `tutorialStep` enum, which meant less boilerplate and fewer state synchronization headaches.

The hardest part was the cost bypass for facility building. We needed players to build a facility tutorial-gated without having to farm gold first. A single `if (isTutorialBuild)` branch in `buildFacility` solved it, but it's a code smell we'll want to refactor later if tutorial complexity grows.

## Technical Details

### Architecture

**State**: `game-state.ts` — no new slice
- Tutorial progression stored in `tutorialStep` (enum: 'complete' | 'build-facility' | etc.)
- Quest data for tutorial missions lives in `missions.ts`, gated by `isTutorialMission` flag
- No new Redux slices; reused existing mission and guild state

**Tutorial Data** (`tutorial-data.ts` — NEW)
- Static JSON mapping: step → quest ID, description, completion predicate
- Quest definitions: build facility (step 1), win mission (step 2), defend arena (step 3), explore locations (step 4)
- All tutorial quest rewards are cosmetic/narrative; no stat breakage for progression speed

**Quest Completion Handler** (`tutorial-quest-handler.ts` — NEW)
- Pure function `handleTutorialQuestComplete(step, action)` → next step | 'complete'
- Called from two entry points: `mission-tick.ts` (mission win detection) and `arena-result-handler.ts` (arena win detection)
- No side effects; caller applies state mutations via dispatch

**UI Layer**
- `world-board-modal.tsx` (NEW) — displays tutorial quest goals and progress
- `tutorial-dialogue-overlays.tsx` (NEW) — contextual overlays for step-specific guidance (e.g., "Click Facilities to build")
- Modals appear gated by tutorial step; dismissed via button or auto-hide on completion

**Cost Bypass**
- `buildFacility` in `items.ts`: Added single `if` condition checking inventory for tutorial-bypass item
- Rationale: Avoids major refactor; isolated to one function. Trade-off: slightly fragile if tutorial changes.

**Save Compatibility**
- New migration `v11→v12` in `save-migrations.ts`
- Old saves with `tutorialStep` values like 'sandbox-intro' or 'first-build' auto-map to 'complete'
- `save-validation.ts` updated to accept both old and new enum values during backward-compatibility window

### Key Decisions Made

1. **No New Slice**: Tutorial state lives in `tutorialStep` field of root game state, not a dedicated `tutorialSlice`. Rationale: Tutorial is ephemeral per playthrough; doesn't warrant a separate Redux subtree. Simpler selectors, fewer multi-slice hydration issues.

2. **Static Tutorial Data**: Quest definitions hardcoded in `tutorial-data.ts`, not dynamically fetched. Rationale: Tutorial is fixed content; no reason to make it configurable. Simpler to test, easier to reason about step sequences.

3. **Pure Quest Handler Function**: `handleTutorialQuestComplete` is side-effect-free. Dispatches the state change; doesn't mutate directly. Rationale: Testable in isolation, reusable from multiple async contexts (mission-tick, arena-result), clear data flow.

4. **Cost Bypass via Inventory Check**: Instead of a new parameter in `buildFacility`, we check for a hidden tutorial item in inventory. Rationale: Avoids modifying the public API; tutorial concerns stay in `items.ts`. Downside: slightly magical; documented with comment.

5. **Modal-Based Guidance**: Tutorial overlays are separate components, not inline game-screen changes. Rationale: Keeps game-screen.tsx lean; tutorial UI can iterate independently. Dismissible without affecting game state.

## What We Tried

1. **Creating a `tutorialSlice`** → Rejected. Too much boilerplate for a single step counter. Reusing existing `tutorialStep` field was cleaner.

2. **Dynamically loading tutorial quests from backend** → Rejected. Tutorial is static by design; no reason to add network latency to first boot.

3. **Hardcoding cost bypass as a `tutorialMode` boolean** → Rejected. Inventory-check approach is more flexible if we ever need to gate multiple tutorial builds or add conditional costs.

4. **Inline overlays in game-screen.tsx** → Started here, moved to dedicated `tutorial-dialogue-overlays.tsx`. Game-screen was getting cluttered; separation of concerns won.

5. **Auto-advance tutorial steps without explicit quest completion** → Rejected. Players need clear feedback on what's required. Explicit quest completion ensures transparency and replayability.

## Root Cause Analysis

Why a new tutorial was needed:

1. **Sandbox-intro was incomplete**: Placeholder text, no progression hooks, didn't teach core mechanics.

2. **New players had no guided entry point**: They could build facilities, fight, etc. but no structured learning. Onboarding suffered.

3. **Quest system existed but unused for tutorials**: We had quest infrastructure; reusing it for tutorial progression was natural and avoided new patterns.

## Lessons Learned

1. **Avoid State Proliferation**: Adding `tutorialStep` to existing game state was simpler than a new slice. If tutorial grows (branching paths, repeatable tutorials), we'll feel the pain and refactor. For now: YAGNI wins.

2. **Cost Bypasses Should Be Explicit**: The inventory-check hack works, but it's a code smell. If tutorial complexity grows (conditional costs, unlockable features), we'll want a formal `TutorialContext` passed to relevant functions. Plan for this in next pass.

3. **Modal-Based Guidance > Inline Changes**: Separating tutorial UI from game-screen avoids mutation hell. Game-screen stays focused on rendering the game, not tutorial state.

4. **Pure Functions for Cross-System Concerns**: `handleTutorialQuestComplete` being side-effect-free meant it could be called from mission-tick, arena-result-handler, and tested independently. Worth the upfront discipline.

5. **Save Migrations are Tedious but Critical**: The v11→v12 migration was straightforward (remap old steps to 'complete'), but it's a chore we'll repeat. Document migration rationale clearly for future iterations.

## Next Steps

1. **Player Testing**: Verify tutorial pacing feels right (can a new player complete it in < 5 minutes?). Test on mobile if responsive design is a goal.

2. **Cost Bypass Refactor**: Extract the inventory check into a formal tutorial context parameter. Plan for when tutorial branches or gets more complex.

3. **Accessibility**: Overlays should be dismissible with keyboard (Esc key). Test with screen readers if a11y is a project goal.

4. **Analytics**: Track tutorial completion rate, drop-off points. Data will guide iteration.

5. **Replayability**: Future feature: allow replaying tutorial from game menu. Currently one-time-only.

---

## Code Files Created

- `src/game/systems/tutorial-data.ts` — Tutorial quest definitions, step mappings
- `src/game/systems/tutorial-quest-handler.ts` — Pure function for step progression
- `src/ui/screens/world-board-modal.tsx` — Tutorial quest display, progress tracking
- `src/ui/overlays/tutorial-dialogue-overlays.tsx` — Contextual guidance overlays

## Code Files Modified

- `src/game/state/game-state.ts` — (no change; tutorialStep already existed)
- `src/items.ts` — Added cost bypass `if` condition for tutorial facility build
- `src/game/state/save-validation.ts` — Updated to accept old tutorialStep enum values
- `src/game/state/save-types.ts` — No breaking changes to SaveState; backward compat preserved
- `src/game/state/save-migrations.ts` — Added v11→v12 migration mapping old steps to 'complete'
- `src/game/systems/tutorial-manager.ts` — Integrated with new quest handler
- `src/game/systems/mission-tick.ts` — Call `handleTutorialQuestComplete` on mission win
- `src/game/systems/arena-result-handler.ts` — Call `handleTutorialQuestComplete` on arena win
- `src/missions.ts` — Added `isTutorialMission` flag to quest definitions
- `src/game/state/guild-slice.ts` — (minor: ensure tutorial quests respect member assignment)
- `src/ui/screens/quest-board.tsx` — Filter tutorial vs. regular quests in display
- `src/ui/screens/facilities-panel.tsx` — Show cost bypass item in inventory when tutorial-gated build
- `src/ui/screens/game-screen.tsx` — Render tutorial overlays based on tutorialStep
- `src/game/systems/use-game-tick-loop.ts` — (minor: ensure tutorial step doesn't block offline mode)
- `src/ui/character-creation/char-creation.tsx` — (minor: initialize tutorialStep on first boot)

**Test Results**: 38/38 game tests passing

---

## Backward Compatibility

Old saves with `tutorialStep` ∈ {'sandbox-intro', 'first-build', 'first-win', etc.} auto-migrate to 'complete'. Players who already finished the old placeholder tutorial are treated as tutorial-done and can play sandbox immediately. No forced replay.

**Unresolved Questions**:
- Should tutorial be repeatable from the game menu, or strictly one-time per playthrough?
- How do we handle tutorial progression if a player leaves mid-tutorial and returns days later? Grace period or reset?
- Cost bypass via inventory check: acceptable technical debt or refactor now?
