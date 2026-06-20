/**
 * Convention-based icon path resolver.
 * Maps game entity (category, id) → file path under /sprites/icons/.
 * Zero data-file changes required — all mapping lives here.
 */

import { assetUrl } from '@/lib/asset-url';

export type IconCategory =
  | 'stat' | 'skill' | 'item'
  | 'room' | 'furniture'
  | 'badge' | 'rank'
  | 'emblem' | 'status';

/** Explicit overrides where entity ID doesn't match kebab-case filename */
const ID_TO_FILENAME: Record<string, string> = {
  // Equipment weapons
  WOODEN_AXE: 'wooden-axe', WOODEN_SWORD: 'wooden-sword', WOODEN_CROSSBOW: 'wooden-crossbow',
  STONE_AXE: 'stone-axe', STONE_SWORD: 'stone-sword', STONE_CROSSBOW: 'stone-crossbow',
  IRON_AXE: 'iron-axe', IRON_SWORD: 'iron-sword', IRON_CROSSBOW: 'iron-crossbow',
  // Equipment armor
  BOAR_FUR_COAT: 'boar-fur-coat', BEAR_COAT: 'bear-coat', IRON_ARMOR: 'iron-armor',
  // ItemID UPPER_SNAKE → kebab
  WOOD: 'wood', STONE: 'stone', IRON_ORE: 'iron-ore', GEM: 'gem',
  SLIME_GEL: 'slime-gel', BOAR_PELT: 'boar-pelt', BEAR_PELT: 'bear-pelt',
  WOLF_FANG: 'wolf-fang', GOBLIN_EAR: 'goblin-ear', ORC_TUSK: 'orc-tusk',
  BAT_WING: 'bat-wing', SPIDER_LEGS: 'spider-legs', METAL_PLATE: 'metal-plate',
  DRONE_SENSOR: 'drone-sensor', SLIME_KING_CORE: 'slime-king-core',
  LOGGING_SITE_ACCESS: 'logging-site-access',
  HEALING_SYRINGE: 'healing-syringe', HEALING_SYRINGE_2: 'healing-syringe-2', HEALING_SYRINGE_3: 'healing-syringe-3',
  // Civilization PascalCase → kebab
  LinhSon: 'linh-son', DeQuoc: 'de-quoc', ThienLu: 'thien-lu',
  // GuildRank UPPER → lowercase
  RECRUIT: 'recruit', MEMBER: 'member', VETERAN: 'veteran',
  OFFICER: 'officer', COMMANDER: 'commander', MERCENARY: 'mercenary',
  // RoomType edge case: training-room → training (filename omits "-room")
  'training-room': 'training',
  // FacilityType edge case: training-yard → training (shares the training icon)
  'training-yard': 'training',
};

/** File prefix per category */
const PREFIX: Record<IconCategory, string> = {
  stat: 'icon', skill: 'icon', item: 'icon',
  room: 'icon-room', furniture: 'icon-furn',
  badge: 'badge', rank: 'badge',
  emblem: 'emblem', status: 'status',
};

export function getIconPath(category: IconCategory, id: string): string {
  const override = ID_TO_FILENAME[id];
  // badge tier IDs (F, E, D...) keep original case; everything else lowercases
  const filename = override ?? (category === 'badge' ? id : id.toLowerCase());
  return assetUrl(`/sprites/icons/${PREFIX[category]}-${filename}.png`);
}
