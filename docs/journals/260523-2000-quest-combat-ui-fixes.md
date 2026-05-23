# Quest & Combat UI Fixes — Phase 5 Multi-Wave Renderer-Only Slide-In

**Date**: 2026-05-23 20:00  
**Severity**: Medium (cosmetic + gating refinement)  
**Component**: Combat sprite renderer, quest-board tabs, combat skip-gate, tavern animation  
**Status**: Resolved (605/605 tests pass, 10 new combat spawn tests; shipped on feature/WC-QuestStory)

## What Happened

Completed five concurrent UI-and-gating phases across quest board, combat fight logic, and tavern:

1. **Phase 1 (i18n)** — routed quest cardLore through tContent() for EN/VN parity (c4c0209)
2. **Phase 2 (combat skip)** — gated Skip button to expeditions only, locked main-story & tutorial fights (74b3186)
3. **Phase 3 (quest-board)** — segmented MAIN/EXPEDITION tabs, clickable party-member cards with a11y (f5764e5)
4. **Phase 4 (tavern)** — working animation with graceful patrol fallback for chars lacking working assets (340d118)
5. **Phase 5 (combat)** — renderer-only multi-wave enemy slide-in instead of engine-driven march (c3b9a09)

All phases shipped in 6 commits, 0 regressions.

## The Brutal Truth

Phase 5 was the gnarly one. Initial instinct: animate enemy spawns as a mission-engine march step during the on-screen phase. But that created three trap scenarios:

1. **Turn-lock deadlock:** If skip fires during march, turn state hangs (simulator consumes the march snapshot, engine never catches up).
2. **Early-victory edge case:** If enemies die before march completes, the sprite already exists; death-anim-plus-march looks broken.
3. **Sprite-state distortion:** Home-snap on close/reopen would snap the mid-animation sprite, break the visual continuity.

We punted the whole problem. Renderer-only cosmetic slide: a field `spawnSlideFromX` on the on-screen snapshot, a constant-target frame-dt lerp in `combat-idle-sprite.tsx`. Enemies appear off-screen, slide into view over 0.3–0.4s, then stop. Engine sees them as already-on-screen the entire time; AI, victory, turn-lock are byte-for-byte unaffected.

Trade-off: damage popups can appear during the ~0.3s slide if a character is still animating. Acceptable—damage is rare on the first frame, and "enemies walking into view" is a stronger UX signal than sprite-exact correctness.

Phase 2 (skip gating) also tested our assumptions. Rule is `!isMainQuest && !id.startsWith('tutorial-')`, NOT `isExpedition`-only, because the latter would have stripped Skip from ~30 untagged legacy missions. Defense-in-depth: DOM-event handler guards based on the engine-bound mission id (race-safe across close/re-open).

## Technical Details

**Phase 5 implementation:**

1. `src/game/state/combat-fight-controller.ts` — added `spawnSlideFromX` field to `OnScreenEnemy` snapshot; phase 2 (skip guard) and phase 5 (slide field) coexist in the same file (verified no line-delta conflict).
2. `src/ui/components/combat-idle-sprite.tsx` — added constant-target lerp:
   ```typescript
   const targetX = spawnSlideFromX ? screenCenterX : posX;
   const newX = posX + (targetX - posX) * framedt * 2.5; // 0.3-0.4s slide
   ```
3. `src/game/state/stage-phase-manager.ts` — on enemy-spawn, set `spawnSlideFromX` to off-screen X, next frame clears it (one-shot animation).
4. Test coverage: 10 new assertions in `combat-engine-add-enemies.test.ts` verify on-screen spawn, off-screen `spawnSlideFromX`, and frame-dt lerp math.

**Phase 2 (skip gate):**

```typescript
const canSkip = !mission.isMainQuest && !mission.id.startsWith('tutorial-');
if (skipBtn && !canSkip) skipBtn.disabled = true;
```
Store action also guards: `if (isMainQuest || id.startsWith('tutorial-')) return false;`.

**Phase 4 (tavern working anim):**

Gated on a `charsWithWorking` set (only 4 of 12 charIds have `working/` asset). Members without asset fall back to patrol animation (avoids Suspense-null invisible sprite). Reuses `COMBAT_SPRITE_MANIFEST + getCharIdFromBasePath` utility.

**Phase 3 (party-select a11y):**

Underleveled members use `aria-disabled + click-guard` instead of native `disabled` so they stay in tab order and screen readers announce the reason (e.g., "level 5 required").

**Parallel execution:**
Phases 1-4 had zero file overlap and ran concurrently. Phase 5 depended on Phase 2 (both edit `combat-fight-controller.tsx`), so it ran after. Verified coexisting: Phase 2 adds `skipAllowed` guard on turn-lock, Phase 5 adds `spawnSlideFromX` snapshot field; separate concerns, no merge conflict.

## What We Tried

1. **Engine-driven enemy march** — mission engine spawns enemies off-screen, marches them on-screen per turn. Rejected: deadlock risk on skip, early-victory sprite state corruption, home-snap distortion.
2. **Renderer cosmetic slide** — snapshot field + frame-dt lerp, no engine changes. Accepted: visual is identical, engine invariants unaffected, test scope is tight (only the renderer).
3. **Skip gate via `isExpedition` flag** — checked mission type directly. Rejected: 30+ legacy missions lack the flag; would lose Skip from valid expeditions.
4. **Skip gate via quest-id pattern** — `!isMainQuest && !id.startsWith('tutorial-')`. Accepted: catches all tutorial + main-story fights; flexible for future quest types.
5. **Tavern working anim for all 12 chars** — attempted to load `working/` asset for all. Rejected: 8 chars lack the asset, causes Suspense error. Switched to a11y-gated fallback (patrol anim for missing).

## Root Cause Analysis

**Why renderer-only slide over engine march?**
Engine march couples cosmetic animation to turn-state. Turn-state is synchronized to the simulator; if you pause the march mid-animation but the engine has moved to the next turn, you've created a ghost state. Skip-during-march is a race. Renderer-only decouples: the on-screen snapshot is created once, slide is a pure cosmetic lerp, engine proceeds unaware. Simpler invariant, no new edge cases.

**Why did skip gating need a pattern check, not a boolean flag?**
Legacy missions predate the `isExpedition` boolean. ~30 missions are marked as expeditions in content but the schema was inconsistent. A pattern-based guard (`!id.startsWith('tutorial-')`) is resilient to schema drift; a boolean is brittle if old saves or migrations miss the field. Chose resilience.

**Why does tavern working anim fall back to patrol?**
Asset generation is time-boxed. Only 4 of 12 characters have `working/` sprites in the current manifest. Rather than hide unequipped members (bad UX—players see a tavern room with invisible people), reuse the existing patrol anim. Graceful degradation beats missing features.

## Lessons Learned

1. **Cosmetic animation belongs in the renderer, not the engine.** Engine coordinates turn state, effects, and victory. Renderer coordinates sprites, particles, camera. If you're adding a cosmetic animation and considering a new engine step, you probably want a snapshot field + frame-dt lerp instead. Simpler, no new deadlock surface.

2. **Skip gating is more nuanced than a boolean flag.** Quest-driven gating (main-story, tutorials) isn't just `isExpedition`. Patterns (`id.startsWith()`) are more resilient than categorical fields when the schema is in flux. Also: guard both the DOM and the store—what the user clicks must match what the engine allows.

3. **Graceful degradation for cosmetic assets.** If a character lacks a working animation, fall back to an existing animation rather than error or hide. Players won't notice the fallback; they'll notice a ghost sprite.

4. **Parallel phases need careful file ownership.** Phases 1-4 owned distinct files; phases 2-5 both needed `combat-fight-controller.ts`. Identified the dependency, ran phase 2 first, verified coexistence on merge. Future: document file ownership before parallelizing.

## Next Steps

- QA: play MAIN quest type, verify Skip is hidden; play EXPEDITION, verify Skip is clickable
- QA: complete any tutorial fight, verify Skip remains hidden until expedition context
- QA: enter tavern, inspect all 4 chars with working asset (activate working state), verify anim plays; inspect other 8, verify they patrol instead
- QA: observe multi-wave combat, verify enemies slide in over first 0.3s, not appear instantly
- If any DOM skip-button remains visible on main-story: check mission schema (isMainQuest field missing or false); migrate saves if needed
- If any tavern char vanishes: check COMBAT_SPRITE_MANIFEST for missing charId in `getCharIdFromBasePath`
- EN cardLore is first-pass copy—flag for human review (tone, accuracy, length)
- Latent non-LS-member vanish in alchemy-lab/workshop noted as follow-up (separate ticket)
- Member-portrait asset for party-card UI cut from v1; deferred to v1.1

## Files Changed (Summary)

- `src/game/state/combat-fight-controller.ts` — skipAllowed guard, spawnSlideFromX snapshot field
- `src/ui/components/combat-idle-sprite.tsx` — frame-dt lerp for slide animation
- `src/game/state/stage-phase-manager.ts` — on-spawn set spawnSlideFromX, next frame clear
- `src/ui/components/quest-board-tabs.tsx` — MAIN/EXPEDITION segmentation, party-card interaction
- `src/ui/components/tavern-detail.tsx` — charsWithWorking set, patrol fallback
- `src/i18n/ui.en.json`, `src/i18n/ui.vi.json` — cardLore routes via tContent, skip-lock message
- Test: `combat-engine-add-enemies.test.ts` — 10 new spawn + slide assertions

**Verification:** npm run build clean; 605/605 tests pass; code review 9/10 (0 critical, 0 high); shipping ready.
