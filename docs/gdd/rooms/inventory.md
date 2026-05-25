# Room: Inventory

**Def:** Default room — no `FacilityDef` entry (always present, no build cost)
**State:** `src/game/state/inventory-slice.ts`
**Data:** `src/game/data/items.ts`

## Purpose

Global item storage for the guild. Not a production room — exists as the central hub for all resources, gear, consumables, and crafting inputs. All facility outputs flow here; all crafting systems draw from here.

## Item Categories

| Category | Examples | Stack Behavior |
|----------|---------|----------------|
| Resources / Materials | WOOD, STONE, IRON_ORE, SLIME_GEL, GEM | Stackable (max 99) |
| Gear — Weapon | WOODEN_AXE, STONE_SWORD, IRON_CROSSBOW… | Non-stackable (1 slot each) |
| Gear — Armor | CLOTH_VEST, LEATHER_ARMOR, IRON_ARMOR… | Non-stackable |
| Consumables | HEALING_SYRINGE | Stack ≤ 20 |
| Crafting Vouchers | LOGGING_SITE_ACCESS | Stackable |

Full item registry in `src/game/data/items.ts` (`ItemID` union + `ITEMS` record).

## Slot Expansion

- Base slots: fixed at guild start
- Furniture and storage upgrades add slots (Storage Furniture: +20 slots each)
- Max storage scales with facility level / furniture count
- Magic Vault variant: dedicated slots for spells/potions <!-- TODO: verify furniture slot values against furniture.ts -->

## Filter & Sort UI

Primary tabs: All / Resources / Gear / Spells & Potions / Crafting

Secondary filters: Type, Rarity (Common → Legendary), Source (Mining / Craft / Reward / Shop), Stackable toggle, Equipped/Unequipped toggle.

Sort: quantity, rarity, most recent, type.

Search: by name or tag (buff, heal, magic, weapon, armor).

## Capacity Warnings

- Capacity bar shows `used / total` slots (e.g. "34 / 60")
- On full inventory:
  - Warning displayed
  - Auto-store to room backlog for resource-type items
  - Option to sell / salvage directly from warning modal

## Gear Comparison

When inspecting an item in inventory: popup shows stat delta vs. currently equipped item. Color coding: green = better, red = worse, yellow = equal. Quick-equip button in popup.

Item tooltip: name, rarity color, base stats + slot affixes, durability bar, source info, sell value, dismantle value.

## Equipment Slot Affix Pipeline

Gear items carry `EquipmentSlotData[]` (from Workshop crafting). Slot HP bonuses are aggregated by `calcGearBonuses()` in `src/game/systems/equipment-bonuses.ts` and fed into the derived combat stats pipeline.

## References

- Inventory state: `src/game/state/inventory-slice.ts`
- Item definitions: `src/game/data/items.ts`
- Gear bonus aggregation: `src/game/systems/equipment-bonuses.ts`
- Equipment templates: `src/game/data/equipment-templates.ts`
