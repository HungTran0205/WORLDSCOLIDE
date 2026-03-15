import { useGameStore } from '@/game/state/store';
import { ROOM_DEFINITIONS } from '@/game/data/buildings';
import { getUpgradeCost } from '@/game/systems/guild-upgrade-system';
import { canPlaceRoom } from '@/game/systems/building-system';
import type { RoomType } from '@/game/state/game-state';
import '@/ui/styles/panels.css';

interface BuildMenuProps {
  onClose: () => void;
}

export function BuildMenu({ onClose }: BuildMenuProps) {
  const guildHall = useGameStore((s) => s.guildHall);
  const gold = useGameStore((s) => s.gold);
  const guildLevel = useGameStore((s) => s.guildLevel);
  const upgradeGuild = useGameStore((s) => s.upgradeGuild);
  const spendGold = useGameStore((s) => s.spendGold);
  const startPlacement = useGameStore((s) => s.startPlacement);

  const existingTypes = new Set(guildHall.rooms.map((r) => r.type));
  const canBuildMore = guildHall.rooms.length < guildHall.maxRooms;
  const upgradeCost = getUpgradeCost(guildLevel);

  const handleSelectRoom = (type: RoomType) => {
    const check = canPlaceRoom(guildHall, type, gold);
    if (!check.success) return;
    startPlacement(type);
    onClose(); // Close panel to show grid overlay
  };

  const handleUpgradeGuild = () => {
    if (spendGold(upgradeCost)) {
      upgradeGuild();
    }
  };

  return (
    <div className="panel-overlay">
      <h2>
        Build
        <button className="panel-close-btn" onClick={onClose}>Close</button>
      </h2>

      <div className="panel-section">
        <strong>Guild Level: {guildLevel}</strong>
        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
          Rooms: {guildHall.rooms.length}/{guildHall.maxRooms}
        </div>
        <button
          className="panel-btn"
          disabled={gold < upgradeCost || upgradeCost === Infinity}
          onClick={handleUpgradeGuild}
        >
          {upgradeCost === Infinity ? 'Max Level' : `Upgrade Guild (${upgradeCost} G)`}
        </button>
      </div>

      <h3 style={{ color: '#ffd700', marginTop: 16 }}>Available Rooms</h3>
      {ROOM_DEFINITIONS
        .filter((def) => !existingTypes.has(def.type))
        .map((def) => {
          const check = canPlaceRoom(guildHall, def.type, gold);
          return (
            <div key={def.type} className="panel-section">
              <strong>{def.name}</strong>
              <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                {def.description} ({def.width}x{def.depth})
              </div>
              <button
                className="panel-btn"
                disabled={!canBuildMore || !check.success}
                onClick={() => handleSelectRoom(def.type)}
              >
                Place ({def.baseCost} G)
              </button>
            </div>
          );
        })}

      <h3 style={{ color: '#ffd700', marginTop: 16 }}>Current Rooms</h3>
      {guildHall.rooms.map((room) => (
        <div key={room.id} className="panel-section">
          <strong>{room.type.replace(/-/g, ' ')}</strong>
          <span style={{ float: 'right', fontSize: '0.8rem' }}>Lv.{room.level}</span>
        </div>
      ))}
    </div>
  );
}
