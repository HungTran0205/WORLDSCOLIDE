/** FacilityCard — single facility display with member slot assignment. */

import type { GuildFacility, Member } from '@/game/state/game-state';
import type { FacilityDef } from '@/game/data/facility-definitions';
import { CivBadge } from '@/ui/components/civ-badge';

interface FacilityCardProps {
  facility: GuildFacility;  // guaranteed level > 0 && placedSlot !== null
  def: FacilityDef;
  allMembers: Member[];
  gold: number;
  dailyUpkeep: number;
  onUpgrade: () => void;
  onAssign: (memberId: string) => void;
  onUnassign: (memberId: string) => void;
}

/** Compute a short human-readable bonus preview string for assigned members. */
function getBonusPreview(facility: GuildFacility, assignedMembers: Member[], dailyUpkeep: number): string {
  if (assignedMembers.length === 0) return '';
  const lv = facility.level;

  switch (facility.type) {
    case 'training-yard': {
      const base = [12, 22, 40][lv - 1];
      const total = assignedMembers.reduce((sum, m) => {
        const bonus = 1 + (m.stats.DEX + m.stats.AGI) * 0.002;
        return sum + Math.floor(base * bonus);
      }, 0);
      return `+${total} EXP/day`;
    }
    case 'workshop': {
      const wood = [3, 5, 8][lv - 1];
      const stone = [2, 3, 5][lv - 1];
      const totalW = assignedMembers.reduce((sum, m) => sum + Math.floor(wood * (1 + m.stats.STR * 0.004)), 0);
      const totalS = assignedMembers.reduce((sum, m) => sum + Math.floor(stone * (1 + m.stats.STR * 0.004)), 0);
      return `+${totalW} Wood, +${totalS} Stone/day`;
    }
    case 'tavern': {
      const totalCha = assignedMembers.reduce((s, m) => s + m.stats.CHA, 0);
      const pct = Math.min(0.10, totalCha * 0.0005 * lv);
      const saved = Math.floor(dailyUpkeep * pct);
      return `-${(pct * 100).toFixed(1)}% upkeep (~${saved}g/day)`;
    }
    case 'infirmary': {
      const avgEnd = assignedMembers.reduce((s, m) => s + m.stats.END, 0) / assignedMembers.length;
      const avgInt = assignedMembers.reduce((s, m) => s + m.stats.INT, 0) / assignedMembers.length;
      const base = [0.75, 0.55, 0.40][lv - 1];
      const mult = Math.max(0.2, base - (avgEnd + avgInt) * 0.001);
      const fasterPct = Math.round((1 - mult) * 100);
      return `${fasterPct}% faster recovery`;
    }
    case 'logging-site': {
      const base = [5, 9, 15][lv - 1];
      const total = assignedMembers.reduce((sum, m) => {
        const gatherSpeed = m.stats.STR * 0.004;
        return sum + Math.floor(base * (1 + gatherSpeed));
      }, 0);
      return `+${total} Wood/day`;
    }
    case 'stone-quarry': {
      const base = [4, 7, 12][lv - 1];
      const total = assignedMembers.reduce((sum, m) => {
        const gatherSpeed = m.stats.STR * 0.004;
        return sum + Math.floor(base * (1 + gatherSpeed));
      }, 0);
      return `+${total} Stone/day`;
    }
    default:
      return '';
  }
}

export function FacilityCard({
  facility, def, allMembers, gold, dailyUpkeep,
  onUpgrade, onAssign, onUnassign,
}: FacilityCardProps) {
  const canUpgrade = facility.level < 3;
  const upgradeCost = canUpgrade ? def.upgradeCosts[facility.level - 1] : 0;
  const maxSlots = def.maxSlots[facility.level - 1];
  const assignedMembers = allMembers.filter((m) => facility.assignedMemberIds.includes(m.id));

  // Eligible: idle members not assigned to any facility
  const assignedAnywhere = new Set(
    allMembers.filter((m) => m.status === 'assigned').map((m) => m.id),
  );
  const eligible = allMembers.filter((m) => m.status === 'idle' && !assignedAnywhere.has(m.id));

  const bonusPreview = getBonusPreview(facility, assignedMembers, dailyUpkeep);

  return (
    <div className="panel-section">
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <strong style={{ color: '#ffd700' }}>{def.name}</strong>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: '#aaa' }}>Lv.{facility.level}</span>
          {canUpgrade && (
            <button
              className="panel-btn"
              style={{ width: 'auto', padding: '2px 8px', fontSize: '0.75rem', marginTop: 0 }}
              disabled={gold < upgradeCost}
              onClick={onUpgrade}
              title={gold < upgradeCost ? 'Not enough gold' : undefined}
            >
              ▲ {upgradeCost}g
            </button>
          )}
        </div>
      </div>

      {/* Stats + description */}
      <div style={{ fontSize: '0.75rem', color: '#9b59b6', marginBottom: 2 }}>{def.primaryStats}</div>
      <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 8 }}>{def.description}</div>

      {/* Member slots */}
      {(
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {assignedMembers.map((member) => (
              <div key={member.id} className="facility-member-slot">
                <CivBadge civilization={member.civilization} />
                <span style={{ fontSize: '0.75rem' }}>{member.name}</span>
                <span style={{ fontSize: '0.7rem', color: '#aaa' }}>Lv.{member.level}</span>
                <button
                  onClick={() => onUnassign(member.id)}
                  style={{
                    background: 'none', border: 'none', color: '#e74c3c',
                    cursor: 'pointer', fontSize: '0.8rem', padding: '0 2px',
                  }}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}

            {assignedMembers.length < maxSlots && eligible.length > 0 && (
              <select
                className="facility-assign-select"
                value=""
                onChange={(e) => { if (e.target.value) onAssign(e.target.value); }}
              >
                <option value="">+ Assign</option>
                {eligible.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} Lv.{m.level}</option>
                ))}
              </select>
            )}

            {assignedMembers.length < maxSlots && eligible.length === 0 && (
              <span style={{ fontSize: '0.75rem', color: '#555' }}>No idle members</span>
            )}
          </div>

          {/* Slot count */}
          <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: 4 }}>
            Slots: {assignedMembers.length}/{maxSlots}
          </div>

          {/* Bonus preview */}
          {bonusPreview && (
            <div className="facility-bonus-preview">{bonusPreview}</div>
          )}
        </>
      )}
    </div>
  );
}
