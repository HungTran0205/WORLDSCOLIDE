/**
 * Civilization configuration — single source of truth for all civ data.
 * Exports Civilization type, CIV_CONFIG record, and helper utilities.
 */

import type { Stats, StatKey } from '@/game/state/game-state';

export type Civilization = 'LinhSon' | 'DeQuoc' | 'ThienLu';

/** Civ-specific archetype identifiers matching sprite folder names */
export type CivArchetype =
  | 'warrior' | 'scout'         // LinhSon
  | 'engineer' | 'scholar'      // DeQuoc
  | 'dualblade' | 'philosopher'; // ThienLu

export type Gender = 'M' | 'F';
export const CIVILIZATIONS: readonly Civilization[] = ['LinhSon', 'DeQuoc', 'ThienLu'];

export interface CivStatBonus {
  stat: StatKey;
  multiplier: number; // 1.2 = 20% boost (++), 1.1 = 10% boost (+)
}

export interface CivPassiveDefinition {
  id: string;
  name: string;
  description: string;
}

export interface CivConfig {
  id: Civilization;
  displayName: string;   // Vietnamese with diacritics
  shortName: string;     // 2-char badge abbreviation
  description: string;   // 1-2 sentence flavor text
  role: string;          // gameplay role summary
  archetypes: CivArchetype[];  // civ-specific archetypes (2 per civ)
  statBonuses: CivStatBonus[];
  passive: CivPassiveDefinition;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
  namePool: string[];
}

export const CIV_CONFIG: Record<Civilization, CivConfig> = {
  LinhSon: {
    id: 'LinhSon',
    displayName: 'Linh Sơn',
    shortName: 'LS',
    description: 'Chiến binh cổ đại bám rễ vào núi rừng, bền bỉ như đá, trung thành với tổ tiên.',
    role: 'Tank / Defender',
    archetypes: ['warrior', 'scout'],
    statBonuses: [
      { stat: 'END', multiplier: 1.2 },
      { stat: 'DEX', multiplier: 1.1 },
      { stat: 'STR', multiplier: 1.1 },
    ],
    passive: {
      id: 'son-the',
      name: 'Sơn Thể',
      description: 'HP < 30%: END +30%, knockback resist',
    },
    colors: {
      primary: '#f5f0e6',
      secondary: '#8B6914',
      accent: '#D4A017',
      text: '#2E4053',
    },
    namePool: [
      'Minh', 'Lan', 'Đức', 'Hoa', 'Tuấn', 'Mai', 'An', 'Bảo', 'Chi', 'Đào',
      'Giang', 'Hà', 'Khánh', 'Linh', 'Nam', 'Phúc', 'Quang', 'Sơn', 'Thảo', 'Vân',
    ],
  },
  DeQuoc: {
    id: 'DeQuoc',
    displayName: 'Đế Quốc',
    shortName: 'ĐQ',
    description: 'Nền văn minh hiện đại tái sinh thành đế chế điện-hơi nước-kính thép.',
    role: 'Tactician / Support-DPS',
    archetypes: ['engineer', 'scholar'],
    statBonuses: [
      { stat: 'CHA', multiplier: 1.2 },
      { stat: 'INT', multiplier: 1.1 },
      { stat: 'AGI', multiplier: 1.1 },
    ],
    passive: {
      id: 'dien-the-chi-huy',
      name: 'Điện Thế Chỉ Huy',
      description: '3 stacks → Shock debuff + team 5% crit/dmg 5s',
    },
    colors: {
      primary: '#1a1a2e',
      secondary: '#6c757d',
      accent: '#00d4ff',
      text: '#f8f5f0',
    },
    namePool: [
      'Erik', 'Freya', 'Bjorn', 'Sigrid', 'Marcus', 'Elena', 'Victor', 'Clara', 'Leon', 'Nina',
      'Hugo', 'Rosa', 'Felix', 'Iris', 'Oscar', 'Vera', 'Max', 'Lena', 'Kai', 'Ada',
    ],
  },
  ThienLu: {
    id: 'ThienLu',
    displayName: 'Thiên Lữ',
    shortName: 'TL',
    description: 'Du mục thần bí sống theo sao trời, mang theo cả bầu trời trong bước chân.',
    role: 'Speed DPS / Crit Striker',
    archetypes: ['dualblade', 'philosopher'],
    statBonuses: [
      { stat: 'AGI', multiplier: 1.2 },
      { stat: 'INT', multiplier: 1.1 },
      { stat: 'DEX', multiplier: 1.1 },
    ],
    passive: {
      id: 'tinh-lo',
      name: 'Tinh Lộ',
      description: '5 hits → +15% crit 5s, 15 hits → clone 5s',
    },
    colors: {
      primary: '#191970',
      secondary: '#4a3f5c',
      accent: '#7fffd4',
      text: '#c0c0c0',
    },
    namePool: [
      'Amara', 'Kofi', 'Zuri', 'Jabari', 'Seren', 'Altair', 'Lyra', 'Orion', 'Vega', 'Luna',
      'Astra', 'Cael', 'Nyx', 'Sol', 'Mira', 'Eris', 'Rigel', 'Nova', 'Sable', 'Eos',
    ],
  },
};

/** Apply civilization stat bonuses to a stats object (one-time at creation) */
export function applyCivBonuses(stats: Stats, civ: Civilization): Stats {
  const config = CIV_CONFIG[civ];
  const result = { ...stats };
  for (const bonus of config.statBonuses) {
    result[bonus.stat] = Math.floor(result[bonus.stat] * bonus.multiplier);
  }
  return result;
}

/** Safe color lookup with fallback */
export function getCivColor(civilization: string): string {
  const config = CIV_CONFIG[civilization as Civilization];
  return config?.colors.secondary ?? '#666';
}

/** Safe display name lookup with fallback */
export function getCivDisplayName(civilization: string): string {
  const config = CIV_CONFIG[civilization as Civilization];
  return config?.displayName ?? civilization;
}
