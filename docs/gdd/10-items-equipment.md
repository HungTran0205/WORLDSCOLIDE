# 10 — Items, Equipment, Crafting & Alchemy

**Code refs:** `src/game/data/equipment-templates.ts`, `src/game/data/items.ts`, `src/game/data/alchemy-recipes.ts`, `src/game/systems/equipment-bonuses.ts`, `src/game/systems/loot-roller.ts`, `src/game/systems/alchemy-production-system.ts`

## Equipment Slots

Each member has two equipment slots: `weapon` and `armor`. Defined in `equipment-templates.ts` — `EquipmentSlot`.

An equipped item with `durability === 0` gives **no stat bonus** — broken gear is cosmetic only until repaired.

## Equipment Tiers

Three material tiers, each with weapon subtypes (axe / crossbow / sword) and one armor piece:

| Tier | Rarity | Weapon DMG | Armor HP / DEF | Durability | Craft material |
|------|--------|-----------|----------------|------------|----------------|
| T1 Wood/Cloth | COMMON | 10 | 20 HP / 3 DEF | 40–50 | WOOD (20 units) |
| T2 Stone/Leather | UNCOMMON | 18 | 40 HP / 7 DEF | 70–80 | STONE (15 units) |
| T3 Iron | RARE | 28–30 | 70 HP / 15 DEF | 100–120 | IRON_ORE (8–10 units) |

Full template registry: `EQUIPMENT_DATABASE` in `equipment-templates.ts`.

## Gear Bonus Pipeline (`equipment-bonuses.ts`)

`calcGearBonuses(equipment)` returns `GearBonuses { flatDamage, flatHp, flatDefense }`:

1. Weapon (durability > 0): adds `template.damage` → `flatDamage`
2. Armor (durability > 0): adds `template.hp` → `flatHp`, `template.defense` → `flatDefense`
3. Slot affixes on weapon/armor: `applySlotBonuses()` adds affix `HP` values → `flatHp`

These flat bonuses feed into the derived combat stat pipeline (see `gdd/05`).

## Affix Slot System

Each `EquipmentItem` has `slots: EquipmentSlotData[]` (max 4). Slots are added via Workshop Enhance tasks. Current active affix:

| Material | Category | Stat | Range |
|----------|----------|------|-------|
| SLIME_GEL | TANKY | HP | +50–200 |

Other categories (DODGE, ACCURACY, BLOCK, ATTACK_SPEED, SHIELD) are stubbed — defined in `workshop-material-affinity.ts` but disabled in the enhance path.

## Workshop Crafting

See [`rooms/workshop.md`](rooms/workshop.md) for full crafting flow (paths A/B/B+, enhance, repair, dismantle). Craft materials by tier:

- T1: WOOD — from Logging Site
- T2: STONE — from Stone Quarry
- T3: IRON_ORE — from Stone Quarry vein strikes

## Alchemy — Healing Syringe

**Def:** `src/game/data/facility-definitions.ts` — `FACILITY_DEFINITIONS['alchemy-lab']`
**System:** `src/game/systems/alchemy-production-system.ts`
**Recipes:** `src/game/data/alchemy-recipes.ts` — `ALCHEMY_RECIPES`

MVP recipe (the only implemented recipe):

| Recipe ID | Input | Output | AC Level req |
|-----------|-------|--------|-------------|
| `healing-syringe` | 1× SLIME_GEL | 1× HEALING_SYRINGE | 0 |

HEALING_SYRINGE restores 30% of max HP. Auto-use threshold configurable via `SyringeLoadout.autoUseThresholdPct` (default 30%) — **combat auto-trigger not yet implemented**.

### Auto-Production Formula

```
batchesPerDay = max(1, floor(INT × 0.08 + DEX × 0.04 + facilityLevel + 1))
gelsPerBatch  = acLevel + 1          // AC = Alchemy Craft skill level
syringes      = batchesDone × gelsPerBatch   (capped by available SLIME_GEL)
```

AC XP proxy: total syringes crafted. 10 levels (thresholds: 10 → 25 → 50 → … → 2 500).

Higher AC yields more gels consumed per batch → more syringes per batch, but costs more SLIME_GEL. Planned AC bonuses (double batch at lv5, Grand Elixir at lv10) are **design-only, not yet implemented**.

## Loot Rolling (`loot-roller.ts`)

`rollLoot(lootTable)` — per enemy, iterates `LootRule[]`, rolls `Math.random() <= rule.chance`, amounts in `[rule.min, rule.max]`. `mergeLoot(...rolls)` aggregates all enemy drops for a mission. Called from `mission-resolver.ts` after each combat.

## Starting Weapons

Founders and tavern recruits receive a starting weapon matched to their archetype:

| Archetype | Starting Weapon |
|-----------|----------------|
| warrior | WOODEN_AXE |
| scout | WOODEN_CROSSBOW |
| sword (founder-only) | WOODEN_SWORD |

Logic: `src/game/systems/equipment-bonuses.ts` — `getStartingWeapon()`.

## Inventory

Guild inventory is a flat `Record<ItemID, number>` (quantity map). No slot limit at MVP. See [`rooms/inventory.md`](rooms/inventory.md) for UI interaction model.
