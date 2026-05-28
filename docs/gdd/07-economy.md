# 07 — Economy

**Game:** 2000s A.C — After the Collapse  
**Status:** Living spec | Code-bound  
**Primary code:** `src/game/systems/upkeep-system.ts`, `recruit-system.ts`, `loot-roller.ts`, `offline-progression.ts`, `guild-upgrade-system.ts`, `src/game/data/buildings.ts`, `ranks.ts`

---

## 1. Gold — Primary Currency

Single currency: **gold**. State stored in `GuildSlice.gold` (`guild-slice.ts`).  
Display: `formatGold()` formats with K/M/B suffixes at ≥10K/1M/1B (`economy-helpers.ts:1`).

**Gold sources:** mission rewards, quest completion, offline mission auto-resolve.  
**Gold sinks:** upkeep, guild upgrades, rank promotion, floor tiles, furniture, recruitment.

---

## 2. Member Upkeep

`calcMemberUpkeep()` — `upkeep-system.ts:9`:

```
upkeep = round(BASE_UPKEEP × UPKEEP_SCALE^(level−1) × rankModifier)
BASE_UPKEEP  = 5
UPKEEP_SCALE = 1.15
```

**Verified:** `BASE_UPKEEP = 5`, `UPKEEP_SCALE = 1.15` — `upkeep-system.ts:4-5`.

Rank modifiers (from `ranks.ts`):

| Rank | Modifier | Daily cost at Lv 1 | Daily cost at Lv 10 |
|------|---------|-------------------|---------------------|
| RECRUIT | 0.80× | 4g | ~14g |
| MEMBER | 1.00× | 5g | ~17g |
| VETERAN | 1.00× | 5g | ~17g |
| OFFICER | 1.15× | ~6g | ~20g |
| COMMANDER | 1.30× | ~7g | ~23g |
| MERCENARY | 0 (per-mission) | — | — |

Mercenaries are excluded from upkeep (`rank !== 'MERCENARY'` filter — `upkeep-system.ts:16`).

---

## 3. Debt & Grace Period

`chargeUpkeep()` — `upkeep-system.ts:23`:

- If gold ≥ total cost → deduct, no debt
- If gold < total cost → `daysInDebt` accrues for unaffordable days

**Grace period: 3 days** (`DEBT_GRACE_DAYS = 3` — `upkeep-system.ts:6`).  
After grace, `processDebtPenalty()` evicts **one** member per enforcement call:
- Excludes founders and mercenaries from eviction
- Evicts lowest-rank first, then lowest-level within same rank (`upkeep-system.ts:61`)

---

## 4. Guild Upgrades

`GUILD_UPGRADES` — `buildings.ts:11`:

| Guild Level | Cost | Key unlock |
|------------|------|-----------|
| 1 | 0g | Quest board (F-rank quests) |
| 2 | 500g | Bar counter, reception desk, E-rank quests |
| 3 | 2,000g | Training dummy, alchemy table, medical bed, D-rank quests |
| 4 | 8,000g | Workbench, C-rank quests |
| 5 | 30,000g | B-rank quests |

Floor tile cost: **5g each** (`FLOOR_TILE_COST = 5` — `buildings.ts:41`).

---

## 5. Rank Promotion Costs

Promotion spends gold and requires level + mission thresholds (`ranks.ts:25`):

| To rank | Min level | Min missions | Gold cost |
|---------|----------|--------------|----------|
| MEMBER | 3 | 5 | 200g |
| VETERAN | 8 | 20 | 800g |
| OFFICER | 15 | 50 | 2,500g |
| COMMANDER | 25 | 100 | 8,000g |

---

## 6. Recruitment

`recruit-system.ts`:

```
visitorRate = 2 + floor(receptionQuality × 0.5)   // visitors/game-day
successRate = clamp(0.1, 0.99,
  0.95 − (recruitLevel−1)×0.02 + CHA×0.005 + hallQuality×0.02)
```

Higher founder CHA and hall quality increase hire success rate.  
Mercenary hire cost: separate system (`tavern-negotiation.ts` / `hireMercCost()`).

---

## 7. Loot & Item Drops

`rollLoot()` — `loot-roller.ts:7`:

- Iterates each `LootRule` in enemy's loot table
- Per rule: `if (random() <= rule.chance)` → roll `random(max−min+1) + min` quantity
- Independent rolls per rule; multiple copies of same item are summed via `mergeLoot()`

Drop tables defined per enemy in `src/game/data/enemies.ts` (`LootRule` type).  
No global loot multiplier in current code. <!-- TODO: seed spec describes loot multiplier scaling by difficulty tier (1×→2.5×) — not found in loot-roller.ts or mission-resolver.ts; verify if implemented elsewhere -->

---

## 8. Offline Catch-Up

`processOfflineTime()` — `offline-progression.ts:27`:

- **1 game day = 30 min real time** (`GAME_DAY_REAL_MS = 30 × 60 × 1000` — `offline-progression.ts:23`)
- **Cap: 30 game days** max offline (`MAX_OFFLINE_GAME_DAYS = 30` — `offline-progression.ts:24`)
- Skipped if offline < 1 minute
- Charges rank-based upkeep for all elapsed days
- Auto-resolves missions whose travel window fully expired while offline
- Tutorial Moonbear guaranteed win even in offline auto-resolve
- Gold delta returned: `goldFromMissions − upkeepCharged`

---

## 9. Resources (Materials)

Primary resources: Wood, Stone, Iron Ore, Crystal, Rare Ore, Magic Items (8 types).  
Produced by facility rooms; consumed by Workshop crafting, Alchemy, and repairs.  
Production formula (pool-based, k=1.5) — see [05 Characters §6](05-characters-progression.md#6-production-room-stats-pool-based).

**Design targets (from spec, unverified against current facility code):**

| Resource | Base/cycle | Max (8×stat50) | 5-mission demand |
|----------|-----------|----------------|-----------------|
| Stone | 100 | 250/cycle | ~36 ore |
| Wood | 150 | 375/cycle | ~24 wood |
| Magic items | 50 | 125/cycle | ~9 items |

<!-- TODO: verify base production values against facility-production-system.ts and stone-quarry-production-system.ts — pool spec (k=1.5) may differ from current implementation -->

---

## 10. Specialization (Design Intent)

Players can focus production on one output line (Armory / Potion / Generalist profiles).  
Specialists unlock bonus room slots; generalists keep all rooms but progress more slowly.  
<!-- TODO: specialization profiles are design-only — not found in current facility or guild-slice code; implement when resource-scarcity difficulty is tuned -->

---

*Cross-references: [05 Characters](05-characters-progression.md) | [08 Guild Hall](08-guild-hall-rooms.md) | [09 Missions](09-missions-quests.md)*
