/** Renders all 4 facility zones in the guild hall — floor markers, props, and member sprites */

import { useEffect } from 'react';
import { useGameStore } from '@/game/state/store';
import { FACILITY_DEFINITIONS } from '@/game/data/facility-definitions';
import { ZoneFloorMarker } from './zone-floor-marker';
import { ZoneProps } from './zone-props';
import { ZoneMemberSprites } from './zone-member-sprites';
import type { GuildFacility } from '@/game/state/game-state';
import type { FacilityDef } from '@/game/data/facility-definitions';
import type { FacilityType } from '@/game/state/game-state';

interface FacilityZoneProps {
  facility: GuildFacility;
  def: FacilityDef;
  onZoneClick: (type: FacilityType) => void;
}

function FacilityZone({ facility, def, onZoneClick }: FacilityZoneProps) {
  const locked = facility.level === 0;

  return (
    <group
      position={def.zonePosition}
      onClick={(e) => {
        e.stopPropagation();
        onZoneClick(facility.type);
      }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <ZoneFloorMarker
        footprint={def.tileFootprint}
        facilityType={facility.type}
        locked={locked}
      />
      {!locked && <ZoneProps type={facility.type} level={facility.level} />}
      {!locked && facility.assignedMemberIds.length > 0 && (
        <ZoneMemberSprites assignedMemberIds={facility.assignedMemberIds} />
      )}
    </group>
  );
}

/** All facility zones — hidden in build mode */
export function FacilityZoneLayer() {
  const facilities = useGameStore((s) => s.facilities);
  const isBuildMode = useGameStore((s) => s.isBuildMode);
  const setPendingFacilityPanel = useGameStore((s) => s.setPendingFacilityPanel);

  // Reset cursor if layer unmounts while hovering (e.g. entering build mode mid-hover)
  useEffect(() => () => { document.body.style.cursor = 'auto'; }, []);

  if (isBuildMode) return null;

  return (
    <group>
      {facilities.map((facility) => (
        <FacilityZone
          key={facility.type}
          facility={facility}
          def={FACILITY_DEFINITIONS[facility.type]}
          onZoneClick={setPendingFacilityPanel}
        />
      ))}
    </group>
  );
}
