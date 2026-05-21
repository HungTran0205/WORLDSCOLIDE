/**
 * Civilization selector — themed cards for the char-creation Civilization step.
 * MVP locks all civs except Linh Sơn: locked civs render dimmed with a lock glyph
 * and a "Coming Soon" tag, are not clickable or focusable, but remain visible.
 */

import { useTranslation } from 'react-i18next';
import { CIVILIZATIONS, CIV_CONFIG } from '@/game/data/civilization-config';
import type { Civilization } from '@/game/data/civilization-config';
import { civName, civRole, civDescription } from '@/i18n/content-wrappers';

/** Civs the player can actually pick in the MVP. */
const MVP_AVAILABLE: Civilization[] = ['LinhSon'];

interface CivSelectorProps {
  selectedCiv: Civilization | null;
  onSelect: (civ: Civilization) => void;
}

export function CivSelector({ selectedCiv, onSelect }: CivSelectorProps) {
  const { t } = useTranslation();
  return (
    <div className="civ-selector-grid">
      {CIVILIZATIONS.map((civ) => {
        const config = CIV_CONFIG[civ];
        const available = MVP_AVAILABLE.includes(civ);
        const isSelected = selectedCiv === civ;
        const cls = `civ-card${isSelected ? ' civ-card--selected' : ''}${available ? '' : ' civ-card--locked'}`;
        const accentStyle = isSelected
          ? { borderColor: config.colors.accent, boxShadow: `0 0 14px ${config.colors.accent}55`, background: `${config.colors.secondary}33` }
          : undefined;

        return (
          <button
            key={civ}
            type="button"
            className={cls}
            style={accentStyle}
            disabled={!available}
            tabIndex={available ? 0 : -1}
            aria-disabled={!available}
            aria-pressed={isSelected}
            onClick={available ? () => onSelect(civ) : undefined}
          >
            {!available && (
              <span className="civ-card-lock" aria-hidden>🔒</span>
            )}
            <div className="civ-card-name" style={{ color: config.colors.accent }}>
              {civName(civ)}
            </div>
            <div className="civ-card-role">{civRole(civ)}</div>
            <div className="civ-card-desc">{civDescription(civ)}</div>
            <div className="civ-card-bonuses">
              {config.statBonuses.map((b) => (
                <span
                  key={b.stat}
                  className="civ-card-bonus"
                  style={{ color: b.multiplier >= 1.2 ? '#9b59b6' : '#2ecc71' }}
                >
                  {b.stat}{b.multiplier >= 1.2 ? '++' : '+'}
                </span>
              ))}
            </div>
            {!available && <span className="civ-card-coming-soon">{t('common.comingSoon')}</span>}
          </button>
        );
      })}
    </div>
  );
}
