import type { Skill } from '@/game/state/game-state';

// ── Templar (sword) ─────────────────────────────────────────────────────────

export const SKILL_PIERCE: Skill = {
  id: 'pierce', name: 'Pierce',
  damageMultiplier: 1.30, cooldownMs: 9000, autoEnabled: true,
  skillType: 'lane-hit',
  laneHit: true,
};

export const SKILL_CLEAVE: Skill = {
  id: 'cleave', name: 'Cleave',
  damageMultiplier: 1.50, cooldownMs: 12000, autoEnabled: true,
  skillType: 'damage',
  critRateBonus: 0.10,
};

export const SKILL_RIPOSTE: Skill = {
  id: 'riposte', name: 'Riposte',
  damageMultiplier: 1.0, cooldownMs: 16000, autoEnabled: true,
  skillType: 'riposte',
  statusDurationMs: 3000,
};

export const SKILL_RALLY: Skill = {
  id: 'rally', name: 'Rally',
  damageMultiplier: 0, cooldownMs: 12000, autoEnabled: true,
  skillType: 'buff',
  buffScope: 'self',
  buffEffect: 'damage-up',
  buffDurationMs: 4000,
};

// ── Forester (warrior/axe) ───────────────────────────────────────────────────

export const SKILL_SUNDER: Skill = {
  id: 'sunder', name: 'Sunder',
  damageMultiplier: 1.40, cooldownMs: 10000, autoEnabled: true,
  skillType: 'armor-pierce',
  armorPierceChance: 0.50,
};

export const SKILL_QUAKE: Skill = {
  id: 'quake', name: 'Quake',
  damageMultiplier: 0.25, cooldownMs: 15000, autoEnabled: true,
  skillType: 'aoe-ground',
};

export const SKILL_BULWARK: Skill = {
  id: 'bulwark', name: 'Bulwark',
  damageMultiplier: 0, cooldownMs: 20000, autoEnabled: true,
  skillType: 'buff',
  buffScope: 'self',
  buffEffect: 'defense-up',
  buffDurationMs: 5000,
  statusEffect: 'taunted',
  statusDurationMs: 5000,
};

export const SKILL_AEGIS: Skill = {
  id: 'aegis', name: 'Aegis',
  damageMultiplier: 0, cooldownMs: 13000, autoEnabled: true,
  skillType: 'buff',
  buffScope: 'team',
  buffEffect: 'defense-up',
  buffDurationMs: 5000,
};

// ── Ranger (crossbow/scout) ──────────────────────────────────────────────────

export const SKILL_SNIPE: Skill = {
  id: 'snipe', name: 'Snipe',
  damageMultiplier: 1.50, cooldownMs: 9000, autoEnabled: true,
  skillType: 'damage',
  accuracyBonus: 0.50,
};

export const SKILL_BARRAGE: Skill = {
  id: 'barrage', name: 'Barrage',
  damageMultiplier: 0.50, cooldownMs: 16000, autoEnabled: true,
  skillType: 'multi-hit',
  multiHitCount: 5,
  multiHitMultiplier: 0.50,
};

export const SKILL_PIN: Skill = {
  id: 'pin', name: 'Pin',
  damageMultiplier: 1.0, cooldownMs: 12000, autoEnabled: true,
  skillType: 'debuff',
  statusEffect: 'slowed',
  statusDurationMs: 5000,
};

export const SKILL_MARK: Skill = {
  id: 'mark', name: 'Mark',
  damageMultiplier: 0, cooldownMs: 12000, autoEnabled: true,
  skillType: 'buff',
  buffScope: 'team',
  buffEffect: 'crit-up',
  buffDurationMs: 5000,
};

// ── Pools ─────────────────────────────────────────────────────────────────────

export const TEMPLAR_SKILL_POOL: Skill[] = [SKILL_PIERCE, SKILL_CLEAVE, SKILL_RIPOSTE, SKILL_RALLY];
export const FORESTER_SKILL_POOL: Skill[] = [SKILL_SUNDER, SKILL_QUAKE, SKILL_BULWARK, SKILL_AEGIS];
export const RANGER_SKILL_POOL: Skill[]   = [SKILL_SNIPE, SKILL_BARRAGE, SKILL_PIN, SKILL_MARK];
