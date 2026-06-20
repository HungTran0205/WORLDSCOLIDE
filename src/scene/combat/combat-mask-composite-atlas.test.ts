/**
 * Tests for combat-mask-composite-atlas.ts
 *
 * Phase 3: API changed from bodyTextures: Texture[] to sheetSource: SheetCompositeSource.
 * Each body frame is now sliced from a pre-packed sheet via canvas drawImage.
 * Cache key includes row + frameCount (not bodyTextures.length).
 *
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

// Minimal canvas mock — tracks imageSmoothingEnabled and drawImage calls
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
  type SheetCompositeSource,
} from './combat-mask-composite-atlas';

/** Build a minimal sheet texture mock (cols×rows grid of frameW×frameH pixels). */
function makeSheetTexture(cols = 8, rows = 1, frameW = 128, frameH = 128) {
  return {
    image: { width: cols * frameW, height: rows * frameH },
  } as unknown as import('three').Texture;
}

function makeMaskTexture() {
  return { image: { width: 32, height: 32 } } as unknown as import('three').Texture;
}

/** Overlay sheet mock: single row of square frames (e.g. 20×128 for LS-SWORD-M). */
function makeOverlayTexture(cols = 20, frameSize = 128) {
  return {
    image: { width: cols * frameSize, height: frameSize },
  } as unknown as import('three').Texture;
}

function makeSheetSource(overrides: Partial<SheetCompositeSource> = {}): SheetCompositeSource {
  return {
    sheetTexture: makeSheetTexture(),
    cols: 8,
    rows: 1,
    row: 0,
    frameCount: 8,
    ...overrides,
  };
}

function makeArgs(overrides: Partial<BuildCombatMaskAtlasArgs> = {}): BuildCombatMaskAtlasArgs {
  return {
    charId: 'LS-SWORD-M',
    anim: 'idle',
    maskId: 'mask-01',
    sheetSource: makeSheetSource(),
    maskTexture: makeMaskTexture(),
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
    // Output atlas is always a single-row strip: atlasCols=frameCount, atlasRows=1
    expect(atlas.cols).toBe(8);
    expect(atlas.rows).toBe(1);
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

  it('different frameCount → different atlas', () => {
    const a = buildCombatMaskCompositeAtlas(makeArgs({ sheetSource: makeSheetSource({ frameCount: 8 }) }));
    const b = buildCombatMaskCompositeAtlas(makeArgs({ sheetSource: makeSheetSource({ frameCount: 4 }) }));
    expect(a).not.toBe(b);
  });

  it('different row → different atlas', () => {
    const a = buildCombatMaskCompositeAtlas(makeArgs({ sheetSource: makeSheetSource({ row: 0 }) }));
    const b = buildCombatMaskCompositeAtlas(makeArgs({ sheetSource: makeSheetSource({ row: 1, rows: 2, sheetTexture: makeSheetTexture(8, 2) }) }));
    expect(a).not.toBe(b);
  });

  it('throws on frameCount = 0', () => {
    expect(() =>
      buildCombatMaskCompositeAtlas(makeArgs({ sheetSource: makeSheetSource({ frameCount: 0 }) }))
    ).toThrow('frameCount must be > 0');
  });

  it('sets imageSmoothingEnabled = false on canvas context', () => {
    buildCombatMaskCompositeAtlas(makeArgs());
    expect(mockCtx.imageSmoothingEnabled).toBe(false);
  });

  it('draws body then mask for each frame (2 drawImage calls per frame)', () => {
    buildCombatMaskCompositeAtlas(makeArgs({ sheetSource: makeSheetSource({ frameCount: 4 }) }));
    // 4 frames × 2 draws (body slice + mask) = 8
    expect(mockCtx.drawImage).toHaveBeenCalledTimes(8);
  });
});

describe('buildCombatMaskCompositeAtlas — blessed overlay', () => {
  it('draws body + overlay + mask for each frame (3 drawImage calls per frame)', () => {
    buildCombatMaskCompositeAtlas(makeArgs({
      sheetSource: makeSheetSource({ frameCount: 4 }),
      blessedOverlay: { sheetTexture: makeOverlayTexture(), segmentOffset: 0, frameCount: 4 },
    }));
    // 4 frames × 3 draws (body + overlay + mask) = 12
    expect(mockCtx.drawImage).toHaveBeenCalledTimes(12);
  });

  it('blessed-only (no mask) draws body + overlay for each frame (2 per frame)', () => {
    buildCombatMaskCompositeAtlas({
      charId: 'LS-SWORD-M',
      anim: 'idle',
      maskId: null,
      maskTexture: undefined,
      sheetSource: makeSheetSource({ frameCount: 4 }),
      blessedOverlay: { sheetTexture: makeOverlayTexture(), segmentOffset: 0, frameCount: 4 },
    });
    // 4 frames × 2 draws (body + overlay, no mask) = 8
    expect(mockCtx.drawImage).toHaveBeenCalledTimes(8);
  });

  it('blessed atlas differs from the plain identity-mask atlas', () => {
    const masked = buildCombatMaskCompositeAtlas(makeArgs());
    const blessed = buildCombatMaskCompositeAtlas(makeArgs({
      blessedOverlay: { sheetTexture: makeOverlayTexture(), segmentOffset: 0, frameCount: 8 },
    }));
    expect(masked).not.toBe(blessed);
  });

  it('different overlay segmentOffset → different atlas', () => {
    const a = buildCombatMaskCompositeAtlas(makeArgs({
      blessedOverlay: { sheetTexture: makeOverlayTexture(), segmentOffset: 0, frameCount: 8 },
    }));
    const b = buildCombatMaskCompositeAtlas(makeArgs({
      blessedOverlay: { sheetTexture: makeOverlayTexture(), segmentOffset: 8, frameCount: 8 },
    }));
    expect(a).not.toBe(b);
  });

  it('throws when neither maskTexture nor blessedOverlay is supplied', () => {
    expect(() =>
      buildCombatMaskCompositeAtlas({
        charId: 'LS-SWORD-M',
        anim: 'idle',
        maskId: null,
        maskTexture: undefined,
        sheetSource: makeSheetSource(),
      })
    ).toThrow('requires maskTexture and/or blessedOverlay');
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
