# 05 — Characters & Progression

**Game:** 2000s A.C — After the Collapse  
**Status:** Living spec | Code-bound  
**Primary code:** `src/game/systems/leveling-system.ts`, `stat-allocation.ts`, `member-derived-stats.ts`, `derived-combat-stats.ts`, `derived-guild-stats.ts`, `src/game/data/ranks.ts`

---

## 1. Attribute Architecture

Seven base talents — the only numbers the player allocates:

| Tag | Name | Primary impact |
|-----|------|----------------|
| STR | Strength | Physical ATK, block rate, gather speed |
| END | Endurance | Max HP, defense, HP regen, block rate |
| INT | Intelligence | Skill haste, status resist, craft/alchemy |
| DEX | Dexterity | Skill DMG bonus, dodge rate, craft quality |
| CHA | Charisma | Influence, negotiation, morale aura |
| LCK | Luck | Crit rate, crit DMG, fortune/loot |
| AGI | Agility | Attack speed (interval), dodge rate |

Max base stat per talent = **50**. Threshold perks activate at 40, 45, 50 — defined in `stat-system.md` (seed, archived). <!-- TODO: verify threshold perks hooked into combat-engine — not yet found in code -->

### Stat Allocation

- Starting pool: **50 points** (`INITIAL_STAT_POINTS` — `stat-allocation.ts:4`)
- Level-up: **+2 auto to all stats**, **+5 allocatable points** (`LEVEL_UP_AUTO_STATS = 2`, `LEVEL_UP_BONUS_POINTS = 5` — `leveling-system.ts:35-36`)
- Point allocation: `allocatePoint()` in `stat-allocation.ts`

---

## 2. EXP & Leveling Curve

Piecewise then exponential from level 5+ (`leveling-system.ts`):

| Level | EXP to next |
|-------|-------------|
| 1 | 100 |
| 2 | 150 |
| 3 | 220 |
| 4 | 310 |
| 5 | 430 |
| n ≥ 5 | `floor(EXP[n-1] × 1.35)` |

**Verified:** multiplier is exactly `1.35` at `leveling-system.ts:8`.  
Multi-level jumps handled in `gainExp()` (while loop, `leveling-system.ts:22-30`).

---

## 3. Combat Derived Stats

All formulas from `combat-formulas.ts` and `derived-combat-stats.ts`. Gear bonuses (flat HP, defense, damage) added on top via `calcGearBonuses()`.

| Derived stat | Formula | Source line |
|---|---|---|
| Max HP | `50 + END×5 + level×10` + gear flatHp | `combat-formulas.ts:3` |
| Attack interval | `max(300ms, weaponBase / (1 + AGI/100))` | `combat-formulas.ts:8` |
| Crit rate | `min(50%, 5% + LCK×0.3%)` | `combat-formulas.ts:37` |
| Crit DMG | `1.5 + LCK×0.005` (150% base) | `derived-combat-stats.ts:56` |
| Defense rating | `min(75%, END / (END+100))` | `combat-formulas.ts:47` |
| Skill DMG bonus | `DEX × 0.5%` (additive fraction) | `combat-formulas.ts:52` |
| Dodge rate | `min(30%, AGI×0.2% + DEX×0.1%)` | `derived-combat-stats.ts:60` |
| Block rate | `min(25%, END×0.2% + STR×0.1%)` | `derived-combat-stats.ts:63` |
| HP regen | `END×0.1 + level×0.05` HP/s | `derived-combat-stats.ts:67` |
| Skill haste | `min(30%, INT×0.3%)` | `derived-combat-stats.ts:71` |
| Status resist | `min(40%, INT×0.2% + END×0.1%)` | `derived-combat-stats.ts:75` |
| Morale aura | `CHA×0.1%` (individual contribution) | `derived-combat-stats.ts:79` |

Team morale = average CHA across all party members × 0.001 (`member-derived-stats.ts:43`).  
Unified facade: `calcMemberDerivedStats()` — `member-derived-stats.ts`.

Auto-attack damage: `max(1, (STR×weaponMult + gearFlatDmg) × (1 − defRatio) × 1.2)`  
Global damage scalar `BASE_DAMAGE_MULTIPLIER = 1.2` (phase-6 balance pass, `combat-formulas.ts:16`).

---

## 4. Guild (Non-Combat) Derived Stats

From `derived-guild-stats.ts:36`:

| Stat | Formula | Use |
|---|---|---|
| Influence | `CHA×2 + INT×1 + level×0.5` | Recruit quality, quest tier unlock |
| Stamina | `END×3 + STR×1` | Mission duration capacity |
| Craft Skill | `DEX×2 + INT×1` | Workshop rare item chance |
| Training Eff | `(DEX+AGI)×0.2%` | EXP gain bonus |
| Gather Speed | `STR×0.4%` | Production speed bonus |
| Negotiation | `CHA×2 + LCK×1` | Tavern/shop price reduction |
| Recovery | `max(0.2, 1 − (END+INT)×0.1%)` | Injury recovery rate |
| Exploration | `AGI×2 + LCK×1` | Travel time, hidden quests |
| Leadership | `CHA×2 + INT×1 + STR×0.5` | Party size bonus |
| Fortune | `LCK×3 + CHA×0.5` | Loot rarity, event bonus |

<!-- TODO: verify guild stats are hooked into mission/facility mechanics — currently display-only per design note -->

---

## 5. Ranks

Five guild ranks with upkeep modifiers and EXP bonuses (`ranks.ts:25`):

| Rank | Order | Upkeep mod | EXP bonus | Promote: Lv / Missions / Gold |
|------|-------|-----------|-----------|-------------------------------|
| RECRUIT | 0 | 0.80× | 0% | Lv 3 / 5 missions / 200g |
| MEMBER | 1 | 1.00× | +5% | Lv 8 / 20 missions / 800g |
| VETERAN | 2 | 1.00× | +10% | Lv 15 / 50 missions / 2500g |
| OFFICER | 3 | 1.15× | +15% | Lv 25 / 100 missions / 8000g |
| COMMANDER | 4 | 1.30× | +20% | — (max rank) |

MERCENARY rank: no upkeep (pay-per-mission), not promotable.

---

## 6. Production Room Stats (Pool-Based)

Members assigned to production rooms contribute to a shared stat pool.  
Formula (design spec, `member-stat-production-implementation.md`):

```
Total Production = Base × (1 + 1.5 × PoolStats / 400)
Per-member share = Total / MemberCount
```

Where: `Base` = 100 (stone) / 50 (magic) / 150 (wood); pool max = 400 (8 members × stat 50).  
Scaling coefficient `k = 1.5`; ceiling multiplier = 2.5× at full pool.

<!-- TODO: verify pool formula against actual facility-production-system.ts — pool spec may predate final implementation -->

---

## 7. Combat Jobs vs Life Jobs

**Combat jobs** (leveled via missions / Training Yard): Tank, DPS Melee, DPS Range, Spell Caster, Healer, Scout, Debuffer.  
**Life jobs** (leveled via room assignment): Alchemist (INT/DEX/LCK), Miner (STR/END/LCK), Armorsmith/Weaponsmith (STR/DEX/LCK), Medic (INT/LCK).

Hybrid characters can hold both roles but progress in each more slowly than specialists.  
Life stat tiers: 0–9 Basic → 10–19 Skilled → 20–29 Expert → 30+ Master.

<!-- TODO: life stat tier thresholds and bonus unlocks not found in implementation code — design-only currently -->

---

*Cross-references: [02 Core Loop](02-core-loop-pillars.md) | [06 Combat](06-combat.md) | [07 Economy](07-economy.md)*
