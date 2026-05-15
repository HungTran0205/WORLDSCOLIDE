/**
 * Workshop Room v2 — main panel shell.
 * 4 tabs: Craft / Enhance / Repair / Dismantle. Mirrors alchemy panel's
 * camera-detected auto-open pattern (no separate trigger flag).
 */

import { useState } from 'react';
import { useGameStore } from '@/game/state/store';
import type { GuildFacility } from '@/game/state/game-state';
import { WorkshopCraftTab } from './workshop/workshop-craft-tab';
import { WorkshopEnhanceTab } from './workshop/workshop-enhance-tab';
import { WorkshopRepairTab } from './workshop/workshop-repair-tab';
import { WorkshopDismantleTab } from './workshop/workshop-dismantle-tab';
import { WorkshopQueueFooter } from './workshop/workshop-queue-footer';
import '@/ui/styles/workshop-panel.css';

export type WorkshopTabId = 'craft' | 'enhance' | 'repair' | 'dismantle';

interface WorkshopPanelProps {
  facility: GuildFacility;
  onClose: () => void;
}

const TAB_LABELS: Record<WorkshopTabId, string> = {
  craft: 'Crafting',
  enhance: 'Enhance',
  repair: 'Repair',
  dismantle: 'Dismantle',
};

export function WorkshopPanel({ facility, onClose }: WorkshopPanelProps) {
  const [tab, setTab] = useState<WorkshopTabId>('craft');
  const facilities = useGameStore((s) => s.facilities);

  // Pull live facility from store so workshopQueue / blueprints update reactively
  const live = facilities.find((f) => f.id === facility.id) ?? facility;
  const queue = live.workshopQueue ?? [];
  const activeCount = queue.filter((t) => t.startedAt !== null).length;
  const workerCount = live.assignedMemberIds.length;

  // Compute instance # if multiple workshops
  const sameType = facilities.filter((f) => f.type === 'workshop' && f.level > 0);
  const instanceNum = sameType.length > 1 ? sameType.findIndex((f) => f.id === live.id) + 1 : null;
  const title = instanceNum ? `Workshop #${instanceNum}` : 'Workshop';

  return (
    <div className="ws-overlay" onClick={onClose}>
      <div className="ws-panel" onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <header className="ws-header">
          <div className="ws-header-info">
            <span className="ws-title">{title}</span>
            <span className="ws-badge">Lv.{live.level}</span>
            <span
              className={`ws-worker-badge ${activeCount === workerCount && workerCount > 0 ? 'is-full' : ''}`}
              title={`${activeCount} active / ${workerCount} workers assigned`}
            >
              {activeCount}/{workerCount} workers
            </span>
          </div>
          <button className="ws-close" onClick={onClose}>✕</button>
        </header>

        {/* ── Tabs ── */}
        <nav className="ws-tabs">
          {(Object.keys(TAB_LABELS) as WorkshopTabId[]).map((id) => (
            <button
              key={id}
              className={`ws-tab ${tab === id ? 'is-active' : ''}`}
              onClick={() => setTab(id)}
            >
              {TAB_LABELS[id]}
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
      </div>
    </div>
  );
}
