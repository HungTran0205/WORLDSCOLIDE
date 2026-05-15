/**
 * Result sub-phase — outcome banner, survivors / injured, rewards summary.
 * Reads `resultData` from combat-panel-store; close button finalises by
 * calling the panel close action which the parent shell wires into the
 * mission-resolution path.
 */

import { useMemo } from 'react';
import { useGameStore } from '@/game/state/store';
import { useCombatPanelStore } from '@/game/state/combat-panel-store';
import { MISSIONS } from '@/game/data/missions';

interface CombatPanelResultProps {
  onClose: () => void;
}

export function CombatPanelResult({ onClose }: CombatPanelResultProps) {
  const result = useCombatPanelStore((s) => s.resultData);
  const missionId = useCombatPanelStore((s) => s.missionId);
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);

  const allMembers = useMemo(() => (founder ? [founder, ...roster] : roster), [founder, roster]);
  const getName = (id: string) => allMembers.find((m) => m.id === id)?.name ?? id;
  const mission = MISSIONS.find((m) => m.id === missionId);

  if (!result) {
    return (
      <div className="combat-panel-result">
        <div className="combat-panel-result__banner">…</div>
      </div>
    );
  }

  const isVictory = result.outcome !== 'full-wipe';

  return (
    <div className="combat-panel-result">
      <div
        className={
          'combat-panel-result__banner ' +
          (isVictory
            ? 'combat-panel-result__banner--victory'
            : 'combat-panel-result__banner--defeat')
        }
      >
        {isVictory ? 'VICTORY' : 'DEFEAT'}
      </div>

      <div className="combat-panel-result__stats">
        <span>Duration: {Math.round(result.combatResult.durationMs / 1000)}s</span>
        <span>Damage: {result.combatResult.totalDamageDealt}</span>
      </div>

      {result.survivors.length > 0 && (
        <div className="combat-panel-result__list combat-panel-result__list--survivors">
          Survivors: {result.survivors.map(getName).join(', ')}
        </div>
      )}
      {result.injured.length > 0 && (
        <div className="combat-panel-result__list combat-panel-result__list--injured">
          Injured: {result.injured.map(getName).join(', ')}
        </div>
      )}

      {isVictory && mission && (
        <div className="combat-panel-result__rewards">
          <div className="combat-panel-result__rewards-title">Rewards</div>
          <div>Gold: {result.goldEarned}</div>
          <div>EXP: {result.expPerMember} / member</div>
        </div>
      )}

      <button type="button" className="combat-panel-btn combat-panel-btn--primary" onClick={onClose}>
        Continue
      </button>
    </div>
  );
}
