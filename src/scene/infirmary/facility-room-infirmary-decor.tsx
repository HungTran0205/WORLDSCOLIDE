/**
 * Status card for the infirmary facility room — surfaces the recovery state
 * when the camera lands on the infirmary zone so the player can glance the
 * top of the queue without opening the full room panel.
 *
 * Shows: room name + level, beds/queue header, then the first 3 injured
 * members (FIFO from `resolveInjuryQueue`) with a thin progress bar and the
 * remaining countdown. The full bed/queue panel still lives in the room tray.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import type { GuildFacility } from '@/game/state/game-state';
import { resolveInjuryQueue } from '@/game/systems/infirmary-recovery';

const COUNTDOWN_INTERVAL_MS = 1000;
const VISIBLE_ROWS = 3;

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(total / 60).toString().padStart(2, '0');
  const ss = (total % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export function InfirmaryZoneCard({ facility }: { facility: GuildFacility }) {
  const { t } = useTranslation();
  const facilities = useGameStore((s) => s.facilities);
  const founder    = useGameStore((s) => s.founder);
  const roster     = useGameStore((s) => s.roster);

  const allMembers = founder ? [founder, ...roster] : roster;
  const { beds, rows } = resolveInjuryQueue(allMembers, facilities);
  const beddedCount = rows.filter((r) => r.bedded).length;
  const queueCount  = rows.length - beddedCount;
  const visible     = rows.slice(0, VISIBLE_ROWS);
  const hidden      = Math.max(0, rows.length - VISIBLE_ROWS);

  // Tick once a second so the remaining countdown ticks down while the card is open.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (rows.length === 0) return;
    const id = setInterval(() => setTick((n) => n + 1), COUNTDOWN_INTERVAL_MS);
    return () => clearInterval(id);
  }, [rows.length]);

  return (
    <div style={{
      background: 'rgba(18,18,22,0.88)',
      border: '1px solid rgba(136,170,255,0.32)',
      borderRadius: 8,
      padding: '8px 12px',
      minWidth: 200,
      fontSize: 12,
      color: '#d0d0e0',
      pointerEvents: 'none', // info-only — click the zone, not the card
    }}>
      <div style={{ fontWeight: 'bold', color: '#cfd9ff', marginBottom: 4 }}>
        Infirmary — Lv.{facility.level}
      </div>
      <div style={{ color: '#9aa3b8', fontSize: 11, marginBottom: 6 }}>
        {t('infirmaryCard.header', {
          occupied: beddedCount,
          max: beds,
          queue: queueCount,
        })}
      </div>

      {rows.length === 0 ? (
        <div style={{ color: '#6a6f80', fontSize: 11 }}>
          {t('infirmaryCard.bedsEmpty')}
        </div>
      ) : (
        <>
          {visible.map((row) => {
            const pct = Math.min(100, Math.round(row.progress * 100));
            return (
              <div key={row.member.id} style={{ marginBottom: 5 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 6,
                  marginBottom: 2,
                }}>
                  <span style={{
                    color: row.bedded ? '#cfe2ff' : '#9aa3b8',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {row.bedded
                      ? row.member.name
                      : `#${row.position + 1} ${row.member.name}`}
                  </span>
                  <span style={{ color: row.bedded ? '#88c0ff' : '#7a8194', fontSize: 11 }}>
                    {formatRemaining(row.remainingMs)}
                  </span>
                </div>
                <div style={{
                  height: 4,
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: row.bedded
                      ? 'linear-gradient(90deg, #6aa6ff, #aac6ff)'
                      : 'rgba(154,163,184,0.55)',
                    transition: 'width 200ms linear',
                  }} />
                </div>
              </div>
            );
          })}
          {hidden > 0 && (
            <div style={{ color: '#6a6f80', fontSize: 11, marginTop: 2 }}>
              +{hidden} more
            </div>
          )}
        </>
      )}
    </div>
  );
}
