/**
 * Workshop Blueprint list — saved recipes for batch crafting.
 * Embedded in the Craft tab footer. Reads facility.workshopBlueprints,
 * shows slot indicator (used / max-by-level), and dispatches Use/Edit/Delete
 * via local modal state. Save flow lives in the Craft tab (needs current
 * material selection).
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GuildFacility } from '@/game/state/game-state';
import type { WorkshopBlueprint } from '@/game/data/workshop-types';
import { WORKSHOP_CONFIG } from '@/game/data/workshop-config';
import { WorkshopBlueprintCard } from './workshop-blueprint-card';
import {
  BlueprintUseModal,
  BlueprintEditModal,
  BlueprintDeleteConfirm,
} from './workshop-blueprint-modals';

type ModalKind = 'use' | 'edit' | 'delete';
interface OpenModal { kind: ModalKind; blueprintId: string; }

interface Props { facility: GuildFacility; }

export function WorkshopBlueprintList({ facility }: Props) {
  const { t } = useTranslation();
  const blueprints = facility.workshopBlueprints ?? [];
  const slotLimit =
    WORKSHOP_CONFIG.blueprintSlotsByLevel[facility.level - 1] ??
    WORKSHOP_CONFIG.blueprintSlotsByLevel[0];

  const [open, setOpen] = useState<OpenModal | null>(null);
  // Always re-resolve from latest facility prop so updates re-render modals correctly
  const activeBp: WorkshopBlueprint | undefined = open
    ? blueprints.find((b) => b.id === open.blueprintId)
    : undefined;

  // Sort by createdAt asc (stable ordering, oldest first)
  const sorted = blueprints.slice().sort((a, b) => a.createdAt - b.createdAt);

  return (
    <div className="ws-section ws-bp-section">
      <div className="ws-bp-header">
        <span className="ws-section-title">{t('workshop.blueprint.list.title')}</span>
        <span className="ws-bp-slots-badge">
          {t('workshop.blueprint.list.slots', { used: blueprints.length, limit: slotLimit })}
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="ws-empty ws-bp-empty">{t('workshop.blueprint.list.empty')}</div>
      ) : (
        <div className="ws-bp-cards">
          {sorted.map((bp) => (
            <WorkshopBlueprintCard
              key={bp.id}
              blueprint={bp}
              onUse={() => setOpen({ kind: 'use', blueprintId: bp.id })}
              onEdit={() => setOpen({ kind: 'edit', blueprintId: bp.id })}
              onDelete={() => setOpen({ kind: 'delete', blueprintId: bp.id })}
            />
          ))}
        </div>
      )}

      {open && activeBp && open.kind === 'use' && (
        <BlueprintUseModal facility={facility} blueprint={activeBp} onClose={() => setOpen(null)} />
      )}
      {open && activeBp && open.kind === 'edit' && (
        <BlueprintEditModal facility={facility} blueprint={activeBp} onClose={() => setOpen(null)} />
      )}
      {open && activeBp && open.kind === 'delete' && (
        <BlueprintDeleteConfirm facility={facility} blueprint={activeBp} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}
