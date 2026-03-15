import type { Member } from '@/game/state/game-state';
import type { EnemyTemplate } from '@/game/data/enemies';
import type { CombatEntity, CombatTick, CombatEvent, CombatResult, CombatOutcome } from './combat-types';
import { calcMaxHp, calcAttackInterval, calcAutoAttackDamage, calcSkillDamage, rollCrit, CRIT_MULTIPLIER } from './combat-formulas';
import { applyEffectTick } from './combat-effects';

const TICK_MS = 500;
const MAX_TICKS = 10000;

function memberToEntity(member: Member): CombatEntity {
  return {
    id: member.id,
    name: member.name,
    isAlly: true,
    maxHp: calcMaxHp(member.stats.END, member.level),
    currentHp: calcMaxHp(member.stats.END, member.level),
    stats: { ...member.stats },
    skill: member.skill ? { ...member.skill } : null,
    level: member.level,
    attackIntervalMs: calcAttackInterval(member.stats.AGI),
    nextAttackAt: calcAttackInterval(member.stats.AGI),
    skillCooldownUntil: 0,
    statusEffects: [],
    abilities: [],
  };
}

function enemyToEntity(template: EnemyTemplate, index: number): CombatEntity {
  return {
    id: `enemy-${template.id}-${index}`,
    name: template.name,
    isAlly: false,
    maxHp: calcMaxHp(template.stats.END, template.level),
    currentHp: calcMaxHp(template.stats.END, template.level),
    stats: { ...template.stats },
    skill: template.skill ? { ...template.skill } : null,
    level: template.level,
    attackIntervalMs: calcAttackInterval(template.stats.AGI),
    nextAttackAt: calcAttackInterval(template.stats.AGI),
    skillCooldownUntil: 0,
    statusEffects: [],
    abilities: [...template.abilities],
  };
}

function pickTarget(entities: CombatEntity[], opposingTeam: boolean): CombatEntity | null {
  const alive = entities.filter((e) => e.currentHp > 0 && e.isAlly === opposingTeam);
  if (alive.length === 0) return null;
  // Focus fire: target lowest HP enemy for faster kills
  return alive.reduce((lowest, e) => (e.currentHp < lowest.currentHp ? e : lowest));
}

/** Run full combat simulation — pure function, returns CombatResult */
export function simulateCombat(
  partyMembers: Member[],
  enemyTemplates: EnemyTemplate[],
): CombatResult {
  const entities: CombatEntity[] = [
    ...partyMembers.map(memberToEntity),
    ...enemyTemplates.map((t, i) => enemyToEntity(t, i)),
  ];

  const ticks: CombatTick[] = [];
  let totalDamageDealt = 0;
  let time = 0;

  for (let tickCount = 0; tickCount < MAX_TICKS; tickCount++) {
    time += TICK_MS;
    const events: CombatEvent[] = [];

    // Process each entity
    for (const entity of entities) {
      if (entity.currentHp <= 0) continue;

      // Apply status effects
      const effectResult = applyEffectTick(entity);
      if (effectResult.damage > 0) {
        entity.currentHp -= effectResult.damage;
        events.push({ type: 'effect-tick', targetId: entity.id, effect: 'poison', damage: effectResult.damage });
        if (entity.currentHp <= 0) {
          events.push({ type: 'death', entityId: entity.id });
          continue;
        }
      }
      if (effectResult.skipTurn) continue;

      // Auto-attack
      if (time >= entity.nextAttackAt) {
        const target = pickTarget(entities, !entity.isAlly);
        if (!target) continue;

        let damage = calcAutoAttackDamage(entity.stats.STR, target.stats.END);
        if (rollCrit(entity.stats.LCK)) {
          damage = Math.floor(damage * CRIT_MULTIPLIER);
        }

        target.currentHp -= damage;
        totalDamageDealt += entity.isAlly ? damage : 0;
        events.push({ type: 'auto-attack', attackerId: entity.id, targetId: target.id, damage });

        entity.nextAttackAt = time + entity.attackIntervalMs;

        // Enemy poison ability
        for (const ability of entity.abilities) {
          if (ability.type === 'poison-attack' && Math.random() < ability.chance) {
            const poisonTarget = pickTarget(entities, !entity.isAlly);
            if (poisonTarget && !poisonTarget.statusEffects.some((e) => e.type === 'poisoned')) {
              poisonTarget.statusEffects.push({ type: 'poisoned', ticksRemaining: 6 });
              events.push({ type: 'effect-applied', targetId: poisonTarget.id, effect: 'poisoned' });
            }
          }
        }

        // Check target death
        if (target.currentHp <= 0) {
          events.push({ type: 'death', entityId: target.id });
        }
      }

      // Skill usage (auto if level >= 5 and autoEnabled)
      if (
        entity.skill &&
        entity.level >= 5 &&
        entity.skill.autoEnabled &&
        time >= entity.skillCooldownUntil
      ) {
        const target = pickTarget(entities, !entity.isAlly);
        if (target) {
          const baseDmg = calcAutoAttackDamage(entity.stats.STR, target.stats.END);
          const skillDmg = calcSkillDamage(baseDmg, entity.skill.damageMultiplier, entity.stats.DEX);
          target.currentHp -= skillDmg;
          totalDamageDealt += entity.isAlly ? skillDmg : 0;
          events.push({
            type: 'skill-use',
            attackerId: entity.id,
            targetId: target.id,
            damage: skillDmg,
            skillName: entity.skill.name,
          });
          entity.skillCooldownUntil = time + entity.skill.cooldownMs;
          if (target.currentHp <= 0) {
            events.push({ type: 'death', entityId: target.id });
          }
        }
      }
    }

    if (events.length > 0) {
      ticks.push({ time, events });
    }

    // Check win/lose
    const alliesAlive = entities.filter((e) => e.isAlly && e.currentHp > 0);
    const enemiesAlive = entities.filter((e) => !e.isAlly && e.currentHp > 0);

    if (enemiesAlive.length === 0) {
      const allAllies = entities.filter((e) => e.isAlly);
      const survivors = alliesAlive.map((e) => e.id);
      const injured = allAllies.filter((e) => e.currentHp <= 0).map((e) => e.id);
      const outcome: CombatOutcome = injured.length === 0 ? 'victory' : 'partial-victory';
      ticks.push({ time, events: [{ type: 'victory' }] });

      return { outcome, ticks, survivors, injured, totalDamageDealt, durationMs: time };
    }

    if (alliesAlive.length === 0) {
      ticks.push({ time, events: [{ type: 'wipe' }] });
      return {
        outcome: 'full-wipe',
        ticks,
        survivors: [],
        injured: entities.filter((e) => e.isAlly).map((e) => e.id),
        totalDamageDealt,
        durationMs: time,
      };
    }
  }

  // Timeout = wipe
  return {
    outcome: 'full-wipe',
    ticks,
    survivors: [],
    injured: entities.filter((e) => e.isAlly).map((e) => e.id),
    totalDamageDealt,
    durationMs: time,
  };
}
