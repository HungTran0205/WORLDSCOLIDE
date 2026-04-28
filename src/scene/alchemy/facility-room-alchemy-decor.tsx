/**
 * Status card for the alchemy-lab facility room.
 * Shows active craft queue (with progress bars) and auto-production rate.
 */

import { ALCHEMY_CONFIG } from '@/game/data/facility-definitions';
import { ITEM_DATABASE } from '@/game/data/items';
import { calcAcLevel } from '@/game/systems/alchemy-production-system';
import { useGameStore } from '@/game/state/store';
import type { GuildFacility } from '@/game/state/game-state';

/** Compact status card — pinned to top-left corner of the alchemy-lab room */
export function AlchemyZoneCard({ facility }: { facility: GuildFacility }) {
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);

  const allMembers = founder ? [founder, ...roster] : roster;
  const assigned = allMembers.filter((m) => facility.assignedMemberIds.includes(m.id));

  const isLocked = facility.level === 0;
  const queue = facility.craftQueue ?? [];

  // Estimated auto-craft rate
  let syngsPerDay = 0;
  for (const m of assigned) {
    const { INT, DEX } = m.stats;
    const acLevel = calcAcLevel(m.craftSkills?.alchemy?.xpAccumulated ?? 0);
    syngsPerDay += ALCHEMY_CONFIG.batchesPerDay(INT, DEX, facility.level)
      * ALCHEMY_CONFIG.ingredientCountFormula(acLevel);
  }

  return (
    <div style={{
      background: 'rgba(14,10,24,0.92)',
      border: '1px solid rgba(160,100,255,0.35)',
      borderRadius: 8,
      padding: '10px 14px',
      minWidth: 200,
      maxWidth: 240,
      fontSize: 12,
      color: '#d8c8f8',
      userSelect: 'none',
    }}>
      <div style={{ fontWeight: 'bold', color: '#c890ff', marginBottom: 8 }}>
        Alchemy Lab{!isLocked ? ` — Lv.${facility.level}` : ' (Locked)'}
      </div>

      {!isLocked && (
        <>
          {/* Active craft queue */}
          {queue.length > 0 ? (
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>
                Crafting ({queue.length} job{queue.length > 1 ? 's' : ''})
              </div>
              {queue.map((job) => {
                const pct = Math.round((1 - job.remainingSeconds / job.totalSeconds) * 100);
                const outputName = ITEM_DATABASE[job.outputItemId as keyof typeof ITEM_DATABASE]?.name ?? job.outputItemId;
                const mins = Math.floor(job.remainingSeconds / 60);
                const secs = job.remainingSeconds % 60;
                return (
                  <div key={job.id} style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ color: '#d8c8f8' }}>×{job.outputQuantity} {outputName}</span>
                      <span style={{ color: '#888', fontSize: 10 }}>
                        {mins > 0 ? `${mins}m ` : ''}{secs}s
                      </span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                        transition: 'width 1s linear',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: '#555', fontSize: 11, marginBottom: 8 }}>
              No active crafts
            </div>
          )}

          {/* Auto-production info */}
          {assigned.length > 0 ? (
            <>
              <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>
                {assigned.length} alchemist{assigned.length > 1 ? 's' : ''} assigned
              </div>
              {syngsPerDay > 0 && (
                <div style={{ color: '#a78bfa', fontWeight: 600, fontSize: 11 }}>
                  ~{Math.floor(syngsPerDay)} syringe{syngsPerDay >= 2 ? 's' : ''}/day (auto)
                </div>
              )}
            </>
          ) : (
            <div style={{ color: '#f87171', fontSize: 11 }}>No alchemist assigned</div>
          )}
        </>
      )}
    </div>
  );
}
