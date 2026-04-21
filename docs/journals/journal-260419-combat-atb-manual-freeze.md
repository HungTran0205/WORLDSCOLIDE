# Combat ATB Manual Mode: Engine Freeze Fix

**Date**: 2026-04-19 11:41
**Severity**: High
**Component**: Combat System (ATB Timeline, Manual Mode)
**Status**: Resolved

## What Happened

Implemented unified ATB timeline with proper manual mode behavior. Previously, manual mode had two de facto separate timelines: allies froze waiting for player input while enemies attacked freely. The fix freezes the entire engine when an ally's turn fires, preventing enemies from acting during player decision time.

## The Brutal Truth

This was a design flaw masquerading as a minor UI issue. The engine kept ticking, enemies kept gaining ATB charge, and the "manual mode" was actually just "selective pause." It felt broken because it was broken — you could watch enemy numbers tick up while your ally stood there waiting for your command. Fixing it required rethinking how `tick()` fundamentally works.

## Technical Details

**Architecture change:**
- Added `CombatEngine.pausedForAllyTurn: string | null` field to track frozen state
- Rewrote `tick()` logic: when `pausedForAllyTurn` is set and no pending action exists, return `[]` (zero ticks, engine suspended)
- Clearing pause happens only when player commits an action, then engine resumes normally
- New event type `ally-turn-start` added to `CombatEvent` union

**UI syncing:**
- `activeAllyTurnId` in Zustand store updated every frame from engine state
- Timeline bar: gold pulsing outline on active entity (`.active-turn` CSS class)
- Skill hotbar: "YOUR TURN" badge visible + non-active ally slots dimmed to 0.4 opacity
- Edge case handled: manual→auto toggle while frozen clears pause immediately (EC-3)

**Tests:** 5 new tests in `tests/combat-engine-manual-atb.test.ts`, all passing. Full suite: 219/219 passing.

## What We Tried

Initial approach was blocking only ally advancement. That failed because enemies still progressed in parallel. The breakthrough was realizing: if one entity's turn is active, *time itself must stop for everyone else*. This is mechanically cleaner than selective entity filtering.

## Root Cause Analysis

We designed ATB as a continuous timer system without properly defining what "manual mode" means. Manual mode requires pausing time, not just blocking one entity type. The old code treated pause as a cosmetic wrapper around tick selection rather than a fundamental engine state.

## Lessons Learned

- Always clarify pause semantics: Does it mean "freeze time for everyone" or "skip this entity type"? The answer changes architecture
- Event-driven state (ally-turn-start) beats implicit state inference — the timeline bar shouldn't guess which ally is active
- Edge cases like mode-switching-while-paused are design questions, not bugs — they reveal incomplete thinking upfront

## Next Steps

- Monitor in-game manual mode sessions for edge cases with >2 allies or special abilities
- Document pause semantics in `combat-types.ts` for future work
- Consider extracting pause logic into a separate `PauseManager` class if manual-vs-auto grows more complex

**Commit**: 625f182 on feature/WC-ALCHEMY
