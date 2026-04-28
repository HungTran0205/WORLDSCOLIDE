# Equipment System Phase 1: Per-Member Gear Slots & Stat Integration

**Date**: 2026-04-27 21:00
**Severity**: Medium
**Component**: Combat, Inventory, Character Progression
**Status**: Resolved

## What Happened

Implemented foundational equipment system allowing guild members to equip weapon, armor, and headgear. Gear provides flat stat bonuses (damage, HP, defense) that feed directly into combat calculations. Starting weapons allocated to LinhSon archetypes. Save migration v18→v19 handles backward compatibility cleanly.

## The Brutal Truth

Two separate combat paths (real-time arena vs auto-resolve simulator) meant equipment code landed in both places independently — no shared entity creation factory. Caught this during implementation; updated both paths to prevent combat divergence. Extra work, but necessary given architecture constraints.

## Technical Details

**Equipment Model:**
- Instance-based: each equipped item has uuid + mutable durability
- Distinct from inventory items — equip copies item stats, durability is owned by member
- Broken gear (durability=0) gives zero bonus: enforced at `calcGearBonuses()` level

**Stat Application:**
- `flatDamage` from weapon → added to `calcAutoAttackDamage(flatBonus)` before defense reduction
- `flatHp` from armor/headgear → added to maxHp at entity creation
- `flatDefense` → adds to effective END for damage calc (existing formula path)
- All bonuses additive, no stacking multipliers

**Starting Gear:**
- LinhSon warrior: WOODEN_AXE (+10 dmg)
- LinhSon scout: WOODEN_CROSSBOW (+10 dmg)
- Other civs: no starting gear

**Save Migration:**
- `equipment: null` on all existing members
- `equipmentInventory: []` initialized
- Zero data loss; old saves playable immediately

## What We Tried

Initial design flattened all gear bonuses into single types. Reverted to per-stat bonuses (damage/hp/defense) — clearer intent, easier to debug, supports future rebalancing.

## Root Cause Analysis

Combat architecture split meant we couldn't centralize equipment bonus logic. Could have created a shared utility function earlier, but discovered the problem mid-implementation. Prevention: review all combat paths during design phase next time.

## Lessons Learned

1. **Instance-based gear > inventory-sourced** — avoids inventory mutation during combat, durability owned by member is cleaner
2. **Flat bonuses before defense calc** — simpler to reason about than percentage-based or post-defense application
3. **Two combat paths are a liability** — next refactor should consolidate or add explicit sync tests
4. **Migration as feature** — v19 handles both old saves and new equipment gracefully

## Next Steps

**Phase 2 — Visual & UX:**
- Render equipped gear sprite variants on guild roster & detail panels
- Add equipment UI panel (equip/unequip buttons, durability indicator)
- Implement durability decay on combat auto-attack
- Test gear effectiveness in real combat scenarios

**Files Modified**: game-state.ts, combat-types.ts, combat-formulas.ts, combat-entity-factory.ts, combat-simulator.ts, combat-engine.ts, character-creation.ts, guild-slice.ts, inventory-slice.ts, save-types.ts, save-migrations.ts, store.ts, member-book-detail-page.tsx, guild-roster.tsx, inventory-panel.tsx, character-detail-panel.tsx

**Build Status**: TypeScript passes. 5 pre-existing errors from shadow/bloom feature (unrelated).
