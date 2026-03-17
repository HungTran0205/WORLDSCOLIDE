import type { Room, Member } from '@/game/state/game-state';

export interface RoomBonuses {
  upkeepReduction: number;
  passiveExpPerDay: number;
  recoveryReduction: number;
  visitorBonus: number;
}

/** Calculate combined bonuses from all rooms' furniture */
export function calcRoomBonuses(rooms: Room[]): RoomBonuses {
  const bonuses: RoomBonuses = {
    upkeepReduction: 1.0,
    passiveExpPerDay: 0,
    recoveryReduction: 0,
    visitorBonus: 0,
  };

  for (const room of rooms) {
    for (const furniture of room.furniture) {
      switch (furniture.type) {
        // Core furniture: level-scaled bonuses
        case 'bar-counter':
          bonuses.upkeepReduction *= 1 - 0.05 * furniture.level;
          break;
        case 'training-dummy':
          bonuses.passiveExpPerDay += 10 * furniture.level;
          break;
        case 'alchemy-table':
          bonuses.recoveryReduction += furniture.level;
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
  }

  return bonuses;
}

/** Apply passive EXP to idle/training members */
export function applyPassiveExp(
  roster: Member[],
  passiveExpPerDay: number,
  gameDays: number,
): Member[] {
  return roster.map((m) => {
    if (m.status !== 'idle' && m.status !== 'training') return m;
    return { ...m, exp: m.exp + passiveExpPerDay * gameDays };
  });
}
