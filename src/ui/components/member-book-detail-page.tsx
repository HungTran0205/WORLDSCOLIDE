/** Two-page book layout for member detail — left page (identity/skill) + right page (talents/stats). */

import type { Member, StatKey } from '@/game/state/game-state';
import { StatBar } from '@/ui/components/stat-bar';
import { RankBadge } from '@/ui/components/rank-badge';
import { CivBadge } from '@/ui/components/civ-badge';
import { GameIcon } from '@/ui/components/game-icon';
import { MemberDerivedStatsSection } from '@/ui/components/member-derived-stats-section';
import { getCivColor, CIV_CONFIG } from '@/game/data/civilization-config';
import type { Civilization } from '@/game/data/civilization-config';
import { STAT_KEYS } from '@/game/systems/stat-allocation';
import { expToNextLevel } from '@/game/systems/leveling-system';

interface MemberBookDetailPageProps {
  member: Member;
  onAllocateStat: (stat: StatKey, amount?: number) => void;
  onToggleAutoCast: () => void;
}

const EQUIPMENT_SLOTS = ['Head', 'Armor', 'Pants', 'Boots', 'Weapon'] as const;

/** Pure-CSS ruled-line paper texture — zero overhead */
const RULED_BG = 'repeating-linear-gradient(transparent,transparent 23px,rgba(255,255,255,0.04) 23px,rgba(255,255,255,0.04) 24px)';

export function MemberBookDetailPage({ member, onAllocateStat, onToggleAutoCast }: MemberBookDetailPageProps) {
  const expNeeded = expToNextLevel(member.level);
  const expPct = Math.min(100, Math.floor((member.exp / expNeeded) * 100));
  const civColor = getCivColor(member.civilization);
  const civConfig = CIV_CONFIG[member.civilization as Civilization];
  const isMercenary = member.rank === 'MERCENARY';

  return (
    <>
      {/* ── Left page: Identity / Biography / Passive / Equipment / Skill ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, backgroundImage: RULED_BG, display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Identity */}
        <div className="panel-section" style={{ textAlign: 'center' }}>
          <div style={{
            width: 58, height: 58, borderRadius: 10, margin: '0 auto 8px',
            background: civColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', color: '#fff', fontWeight: 'bold',
            border: member.isFounder ? '2px solid #ffd700' : '1px solid rgba(255,255,255,0.2)',
          }}>
            {member.name.slice(0, 2)}
          </div>
          <CivBadge civilization={member.civilization} size="md" />
          <div style={{ color: member.isFounder ? '#ffd700' : '#ddd', fontSize: '0.95rem', fontWeight: 600, marginTop: 4 }}>
            {member.name}<RankBadge rank={member.rank} />
          </div>
          <div style={{ fontSize: '0.72rem', color: '#aaa', marginTop: 2 }}>
            Lv.{member.level} · {member.civilization}
          </div>
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: '0.65rem', color: '#67b8e3', marginBottom: 2 }}>
              EXP {member.exp}/{expNeeded} ({expPct}%)
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <div style={{ width: `${expPct}%`, height: '100%', background: '#67b8e3' }} />
            </div>
          </div>
        </div>

        {/* Biography placeholder */}
        <div className="panel-section">
          <div style={{ color: '#ffd700', fontSize: '0.75rem', marginBottom: 4 }}>Biography</div>
          <div style={{ fontSize: '0.68rem', color: '#555', fontStyle: 'italic' }}>— no record on file —</div>
        </div>

        {/* Civ Passive */}
        {civConfig && (
          <div className="panel-section">
            <div style={{ color: '#ffd700', fontSize: '0.75rem', marginBottom: 3 }}>{civConfig.passive.name}</div>
            <div style={{ fontSize: '0.68rem', color: '#aaa' }}>{civConfig.passive.description}</div>
            <div style={{ fontSize: '0.65rem', marginTop: 4, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {civConfig.statBonuses.map((b) => (
                <span key={b.stat} style={{ color: b.multiplier >= 1.2 ? '#9b59b6' : '#2ecc71' }}>
                  {b.stat}{b.multiplier >= 1.2 ? '++' : '+'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Equipment */}
        <div className="panel-section">
          <div style={{ color: '#ffd700', fontSize: '0.75rem', marginBottom: 6 }}>Equipment</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
            {EQUIPMENT_SLOTS.map((slot) => (
              <div key={slot} title="Coming soon" style={{
                aspectRatio: '1', borderRadius: 5,
                border: '1px dashed rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.55rem', color: '#555',
              }}>{slot}</div>
            ))}
          </div>
        </div>

        {/* Skill + Auto-cast */}
        <div className="panel-section">
          <div style={{ color: '#ffd700', fontSize: '0.75rem', marginBottom: 6 }}>Skill</div>
          {member.skill ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#4a90d9', fontSize: '0.82rem' }}>
                  <GameIcon category="skill" id={member.skill.id} size={18} fallbackText={member.skill.name.slice(0, 2)} />
                  {member.skill.name}
                </span>
                <span style={{ color: '#aaa', fontSize: '0.68rem' }}>{member.skill.damageMultiplier}× DMG</span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={member.skill.autoEnabled} onChange={onToggleAutoCast} style={{ accentColor: '#ffd700' }} />
                <span style={{ fontSize: '0.72rem', color: '#ddd' }}>Auto Cast</span>
              </label>
            </div>
          ) : (
            <div style={{ fontSize: '0.72rem', color: '#666' }}>Unlocks at Lv.5</div>
          )}
        </div>
      </div>

      {/* ── Spine ── */}
      <div style={{ width: 1, background: 'rgba(255,215,0,0.12)', flexShrink: 0 }} />

      {/* ── Right page: Talents / Combat Stats / Guild Stats ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, backgroundImage: RULED_BG, display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Talents */}
        <div className="panel-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#ffd700', fontSize: '0.82rem' }}>Talents</span>
            {member.unallocatedPoints > 0 && (
              <span style={{ color: '#2ecc71', fontSize: '0.7rem' }}>{member.unallocatedPoints} pts</span>
            )}
          </div>
          {STAT_KEYS.map((stat) => (
            <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ flex: 1 }}><StatBar stat={stat} value={member.stats[stat]} /></div>
              {member.unallocatedPoints > 0 && (
                <button
                  onClick={() => onAllocateStat(stat)}
                  disabled={isMercenary}
                  title={isMercenary ? 'Mercenaries auto-distribute stats' : `Allocate 1 point to ${stat}`}
                  style={{
                    background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.4)',
                    color: '#ffd700', width: 18, height: 18, borderRadius: 3,
                    cursor: isMercenary ? 'not-allowed' : 'pointer',
                    fontSize: '0.65rem', opacity: isMercenary ? 0.4 : 1, padding: 0,
                  }}>+</button>
              )}
              {member.unallocatedPoints >= 5 && (
                <button
                  onClick={() => onAllocateStat(stat, 5)}
                  disabled={isMercenary}
                  title={isMercenary ? 'Mercenaries auto-distribute stats' : `Allocate 5 points to ${stat}`}
                  style={{
                    background: 'rgba(255,165,0,0.15)', border: '1px solid rgba(255,165,0,0.4)',
                    color: '#ffa500', width: 26, height: 18, borderRadius: 3,
                    cursor: isMercenary ? 'not-allowed' : 'pointer',
                    fontSize: '0.6rem', opacity: isMercenary ? 0.4 : 1, padding: 0,
                  }}>+5</button>
              )}
            </div>
          ))}
        </div>

        {/* Derived stats: Combat + Guild */}
        <MemberDerivedStatsSection member={member} />
      </div>
    </>
  );
}
