import type { CombatEntity } from './combat-types';

/** Apply status effect ticks to an entity. Mutates statusEffects array. */
export function applyEffectTick(entity: CombatEntity): { damage: number; skipTurn: boolean } {
  let damage = 0;
  let skipTurn = false;

  for (const effect of entity.statusEffects) {
    if (effect.type === 'poisoned') {
      damage += Math.floor(entity.maxHp * 0.05);
    }
    if (effect.type === 'stunned') {
      skipTurn = true;
    }
    effect.ticksRemaining--;
  }

  entity.statusEffects = entity.statusEffects.filter((e) => e.ticksRemaining > 0);
  return { damage, skipTurn };
}
