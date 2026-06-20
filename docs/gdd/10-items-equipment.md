# 10 — Items, Equipment, Crafting & Alchemy

> **📋 For edits and comprehensive lookup:** See [`15-items-inventory-system.md`](./15-items-inventory-system.md) — the master items database with all materials, consumables, equipment, recipes, and gaps organized as quick-reference tables. Use that file to:
> - View all items & their sources
> - Check craft chains (workshop, alchemy)
> - Track implemented vs. planned features
> - Find unresolved recipe ideas

**Code refs:** `src/game/data/equipment-templates.ts`, `src/game/data/items.ts`, `src/game/data/alchemy-recipes.ts`, `src/game/systems/equipment-bonuses.ts`, `src/game/systems/loot-roller.ts`, `src/game/systems/alchemy-production-system.ts`

## Equipment Slots

Each member has two equipment slots: `weapon` and `armor`. Defined in `equipment-templates.ts` — `EquipmentSlot`.

An equipped item with `durability === 0` gives **no stat bonus** — broken gear is cosmetic only until repaired.

## Equipment Tiers

Three material tiers with weapon subtypes (axe / crossbow / sword) and armor options:

| Tier | Rarity | Weapon DMG | Armor Type | HP / DEF | Durability | Craft Material |
|------|--------|-----------|------------|----------|------------|----------------|
| **T1** | COMMON | 10 | Wooden / Boar Fur Coat | 20 / 3 | 40–50 | WOOD (20) or BOAR_PELT (1) + WOOD (10) |
| **T2** | UNCOMMON | 18 | Stone / Bear Coat | 40 / 7 | 70–80 | STONE (15) or BEAR_PELT (1) + STONE (10) |
| **T3** | RARE | 28–30 | Iron | 70 / 15 | 100–120 | IRON_ORE (8–10) |

**Pelt Armor:** Alternative T1/T2 armor tracks using monster materials (BOAR_PELT, BEAR_PELT). Stats match tier; durability matches wood/stone counterparts. Craft materials require both pelt + base material.

Full template registry: `EQUIPMENT_DATABASE` in `equipment-templates.ts`.

## Gear Bonus Pipeline (`equipment-bonuses.ts`)

`calcGearBonuses(equipment)` returns `GearBonuses { flatDamage, flatHp, flatDefense }`:

1. Weapon (durability > 0): adds `template.damage` → `flatDamage`
2. Armor (durability > 0): adds `template.hp` → `flatHp`, `template.defense` → `flatDefense`
3. Slot affixes on weapon/armor: `applySlotBonuses()` adds affix `HP` values → `flatHp`

These flat bonuses feed into the derived combat stat pipeline (see `gdd/05`).

## Affix Slot System

Each `EquipmentItem` has `slots: EquipmentSlotData[]` (max 4). Slots are added via Workshop Enhance tasks. **Six active affix categories:**

| Material | Category | Stat | Range | Equip Type | Tier |
|----------|----------|------|-------|------------|------|
| SLIME_GEL | TANKY | HP | +50–200 | Armor | T1 |
| BAT_WING | DODGE | DODGE | +0.03–0.08 | Armor | T1 |
| SPIDER_LEGS | ATTACK_SPEED | ATTACK_SPEED | +0.05–0.12 | Weapon | T1 |
| METAL_PLATE | BLOCK | BLOCK | +0.03–0.08 | Armor | T2 |
| DRONE_SENSOR | ACCURACY | ACCURACY | +0.05–0.15 | Weapon | T2 |
| SLIME_KING_CORE | SHIELD | SHIELD | 1–2 charges | Armor | T3 |

**Equip-type enforcement:** DODGE/BLOCK only roll on armor; ACCURACY/ATTACK_SPEED only on weapons. Mismatched material + equipment type → error (EQUIP_TYPE_MISMATCH).

## Workshop Crafting

See [`rooms/workshop.md`](rooms/workshop.md) for full crafting flow (paths A/B/B+, enhance, repair, dismantle). Craft materials by tier:

- T1: WOOD — from Logging Site
- T2: STONE — from Stone Quarry
- T3: IRON_ORE — from Stone Quarry vein strikes

## Alchemy — Healing Syringe Recipes

**Def:** `src/game/data/facility-definitions.ts` — `FACILITY_DEFINITIONS['alchemy-lab']`
**System:** `src/game/systems/alchemy-production-system.ts`
**Recipes:** `src/game/data/alchemy-recipes.ts` — `ALCHEMY_RECIPES`

Three healing syringe tiers, all implemented:

| Recipe ID | Input | Output | Heal % | AC Level | Auto-trigger |
|-----------|-------|--------|--------|----------|--------------|
| `healing-syringe` | 1× SLIME_GEL | HEALING_SYRINGE | 30% | 0 | ≤ 30% HP |
| `healing-syringe-2` | 2× SLIME_GEL | HEALING_SYRINGE_2 | 50% | 3 | ≤ 50% HP |
| `healing-syringe-3` | 3× SLIME_GEL | HEALING_SYRINGE_3 | 80% | 5 | ≤ 80% HP |

**Recipe matching is quantity-aware:** 2× SLIME_GEL slots correctly resolve to HS2, not HS1×2. **Combat auto-trigger is implemented** — syringes auto-use in battle when HP ≤ threshold (configurable per member via `SyringeLoadout.autoUseThresholdPct`).

### Auto-Production Formula

```
batchesPerDay = max(1, floor(INT × 0.08 + DEX × 0.04 + facilityLevel + 1))
gelsPerBatch  = acLevel + 1          // AC = Alchemy Craft skill level
syringes      = batchesDone × gelsPerBatch   (capped by available SLIME_GEL)
```

**AC XP Progression:** Total syringes crafted earns XP. 10 levels; thresholds: 10 → 25 → 50 → 100 → 175 → 275 → 400 → 550 → 750 → 2,500.

**Key insight:** Leveling AC Lv3+ (for HS2) or Lv5+ (for HS3) gates tier-2/3 syringes. Higher AC yields more gels per batch → more syringes/batch, but costs more SLIME_GEL (trade-off). Planned AC bonuses (double batch at lv5, Grand Elixir at lv10) are **design-only, not yet implemented**.

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
