/**
 * Workshop Room v2 — content only.
 * Shell (chrome, header, close button, open/close animation, SFX) is owned by
 * PanelFrame. This file contains only content-specific JSX.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import type { GuildFacility } from '@/game/state/game-state';
import { WorkshopCraftTab } from './workshop/workshop-craft-tab';
import { WorkshopEnhanceTab } from './workshop/workshop-enhance-tab';
import { WorkshopRepairTab } from './workshop/workshop-repair-tab';
import { WorkshopDismantleTab } from './workshop/workshop-dismantle-tab';
import { WorkshopQueueFooter } from './workshop/workshop-queue-footer';
import { PanelFrame } from '@/ui/components/panel-frame';
import '@/ui/styles/workshop-panel.css';

export type WorkshopTabId = 'craft' | 'enhance' | 'repair' | 'dismantle';

interface WorkshopPanelProps {
  facility: GuildFacility;
  onClose: () => void;
}

export function WorkshopPanel({ facility, onClose }: WorkshopPanelProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<WorkshopTabId>('craft');
  const facilities = useGameStore((s) => s.facilities);

  // Pull live facility from store so workshopQueue / blueprints update reactively
  const live = facilities.find((f) => f.id === facility.id) ?? facility;
  const queue = live.workshopQueue ?? [];
  const activeCount = queue.filter((item) => item.startedAt !== null).length;
  const workerCount = live.assignedMemberIds.length;

  // Compute instance # if multiple workshops
  const sameType = facilities.filter((f) => f.type === 'workshop' && f.level > 0);
  const instanceNum = sameType.length > 1 ? sameType.findIndex((f) => f.id === live.id) + 1 : null;
  const baseName = t('workshop.title');
  const title = instanceNum ? `${baseName} #${instanceNum}` : baseName;

  return (
    <div className="ws-positioner">
      <PanelFrame title={title} onClose={onClose} variant="panel">
        {/* ── Header meta: level badge, worker count ── */}
        <div className="ws-meta">
          <span className="ws-badge">Lv.{live.level}</span>
          <span
            className={`ws-worker-badge ${activeCount === workerCount && workerCount > 0 ? 'is-full' : ''}`}
            title={`${activeCount} active / ${workerCount} workers assigned`}
          >
            {activeCount}/{workerCount} workers
          </span>
        </div>

        {/* ── Tabs ── */}
        <nav className="ws-tabs">
          {(['craft', 'enhance', 'repair', 'dismantle'] as WorkshopTabId[]).map((id) => (
            <button
              key={id}
              className={`ws-tab ${tab === id ? 'is-active' : ''}`}
              onClick={() => setTab(id)}
            >
              {t(`workshop.tabs.${id}`)}
            </button>
          ))}
        </nav>

        {/* ── Tab body ── */}
        <section className="ws-body">
          {tab === 'craft'     && <WorkshopCraftTab     facility={live} />}
          {tab === 'enhance'   && <WorkshopEnhanceTab   facility={live} />}
          {tab === 'repair'    && <WorkshopRepairTab    facility={live} />}
          {tab === 'dismantle' && <WorkshopDismantleTab />}
        </section>

        {/* ── Footer queue ── */}
        <WorkshopQueueFooter facility={live} />
      </PanelFrame>
    </div>
  );
}
