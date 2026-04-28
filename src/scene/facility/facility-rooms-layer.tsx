/** Renders facility 7×7 rooms — only those that have been bought AND placed in a slot */

import { useGameStore } from '@/game/state/store';
import { FacilityRoom } from './facility-room';

export function FacilityRoomsLayer() {
  const facilities = useGameStore((s) => s.facilities);
  const placed = facilities.filter((f) => f.level > 0 && f.placedSlot !== null);

  return (
    <group>
      {placed.map((facility) => (
        <FacilityRoom key={facility.type} facility={facility} />
      ))}
    </group>
  );
}
