# Phase 7 — Narrative Unlock Gates (Arc 1 Complete)

**Date**: 2026-05-23 14:30  
**Severity**: High (Arc 1 completion milestone)  
**Component**: Guild facilities, quest-gated progression, store layer  
**Status**: Resolved (595/595 tests pass, shipped on feature/WC-QuestStory)

## What Happened

Completed Arc 1 "First Tremor" (phase 7/7) by gating two guild facilities behind story-quest completion:

1. **Stone Quarry** — locked until `ft-ancient-threshold` (Q3: cave entrance reached)
2. **Alchemy Lab** — locked until `ft-ruins-forgotten-age` (Q4: ruins cleared)
3. **Remaining facilities** (Workshop, Tavern, Logging Site, Training Yard, Infirmary) — ungated, available from start

Implementation spans data layer (facility definitions), UI layer (tray component with locked message), and store layer (quest guard in buildFacility action).

## The Brutal Truth

UI-only gating is a security smell. Code review flagged that the gate lived in the component while every other build constraint (materials, permits, gold) is enforced in the store. Defense-in-depth made sense: a direct API call should still be blocked. Added the store-layer guard despite the extra complexity, because a caller shouldn't be able to bypass the UI by replicating just the Redux action.

The cross-slice state-read gotcha was annoying but manageable: reading `completedMissions` from guild-slice required a `unknown` cast because the set() callback's union type excludes the mission slice. Runtime has all slices combined, so it works, but TypeScript 2352 forced the dance.

## Technical Details

**Files modified:**

1. `src/game/data/facility-definitions.ts` — added optional `unlockQuestId?: string` to `FacilityDef`
2. `src/ui/components/facility-detail-tray.tsx` — added `completedMissions` selector, `isQuestLocked(def)` check; locked blueprints non-selectable, dimmed with `unaffordable` class, show `facilityTray.lockedByQuest` message
3. `src/game/state/guild-slice.ts` — added quest guard in `buildFacility` store action mirroring UI gate
4. `src/i18n/ui.en.json` + `src/i18n/ui.vi.json` — `facilityTray.lockedByQuest` EN + VN strings

**TypeScript cross-slice read pattern:**
```typescript
// guild-slice buildFacility action
const isLocked = (s as unknown as { completedMissions: string[] })
  .completedMissions.includes(unlockQuestId);
```
The set() callback type is `GuildSlice & InventorySlice & RosterSlice & ClockSlice`, excluding mission slice. Direct intersection cast (`as (... & MissionSlice)`) fails TS2352; `unknown` bridge works at runtime (all slices share combined store) and satisfies tsc.

**Test coverage:** 595/595 vitest pass. Existing `buildFacility` tests only build ungated facilities (tavern/training-yard), so guard short-circuits with no regression.

**Commit:** `1885c3a` on branch `feature/WC-QuestStory`.

## What We Tried

1. **UI gate only** — component checks `isQuestLocked()`, dimmed/non-selectable
2. **Code review flagged:** "every other build constraint is in the store, why not this?"
3. **Store-layer guard added** — `buildFacility` action now checks `completedMissions` before allowing build, mirroring UI constraint
4. **Cross-slice state problem:** initial attempt at direct type intersection (`as ... & MissionSlice`) failed; switched to `unknown` bridge

## Root Cause Analysis

**Why was UI-only gating insufficient?**
State machines should enforce constraints at the lowest layer where they apply. A caller with direct store access (e.g., in tests or debugging) should still be held to the same build rules. UI gate alone is a UX constraint, not an invariant—anyone reading the Redux store shape could bypass it.

**Why did the cross-slice read require casting?**
Zustand's set() callback receives a union of the slices that were explicitly composed in the store setup. The mission slice wasn't in the guild-slice's type parameter, so TypeScript doesn't know `completedMissions` exists in that union. Runtime has all slices combined (Zustand merges them), but static typing is stricter. The `unknown` bridge is a pragmatic escape: we know the value is there at runtime.

**Why old saves accept the new quest locks?**
Old saves lack the new quest IDs in `completedMissions`, so both facilities lock until Q3/Q4 are replayed. This is acceptable for Arc 1's fresh reset—documented in the plan's risk assessment. No migration needed because the unlock check is getters-only (no save format changed).

## Lessons Learned

1. **Defense-in-depth for state constraints.** A UI gate is incomplete; enforce the same rule in the store. Prevents both accidental bypasses and confusion about which layer owns the invariant.

2. **Zustand cross-slice reads require explicit typing.** The set() callback's union type is narrow by design. Casting to `unknown` then accessing the shape works, but consider: (a) is the read truly needed in this slice, or should it be a selector elsewhere? (b) might refactoring the store layout (e.g., moving quest-locked status to guild-slice on init) be cleaner? For this case, the read is infrequent (only on buildFacility), so the cast is acceptable.

3. **Quest IDs are string constants, not derived.** The two unlock quests are manually listed in facility defs. If quest names change, this breaks silently (quest never completes, facility stays locked). Future work: validate unlock IDs against the actual quest definitions on build, or generate quest-dependent facilities from a quest-first schema.

4. **Old-save strategy trades convenience for clarity.** Accepting old saves with locked facilities is simpler than writing a migration. Player expects a fresh arc on new story content, so re-earning Q3/Q4 is acceptable. Document this in patch notes.

## Next Steps

- In-app review: complete Q3 (cave entrance), verify Stone Quarry unlocks; complete Q4 (ruins), verify Alchemy Lab unlocks
- If unlock checks fail: log `buildFacility` store action to debug completedMissions state
- After approval: Arc 1 ("First Tremor") is feature-complete; merge to main and prepare release
- Future: schema-driven unlock gates (generate facility unlock IDs from quest definitions, not manual strings)

All tests passing. Store-layer gating confirmed. Ready for player testing.

## Files Changed (Summary)

- `src/game/data/facility-definitions.ts` — unlockQuestId field
- `src/ui/components/facility-detail-tray.tsx` — isQuestLocked(), locked message, dimmed state
- `src/game/state/guild-slice.ts` — buildFacility guard
- `src/i18n/ui.en.json`, `src/i18n/ui.vi.json` — localization strings
