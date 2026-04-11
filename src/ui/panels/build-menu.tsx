/** Build menu — Furniture + Facilities tabs */

import { useState } from 'react';
import { useGameStore } from '@/game/state/store';
import type { FurnitureType, FacilityType } from '@/game/state/game-state';
import { GUILD_UPGRADES, getUnlockedFurniture } from '@/game/data/buildings';
import { FURNITURE_DEFINITIONS } from '@/game/data/furniture';
import { FACILITY_DEFINITIONS } from '@/game/data/facility-definitions';
import { getUpgradeCost } from '@/game/systems/guild-upgrade-system';
import { GameIcon } from '@/ui/components/game-icon';
import { CostDisplay } from '@/ui/components/cost-display';
import { FacilitySlotPicker } from '@/ui/components/facility-slot-picker';
import '@/ui/styles/panels.css';

interface BuildMenuProps { onClose: () => void; }

export function BuildMenu({ onClose }: BuildMenuProps) {
  const [activeTab, setActiveTab] = useState<'furniture' | 'facilities'>('furniture');
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const highlightFacilitiesTab = tutorialStep === 'build-logging-site' && activeTab !== 'facilities';
  const inFacilitiesTutorial = tutorialStep === 'build-logging-site' && activeTab === 'facilities';

  return (
    <div className="panel-overlay">
      <h2>
        Build
        <button className="panel-close-btn" onClick={onClose}>Close</button>
      </h2>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <button
          className={`panel-btn${activeTab === 'furniture' ? ' panel-btn--active' : ''}`}
          style={{ flex: 1 }}
          onClick={() => setActiveTab('furniture')}
        >
          Furniture
        </button>
        <button
          className={[
            'panel-btn',
            activeTab === 'facilities' ? 'panel-btn--active' : '',
            highlightFacilitiesTab ? 'tutorial-highlight' : '',
          ].join(' ').trim()}
          style={{ flex: 1 }}
          onClick={() => setActiveTab('facilities')}
        >
          Facilities
        </button>
      </div>

      {activeTab === 'furniture' && <FurnitureTab onClose={onClose} />}
      {activeTab === 'facilities' && <FacilitiesTab onClose={onClose} highlightLoggingSite={inFacilitiesTutorial} />}
    </div>
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

function FacilitiesTab({ onClose, highlightLoggingSite }: { onClose: () => void; highlightLoggingSite?: boolean }) {
  const facilities   = useGameStore((s) => s.facilities);
  const gold         = useGameStore((s) => s.gold);
  const guildLevel   = useGameStore((s) => s.guildLevel);
  const inventory    = useGameStore((s) => s.inventory);
  const buildFacility  = useGameStore((s) => s.buildFacility);
  const placeFacility  = useGameStore((s) => s.placeFacility);

  const [pendingPlacement, setPendingPlacement] = useState<FacilityType | null>(null);

  const handleBuy = (type: FacilityType) => {
    const ok = buildFacility(type);
    if (ok) setPendingPlacement(type);
  };

  const handlePlace = (slotIndex: number) => {
    if (!pendingPlacement) return;
    placeFacility(pendingPlacement, slotIndex);
    setPendingPlacement(null);
    onClose();
  };

  return (
    <>
      {pendingPlacement && (
        <FacilitySlotPicker
          facilityType={pendingPlacement}
          onPlace={handlePlace}
          onClose={() => setPendingPlacement(null)}
        />
      )}

      {Object.values(FACILITY_DEFINITIONS).map((def) => {
        const facility  = facilities.find((f) => f.type === def.type);
        if (!facility) return null; // guard: save may not have all facility types yet
        const isBuilt   = facility.level > 0;
        const isPlaced  = facility.placedSlot !== null;
        const hasPermit = def.type === 'logging-site'
          && (inventory.items['LOGGING_SITE_ACCESS'] ?? 0) > 0;
        const isFree    = def.buildCost === 0;
        const canAfford = isFree || hasPermit || gold >= def.buildCost;
        const meetsLevel = isFree || hasPermit || guildLevel >= 2;

        const isHighlighted = highlightLoggingSite && def.type === 'logging-site';
        return (
          <div key={def.type} className={`panel-section${isHighlighted ? ' tutorial-highlight' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <strong style={{ color: '#ffd700' }}>{def.name}</strong>
                {isBuilt && (
                  <span style={{ fontSize: '0.7rem', color: '#aaa', marginLeft: 6 }}>Lv.{facility.level}</span>
                )}
                <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 2 }}>{def.description}</div>
                <div style={{ fontSize: '0.7rem', color: '#9b59b6', marginTop: 2 }}>{def.primaryStats}</div>
              </div>
              {isBuilt && isPlaced && (
                <span style={{ fontSize: '0.75rem', color: '#4caf50', marginLeft: 8, whiteSpace: 'nowrap' }}>Built ✓</span>
              )}
            </div>

            {/* Unbuilt: show buy button */}
            {!isBuilt && (
              <>
                <button
                  className="panel-btn"
                  style={{ marginTop: 6 }}
                  disabled={!canAfford || !meetsLevel}
                  onClick={() => handleBuy(def.type)}
                >
                  {hasPermit
                    ? 'Build — Free (Permit)'
                    : isFree
                      ? 'Build — Free'
                      : `Build — ${def.buildCost}g`}
                </button>
                {!meetsLevel && (
                  <div style={{ fontSize: '0.72rem', color: '#ff6347', marginTop: 2 }}>
                    Requires Guild Lv.2
                  </div>
                )}
              </>
            )}

            {/* Bought but not yet placed */}
            {isBuilt && !isPlaced && (
              <button
                className="panel-btn"
                style={{ marginTop: 6 }}
                onClick={() => setPendingPlacement(def.type)}
              >
                Place Room
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}
