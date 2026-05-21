/**
 * Combat panel header — mission name + zone label + close button.
 * Pure presentational; close action comes from parent (combat-panel shell)
 * because closing during the battle phase may need different semantics
 * (instant resolve vs. abandon — see Phase 6).
 */

import { useTranslation } from 'react-i18next';

interface CombatPanelHeaderProps {
  missionName: string;
  zone?: string;
  onClose: () => void;
}

export function CombatPanelHeader({ missionName, zone, onClose }: CombatPanelHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="combat-panel-header">
      <h2 className="combat-panel-header__title">
        ⚔️ {missionName}
        {zone && <span className="combat-panel-header__zone">— {zone}</span>}
      </h2>
      <button
        type="button"
        className="combat-panel-header__close"
        onClick={onClose}
        aria-label={t('combatPanel.header.closeAria')}
      >
        ✕
      </button>
    </div>
  );
}
