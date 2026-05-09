/**
 * Status card for the stone-quarry facility room.
 * Shows assigned miners and estimated stone yield per day.
 */

import { STONE_QUARRY_CONFIG } from '@/game/data/facility-definitions';
import { calcMcLevel } from '@/game/systems/stone-quarry-production-system';
import { useGameStore } from '@/game/state/store';
import type { GuildFacility } from '@/game/state/game-state';

/** Compact info card — pinned to top-left corner of the stone-quarry room */
export function QuarryZoneCard({ facility }: { facility: GuildFacility }) {
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);
  const allMembers = founder ? [founder, ...roster] : roster;
  const assigned = allMembers.filter((m) => facility.assignedMemberIds.includes(m.id));
  const lv = facility.level;
  const levelMult = STONE_QUARRY_CONFIG.levelMult[lv - 1];

  let totalStonePerDay = 0;
  for (const m of assigned) {
    const baseScore = m.stats.STR * 0.5;
    const mcXp = m.craftSkills?.mining?.xpAccumulated ?? 0;
    const mcLevel = calcMcLevel(mcXp);
    const yieldMult = 1 + STONE_QUARRY_CONFIG.mcSkillYieldPct[mcLevel] / 100;
    totalStonePerDay +=
      STONE_QUARRY_CONFIG.baseRate * (baseScore / 100) * levelMult * yieldMult * STONE_QUARRY_CONFIG.ticksPerDay;
  }

  return (
    <div style={{
      background: 'rgba(18,18,22,0.88)',
      border: '1px solid rgba(160,160,200,0.3)',
      borderRadius: 8,
      padding: '8px 12px',
      minWidth: 170,
      fontSize: 12,
      color: '#d0d0e0',
    }}>
      <div style={{ fontWeight: 'bold', color: '#c8c8f0', marginBottom: 6 }}>
        Stone Quarry — Lv.{lv}
      </div>
      {assigned.length > 0 ? (
        <>
          <div style={{ color: '#4ade80', fontWeight: 600, marginBottom: 2 }}>
            ~{Math.floor(totalStonePerDay)} stone/gameday
          </div>
          <div style={{ color: '#888', fontSize: 11 }}>
            {assigned.length} miner{assigned.length > 1 ? 's' : ''} assigned
          </div>
        </>
      ) : (
        <div style={{ color: '#666', fontSize: 11 }}>No miners assigned</div>
      )}
    </div>
  );
}
