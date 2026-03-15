import { describe, it, expect } from 'vitest';
import { extractGameSaveData, createSaveEnvelope, SAVE_VERSION } from './save-types';
import { VALID_GAME_SAVE_DATA, VALID_MEMBER, VALID_GUILD_HALL, VALID_SETTINGS } from './test-fixtures';

describe('extractGameSaveData', () => {
  it('strips action functions and keeps data fields', () => {
    const storeState = {
      ...VALID_GAME_SAVE_DATA,
      // Simulate Zustand action functions
      setFounder: () => {},
      addGold: () => {},
      tickClock: () => {},
      dispatchMission: () => {},
    };

    const result = extractGameSaveData(storeState as unknown as Record<string, unknown>);

    expect(result.gold).toBe(100);
    expect(result.guildName).toBe('Test Guild');
    expect(result.founder).toEqual(VALID_MEMBER);
    expect(result.guildHall).toEqual(VALID_GUILD_HALL);
    expect(result.settings).toEqual(VALID_SETTINGS);
    expect(result.tutorialStep).toBe('sandbox-intro');
    // Should not contain action functions
    expect('setFounder' in result).toBe(false);
    expect('addGold' in result).toBe(false);
  });
});

describe('createSaveEnvelope', () => {
  it('creates envelope with correct version and metadata', () => {
    const envelope = createSaveEnvelope(2, VALID_GAME_SAVE_DATA);

    expect(envelope.version).toBe(SAVE_VERSION);
    expect(envelope.metadata.slotId).toBe(2);
    expect(envelope.metadata.guildName).toBe('Test Guild');
    expect(envelope.metadata.guildLevel).toBe(1);
    expect(envelope.metadata.founderName).toBe('TestFounder');
    expect(envelope.savedAt).toBeGreaterThan(0);
    expect(envelope.gameState).toEqual(VALID_GAME_SAVE_DATA);
  });

  it('accumulates play time from existing metadata', () => {
    const existingMeta = {
      slotId: 1,
      guildName: 'Old',
      guildLevel: 1,
      playTimeMs: 60000,
      founderName: 'Founder',
      createdAt: Date.now() - 120000,
      updatedAt: Date.now() - 60000,
    };

    const envelope = createSaveEnvelope(1, VALID_GAME_SAVE_DATA, existingMeta);

    expect(envelope.metadata.playTimeMs).toBeGreaterThan(60000);
    expect(envelope.metadata.createdAt).toBe(existingMeta.createdAt);
  });

  it('handles null founder name gracefully', () => {
    const dataNoFounder = { ...VALID_GAME_SAVE_DATA, founder: null };
    const envelope = createSaveEnvelope(1, dataNoFounder);

    expect(envelope.metadata.founderName).toBe('Unknown');
  });
});
