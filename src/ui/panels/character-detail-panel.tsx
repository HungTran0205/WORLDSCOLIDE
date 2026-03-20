import type { Member, StatKey } from '@/game/state/game-state';
import { StatBar } from '@/ui/components/stat-bar';
import { RankBadge } from '@/ui/components/rank-badge';
import { RankPromotionSection } from '@/ui/components/rank-promotion-section';
import { CivBadge } from '@/ui/components/civ-badge';
import { getCivColor, CIV_CONFIG } from '@/game/data/civilization-config';
import type { Civilization } from '@/game/data/civilization-config';
import { STAT_KEYS } from '@/game/systems/stat-allocation';
import { expToNextLevel } from '@/game/systems/leveling-system';

interface CharacterDetailPanelProps {
  member: Member;
  onAllocateStat: (stat: StatKey) => void;
  onToggleAutoCast: () => void;
  onInviteMercenary?: () => void;
  inviteCost?: number;
  canAffordInvite?: boolean;
  onPromote?: () => void;
  canAffordPromote?: boolean;
  onClose: () => void;
}

const EQUIPMENT_SLOTS = ['Head', 'Armor', 'Pants', 'Boots', 'Weapon'] as const;

/** Character detail split-view — avatar, equipment, skill, talents */
export function CharacterDetailPanel({ member, onAllocateStat, onToggleAutoCast, onInviteMercenary, inviteCost, canAffordInvite, onPromote, canAffordPromote, onClose }: CharacterDetailPanelProps) {
  const expNeeded = expToNextLevel(member.level);
  const expPct = Math.min(100, Math.floor((member.exp / expNeeded) * 100));
  const civColor = getCivColor(member.civilization);
  const civConfig = CIV_CONFIG[member.civilization as Civilization];
  const isMercenary = member.rank === 'MERCENARY';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header with close */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ color: '#ffd700', fontSize: '1rem' }}>Character Details</strong>
        <button className="panel-close-btn" onClick={onClose}>Close</button>
      </div>

      {/* Box 1: Avatar + Identity */}
      <div className="panel-section" style={{ textAlign: 'center' }}>
        <div style={{
          width: 96, height: 96, borderRadius: 12, margin: '0 auto 10px',
          background: civColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: member.isFounder ? '2px solid #ffd700' : '2px solid rgba(255,255,255,0.2)',
        }}>
          <CivBadge civilization={member.civilization} size="md" />
        </div>
        <div style={{ color: member.isFounder ? '#ffd700' : '#ddd', fontSize: '1.1rem', fontWeight: 600 }}>
          {member.name}
          <RankBadge rank={member.rank} />
        </div>
        <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: 4 }}>
          Lv.{member.level} | {member.civilization}
        </div>
        {/* EXP bar */}
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: '0.7rem', color: '#67b8e3', marginBottom: 2 }}>
            EXP: {member.exp}/{expNeeded} ({expPct}%)
          </div>
          <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{ width: `${expPct}%`, height: '100%', background: '#67b8e3' }} />
          </div>
        </div>
        {/* Invite mercenary button */}
        {isMercenary && onInviteMercenary && (
          <button
            className="panel-btn"
            disabled={!canAffordInvite}
            onClick={onInviteMercenary}
            style={{ marginTop: 8 }}
          >
            Invite to Guild ({inviteCost}g)
          </button>
        )}
      </div>

      {/* Box: Civ Passive */}
      {civConfig && (
        <div className="panel-section">
          <div style={{ color: '#ffd700', fontSize: '0.85rem', marginBottom: 4 }}>
            {civConfig.passive.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#aaa' }}>
            {civConfig.passive.description}
          </div>
          <div style={{ fontSize: '0.7rem', marginTop: 4, display: 'flex', gap: 6 }}>
            {civConfig.statBonuses.map((b) => (
              <span key={b.stat} style={{ color: b.multiplier >= 1.2 ? '#9b59b6' : '#2ecc71' }}>
                {b.stat}{b.multiplier >= 1.2 ? '++' : '+'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Box: Rank & Promotion (non-mercenary only) */}
      {!isMercenary && (
        <RankPromotionSection member={member} onPromote={onPromote} canAffordPromote={canAffordPromote} />
      )}

      {/* Box 2: Equipment (placeholder) */}
      <div className="panel-section">
        <div style={{ color: '#ffd700', fontSize: '0.85rem', marginBottom: 8 }}>Equipment</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {EQUIPMENT_SLOTS.map((slot) => (
            <div
              key={slot}
              title="Coming soon"
              style={{
                aspectRatio: '1', borderRadius: 6,
                border: '1px dashed rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.6rem', color: '#555',
              }}
            >
              {slot}
            </div>
          ))}
        </div>
      </div>

      {/* Box 3: Skill + Auto-cast toggle */}
      <div className="panel-section">
        <div style={{ color: '#ffd700', fontSize: '0.85rem', marginBottom: 8 }}>Skill</div>
        {member.skill ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#4a90d9', fontSize: '0.9rem' }}>{member.skill.name}</span>
              <span style={{ color: '#aaa', fontSize: '0.75rem' }}>
                {member.skill.damageMultiplier}x DMG
              </span>
            </div>
            {/* Auto-cast toggle */}
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={member.skill.autoEnabled}
                onChange={onToggleAutoCast}
                style={{ accentColor: '#ffd700' }}
              />
              <span style={{ fontSize: '0.8rem', color: '#ddd' }}>Auto Cast</span>
            </label>
          </div>
        ) : (
          <div style={{ fontSize: '0.8rem', color: '#666' }}>Unlocks at Lv.5</div>
        )}
      </div>

      {/* Box 4: Talents (stat allocation) */}
      <div className="panel-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#ffd700', fontSize: '0.85rem' }}>Talents</span>
          {member.unallocatedPoints > 0 && (
            <span style={{ color: '#2ecc71', fontSize: '0.75rem' }}>
              {member.unallocatedPoints} pts available
            </span>
          )}
        </div>
        {STAT_KEYS.map((stat) => (
          <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ flex: 1 }}>
              <StatBar stat={stat} value={member.stats[stat]} />
            </div>
            {member.unallocatedPoints > 0 && (
              <button
                onClick={() => onAllocateStat(stat)}
                disabled={isMercenary}
                title={isMercenary ? 'Mercenaries auto-distribute stats' : `Allocate 1 point to ${stat}`}
                style={{
                  background: 'rgba(255,215,0,0.2)',
                  border: '1px solid rgba(255,215,0,0.4)',
                  color: '#ffd700', width: 20, height: 20, borderRadius: 4,
                  cursor: isMercenary ? 'not-allowed' : 'pointer',
                  fontSize: '0.7rem', opacity: isMercenary ? 0.4 : 1,
                }}>+</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
