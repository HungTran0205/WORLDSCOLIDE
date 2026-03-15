/**
 * Quest detail modal — shows full mission info with enemy preview and dispatch button.
 * Rendered as an overlay on top of the quest board.
 */

import type { Mission } from '@/game/state/game-state';
import { ENEMIES } from '@/game/data/enemies';
import '@/ui/styles/panels.css';

interface QuestDetailModalProps {
  mission: Mission;
  canDispatch: boolean;
  selectedCount: number;
  onDispatch: () => void;
  onClose: () => void;
}

function getEnemyPreview(enemyIds: string[]) {
  const counts = new Map<string, number>();
  enemyIds.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  return Array.from(counts.entries()).map(([id, count]) => {
    const enemy = ENEMIES[id];
    return { name: enemy?.name ?? id, level: enemy?.level ?? 0, count };
  });
}

export function QuestDetailModal({ mission, canDispatch, selectedCount, onDispatch, onClose }: QuestDetailModalProps) {
  const enemies = getEnemyPreview(mission.enemyIds);
  const durationMin = Math.round(mission.durationMs / 60000);

  return (
    <div className="confirm-dialog-overlay" onClick={onClose}>
      <div className="quest-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <strong style={{ color: '#ffd700', fontSize: '1.1rem' }}>{mission.name}</strong>
          <span className="quest-detail-modal__tier">Tier {mission.tier}</span>
        </div>

        {/* Zone + description */}
        {mission.zone && <div className="quest-detail-modal__zone">{mission.zone}</div>}
        {mission.description && (
          <p style={{ fontSize: '0.85rem', color: '#bbb', margin: '0 0 12px', lineHeight: 1.4 }}>
            {mission.description}
          </p>
        )}

        {/* Enemies */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '0.8rem', color: '#ffd700', marginBottom: 4 }}>Enemies</div>
          <ul className="quest-detail-modal__enemies">
            {enemies.map((e) => (
              <li key={e.name} className="quest-detail-modal__enemy">
                {e.name} Lv.{e.level} {e.count > 1 && `x${e.count}`}
              </li>
            ))}
          </ul>
        </div>

        {/* Rewards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.85rem', marginBottom: 12 }}>
          <div><span style={{ color: '#aaa' }}>Gold: </span><span style={{ color: '#ffd700' }}>{mission.goldRewardMin}-{mission.goldRewardMax}</span></div>
          <div><span style={{ color: '#aaa' }}>EXP: </span><span style={{ color: '#67b8e3' }}>{mission.expReward}</span></div>
          <div><span style={{ color: '#aaa' }}>Duration: </span>{durationMin}min</div>
          <div><span style={{ color: '#aaa' }}>Members: </span>{mission.requiredMembers}+ Lv.{mission.requiredLevel}+</div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="panel-btn"
            disabled={!canDispatch}
            onClick={onDispatch}
            style={{ flex: 1 }}
          >
            Dispatch ({selectedCount}/{mission.requiredMembers})
          </button>
          <button className="panel-btn" onClick={onClose} style={{ flex: 0, width: 'auto', padding: '8px 16px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
