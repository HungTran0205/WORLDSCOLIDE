/** Build menu — 2-tab layout: Rooms | Furniture */

import { useState } from 'react';
import { useGameStore } from '@/game/state/store';
import { ROOM_DEFINITIONS, type ResourceCost } from '@/game/data/buildings';
import { FURNITURE_DEFINITIONS } from '@/game/data/furniture';
import { getItemInfo } from '@/game/data/items';
import { getUpgradeCost } from '@/game/systems/guild-upgrade-system';
import { canPlaceRoom } from '@/game/systems/building-system';
import { upgradeCoreFurniture } from '@/game/systems/furniture-system';
import type { RoomType } from '@/game/state/game-state';
import '@/ui/styles/panels.css';

/** Format a ResourceCost for display, e.g. "200 G + 10 Wood" */
function formatCost(cost: ResourceCost): string {
  const parts: string[] = [];
  if (cost.gold > 0) parts.push(`${cost.gold} G`);
  if (cost.items) {
    for (const [id, amount] of Object.entries(cost.items)) {
      if (amount && amount > 0) {
        parts.push(`${amount} ${getItemInfo(id as import('@/game/data/items').ItemID).name}`);
      }
    }
  }
  return parts.length > 0 ? parts.join(' + ') : 'Free';
}

interface BuildMenuProps { onClose: () => void; }

export function BuildMenu({ onClose }: BuildMenuProps) {
  const [activeTab, setActiveTab] = useState<'rooms' | 'furniture'>('rooms');

  return (
    <div className="panel-overlay">
      <h2>
        Build
        <button className="panel-close-btn" onClick={onClose}>Close</button>
      </h2>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {(['rooms', 'furniture'] as const).map((tab) => (
          <button key={tab} className="panel-btn" onClick={() => setActiveTab(tab)}
            style={{ opacity: activeTab === tab ? 1 : 0.5 }}>
            {tab === 'rooms' ? 'Rooms' : 'Furniture'}
          </button>
        ))}
      </div>
      {activeTab === 'rooms' && <RoomsTab onClose={onClose} />}
      {activeTab === 'furniture' && <FurnitureTab onClose={onClose} />}
    </div>
  );
}

function RoomsTab({ onClose }: { onClose: () => void }) {
  const guildHall = useGameStore((s) => s.guildHall);
  const gold = useGameStore((s) => s.gold);
  const inventory = useGameStore((s) => s.inventory);
  const guildLevel = useGameStore((s) => s.guildLevel);
  const upgradeGuild = useGameStore((s) => s.upgradeGuild);
  const spendGold = useGameStore((s) => s.spendGold);
  const startPlacement = useGameStore((s) => s.startPlacement);
  const upgradeRoom = useGameStore((s) => s.upgradeRoom);

  const existingTypes = new Set(guildHall.rooms.map((r) => r.type));
  const canBuildMore = guildHall.rooms.length < guildHall.maxRooms;
  const upgradeCost = getUpgradeCost(guildLevel);

  const handleSelectRoom = (type: RoomType) => {
    const check = canPlaceRoom(guildHall, type, gold, inventory);
    if (!check.success) return;
    startPlacement(type);
    onClose();
  };

  const handleUpgradeGuild = () => {
    if (spendGold(upgradeCost)) upgradeGuild();
  };

  return (
    <>
      <div className="panel-section">
        <strong>Guild Level: {guildLevel}</strong>
        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
          Rooms: {guildHall.rooms.length}/{guildHall.maxRooms}
        </div>
        <button className="panel-btn"
          disabled={gold < upgradeCost || upgradeCost === Infinity}
          onClick={handleUpgradeGuild}>
          {upgradeCost === Infinity ? 'Max Level' : `Upgrade Guild (${upgradeCost} G)`}
        </button>
      </div>

      <h3 style={{ color: '#ffd700', marginTop: 16 }}>Available Rooms</h3>
      {ROOM_DEFINITIONS
        .filter((def) => !existingTypes.has(def.type))
        .map((def) => {
          const check = canPlaceRoom(guildHall, def.type, gold, inventory);
          return (
            <div key={def.type} className="panel-section">
              <strong>{def.name}</strong>
              <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                {def.description} ({def.defaultWidth}x{def.defaultDepth})
              </div>
              <button className="panel-btn"
                disabled={!canBuildMore || !check.success}
                onClick={() => handleSelectRoom(def.type)}>
                Place ({formatCost(def.cost)})
              </button>
            </div>
          );
        })}

      <h3 style={{ color: '#ffd700', marginTop: 16 }}>Current Rooms</h3>
      {guildHall.rooms.map((room) => {
        const upgrade = upgradeCoreFurniture(room);
        return (
          <div key={room.id} className="panel-section">
            <strong>{room.type.replace(/-/g, ' ')}</strong>
            <span style={{ float: 'right', fontSize: '0.8rem' }}>Lv.{room.level}</span>
            {upgrade && (
              <button className="panel-btn" style={{ marginTop: 4 }}
                onClick={() => upgradeRoom(room.id)}>
                Upgrade Core ({formatCost(upgrade.cost)})
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}

function FurnitureTab({ onClose }: { onClose: () => void }) {
  const guildHall = useGameStore((s) => s.guildHall);
  const startFurniturePlacement = useGameStore((s) => s.startFurniturePlacement);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const selectedRoom = guildHall.rooms.find((r) => r.id === selectedRoomId);
  const upgradeFurniture = FURNITURE_DEFINITIONS.filter((f) => {
    if (f.category !== 'upgrade') return false;
    if (!selectedRoom) return false;
    return f.allowedRooms === 'any' || f.allowedRooms.includes(selectedRoom.type);
  });

  const handlePlace = (furnitureType: import('@/game/state/game-state').FurnitureType) => {
    if (!selectedRoomId) return;
    startFurniturePlacement(furnitureType, selectedRoomId);
    onClose();
  };

  return (
    <>
      <h3 style={{ color: '#ffd700' }}>Select Room</h3>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
        {guildHall.rooms.map((room) => (
          <button key={room.id} className="panel-btn"
            style={{ opacity: selectedRoomId === room.id ? 1 : 0.5 }}
            onClick={() => setSelectedRoomId(room.id)}>
            {room.type.replace(/-/g, ' ')}
          </button>
        ))}
      </div>

      {selectedRoom && upgradeFurniture.length > 0 && (
        <>
          <h3 style={{ color: '#ffd700' }}>Available Furniture</h3>
          {upgradeFurniture.map((def) => {
            const count = selectedRoom.furniture.filter((f) => f.type === def.type).length;
            const atMax = def.maxPerRoom !== undefined && count >= def.maxPerRoom;
            return (
              <div key={def.type} className="panel-section">
                <strong>{def.name}</strong>
                {def.maxPerRoom && (
                  <span style={{ float: 'right', fontSize: '0.8rem', color: '#aaa' }}>
                    {count}/{def.maxPerRoom}
                  </span>
                )}
                <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{def.description}</div>
                <button className="panel-btn" disabled={atMax}
                  onClick={() => handlePlace(def.type)}>
                  Place ({formatCost(def.cost)})
                </button>
              </div>
            );
          })}
        </>
      )}

      {selectedRoom && upgradeFurniture.length === 0 && (
        <div style={{ color: '#aaa', fontSize: '0.85rem' }}>
          No upgrade furniture available for this room type.
        </div>
      )}

      {!selectedRoom && (
        <div style={{ color: '#aaa', fontSize: '0.85rem' }}>
          Select a room to see available furniture.
        </div>
      )}
    </>
  );
}
