import type { Member, StatKey } from '@/game/state/game-state';
import { STAT_KEYS } from '@/game/systems/stat-allocation';
import { RankPromotionSection } from '@/ui/components/rank-promotion-section';

interface StatsTabProps {
  member: Member;
  isMerc: boolean;
  onAllocateStat: (stat: StatKey, amount?: number) => void;
  onPromote?: () => void;
  canAffordPromote?: boolean;
}

export function StatsTab({ member, isMerc, onAllocateStat, onPromote, canAffordPromote }: StatsTabProps) {
  return (
    <>
      {member.unallocatedPoints > 0 && (
        <div style={{ color: 'var(--ink-status-ok)', fontFamily: 'var(--ink-font-mono)', fontSize: '0.72rem' }}>
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
      {!isMerc && <RankPromotionSection member={member} onPromote={onPromote} canAffordPromote={canAffordPromote} />}
    </>
  );
}
