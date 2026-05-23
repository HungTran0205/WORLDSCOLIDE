/**
 * Sprite atlas helpers — UV-based frame animation over a pre-packed sheet texture.
 * Animation selects frames via texture.offset/repeat instead of swapping material.map
 * (zero texture binding overhead).
 *
 * Phase 3: primary entry point is buildAtlasFromSheet (one PNG sheet → SpriteAtlas).
 * buildAtlasFromTextures / buildAtlasFromUrls were removed — all animators now load
 * a single pre-packed sheet via useLoader(TextureLoader, sheetPath).
 *
 * Atlas layout: frames arranged in a grid, left-to-right, top-to-bottom.
 */

import * as THREE from 'three';

export interface SpriteAtlas {
  /** Texture containing all frames in a grid (CanvasTexture for composite atlases,
   *  or a plain Texture for pre-packed sheet PNGs loaded via TextureLoader). */
  texture: THREE.Texture;
  /** Number of columns in the grid */
  cols: number;
  /** Number of rows in the grid */
  rows: number;
  /** Total number of frames packed */
  frameCount: number;
}

/**
 * Set UV offset/repeat on a texture to show a specific frame from the atlas.
 * This only updates uniforms — NO texture binding change, NO shader recompile.
 */
export function setAtlasFrame(atlas: SpriteAtlas, frameIndex: number): void {
  const col = frameIndex % atlas.cols;
  const row = Math.floor(frameIndex / atlas.cols);
  // UV origin is bottom-left in Three.js, so flip Y
  atlas.texture.offset.set(col / atlas.cols, 1 - (row + 1) / atlas.rows);
  atlas.texture.repeat.set(1 / atlas.cols, 1 / atlas.rows);
  // Force update the matrix immediately. WebGLRenderer relies on it for the mapTransform uniform.
  atlas.texture.updateMatrix();
}

/**
 * Pure UV calculation for a frame in the atlas — sharable across both the
 * texture-matrix path (setAtlasFrame, used by guild hall animators) and the
 * uniform path (combat panel idle sprite, see combat/idle-sprite-material.ts).
 * No side effects; safe to call per frame in render loops.
 */
export function getAtlasFrameUv(
  atlas: SpriteAtlas,
  frameIndex: number,
): { u: number; v: number; w: number; h: number } {
  const col = frameIndex % atlas.cols;
  const row = Math.floor(frameIndex / atlas.cols);
  return {
    u: col / atlas.cols,
    v: 1 - (row + 1) / atlas.rows,
    w: 1 / atlas.cols,
    h: 1 / atlas.rows,
  };
}

/**
 * Wrap a single pre-packed sheet texture as a SpriteAtlas. No canvas draw.
 *
 * Use with `useLoader(TextureLoader, sheetPath)` (one URL string, not array).
 * Frame addressing: atlasIdx = row * cols + frame, where row is derived from
 * the manifest's dirRows via indexOf — never a local hardcoded direction map.
 *
 * IMPORTANT — clones the input texture. `useLoader(TextureLoader, url)` returns
 * ONE cached Texture per URL, shared across every component that loads the same
 * sheet. The texture-offset animators (sprite-animator, guild-hall, working,
 * woodcutting, enemy) animate by mutating `texture.offset` via setAtlasFrame, so
 * a shared texture would make all instances of the same character fight over one
 * offset (last writer wins → every member shows the same frame/direction).
 * Cloning gives each instance an independent offset/repeat/matrix while three.js
 * shares the underlying `Source` — so there is exactly ONE GPU upload regardless
 * of instance count (matches the per-instance independence the old
 * buildAtlasFromTextures CanvasTexture path had). Combat uses uniform-UV (it does
 * not touch texture.offset), so the clone is harmless there.
 *
 * Mipmap note: NearestMipmapNearestFilter matches the old buildAtlasFromTextures
 * behavior. If mip-bleed appears across sheet cells in QA (padded dims), flip to
 * NearestFilter + generateMipmaps=false — see phase-03 Risk/Open-Q2.
 */
export function buildAtlasFromSheet(
  texture: THREE.Texture,
  cols: number,
  rows: number,
  frameCount: number,
): SpriteAtlas {
  const tex = texture.clone();
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestMipmapNearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.repeat.set(1 / cols, 1 / rows);
  tex.offset.set(0, 1 - 1 / rows);
  tex.needsUpdate = true;
  return { texture: tex, cols, rows, frameCount };
}
