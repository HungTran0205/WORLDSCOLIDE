import { describe, it, expect } from 'vitest';
import { migrateSave } from './save-migrations';
import { VALID_SAVE_ENVELOPE } from './test-fixtures';
import { SAVE_VERSION } from './save-types';

describe('migrateSave', () => {
  it('migrates v1 data to current version', () => {
    const result = migrateSave(VALID_SAVE_ENVELOPE);
    expect(result.version).toBe(SAVE_VERSION);
    // v2→v3 adds rotation to rooms
    const rooms = (result.gameState.guildHall as unknown as { rooms: Array<Record<string, unknown>> }).rooms;
    expect(rooms[0].rotation).toBe(0);
    // v3→v4 adds rank to members and tavern to gameState
    expect(result.gameState.founder?.rank).toBe('MEMBER');
    result.gameState.roster.forEach((m) => expect(m.rank).toBe('MEMBER'));
    expect(result.gameState.tavern).toEqual({ lastRefreshTime: 0, availableMercenaries: [] });
    // v4→v5 adds inventory
    expect(result.gameState.inventory).toEqual({ items: {} });
    expect(result.metadata).toEqual(VALID_SAVE_ENVELOPE.metadata);
  });

  it('throws for version higher than SAVE_VERSION', () => {
    const futureEnvelope = { ...VALID_SAVE_ENVELOPE, version: 999 };
    expect(() => migrateSave(futureEnvelope)).toThrow(
      /newer than supported version/,
    );
  });

  it('throws for missing migration in chain', () => {
    // Version 0 has no migration function at index -1
    const oldEnvelope = { ...VALID_SAVE_ENVELOPE, version: 0 };
    expect(() => migrateSave(oldEnvelope)).toThrow(/Missing migration/);
  });
});
