import type { Room, Member } from '@/game/state/game-state';

export interface RoomBonuses {
  upkeepReduction: number;
  passiveExpPerDay: number;
  recoveryReduction: number;
  visitorBonus: number;
}

/** Calculate combined bonuses from all rooms */
export function calcRoomBonuses(rooms: Room[]): RoomBonuses {
  const bonuses: RoomBonuses = {
    upkeepReduction: 1.0,
    passiveExpPerDay: 0,
    recoveryReduction: 0,
    visitorBonus: 0,
  };

  for (const room of rooms) {
    switch (room.type) {
      case 'tavern':
        bonuses.upkeepReduction *= 1 - 0.05 * room.level;
        break;
      case 'training-room':
        bonuses.passiveExpPerDay += 10 * room.level;
        break;
      case 'infirmary':
        bonuses.recoveryReduction += 1;
        break;
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
