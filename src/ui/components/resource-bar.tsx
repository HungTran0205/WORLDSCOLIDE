/** Compact resource display strip — shows key material quantities in the HUD. */

import { useGameStore } from '@/game/state/store';
import type { ItemID } from '@/game/data/items';

const HUD_RESOURCES: { id: ItemID; label: string; color: string }[] = [
  { id: 'WOOD', label: 'Wood', color: '#8B4513' },
  { id: 'STONE', label: 'Stone', color: '#808080' },
  { id: 'IRON_ORE', label: 'Iron', color: '#B0C4DE' },
];

export function ResourceBar() {
  const inventory = useGameStore((s) => s.inventory);

  return (
    <div className="resource-bar">
      {HUD_RESOURCES.map((r) => (
        <span key={r.id} className="resource-item" style={{ color: r.color }}>
          {r.label}: {inventory.items[r.id] ?? 0}
        </span>
      ))}
    </div>
  );
}
