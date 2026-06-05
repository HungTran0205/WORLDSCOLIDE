/**
 * Alchemy recipe matching tests.
 * Covers: exact ingredient matching, level requirements, tier progression.
 */

import { describe, it, expect } from 'vitest';
import { matchRecipe } from './alchemy-recipes';

describe('alchemy-recipes: matchRecipe', () => {
  it('matches 1× SLIME_GEL at Lv0 to healing-syringe', () => {
    const recipe = matchRecipe(['SLIME_GEL'], 0);
    expect(recipe).not.toBeNull();
    expect(recipe?.id).toBe('healing-syringe');
    expect(recipe?.output.itemId).toBe('HEALING_SYRINGE');
    expect(recipe?.output.quantity).toBe(1);
  });

  it('matches 1× SLIME_GEL at Lv10 to healing-syringe (still valid)', () => {
    const recipe = matchRecipe(['SLIME_GEL'], 10);
    expect(recipe?.id).toBe('healing-syringe');
  });

  it('matches 2× SLIME_GEL at Lv3 to healing-syringe-2', () => {
    const recipe = matchRecipe(['SLIME_GEL', 'SLIME_GEL'], 3);
    expect(recipe).not.toBeNull();
    expect(recipe?.id).toBe('healing-syringe-2');
    expect(recipe?.output.itemId).toBe('HEALING_SYRINGE_2');
  });

  it('rejects 2× SLIME_GEL at Lv2 (below requirement)', () => {
    const recipe = matchRecipe(['SLIME_GEL', 'SLIME_GEL'], 2);
    expect(recipe).toBeNull();
  });

  it('matches 3× SLIME_GEL at Lv5 to healing-syringe-3', () => {
    const recipe = matchRecipe(['SLIME_GEL', 'SLIME_GEL', 'SLIME_GEL'], 5);
    expect(recipe).not.toBeNull();
    expect(recipe?.id).toBe('healing-syringe-3');
    expect(recipe?.output.itemId).toBe('HEALING_SYRINGE_3');
  });

  it('rejects 3× SLIME_GEL at Lv4 (below requirement)', () => {
    const recipe = matchRecipe(['SLIME_GEL', 'SLIME_GEL', 'SLIME_GEL'], 4);
    expect(recipe).toBeNull();
  });

  it('returns null for empty slots', () => {
    const recipe = matchRecipe([], 0);
    expect(recipe).toBeNull();
  });

  it('returns null for all-null slots', () => {
    const recipe = matchRecipe([null, null, null], 0);
    expect(recipe).toBeNull();
  });

  it('returns null for wrong ingredient', () => {
    const recipe = matchRecipe(['WOOD'], 0);
    expect(recipe).toBeNull();
  });

  it('returns null when slot count mismatches recipe requirements', () => {
    // Try 1× SLIME_GEL but recipe needs 2×
    const recipe = matchRecipe(['SLIME_GEL'], 3);
    expect(recipe?.id).toBe('healing-syringe'); // Should still match HS1, not HS2
  });

  it('returns null when slots contain extra non-null items beyond recipe', () => {
    // 2× SLIME_GEL + 1× WOOD (extra) should not match any recipe
    const recipe = matchRecipe(['SLIME_GEL', 'SLIME_GEL', 'WOOD'], 3);
    expect(recipe).toBeNull();
  });

  it('prefers lowest-tier matching recipe when multiple candidates exist', () => {
    // All 3 recipes match increasing quantities. At Lv5, all are available.
    // Providing just 1× SLIME_GEL should pick HS1.
    const recipe = matchRecipe(['SLIME_GEL'], 5);
    expect(recipe?.id).toBe('healing-syringe');
  });

  it('respects slot order independence (aggregate by count)', () => {
    // [SLIME_GEL, SLIME_GEL, null] aggregates to {SLIME_GEL: 2}
    const recipe1 = matchRecipe(['SLIME_GEL', 'SLIME_GEL', null], 3);
    const recipe2 = matchRecipe(['SLIME_GEL', null, 'SLIME_GEL'], 3);
    expect(recipe1?.id).toBe('healing-syringe-2');
    expect(recipe2?.id).toBe('healing-syringe-2');
  });
});
