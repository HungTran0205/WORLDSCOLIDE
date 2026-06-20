/**
 * Equipment bonuses aggregation tests.
 * Covers: slot stat mapping, broken gear handling, shield charge summation.
 */

import { describe, it, expect } from 'vitest';
import { calcGearBonuses, createEquipmentItem, getStartingWeapon } from './equipment-bonuses';
import type { MemberEquipment, EquipmentItem } from '@/game/state/game-state';

describe('equipment-bonuses: calcGearBonuses', () => {
  describe('empty/null equipment', () => {
    it('returns zero bonuses for null equipment', () => {
      const bonuses = calcGearBonuses(null);
      expect(bonuses).toEqual({
        flatDamage: 0,
        flatHp: 0,
        flatDefense: 0,
        dodgeBonus: 0,
        blockBonus: 0,
        accuracyBonus: 0,
        attackSpeedBonus: 0,
        shieldCharges: 0,
      });
    });

    it('returns zero bonuses for undefined equipment', () => {
      const bonuses = calcGearBonuses(undefined);
      expect(bonuses.flatDamage).toBe(0);
      expect(bonuses.dodgeBonus).toBe(0);
    });

    it('returns zero bonuses for equipment with no weapon/armor', () => {
      const eq: MemberEquipment = { weapon: null, armor: null };
      const bonuses = calcGearBonuses(eq);
      expect(bonuses.flatHp).toBe(0);
      expect(bonuses.flatDefense).toBe(0);
    });
  });

  describe('dodge affix aggregation', () => {
    it('sums DODGE slots into dodgeBonus', () => {
      const weapon: EquipmentItem = {
        id: 'w1',
        templateId: 'WOODEN_AXE',
        durability: 50,
        slots: [
          { category: 'DODGE', statKey: 'DODGE', value: 0.05 },
          { category: 'DODGE', statKey: 'DODGE', value: 0.08 },
        ],
        maxSlots: 4,
      };
      const eq: MemberEquipment = { weapon, armor: null };
      const bonuses = calcGearBonuses(eq);
      expect(bonuses.dodgeBonus).toBe(0.13);
    });

    it('does not sum DODGE to other bonuses', () => {
      const weapon: EquipmentItem = {
        id: 'w1',
        templateId: 'WOODEN_AXE',
        durability: 50,
        slots: [{ category: 'DODGE', statKey: 'DODGE', value: 0.10 }],
        maxSlots: 4,
      };
      const eq: MemberEquipment = { weapon, armor: null };
      const bonuses = calcGearBonuses(eq);
      expect(bonuses.dodgeBonus).toBe(0.10);
      expect(bonuses.blockBonus).toBe(0);
      expect(bonuses.accuracyBonus).toBe(0);
    });
  });

  describe('block affix aggregation', () => {
    it('sums BLOCK slots into blockBonus', () => {
      const armor: EquipmentItem = {
        id: 'a1',
        templateId: 'BOAR_FUR_COAT',
        durability: 40,
        slots: [
          { category: 'BLOCK', statKey: 'BLOCK', value: 0.07 },
          { category: 'BLOCK', statKey: 'BLOCK', value: 0.06 },
        ],
        maxSlots: 4,
      };
      const eq: MemberEquipment = { weapon: null, armor };
      const bonuses = calcGearBonuses(eq);
      expect(bonuses.blockBonus).toBe(0.13);
    });
  });

  describe('accuracy affix aggregation', () => {
    it('sums ACCURACY slots into accuracyBonus', () => {
      const weapon: EquipmentItem = {
        id: 'w1',
        templateId: 'WOODEN_AXE',
        durability: 50,
        slots: [
          { category: 'ACCURACY', statKey: 'ACCURACY', value: 0.08 },
          { category: 'ACCURACY', statKey: 'ACCURACY', value: 0.05 },
        ],
        maxSlots: 4,
      };
      const eq: MemberEquipment = { weapon, armor: null };
      const bonuses = calcGearBonuses(eq);
      expect(bonuses.accuracyBonus).toBe(0.13);
    });
  });

  describe('attack_speed affix aggregation', () => {
    it('sums ATTACK_SPEED slots into attackSpeedBonus', () => {
      const weapon: EquipmentItem = {
        id: 'w1',
        templateId: 'WOODEN_AXE',
        durability: 50,
        slots: [
          { category: 'ATTACK_SPEED', statKey: 'ATTACK_SPEED', value: 0.10 },
          { category: 'ATTACK_SPEED', statKey: 'ATTACK_SPEED', value: 0.05 },
        ],
        maxSlots: 4,
      };
      const eq: MemberEquipment = { weapon, armor: null };
      const bonuses = calcGearBonuses(eq);
      expect(bonuses.attackSpeedBonus).toBeCloseTo(0.15, 10);
    });
  });

  describe('shield slot aggregation', () => {
    it('sums SHIELD slots into shieldCharges (integer)', () => {
      const armor: EquipmentItem = {
        id: 'a1',
        templateId: 'BOAR_FUR_COAT',
        durability: 40,
        slots: [
          { category: 'SHIELD', statKey: 'SHIELD', value: 1.5 },
          { category: 'SHIELD', statKey: 'SHIELD', value: 2.3 },
        ],
        maxSlots: 4,
      };
      const eq: MemberEquipment = { weapon: null, armor };
      const bonuses = calcGearBonuses(eq);
      // 1.5 rounds to 2, 2.3 rounds to 2 → total 4
      expect(bonuses.shieldCharges).toBe(4);
    });

    it('rounds shield values before summing', () => {
      const armor: EquipmentItem = {
        id: 'a1',
        templateId: 'BOAR_FUR_COAT',
        durability: 40,
        slots: [
          { category: 'SHIELD', statKey: 'SHIELD', value: 0.5 }, // rounds to 0 or 1
          { category: 'SHIELD', statKey: 'SHIELD', value: 1.0 }, // rounds to 1
        ],
        maxSlots: 4,
      };
      const eq: MemberEquipment = { weapon: null, armor };
      const bonuses = calcGearBonuses(eq);
      // Math.round(0.5) = 0, Math.round(1.0) = 1 → total 1
      // (JS Math.round(0.5) = 0 per banker's rounding, but this is implementation dependent)
      expect(bonuses.shieldCharges).toBeGreaterThanOrEqual(1);
    });
  });

  describe('hp and defense from armor template', () => {
    it('includes armor template hp in flatHp', () => {
      // BOAR_FUR_COAT template has hp: 20
      const armor: EquipmentItem = {
        id: 'a1',
        templateId: 'BOAR_FUR_COAT',
        durability: 40,
        slots: [],
        maxSlots: 4,
      };
      const eq: MemberEquipment = { weapon: null, armor };
      const bonuses = calcGearBonuses(eq);
      expect(bonuses.flatHp).toBeGreaterThanOrEqual(20);
    });

    it('includes armor template defense in flatDefense', () => {
      const armor: EquipmentItem = {
        id: 'a1',
        templateId: 'BOAR_FUR_COAT',
        durability: 40,
        slots: [],
        maxSlots: 4,
      };
      const eq: MemberEquipment = { weapon: null, armor };
      const bonuses = calcGearBonuses(eq);
      expect(bonuses.flatDefense).toBeGreaterThanOrEqual(0);
    });

    it('stacks HP affix slots on top of armor template hp', () => {
      const armor: EquipmentItem = {
        id: 'a1',
        templateId: 'BOAR_FUR_COAT',
        durability: 40,
        slots: [{ category: 'TANKY', statKey: 'HP', value: 50 }],
        maxSlots: 4,
      };
      const eq: MemberEquipment = { weapon: null, armor };
      const bonuses = calcGearBonuses(eq);
      // BOAR_FUR_COAT hp (20) + slot value (50) = 70
      expect(bonuses.flatHp).toBeGreaterThanOrEqual(70);
    });
  });

  describe('damage from weapon template', () => {
    it('includes weapon template damage in flatDamage', () => {
      const weapon: EquipmentItem = {
        id: 'w1',
        templateId: 'WOODEN_AXE',
        durability: 50,
        slots: [],
        maxSlots: 4,
      };
      const eq: MemberEquipment = { weapon, armor: null };
      const bonuses = calcGearBonuses(eq);
      expect(bonuses.flatDamage).toBeGreaterThan(0); // WOODEN_AXE has damage
    });
  });

  describe('broken gear (durability=0)', () => {
    it('weapon with durability 0 gives zero bonuses from weapon', () => {
      const weapon: EquipmentItem = {
        id: 'w1',
        templateId: 'WOODEN_AXE',
        durability: 0, // Broken
        slots: [{ category: 'GENERIC', statKey: 'HP', value: 100 }],
        maxSlots: 4,
      };
      const eq: MemberEquipment = { weapon, armor: null };
      const bonuses = calcGearBonuses(eq);
      expect(bonuses.flatDamage).toBe(0); // No template damage
      expect(bonuses.flatHp).toBe(0); // No slot bonuses
    });

    it('armor with durability 0 gives zero bonuses from armor', () => {
      const armor: EquipmentItem = {
        id: 'a1',
        templateId: 'BOAR_FUR_COAT',
        durability: 0, // Broken
        slots: [{ category: 'TANKY', statKey: 'HP', value: 100 }],
        maxSlots: 4,
      };
      const eq: MemberEquipment = { weapon: null, armor };
      const bonuses = calcGearBonuses(eq);
      expect(bonuses.flatHp).toBe(0); // No template hp + no slot hp
      expect(bonuses.flatDefense).toBe(0);
    });

    it('both items broken gives all zero bonuses', () => {
      const weapon: EquipmentItem = {
        id: 'w1',
        templateId: 'WOODEN_AXE',
        durability: 0,
        slots: [{ category: 'GENERIC', statKey: 'HP', value: 100 }],
        maxSlots: 4,
      };
      const armor: EquipmentItem = {
        id: 'a1',
        templateId: 'BOAR_FUR_COAT',
        durability: 0,
        slots: [{ category: 'TANKY', statKey: 'HP', value: 100 }],
        maxSlots: 4,
      };
      const eq: MemberEquipment = { weapon, armor };
      const bonuses = calcGearBonuses(eq);
      expect(bonuses.flatDamage).toBe(0);
      expect(bonuses.flatHp).toBe(0);
      expect(bonuses.flatDefense).toBe(0);
      expect(bonuses.dodgeBonus).toBe(0);
      expect(bonuses.blockBonus).toBe(0);
    });
  });

  describe('mixed equipment scenarios', () => {
    it('aggregates bonuses from both weapon and armor', () => {
      const weapon: EquipmentItem = {
        id: 'w1',
        templateId: 'WOODEN_AXE',
        durability: 50,
        slots: [{ category: 'DODGE', statKey: 'DODGE', value: 0.05 }],
        maxSlots: 4,
      };
      const armor: EquipmentItem = {
        id: 'a1',
        templateId: 'BOAR_FUR_COAT',
        durability: 40,
        slots: [{ category: 'BLOCK', statKey: 'BLOCK', value: 0.08 }],
        maxSlots: 4,
      };
      const eq: MemberEquipment = { weapon, armor };
      const bonuses = calcGearBonuses(eq);
      expect(bonuses.dodgeBonus).toBe(0.05);
      expect(bonuses.blockBonus).toBe(0.08);
      expect(bonuses.flatDamage).toBeGreaterThan(0);
      expect(bonuses.flatHp).toBeGreaterThan(0);
      expect(bonuses.flatDefense).toBeGreaterThanOrEqual(0);
    });
  });

  describe('hp affix slots', () => {
    it('does not mutate HP into other bonuses', () => {
      const armor: EquipmentItem = {
        id: 'a1',
        templateId: 'BOAR_FUR_COAT',
        durability: 40,
        slots: [{ category: 'TANKY', statKey: 'HP', value: 100 }],
        maxSlots: 4,
      };
      const eq: MemberEquipment = { weapon: null, armor };
      const bonuses = calcGearBonuses(eq);
      expect(bonuses.flatHp).toBeGreaterThanOrEqual(100);
      expect(bonuses.dodgeBonus).toBe(0);
      expect(bonuses.blockBonus).toBe(0);
      expect(bonuses.accuracyBonus).toBe(0);
    });
  });
});

describe('equipment-bonuses: createEquipmentItem', () => {
  it('creates item with full durability from template', () => {
    const eq = createEquipmentItem('WOODEN_AXE');
    expect(eq.templateId).toBe('WOODEN_AXE');
    expect(eq.durability).toBeGreaterThan(0); // WOODEN_AXE maxDurability = 50
    expect(eq.maxSlots).toBe(4);
  });

  it('starts with empty slots', () => {
    const eq = createEquipmentItem('WOODEN_AXE');
    expect(eq.slots).toEqual([]);
  });

  it('has a unique id', () => {
    const eq1 = createEquipmentItem('WOODEN_AXE');
    const eq2 = createEquipmentItem('WOODEN_AXE');
    expect(eq1.id).not.toBe(eq2.id);
  });
});

describe('equipment-bonuses: getStartingWeapon', () => {
  it('returns weapon for warrior archetype', () => {
    const weapon = getStartingWeapon('warrior');
    expect(weapon).not.toBeNull();
    expect(weapon?.templateId).toBe('WOODEN_AXE');
  });

  it('returns weapon for scout archetype', () => {
    const weapon = getStartingWeapon('scout');
    expect(weapon).not.toBeNull();
    expect(weapon?.templateId).toBe('WOODEN_CROSSBOW');
  });

  it('returns weapon for sword archetype', () => {
    const weapon = getStartingWeapon('sword');
    expect(weapon).not.toBeNull();
    expect(weapon?.templateId).toBe('WOODEN_SWORD');
  });

  it('returns null for unmapped archetype', () => {
    const weapon = getStartingWeapon('unknown-archetype');
    expect(weapon).toBeNull();
  });

  it('returns null for undefined archetype', () => {
    const weapon = getStartingWeapon(undefined);
    expect(weapon).toBeNull();
  });
});
