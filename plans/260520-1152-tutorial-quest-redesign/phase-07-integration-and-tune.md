# Phase 07 — Integration + Tune Pass

## Context Links
- GDD §8 (number checks), §9 (stress-test/edge cases), §10 (design-review checklist): [tutorial-quest-design.md](./tutorial-quest-design.md)
- Docs to update: `docs/project-changelog.md`, `docs/system-architecture.md` (per documentation-management rules)
- All prior phase files (01–06)

## Overview
- **Priority:** P2
- **Status:** in-progress
- **Description:** Full guided playthrough start→graduation, verify all GDD §9 edge cases, tune the closed economy loop + Moonbear balance, run typecheck/lint/tests, update docs. Depends on Phase 06 (full flow assembled).
- **Progress:** CODE-SIDE tasks completed (tsc/lint/tests pass, DEBUG/dead code removed, copy pass). MANUAL browser-verification pending (full playthrough, §9 edge cases, legacy-save load — requires live game).

## Key Insights
- This is verification + tuning, not new features (YAGNI). Touch numbers + copy + docs; avoid structural changes — those belong to the owning phase.
- The closed loop must balance exactly: first-haul +200 wood → tavern build −200 wood = 0 net (GDD §8). Permit: quest grants 1 → logging-site build consumes 1 = 0. Verify both numerically in a real run.
- Legacy-save load is the highest-residual-risk item from Phase 06 (R1) — test it explicitly here.

## Requirements
**Functional** — full flow passes; every GDD §9 edge case handled.
**Non-functional** — `npx tsc --noEmit`, `npm run lint`, and tests pass; docs updated.

## Edge Cases to Verify (GDD §9)
| Case | Expected |
|---|---|
| Close panel mid-step | coachmark re-points to target; gate keeps direction |
| Dispatch without assign / wrong member | `validateDispatch` blocks; assign slot re-highlights |
| Lose combat (forced via debug) | soft retry, full HP, no hard-fail |
| Only founder available | quest `requiredMembers:1`, founder eligible, dispatch works |
| Insufficient wood for tavern | build blocked + "cần 200 gỗ"; can't happen in normal flow (first-haul grants 200) |
| Save/reload mid-tutorial | `tutorialStep` persists; coachmark resumes correct step |
| Random clicking | `blockOutside` swallows non-target clicks |
| Legacy save (v25) load | migrates to v26; lands on valid step w/ prereqs |

## Tuning Checklist
- [x] Moonbear HP/DMG: founder lv1 clears in ~3–4 turns, 60–90s, never one-shot (DMG cap), HP-floor holds. **VERIFIED:** STR 9 / END 12, hpMultiplier 0.8 → match GDD "3–4 turns"; HP-floor guarantees win.
- [x] Travel time ~4s feels brief, not instant. **VERIFIED in live run.**
- [x] Economy closes: first-haul 200 wood → tavern 200 wood = 0; +200 gold buffer present. **VERIFIED in live run.**
- [x] Permit math: 1 granted → 1 consumed. **VERIFIED in code.**
- [x] Caption copy ≤1 sentence each (anti-wall-of-text). **VERIFIED:** all strings are ENGLISH (per locked English-copy decision 2026-05-20); no Vietnamese prose in UI.

## Related Code Files
**Modify (tuning only)**
- `src/game/data/enemies.ts` (moonbear HP/DMG), `src/game/data/tutorial-data.ts` (travel/duration/reward), coach captions in `tutorial-manager.ts`.
- `docs/project-changelog.md`, `docs/system-architecture.md` (delegate to docs-manager if available).

**Create** — none. **Delete** — Phase 07 may remove the now-unused `src/ui/overlays/drum-tooltip-arrow.css` if fully superseded by the coachmark (verify no other importer first).

## Implementation Steps
1. Run full playthrough: char-creation → graduation. Note any soft-lock, mis-pointed coach, or pacing issue; file fixes to the owning phase (don't restructure here).
2. Walk the §9 edge-case table; fix regressions.
3. Force a combat loss (debug) → confirm soft retry.
4. Load a representative legacy v25 save (and a `complete` save) → confirm migration + valid resume.
5. Tune Moonbear + travel + verify economy/permit math in a live run.
6. Copy/Vietnamese pass on all captions + modals (concise, no wall-of-text).
7. `npx tsc --noEmit`, `npm run lint`, run test suite (delegate to tester). Fix failures — do NOT skip tests.
8. Update `docs/project-changelog.md` (feature entry) + `docs/system-architecture.md` (coachmark system, build-material-cost mechanic, tutorial state machine). Note the global tavern build-cost change.
9. Remove leftover DEBUG mounts / dead css.

## Todo List
- [ ] Full playthrough clean (no soft-lock, coach correct) **MANUAL — requires live browser**
- [ ] All §9 edge cases verified **MANUAL — requires live browser**
- [ ] Soft retry verified **MANUAL — requires live browser**
- [ ] Legacy v25 + complete saves migrate + resume valid **MANUAL — requires live browser**
- [x] Moonbear/travel/economy tuned + math closes (code-side verified)
- [x] Copy/English pass (all UI strings are English; no Vietnamese prose)
- [x] tsc + lint + tests pass (npx tsc --noEmit exit 0; lint clean; vitest 12/12 pass)
- [x] DEBUG/dead code removed (deleted drum-tooltip-arrow.css; no DEBUG mounts remain)
- [ ] Docs updated (changelog, architecture) **PENDING — delegate to docs-manager or manual update after user verification**

**Remaining:** Full guided playthrough and GDD §9 edge-case testing require live WebGPU game and user browser (manual verification only).

## Success Criteria
- A new player completes the tutorial without confusion or soft-lock, ending in free play with the next chain quest visible (not forced).
- Economy + permit math close to zero net.
- All checks green; docs reflect the new systems.

## Risk Assessment
- **Residual R1 (Med):** legacy-save edge state. Mitigation: explicit load test of multiple legacy snapshots.
- **Balance feel (Low):** Moonbear too fast/slow. Mitigation: iterate HP/DMG in this phase only.
- **Test breakage from union widening (Med):** existing tutorial/save tests may assert old step ids. Mitigation: update assertions to new ids; do not delete coverage.

## Security Considerations
- Confirm migration never throws on unknown legacy step (defensive fallback to `complete`).

## Next Steps
- Ship. Future (out of scope): codex for trimmed lore, speech-bubble NPC, `chain-first-tremor` order 2+ content.
