/**
 * Mask step tiles for char-creation — founder identity mask choices.
 * Renders FOUNDER_MASK_NARRATIVE then a grid of selectable pixel-art mask tiles
 * (front.png thumbnails, no dropdowns). Selecting a tile drives the live
 * CharacterPreview face overlay via onSelect(id). Tiles hide gracefully on
 * missing assets so the grid never shows broken-image icons.
 */

import { useState } from 'react';
import { getMaskAssetPath, FOUNDER_MASK_NARRATIVE } from '@/scene/sprites/mask-pool';

interface MaskSelectorProps {
  choices: string[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function MaskSelector({ choices, selectedId, onSelect }: MaskSelectorProps) {
  return (
    <div className="mask-selector">
      <p className="mask-selector-narrative">{FOUNDER_MASK_NARRATIVE}</p>
      <div className="mask-tile-grid">
        {choices.map((id) => (
          <MaskTile
            key={id}
            id={id}
            selected={id === selectedId}
            onSelect={() => onSelect(id)}
          />
        ))}
      </div>
    </div>
  );
}

function MaskTile({ id, selected, onSelect }: {
  id: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const [iconFailed, setIconFailed] = useState(false);

  return (
    <button
      type="button"
      className={`mask-tile${selected ? ' mask-tile--selected' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      {!iconFailed ? (
        <img
          className="mask-tile-img pixelated"
          src={getMaskAssetPath(id, 'front')}
          alt=""
          aria-hidden
          onError={() => setIconFailed(true)}
        />
      ) : (
        <span className="mask-tile-fallback" aria-hidden>?</span>
      )}
    </button>
  );
}
