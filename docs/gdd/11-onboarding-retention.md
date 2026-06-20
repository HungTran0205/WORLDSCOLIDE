# 11 — Onboarding & Retention

**Code refs:** `src/game/systems/tutorial-manager.ts`, `src/game/systems/character-creation.ts`, `src/game/data/tutorial-data.ts`, `src/game/data/founder-archetypes.ts`

## New-Game Flow

A split-hero character-creation wizard (shipped `feature/WC-NewGameFlow`, 2026-05-21). Large live character preview on the left, per-step choice panel on the right. Preview swaps avatar and mask overlay live as the player makes choices.

```
Civilization → Class → Mask → Identity → Begin
```

| Step | Player chooses | Gate |
|------|---------------|------|
| Civilization | Faction | Linh Sơn selectable; Đế Quốc + Thiên Lữ locked ("Coming Soon") |
| Class | Founder preset | Templar / Forester / Ranger — swaps preview live |
| Mask | Identity mask | 10 curated tiles from `FOUNDER_MASK_CHOICES` (`mask-pool.ts`) |
| Identity | Name + stat points | 50 Talent Points across 7 stats; `canBegin` requires all 50 allocated |
| Begin | — | `createFounder()` called; guild hall entered |

Navigation: Back/Continue buttons + a clickable step rail (completed steps revisitable).

## Founder Presets (Linh Sơn MVP)

Defined in `src/game/data/founder-archetypes.ts` — `LINH_SON_FOUNDER_CHOICES`:

| Preset | Archetype | Gender | Sprite | Starting Weapon |
|--------|-----------|--------|--------|----------------|
| Templar | `sword` | M | `LS-SWORD-M` | WOODEN_SWORD |
| Forester | `warrior` | M | `LS-WARRIOR-M` | WOODEN_AXE |
| Ranger | `scout` | F | `LS-SCOUT-F` | WOODEN_CROSSBOW |

`sword` is a **founder-only** archetype — deliberately absent from `CIV_CONFIG.LinhSon.archetypes` so tavern rolls and recruits never produce a sword member. A regression test guards this invariant.

## Tutorial State Machine (14 beats)

Defined in `src/game/systems/tutorial-manager.ts` — `TUTORIAL_STEPS[]`. Each beat has a `step: TutorialStep`, an advance mechanism (`autoAdvance` predicate or UI callback), and optional coachmark config.

| # | Step | Advance trigger |
|---|------|----------------|
| 1 | `char-creation` | Player confirms founder |
| 2 | `arrival-alarm` | WorldBoard + NPC alarm modals dismissed |
| 3 | `open-quest-board` | `cameraFocus === 'quest-board'` (auto) |
| 4 | `accept-bear-quest` | Quest-board selection callback |
| 5 | `assign-and-dispatch` | `activeMissions` contains tutorial bear ID (auto) |
| 6 | `quest-travel` | Travel phase ends — party arrives (auto) |
| 7 | `moonbear-combat` | Victory callback in `tutorial-quest-handler.ts` |
| 8 | `kael-rescue` | `KaelRescueDialogue` dismiss callback |
| 9 | `reward-splash` | `TutorialRewardSplash` dismiss callback |
| 10 | `build-logging-site` | `facilities` contains `logging-site` lv > 0 (auto) |
| 11 | `assign-kael` | `tutorial-first-haul-handler.ts` grants +200 WOOD / +200g |
| 12 | `first-haul-reward` | `TutorialFirstHaulSplash` dismiss callback |
| 13 | `build-tavern` | `facilities` contains `tavern` lv > 0 (auto) |
| 14 | `assign-keeper` | Keeper assigned → scripted visitor spawns immediately |
| 15 | `recruit-first-member` | Guaranteed recruit visitor leaves roster (auto) |
| 16 | `complete` | Tutorial done |

`shouldAdvanceTutorial(step, state)` evaluates `advanceCondition` predicates; called each tick.
`getNextStep(current)` walks the array linearly — order in `TUTORIAL_STEPS` is canonical.

## Scripted Tutorial Characters

- **Kael** (`tutorial-data.ts` — `KAEL_TEMPLATE`): LinhSon warrior (STR 8, END 15, LCK 10). Recruited at `kael-rescue` beat. First production worker assigned to Logging Site.
- **Mai** (scripted tavern visitor): LinhSon scout (female, `LS-SCOUT-F`). Spawned immediately on keeper assignment — no next-day wait. `guaranteedRecruit: true` forces 100% negotiation success. Stable ID keeps the spawn idempotent across re-assigns.

## Guarantee & Safety Mechanisms

- **HP floor:** Tutorial bear fight uses `resolveMission(hpFloor=true)` — party cannot full-wipe, preserving the scripted Kael rescue scene.
- **Offline exclusion:** `TUTORIAL_BEAR_MISSION_ID` is skipped in offline auto-resolve (`offline-progression.ts`) so the playable fight is never resolved silently.
- **Anti-scum seed:** Tavern visitor rolls are seeded by `(SaveID + InGameDay)` — reload within same day gives same visitor pool.

## First-Hour Retention Design

The tutorial chain is designed to deliver one meaningful payoff per beat:
1. **Identity:** Founder creation gives agency before any mechanics are explained.
2. **First win:** Moonbear fight (beat 7) is a guaranteed playable victory — not a tutorial skip.
3. **First resource:** Scripted first haul (+200 WOOD, +200g) immediately enables the next build.
4. **First recruit:** Mai's guaranteed negotiation closes the social loop — the guild feels alive.

These beats are not skippable individually; the state machine enforces sequence to maintain pacing and avoid new players getting stuck at any single gate.

## Follow-Ups

- Unlock Đế Quốc + Thiên Lữ founder presets (currently locked with "Coming Soon" glyph)
- AC yield bonuses (lv3/5/8/10) deferred — see `gdd/10` implementation status
