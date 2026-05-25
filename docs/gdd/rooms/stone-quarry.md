# Room: Stone Quarry

**Def:** `src/game/data/facility-definitions.ts` — `FACILITY_DEFINITIONS['stone-quarry']`, `STONE_QUARRY_CONFIG`
**System:** `src/game/systems/stone-quarry-production-system.ts` — `processStoneQuarryTick()`

## Purpose

Infinite-yield stone production facility. Miners accumulate MC (Mining Craft) skill XP as they work, unlocking yield bonuses and higher vein-strike chances. Vein strikes roll rare bonus items (Iron Ore, Rich Stone Pocket, Gem). Unlike the Logging Site there is no reserve to deplete — the quarry produces indefinitely.

## Build Requirements

- Cost: **500g** + 20 WOOD
- Requires guild level ≥ 2 (narrative gate: quest `ft-ancient-threshold` — cave entrance reached)
- Upgrades: +300g → Lv2, +500g → Lv3
- `maxSlots: [1, 2, 3]` — primary stats: STR + LCK
- World-space anchor: `[7, 0, 1]`, footprint 3×3

## Production Formula (per-tick)

```
baseScore     = STR × 0.5
mcLevel       = calcMcLevel(craftSkills.mining.xpAccumulated)
yieldMult     = 1 + mcSkillYieldPct[mcLevel] / 100
stoneThisTick = baseRate × (baseScore / 100) × levelMult[facilityLevel-1] × yieldMult
```

`baseRate = 0.1389`, `levelMult = [1.0, 2.0, 3.5]`, `ticksPerDay = 1800`.

**Calibration:** STR 20 → baseScore 10 → ~20 stone/game-day at lv1, MC0.

## Level Multipliers

| Facility Level | Production Mult | Member Slots |
|----------------|-----------------|--------------|
| 1 | 1.0× | 1 |
| 2 | 2.0× | 2 |
| 3 | 3.5× | 3 |

## MC Skill (per-miner)

XP = stone produced each tick (base only, not vein bonus). Levels 0–10.

| MC Level | Cumulative Stone | Yield Bonus | Daily Strike Bonus |
|----------|-----------------|-------------|-------------------|
| 0 | 0 | +0% | +0 |
| 1 | 100 | +8% | +0.003 |
| 3 | 563 | +32% | +0.010 |
| 5 | 1 875 | +72% | +0.020 |
| 7 | 5 000 | +128% | +0.030 |
| 10 | 16 250 | +245% | +0.050 |

Thresholds: `STONE_QUARRY_CONFIG.mcSkillThresholds`.

## Vein Strike

Each tick a per-tick chance is derived from a daily probability:

```
fortune            = LCK × 3 + CHA × 0.5
dailyStrikeChance  = 0.01 + mcSkillStrikePct[mcLevel]
                   + fortune × 0.0002
                   + levelStrikeBonus[facilityLevel-1]
levelStrikeBonus   = [0, 0.015, 0.035]
perTickChance      = dailyStrikeChance / ticksPerDay
```

| Roll | Vein Type | Loot |
|------|-----------|------|
| < 0.65 | Iron Vein | 2–4 IRON_ORE |
| 0.65–0.90 | Rich Stone Pocket | +10–20 STONE bonus |
| > 0.90 | Gem Vein | +1 GEM |

## Items Produced

| Item | Rarity | Base Price | Source |
|------|--------|------------|--------|
| STONE | COMMON | 3g | Normal tick |
| IRON_ORE | UNCOMMON | 8g | Vein strike (65%) |
| GEM | RARE | 50g | Vein strike (10%) |

Defined in `src/game/data/items.ts`.

## Save Migration

- v11→v12: adds `stone-quarry` facility entry (level 0) to old saves
- v15→v16: adds `craftSkills.mining = { level: 0, xpAccumulated: 0 }` to all members

## References

- Production logic: `src/game/systems/stone-quarry-production-system.ts`
- State action: `src/game/state/guild-slice.ts` — `applyStoneQuarryProduction`
- Tick driver: `src/ui/hooks/use-game-tick-loop.ts` — `processStoneQuarryTick`
- Scene: `src/scene/facility-room-quarry-decor.tsx` — `QuarryRoomDecor`, `QuarryZoneCard`
- Config: `src/game/data/facility-definitions.ts` — `STONE_QUARRY_CONFIG`
