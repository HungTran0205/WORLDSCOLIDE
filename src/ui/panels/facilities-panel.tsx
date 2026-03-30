/** FacilitiesPanel — unified panel for all guild facilities + tavern mercenaries. */

import { useGameStore } from '@/game/state/store';
import { FACILITY_DEFINITIONS } from '@/game/data/facility-definitions';
import { calcTotalUpkeep } from '@/game/systems/upkeep-system';
import { FacilityCard } from './facility-card';
import { RankBadge } from '@/ui/components/rank-badge';
import { CivBadge } from '@/ui/components/civ-badge';
import { GameIcon } from '@/ui/components/game-icon';
import '@/ui/styles/panels.css';

interface FacilitiesPanelProps {
  onClose: () => void;
}

export function FacilitiesPanel({ onClose }: FacilitiesPanelProps) {
  const facilities    = useGameStore((s) => s.facilities);
  const guildLevel    = useGameStore((s) => s.guildLevel);
  const gold          = useGameStore((s) => s.gold);
  const founder       = useGameStore((s) => s.founder);
  const roster        = useGameStore((s) => s.roster);
  const tavern        = useGameStore((s) => s.tavern);

  const buildFacility            = useGameStore((s) => s.buildFacility);
  const upgradeFacility          = useGameStore((s) => s.upgradeFacility);
  const assignMemberToFacility   = useGameStore((s) => s.assignMemberToFacility);
  const unassignMemberFromFacility = useGameStore((s) => s.unassignMemberFromFacility);
  const hireMercenary            = useGameStore((s) => s.hireMercenary);

  const allMembers = founder ? [founder, ...roster] : roster;
  const dailyUpkeep = calcTotalUpkeep(allMembers);

  const tavernFacility = facilities.find((f) => f.type === 'tavern');

  const nextRefreshMs = Math.max(0, tavern.lastRefreshTime + 4 * 60 * 60 * 1000 - Date.now());
  const nextRefreshHrs = (nextRefreshMs / (60 * 60 * 1000)).toFixed(1);

  return (
    <div className="panel-overlay">
      <h2>
        Facilities
        <button className="panel-close-btn" onClick={onClose}>Close</button>
      </h2>

      {guildLevel < 2 && (
        <p className="facilities-locked-notice">
          Upgrade guild to level 2 to unlock new facilities.
        </p>
      )}

      {/* Facility cards */}
      {facilities.map((facility) => (
        <FacilityCard
          key={facility.type}
          facility={facility}
          def={FACILITY_DEFINITIONS[facility.type]}
          allMembers={allMembers}
          guildLevel={guildLevel}
          gold={gold}
          dailyUpkeep={dailyUpkeep}
          onBuild={() => buildFacility(facility.type)}
          onUpgrade={() => upgradeFacility(facility.type)}
          onAssign={(id) => assignMemberToFacility(id, facility.type)}
          onUnassign={(id) => unassignMemberFromFacility(id, facility.type)}
        />
      ))}

      {/* Tavern mercenaries — always visible when tavern is active */}
      {tavernFacility && tavernFacility.level >= 1 && (
        <div style={{ marginTop: 8 }}>
          <h3 style={{ color: '#ffd700', fontSize: '0.95rem', margin: '0 0 8px' }}>
            Mercenaries
          </h3>
          <p style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: 12 }}>
            {tavern.availableMercenaries.length > 0
              ? `${tavern.availableMercenaries.length} available`
              : 'No mercenaries available'}
            {' — '}Next refresh in {nextRefreshHrs}h
          </p>

          {tavern.availableMercenaries.map((merc) => (
            <div key={merc.id} className="panel-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <strong>
                  {merc.name}
                  <RankBadge rank={merc.rank} />
                </strong>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: '#aaa' }}>
                  Lv.{merc.level} | <CivBadge civilization={merc.civilization} />
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: '0.8rem', color: '#aaa', marginBottom: 8, alignItems: 'center' }}>
                {(['STR', 'END', 'INT', 'DEX', 'AGI'] as const).map((stat) => (
                  <span key={stat} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                    <GameIcon category="stat" id={stat} size={12} fallbackText={stat} />
                    {merc.stats[stat]}
                  </span>
                ))}
              </div>
              <button className="panel-btn" onClick={() => hireMercenary(merc.id)}>
                Hire
              </button>
            </div>
          ))}

          {tavern.availableMercenaries.length === 0 && (
            <p style={{ color: '#888', marginTop: 8, fontSize: '0.85rem' }}>
              Come back later — mercenaries refresh every 4 hours.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
