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
            {member.unallocatedPoints} unspent point{member.unallocatedPoints !== 1 ? 's' : ''}
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

        <p className="char-section-title">Combat</p>
        <DerivedRow label="Max HP"    value={maxHp} />
        <DerivedRow label="Atk DMG"   value={STR} />
        <DerivedRow label="Atk Speed" value={`${(1000 / atkIntervalMs).toFixed(2)}/s`} />
        <DerivedRow label="Skill DMG" value={`+${Math.round(DEX * 0.5)}%`} />
        <DerivedRow label="Crit Rate" value={`${critPct}%`} />
        <DerivedRow label="Defense"   value={`-${defPct}% dmg`} />

        <p className="char-section-title" style={{ marginTop: 10 }}>Guild</p>
        <DerivedRow label="Influence"    value={guild.influence} />
        <DerivedRow label="Stamina"      value={guild.stamina} />
        <DerivedRow label="Craft Skill"  value={guild.craftSkill} />
        <DerivedRow label="Negotiation"  value={guild.negotiation} />
        <DerivedRow label="Exploration"  value={guild.exploration} />
        <DerivedRow label="Leadership"   value={guild.leadership} />
        <DerivedRow label="Fortune"      value={guild.fortune} />
        <DerivedRow label="Training Eff" value={`+${Math.round(guild.trainingEff * 100)}%`} />
        <DerivedRow label="Gather Spd"   value={`+${Math.round(guild.gatherSpeed * 100)}%`} />
        <DerivedRow label="Recovery"     value={`${guild.recovery.toFixed(2)}×`} />

        {member.craftSkills && (
          <>
            <p className="char-section-title" style={{ marginTop: 10 }}>Craft</p>
            {(['woodcutting', 'mining', 'alchemy'] as const).map(skill => {
              const s = member.craftSkills?.[skill];
              if (!s) return null;
              return (
                <div key={skill} className="derived-row">
                  <span className="derived-label">{skill}</span>
                  <span className="derived-val">
                    Lv.{s.level}
                    <span className="derived-xp">({Math.floor(s.xpAccumulated)}xp)</span>
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
