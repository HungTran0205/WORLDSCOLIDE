/**
 * Workshop Repair tab — list damaged equipment (durability < max), sort by
 * % damage (most damaged first). Click → enqueue REPAIR task.
 * Includes both inventory and currently-equipped gear (slice's findEquipmentInState
 * supports both — repair task target lookup is global).
 */

import { useMemo } from 'react';
import { useGameStore } from '@/game/state/store';
import { EQUIPMENT_DATABASE } from '@/game/data/equipment-templates';
import type { GuildFacility, EquipmentItem, Member } from '@/game/state/game-state';

interface Props { facility: GuildFacility; }

export function WorkshopRepairTab({ facility }: Props) {
  const equipmentInventory = useGameStore((s) => s.inventory.equipmentInventory ?? []);
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);
  const addWorkshopTask = useGameStore((s) => s.addWorkshopTask);

  const damaged = useMemo(() => {
    const allMembers: Member[] = founder ? [founder, ...roster] : roster;
    const all: { eq: EquipmentItem; ownerName: string | null }[] = [];
    for (const e of equipmentInventory) all.push({ eq: e, ownerName: null });
    for (const m of allMembers) {
      if (!m.equipment) continue;
      for (const slot of ['weapon', 'armor', 'headgear'] as const) {
        const cur = m.equipment[slot];
        if (cur) all.push({ eq: cur, ownerName: m.name });
      }
    }
    return all
      .map(({ eq, ownerName }) => {
        const tpl = EQUIPMENT_DATABASE[eq.templateId];
        const max = Math.max(1, tpl.maxDurability);
        const pct = 1 - eq.durability / max;
        return { eq, tpl, pct, max, ownerName };
      })
      .filter((row) => row.pct > 0)
      .sort((a, b) => b.pct - a.pct);
  }, [equipmentInventory, founder, roster]);

  function handleRepair(equipmentInstanceId: string) {
    addWorkshopTask(facility.id, { kind: 'REPAIR', equipmentInstanceId });
  }

  return (
    <div className="ws-tab-body">
      <div className="ws-section">
        <div className="ws-section-title">Damaged Equipment</div>
        {damaged.length === 0 && <div className="ws-empty">All equipment in good repair.</div>}
        <div className="ws-eq-list">
          {damaged.map(({ eq, tpl, pct, max, ownerName }) => (
            <div key={eq.id} className="ws-eq-row">
              <div className="ws-eq-info">
                <span className="ws-eq-name">
                  {tpl.name}{ownerName ? ` (equipped by ${ownerName})` : ''}
                </span>
                <span className="ws-eq-meta">
                  {Math.floor(eq.durability)}/{max} dur · {Math.round(pct * 100)}% damaged
                </span>
                <div className="ws-dur-bar">
                  <div className="ws-dur-bar-fill" style={{ width: `${(1 - pct) * 100}%` }} />
                </div>
              </div>
              <button className="ws-btn ws-btn-small ws-btn-primary" onClick={() => handleRepair(eq.id)}>
                Repair
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
