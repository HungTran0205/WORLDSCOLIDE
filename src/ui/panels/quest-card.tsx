/**
 * Quest card — list item in the unified Quest Board panel.
 * Click to select; selected state lifts + shows gold border.
 */

import { useMemo } from 'react';
import type { Mission } from '@/game/state/game-state';
import { ENEMIES } from '@/game/data/enemies';
import { getItemInfo } from '@/game/data/items';
import { GameIcon } from '@/ui/components/game-icon';

interface QuestCardProps {
  mission: Mission;
  selected: boolean;
  onClick: () => void;
  /** Fires on pointer enter — parent wires the debounced paper-flip SFX. */
  onHover?: () => void;
}

export function QuestCard({ mission, selected, onClick, onHover }: QuestCardProps) {
  const durationMin = Math.round(mission.durationMs / 60000);

  return (
    <button
      type="button"
      className={`quest-card${selected ? ' quest-card--selected' : ''}`}
      onClick={onClick}
      onPointerEnter={onHover}
      onFocus={onHover}
      aria-pressed={selected}
    >
      <div className="quest-card__header">
        <span className="quest-card__title">{mission.name}</span>
        <span className="quest-card__tier">
          <GameIcon
            category="badge"
            id={mission.tier}
            size={32}
            fallbackText={mission.tier}
            alt={`Tier ${mission.tier}`}
          />
        </span>
      </div>
      <div className="quest-card__badges">
        {mission.isBossGate && <span className="quest-badge quest-badge--gate">GATE</span>}
        {mission.chainId && <span className="quest-badge quest-badge--chain">Chain</span>}
      </div>
      <div className="quest-card__meta">
        <span>⏱ {durationMin}min</span>
        <span>💰 {mission.goldRewardMin}-{mission.goldRewardMax}</span>
        <span>✦ {mission.expReward} XP</span>
        <span>👥 {mission.requiredMembers}+ Lv.{mission.requiredLevel}+</span>
      </div>
      <DropPreview enemyIds={mission.enemyIds} />
    </button>
  );
}

/** Compact drop preview — unique item icons from enemy loot tables */
function DropPreview({ enemyIds }: { enemyIds: string[] }) {
  const drops = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; name: string }[] = [];
    for (const eid of enemyIds) {
      const enemy = ENEMIES[eid];
      if (!enemy) continue;
      for (const rule of enemy.loot) {
        if (!seen.has(rule.itemId)) {
          seen.add(rule.itemId);
          result.push({ id: rule.itemId, name: getItemInfo(rule.itemId).name });
        }
      }
    }
    return result;
  }, [enemyIds]);

  if (drops.length === 0) return null;
  return (
    <div className="quest-card__drops">
      <span className="quest-card__drops-label">Drops:</span>
      {drops.slice(0, 4).map((d) => (
        <span key={d.id} className="quest-card__drop">
          <GameIcon category="item" id={d.id} size={14} fallbackText={d.name.slice(0, 2)} />
        </span>
      ))}
      {drops.length > 4 && <span className="quest-card__drops-more">+{drops.length - 4}</span>}
    </div>
  );
}
