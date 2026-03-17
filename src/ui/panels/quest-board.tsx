import { useState, useMemo } from 'react';
import type { QuestTier } from '@/game/state/game-state';
import { useGameStore } from '@/game/state/store';
import type { Mission } from '@/game/state/game-state';
import { MISSIONS } from '@/game/data/missions';
import { getItemInfo } from '@/game/data/items';
import { ENEMIES } from '@/game/data/enemies';
import { validateDispatch, createActiveMission } from '@/game/systems/mission-dispatch';
import { QUEST_BOARD_TIER_BY_LEVEL } from '@/game/data/buildings';
import { QuestDetailModal } from '@/ui/panels/quest-detail-modal';
import { ActiveMissionsList } from '@/ui/panels/active-missions-list';
import { playSFX } from '@/audio/audio-manager';
import { AUDIO } from '@/audio/audio-keys';
import '@/ui/styles/panels.css';

const TIER_ORDER: QuestTier[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];

interface QuestBoardProps {
  onClose: () => void;
}

export function QuestBoard({ onClose }: QuestBoardProps) {
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);
  const guildHall = useGameStore((s) => s.guildHall);
  const gold = useGameStore((s) => s.gold);
  const activeMissions = useGameStore((s) => s.activeMissions);
  const dispatchMission = useGameStore((s) => s.dispatchMission);
  const spendGold = useGameStore((s) => s.spendGold);
  const updateMemberStatus = useGameStore((s) => s.updateMemberStatus);

  const availableMembers = useMemo(() => {
    const all = founder ? [founder, ...roster] : roster;
    return all.filter((m) => m.status === 'idle');
  }, [founder, roster]);

  // Determine max quest tier from quest-board furniture level
  const unlockedTiers = useMemo(() => {
    const guildHallRoom = guildHall.rooms.find((r) => r.type === 'guild-hall');
    const questBoardFurniture = guildHallRoom?.furniture.find((f) => f.type === 'quest-board');
    const maxLevel = questBoardFurniture?.level ?? 1;
    const maxTier = QUEST_BOARD_TIER_BY_LEVEL[maxLevel] ?? 'F';
    const maxIdx = TIER_ORDER.indexOf(maxTier);
    return TIER_ORDER.slice(0, maxIdx + 1);
  }, [guildHall]);

  const [filterTier, setFilterTier] = useState<QuestTier | 'all'>('all');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  const filteredMissions = MISSIONS.filter(
    (m) => (filterTier === 'all' || m.tier === filterTier) && unlockedTiers.includes(m.tier),
  );

  /** Dispatch from modal — receives selected member IDs */
  const handleDispatchFromModal = (memberIds: string[]) => {
    if (!selectedMission) return;
    const allMembers = [...(founder ? [founder] : []), ...roster];
    const party = allMembers.filter((m) => memberIds.includes(m.id));
    const validation = validateDispatch(selectedMission, party, gold);
    if (!validation.valid) return;
    if (validation.mercenaryFee > 0 && !spendGold(validation.mercenaryFee)) return;
    const now = Date.now();
    dispatchMission(createActiveMission(selectedMission, memberIds, now));
    memberIds.forEach((id) => updateMemberStatus(id, 'on-mission'));
    setSelectedMission(null);
    playSFX(AUDIO.SFX_DISPATCH);
  };

  return (
    <div className="panel-overlay">
      <h2>
        Quest Board
        <button className="panel-close-btn" onClick={onClose}>Close</button>
      </h2>

      {/* Tier filter */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        <button
          className="panel-btn"
          style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem' }}
          onClick={() => setFilterTier('all')}
        >
          All
        </button>
        {unlockedTiers.map((tier) => (
          <button
            key={tier}
            className="panel-btn"
            style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem' }}
            onClick={() => setFilterTier(tier)}
          >
            {tier}
          </button>
        ))}
      </div>

      {/* Available missions */}
      {filteredMissions.map((mission) => (
        <div
          key={mission.id}
          className="panel-section"
          style={{ cursor: 'pointer' }}
          onClick={() => setSelectedMission(mission)}
        >
          <strong>{mission.name}</strong>
          <span style={{ float: 'right', color: '#ffd700' }}>Tier {mission.tier}</span>
          <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: 4 }}>
            Duration: {Math.round(mission.durationMs / 60000)}min |
            Gold: {mission.goldRewardMin}-{mission.goldRewardMax} |
            EXP: {mission.expReward} |
            Min Members: {mission.requiredMembers} | Lv.{mission.requiredLevel}+
          </div>
          <PotentialDrops enemyIds={mission.enemyIds} />
        </div>
      ))}

      {/* Quest detail modal — self-contained with member selection */}
      {selectedMission && (
        <QuestDetailModal
          key={selectedMission.id}
          mission={selectedMission}
          availableMembers={availableMembers}
          gold={gold}
          onDispatch={handleDispatchFromModal}
          onClose={() => setSelectedMission(null)}
        />
      )}

      {/* Active missions */}
      {activeMissions.length > 0 && (
        <ActiveMissionsList activeMissions={activeMissions} />
      )}
    </div>
  );
}

/** Show unique potential item drops for a mission's enemies */
function PotentialDrops({ enemyIds }: { enemyIds: string[] }) {
  const dropNames = useMemo(() => {
    const seen = new Set<string>();
    for (const eid of enemyIds) {
      const enemy = ENEMIES[eid];
      if (!enemy) continue;
      for (const rule of enemy.loot) {
        seen.add(getItemInfo(rule.itemId).name);
      }
    }
    return [...seen];
  }, [enemyIds]);

  if (dropNames.length === 0) return null;
  return (
    <div style={{ fontSize: '0.75rem', color: '#a8d8ea', marginTop: 2 }}>
      Drops: {dropNames.join(', ')}
    </div>
  );
}
