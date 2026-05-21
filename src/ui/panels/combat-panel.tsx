/**
 * Combat panel — single overlay that hosts formation / battle / result
 * sub-phases. Mounts when combatPanelStore.isOpen, dims the guild scene, and
 * routes between sub-panels based on combatPanelStore.phase.
 *
 * Phase 4 will fill the battle sub-phase with a real mini-canvas; Phase 3
 * stubs it to verify the formation → battle → result transition flow.
 */

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCombatPanelStore } from '@/game/state/combat-panel-store';
import { useGameStore } from '@/game/state/store';
import { MISSIONS } from '@/game/data/missions';
import { tContent } from '@/i18n/content-localization';
import { CombatPanelHeader } from '@/ui/panels/combat-panel-header';
import { CombatPanelFormation } from '@/ui/panels/combat-panel-formation';
import { CombatPanelBattle } from '@/ui/panels/combat-panel-battle';
import { CombatPanelResult } from '@/ui/panels/combat-panel-result';
import '@/ui/styles/combat-panel.css';

export function CombatPanel() {
  const { t } = useTranslation();
  const isOpen = useCombatPanelStore((s) => s.isOpen);
  const phase = useCombatPanelStore((s) => s.phase);
  const missionId = useCombatPanelStore((s) => s.missionId);
  const closeCombatPanel = useCombatPanelStore((s) => s.closeCombatPanel);
  const exitArena = useGameStore((s) => s.exitArena);

  const missionData = MISSIONS.find((m) => m.id === missionId);

  /** Close handler — also unwinds legacy arena-slice state until Phase 7 cleanup */
  const handleClose = useCallback(() => {
    closeCombatPanel();
    exitArena();
  }, [closeCombatPanel, exitArena]);

  if (!isOpen) return null;

  const isBattlePhase = phase === 'battle';
  const overlayClass = 'combat-panel-overlay' + (isBattlePhase ? ' combat-panel-overlay--battle' : '');
  const panelClass = 'combat-panel' + (isBattlePhase ? ' combat-panel--phase-battle' : '');

  return (
    <div className={overlayClass} role="dialog" aria-modal="true">
      <div className={panelClass}>
        <CombatPanelHeader
          missionName={missionData ? tContent('missions', missionData.id, 'name', missionData.name) : t('combatPanel.fallbackName')}
          zone={missionData ? tContent('missions', missionData.id, 'zone', missionData.zone ?? '') : undefined}
          onClose={handleClose}
        />
        <div className="combat-panel-body">
          {phase === 'formation' && <CombatPanelFormation />}
          {phase === 'battle' && <CombatPanelBattle />}
          {phase === 'result' && <CombatPanelResult onClose={handleClose} />}
        </div>
      </div>
    </div>
  );
}
