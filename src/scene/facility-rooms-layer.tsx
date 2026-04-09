/** Renders all 4 facility rooms behind the guild hall */

import { useGameStore } from '@/game/state/store';
import { FacilityRoom } from './facility-room';

/** All 4 facility 7×7 rooms — always visible in the scene */
export function FacilityRoomsLayer() {
  const facilities = useGameStore((s) => s.facilities);

  return (
    <group>
      {facilities.map((facility) => (
        <FacilityRoom key={facility.type} facility={facility} />
      ))}
    </group>
  );
}
