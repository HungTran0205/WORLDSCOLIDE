# Stone Quarry Mining Skill Implementation Journal

**Date:** 2026-04-15  
**Feature:** Stone Quarry → Per-Tick Mining Production System  
**Status:** COMPLETE | Build: 0 errors | Tests: 17/17 passed

## What Built

Upgraded Stone Quarry from daily STONE producer to full occupational skill system:

- **Mining Craft Skill (MC)**: 11 levels (0–10), XP = cumulative stone mined, thresholds 25% harder than WC
- **Vein Strike Events**: Per-tick probability system with 3 vein types (Iron 65%, Rich Stone 25%, Gem 10%)
- **GEM Item**: New RARE material, basePrice 50g
- **Infinite Reserve**: Intentional vs Logging Site (finite) — Stone Quarry = backbone reliability
- **Save v15→v16**: Auto-migrates member craftSkills with `mining: { level: 0, xpAccumulated: 0 }`

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Per-tick vs per-day** | Per-tick chosen (like Logging Site) — MC skill needs granular XP accumulation |
| **baseScore/100 norm** | Same pattern as Logging. Added clarifying comment to prevent regressions |
| **CraftSkills preservation** | Both systems explicitly preserve OTHER skill on update — prevents XP loss when switching |
| **gameDays multiplier fix** | Accumulate daily first, then multiply by gameDays (pre-existing multi-member bug NOT fixed — scope) |
| **LCK + fortune mechanic** | Reuses existing derived stat `fortune = LCK×3 + CHA×0.5` — no new stats needed |

## Files Modified (10)

```
src/game/data/items.ts                          (+GEM)
src/game/data/facility-definitions.ts           (+STONE_QUARRY_CONFIG)
src/game/state/game-state.ts                    (+MiningSkill interface)
src/game/systems/stone-quarry-production-system.ts  (NEW)
src/game/systems/facility-production-system.ts  (offline MC skill)
src/game/state/guild-slice.ts                   (+applyStoneQuarryProduction)
src/ui/hooks/use-game-tick-loop.ts              (wire quarry per-tick)
src/game/save/save-types.ts                     (v15→16)
src/game/save/save-migrations.ts                (+migrateV15toV16)
src/game/save/save-migrations.test.ts           (version expectations)
```

Also fixed 5 pre-existing TS errors (unused imports, missing return, missing graphicsQuality in fixtures).

## Lessons Learned

1. **Per-tick probability for rare events**: `dailyChance / 86400` gives correct expected frequency without complex state tracking
2. **CraftSkills as flat object**: Requires explicit preservation of other skills when updating one — pattern works but is error-prone; needs clear documentation
3. **Pre-existing gameDays bug**: Silent wrong-value bug in offline multi-member production, not a crash — only discovered via code review

## Build Output

```
npm run build      ✓ 0 errors
npm run test       ✓ save-migrations.test.ts: 17/17 passed
```
