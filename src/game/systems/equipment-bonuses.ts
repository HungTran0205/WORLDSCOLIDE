/** Pure helpers for gear stat bonuses, item creation, and starting weapon assignment. */

import type { MemberEquipment, EquipmentItem } from '@/game/state/game-state';
import type { CivArchetype } from '@/game/data/civilization-config';
import { getEquipmentTemplate } from '@/game/data/equipment-templates';
import type { EquipmentTemplateId } from '@/game/data/equipment-templates';

export interface GearBonuses {
  flatDamage: number;
  flatHp: number;
  flatDefense: number;
}

/** Compute additive flat gear bonuses from equipped items. Broken gear (durability=0) gives no bonus. */
export function calcGearBonuses(equipment?: MemberEquipment | null): GearBonuses {
  const bonus: GearBonuses = { flatDamage: 0, flatHp: 0, flatDefense: 0 };
  if (!equipment) return bonus;

  const { weapon, armor, headgear } = equipment;

  if (weapon && weapon.durability > 0) {
    const tpl = getEquipmentTemplate(weapon.templateId);
    bonus.flatDamage += tpl.damage ?? 0;
  }
  if (armor && armor.durability > 0) {
    const tpl = getEquipmentTemplate(armor.templateId);
    bonus.flatHp      += tpl.hp      ?? 0;
    bonus.flatDefense += tpl.defense ?? 0;
  }
  if (headgear && headgear.durability > 0) {
    const tpl = getEquipmentTemplate(headgear.templateId);
    bonus.flatHp      += tpl.hp      ?? 0;
    bonus.flatDefense += tpl.defense ?? 0;
  }
  return bonus;
}

/** Create a fresh equipment item instance with full durability and empty affix slots. */
export function createEquipmentItem(templateId: EquipmentTemplateId): EquipmentItem {
  const tpl = getEquipmentTemplate(templateId);
  return {
    id: crypto.randomUUID(),
    templateId,
    durability: tpl.maxDurability,
    slots: [],
    maxSlots: 4,
  };
}

/** LinhSon archetypes that receive a starting weapon at character creation. */
const STARTING_WEAPONS: Partial<Record<CivArchetype, EquipmentTemplateId>> = {
  warrior: 'WOODEN_AXE',
  scout:   'WOODEN_CROSSBOW',
};

/** Returns a starting weapon for an archetype, or null if none assigned. */
export function getStartingWeapon(archetype?: string): EquipmentItem | null {
  const templateId = STARTING_WEAPONS[archetype as CivArchetype];
  return templateId ? createEquipmentItem(templateId) : null;
}
