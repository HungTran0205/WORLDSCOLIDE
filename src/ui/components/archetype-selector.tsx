/**
 * Class step tiles for char-creation — founder-only archetype choices per civ.
 * Renders FOUNDER_CHOICES_BY_CIV[civ] as selectable visual tiles (no dropdowns):
 * weapon icon (PNG with onError placeholder), bold displayName, tagline, weaponLabel.
 * Selecting a tile drives the live CharacterPreview via onSelect(choice).
 */

import { useState } from 'react';
import { FOUNDER_CHOICES_BY_CIV } from '@/game/data/founder-archetypes';
import type { FounderArchetypeChoice } from '@/game/data/founder-archetypes';
import type { Civilization } from '@/game/data/civilization-config';

interface ArchetypeSelectorProps {
  civ: Civilization;
  selectedId?: FounderArchetypeChoice['id'];
  onSelect: (choice: FounderArchetypeChoice) => void;
}

export function ArchetypeSelector({ civ, selectedId, onSelect }: ArchetypeSelectorProps) {
  const choices = FOUNDER_CHOICES_BY_CIV[civ] ?? [];

  return (
    <div className="archetype-tile-grid">
      {choices.map((choice) => (
        <ArchetypeTile
          key={choice.id}
          choice={choice}
          selected={choice.id === selectedId}
          onSelect={() => onSelect(choice)}
        />
      ))}
    </div>
  );
}

function ArchetypeTile({ choice, selected, onSelect }: {
  choice: FounderArchetypeChoice;
  selected: boolean;
  onSelect: () => void;
}) {
  const [iconFailed, setIconFailed] = useState(false);

  return (
    <button
      type="button"
      className={`archetype-tile${selected ? ' archetype-tile--selected' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className="archetype-tile-icon">
        {!iconFailed ? (
          <img src={choice.iconPath} alt={choice.weaponLabel} onError={() => setIconFailed(true)} />
        ) : (
          <span className="archetype-tile-icon-fallback">{choice.weaponLabel.slice(0, 1)}</span>
        )}
      </div>
      <div className="archetype-tile-name">{choice.displayName}</div>
      <div className="archetype-tile-tagline">{choice.tagline}</div>
      <div className="archetype-tile-weapon">{choice.weaponLabel}</div>
    </button>
  );
}
