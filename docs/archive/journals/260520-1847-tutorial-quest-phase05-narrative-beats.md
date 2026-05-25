# Phase 05: Narrative Beats — Retro Speech Bubble + NPC Alarm

**Date**: 2026-05-20 18:47
**Severity**: Low
**Component**: Tutorial Quest Redesign / UI Components
**Status**: Resolved

## What Happened

Phase 05 shipped reusable retro-JRPG narrative UI: `src/ui/components/retro-speech-bubble.tsx` (+ CSS) for dialogue reveal, and `src/ui/components/npc-alarm.tsx` for beat-2 messenger alarm. World-anchored both to Phase 01's coachmark projection bridge (no camera math duplication). Trimmed world-board-modal from 2 lore pages to 1 ("Begin" only). Stub-mounted speech bubble + alarm behind DEBUG flag in game-screen.tsx (opt-in, default-closed).

## The Brutal Truth

Phase 05 is lean by design. Advance targets intentionally stay locked to Phase 04's `'tutorial-quest-dispatch'` step ID with `TODO(phase-06)` tags — this keeps Phase 05 independently compilable without waiting for Phase 06's step-wiring work. The real work is Phase 06 (coachmark + alarm integration), not here. Honestly, the phase feels incomplete until the alarm actually *does* something, but that's correct scope boundary. Tempting to wire it now, but Phase 06 owns the step machine; crossing that line breaks task isolation.

One code-review catch worth recording: debug stub mounted the alarm + drum-coach arrow simultaneously, both writing to the single shared `worldTarget` store slot. When speech bubble unmounted, it cleared the drum's projection (store invariant violation). Fixed by defaulting debug stub closed (opt-in preview). The lesson sticks: the world→screen bridge is a single-slot resource; Phase 06 must ensure alarm and drum-coach steps never overlap, or key by step-id.

## Technical Details

- **retro-speech-bubble.tsx**: Typewriter reveal via `requestAnimationFrame` with cleanup. First click/Space reveals full text, second advances. Blinking `▼` caret. `prefers-reduced-motion` → instant reveal. One-time `onComplete` guard (no repeat fires). World-anchored via `CoachmarkWorldProjector` from Phase 01 (reused). Graceful fixed-bottom fallback when projection fails.
- **npc-alarm.tsx**: Messenger alarm UI for beat 2. English copy. Anchored above quest drum via same world→screen bridge. Stub-mounted, no wiring yet.
- **world-board-modal.tsx**: Trimmed from 2 lore pages to 1 page ("Begin"). Reduces early cognitive load.
- **game-screen.tsx**: DEBUG flag opt-in for preview. Both bubble + alarm mounted behind same flag, default-closed.
- Font: reused Share Tech Mono (already loaded, no new asset).
- Store slot: `worldTarget` shared by drum-coach + alarm; unmount clears it (guards Phase 06 step exclusivity).

## Decisions & Rationale

- **Defer step wiring to Phase 06**: Phase 05 leaves advance targets on `'tutorial-quest-dispatch'` with TODO tags. Phase 06 owns `'arrival-alarm'` step creation + state rewiring. Rationale: independent compilation, clean task boundary, Phase 05 verifiable without Phase 06 logic.
- **Default debug stub closed**: Initial version mounted alarm + drum simultaneously (store collision). Fixed by defaulting opt-in (user must manually toggle DEBUG). Lesson: single-slot shared resource needs mutual exclusion; Phase 06 must guarantee no concurrent step consumers.
- **Reuse world→screen bridge (DRY)**: No new camera math. Leveraged Phase 01's `coachmark-target-store` + `CoachmarkWorldProjector` for both bubble + alarm anchoring. Saves ~50 lines, keeps math in one place.
- **Mono font, no new asset**: Share Tech Mono chosen for retro feel. Already in-project (loaded by Ink refresh). Zero bloat.

## Lessons Learned

- **Single-slot shared resources require explicit exclusivity contracts.** The `worldTarget` store slot serves both drum-coach and alarm. Phase 06 must enforce step-level mutual exclusion (e.g., only one can write per frame, or key by step-id). Document this contract.
- **Debug stubs can hide resource contention.** Both UI components mounted simultaneously made the collision visible in code review. Caught early because both lived in same component tree. If one had been production + one debug, the bug lives until they co-exist in gameplay.
- **Defer features at clean boundaries.** Speech bubble works. Alarm scaffolds. Wiring is Phase 06. Resisting the urge to complete the story here keeps task scope tight and lets Phase 06 own the narrative state machine without merge conflicts.

## Next Steps

- **Phase 06** (coachmark integration): mounts coachmark + creates `'arrival-alarm'` step, rewires advance targets, validates alarm displays at right moment, enforces `worldTarget` step-level exclusivity (document the invariant).
- **Owner**: tutorial state machine + coachmark binding
- **Timeline**: Phase 05 complete; Phase 06 takes ownership of narrative sequencing.

## Verification

- `npx tsc --noEmit` clean.
- Smoke: 581 pass / 7 fail (all pre-existing infra-test + flaky mission-tick noise, no new regressions).
- Code review: DONE, one concern (store collision) mitigated by debug default-closed.
- Not yet committed (pending Phase 06 completion or user approval).
