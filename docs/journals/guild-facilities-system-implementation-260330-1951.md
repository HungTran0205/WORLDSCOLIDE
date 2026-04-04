# Guild Facilities System Implementation Complete

**Date**: 2026-03-30 19:51
**Severity**: Medium
**Component**: Guild Facilities System, Member Management, Production System
**Status**: Resolved

## What Happened

Shipped a unified Guild Facilities System replacing the scattered TavernPanel with a cohesive FacilitiesPanel. Four facility types now exist: Tavern (lv1 default), Training Yard, Infirmary, and Workshop. Each facility accepts member assignments and generates passive production/benefits per game-day. Offline production runs when game starts with ≥1 minute elapsed.

Commit: `1bebd04 feat: implement guild facilities system with member assignments`

## The Brutal Truth

This felt like threading a needle. We had to merge disparate concerns—production mechanics, member assignments, state management, UI rendering—while respecting the no-new-slice mandate and keeping the entire system zero-TypeScript-errors on first run. The trickiest part: balancing three separate production types (EXP, items, gold) with asymmetric stat bonuses per facility, all while keeping offline calculations pure (no side effects).

The bigger relief: we killed TavernPanel entirely. One less widget to maintain. One fewer mental model in the codebase.

## Technical Details

### Architecture

**Guild Slice (`guild-slice.ts`)**: Facilities live directly in GuildSlice, no new slice created.
- Default state: `facilities: GuildFacility[]` with 4 entries (tavern at lv1, others at lv0)
- New member status: `'assigned'` (blocks missions + promotions when active)
- Ephemeral state: `offlineFacilityReport: FacilityProductionResult[] | null` (never persisted in save)

**Production System (`facility-production-system.ts`)**:
- Pure functions only — no side effects, no store access
- Training Yard: base EXP [12, 22, 40]/day scaled by `(1 + (DEX + AGI) * 0.002)`
- Workshop: multi-item output with STR speed multiplier + DEX quality roll (2x iron ore at lv2+)
- Tavern: upkeep reduction capped at 10% daily, scaled by total CHA of assigned members
- Infirmary: recovery multiplier (0.2–0.75) derived from avg END+INT of assigned members

**Game Tick Loop**: Offline production triggered at game startup if `offlineElapsedHours >= 1` (max cap: 30 game-days). Results stored in `offlineFacilityReport` and displayed in `OfflineFacilityPopup` before clearing.

### Key Decisions Made

1. **Ephemeral Report**: `offlineFacilityReport` is NOT persisted in saves. Rationale: avoids stale data bugs if player force-closes mid-session; popup shows results then discards them. Clean UX.

2. **Member Status 'assigned'**: New status blocks both missions AND promotions. This prevents soft-lock scenarios where a player assigns someone and then can't interact with them.

3. **Pure Production Functions**: `facility-production-system.ts` contains zero state mutations. Caller (game tick loop) applies results. Makes testing trivial and prevents accidental save state leaks.

4. **Stat Bonuses Asymmetry**: Each facility has different stat scaling:
   - Training Yard: DEX + AGI
   - Workshop: STR (primary) + DEX (quality roll)
   - Tavern: CHA
   - Infirmary: END + INT

   This forces trade-off decisions—you can't max out one member for all facilities.

5. **No New Slice**: Stored in GuildSlice instead of creating `facilitySlice`. Reduces cognitive load; facilities are inherently part of guild state. Avoids multi-slice synchronization headaches.

## What We Tried

1. **Initial: Tavern as separate facility** → Merged it into unified system. Tavern is now facility type 'tavern' with level 1 default, same interface as others. Simpler than special-casing.

2. **Persisting offlineFacilityReport** → Rejected. Too many edge cases: what if report is stale after a crash? Better to compute fresh on startup and discard.

3. **Blocking ALL actions for assigned members** → Too harsh. Only blocks missions + promotions; members can still attend guild events, etc. Preserves player agency.

## Root Cause Analysis

**Why this took effort**: Coordinating four independent production formulas under one UI while maintaining stat scaling balance requires careful arithmetic. The infirmary recovery multiplier calculation (`Math.max(0.2, base - (avgEnd + avgInt) * 0.001)`) was revised three times to avoid underflow bugs and preserve meaning at high stats. Early drafts had recovery bottoming at 0 (useless); now it clamps at 0.2x, always meaningful.

**Why we succeeded**: Pure function design in `facility-production-system.ts` decoupled production logic from UI/state, making it testable in isolation. When the workshop quality roll was bugged (not doubling iron ore), tracing was instant—just read the pure function.

## Lessons Learned

1. **Ephemeral State is Underused**: Storing transient data (offline reports, temp UI state) in Redux is a code smell. Keep it local or in a dedicated ephemeral slice. Easier to reason about.

2. **Stat Scaling is Harder Than It Looks**: Four facilities × five stat types = 20 potential knobs to turn. Document scaling ratios in code comments; we missed this initially and had to reverse-engineer our own math.

3. **Member Status Semantics Matter**: 'assigned' is not just a label—it's a contract. Spell out what it blocks in stone. We should have docs-locked this decision early.

4. **Production System as Pure Functions Pays Off**: Testing, debugging, and extending are all trivial. If production ever needs async features (like network calls), we'll feel the pain, but for now: zero regrets.

## Next Steps

1. **Testing**: Run full integration suite on facility assignments, offline production, and member status transitions. Ensure no edge cases with multiple members per facility.

2. **Docs**: Add production formula reference to `code-standards.md` or new `facility-system-spec.md` to lock in math forever.

3. **Member Card Status**: Update member-card UI to show "In Facility: [facility name]" when status === 'assigned'. Currently shows generic "In Facility"; could be more informative.

4. **Offline Production Cap**: Document the 30-game-day cap more prominently—players might not realize offline time is capped. Consider UI indicator.

5. **Future Expansion**: System supports arbitrary facility types and stat bonuses via `FACILITY_DEFINITIONS` lookup. Adding a fifth facility (e.g., Library for INT/WIS research) is trivial.

---

**Unresolved Questions**:
- Should infirmary recovery apply retroactively to existing injuries, or only new injuries incurred after assignment?
- Workshop quality roll at lv2+ with DEX—should it extend to other output types (wood, stone) or just iron ore?
