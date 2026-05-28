# Room: Workshop

**Def:** `src/game/data/facility-definitions.ts` — `FACILITY_DEFINITIONS.workshop`
**Systems:** `src/game/systems/workshop-system.ts`, `workshop-offline-system.ts`
**Data:** `src/game/data/workshop-config.ts`, `workshop-types.ts`, `workshop-material-affinity.ts`
**State:** `src/game/state/guild-slice-workshop.ts`

## Purpose

Unified weapon/armor crafting facility. Queue-based, driven by assigned **workers** (not level). Supports offline progression at full speed.

## Build Requirements

- Cost: 250g + 50 WOOD
- Upgrades: +400g → Lv2, +700g → Lv3
- `maxSlots: [1, 2, 3]` — primary stats: STR + DEX

## Worker Queue Model

- 1 worker = 1 active task at a time
- Workers auto-pick next queued task on completion
- Insufficient materials → skip that task, continue queue
- Queue persists offline; runs at full speed while away
- Concurrent tasks = number of assigned workers

## Four Task Types

| Task | Input | Output | Notes |
|------|-------|--------|-------|
| **Craft** | Base material + optional monster mat + optional gem | Equipment item | Path A/B/B+ |
| **Enhance Add** | Equipment (empty slot) + monster material | Slot filled with stat | Guaranteed, no fail |
| **Enhance Reroll** | Equipment (filled slot) + same-category material | Slot rerolled | No floor — can roll lower |
| **Repair** | Stone or Wood (matches item material) | Full durability restored | No-fail, 1–3 min |

Types defined in `src/game/data/workshop-types.ts` (`WorkshopTaskType`).

## Crafting Paths

| Path | Materials | Output Slot | Unlock |
|------|-----------|-------------|--------|
| **A — Plain** | Base material only | 20% chance generic slot | Always |
| **B — Guided** | Base + 1 monster mat | Guaranteed 1 slot (category from material) | Always |
| **B+ — Dual** | Base + 2 monster mats | Guaranteed 2 slots | Workshop Lv2+ |

No-fail system: always produces an item; quality depends on material tier.

## Material Affinity (MVP)

Defined in `src/game/data/workshop-material-affinity.ts` (`MATERIAL_AFFINITY`):

| Material | Category | Stat | Range | Status |
|----------|----------|------|-------|--------|
| SLIME_GEL | TANKY | HP | +50–200 | **Active** |
| BAT_WING | DODGE | HP | +1–5 | Stub (disabled) |
| SPIDER_LEGS | ACCURACY | HP | +1–10 | Stub (disabled) |
| METAL_PLATE | BLOCK | HP | +1–5 | Stub (disabled) |
| DRONE_SENSOR | ATTACK_SPEED | HP | +5–10 | Stub (disabled) |
| SLIME_KING_CORE | SHIELD | HP | +50–500 | Stub (disabled) |

Slot bonus model: `EquipmentSlotData { category, statKey, value }` — HP slots feed into `calcGearBonuses()` in `src/game/systems/equipment-bonuses.ts`.

## Workshop Upgrade Table

| Level | Speed | Unlocks | Blueprint Slots |
|-------|-------|---------|----------------|
| 1 | 1.0× | T1 items, Path A/B, Enhance | 3 |
| 2 | 1.3× | T2 items, Path B+ (2 materials) | 5 |
| 3 | 1.6× | T3 items, Gem Elemental Slot | 8 |

## Equipment Tiers

Defined in `src/game/data/equipment-templates.ts` (`EQUIPMENT_DATABASE`):

| Tier | Weapon Damage | Armor HP / DEF | Material |
|------|--------------|----------------|---------|
| T1 Wood/Cloth | 10 dmg / 20 HP+3 DEF | 30s craft (base) | WOOD |
| T2 Stone/Leather | 18 dmg / 40 HP+7 DEF | 75s | STONE |
| T3 Iron | 28–30 dmg / 70 HP+15 DEF | 3 min | IRON_ORE |

## Dismantle (Instant)

- Plain item: 70–80% base material recovery
- Crafted item (with monster mat): 50–60% material, 30% chance to recover 1 monster material
- Gems: not recoverable (bound to item on craft)

## Blueprint System

Save a material combination → batch craft without manual re-selection. Blueprint slots scale with Workshop level (3 / 5 / 8). Defined in `src/game/data/workshop-config.ts`.

## References

- Task processing: `src/game/systems/workshop-system.ts`
- Offline queue advance: `src/game/systems/workshop-offline-system.ts`
- Workshop state: `src/game/state/guild-slice-workshop.ts`
- Slot bonus pipeline: `src/game/systems/equipment-bonuses.ts` → `calcGearBonuses()`
