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
  // Only rendered for built facilities (level > 0) — caller filters locked ones out
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
        locked={false}
      />
      <ZoneProps type={facility.type} level={facility.level} />
      {facility.assignedMemberIds.length > 0 && (
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

  // Only show zones for built facilities — no locked/dimmed markers
  const builtFacilities = facilities.filter((f) => f.level > 0);

  return (
    <group>
      {builtFacilities.map((facility) => (
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
