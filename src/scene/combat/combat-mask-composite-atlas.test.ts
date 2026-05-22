/**
 * Tests for combat-mask-composite-atlas.ts
 *
 * Covers cache identity, cache key uniqueness, and dispose behavior.
 * Canvas drawing is not testable in JSDOM — validate visually in app (Phase 4).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Three.js mock (no GPU in test env) ---
vi.mock('three', () => {
  class CanvasTexture {
    magFilter = 0;
    minFilter = 0;
    colorSpace = '';
    generateMipmaps = false;
    repeat = { set: vi.fn() };
    offset = { set: vi.fn() };
    disposed = false;
    dispose() { this.disposed = true; }
  }
  return {
    CanvasTexture,
    NearestFilter: 1,
    NearestMipmapNearestFilter: 2,
    SRGBColorSpace: 'srgb',
  };
});

// Minimal canvas mock — tracks imageSmoothingEnabled assignment and drawImage calls
const mockCtx = {
  imageSmoothingEnabled: true,
  drawImage: vi.fn(),
};

const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => mockCtx),
};

vi.stubGlobal('document', {
  createElement: vi.fn(() => ({ ...mockCanvas })),
});

import {
  buildCombatMaskCompositeAtlas,
  disposeCombatMaskCompositeAtlasCache,
  type BuildCombatMaskAtlasArgs,
} from './combat-mask-composite-atlas';

function makeBodyTexture(w = 128, h = 128) {
  return { image: { width: w, height: h } } as unknown as import('three').Texture;
}

function makeMaskTexture() {
  return { image: { width: 32, height: 32 } } as unknown as import('three').Texture;
}

function makeArgs(overrides: Partial<BuildCombatMaskAtlasArgs> = {}): BuildCombatMaskAtlasArgs {
  return {
    charId: 'LS-SWORD-M',
    anim: 'idle',
    maskId: 'mask-01',
    bodyTextures: Array.from({ length: 8 }, () => makeBodyTexture()),
    maskTexture: makeMaskTexture(),
    cols: 8,
    ...overrides,
  };
}

beforeEach(() => {
  disposeCombatMaskCompositeAtlasCache();
  vi.clearAllMocks();
});

describe('buildCombatMaskCompositeAtlas', () => {
  it('returns a SpriteAtlas with correct shape', () => {
    const atlas = buildCombatMaskCompositeAtlas(makeArgs());
    expect(atlas.cols).toBe(8);
    expect(atlas.rows).toBe(1); // 8 frames / 8 cols = 1 row
    expect(atlas.frameCount).toBe(8);
    expect(atlas.texture).toBeDefined();
  });

  it('returns the same atlas object on second call (cache hit)', () => {
    const args = makeArgs();
    const first = buildCombatMaskCompositeAtlas(args);
    const second = buildCombatMaskCompositeAtlas(args);
    expect(first).toBe(second);
  });

  it('different maskId → different atlas', () => {
    const a = buildCombatMaskCompositeAtlas(makeArgs({ maskId: 'mask-01' }));
    const b = buildCombatMaskCompositeAtlas(makeArgs({ maskId: 'mask-02' }));
    expect(a).not.toBe(b);
  });

  it('different anim → different atlas', () => {
    const a = buildCombatMaskCompositeAtlas(makeArgs({ anim: 'idle' }));
    const b = buildCombatMaskCompositeAtlas(makeArgs({ anim: 'attack' }));
    expect(a).not.toBe(b);
  });

  it('different charId → different atlas', () => {
    const a = buildCombatMaskCompositeAtlas(makeArgs({ charId: 'LS-SWORD-M' }));
    const b = buildCombatMaskCompositeAtlas(makeArgs({ charId: 'LS-SCOUT-F' }));
    expect(a).not.toBe(b);
  });

  it('different frame count → different atlas', () => {
    const a = buildCombatMaskCompositeAtlas(makeArgs({ bodyTextures: Array.from({ length: 8 }, makeBodyTexture) }));
    const b = buildCombatMaskCompositeAtlas(makeArgs({ bodyTextures: Array.from({ length: 4 }, makeBodyTexture) }));
    expect(a).not.toBe(b);
  });

  it('throws on empty bodyTextures', () => {
    expect(() => buildCombatMaskCompositeAtlas(makeArgs({ bodyTextures: [] }))).toThrow(
      'bodyTextures must not be empty',
    );
  });

  it('sets imageSmoothingEnabled = false on canvas context', () => {
    buildCombatMaskCompositeAtlas(makeArgs());
    // ctx is returned by createElement mock — check it was disabled
    expect(mockCtx.imageSmoothingEnabled).toBe(false);
  });

  it('draws body then mask for each frame (2 drawImage calls per frame)', () => {
    const args = makeArgs({ bodyTextures: Array.from({ length: 4 }, makeBodyTexture) });
    buildCombatMaskCompositeAtlas(args);
    // 4 frames × 2 draws (body + mask) = 8
    expect(mockCtx.drawImage).toHaveBeenCalledTimes(8);
  });
});

describe('disposeCombatMaskCompositeAtlasCache', () => {
  it('disposes all cached textures', () => {
    const a = buildCombatMaskCompositeAtlas(makeArgs({ maskId: 'mask-01' }));
    const b = buildCombatMaskCompositeAtlas(makeArgs({ maskId: 'mask-02' }));
    disposeCombatMaskCompositeAtlasCache();
    expect((a.texture as unknown as { disposed: boolean }).disposed).toBe(true);
    expect((b.texture as unknown as { disposed: boolean }).disposed).toBe(true);
  });

  it('after dispose, new call builds a fresh atlas', () => {
    const first = buildCombatMaskCompositeAtlas(makeArgs());
    disposeCombatMaskCompositeAtlasCache();
    const second = buildCombatMaskCompositeAtlas(makeArgs());
    expect(first).not.toBe(second);
  });
});
