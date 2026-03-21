/**
 * Convention-based icon path resolver.
 * Maps game entity (category, id) → file path under /sprites/icons/.
 * Zero data-file changes required — all mapping lives here.
 */

export type IconCategory =
  | 'stat' | 'skill' | 'item'
  | 'room' | 'furniture'
  | 'badge' | 'rank'
  | 'emblem' | 'status';

/** Explicit overrides where entity ID doesn't match kebab-case filename */
const ID_TO_FILENAME: Record<string, string> = {
  // ItemID UPPER_SNAKE → kebab
  WOOD: 'wood', STONE: 'stone', IRON_ORE: 'iron-ore',
  SLIME_GEL: 'slime-gel', BOAR_PELT: 'boar-pelt',
  WOLF_FANG: 'wolf-fang', GOBLIN_EAR: 'goblin-ear', ORC_TUSK: 'orc-tusk',
  // Civilization PascalCase → kebab
  LinhSon: 'linh-son', DeQuoc: 'de-quoc', ThienLu: 'thien-lu',
  // GuildRank UPPER → lowercase
  RECRUIT: 'recruit', MEMBER: 'member', VETERAN: 'veteran',
  OFFICER: 'officer', COMMANDER: 'commander', MERCENARY: 'mercenary',
  // RoomType edge case: training-room → training (filename omits "-room")
  'training-room': 'training',
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
  return `/sprites/icons/${PREFIX[category]}-${filename}.png`;
}
