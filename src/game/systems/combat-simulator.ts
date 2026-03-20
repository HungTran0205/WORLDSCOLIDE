import type { Member } from '@/game/state/game-state';
import type { EnemyTemplate } from '@/game/data/enemies';
import type { CombatEntity, CombatTick, CombatEvent, CombatResult, CombatOutcome } from './combat-types';
import { calcMaxHp, calcAttackInterval, calcAutoAttackDamage, calcSkillDamage, rollCrit, CRIT_MULTIPLIER } from './combat-formulas';
import { applyEffectTick } from './combat-effects';
import { createPassiveState, applyPassiveOnInit, applyPassiveTick, onDamageDealt, rollPassiveDodge, snapshotBaseStats } from './combat-passives';

const TICK_MS = 500;
const MAX_TICKS = 10000;

function memberToEntity(member: Member): CombatEntity {
  const entity: CombatEntity = {
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
    civilization: member.civilization,
    baseStats: snapshotBaseStats(member.stats),
    passiveState: createPassiveState(member.civilization),
  };
  applyPassiveOnInit(entity);
  return entity;
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
  return alive.reduce((lowest, e) => (e.currentHp < lowest.currentHp ? e : lowest));
}

/** Run full combat simulation — pure function, returns CombatResult */
export function simulateCombat(partyMembers: Member[], enemyTemplates: EnemyTemplate[]): CombatResult {
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

    for (const entity of entities) {
      if (entity.currentHp <= 0) continue;

      // Refresh conditional passive buffs each tick
      if (entity.passiveState) applyPassiveTick(entity);

      // Apply status effects (poison, stun, boost)
      const effectResult = applyEffectTick(entity);
      if (effectResult.damage > 0) {
        entity.currentHp -= effectResult.damage;
        events.push({ type: 'effect-tick', targetId: entity.id, effect: 'poison', damage: effectResult.damage });
        if (entity.currentHp <= 0) { events.push({ type: 'death', entityId: entity.id }); continue; }
      }
      if (effectResult.skipTurn) continue;

      // Auto-attack
      if (time >= entity.nextAttackAt) {
        const target = pickTarget(entities, !entity.isAlly);
        if (!target) continue;

        // Dodge check (ThienLu passive)
        if (rollPassiveDodge(target.civilization)) {
          events.push({ type: 'dodge', attackerId: entity.id, targetId: target.id });
          entity.nextAttackAt = time + entity.attackIntervalMs;
          continue;
        }

        let damage = calcAutoAttackDamage(entity.stats.STR, target.stats.END);
        // Boosted status gives +20% STR for damage calc
        if (entity.statusEffects.some((e) => e.type === 'boosted')) {
          damage = Math.floor(damage * 1.2);
        }
        if (rollCrit(entity.stats.LCK)) damage = Math.floor(damage * CRIT_MULTIPLIER);

        target.currentHp -= damage;
        totalDamageDealt += entity.isAlly ? damage : 0;
        events.push({ type: 'auto-attack', attackerId: entity.id, targetId: target.id, damage });
        entity.nextAttackAt = time + entity.attackIntervalMs;

        // Track passive stacks on damage dealt
        if (entity.passiveState) onDamageDealt(entity.passiveState);

        // Process enemy abilities
        processAbilities(entity, entities, events);

        if (target.currentHp <= 0) events.push({ type: 'death', entityId: target.id });
      }

      // Skill usage
      if (entity.skill && entity.level >= 5 && entity.skill.autoEnabled && time >= entity.skillCooldownUntil) {
        const target = pickTarget(entities, !entity.isAlly);
        if (target) {
          const baseDmg = calcAutoAttackDamage(entity.stats.STR, target.stats.END);
          const skillDmg = calcSkillDamage(baseDmg, entity.skill.damageMultiplier, entity.stats.DEX);
          target.currentHp -= skillDmg;
          totalDamageDealt += entity.isAlly ? skillDmg : 0;
          events.push({ type: 'skill-use', attackerId: entity.id, targetId: target.id, damage: skillDmg, skillName: entity.skill.name });
          entity.skillCooldownUntil = time + (entity.attackIntervalMs * 2);
          if (entity.passiveState) onDamageDealt(entity.passiveState);
          if (target.currentHp <= 0) events.push({ type: 'death', entityId: target.id });
        }
      }
    }

    if (events.length > 0) ticks.push({ time, events });

    const alliesAlive = entities.filter((e) => e.isAlly && e.currentHp > 0);
    const enemiesAlive = entities.filter((e) => !e.isAlly && e.currentHp > 0);

    if (enemiesAlive.length === 0) {
      const injured = entities.filter((e) => e.isAlly && e.currentHp <= 0).map((e) => e.id);
      const outcome: CombatOutcome = injured.length === 0 ? 'victory' : 'partial-victory';
      ticks.push({ time, events: [{ type: 'victory' }] });
      return { outcome, ticks, survivors: alliesAlive.map((e) => e.id), injured, totalDamageDealt, durationMs: time };
    }

    if (alliesAlive.length === 0) {
      ticks.push({ time, events: [{ type: 'wipe' }] });
      return { outcome: 'full-wipe', ticks, survivors: [], injured: entities.filter((e) => e.isAlly).map((e) => e.id), totalDamageDealt, durationMs: time };
    }
  }

  return { outcome: 'full-wipe', ticks, survivors: [], injured: entities.filter((e) => e.isAlly).map((e) => e.id), totalDamageDealt, durationMs: time };
}

/** Process enemy abilities after an attack */
function processAbilities(entity: CombatEntity, entities: CombatEntity[], events: CombatEvent[]): void {
  for (const ability of entity.abilities) {
    if (Math.random() >= ability.chance) continue;

    if (ability.type === 'poison-attack') {
      const t = pickTarget(entities, !entity.isAlly);
      if (t && !t.statusEffects.some((e) => e.type === 'poisoned')) {
        t.statusEffects.push({ type: 'poisoned', ticksRemaining: 6 });
        events.push({ type: 'effect-applied', targetId: t.id, effect: 'poisoned' });
      }
    } else if (ability.type === 'stun-attack') {
      const t = pickTarget(entities, !entity.isAlly);
      if (t && !t.statusEffects.some((e) => e.type === 'stunned')) {
        t.statusEffects.push({ type: 'stunned', ticksRemaining: 2 });
        events.push({ type: 'effect-applied', targetId: t.id, effect: 'stunned' });
      }
    } else if (ability.type === 'enrage') {
      if (!entity.statusEffects.some((e) => e.type === 'boosted')) {
        entity.statusEffects.push({ type: 'boosted', ticksRemaining: 4 });
        events.push({ type: 'effect-applied', targetId: entity.id, effect: 'boosted' });
      }
    } else if (ability.type === 'heal-ally') {
      const allies = entities.filter((e) => e.isAlly === entity.isAlly && e.currentHp > 0 && e.id !== entity.id);
      if (allies.length > 0) {
        const lowest = allies.reduce((min, e) => (e.currentHp < min.currentHp ? e : min));
        const heal = Math.floor(entity.maxHp * 0.15);
        lowest.currentHp = Math.min(lowest.maxHp, lowest.currentHp + heal);
        events.push({ type: 'heal', healerId: entity.id, targetId: lowest.id, amount: heal });
      }
    }
  }
}
