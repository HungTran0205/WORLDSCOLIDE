/**
 * Result sub-phase — outcome banner, survivors / injured, rewards summary.
 * Reads `resultData` from combat-panel-store; close button finalises by
 * calling the panel close action which the parent shell wires into the
 * mission-resolution path.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import { useCombatPanelStore } from '@/game/state/combat-panel-store';
import { MISSIONS } from '@/game/data/missions';
import { TUTORIAL_BEAR_MISSION_ID } from '@/game/data/tutorial-data';

interface CombatPanelResultProps {
  onClose: () => void;
}

export function CombatPanelResult({ onClose }: CombatPanelResultProps) {
  const { t } = useTranslation();
  const result = useCombatPanelStore((s) => s.resultData);
  const missionId = useCombatPanelStore((s) => s.missionId);
  const setPhase = useCombatPanelStore((s) => s.setPhase);
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
        {isVictory ? t('combatPanel.result.victory') : t('combatPanel.result.defeat')}
      </div>

      <div className="combat-panel-result__stats">
        <span>{t('combatPanel.result.duration', { secs: Math.round(result.combatResult.durationMs / 1000) })}</span>
        <span>{t('combatPanel.result.damage', { amount: result.combatResult.totalDamageDealt })}</span>
      </div>

      {result.survivors.length > 0 && (
        <div className="combat-panel-result__list combat-panel-result__list--survivors">
          {t('combatPanel.result.survivors', { names: result.survivors.map(getName).join(', ') })}
        </div>
      )}
      {result.injured.length > 0 && (
        <div className="combat-panel-result__list combat-panel-result__list--injured">
          {t('combatPanel.result.injured', { names: result.injured.map(getName).join(', ') })}
        </div>
      )}

      {isVictory && mission && (
        <div className="combat-panel-result__rewards">
          <div className="combat-panel-result__rewards-title">{t('combatPanel.result.rewards')}</div>
          <div>{t('combatPanel.result.gold', { amount: result.goldEarned })}</div>
          <div>{t('combatPanel.result.expPerMember', { amount: result.expPerMember })}</div>
        </div>
      )}

      {/* Tutorial soft-retry: the HP-floor makes the Moonbear fight a guaranteed
          win, so this is a safety net for the rare simulator/edge loss.
          Re-entering 'battle' re-inits the engine with full-HP allies
          (formation persists across the result phase). */}
      {missionId === TUTORIAL_BEAR_MISSION_ID && result.outcome !== 'victory' && (
        <button
          type="button"
          className="combat-panel-btn"
          onClick={() => setPhase('battle')}
        >
          {t('combatPanel.result.tryAgain')}
        </button>
      )}

      <button type="button" className="combat-panel-btn combat-panel-btn--primary" onClick={onClose}>
        {t('combatPanel.result.continue')}
      </button>
    </div>
  );
}
