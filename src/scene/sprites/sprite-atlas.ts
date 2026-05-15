/**
 * Sprite atlas loader — packs individual frame images into a single
 * CanvasTexture grid. Animation selects frames via texture.offset/repeat
 * instead of swapping material.map (zero texture binding overhead).
 *
 * Atlas layout: frames arranged in a grid, left-to-right, top-to-bottom.
 */

import * as THREE from 'three';

export interface SpriteAtlas {
  /** Single CanvasTexture containing all frames in a grid */
  texture: THREE.CanvasTexture;
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
 * Build a sprite atlas from an array of already-loaded Three.js Textures.
 * Draws all frames onto a single Canvas in a grid layout.
 *
 * @param textures - Array of loaded textures (from useLoader or manual load)
 * @param cols - Number of columns in the grid (default: 8)
 * @returns SpriteAtlas with one shared CanvasTexture
 */
export function buildAtlasFromTextures(
  textures: THREE.Texture[],
  cols = 8,
): SpriteAtlas {
  if (textures.length === 0) {
    throw new Error('Cannot build atlas from empty texture array');
  }

  const frameCount = textures.length;
  const rows = Math.ceil(frameCount / cols);

  // Get frame dimensions from first texture's source image
  const firstImage = textures[0].image as HTMLImageElement | HTMLCanvasElement;
  const frameW = firstImage.width || 128;
  const frameH = firstImage.height || 128;

  // Create atlas canvas
  const canvas = document.createElement('canvas');
  canvas.width = cols * frameW;
  canvas.height = rows * frameH;
  const ctx = canvas.getContext('2d')!;

  // Draw each frame into grid position
  for (let i = 0; i < frameCount; i++) {
    const img = textures[i].image as HTMLImageElement | HTMLCanvasElement;
    const col = i % cols;
    const row = Math.floor(i / cols);
    ctx.drawImage(img, col * frameW, row * frameH, frameW, frameH);
  }

  // Create a single CanvasTexture
  const atlasTexture = new THREE.CanvasTexture(canvas);
  atlasTexture.magFilter = THREE.NearestFilter;
  // NearestMipmapNearestFilter: preserve pixel-art look at zoom-in,
  // use pre-computed mip levels at distance (avoids random aliasing sampling).
  atlasTexture.minFilter = THREE.NearestMipmapNearestFilter;
  atlasTexture.colorSpace = THREE.SRGBColorSpace;
  atlasTexture.generateMipmaps = true;

  // Set initial frame (0,0)
  atlasTexture.repeat.set(1 / cols, 1 / rows);
  atlasTexture.offset.set(0, 1 - 1 / rows);

  return { texture: atlasTexture, cols, rows, frameCount };
}

/**
 * Build a sprite atlas from an array of image URLs loaded manually.
 * Returns a Promise that resolves to the atlas.
 * Silently returns null if any image fails to load (graceful 404).
 */
export async function buildAtlasFromUrls(
  urls: string[],
  cols = 8,
): Promise<SpriteAtlas | null> {
  if (urls.length === 0) return null;

  try {
    const images = await Promise.all(
      urls.map(
        (url) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
          }),
      ),
    );

    const frameCount = images.length;
    const rows = Math.ceil(frameCount / cols);
    const frameW = images[0].width || 128;
    const frameH = images[0].height || 128;

    const canvas = document.createElement('canvas');
    canvas.width = cols * frameW;
    canvas.height = rows * frameH;
    const ctx = canvas.getContext('2d')!;

    for (let i = 0; i < frameCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      ctx.drawImage(images[i], col * frameW, row * frameH, frameW, frameH);
    }

    const atlasTexture = new THREE.CanvasTexture(canvas);
    atlasTexture.magFilter = THREE.NearestFilter;
    atlasTexture.minFilter = THREE.NearestMipmapNearestFilter;
    atlasTexture.colorSpace = THREE.SRGBColorSpace;
    atlasTexture.generateMipmaps = true;
    atlasTexture.repeat.set(1 / cols, 1 / rows);
    atlasTexture.offset.set(0, 1 - 1 / rows);

    return { texture: atlasTexture, cols, rows, frameCount };
  } catch {
    return null; // Graceful 404 — frames don't exist
  }
}
