import type { FacilityType } from '@/game/state/game-state';
import { TavernFurniture } from './tavern-furniture';
import { TrainingYardFurniture } from './training-yard-furniture';
import { InfirmaryFurniture } from './infirmary-furniture';
import { WorkshopFurniture } from './workshop-furniture';
import { AlchemyLabFurniture } from '../alchemy/alchemy-furniture';

interface FacilityRoomFurnitureProps {
  type: FacilityType;
  cx: number;
  cz: number;
}

/** Dispatches to the per-facility furniture layout */
export function FacilityRoomFurniture({ type, cx, cz }: FacilityRoomFurnitureProps) {
  switch (type) {
    case 'tavern': return <TavernFurniture cx={cx} cz={cz} />;
    case 'training-yard': return <TrainingYardFurniture cx={cx} cz={cz} />;
    case 'infirmary': return <InfirmaryFurniture cx={cx} cz={cz} />;
    case 'workshop': return <WorkshopFurniture cx={cx} cz={cz} />;
    case 'alchemy-lab': return <AlchemyLabFurniture cx={cx} cz={cz} />;
    default: return null;
  }
}
