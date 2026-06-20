import type { Skill } from '@/game/state/game-state';
import {
  TEMPLAR_SKILL_POOL, FORESTER_SKILL_POOL, RANGER_SKILL_POOL,
} from './linh-son-skills';

// --- Scholar skills ---
// Hoả Cầu (Fireball) is naturally an AOE — wires Phase 08 telegraph through the
// scholar archetype which all civs eventually have access to.
export const SKILL_HOA_CAU: Skill = {
  id: 'hoa-cau', name: 'Hoả Cầu',
  damageMultiplier: 1.4, cooldownMs: 10000, autoEnabled: false,
  aoeRadius: 2.2, aoeShape: 'circle',
};
export const SKILL_SUNG_SAC: Skill = {
  id: 'sung-sac', name: 'Sùng Sắc',
  damageMultiplier: 0.8, cooldownMs: 6000, autoEnabled: false,
};

// Placeholder skills for non-LinhSon civ archetypes reusing scout-kit
// until their dedicated kits are designed.
const SKILL_DAM_LUOT: Skill = {
  id: 'dam-luot', name: 'Đâm Lướt',
  damageMultiplier: 1.3, cooldownMs: 9000, autoEnabled: false,
};
const SKILL_BAN_TEN_NHANH: Skill = {
  id: 'ban-ten-nhanh', name: 'Bắn Tên Nhanh',
  damageMultiplier: 1.1, cooldownMs: 5000, autoEnabled: false,
};

/** Skills grouped by archetype */
export const SKILLS_BY_ARCHETYPE: Record<string, Skill[]> = {
  sword:       TEMPLAR_SKILL_POOL,   // Linh Sơn Templar
  warrior:     FORESTER_SKILL_POOL,  // Linh Sơn Forester
  scout:       RANGER_SKILL_POOL,    // Linh Sơn Ranger
  scholar:     [SKILL_HOA_CAU, SKILL_SUNG_SAC],
  engineer:    [SKILL_HOA_CAU, SKILL_SUNG_SAC],        // DeQuoc — maps to scholar
  dualblade:   [SKILL_DAM_LUOT, SKILL_BAN_TEN_NHANH],  // ThienLu — swift melee
  philosopher: [SKILL_HOA_CAU, SKILL_SUNG_SAC],         // ThienLu — mystic
};

/** Get first skill for an archetype (default carried skill for a new member) */
export function getDefaultSkill(archetypeName: string): Skill {
  const skills = SKILLS_BY_ARCHETYPE[archetypeName];
  return skills?.[0] ? { ...skills[0] } : { ...SKILL_HOA_CAU };
}

/** Full selectable skill pool for an archetype (Training Yard skill picker).
 *  archetype may be undefined on old saves — falls back to the default pool. */
export function getArchetypeSkillPool(archetypeName: string | undefined): Skill[] {
  return (SKILLS_BY_ARCHETYPE[archetypeName ?? ''] ?? [SKILL_HOA_CAU, SKILL_SUNG_SAC]).map((s) => ({ ...s }));
}

/** Resolve a single pool skill by id for an archetype, or null if it isn't in the pool.
 *  archetype may be undefined on old saves — treated as an empty pool (→ null). */
export function getSkillFromPool(archetypeName: string | undefined, skillId: string): Skill | null {
  const found = (SKILLS_BY_ARCHETYPE[archetypeName ?? ''] ?? []).find((s) => s.id === skillId);
  return found ? { ...found } : null;
}
