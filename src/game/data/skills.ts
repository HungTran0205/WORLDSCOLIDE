import type { Skill } from '@/game/state/game-state';

// --- Warrior skills ---
export const SKILL_DANH_MANH: Skill = {
  id: 'danh-manh', name: 'Đánh Mạnh',
  damageMultiplier: 1.25, cooldownMs: 8000, autoEnabled: false,
};
export const SKILL_KIEM_GIA: Skill = {
  id: 'kiem-gia', name: 'Kiếm Giá',
  damageMultiplier: 1.5, cooldownMs: 12000, autoEnabled: false,
};
export const SKILL_CHEM_MANH: Skill = {
  id: 'chem-manh', name: 'Chém Mạnh',
  damageMultiplier: 1.6, cooldownMs: 15000, autoEnabled: false,
};

// --- Scout skills ---
export const SKILL_BAN_TEN_NHANH: Skill = {
  id: 'ban-ten-nhanh', name: 'Bắn Tên Nhanh',
  damageMultiplier: 1.1, cooldownMs: 5000, autoEnabled: false,
};
export const SKILL_DAM_LUOT: Skill = {
  id: 'dam-luot', name: 'Đâm Lướt',
  damageMultiplier: 1.3, cooldownMs: 9000, autoEnabled: false,
};

// --- Scholar skills ---
export const SKILL_HOA_CAU: Skill = {
  id: 'hoa-cau', name: 'Hoả Cầu',
  damageMultiplier: 1.4, cooldownMs: 10000, autoEnabled: false,
};
export const SKILL_SUNG_SAC: Skill = {
  id: 'sung-sac', name: 'Sùng Sắc',
  damageMultiplier: 0.8, cooldownMs: 6000, autoEnabled: false,
};

/** Skills grouped by archetype (includes civ-specific archetypes mapped to closest base) */
export const SKILLS_BY_ARCHETYPE: Record<string, Skill[]> = {
  warrior: [SKILL_DANH_MANH, SKILL_KIEM_GIA, SKILL_CHEM_MANH],
  scout: [SKILL_BAN_TEN_NHANH, SKILL_DAM_LUOT],
  scholar: [SKILL_HOA_CAU, SKILL_SUNG_SAC],
  // Civ-specific archetypes reuse closest base skills until dedicated skills are added
  engineer: [SKILL_HOA_CAU, SKILL_SUNG_SAC],       // DeQuoc — tech-based, maps to scholar
  dualblade: [SKILL_DAM_LUOT, SKILL_BAN_TEN_NHANH], // ThienLu — swift melee, maps to scout
  philosopher: [SKILL_HOA_CAU, SKILL_SUNG_SAC],      // ThienLu — mystic, maps to scholar
};

/** Get first skill for an archetype (M2 simplicity — one skill per member) */
export function getDefaultSkill(archetypeName: string): Skill {
  const skills = SKILLS_BY_ARCHETYPE[archetypeName];
  return skills?.[0] ? { ...skills[0] } : { ...SKILL_DANH_MANH };
}
