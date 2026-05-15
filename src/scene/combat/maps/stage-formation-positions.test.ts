/**
 * Parity test — guarantees `getStageSpawnPosition` for the LoLo Village
 * Outskirt spec returns the same {x, z} as `getFormationPosition` from
 * the legacy `FORMATION_POSITIONS` table. Locks the migration baseline
 * so phase 04+ render changes can't silently drift the spawn grid.
 */

import { describe, expect, it } from 'vitest';
import { getFormationPosition } from '@/game/systems/combat-arena-types';
import { LOLO_VILLAGE_OUTSKIRT_STAGE } from './stages/lolo-village-outskirt';
import { getStageSpawnPosition } from './stage-formation-positions';

const SIDES = ['ally', 'enemy'] as const;

describe('LoloVillageOutskirt stage spawn parity vs FORMATION_POSITIONS', () => {
  for (const side of SIDES) {
    for (let i = 0; i < 6; i++) {
      it(`${side} slot ${i} matches legacy formation position`, () => {
        const legacy = getFormationPosition(i, side);
        const spec = getStageSpawnPosition(LOLO_VILLAGE_OUTSKIRT_STAGE, i, side);
        expect(spec.x).toBeCloseTo(legacy.x, 5);
        expect(spec.z).toBeCloseTo(legacy.z, 5);
      });
    }
  }

  it('y for ground platform = 0 (top surface at world origin)', () => {
    const pos = getStageSpawnPosition(LOLO_VILLAGE_OUTSKIRT_STAGE, 0, 'ally');
    expect(pos.y).toBe(0);
  });
});
