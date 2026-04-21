/**
 * Combat view — shows combat log and summary for completed missions.
 * Reads from notification slice to display tick-by-tick combat replays.
 */

import { useState } from 'react';
import { useGameStore } from '@/game/state/store';
import { MISSIONS } from '@/game/data/missions';
import type { CombatEvent, CombatTick } from '@/game/systems/combat-types';
import '@/ui/styles/panels.css';

interface CombatViewProps {
  onClose: () => void;
}

export function CombatView({ onClose }: CombatViewProps) {
  const notifications = useGameStore((s) => s.notifications);
  const currentCombatReplay = useGameStore((s) => s.currentCombatReplay);
  const dismissResult = useGameStore((s) => s.dismissResult);
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const allMembers = founder ? [founder, ...roster] : roster;
  const getName = (id: string) => allMembers.find((m) => m.id === id)?.name ?? id;

  // Show manual replay when available (set by setCombatMode('manual'))
  if (currentCombatReplay) {
    const combat = currentCombatReplay;
    return (
      <div className="panel-overlay">
        <h2>
          Combat Replay
          <button className="panel-close-btn" onClick={() => { dismissResult(); onClose(); }}>Close</button>
        </h2>
        <div className="panel-section">
          <div className="combat-summary">
            <div><span style={{ color: '#aaa' }}>Damage: </span>{combat.totalDamageDealt}</div>
            <div><span style={{ color: '#aaa' }}>Duration: </span>{Math.round(combat.durationMs / 1000)}s</div>
          </div>
        </div>
        <h3 style={{ color: '#ffd700', margin: '12px 0 8px' }}>Combat Log</h3>
        <div className="combat-log">
          {combat.ticks.map((tick, i) => (
            <CombatTickEntry key={i} tick={tick} tickNum={i + 1} getName={getName} />
          ))}
        </div>
      </div>
    );
  }

  // Filter to only completion notifications (arrivals have no combat result)
  const combatNotifications = notifications.filter((n) => n.notificationType === 'completion');

  // Guard selectedIdx against out-of-bounds if notifications are cleared
  const safeIdx = Math.min(selectedIdx, Math.max(0, combatNotifications.length - 1));

  if (combatNotifications.length === 0) {
    return (
      <div className="panel-overlay">
        <h2>Combat<button className="panel-close-btn" onClick={onClose}>Close</button></h2>
        <div className="panel-section">
          <p style={{ color: '#aaa' }}>No combat results yet. Dispatch a quest to see combat results.</p>
        </div>
      </div>
    );
  }

  const notif = combatNotifications[safeIdx];
  // notificationType === 'completion' guarantees result is non-null
  const result = notif.result;
  if (!result) return null;
  const combat = result.combatResult;
  const missionData = MISSIONS.find((m) => m.id === result.missionId);

  return (
    <div className="panel-overlay">
      <h2>Combat<button className="panel-close-btn" onClick={onClose}>Close</button></h2>

      {/* Mission selector */}
      {combatNotifications.length > 1 && (
        <select
          value={selectedIdx}
          onChange={(e) => setSelectedIdx(Number(e.target.value))}
          style={{ width: '100%', marginBottom: 12, padding: 6, background: 'rgba(255,255,255,0.1)', color: '#e0e0e0', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 4 }}
        >
          {combatNotifications.map((n, i) => (
            <option key={n.id} value={i} style={{ background: '#1a1a2e' }}>
              {n.missionName} — {n.result?.outcome}
            </option>
          ))}
        </select>
      )}

      {/* Summary */}
      <div className="panel-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <strong style={{ color: '#ffd700' }}>{missionData?.name ?? result.missionId}</strong>
          <OutcomeBadge outcome={result.outcome} />
        </div>
        <div className="combat-summary">
          <div><span style={{ color: '#aaa' }}>Damage: </span>{combat.totalDamageDealt}</div>
          <div><span style={{ color: '#aaa' }}>Duration: </span>{Math.round(combat.durationMs / 1000)}s</div>
          <div><span style={{ color: '#aaa' }}>Gold: </span><span style={{ color: '#ffd700' }}>+{result.goldEarned}</span></div>
          <div><span style={{ color: '#aaa' }}>EXP: </span><span style={{ color: '#67b8e3' }}>+{result.expPerMember}</span></div>
        </div>
        {result.survivors.length > 0 && (
          <div style={{ fontSize: '0.8rem', color: '#2ecc71' }}>
            Survivors: {result.survivors.map(getName).join(', ')}
          </div>
        )}
        {result.injured.length > 0 && (
          <div style={{ fontSize: '0.8rem', color: '#e74c3c' }}>
            Injured: {result.injured.map(getName).join(', ')}
          </div>
        )}
      </div>

      {/* Combat log */}
      <h3 style={{ color: '#ffd700', margin: '12px 0 8px' }}>Combat Log</h3>
      <div className="combat-log">
        {combat.ticks.map((tick, i) => (
          <CombatTickEntry key={i} tick={tick} tickNum={i + 1} getName={getName} />
        ))}
      </div>
    </div>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const colors: Record<string, string> = {
    victory: '#2ecc71', 'partial-victory': '#f39c12', 'full-wipe': '#e74c3c',
  };
  const labels: Record<string, string> = {
    victory: 'Victory', 'partial-victory': 'Partial Victory', 'full-wipe': 'Wiped',
  };
  return (
    <span className="member-status-badge" style={{ color: colors[outcome], background: `${colors[outcome]}22`, border: `1px solid ${colors[outcome]}55` }}>
      {labels[outcome] ?? outcome}
    </span>
  );
}

function CombatTickEntry({ tick, tickNum, getName }: { tick: CombatTick; tickNum: number; getName: (id: string) => string }) {
  if (tick.events.length === 0) return null;
  return (
    <div className="combat-log__tick">
      <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: 2 }}>Tick {tickNum}</div>
      {tick.events.map((event, i) => (
        <div key={i} className={`combat-log__event ${getEventClass(event)}`}>
          {formatEvent(event, getName)}
        </div>
      ))}
    </div>
  );
}

function getEventClass(event: CombatEvent): string {
  switch (event.type) {
    case 'death': return 'combat-log__event--death';
    case 'victory': case 'wipe': return 'combat-log__event--victory';
    case 'skill-use': return 'combat-log__event--skill';
    case 'dodge': return 'combat-log__event--dodge';
    case 'heal': return 'combat-log__event--heal';
    default: return '';
  }
}

function formatEvent(event: CombatEvent, getName: (id: string) => string): string {
  switch (event.type) {
    case 'auto-attack':
      return `${getName(event.attackerId)} attacks ${getName(event.targetId)} for ${event.damage} dmg`;
    case 'skill-use':
      return `${getName(event.attackerId)} uses ${event.skillName} on ${getName(event.targetId)} for ${event.damage} dmg`;
    case 'effect-applied':
      return `${getName(event.targetId)} is ${event.effect}!`;
    case 'effect-tick':
      return `${getName(event.targetId)} takes ${event.damage} ${event.effect} dmg`;
    case 'death':
      return `${getName(event.entityId)} is defeated!`;
    case 'dodge':
      return `${getName(event.targetId)} dodges ${getName(event.attackerId)}'s attack!`;
    case 'heal':
      return `${getName(event.healerId)} heals ${getName(event.targetId)} for ${event.amount} HP`;
    case 'block':
      return `${getName(event.attackerId)} blocks ${getName(event.targetId)}'s attack! (${event.reducedDamage} reduced)`;
    case 'wave-cleared':
      return `Wave ${event.waveIndex + 1} cleared!`;
    case 'victory':
      return 'Victory!';
    case 'wipe':
      return 'Party wiped...';
  }
}
