/**
 * Civilization selector — 3 themed cards for character creation.
 * Shows display name, role, description, and color-coded stat bonuses.
 */

import { CIVILIZATIONS, CIV_CONFIG } from '@/game/data/civilization-config';
import type { Civilization } from '@/game/data/civilization-config';

interface CivSelectorProps {
  selectedCiv: Civilization | null;
  onSelect: (civ: Civilization) => void;
}

export function CivSelector({ selectedCiv, onSelect }: CivSelectorProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 600, width: '100%' }}>
      {CIVILIZATIONS.map((civ) => {
        const config = CIV_CONFIG[civ];
        const isSelected = selectedCiv === civ;
        return (
          <div
            key={civ}
            onClick={() => onSelect(civ)}
            style={{
              padding: 12,
              borderRadius: 8,
              cursor: 'pointer',
              background: isSelected ? `${config.colors.secondary}33` : 'rgba(255,255,255,0.05)',
              border: isSelected
                ? `2px solid ${config.colors.accent}`
                : '2px solid rgba(255,255,255,0.1)',
              boxShadow: isSelected ? `0 0 12px ${config.colors.accent}44` : 'none',
              transition: 'all 0.2s',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1rem', fontWeight: 600, color: config.colors.accent, marginBottom: 4 }}>
              {config.displayName}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: 6 }}>
              {config.role}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: 8, lineHeight: 1.4 }}>
              {config.description}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
              {config.statBonuses.map((b) => (
                <span
                  key={b.stat}
                  style={{ color: b.multiplier >= 1.2 ? '#9b59b6' : '#2ecc71', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  {b.stat}{b.multiplier >= 1.2 ? '++' : '+'}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
