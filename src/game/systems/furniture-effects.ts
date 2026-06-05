import type { PlacedFurniture } from '@/game/state/game-state';

export interface FurnitureBonuses {
  upkeepReduction: number;
  passiveExpPerDay: number;
  recoveryReduction: number;
  visitorBonus: number;
}

/** Calculate combined bonuses from all placed furniture */
export function calcFurnitureBonuses(furniture: PlacedFurniture[]): FurnitureBonuses {
  const bonuses: FurnitureBonuses = {
    upkeepReduction: 1.0,
    passiveExpPerDay: 0,
    recoveryReduction: 0,
    visitorBonus: 0,
  };

  for (const f of furniture) {
    switch (f.type) {
      // Core furniture: level-scaled bonuses
      case 'bar-counter':
        bonuses.upkeepReduction *= Math.max(0.01, 1 - 0.05 * f.level);
        break;
      case 'training-dummy':
        bonuses.passiveExpPerDay += 10 * f.level;
        break;
      case 'alchemy-table':
        bonuses.recoveryReduction += f.level;
        break;
      // Upgrade furniture: flat bonuses
      case 'wine-barrel':
        bonuses.upkeepReduction *= 0.98;
        break;
      case 'medical-bed':
        bonuses.recoveryReduction += 0.5;
        break;
      case 'reception-desk':
        bonuses.visitorBonus += 1;
        break;
    }
  }

  return bonuses;
}

