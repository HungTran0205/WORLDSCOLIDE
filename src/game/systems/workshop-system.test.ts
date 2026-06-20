/**
 * Workshop Room v2 — pure-function tests.
 * RNG injection lets us drive each branch deterministically.
 */

import { describe, it, expect } from 'vitest';
import type { EquipmentItem, InventoryState } from '@/game/state/game-state';
import {
  processCraft,
  processEnhanceAdd,
  processEnhanceReroll,
  processRepair,
  processDismantle,
  rollSlotValue,
  validateCraftInput,
} from './workshop-system';

/** Sequenced RNG returning the next value in `seq` each call (clamped to last). */
function seqRng(seq: number[]): () => number {
  let i = 0;
  return () => seq[Math.min(i++, seq.length - 1)];
}

const fixedRng = (v: number) => () => v;

// ── rollSlotValue ──────────────────────────────────────────────────────────

describe('rollSlotValue', () => {
  it('returns rounded linear interpolation', () => {
    expect(rollSlotValue([50, 200], fixedRng(0.5))).toBe(125);
    expect(rollSlotValue([50, 200], fixedRng(0))).toBe(50);
    expect(rollSlotValue([50, 200], fixedRng(1))).toBe(200);
  });
});

// ── processCraft ───────────────────────────────────────────────────────────

describe('processCraft', () => {
  it('Path A (no material) — rng < 0.20 yields one generic slot', () => {
    // First call (slot-chance check) = 0.1 < 0.20 → slot appears
    // Second call (rollSlotValue) = 0.5 → mid-range value
    const rng = seqRng([0.1, 0.5]);
    const { equipment } = processCraft(
      { kind: 'CRAFT', baseMaterial: 'WOOD', templateId: 'WOODEN_AXE' },
      rng,
    );
    expect(equipment.slots).toHaveLength(1);
    expect(equipment.slots?.[0].category).toBe('GENERIC');
    expect(equipment.slots?.[0].statKey).toBe('HP');
  });

  it('Path A — rng >= 0.20 yields no slot', () => {
    const { equipment } = processCraft(
      { kind: 'CRAFT', baseMaterial: 'WOOD', templateId: 'WOODEN_AXE' },
      fixedRng(0.5),
    );
    expect(equipment.slots).toEqual([]);
  });

  it('Path B (Slime Gel) — guaranteed HP slot in [50,200]', () => {
    // SLIME_GEL is armor-only — must target an armor template to pass the equip-type guard.
    const { equipment } = processCraft(
      { kind: 'CRAFT', baseMaterial: 'BOAR_PELT', templateId: 'BOAR_FUR_COAT', monsterMaterial: 'SLIME_GEL' },
      fixedRng(0.5),
    );
    expect(equipment.slots).toHaveLength(1);
    expect(equipment.slots?.[0]).toMatchObject({ category: 'TANKY', statKey: 'HP', value: 125 });
  });

  it('Path B with material missing affinity — no slot rolled', () => {
    // WOLF_FANG has no MATERIAL_AFFINITY entry → treated as disabled.
    const { equipment } = processCraft(
      { kind: 'CRAFT', baseMaterial: 'WOOD', templateId: 'WOODEN_AXE', monsterMaterial: 'WOLF_FANG' },
      fixedRng(0.5),
    );
    expect(equipment.slots).toEqual([]);
  });

  it('sets durability = template max and maxSlots = 4', () => {
    const { equipment } = processCraft(
      { kind: 'CRAFT', baseMaterial: 'WOOD', templateId: 'WOODEN_AXE' },
      fixedRng(0.99),
    );
    expect(equipment.durability).toBe(50);
    expect(equipment.maxSlots).toBe(4);
  });
});

// ── processEnhanceAdd ──────────────────────────────────────────────────────

describe('processEnhanceAdd', () => {
  // SLIME_GEL is armor-only (tier 1) — use a T1 armor template so the equip-type guard passes.
  const baseEq: EquipmentItem = {
    id: 'e1',
    templateId: 'BOAR_FUR_COAT',
    durability: 50,
    slots: [],
    maxSlots: 4,
  };

  it('adds new slot from monster material affinity', () => {
    const result = processEnhanceAdd(baseEq, 'SLIME_GEL', fixedRng(0.5));
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.equipment.slots).toHaveLength(1);
    expect(result.equipment.slots?.[0].value).toBe(125);
  });

  it('returns NO_FREE_SLOT when slots are full', () => {
    const full: EquipmentItem = {
      ...baseEq,
      slots: Array.from({ length: 4 }, () => ({ category: 'TANKY', statKey: 'HP', value: 100 } as const)),
    };
    const result = processEnhanceAdd(full, 'SLIME_GEL', fixedRng(0.5));
    expect(result).toEqual({ error: 'NO_FREE_SLOT' });
  });

  it('returns MATERIAL_DISABLED for material with no affinity entry', () => {
    // WOLF_FANG has no MATERIAL_AFFINITY entry → undefined.enabled → falsy → MATERIAL_DISABLED.
    const result = processEnhanceAdd(baseEq, 'WOLF_FANG', fixedRng(0.5));
    expect(result).toEqual({ error: 'MATERIAL_DISABLED' });
  });

  it('returns EQUIP_TYPE_MISMATCH when material slot does not match template slot', () => {
    // SLIME_GEL is armor-only; using it on a weapon template must be rejected.
    const weapon: EquipmentItem = { ...baseEq, templateId: 'WOODEN_AXE' };
    const result = processEnhanceAdd(weapon, 'SLIME_GEL', fixedRng(0.5));
    expect(result).toEqual({ error: 'EQUIP_TYPE_MISMATCH' });
  });

  it('returns TIER_MISMATCH when material tier < template tier', () => {
    // SLIME_GEL is tier-1 armor; BEAR_COAT is tier-2 armor (BEAR_PELT primary).
    const t2: EquipmentItem = { ...baseEq, templateId: 'BEAR_COAT' };
    const result = processEnhanceAdd(t2, 'SLIME_GEL', fixedRng(0.5));
    expect(result).toEqual({ error: 'TIER_MISMATCH' });
  });
});

// ── processEnhanceReroll ───────────────────────────────────────────────────

describe('processEnhanceReroll', () => {
  const eq: EquipmentItem = {
    id: 'e1',
    templateId: 'WOODEN_AXE',
    durability: 50,
    slots: [{ category: 'TANKY', statKey: 'HP', value: 75 }],
    maxSlots: 4,
  };

  it('rerolls value, preserves category, returns oldValue + newValue', () => {
    const result = processEnhanceReroll(eq, 0, 'SLIME_GEL', fixedRng(0.5));
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.oldValue).toBe(75);
    expect(result.newValue).toBe(125);
    expect(result.equipment.slots?.[0].category).toBe('TANKY');
  });

  it('returns INVALID_SLOT for out-of-range slotIndex', () => {
    const result = processEnhanceReroll(eq, 2, 'SLIME_GEL', fixedRng(0.5));
    expect(result).toEqual({ error: 'INVALID_SLOT' });
  });

  it('returns CATEGORY_MISMATCH when material affinity != slot category', () => {
    const dodgeEq: EquipmentItem = {
      ...eq,
      slots: [{ category: 'DODGE', statKey: 'HP', value: 5 }],
    };
    const result = processEnhanceReroll(dodgeEq, 0, 'SLIME_GEL', fixedRng(0.5));
    expect(result).toEqual({ error: 'CATEGORY_MISMATCH' });
  });
});

// ── processRepair ──────────────────────────────────────────────────────────

describe('processRepair', () => {
  it('restores durability to template max', () => {
    const eq: EquipmentItem = {
      id: 'e1', templateId: 'WOODEN_AXE', durability: 12, slots: [],
    };
    const { equipment } = processRepair(eq);
    expect(equipment.durability).toBe(50);
  });
});

// ── processDismantle ───────────────────────────────────────────────────────

describe('processDismantle', () => {
  it('plain item recovers 70-80% of craftCost', () => {
    const eq: EquipmentItem = {
      id: 'e1', templateId: 'WOODEN_AXE', durability: 50, slots: [],
    };
    // craftCost = 20. rng=0.5 → 0.7 + 0.5*(0.8-0.7) = 0.75 → floor(20*0.75) = 15
    const { recoveredItems } = processDismantle(eq, fixedRng(0.5));
    expect(recoveredItems.WOOD).toBe(15);
  });

  it('crafted item uses lower band + may recover monster material', () => {
    const crafted: EquipmentItem = {
      id: 'e1', templateId: 'WOODEN_AXE', durability: 50,
      slots: [{ category: 'TANKY', statKey: 'HP', value: 100 }],
    };
    // First call (pct): 0.5 → 0.5 + 0.5*0.1 = 0.55 → floor(20*0.55)=11
    // Second call (mat-recovery 30% gate): 0 → 0 < 0.30 → recover 1 SLIME_GEL
    const { recoveredItems } = processDismantle(crafted, seqRng([0.5, 0]));
    expect(recoveredItems.WOOD).toBe(11);
    expect(recoveredItems.SLIME_GEL).toBe(1);
  });

  it('crafted item skips monster material when rng >= 0.30', () => {
    const crafted: EquipmentItem = {
      id: 'e1', templateId: 'WOODEN_AXE', durability: 50,
      slots: [{ category: 'TANKY', statKey: 'HP', value: 100 }],
    };
    const { recoveredItems } = processDismantle(crafted, seqRng([0.5, 0.99]));
    expect(recoveredItems.SLIME_GEL).toBeUndefined();
  });
});

// ── validateCraftInput ─────────────────────────────────────────────────────

describe('validateCraftInput', () => {
  const inv = (items: Partial<Record<string, number>>): InventoryState => ({ items });

  it('ok when inventory has all required materials', () => {
    const result = validateCraftInput(
      { kind: 'CRAFT', baseMaterial: 'WOOD', templateId: 'WOODEN_AXE', monsterMaterial: 'SLIME_GEL' },
      inv({ WOOD: 50, SLIME_GEL: 1 }),
    );
    expect(result).toEqual({ ok: true });
  });

  it('fails MISSING_MAT when craftMaterial insufficient', () => {
    const result = validateCraftInput(
      { kind: 'CRAFT', baseMaterial: 'WOOD', templateId: 'WOODEN_AXE' },
      inv({ WOOD: 5 }),
    );
    expect(result).toEqual({ ok: false, reason: 'MISSING_MAT' });
  });

  it('fails MISSING_MAT when monsterMaterial missing', () => {
    const result = validateCraftInput(
      { kind: 'CRAFT', baseMaterial: 'WOOD', templateId: 'WOODEN_AXE', monsterMaterial: 'SLIME_GEL' },
      inv({ WOOD: 50 }),
    );
    expect(result).toEqual({ ok: false, reason: 'MISSING_MAT' });
  });
});
