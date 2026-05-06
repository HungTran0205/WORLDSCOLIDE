/**
 * Workshop queue footer — active task progress bars + pending list with
 * cancel buttons. Materials are consumed at task START, so cancelling a
 * pending (startedAt=null) task incurs no refund logic.
 */

import { useGameStore } from '@/game/state/store';
import { EQUIPMENT_DATABASE } from '@/game/data/equipment-templates';
import type { GuildFacility } from '@/game/state/game-state';
import type { WorkshopTask } from '@/game/data/workshop-types';

const TYPE_LABEL: Record<WorkshopTask['type'], string> = {
  CRAFT: 'Craft',
  ENHANCE_ADD: 'Add Slot',
  ENHANCE_REROLL: 'Reroll',
  REPAIR: 'Repair',
};

function describeTask(t: WorkshopTask): string {
  switch (t.payload.kind) {
    case 'CRAFT':
      return `${TYPE_LABEL[t.type]}: ${EQUIPMENT_DATABASE[t.payload.templateId]?.name ?? t.payload.templateId}`;
    case 'ENHANCE_ADD':
    case 'ENHANCE_REROLL':
    case 'REPAIR':
      return TYPE_LABEL[t.type];
  }
}

interface Props { facility: GuildFacility; }

export function WorkshopQueueFooter({ facility }: Props) {
  const cancelWorkshopTask = useGameStore((s) => s.cancelWorkshopTask);
  const queue = facility.workshopQueue ?? [];

  if (queue.length === 0) {
    return (
      <footer className="ws-footer">
        <div className="ws-empty">No tasks queued</div>
      </footer>
    );
  }

  const active = queue.filter((t) => t.startedAt !== null);
  const pending = queue.filter((t) => t.startedAt === null);

  return (
    <footer className="ws-footer">
      <div className="ws-footer-title">Queue ({queue.length})</div>

      {/* Active tasks with progress bars */}
      {active.map((t) => {
        const progress = t.totalSeconds > 0 ? 1 - t.remainingSeconds / t.totalSeconds : 1;
        return (
          <div key={t.id} className="ws-q-row ws-q-active">
            <span className="ws-q-name">{describeTask(t)}</span>
            <div className="ws-q-bar">
              <div className="ws-q-bar-fill" style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }} />
            </div>
            <span className="ws-q-time">{Math.ceil(t.remainingSeconds)}s</span>
            <button
              className="ws-btn ws-btn-small ws-btn-danger"
              onClick={() => cancelWorkshopTask(facility.id, t.id)}
              title="Cancel (no material refund)"
            >✕</button>
          </div>
        );
      })}

      {/* Pending tasks — cancellable */}
      {pending.map((t) => (
        <div key={t.id} className="ws-q-row ws-q-pending">
          <span className="ws-q-name">{describeTask(t)}</span>
          <span className="ws-q-pending-label">queued</span>
          <button
            className="ws-btn ws-btn-small ws-btn-ghost"
            onClick={() => cancelWorkshopTask(facility.id, t.id)}
          >✕</button>
        </div>
      ))}
    </footer>
  );
}
