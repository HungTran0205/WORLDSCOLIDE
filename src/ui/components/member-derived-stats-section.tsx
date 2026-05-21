/** Combat Stats + Guild Stats derived display sections for member book right page. */

import { useTranslation } from 'react-i18next';
import type { Member } from '@/game/state/game-state';
import { selectMemberCombatStats, selectMemberGuildStats } from '@/game/state/selectors';
import { formatRate, formatHitsPerSecond, formatHpRegen } from '@/game/systems/member-derived-stats';

interface Props { member: Member; }

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', padding: '2px 0',
      fontSize: '0.7rem', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ color: '#888' }}>{label}</span>
      <span style={{ color: '#ddd', fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}

function GuildStatBar({ label, value, max, suffix = '' }: { label: string; value: number; max: number; suffix?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: 2 }}>
        <span style={{ color: '#999' }}>{label}</span>
        <span style={{ color: '#ccc', fontFamily: 'monospace' }}>{value}{suffix}</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'rgba(74,144,217,0.65)', borderRadius: 2 }} />
      </div>
    </div>
  );
}

export function MemberDerivedStatsSection({ member }: Props) {
  const { t } = useTranslation();
  const combat = selectMemberCombatStats(member);
  const guild = selectMemberGuildStats(member);

  return (
    <>
      {/* Combat Stats — 2-col grid */}
      <div className="panel-section">
        <div style={{ color: '#ffd700', fontSize: '0.82rem', marginBottom: 6 }}>{t('derivedStats.combatStats')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
          <StatRow label={t('derivedStats.maxHp')} value={String(combat.maxHp)} />
          <StatRow label={t('derivedStats.hpRegen')} value={formatHpRegen(combat.hpRegen)} />
          <StatRow label={t('derivedStats.atkSpd')} value={formatHitsPerSecond(combat.hitsPerSecond)} />
          <StatRow label={t('derivedStats.critRate')} value={formatRate(combat.critRate)} />
          <StatRow label={t('derivedStats.critDmg')} value={t('derivedStats.critDmgValue', { value: combat.critDmg.toFixed(2) })} />
          <StatRow label={t('derivedStats.defense')} value={formatRate(combat.defenseRating)} />
          <StatRow label={t('derivedStats.dodge')} value={formatRate(combat.dodgeRate)} />
          <StatRow label={t('derivedStats.block')} value={formatRate(combat.blockRate)} />
          <StatRow label={t('derivedStats.skillDmg')} value={t('derivedStats.skillDmgValue', { value: formatRate(combat.skillDmgBonus) })} />
          <StatRow label={t('derivedStats.haste')} value={formatRate(combat.skillHaste)} />
          <StatRow label={t('derivedStats.resist')} value={formatRate(combat.statusResist)} />
          <StatRow label={t('derivedStats.morale')} value={t('derivedStats.moraleValue', { value: formatRate(combat.moraleAura) })} />
        </div>
      </div>

      {/* Guild Stats — labeled progress bars */}
      <div className="panel-section">
        <div style={{ color: '#ffd700', fontSize: '0.82rem', marginBottom: 6 }}>{t('derivedStats.guildStats')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <GuildStatBar label={t('derivedStats.influence')} value={guild.influence} max={200} />
          <GuildStatBar label={t('derivedStats.stamina')} value={guild.stamina} max={300} />
          <GuildStatBar label={t('derivedStats.craft')} value={guild.craftSkill} max={200} />
          <GuildStatBar label={t('derivedStats.leadership')} value={guild.leadership} max={200} />
          <GuildStatBar label={t('derivedStats.fortune')} value={guild.fortune} max={300} />
          <GuildStatBar label={t('derivedStats.exploration')} value={guild.exploration} max={200} />
          <GuildStatBar label={t('derivedStats.negotiation')} value={guild.negotiation} max={200} />
          <GuildStatBar label={t('derivedStats.recoveryBonus')} value={Math.round((1 - guild.recovery) * 100)} max={80} suffix="%" />
        </div>
      </div>
    </>
  );
}
