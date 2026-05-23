/**
 * Workshop queue footer — active task progress bars + pending list with
 * cancel buttons. Materials are consumed at task START, so cancelling a
 * pending (startedAt=null) task incurs no refund logic.
 *
 * NOTE: loop variable `t` (WorkshopTask) shadows the i18next `t` function name.
 * The translation hook is aliased as `translate` to avoid collision.
 */

import { useTranslation } from 'react-i18next';
import { EQUIPMENT_DATABASE } from '@/game/data/equipment-templates';
import { useGameStore } from '@/game/state/store';
import type { GuildFacility } from '@/game/state/game-state';
import type { WorkshopTask } from '@/game/data/workshop-types';

function describeTask(task: WorkshopTask, typeLabel: (key: WorkshopTask['type']) => string): string {
  switch (task.payload.kind) {
    case 'CRAFT':
      return `${typeLabel(task.type)}: ${EQUIPMENT_DATABASE[task.payload.templateId]?.name ?? task.payload.templateId}`;
    case 'ENHANCE_ADD':
    case 'ENHANCE_REROLL':
    case 'REPAIR':
      return typeLabel(task.type);
  }
}

interface Props { facility: GuildFacility; }

export function WorkshopQueueFooter({ facility }: Props) {
  const { t: translate } = useTranslation();
  const cancelWorkshopTask = useGameStore((s) => s.cancelWorkshopTask);
  const queue = facility.workshopQueue ?? [];

  // Maps task type enum to translated label
  function typeLabel(type: WorkshopTask['type']): string {
    return translate(`workshop.queue.typeLabel.${type}`);
  }

  if (queue.length === 0) {
    return (
      <footer className="ws-footer">
        <div className="ws-empty">{translate('workshop.queue.noTasksQueued')}</div>
      </footer>
    );
  }

  const active = queue.filter((t) => t.startedAt !== null);
  const pending = queue.filter((t) => t.startedAt === null);

  return (
    <footer className="ws-footer">
      <div className="ws-footer-title">
        {translate('workshop.queue.queueTitle', { count: queue.length })}
      </div>

      {/* Active tasks with progress bars */}
      {active.map((t) => {
        const progress = t.totalSeconds > 0 ? 1 - t.remainingSeconds / t.totalSeconds : 1;
        return (
          <div key={t.id} className="ws-q-row ws-q-active">
            <span className="ws-q-name">{describeTask(t, typeLabel)}</span>
            <div className="ws-q-bar">
              <div className="ws-q-bar-fill" style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }} />
            </div>
            <span className="ws-q-time">{Math.ceil(t.remainingSeconds)}s</span>
            <button
              className="ws-btn ws-btn-small ws-btn-danger"
              onClick={() => cancelWorkshopTask(facility.id, t.id)}
              title={translate('workshop.queue.cancelTitle')}
            >✕</button>
          </div>
        );
      })}

      {/* Pending tasks — cancellable, no material refund */}
      {pending.map((t) => (
        <div key={t.id} className="ws-q-row ws-q-pending">
          <span className="ws-q-name">{describeTask(t, typeLabel)}</span>
          <span className="ws-q-pending-label">{translate('workshop.queue.queuedLabel')}</span>
          <button
            className="ws-btn ws-btn-small ws-btn-ghost"
            onClick={() => cancelWorkshopTask(facility.id, t.id)}
          >✕</button>
        </div>
      ))}
    </footer>
  );
}
