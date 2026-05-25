# Inventory Panel Redesign — Category-Based Slot System Complete

**Date**: 2026-05-02 13:12
**Severity**: Medium
**Component**: Inventory UI & Data Layer
**Status**: Resolved

## What Happened

Completed full inventory panel redesign across 4 phases (~5.5h). Replaced furniture-based chest counting with a per-category slot system, rebuilt UI from scratch with tabbed interface, and added slot expansion mechanic. Build passes with zero TypeScript errors.

## The Brutal Truth

This redesign felt necessary but the scope crept early—what looked like "just redesign the UI" turned into rethinking the entire data model. The furniture slot system was conceptually broken (how do you explain to players that their inventory size depends on which chests they own?), so a category-based approach makes sense. However, we had to be careful with backward compatibility; old saves couldn't break.

The biggest relief: **no migration script required**. Old saves missing `categoryCapacity` default to 30 slots per category automatically. Dodged a potential data corruption nightmare there.

## Technical Details

### Data Layer Changes
- Added `InventoryCategory = 'material' | 'consumable' | 'weapon' | 'armor'` discriminated union to `items.ts`
- Added `rarity: ItemRarity` to all 11 `EquipmentTemplate` entries (COMMON/UNCOMMON/RARE)
- Replaced `getMaxSlots` / `BASE_INVENTORY_SLOTS` / `SLOTS_PER_CHEST` with `getCategoryMaxSlots` and `CATEGORY_DEFAULT_SLOTS=30`
- Added `expandCategorySlots(category, delta)` with 200-slot hard cap
- Exported `RARITY_ORDER` and `UnifiedSlotEntry` discriminated union for tab filtering

### UI Rewrite
- `inventory-panel.tsx`: Tabbed interface (All/Weapons/Armor/Materials/Consumables), search bar, rarity filter pills, sort options (Rarity/Name/Qty), 8-column 52px grid
- New `inventory-detail-panel.tsx`: Right sidebar showing item icon, name, type, rarity, stats, Equip/Use/Drop buttons
- New `inventory-slot-expansion.tsx`: Footer button to spend WOOD×20 + STONE×10 for +10 slots (capped at 200)

### Bug Fixes During Review
- **Stale closure in drop handler**: Added `useEffect` to auto-deselect when dropped item disappears from inventory
- **Dead "Recent" sort**: Removed unreachable code path
- **Duplicate exports**: `RARITY_ORDER` was exported twice; deduplicated via `items.ts` import
- **Corrupted saves**: Added null-guard for equipment entries missing `rarity` field

## What We Tried

1. **Furniture system migration**: Rejected—too complex, breaks the mental model
2. **Save file rarity field**: Rejected—equipment rarity should be read-only from templates, not persisted
3. **Category slot as string enum**: Worked but switched to discriminated union `UnifiedSlotEntry` for cleaner filtering

## Root Cause Analysis

The furniture-based system failed because it violated separation of concerns: inventory capacity shouldn't depend on facility ownership. The design conflated two concepts (facility inventory buffer + character slots). Per-category slots are simpler and align with the UI's natural tab structure.

Backward compatibility risk was real—we load player saves that may have 6+ month old data. By making `categoryCapacity` optional with a sensible default, we avoided a migration step and all its failure modes.

## Lessons Learned

1. **Defaults are migrations**: When introducing optional fields, provide smart defaults. Saved us from building a migration system.
2. **Discriminated unions catch mistakes**: `UnifiedSlotEntry` prevents mixing item/equipment logic; TypeScript forces exhaustive checks in tabs.
3. **Review early for stale closures**: Drop handler captured old state before async renders completed. Found during code review, not QA.
4. **Hard caps prevent exploits**: 200-slot max on expansion prevents gold sink cheese and keeps UI performant.

## Next Steps

- Merge develop → main when CI green
- Monitor for old-save load failures in telemetry (watch for missing rarity fields)
- Plan Phase 02: Sort/filter persistence in localStorage
- Consider: equipment durability bar in detail panel (Phase 03)

**Owner**: Complete (no handoff needed)
