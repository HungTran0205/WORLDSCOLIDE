/**
 * Shared inventory grid for Workshop Enhance and Dismantle tabs.
 * Shows both unequipped items (from equipmentInventory) and items
 * currently worn by guild members (locked, with "Equipped by X" badge).
 */

import { useMemo } from 'react';
import { useGameStore } from '@/game/state/store';
import { EQUIPMENT_DATABASE } from '@/game/data/equipment-templates';
import { GameIcon } from '@/ui/components/game-icon';
import { equipmentName } from '@/i18n/content-wrappers';
import type { EquipmentItem } from '@/game/state/game-state';

export interface InventoryEntry {
  item: EquipmentItem;
  /** Member name if worn, null if in inventory */
  equippedBy: string | null;
}

interface EquipmentGridProps {
  /** Only items from equipmentInventory (unequipped). Equipped items from members are added internally. */
  unequippedItems: EquipmentItem[];
  /** IDs that are eligible for the current action (enhance/dismantle). Equipped items are always locked. */
  eligibleIds?: Set<string>;
  selectedId?: string | null;
  onSelect?: (entry: InventoryEntry) => void;
  maxSlots?: number;
  emptyLabel?: string;
}

function formatSlotValue(statKey: string, value: number): string {
  if (statKey === 'HP') return `+${value}`;
  return `+${(value * 100).toFixed(0)}%`;
}

export function WorkshopEquipmentGrid({
  unequippedItems,
  eligibleIds,
  selectedId,
  onSelect,
  maxSlots = 4,
  emptyLabel = 'No equipment',
}: EquipmentGridProps) {
  const roster = useGameStore((s) => s.roster);
  const founder = useGameStore((s) => s.founder);

  const entries: InventoryEntry[] = useMemo(() => {
    const result: InventoryEntry[] = unequippedItems.map((item) => ({ item, equippedBy: null }));

    const allMembers = founder ? [founder, ...roster] : roster;
    for (const m of allMembers) {
      if (m.equipment?.weapon) result.push({ item: m.equipment.weapon, equippedBy: m.name });
      if (m.equipment?.armor) result.push({ item: m.equipment.armor, equippedBy: m.name });
    }
    return result;
  }, [unequippedItems, roster, founder]);

  if (entries.length === 0) {
    return <div className="ws-empty">{emptyLabel}</div>;
  }

  return (
    <div className="ws-inv-grid">
      {entries.map(({ item: eq, equippedBy }) => {
        const tpl = EQUIPMENT_DATABASE[eq.templateId];
        const slots = eq.slots ?? [];
        const isEquipped = equippedBy !== null;
        const isEligible = !isEquipped && (eligibleIds === undefined || eligibleIds.has(eq.id));
        const isSelected = selectedId === eq.id;

        return (
          <div
            key={eq.id}
            className={[
              'ws-inv-cell',
              isSelected ? 'is-selected' : '',
              isEquipped ? 'is-equipped' : '',
              !isEligible ? 'is-locked' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => isEligible && onSelect?.({ item: eq, equippedBy })}
            title={isEquipped ? `Equipped by ${equippedBy}` : tpl?.name}
          >
            {isEquipped && (
              <div className="ws-inv-equipped-badge">{equippedBy}</div>
            )}
            <div className="ws-inv-cell-icon">
              <GameIcon
                category="item"
                id={eq.templateId}
                size={36}
                fallbackText={tpl?.name?.slice(0, 2) ?? '?'}
              />
            </div>
            <div className="ws-inv-cell-name">{equipmentName(eq.templateId)}</div>
            {slots.length > 0 && (
              <div className="ws-inv-cell-slots">
                {slots.map((s, i) => (
                  <span key={i} className="ws-slot-chip">
                    {s.statKey}{formatSlotValue(s.statKey, s.value)}
                  </span>
                ))}
              </div>
            )}
            {slots.length === 0 && (
              <div className="ws-inv-cell-slots">
                <span className="ws-slot-chip">0/{maxSlots}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
