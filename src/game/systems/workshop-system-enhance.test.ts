/**
 * Workshop enhance tests — affix rolling, equip-type mismatch detection.
 * Covers: processEnhanceAdd with equip-type validation, RNG-driven affix rolling.
 */

import { describe, it, expect } from 'vitest';
import { processEnhanceAdd } from './workshop-system';
import type { EquipmentItem } from '@/game/state/game-state';


const fixedRng = (v: number) => () => v;

describe('workshop-system: processEnhanceAdd equip-type mismatch', () => {
  const baseWeapon: EquipmentItem = {
    id: 'w1',
    templateId: 'WOODEN_AXE',
    durability: 50,
    slots: [],
    maxSlots: 4,
  };

  it('rejects armor-only material (BAT_WING) applied to weapon', () => {
    // BAT_WING affinity: equipmentType: 'ARMOR' → cannot apply to weapon
    const result = processEnhanceAdd(baseWeapon, 'BAT_WING', fixedRng(0.5));
    expect(result).toEqual({ error: 'EQUIP_TYPE_MISMATCH' });
  });

  it('rejects armor-only material (SLIME_GEL) on weapon', () => {
    // SLIME_GEL is armor-only
    const result = processEnhanceAdd(baseWeapon, 'SLIME_GEL', fixedRng(0.5));
    expect(result).toEqual({ error: 'EQUIP_TYPE_MISMATCH' });
  });

  it('accepts weapon-compatible material (SPIDER_LEGS) on weapon', () => {
    const result = processEnhanceAdd(baseWeapon, 'SPIDER_LEGS', fixedRng(0.5));
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.equipment.slots).toHaveLength(1);
  });
});

describe('workshop-system: processEnhanceAdd RNG affix rolling', () => {
  const baseWeapon: EquipmentItem = {
    id: 'w1',
    templateId: 'WOODEN_AXE',
    durability: 50,
    slots: [],
    maxSlots: 4,
  };

  it('rolls labeled affix with correct statKey from material affinity', () => {
    // SPIDER_LEGS → ATTACK_SPEED affinity on weapon
    const result = processEnhanceAdd(baseWeapon, 'SPIDER_LEGS', fixedRng(0.5));
    expect('error' in result).toBe(false);
    if ('error' in result) return;

    const slot = result.equipment.slots?.[0];
    expect(slot?.statKey).toBe('ATTACK_SPEED');
    expect(slot?.category).toBe('ATTACK_SPEED'); // category = affinity name
  });

  it('rolls value from material range at RNG 0.0 (min)', () => {
    // SPIDER_LEGS range: [0.05, 0.12]
    const result = processEnhanceAdd(baseWeapon, 'SPIDER_LEGS', fixedRng(0.0));
    expect('error' in result).toBe(false);
    if ('error' in result) return;

    const slot = result.equipment.slots?.[0];
    expect(slot?.value).toBeCloseTo(0.05, 2);
  });

  it('rolls value from material range at RNG 1.0 (max)', () => {
    // SPIDER_LEGS range: [0.05, 0.12]
    const result = processEnhanceAdd(baseWeapon, 'SPIDER_LEGS', fixedRng(1.0));
    expect('error' in result).toBe(false);
    if ('error' in result) return;

    const slot = result.equipment.slots?.[0];
    expect(slot?.value).toBeCloseTo(0.12, 2);
  });

  it('rolls value from material range at RNG 0.5 (mid)', () => {
    // SPIDER_LEGS range: [0.05, 0.12]
    // mid = 0.05 + 0.5*(0.12-0.05) = 0.05 + 0.035 = 0.085
    const result = processEnhanceAdd(baseWeapon, 'SPIDER_LEGS', fixedRng(0.5));
    expect('error' in result).toBe(false);
    if ('error' in result) return;

    const slot = result.equipment.slots?.[0];
    expect(slot?.value).toBeCloseTo(0.085, 2);
  });
});

describe('workshop-system: processEnhanceAdd material tiers', () => {
  const t1Weapon: EquipmentItem = {
    id: 'w1',
    templateId: 'WOODEN_AXE', // Tier 1
    durability: 50,
    slots: [],
    maxSlots: 4,
  };

  it('tier 1 weapon accepts tier 1 material', () => {
    // SPIDER_LEGS is tier 1, weapon is tier 1 → OK
    const result = processEnhanceAdd(t1Weapon, 'SPIDER_LEGS', fixedRng(0.5));
    expect('error' in result).toBe(false);
  });
});

describe('workshop-system: processEnhanceAdd success cases', () => {
  const baseWeapon: EquipmentItem = {
    id: 'w1',
    templateId: 'WOODEN_AXE',
    durability: 50,
    slots: [],
    maxSlots: 4,
  };

  it('returns equipment with new slot added', () => {
    const result = processEnhanceAdd(baseWeapon, 'SPIDER_LEGS', fixedRng(0.5));
    expect('error' in result).toBe(false);
    if ('error' in result) return;

    expect(result.equipment.slots).toHaveLength(1);
    expect(result.equipment.slots?.[0]).toBeDefined();
  });

  it('preserves all other equipment properties', () => {
    const result = processEnhanceAdd(baseWeapon, 'SPIDER_LEGS', fixedRng(0.5));
    expect('error' in result).toBe(false);
    if ('error' in result) return;

    expect(result.equipment.id).toBe('w1');
    expect(result.equipment.templateId).toBe('WOODEN_AXE');
    expect(result.equipment.durability).toBe(50);
    expect(result.equipment.maxSlots).toBe(4);
  });

  it('does not mutate original equipment', () => {
    const original = { ...baseWeapon };
    processEnhanceAdd(baseWeapon, 'SPIDER_LEGS', fixedRng(0.5));

    expect(baseWeapon.slots).toEqual(original.slots);
  });

  it('adds multiple slots on sequential calls with same compatible material', () => {
    let eq = baseWeapon;
    const result1 = processEnhanceAdd(eq, 'SPIDER_LEGS', fixedRng(0.5));
    expect('error' in result1).toBe(false);
    if ('error' in result1) return;

    eq = result1.equipment;
    const result2 = processEnhanceAdd(eq, 'SPIDER_LEGS', fixedRng(0.5));
    expect('error' in result2).toBe(false);
    if ('error' in result2) return;

    expect(result2.equipment.slots).toHaveLength(2);
  });
});
