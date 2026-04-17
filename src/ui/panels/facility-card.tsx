/** FacilityCard — single facility display with member slot assignment. */

import type { GuildFacility, Member } from '@/game/state/game-state';
import type { FacilityDef } from '@/game/data/facility-definitions';
import { LOGGING_SITE_CONFIG, STONE_QUARRY_CONFIG } from '@/game/data/facility-definitions';
import { calcMcLevel } from '@/game/systems/stone-quarry-production-system';
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
  onRemove?: () => void;
}

// --- Wood Reserve Bar (logging-site only) ---

function WoodReserveBar({ facility, assignedMembers }: { facility: GuildFacility; assignedMembers: Member[] }) {
  const reserve = facility.woodReserve ?? 0;
  const max = LOGGING_SITE_CONFIG.woodReserve;
  const pct = reserve / max;

  const barColor = pct <= LOGGING_SITE_CONFIG.warningCriticalPct
    ? '#ef4444'
    : pct <= LOGGING_SITE_CONFIG.warningLowPct
      ? '#f59e0b'
      : '#4ade80';

  // Compute total wood/tick across assigned members
  const totalWoodPerTick = assignedMembers.reduce((sum, m) => {
    const { STR, END, DEX } = m.stats;
    const baseScore = STR * 0.5 + END * 0.3 + DEX * 0.2;
    const wcLevel = m.craftSkills?.woodcutting.level ?? 0;
    const skillMult = 1 + LOGGING_SITE_CONFIG.wcSkillBonusPct[wcLevel] / 100;
    return sum + LOGGING_SITE_CONFIG.baseRate * (baseScore / 100) * skillMult;
  }, 0);

  const hoursLeft = totalWoodPerTick > 0 ? Math.floor(reserve / (totalWoodPerTick * 3600)) : null;

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <span style={{ fontSize: '0.75rem', color: '#aaa' }}>
          {Math.floor(reserve)}/{max} wood
          {pct <= LOGGING_SITE_CONFIG.warningCriticalPct && (
            <span style={{ color: '#ef4444', marginLeft: 6 }}>Almost Depleted</span>
          )}
          {pct > LOGGING_SITE_CONFIG.warningCriticalPct && pct <= LOGGING_SITE_CONFIG.warningLowPct && (
            <span style={{ color: '#f59e0b', marginLeft: 6 }}>Running Low</span>
          )}
        </span>
        {hoursLeft !== null && (
          <span style={{ fontSize: '0.7rem', color: '#666' }}>~{hoursLeft}h left</span>
        )}
      </div>
      <div className="wood-reserve-bar-track">
        <div
          className="wood-reserve-bar-fill"
          style={{ width: `${(pct * 100).toFixed(1)}%`, background: barColor }}
        />
      </div>
      {totalWoodPerTick > 0 && (
        <div style={{ fontSize: '0.7rem', color: '#888', marginTop: 2 }}>
          +{totalWoodPerTick.toFixed(4)} wood/tick
        </div>
      )}
    </div>
  );
}

// --- Depleted State Card ---

function DepletedFacilityCard({ def, onRemove }: { def: FacilityDef; onRemove?: () => void }) {
  return (
    <div className="panel-section facility-card--depleted">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <strong style={{ color: '#888' }}>{def.name}</strong>
        <span className="depleted-tag">DEPLETED</span>
      </div>
      <div className="wood-reserve-bar-track" style={{ marginBottom: 8 }}>
        <div className="wood-reserve-bar-fill" style={{ width: '0%', background: '#4b5563' }} />
      </div>
      <p style={{ fontSize: '0.8rem', color: '#555', margin: '0 0 12px' }}>
        This site has been fully harvested.
      </p>
      {onRemove && (
        <button
          className="panel-btn"
          style={{ width: '100%', borderColor: 'rgba(239,68,68,0.5)', color: '#ef4444' }}
          onClick={onRemove}
        >
          Remove Site
        </button>
      )}
    </div>
  );
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
      const total = assignedMembers.reduce((sum, m) => {
        const { STR, END, DEX } = m.stats;
        const baseScore = STR * 0.5 + END * 0.3 + DEX * 0.2;
        const wcLevel = m.craftSkills?.woodcutting.level ?? 0;
        const skillMult = 1 + LOGGING_SITE_CONFIG.wcSkillBonusPct[wcLevel] / 100;
        return sum + LOGGING_SITE_CONFIG.baseRate * (baseScore / 100) * skillMult;
      }, 0);
      return `+${total.toFixed(4)} wood/tick`;
    }
    case 'stone-quarry': {
      const levelMult = STONE_QUARRY_CONFIG.levelMult[lv - 1];
      let totalStonePerDay = 0;
      for (const m of assignedMembers) {
        const baseScore = m.stats.STR * 0.5;
        const mcXp = m.craftSkills?.mining?.xpAccumulated ?? 0;
        const mcLevel = calcMcLevel(mcXp);
        const yieldMult = 1 + STONE_QUARRY_CONFIG.mcSkillYieldPct[mcLevel] / 100;
        totalStonePerDay += STONE_QUARRY_CONFIG.baseRate * (baseScore / 100) * levelMult * yieldMult * STONE_QUARRY_CONFIG.ticksPerDay;
      }
      return `+${Math.floor(totalStonePerDay)} Stone/day`;
    }
    default:
      return '';
  }
}

export function FacilityCard({
  facility, def, allMembers, gold, dailyUpkeep,
  onUpgrade, onAssign, onUnassign, onRemove,
}: FacilityCardProps) {
  // Depleted logging site — show dedicated depleted card
  if (facility.type === 'logging-site' && facility.woodReserve === 0) {
    return <DepletedFacilityCard def={def} onRemove={onRemove} />;
  }

  const canUpgrade = facility.level < 3 && !!def.upgradeCosts;
  const upgradeCost = canUpgrade ? def.upgradeCosts![facility.level - 1] : 0;
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

      {/* Wood reserve bar — logging-site only */}
      {facility.type === 'logging-site' && facility.woodReserve !== null && facility.woodReserve !== undefined && (
        <WoodReserveBar facility={facility} assignedMembers={assignedMembers} />
      )}

      {/* Member slots */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {assignedMembers.map((member) => (
          <div key={member.id} className="facility-member-slot">
            <CivBadge civilization={member.civilization} />
            <span style={{ fontSize: '0.75rem' }}>{member.name}</span>
            <span style={{ fontSize: '0.7rem', color: '#aaa' }}>Lv.{member.level}</span>
            {facility.type === 'logging-site' && (
              <span className="wc-level-badge">
                WC{member.craftSkills?.woodcutting.level ?? 0}
              </span>
            )}
            {facility.type === 'stone-quarry' && (
              <span className="wc-level-badge">
                MC{member.craftSkills?.mining?.level ?? 0}
              </span>
            )}
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
    </div>
  );
}
