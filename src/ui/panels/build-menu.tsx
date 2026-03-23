/** Build menu — 2-tab layout: Floor | Furniture */

import { useState } from 'react';
import { useGameStore } from '@/game/state/store';
import { FLOOR_TILE_COLORS } from '@/game/state/game-state';
import type { FurnitureType } from '@/game/state/game-state';
import { FLOOR_TILE_COST, GUILD_UPGRADES, getUnlockedFurniture } from '@/game/data/buildings';
import { FURNITURE_DEFINITIONS } from '@/game/data/furniture';
import { getUpgradeCost } from '@/game/systems/guild-upgrade-system';
import { GameIcon } from '@/ui/components/game-icon';
import { CostDisplay } from '@/ui/components/cost-display';
import '@/ui/styles/panels.css';

interface BuildMenuProps { onClose: () => void; }

export function BuildMenu({ onClose }: BuildMenuProps) {
  const [activeTab, setActiveTab] = useState<'floor' | 'furniture'>('floor');

  return (
    <div className="panel-overlay">
      <h2>
        Build
        <button className="panel-close-btn" onClick={onClose}>Close</button>
      </h2>
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {(['floor', 'furniture'] as const).map((tab) => (
          <button key={tab} className="panel-btn" onClick={() => setActiveTab(tab)}
            style={{ opacity: activeTab === tab ? 1 : 0.5 }}>
            {tab === 'floor' ? 'Floor' : 'Furniture'}
          </button>
        ))}
      </div>
      {activeTab === 'floor' && <FloorTab onClose={onClose} />}
      {activeTab === 'furniture' && <FurnitureTab onClose={onClose} />}
    </div>
  );
}

function FloorTab({ onClose }: { onClose: () => void }) {
  const gold = useGameStore((s) => s.gold);
  const floorTiles = useGameStore((s) => s.guildHall.floorTiles);
  const startFloorPaint = useGameStore((s) => s.startFloorPaint);
  const startFloorErase = useGameStore((s) => s.startFloorErase);
  const [selectedColor, setSelectedColor] = useState(FLOOR_TILE_COLORS[0].hex);

  const handlePaint = () => {
    startFloorPaint(selectedColor);
    onClose();
  };
  const handleErase = () => {
    startFloorErase();
    onClose();
  };

  return (
    <>
      <div className="panel-section">
        <strong>Floor Tiles</strong>
        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
          Total: {floorTiles.length} tiles &bull; Cost: {FLOOR_TILE_COST}G per tile
        </div>
      </div>

      <h3 style={{ color: '#ffd700' }}>Color</h3>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
        {FLOOR_TILE_COLORS.map((c) => (
          <button key={c.id}
            title={c.name}
            onClick={() => setSelectedColor(c.hex)}
            style={{
              width: 32, height: 32,
              background: c.hex,
              border: selectedColor === c.hex ? '3px solid #ffd700' : '2px solid #555',
              borderRadius: 4, cursor: 'pointer',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="panel-btn" onClick={handlePaint}
          disabled={gold < FLOOR_TILE_COST}>
          Paint ({FLOOR_TILE_COST}G/tile)
        </button>
        <button className="panel-btn" onClick={handleErase}
          style={{ background: '#8B0000' }}>
          Erase
        </button>
      </div>
    </>
  );
}

function FurnitureTab({ onClose }: { onClose: () => void }) {
  const guildLevel = useGameStore((s) => s.guildLevel);
  const guildHall = useGameStore((s) => s.guildHall);
  const gold = useGameStore((s) => s.gold);
  const startFurniturePlacement = useGameStore((s) => s.startFurniturePlacement);
  const upgradeFurniture = useGameStore((s) => s.upgradeFurniture);
  const upgradeGuild = useGameStore((s) => s.upgradeGuild);
  const spendGold = useGameStore((s) => s.spendGold);
  const unlockedTypes = getUnlockedFurniture(guildLevel);
  const upgradeCost = getUpgradeCost(guildLevel);

  const handlePlace = (type: FurnitureType) => {
    startFurniturePlacement(type);
    onClose();
  };

  const handleUpgradeGuild = () => {
    if (spendGold(upgradeCost)) upgradeGuild();
  };

  return (
    <>
      <div className="panel-section">
        <strong>Guild Level: {guildLevel}</strong>
        <button className="panel-btn"
          disabled={gold < upgradeCost || upgradeCost === Infinity}
          onClick={handleUpgradeGuild}>
          {upgradeCost === Infinity ? 'Max Level' : `Upgrade Guild (${upgradeCost} G)`}
        </button>
      </div>

      <h3 style={{ color: '#ffd700' }}>Available</h3>
      {FURNITURE_DEFINITIONS.map((def) => {
        const unlocked = unlockedTypes.includes(def.type);
        const count = guildHall.furniture.filter((f) => f.type === def.type).length;
        const atMax = def.maxPerGuild !== undefined && count >= def.maxPerGuild;
        const placed = guildHall.furniture.find((f) => f.type === def.type);

        return (
          <div key={def.type} className="panel-section" style={{ opacity: unlocked ? 1 : 0.4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GameIcon category="furniture" id={def.type} size={32} fallbackText={def.name.slice(0, 2)} />
              <div style={{ flex: 1 }}>
                <strong>{def.name}</strong>
                {def.category === 'core' && ' \u2605'}
                {def.maxPerGuild && (
                  <span style={{ float: 'right', fontSize: '0.8rem', color: '#aaa' }}>
                    {count}/{def.maxPerGuild}
                  </span>
                )}
                <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{def.description}</div>
              </div>
            </div>

            {/* Place button */}
            {!atMax && unlocked && (
              <button className="panel-btn" onClick={() => handlePlace(def.type)}
                disabled={gold < def.cost.gold}>
                Place (<CostDisplay cost={def.cost} />)
              </button>
            )}

            {/* Upgrade button for placed core furniture */}
            {def.category === 'core' && placed && def.upgradeCosts && (
              (() => {
                const nextIdx = placed.level - 1;
                if (nextIdx >= def.upgradeCosts!.length) return null;
                const cost = def.upgradeCosts![nextIdx];
                return (
                  <button className="panel-btn" style={{ marginTop: 4 }}
                    onClick={() => upgradeFurniture(placed.id)}>
                    Upgrade Lv.{placed.level}&rarr;{placed.level + 1} (<CostDisplay cost={cost} />)
                  </button>
                );
              })()
            )}

            {/* Locked indicator */}
            {!unlocked && (
              <div style={{ fontSize: '0.75rem', color: '#ff6347' }}>
                Locked &mdash; Guild Lv.{GUILD_UPGRADES.find((u) => u.unlockedFurniture.includes(def.type))?.level} needed
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
