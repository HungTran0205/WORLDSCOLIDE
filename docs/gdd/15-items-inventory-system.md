# 15 — Items, Inventory & Crafting Database

**Code refs:** `src/game/data/items.ts`, `src/game/data/equipment-templates.ts`, `src/game/data/alchemy-recipes.ts`, `src/game/data/workshop-config.ts`

**Last updated:** 2026-05-29  
**Status:** Items MVP finalized; Alchemy Lv1 implemented; Workshop v2 in progress

---

## Table of Contents
1. [Inventory Model](#inventory-model)
2. [Items Master List](#items-master-list)
3. [Materials & Sources](#materials--sources)
4. [Consumables & Usage](#consumables--usage)
5. [Equipment & Crafting Chains](#equipment--crafting-chains)
6. [Alchemy Recipes](#alchemy-recipes)
7. [Workshop Configuration](#workshop-configuration)
8. [Future Items (Declared Stubs)](#future-items-declared-stubs)
9. [Gaps & Unimplemented Features](#gaps--unimplemented-features)

---

## Inventory Model

**Location:** `src/game/state/guild-slice.ts` (inventory field)

- **Type:** Flat quantity map: `Record<ItemID, number>`
- **Stack limit:** `STACK_LIMIT = 99` per stack
- **Slot limit:** None at MVP
- **Categories:** 
  - `material` — crafting inputs
  - `consumable` — battle/facility usage
  - `weapon` — equipment (workshop)
  - `armor` — equipment (workshop)

**UI:** See `rooms/inventory.md` for panel interaction model.

---

## Items Master List

### Legend

| Column | Meaning |
|--------|---------|
| **ID** | Unique item code (ItemID type) |
| **Name** | Display name (English) |
| **Type** | MATERIAL \| CONSUMABLE \| EQUIPMENT \| CURRENCY |
| **Rarity** | COMMON \| UNCOMMON \| RARE \| EPIC \| LEGENDARY |
| **Stackable** | Can stack in inventory (max 99) |
| **Base Price** | Sell value in gold |
| **Source** | Where item comes from |
| **Used For** | Craft recipes or item targets |
| **Status** | IMPLEMENTED \| DECLARED (stub) \| PLANNED |

### All Items

| ID | Name | Type | Rarity | Stack | Price | Source | Used For | Status |
|----|------|------|--------|-------|-------|--------|----------|--------|
| **WOOD** | Oak Wood | MATERIAL | COMMON | Yes | 2g | Logging Site | T1 Weapons, T1 Armor | ✅ Implemented |
| **STONE** | Rough Stone | MATERIAL | COMMON | Yes | 3g | Stone Quarry | T2 Weapons, T2 Armor | ✅ Implemented |
| **IRON_ORE** | Iron Ore | MATERIAL | UNCOMMON | Yes | 8g | Stone Quarry (vein) | T3 Weapons, T3 Armor | ✅ Implemented |
| **GEM** | Gemstone | MATERIAL | RARE | Yes | 50g | Deep Quarry | *Future: rare affix unlock* | ✅ Implemented |
| **SLIME_GEL** | Slime Gel | MATERIAL | COMMON | Yes | 5g | Slime enemy drops | Healing Syringe (Alchemy Lv0) | ✅ Implemented |
| **BOAR_PELT** | Boar Pelt | MATERIAL | COMMON | Yes | 4g | Boar enemy drops | *No recipes yet* | ✅ Implemented |
| **WOLF_FANG** | Wolf Fang | MATERIAL | UNCOMMON | Yes | 10g | Wolf enemy drops | *No recipes yet* | ✅ Implemented |
| **GOBLIN_EAR** | Goblin Ear | MATERIAL | COMMON | Yes | 3g | Goblin enemy drops | *No recipes yet* | ✅ Implemented |
| **ORC_TUSK** | Orc Tusk | MATERIAL | UNCOMMON | Yes | 15g | Orc enemy drops | *No recipes yet* | ✅ Implemented |
| **LOGGING_SITE_ACCESS** | Logging Permit | CONSUMABLE | UNCOMMON | Yes | 0g | Purchased (facility build) | Build Logging Site (consumed) | ✅ Implemented |
| **HEALING_SYRINGE** | Healing Syringe | CONSUMABLE | COMMON | Yes | 12g | Alchemy Lab (recipe) | Combat auto-use (30% HP heal) | ✅ Implemented |
| **HEALING_SYRINGE_2** | Healing Syringe II | CONSUMABLE | UNCOMMON | Yes | 30g | Alchemy Lab (future recipe) | Combat auto-use (50% HP heal) | ⚠️ Declared |
| **HEALING_SYRINGE_3** | Healing Syringe III | CONSUMABLE | RARE | Yes | 80g | Alchemy Lab (future recipe) | Combat auto-use (80% HP heal) | ⚠️ Declared |
| **BAT_WING** | Bat Wing | MATERIAL | COMMON | Yes | 4g | Cave Bat (level 2, 30%) | DODGE armor affix [+0.03–0.08] | ✅ Implemented |
| **SPIDER_LEGS** | Spider Legs | MATERIAL | COMMON | Yes | 5g | Forest Spider (level 1, 22%) | ATTACK_SPEED weapon affix [+0.05–0.12] | ✅ Implemented |
| **METAL_PLATE** | Metal Plate | MATERIAL | UNCOMMON | Yes | 12g | Dog Robot (level 3, 75%) | BLOCK armor affix [+0.03–0.08] | ✅ Implemented |
| **DRONE_SENSOR** | Drone Sensor | MATERIAL | UNCOMMON | Yes | 18g | Flying Drone (level 2, 80%); Dog Robot (30%) | ACCURACY weapon affix [+0.05–0.15] | ✅ Implemented |
| **SLIME_KING_CORE** | Slime King Core | MATERIAL | RARE | Yes | 60g | Slime King boss (100%) | SHIELD armor affix [1–2 charges] | ✅ Implemented |

---

## Materials & Sources

### Material Drop Sources

| Material | Primary Enemy (level) | Chance | Secondary Sources |
|----------|----------------------|--------|------------------|
| **SLIME_GEL** | Slime (lv1, 75%) | 75% | Forest Spider 50%, Slime King 100%, Queen Spider 100% |
| **BOAR_PELT** | Wild Boar (lv3, 60%) | 60% | Wolf 30% |
| **BEAR_PELT** | Moonbear (lv2 boss, 80%) | 80% | — |
| **BAT_WING** | Cave Bat (lv2, 30%) | 30% | — |
| **SPIDER_LEGS** | Forest Spider (lv1, 22%) | 22% | — |
| **METAL_PLATE** | Dog Robot (lv3, 75%) | 75% | — |
| **DRONE_SENSOR** | Flying Drone (lv2, 80%) | 80% | Dog Robot 30% |
| **SLIME_KING_CORE** | Slime King (lv3 boss, 100%) | 100% | — |
| **WOLF_FANG** | Dire Wolf (lv5, 70%) | 70% | Wolf (lv3) 40% |
| **GOBLIN_EAR** | Goblin Shaman (lv4, 60%) | 60% | Bandit (lv2) 40% |
| **ORC_TUSK** | Warlord Grok (lv8 boss, 100%) | 100% | Orc Berserker 50%, Orc Warrior 35% |

### Facility-Based Materials

| Material | Facility | Requirement | Upkeep |
|----------|----------|-------------|--------|
| **WOOD** | Logging Site | 1× LOGGING_SITE_ACCESS + room slots | Forester upkeep |
| **STONE** | Stone Quarry | Room placement | Workers upkeep |
| **IRON_ORE** | Stone Quarry (vein) | High productivity / luck | Workers upkeep |
| **GEM** | Deep Quarry | *Not yet built* | *TBD* |

### Craft Consumption

Materials consumed in crafting:

| Material | Consumed In | Units/Craft | Recipes |
|----------|-------------|------------|---------|
| **WOOD** | T1 Weapons (Axe/Crossbow/Sword) | 20 | Workshop |
| **BOAR_PELT** | Boar Fur Coat (Armor T1) | 1 + 10× WOOD | Workshop |
| **BEAR_PELT** | Bear Coat (Armor T2) | 1 + 10× STONE | Workshop |
| **STONE** | T2 Weapons | 15 | Workshop |
| **STONE** | T2 Armor | 10 | Workshop |
| **IRON_ORE** | T3 Weapons | 8–10 | Workshop |
| **IRON_ORE** | T3 Armor | 8 | Workshop |
| **SLIME_GEL** | Healing Syringe (Alchemy) | 1 | Alchemy Lab Lv0 |
| **SLIME_GEL** | Healing Syringe II (Alchemy) | 2 | Alchemy Lab Lv3 |
| **SLIME_GEL** | Healing Syringe III (Alchemy) | 3 | Alchemy Lab Lv5 |

---

## Consumables & Usage

### Healing Syringes

**Family:** Auto-use combat consumables (HP restoration on threshold)

| Item | Heal % | Max HP | Auto-trigger | Rarity | Recipe | Alchemy Req |
|------|--------|--------|-----------|--------|--------|-------------|
| **HEALING_SYRINGE** | 30% | All | Threshold ≤ 30% | COMMON | 1× SLIME_GEL | Lv 0 |
| **HEALING_SYRINGE_2** | 50% | All | Threshold ≤ 50% | UNCOMMON | 2× SLIME_GEL | Lv 3 |
| **HEALING_SYRINGE_3** | 80% | All | Threshold ≤ 80% | RARE | 3× SLIME_GEL | Lv 5 |

**Note:** Combat auto-trigger is **implemented** in `combat-engine.ts`. Each syringe auto-uses when HP ≤ its threshold.

**UI:** Managed via `SyringeLoadout` in roster panel. Per-member threshold config.

### Facility Permits

| Item | Function | Effect | Single-use | Rarity |
|------|----------|--------|-----------|--------|
| **LOGGING_SITE_ACCESS** | Build authorization | Unlock Logging Site facility | Yes (consumed) | UNCOMMON |

---

## Equipment & Crafting Chains

### Equipment Slot Model

- **Weapon slot:** One weapon (axe/crossbow/sword by archetype)
- **Armor slot:** One armor piece
- **Durability:** Broken gear (durability = 0) grants **no stat bonus** (cosmetic only)
- **Max durability:** 40–120 depending on tier and type

### Tier Progression

| Tier | Rarity | Weapon DMG | Armor (HP / DEF) | Material | Craft Time | Status |
|------|--------|-----------|------------------|----------|-----------|--------|
| **T1** | COMMON | 10 | 20 HP / 3 DEF | WOOD (20 units) | 30s | ✅ Ready |
| **T2** | UNCOMMON | 18 | 40 HP / 7 DEF | STONE (15 units) | 75s | ✅ Ready |
| **T3** | RARE | 28–30 | 70 HP / 15 DEF | IRON_ORE (8–10 units) | 180s | ✅ Ready |

### Weapons by Type

#### T1 — Wooden Weapons

| Weapon | Archetype | DMG | Durability | Craft Cost | Starting Equip |
|--------|-----------|-----|-----------|-----------|----------------|
| **WOODEN_AXE** | Warrior | 10 | 50 | 20× WOOD | ✅ Yes |
| **WOODEN_CROSSBOW** | Scout | 10 | 50 | 20× WOOD | ✅ Yes |
| **WOODEN_SWORD** | Sword (founder) | 10 | 50 | 20× WOOD | ✅ Yes |

#### T2 — Stone Weapons

| Weapon | Archetype | DMG | Durability | Craft Cost |
|--------|-----------|-----|-----------|-----------|
| **STONE_AXE** | Warrior | 18 | 80 | 15× STONE |
| **STONE_CROSSBOW** | Scout | 18 | 80 | 15× STONE |
| **STONE_SWORD** | Sword | 18 | 80 | 15× STONE |

#### T3 — Iron Weapons

| Weapon | Archetype | DMG | Durability | Craft Cost |
|--------|-----------|-----|-----------|-----------|
| **IRON_AXE** | Warrior | 30 | 120 | 10× IRON_ORE |
| **IRON_CROSSBOW** | Scout | 28 | 100 | 10× IRON_ORE |
| **IRON_SWORD** | Sword | 30 | 120 | 10× IRON_ORE |

### Armor

#### T1 — Cloth Armor

| Armor | HP | DEF | Durability | Craft Cost | Starting Equip |
|-------|----|----|-----------|-----------|----------------|
| **CLOTH_VEST** | 20 | 3 | 40 | 10× WOOD | ✅ Yes |

#### T2 — Leather Armor

| Armor | HP | DEF | Durability | Craft Cost |
|-------|----|----|-----------|-----------|
| **LEATHER_ARMOR** | 40 | 7 | 70 | 10× STONE |

#### T3 — Iron Armor

| Armor | HP | DEF | Durability | Craft Cost |
|-------|----|----|-----------|-----------|
| **IRON_ARMOR** | 70 | 15 | 120 | 8× IRON_ORE |

### Workshop Crafting Flow

**System:** `src/game/systems/workshop-system.ts`  
**UI:** `src/ui/panels/workshop-panel.tsx`

**States:**
1. **Path A** (20% chance) — Generic slot (HP 40–150)
2. **Path B** — No affix (stat roll disabled in MVP)
3. **Enhance** — Add affix slot (SLIME_GEL → TANKY/HP)
4. **Repair** — Restore durability (60–180s depending on damage %)
5. **Dismantle** — Recover 50–80% of materials

**Affix Slot Pool (Active):**

| Affix Category | Stat | Range | Material | Equip Type | Tier | Status |
|---|---|---|---|---|---|---|
| **TANKY** | HP | +50–200 | SLIME_GEL | Armor | T1 | ✅ Active |
| **DODGE** | DODGE | +0.03–0.08 | BAT_WING | Armor | T1 | ✅ Active |
| **ATTACK_SPEED** | ATTACK_SPEED | +0.05–0.12 | SPIDER_LEGS | Weapon | T1 | ✅ Active |
| **BLOCK** | BLOCK | +0.03–0.08 | METAL_PLATE | Armor | T2 | ✅ Active |
| **ACCURACY** | ACCURACY | +0.05–0.15 | DRONE_SENSOR | Weapon | T2 | ✅ Active |
| **SHIELD** | SHIELD | 1–2 charges | SLIME_KING_CORE | Armor | T3 | ✅ Active |

---

## Alchemy Recipes

**Location:** `src/game/data/alchemy-recipes.ts`

### Recipe Format

```typescript
interface AlchemyRecipe {
  id: string;
  name: string;
  ingredients: Partial<Record<ItemID, number>>;
  output: { itemId: ItemID; quantity: number };
  requiredAlchemyLevel: number;
}
```

### Implemented Recipes

| Recipe ID | Name | Ingredients | Output | AC Level | Status |
|-----------|------|-------------|--------|----------|--------|
| `healing-syringe` | Healing Syringe | 1× SLIME_GEL | 1× HEALING_SYRINGE | 0 | ✅ Active |
| `healing-syringe-2` | Healing Syringe II | 2× SLIME_GEL | 1× HEALING_SYRINGE_2 | 3 | ✅ Active |
| `healing-syringe-3` | Healing Syringe III | 3× SLIME_GEL | 1× HEALING_SYRINGE_3 | 5 | ✅ Active |

**Note:** Recipe matching is **quantity-aware** — 2× SLIME_GEL slots correctly resolve to HS2, not HS1×2.

### Auto-Production Formula

**System:** `src/game/systems/alchemy-production-system.ts`

```
batchesPerDay = max(1, floor(INT × 0.08 + DEX × 0.04 + facilityLevel + 1))
gelsPerBatch  = acLevel + 1   (AC = Alchemy Craft level)
syringes      = batchesDone × gelsPerBatch   (capped by available SLIME_GEL)
```

**AC Level progression:** 10 levels, XP from syringes crafted
- Thresholds: 10 → 25 → 50 → 100 → ... → 2,500

**Planned AC bonuses (design-only, not implemented):**
- **AC Lv5:** Double batch per day
- **AC Lv10:** Grand Elixir unlock

---

## Workshop Configuration

**Location:** `src/game/data/workshop-config.ts`

| Setting | Value | Notes |
|---------|-------|-------|
| **Craft Time — Tier 1** | 30s | Base; no level scaling yet |
| **Craft Time — Tier 2** | 75s | |
| **Craft Time — Tier 3** | 180s | |
| **Craft Time — Tier 4** | 480s | Future |
| **Craft Time — Tier 5** | 1200s | Future |
| **Path A Slot Chance** | 20% | Generic HP affix |
| **Generic Stat Pool** | HP 40–150 | Only HP in MVP |
| **Dismantle Recovery (plain)** | 70–80% | Non-crafted items |
| **Dismantle Recovery (crafted)** | 50–60% | Previously crafted items |
| **Monster Recover Chance** | 30% | Chance to get 1 material back |
| **Blueprint Slots (Lv1–5)** | 3, 5, 8, 12, 15 | Workshop level scaling |
| **Equipment Max Slots** | 4 | Maximum affixes per item |

### Repair Time Formula

```
repairTime(damagePct) = 60 + floor(damagePct × 120)
  → 60s at 0% damage
  → 180s at 100% damage
```

---

## Future Items (Declared Stubs)

These items are **declared in code but not yet fully integrated**:

### Monster Materials & Affix Sources

| Item | Rarity | Drop Source | Affix Purpose | Status |
|------|--------|------------|---------|--------|
| **BAT_WING** | COMMON | Cave Bat (level 2, 30%) | DODGE armor [+0.03–0.08] | ✅ Active |
| **SPIDER_LEGS** | COMMON | Forest Spider (level 1, 22%) | ATTACK_SPEED weapon [+0.05–0.12] | ✅ Active |
| **METAL_PLATE** | UNCOMMON | Dog Robot (level 3, 75%) | BLOCK armor [+0.03–0.08] | ✅ Active |
| **DRONE_SENSOR** | UNCOMMON | Flying Drone (level 2, 80%); Dog Robot (30%) | ACCURACY weapon [+0.05–0.15] | ✅ Active |
| **SLIME_KING_CORE** | RARE | Slime King boss (100%) | SHIELD armor [1–2 charges] | ✅ Active |

**All 5 affix materials have live enemy drop sources.** METAL_PLATE and DRONE_SENSOR come from the post-apoc machine enemies (Flying Drone / Dog Robot) introduced in Arc 1.

### Higher-Tier Syringes

| Item | Rarity | Purpose | Alchemy Req | Status |
|------|--------|---------|-------------|--------|
| **HEALING_SYRINGE_2** | UNCOMMON | 50% HP heal (auto-use) | 3 | ✅ Implemented |
| **HEALING_SYRINGE_3** | RARE | 80% HP heal (auto-use) | 5 | ✅ Implemented |

**Note:** Both recipes active; craft via Alchemy Lab at Lv3+ and Lv5+ respectively.

---

## Gaps & Unimplemented Features

### High Priority

| Gap | Type | Impact | Notes |
|-----|------|--------|-------|
| **BOAR_PELT, WOLF_FANG, GOBLIN_EAR, ORC_TUSK recipes** | Content | Materials drop but have limited craft use | Only BOAR_PELT and BEAR_PELT have pelt-armor recipes; others deferred |
| **GEM crafting** | Content | Rare material with no recipe | Planned for rare affix unlock or endgame gear |

### Medium Priority

| Gap | Type | Impact | Notes |
|-----|------|--------|-------|
| **Monster material craft use** | Content | BAT_WING/SPIDER_LEGS/METAL_PLATE/DRONE_SENSOR drop live but no recipes beyond affix enhance | No craft recipe chain (only affix material use) |
| **SLIME_KING_CORE use** | Content | Boss material exists in code but no target | Propose as rare quest item or endgame unlock |
| **Workshop level scaling** | Feature | Craft times don't scale with workshop level | Implement in `workshop-system.ts` |
| **AC bonus unlocks** | Feature | AC Lv5 (double batch) and Lv10 (Grand Elixir) are design-only | Implement in production system |
| **Repair durability** | Feature | UI exists but repair logic is incomplete | Finish in workshop panel + system |

### Low Priority / Future Phases

| Gap | Type | Impact | Notes |
|-----|------|--------|-------|
| **Item affixes (non-HP)** | Feature | DODGE, ACCURACY, BLOCK, ATTACK_SPEED, SHIELD disabled | Requires material affinity redesign + stat interactions |
| **Deep Quarry / GEM source** | Facility | GEM material exists but no way to obtain | Requires facility implementation + loot table |
| **Post-apoc salvage enemies** | Content | METAL_PLATE, DRONE_SENSOR declared but no drop source | Design future civilization missions |
| **Seasonal recipes** | Content | No date-driven or event-based alchemy recipes | Planned for holiday events |

---

## Quick Ref: Item Aliases & ID Mappings

| Formal ID | Display Name | Category |
|-----------|--------------|----------|
| `WOOD` | Oak Wood | Material |
| `STONE` | Rough Stone | Material |
| `IRON_ORE` | Iron Ore | Material |
| `GEM` | Gemstone | Material |
| `SLIME_GEL` | Slime Gel | Material |
| `BOAR_PELT` | Boar Pelt | Material |
| `WOLF_FANG` | Wolf Fang | Material |
| `GOBLIN_EAR` | Goblin Ear | Material |
| `ORC_TUSK` | Orc Tusk | Material |
| `LOGGING_SITE_ACCESS` | Logging Permit | Consumable |
| `HEALING_SYRINGE` | Healing Syringe | Consumable |
| `HEALING_SYRINGE_2` | Healing Syringe II | Consumable |
| `HEALING_SYRINGE_3` | Healing Syringe III | Consumable |

---

## Change Log

| Date | Change | Type |
|------|--------|------|
| 2026-06-02 | Sync with enemies.ts: METAL_PLATE (dog-robot 75%), DRONE_SENSOR (flying-drone 80%, dog-robot 30%), SLIME_KING_CORE (slime-king 100%) all have live drop sources — removed from Gaps, updated All Items + Future Items tables | UPDATE |
| 2026-06-02 | Fixed Material Drop Sources table — accurate per-kill chances from code, added secondary sources column | UPDATE |
| 2026-06-02 | BAT_WING, SPIDER_LEGS status: ⚠️ Declared → ✅ Implemented | UPDATE |
| 2026-05-29 | Pelt armor tier (Boar/Bear coats), 5 active affixes, SHIELD mechanic, HS2/HS3 recipes | UPDATE |
| 2026-05-29 | Fixed stale claims: syringe auto-use implemented, all 6 affix categories now active | UPDATE |
| 2026-05-29 | Added cave-bat→BAT_WING, forest-spider→SPIDER_LEGS, moonbear→BEAR_PELT to drops | UPDATE |
| — | *Future: Deep Quarry & GEM source* | PLANNED |

---

**End of 11 — Items, Inventory & Crafting Database**
