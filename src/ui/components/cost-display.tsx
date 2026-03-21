/** Renders a ResourceCost with item icons — used in Build Menu */

import { getItemInfo } from '@/game/data/items';
import type { ItemID } from '@/game/data/items';
import type { ResourceCost } from '@/game/data/buildings';
import { GameIcon } from './game-icon';

export function CostDisplay({ cost }: { cost: ResourceCost }) {
  const parts: React.ReactNode[] = [];
  if (cost.gold > 0) parts.push(<span key="gold" style={{ color: '#ffd700' }}>{cost.gold} G</span>);
  if (cost.items) {
    for (const [id, amount] of Object.entries(cost.items)) {
      if (amount && amount > 0) {
        parts.push(
          <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            {amount} <GameIcon category="item" id={id} size={14} fallbackText={getItemInfo(id as ItemID).name.slice(0, 2)} />
          </span>
        );
      }
    }
  }
  if (parts.length === 0) return <>Free</>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      {parts.map((p, i) => (
        <span key={i}>{i > 0 && ' + '}{p}</span>
      ))}
    </span>
  );
}
