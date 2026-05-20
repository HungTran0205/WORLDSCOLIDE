# Phase 06: State Machine Integration (8→14 Steps) + Save Migration v25→v26

**Date**: 2026-05-20 19:24
**Severity**: Medium
**Component**: Tutorial Quest Redesign / State Machine & Persistence
**Status**: Resolved

## What Happened

Phase 06 shipped the integration spine: expanded `TutorialStep` union from 8 → 14 beats (char-creation → arrival-alarm → open-quest-board → accept-bear-quest → assign-and-dispatch → quest-travel → moonbear-combat → kael-rescue → reward-splash → build-logging-site → assign-kael → first-haul-reward → build-tavern → complete), wired all five prior phases into a cohesive state machine, mounted coachmark + overlays by step, and added save migration v25→v26 remapping legacy step ids forward. Commit `42a565d` on develop.

## The Brutal Truth

This phase was the "integration crunch" — every design decision from Phases 01–05 converged into 14 tiny beats. The work itself was mechanical (rewrite step configs, hook up store predicates, add UI mounts), but non-obvious *why* things didn't auto-advance (spoiler: some beats are UI-only state, not tick-observable). The migration was the sharp pain point: legacy saves mid-tutorial had to map unambiguously forward without soft-locking (e.g., a save at `tutorial-quest-active` with a completed mission can't land on `quest-travel`; it has to skip to `kael-rescue`). No test failures, but the honest answer is the migration logic feels fragile—it's correct *for now*, but each new facility/quest that touches the early phase has to re-audit the remap table. That debt is real.

## Technical Details

**14-step expansion & advance model** (the hybrid decision):
- **Auto-advance beats** (tick-loop observable): `arrival-alarm` (NPC checks `activeMissions` for arrival marker), `assign-and-dispatch` (facility built + members visible), `quest-travel` (mission active), `build-logging-site` (facility level), `build-tavern` (tavern level > 0).
- **Handler-driven beats** (UI/callback-driven): `accept-bear-quest` (quest-board selection modal result), `moonbear-combat` (combat handler victory), `kael-rescue` (rescue handler fired), `reward-splash` (handler advance), `first-haul-reward` (first-haul handler grants 200 wood+gold then advances), `assign-kael` (handler-only, NO auto-advance fallback—see below).
- **No-advance beats** (UI-only display): `char-creation`, `open-quest-board` (drum coachmark + world-board modal).

Why hybrid? The tick loop only sees store state. Quest selection (player clicks card on board) is UI-only state, not store-observable—can't be tick-driven. So UI handlers own the truth; tick loop is the fallback.

**Shared `worldTarget` slot conflict (from Phase 05, now gated)**:
DrumTooltipArrow (open-quest-board step) and NpcAlarmModal (arrival-alarm step) both write `worldTarget` in coachmark-target-store. Phase 05 flagged this; Phase 06 enforced: drum is gated to `open-quest-board` only, alarm to `arrival-alarm` only. Never concurrent. ✓

**`assign-kael` autoAdvance=false (critical hardening)**:
The first-haul handler is the SOLE advancer because it must grant +200 wood and +200 gold BEFORE advancing. If a tick-driven backup existed, a player hitting the assign-kael step with the condition already true (member assigned) would skip the handler entirely, skip the resource grant, and land on `first-haul-reward` with only 0 resources—soft-lock on the 200-wood tavern build. Single-source-of-truth: handler only.

**Migration v25→v26 logic** (the fragility):
- Collapse deleted `slime-quest` mid-states (legacy step `tutorial-quest-active` paired with a completed slime mission + no bear mission) → `open-quest-board` (back to quest board, user re-selects bear).
- Collapse `world-board` → `arrival-alarm` (let alarm display; then UI advances to next step).
- Strip dead `tutorial-into-the-clearing` mission + free stranded members (via `stripMission('tutorial-into-the-clearing')`).
- Preserve `complete` + the existing OLD_STEPS→complete rule (v11→v12 legacy saved-game pass-through).
- **Why not naively map `tutorial-quest-active`→`quest-travel`?** If mission was deleted, `quest-travel`'s advance condition (`state.activeMissions.some(...)`) stays false forever—soft-lock. Safer: go back to board, re-select.

**Tavern level 0 seed** (undocumented but critical):
New games seed tavern at level 0. Legacy migration v25→v26 that seeded tavern at level 1 only hits saves that are already complete (passed v24→v25). New saves hit the level-0 seed, so the `build-tavern` step doesn't instant-advance on enter. Verified in seed logic; no code surprises.

**Tests + Verification**:
- `npx tsc --noEmit` clean (no new union exhaustiveness errors after expanding TutorialStep).
- 81 targeted tutorial-state tests pass (+4 new v25→v26 migration cases: legacy slime-mid, legacy quest-active-no-mission, legacy board, legacy complete).
- 581 total smoke pass / 7 fail (all pre-existing infra-test + flaky mission-tick noise, no new regressions).
- Code review: approve-with-nits. One fix applied: tick-loop tutorial autoAdvance now re-reads fresh `shouldAdvanceTutorial(step, store)` instead of stale closure state (prevents double-advance on mount).

## Decisions & Rationale

- **Hybrid advance model (auto + handler-driven)**: Store predicates alone can't see UI state. Handler-driven beats own UI-only signals (modal result, combat victory, resource grants). Fallback: if handler is missing/broken, at least the auto-advance predicates provide a recovery path.
- **Drum gated to `open-quest-board` only**: Prevents coachmark `worldTarget` collision with alarm. Two UI components fighting for one projection slot = silent cascade failures. Gate early; document the invariant.
- **`assign-kael` handler-only advance**: Resource grants are business logic, not UI state. Handler is the single source of truth; no tick-driven backup. Cost: if handler is missing, player is stuck (safer than skipping a resource grant).
- **Collapse legacy mid-states to board**: Deleting the slime quest broke the state path. Best option: don't try to predict where the player *should* be; send them back to a safe, re-playable state (quest board). Leaves agency with the player.
- **Defer `blockOutside` gating**: Coachmark spotlights are non-trapping (arrow + spotlight, no click-gating). Full click-gating (blockOutside + live selector revalidation) is Phase 07. Decision: reduce soft-lock risk now, tighten DX later.

## Lessons Learned

- **Shared resources need explicit mutual-exclusion contracts.** The `worldTarget` slot taught Phase 05 this; Phase 06 made it concrete with step-level gating. Next cross-step shared resource: document the invariant upfront (owner step, exclusivity rule, how to detect violations). Add a debug assertion.
- **Handler-driven beats are fragile.** If the handler is removed or its advance call is commented out, the step silently soft-locks. No tsc error, no runtime error—just stuck. Need runtime assertions (e.g., log a warning if a handler-drive step reaches 10+ frames without advancing) or a Phase 07 audit pass.
- **Legacy migrations are load-bearing.** The v25→v26 remap feels small (8 lines), but it's the only thing keeping mid-tutorial saves playable after a quest deletion. Every facility/quest addition in the early game has to re-audit the table. Mitigation: add a comment linking to the legacy quest/facility (e.g., `// 'tutorial-into-the-clearing' was deleted in [commit hash]`) so future devs know why the remap exists.
- **Test the happy path AND the edge cases.** Added 4 migration test cases covering (legacy board, legacy slime-active-no-mission, legacy quest-active-no-mission, legacy complete). The no-mission cases are what catch the soft-lock risk; they deserve explicit coverage.
- **Tick-loop autoAdvance can stale.** The closure-state bug (autoAdvance reading old step) caught code review. Solutions: (1) re-read state in the predicate, (2) use a ref to state (React), or (3) assert no closure state. Chose (1)—clearer intent.

## Next Steps

- **Phase 07 (polish + hardening)**: Enable coachmark `blockOutside` gating + live selector revalidation; audit handler advance calls for runtime assertions; consider a "tutorial stuck" telemetry beacon (warn if a step stalls >30s).
- **Documentation debt**: Link migration remaps to the deleted quest/facility they reference. Add coachmark `worldTarget` slot invariant to a design doc.
- **Owner**: Tutorial team (state machine stability + migration auditing).
- **Timeline**: Phase 06 complete; Phase 07 deferred for optional polish.

## Verification

- `npx tsc --noEmit` clean.
- 81 targeted tutorial-state tests pass (+4 new migration cases).
- 581 total smoke pass / 7 fail (pre-existing noise, no regressions).
- Code review: DONE, one fix applied (stale closure state in autoAdvance).
- Commit: `42a565d` on develop.
