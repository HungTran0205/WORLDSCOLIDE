# Room: Alchemy Lab

**Def:** `src/game/data/facility-definitions.ts` — `FACILITY_DEFINITIONS['alchemy-lab']`
**System:** `src/game/systems/alchemy-production-system.ts`
**Data:** `src/game/data/alchemy-recipes.ts`
**State:** `src/game/state/guild-slice.ts` (apply production, craft queue)

## Purpose

Alchemists brew Healing Syringes from Slime Gel. Supports both **auto-production** (daily, passive) and an **active craft queue** (player-initiated). Members accumulate Alchemy Craft (AC) skill over time.

## Build Requirements

- Cost: 350g + 20 STONE + 50 WOOD
- Upgrades: +500g → Lv2, +800g → Lv3
- `maxSlots: [1, 2, 3]` — primary stats: INT + DEX
- Unlock gate: quest `ft-ruins-forgotten-age` (ether + materials available)
- Zone position: [5, 0, 5], tile footprint: 3×3

## Auto-Production Formula

Runs once per game-day (30 real min):

```
batchesPerDay = max(1, floor(INT × 0.08 + DEX × 0.04 + facilityLevel + 1))
gelsPerBatch  = acLevel + 1
syringesDay   = batchesDone × gelsPerBatch
```

Member is blocked if insufficient SLIME_GEL. AC XP = syringes produced (cumulative).

| INT/DEX | AC Lv | Facility Lv | Batches/Day | Syringes/Day |
|---------|-------|-------------|-------------|-------------|
| 10/10 | 0 | 1 | 3 | 3 |
| 15/15 | 3 | 2 | 7 | 28 |
| 20/20 | 7 | 3 | 12 | 96 |
| 25/20 | 10 | 3 | 14 | 154 |

## Active Craft Queue

Player-initiated, runs alongside auto-production:

```
secondsPerUnit = max(15, round(120 / batchesPerDay))
totalSeconds   = qty × secondsPerUnit
```

Queue ticks every real second (`AlchemyCraftJob.remainingSeconds`). On completion: item added to inventory, job removed.

## Recipes

Defined in `src/game/data/alchemy-recipes.ts` (`ALCHEMY_RECIPES`):

| Recipe ID | Input | Output | AC Lv Required |
|-----------|-------|--------|----------------|
| `healing-syringe` | 1× SLIME_GEL | 1× HEALING_SYRINGE (heals 30% maxHP) | 0 |

Tier 2–3 recipes (buff/debuff syringes) are design-only; not yet implemented.

## Recipe Matching

`matchRecipe(slots, alchemyLevel)` in `alchemy-recipes.ts`: scans all recipes, filters by AC level, checks filled slot count + item IDs. First match wins.

## Alchemy Craft (AC) Skill

0–10 levels. Tracked per member as `craftSkills.alchemy.xpAccumulated` (total syringes crafted).

| AC Level | Syringes Accumulated | Design Effect |
|----------|---------------------|---------------|
| 0 | 0 | Baseline |
| 3 | 50 | Ingredient cost reduction (design only) |
| 5 | 200 | 15% double-batch chance (design only) |
| 10 | 2,500 | 10% Grand Elixir chance (design only) |

Lv3/5/8/10 bonuses are defined in design but **not yet implemented in code**.

## Craft Panel UI

Visible ingredient slots equal the **lab level** (what the player upgrades): `min(4, max(facility.level, maxAcLevel))` → Lv1 = 1 slot, Lv2 = 2, Lv3 = 3. The 4th slot is only reachable by a very skilled alchemist (AC ≥ 4) assigned to the lab. The alchemist's AC level still gates which **recipes** match (`matchRecipe(slots, maxAcLevel)`). Player drags ingredients into slots; `matchRecipe()` runs automatically. Output preview appears; Craft button activates when recipe matches and ingredients are available.

## Syringe Loadout (Auto-Use)

```typescript
interface SyringeLoadout { autoUseThresholdPct: number; } // default 0.30
```

When member HP < threshold → auto-consume 1 HEALING_SYRINGE → restore 30% maxHP.
**Combat auto-trigger not yet implemented** — data structure is ready.

## 3D Scene

Components: `facility-room-alchemy-walls.tsx`, `facility-room-alchemy-wall-decor.tsx` (copper pipe network, PBR metallic), `facility-room-alchemy-decor.tsx` (alchemy-table, workbench, reactor, shelf, silo GLBs).

## Implementation Status

| Feature | Status |
|---------|--------|
| AC Skill 0–10 | Implemented |
| Healing Syringe recipe | Implemented |
| Auto-production formula | Implemented |
| Active craft queue | Implemented |
| Craft Panel UI | Implemented |
| AC Lv yield bonuses (Lv3/5/8/10) | Design only |
| Buff/debuff syringe recipes | Design only |
| Combat auto-use trigger | Not implemented |
