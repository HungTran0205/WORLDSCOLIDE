/**
 * Mask pool / founder mask choice tests (New Game Flow, Phase 06).
 *
 * Covers:
 *  - FOUNDER_MASK_CHOICES length === 10.
 *  - every founder mask id ∈ MASK_POOL.
 *  - getMaskAssetPath(id,'front') returns '/sprites/mask/pick/{id}/front.png'.
 */

import { describe, it, expect } from 'vitest';
import { MASK_POOL, FOUNDER_MASK_CHOICES, getMaskAssetPath } from './mask-pool';

describe('FOUNDER_MASK_CHOICES', () => {
  it('has exactly 10 choices', () => {
    expect(FOUNDER_MASK_CHOICES).toHaveLength(10);
  });

  it('every choice id is a member of MASK_POOL', () => {
    for (const id of FOUNDER_MASK_CHOICES) {
      expect(MASK_POOL).toContain(id);
    }
  });

  it('contains no duplicate ids', () => {
    expect(new Set(FOUNDER_MASK_CHOICES).size).toBe(FOUNDER_MASK_CHOICES.length);
  });

  it('is the first 10 of the 15-mask pool (DRY slice)', () => {
    expect(FOUNDER_MASK_CHOICES).toEqual([...MASK_POOL].slice(0, 10));
    expect(MASK_POOL).toHaveLength(15);
  });
});

describe('getMaskAssetPath', () => {
  it.each(FOUNDER_MASK_CHOICES)('%s → resolvable front.png path', (id) => {
    expect(getMaskAssetPath(id, 'front')).toBe(`/sprites/mask/pick/${id}/front.png`);
  });

  it('resolves east view for combat profile', () => {
    expect(getMaskAssetPath('mask-03', 'east')).toBe('/sprites/mask/pick/mask-03/east.png');
  });
});
