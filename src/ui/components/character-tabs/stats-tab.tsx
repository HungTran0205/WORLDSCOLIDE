import { useTranslation } from 'react-i18next';
import type { Member, StatKey } from '@/game/state/game-state';
import { STAT_KEYS } from '@/game/systems/stat-allocation';
import { RankPromotionSection } from '@/ui/components/rank-promotion-section';
import { calcMaxHp, calcAttackInterval, calcCritRate, calcDefenseRating } from '@/game/systems/combat-formulas';
import { calcDerivedGuildStats } from '@/game/systems/derived-guild-stats';

interface StatsTabProps {
  member: Member;
  isMerc: boolean;
  onAllocateStat: (stat: StatKey, amount?: number) => void;
  onPromote?: () => void;
  canAffordPromote?: boolean;
}

function DerivedRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="derived-row">
      <span className="derived-label">{label}</span>
      <span className="derived-val">{value}</span>
    </div>
  );
}

export function StatsTab({ member, isMerc, onAllocateStat, onPromote, canAffordPromote }: StatsTabProps) {
  const { t } = useTranslation();
  const { STR, END, DEX, LCK, AGI } = member.stats;
  const maxHp       = calcMaxHp(END, member.level);
  const atkIntervalMs = calcAttackInterval(AGI);
  const critPct     = Math.round(calcCritRate(LCK) * 100);
  const defPct      = Math.round(calcDefenseRating(END) * 100);
  const guild       = calcDerivedGuildStats(member.stats, member.level);

  return (
    <div className="stats-tab-layout">

      {/* ── Left: Talent stats ── */}
      <div className="stats-col-talents">
        {member.unallocatedPoints > 0 && (
          <div className="stats-unspent">
            {t('statsTab.unspentPoints', { count: member.unallocatedPoints })}
          </div>
        )}
        {STAT_KEYS.map(stat => (
          <div key={stat} className="char-stat-row">
            <span className="char-stat-key">{stat}</span>
            <div className="char-stat-bar-track">
              <div className="char-stat-bar-fill" style={{ width: `${Math.min(100, member.stats[stat as StatKey])}%` }} />
            </div>
            <span className="char-stat-val">{member.stats[stat as StatKey]}</span>
            {member.unallocatedPoints > 0 && (
              <button className="char-alloc-btn" disabled={isMerc} onClick={() => onAllocateStat(stat as StatKey)}>+</button>
            )}
            {member.unallocatedPoints >= 5 && (
              <button className="char-alloc-btn" disabled={isMerc} onClick={() => onAllocateStat(stat as StatKey, 5)} style={{ width: 30 }}>+5</button>
            )}
          </div>
        ))}
        {!isMerc && (
          <div style={{ marginTop: 8 }}>
            <RankPromotionSection member={member} onPromote={onPromote} canAffordPromote={canAffordPromote} />
          </div>
        )}
      </div>

      {/* ── Right: Derived stats ── */}
      <div className="stats-col-derived">

        <p className="char-section-title">{t('statsTab.combat')}</p>
        <DerivedRow label={t('statsTab.maxHp')}    value={maxHp} />
        <DerivedRow label={t('statsTab.atkDmg')}   value={STR} />
        <DerivedRow label={t('statsTab.atkSpeed')} value={t('statsTab.atkSpeedValue', { value: (1000 / atkIntervalMs).toFixed(2) })} />
        <DerivedRow label={t('statsTab.skillDmg')} value={t('statsTab.skillDmgValue', { value: Math.round(DEX * 0.5) })} />
        <DerivedRow label={t('statsTab.critRate')} value={t('statsTab.critRateValue', { value: critPct })} />
        <DerivedRow label={t('statsTab.defense')}   value={t('statsTab.defenseValue', { value: defPct })} />

        <p className="char-section-title" style={{ marginTop: 10 }}>{t('statsTab.guild')}</p>
        <DerivedRow label={t('statsTab.influence')}    value={guild.influence} />
        <DerivedRow label={t('statsTab.stamina')}      value={guild.stamina} />
        <DerivedRow label={t('statsTab.craftSkill')}  value={guild.craftSkill} />
        <DerivedRow label={t('statsTab.negotiation')}  value={guild.negotiation} />
        <DerivedRow label={t('statsTab.exploration')}  value={guild.exploration} />
        <DerivedRow label={t('statsTab.leadership')}   value={guild.leadership} />
        <DerivedRow label={t('statsTab.fortune')}      value={guild.fortune} />
        <DerivedRow label={t('statsTab.trainingEff')} value={t('statsTab.trainingEffValue', { value: Math.round(guild.trainingEff * 100) })} />
        <DerivedRow label={t('statsTab.gatherSpd')}   value={t('statsTab.gatherSpdValue', { value: Math.round(guild.gatherSpeed * 100) })} />
        <DerivedRow label={t('statsTab.recovery')}     value={t('statsTab.recoveryValue', { value: guild.recovery.toFixed(2) })} />

        {member.craftSkills && (
          <>
            <p className="char-section-title" style={{ marginTop: 10 }}>{t('statsTab.craft')}</p>
            {(['woodcutting', 'mining', 'alchemy'] as const).map(skill => {
              const s = member.craftSkills?.[skill];
              if (!s) return null;
              return (
                <div key={skill} className="derived-row">
                  <span className="derived-label">{t(`statsTab.skill.${skill}`)}</span>
                  <span className="derived-val">
                    {t('statsTab.craftLevel', { level: s.level })}
                    <span className="derived-xp">{t('statsTab.craftXp', { xp: Math.floor(s.xpAccumulated) })}</span>
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
