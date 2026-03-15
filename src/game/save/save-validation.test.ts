import { describe, it, expect } from 'vitest';
import { isValidSaveEnvelope, validateSemantics, validateAndMigrate } from './save-validation';
import { VALID_SAVE_ENVELOPE, VALID_GAME_SAVE_DATA } from './test-fixtures';

describe('isValidSaveEnvelope', () => {
  it('returns true for valid envelope', () => {
    expect(isValidSaveEnvelope(VALID_SAVE_ENVELOPE)).toBe(true);
  });

  it('returns false for null/undefined', () => {
    expect(isValidSaveEnvelope(null)).toBe(false);
    expect(isValidSaveEnvelope(undefined)).toBe(false);
  });

  it('returns false for missing version', () => {
    const { version: _, ...noVersion } = VALID_SAVE_ENVELOPE;
    expect(isValidSaveEnvelope(noVersion)).toBe(false);
  });

  it('returns false for missing metadata', () => {
    const { metadata: _, ...noMeta } = VALID_SAVE_ENVELOPE;
    expect(isValidSaveEnvelope(noMeta)).toBe(false);
  });

  it('returns false for missing gameState', () => {
    const { gameState: _, ...noState } = VALID_SAVE_ENVELOPE;
    expect(isValidSaveEnvelope(noState)).toBe(false);
  });

  it('returns false for wrong types', () => {
    expect(isValidSaveEnvelope({ ...VALID_SAVE_ENVELOPE, version: 'abc' })).toBe(false);
    expect(isValidSaveEnvelope({ ...VALID_SAVE_ENVELOPE, savedAt: 'xyz' })).toBe(false);
  });

  it('returns false for invalid member stats', () => {
    const badData = structuredClone(VALID_SAVE_ENVELOPE);
    badData.gameState.founder!.stats = { STR: 'abc' } as never;
    expect(isValidSaveEnvelope(badData)).toBe(false);
  });

  it('returns false for invalid guildHall', () => {
    const badData = structuredClone(VALID_SAVE_ENVELOPE);
    badData.gameState.guildHall = { level: 'bad' } as never;
    expect(isValidSaveEnvelope(badData)).toBe(false);
  });
});

describe('validateSemantics', () => {
  it('returns empty array for valid data', () => {
    expect(validateSemantics(VALID_GAME_SAVE_DATA)).toEqual([]);
  });

  it('catches negative gold', () => {
    const bad = { ...VALID_GAME_SAVE_DATA, gold: -50 };
    const errors = validateSemantics(bad);
    expect(errors).toContain('gold must be >= 0');
  });

  it('catches guildLevel < 1', () => {
    const bad = { ...VALID_GAME_SAVE_DATA, guildLevel: 0 };
    const errors = validateSemantics(bad);
    expect(errors).toContain('guildLevel must be >= 1');
  });

  it('catches invalid tutorialStep', () => {
    const bad = { ...VALID_GAME_SAVE_DATA, tutorialStep: 'invalid-step' as never };
    const errors = validateSemantics(bad);
    expect(errors.some((e) => e.includes('invalid tutorialStep'))).toBe(true);
  });

  it('catches founder level < 1', () => {
    const bad = structuredClone(VALID_GAME_SAVE_DATA);
    bad.founder!.level = 0;
    const errors = validateSemantics(bad);
    expect(errors).toContain('founder level must be >= 1');
  });
});

describe('validateAndMigrate', () => {
  it('accepts valid envelope', () => {
    const result = validateAndMigrate(VALID_SAVE_ENVELOPE);
    expect(result.ok).toBe(true);
  });

  it('accepts valid JSON string', () => {
    const result = validateAndMigrate(JSON.stringify(VALID_SAVE_ENVELOPE));
    expect(result.ok).toBe(true);
  });

  it('rejects invalid JSON string', () => {
    const result = validateAndMigrate('{bad json');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toContain('Invalid JSON');
  });

  it('rejects structurally invalid data', () => {
    const result = validateAndMigrate({ foo: 'bar' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toContain('Invalid save file structure');
  });

  it('rejects semantically invalid data', () => {
    const bad = structuredClone(VALID_SAVE_ENVELOPE);
    bad.gameState.gold = -100;
    const result = validateAndMigrate(bad);
    expect(result.ok).toBe(false);
  });
});
