# Room: Logging Site (Wood Mining)

**Def:** `src/game/data/facility-definitions.ts` — `FACILITY_DEFINITIONS['logging-site']`, `LOGGING_SITE_CONFIG`
**System:** `src/game/systems/facility-production-system.ts` — `processLoggingSiteTick()`

## Purpose

Passive wood harvesting facility. Assigned members deplete a finite **wood reserve** (1 000 units per site) over time. When the reserve runs out, the site goes dormant until the player acquires and uses another Logging Permit. Primary stat is STR; WC (Woodcutting) skill amplifies yield and is gained by producing wood.

## Build Requirements

- Cost: **0 gold** — permit-only (LOGGING_SITE_ACCESS item consumed on build)
- Tutorial unlock: completing `forest-guardian` boss gate drops a permit (20% chance); `bandit-ambush` etc. also carry 15% drop
- No upgrade path — stays at level 1 permanently
- `maxSlots: [1, 2, 3]` — primary stats: STR + WC Skill

## Production Formula (per-tick)

```
baseScore  = STR × 0.5 + END × 0.3 + DEX × 0.2
skillMult  = 1 + wcSkillBonusPct[wcLevel] / 100
woodPerTick = LOGGING_SITE_CONFIG.baseRate (0.2277) × (baseScore / 100) × skillMult
```

Ticks per game-day = 1800 (1 game-day = 30 real minutes). Reserve floor is 0; production halts when reserve depleted.

**Calibration:** Kael (STR 8, END 15, DEX 5) → baseScore ≈ 8.5 → ~25 wood/game-day at WC level 0.

## WC Skill

XP proxy: total wood harvested. Levels 0–10.

| WC Level | Cumulative Wood | Yield Bonus |
|----------|----------------|-------------|
| 0 | 0 | +0% |
| 1 | 50 | +10% |
| 3 | 350 | +38% |
| 5 | 1 200 | +80% |
| 7 | 3 200 | +133% |
| 10 | 11 000 | +240% |

Thresholds: `LOGGING_SITE_CONFIG.wcSkillThresholds`. Bonus: `wcSkillBonusPct`.

## Reserve & Depletion

- Starting reserve: 1 000 WOOD per site
- Warning badge (yellow): reserve < 25% remaining
- Critical badge (red): reserve < 10% remaining
- Site goes dormant at reserve = 0; a new permit resets it

## Auto-Collect

Produced WOOD is added directly to guild inventory each tick. No room capacity cap — site halts only when the reserve is exhausted.

## Items Produced

| Item | Rarity | Source |
|------|--------|--------|
| WOOD | COMMON | Normal production |

Rare magic resource drops (Herb, Magic Fragment, Enchanted Essence) described in the design seed are **not yet implemented** in code. <!-- TODO: verify rare drop table against code -->

## References

- Per-tick function: `src/game/systems/facility-production-system.ts` — `processLoggingSiteTick()`
- WC XP application: `src/game/state/guild-slice.ts` — `applyLoggingProduction`
- Tick driver: `src/ui/hooks/use-game-tick-loop.ts`
- Scene: `src/scene/logging-site/facility-room-forest-decor.tsx`
