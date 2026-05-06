/**
 * Formation sub-phase — drag party members into the 6-slot grid, pick target
 * priority, preview enemies, then advance to the battle phase.
 *
 * Formation state still lives in combat-arena-slice for Phase 3 (legacy bridge);
 * panel orchestration owns only phase + missionId via combat-panel-store.
 */

import { useCallback, useMemo } from 'react';
import { useGameStore } from '@/game/state/store';
import { useCombatPanelStore } from '@/game/state/combat-panel-store';
import { MISSIONS } from '@/game/data/missions';
import { ENEMIES } from '@/game/data/enemies';
import { isRangedArchetype, DEFAULT_TARGET_PRIORITY } from '@/game/systems/combat-arena-types';
import type { Member } from '@/game/state/game-state';
import type { Formation, TargetPriority } from '@/game/systems/combat-arena-types';

/** Auto-suggest formation: melee front (slots 0-2), ranged back (slots 3-5) */
function autoSuggestFormation(members: Member[]): Formation {
  const formation: Formation = [null, null, null, null, null, null];
  const melee: Member[] = [];
  const ranged: Member[] = [];
  for (const m of members) {
    if (isRangedArchetype(m.archetype)) ranged.push(m);
    else melee.push(m);
  }
  let frontIdx = 0;
  let backIdx = 3;
  for (const m of melee) {
    if (frontIdx <= 2) formation[frontIdx++] = m.id;
    else if (backIdx <= 5) formation[backIdx++] = m.id;
  }
  for (const m of ranged) {
    if (backIdx <= 5) formation[backIdx++] = m.id;
    else if (frontIdx <= 2) formation[frontIdx++] = m.id;
  }
  return formation;
}

/** Display-order map: render rows as [back, front] to match in-game spawn positions */
const GRID_ORDER = [3, 0, 4, 1, 5, 2] as const;
const SLOT_LABELS: Record<number, string> = {
  0: 'Front 1', 1: 'Front 2', 2: 'Front 3',
  3: 'Back 1',  4: 'Back 2',  5: 'Back 3',
};

export function CombatPanelFormation() {
  const missionId = useCombatPanelStore((s) => s.missionId);
  const setPhase = useCombatPanelStore((s) => s.setPhase);

  const formation = useGameStore((s) => s.formation);
  const setFormationSlot = useGameStore((s) => s.setFormationSlot);
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);
  const activeMissions = useGameStore((s) => s.activeMissions);
  const setTargetPriority = useGameStore((s) => s.setTargetPriority);
  const updateMissionPhase = useGameStore((s) => s.updateMissionPhase);

  const mission = activeMissions.find((m) => m.missionId === missionId);
  const missionData = MISSIONS.find((m) => m.id === missionId);
  const allMembers = useMemo(() => (founder ? [founder, ...roster] : roster), [founder, roster]);
  const partyMembers = useMemo(
    () => allMembers.filter((m) => mission?.memberIds.includes(m.id)),
    [allMembers, mission],
  );

  const enemies = useMemo(
    () => missionData?.enemyIds.map((id) => ENEMIES[id]).filter(Boolean) ?? [],
    [missionData],
  );

  const placedIds = new Set(formation.filter(Boolean));
  const unplacedMembers = partyMembers.filter((m) => !placedIds.has(m.id));
  const canStart = formation.some((id) => id !== null);
  const targetPriority: TargetPriority = mission?.targetPriority ?? DEFAULT_TARGET_PRIORITY;

  const handleAutoSuggest = useCallback(() => {
    const suggested = autoSuggestFormation(partyMembers);
    suggested.forEach((memberId, i) => setFormationSlot(i, memberId));
  }, [partyMembers, setFormationSlot]);

  const handleStart = useCallback(() => {
    // Flip mission.phase to 'in-combat' here (not on Enter-Battle click) so a
    // mid-formation close leaves the mission resumable instead of auto-resolving.
    if (missionId) updateMissionPhase(missionId, 'in-combat');
    setPhase('battle');
  }, [missionId, updateMissionPhase, setPhase]);

  const handlePriority = useCallback((priority: TargetPriority) => {
    if (missionId) setTargetPriority(missionId, priority);
  }, [missionId, setTargetPriority]);

  const onDragStart = (e: React.DragEvent, memberId: string) => {
    e.dataTransfer.setData('memberId', memberId);
  };
  const onDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    const memberId = e.dataTransfer.getData('memberId');
    if (memberId) setFormationSlot(slotIndex, memberId);
  };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  const getMember = (id: string | null) =>
    id ? partyMembers.find((m) => m.id === id) : null;

  return (
    <div className="combat-panel-formation">
      <div className="combat-panel-formation__columns">
        {/* Left: unplaced party */}
        <div>
          <div className="combat-panel-formation__column-title">Party</div>
          <div className="combat-panel-formation__roster">
            {unplacedMembers.map((m) => (
              <div
                key={m.id}
                className="combat-panel-formation__member"
                draggable
                onDragStart={(e) => onDragStart(e, m.id)}
              >
                <div className="combat-panel-formation__member-name">{m.name}</div>
                <div className="combat-panel-formation__member-meta">
                  Lv.{m.level} {m.archetype ?? 'warrior'}
                </div>
              </div>
            ))}
            {unplacedMembers.length === 0 && (
              <div className="combat-panel-formation__member combat-panel-formation__member--placed">
                All placed
              </div>
            )}
          </div>
        </div>

        {/* Center: 2×3 formation grid */}
        <div>
          <div className="combat-panel-formation__grid-headers">
            <div className="combat-panel-formation__grid-header">Back</div>
            <div className="combat-panel-formation__grid-header">Front</div>
          </div>
          <div className="combat-panel-formation__grid">
            {GRID_ORDER.map((slotIdx) => {
              const member = getMember(formation[slotIdx]);
              return (
                <div
                  key={slotIdx}
                  className={
                    'combat-panel-formation__slot' +
                    (member ? ' combat-panel-formation__slot--filled' : '')
                  }
                  onDrop={(e) => onDrop(e, slotIdx)}
                  onDragOver={onDragOver}
                  draggable={!!member}
                  onDragStart={member ? (e) => onDragStart(e, member.id) : undefined}
                  onClick={member ? () => setFormationSlot(slotIdx, null) : undefined}
                >
                  {member ? (
                    <>
                      <div className="combat-panel-formation__member-name">{member.name}</div>
                      <div className="combat-panel-formation__member-meta">Lv.{member.level}</div>
                    </>
                  ) : (
                    <div className="combat-panel-formation__slot--placeholder">
                      {SLOT_LABELS[slotIdx]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: enemy preview */}
        <div>
          <div className="combat-panel-formation__column-title" style={{ color: 'var(--ink-status-bad)' }}>
            Enemies
          </div>
          {enemies.map((enemy, i) => (
            <div key={`${enemy.id}-${i}`} className="combat-panel-formation__enemy">
              <div className="combat-panel-formation__enemy-name">{enemy.name}</div>
              <div className="combat-panel-formation__enemy-meta">Lv.{enemy.level}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Target priority selector — D2 (Focus / Balance) */}
      <div className="combat-panel-formation__priority">
        <button
          type="button"
          className={
            'combat-panel-formation__priority-btn' +
            (targetPriority === 'focus' ? ' combat-panel-formation__priority-btn--active' : '')
          }
          onClick={() => handlePriority('focus')}
        >
          🎯 Focus
        </button>
        <button
          type="button"
          className={
            'combat-panel-formation__priority-btn' +
            (targetPriority === 'balance' ? ' combat-panel-formation__priority-btn--active' : '')
          }
          onClick={() => handlePriority('balance')}
        >
          ⚖️ Balance
        </button>
      </div>

      <div className="combat-panel-formation__actions">
        <button type="button" className="combat-panel-btn" onClick={handleAutoSuggest}>
          Auto-Place
        </button>
        <button
          type="button"
          className="combat-panel-btn combat-panel-btn--primary"
          onClick={handleStart}
          disabled={!canStart}
        >
          Start Battle
        </button>
      </div>
    </div>
  );
}
