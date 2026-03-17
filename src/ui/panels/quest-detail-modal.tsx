/**
 * Quest detail modal — self-contained: mission info + member selection + dispatch.
 * Rendered as an overlay on top of the quest board.
 */

import { useState, useMemo } from 'react';
import type { Member, Mission } from '@/game/state/game-state';
import { ENEMIES } from '@/game/data/enemies';
import { autoAssignMembers } from '@/game/utils/auto-assign-members';
import '@/ui/styles/panels.css';

interface QuestDetailModalProps {
  mission: Mission;
  availableMembers: Member[];
  gold: number;
  onDispatch: (memberIds: string[]) => void;
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

export function QuestDetailModal({ mission, availableMembers, gold, onDispatch, onClose }: QuestDetailModalProps) {
  const enemies = getEnemyPreview(mission.enemyIds);
  const durationMin = Math.round(mission.durationMs / 60000);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleAutoAssign = () => {
    setSelectedMembers(autoAssignMembers(availableMembers, mission));
  };

  const canDispatch = selectedMembers.length >= mission.requiredMembers;

  // Calculate mercenary fee if any merc is selected
  const mercFee = useMemo(() => {
    const hasMerc = availableMembers
      .filter((m) => selectedMembers.includes(m.id))
      .some((m) => m.rank === 'MERCENARY');
    return hasMerc ? Math.floor(mission.goldRewardMin * 0.5) : 0;
  }, [availableMembers, selectedMembers, mission.goldRewardMin]);

  const canAffordFee = gold >= mercFee;

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

        {/* Party Selection */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '0.8rem', color: '#ffd700', marginBottom: 4 }}>
            Select Party ({selectedMembers.length}/{mission.requiredMembers}+)
          </div>
          <div style={{ maxHeight: 160, overflowY: 'auto' }}>
            {availableMembers.map((m) => (
              <label
                key={m.id}
                style={{ display: 'flex', gap: 8, padding: '3px 0', cursor: 'pointer', alignItems: 'center', fontSize: '0.85rem' }}
              >
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(m.id)}
                  onChange={() => toggleMember(m.id)}
                  disabled={m.level < mission.requiredLevel}
                />
                <span style={{ color: m.level < mission.requiredLevel ? '#e74c3c' : '#ddd' }}>
                  {m.name} Lv.{m.level}
                </span>
                {m.rank === 'MERCENARY' && (
                  <span style={{ fontSize: '0.65rem', color: '#f0a500', border: '1px solid #f0a500', padding: '0 3px', borderRadius: 3 }}>
                    MERC
                  </span>
                )}
                {m.level < mission.requiredLevel && (
                  <span style={{ fontSize: '0.7rem', color: '#e74c3c' }}>Underleveled</span>
                )}
              </label>
            ))}
            {availableMembers.length === 0 && (
              <div style={{ fontSize: '0.8rem', color: '#666' }}>No idle members available</div>
            )}
          </div>
          {mercFee > 0 && (
            <div style={{ fontSize: '0.75rem', color: canAffordFee ? '#f0a500' : '#e74c3c', marginTop: 4 }}>
              Mercenary fee: {mercFee}g {!canAffordFee && '(insufficient gold)'}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="panel-btn"
            onClick={handleAutoAssign}
            style={{ flex: 0, width: 'auto', padding: '8px 12px', fontSize: '0.8rem' }}
          >
            Auto Assign
          </button>
          <button
            className="panel-btn"
            disabled={!canDispatch || (mercFee > 0 && !canAffordFee)}
            onClick={() => onDispatch(selectedMembers)}
            style={{ flex: 1 }}
          >
            Dispatch ({selectedMembers.length}/{mission.requiredMembers}+)
          </button>
          <button className="panel-btn" onClick={onClose} style={{ flex: 0, width: 'auto', padding: '8px 16px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
