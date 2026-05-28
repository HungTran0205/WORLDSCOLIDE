# Phase 03: Economy — Build-Cost + First-Haul

**Date**: 2026-05-20 14:31
**Severity**: Medium
**Component**: Tutorial Quest Redesign / Guild Economy
**Status**: Resolved

## What Happened

Phase 03 of plan `260520-1152-tutorial-quest-redesign` shipped the economy scaffolding for the tutorial: facility build-material-cost, atomic deduction inside `buildFacility`, build UI affordability gating, and a scripted first-haul reward handler.

## The Brutal Truth

The GDD had `buildMaterialCost` in §0.3 as a locked global change, which means we shipped a **production-wide behavior shift** (every tavern build now costs 200 wood) as part of a tutorial plan. That's the right call per the GDD but easy to miss if you're only scanning tutorial files. Anyone touching facility builds after this must check `FacilityDef.buildMaterialCost` first.

The code review surfaced H2 (null-return from `getNextStep` would silently re-grant 200 wood on repeated assign clicks) — we fixed it in-phase with `?? 'complete'` as the gate. H1 (autoAdvance race between tick loop and assign onClick) was analyzed and deferred to Phase 06: `shouldAdvanceTutorial` runs in the game loop tick; `handleFirstHaul` runs synchronously in the onClick handler, so the handler always wins. Deferral is safe, not avoidance.

Founder-soft-lock is the one honest hole: if the player assigns the guild founder instead of Kael, `handleFirstHaul` gets no wood and the tutorial stalls silently. Not a current crash, but it will feel like a freeze in play. Phase 06 owns the fix.

## Technical Details

- `FacilityDef.buildMaterialCost?: Partial<Record<ItemID, number>>` added to `src/game/data/facility-definitions.ts`; tavern seeded with `{ WOOD: 200 }`.
- `buildFacility` non-permit branch in `src/game/state/guild-slice.ts`: material check + deduction inlined inside the single `set()` call. Calling `consumeItems` (which is itself a `set()`) inside another `set()` is a Zustand anti-pattern — avoided deliberately. Returns `null` (no-op) if insufficient materials.
- `src/ui/components/facility-detail-tray.tsx`: wood cost label, row disabled + greyed when unaffordable, "Need 200 Oak Wood" caption.
- `src/game/systems/tutorial-first-haul-handler.ts`: guarded on step `assign-kael` + Kael member + logging-site facilityId. Grants +200 WOOD +200 gold once, advances step via `getNextStep('assign-kael') ?? 'complete'`.
- `src/ui/components/tutorial-first-haul-splash.tsx`: presentational component built but **not mounted** — Phase 06 mounts it.
- `src/game/state/guild-slice-phase03-economy.test.ts`: 18 tests, all pass. `tsc --noEmit` clean. Full suite noise is pre-existing infra/mission-tick failures (no regressions introduced).

## What We Tried / Decisions

- **Inline atomic deduct vs. `consumeItems` delegation**: chose inline to match the existing permit branch pattern and avoid nested `set()` calls. Consistency with the codebase outweighed DRY here.
- **`?? 'complete'` re-grant gate**: code review caught that `getNextStep` returning null would let repeat clicks re-grant wood. One-liner fix, should have been in the original design.
- **Mixed gold+material label (M1)**: UI copy now reads material costs separate from gold. Fixed in-phase.

## Lessons Learned

- **Global economy fields in tutorial plans need a callout.** `buildMaterialCost` is not tutorial-scoped — it affects every game session. A one-liner note in the plan ("this change is global per GDD §X.X") saves 10 minutes of head-scratching in code review.
- **Null-return gates on once-only rewards must be explicit from day one.** The `?? 'complete'` fix is trivial; forgetting it is not. Template: "what happens if this is called twice?" before writing any reward handler.
- **Deferred deferred deferred.** Three concerns kicked to Phase 06: H1 race, M4 splash mount/step-ordering contract, founder-soft-lock. All have written rationale. If Phase 06 ships without addressing them, they become silent bugs in tutorial QA.

## Next Steps

- **Phase 06** (step ordering + splash mount): resolves H1 autoAdvance race, mounts `tutorial-first-haul-splash.tsx`, closes founder-soft-lock (validate `memberId === KAEL_ID` or surface error).
- **Owner**: tutorial systems + economy
- **Timeline**: Phases 04–05 must complete first (currently unblocked in parallel); Phase 06 is the integration phase.
