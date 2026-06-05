import { describe, expect, it } from 'vitest';
import type { Member, Stats } from '@/game/state/game-state';
import { memberToArenaEntity } from './combat-entity-factory';

const BASE_STATS: Stats = {
  STR: 10,
  END: 10,
  INT: 10,
  DEX: 10,
  CHA: 10,
  LCK: 10,
  AGI: 10,
};

function makeMember(overrides: Partial<Member> = {}): Member {
  return {
    id: 'founder',
    name: 'Founder',
    grade: 'D',
    isMercenary: false,
    stats: { ...BASE_STATS },
    unallocatedPoints: 0,
    skill: null,
    status: 'idle',
    injuredUntil: null,
    civilization: 'LinhSon',
    archetype: 'sword',
    gender: 'M',
    isFounder: true,
    missionsCompleted: 0,
    traits: [],
    equipment: null,
    medicineSlots: undefined,
    ...overrides,
  };
}

describe('memberToArenaEntity', () => {
  it('preserves chosen member mask for combat overlay rendering', () => {
    const entity = memberToArenaEntity(
      makeMember({ maskSpriteId: 'mask-01' }),
      { x: 0, y: 0, z: 0 },
    );

    expect(entity.maskSpriteId).toBe('mask-01');
  });
});
