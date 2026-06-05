/**
 * Skill detail chips — concrete, data-derived effect summary for a Skill.
 * Builds localized tags (type · damage · effects · cooldown) straight from the
 * Skill fields so it always matches the real combat numbers (incl. rank milestones
 * when the caller passes a rank-resolved skill). Used in the roster Skills tab and
 * the Training Yard skill picker.
 */

import type { Skill } from '@/game/state/game-state';

type TFn = (key: string, opts?: Record<string, unknown>) => string;

export function getSkillTags(skill: Skill, t: TFn): string[] {
  const tags: string[] = [];
  const sec = (ms: number) => Math.round(ms / 1000);
  const pct = (x: number) => Math.round(x * 100);

  tags.push(t(`skillDetail.type.${skill.skillType ?? 'damage'}`));

  if (skill.multiHitCount && skill.multiHitCount > 1) {
    tags.push(t('skillDetail.hits', { n: skill.multiHitCount }));
    const per = skill.multiHitMultiplier ?? skill.damageMultiplier;
    if (per > 0) tags.push(t('skillDetail.dmg', { mult: per }));
  } else if (skill.damageMultiplier > 0) {
    tags.push(t('skillDetail.dmg', { mult: skill.damageMultiplier }));
  }

  if (skill.laneHit) tags.push(t('skillDetail.lane'));
  if (skill.aoeRadius) tags.push(t('skillDetail.aoe'));
  if (skill.accuracyBonus) tags.push(t('skillDetail.acc', { pct: pct(skill.accuracyBonus) }));
  if (skill.critRateBonus) tags.push(t('skillDetail.crit', { pct: pct(skill.critRateBonus) }));
  if (skill.armorPierceChance) tags.push(t('skillDetail.armor', { pct: pct(skill.armorPierceChance) }));

  if (skill.statusEffect && skill.statusDurationMs) {
    tags.push(t(`skillDetail.status.${skill.statusEffect}`, { sec: sec(skill.statusDurationMs) }));
  }

  if (skill.skillType === 'buff' && skill.buffEffect) {
    tags.push(t('skillDetail.buff', {
      scope: t(`skillDetail.scope.${skill.buffScope ?? 'self'}`),
      effect: t(`skillDetail.buffEffect.${skill.buffEffect}`),
      sec: sec(skill.buffDurationMs ?? 0),
    }));
  }

  tags.push(t('skillDetail.cd', { sec: sec(skill.cooldownMs) }));
  return tags;
}

export function SkillDetail({ skill, t }: { skill: Skill; t: TFn }) {
  const tags = getSkillTags(skill, t);
  return (
    <div className="skill-detail-tags">
      {tags.map((tag, i) => <span key={i} className="skill-detail-tag">{tag}</span>)}
    </div>
  );
}
