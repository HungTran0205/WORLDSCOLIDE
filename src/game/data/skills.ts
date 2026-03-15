import type { Skill } from '@/game/state/game-state';

export const SKILL_DANH_MANH: Skill = {
  id: 'danh-manh',
  name: 'Đánh Mạnh',
  damageMultiplier: 1.25,
  cooldownMs: 8000,
  autoEnabled: false,
};
