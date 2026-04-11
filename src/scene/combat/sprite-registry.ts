/**
 * Sprite Atlas Registry — maps (spriteTypeId, animState, frameIndex) → UV coordinates.
 * Central lookup table consumed by InstancedSpriteRenderer for GPU-driven animation.
 */

/** UV rectangle in normalized atlas coordinates (0-1) */
export interface AtlasUV {
  /** X offset (normalized 0-1) */
  u: number;
  /** Y offset (normalized 0-1) */
  v: number;
  /** Width (normalized) */
  w: number;
  /** Height (normalized) */
  h: number;
}

/** Metadata for one animation within a sprite type */
export interface AnimInfo {
  /** Number of frames in this animation */
  frameCount: number;
  /** Which atlas texture index (if multiple atlases) */
  atlasIndex: number;
  /** Starting column in the atlas grid */
  startCol: number;
  /** Starting row in the atlas grid */
  startRow: number;
}

/** Full registration for a sprite type (one character/enemy model) */
export interface SpriteTypeEntry {
  typeId: string;
  /** Pixel width of one frame */
  frameWidth: number;
  /** Pixel height of one frame */
  frameHeight: number;
  /** Animation state name → anim info */
  animations: Map<string, AnimInfo>;
}

/** Atlas texture dimensions used for UV calculations */
interface AtlasDimensions {
  /** Total atlas width in pixels */
  width: number;
  /** Total atlas height in pixels */
  height: number;
}

/**
 * In-memory registry of all registered sprite types.
 * Populated by MegaAtlasBuilder, queried by InstancedSpriteRenderer every frame.
 */
export class SpriteRegistry {
  private types = new Map<string, SpriteTypeEntry>();
  private atlasDimensions = new Map<number, AtlasDimensions>();
  /** Cached UV lookups — key: `typeId|animState|frame` */
  private uvCache = new Map<string, AtlasUV>();

  /** Register a sprite type + its atlas dimensions for UV calculation */
  registerSpriteType(entry: SpriteTypeEntry, atlasIndex: number, dims: AtlasDimensions): void {
    this.types.set(entry.typeId, entry);
    if (!this.atlasDimensions.has(atlasIndex)) {
      this.atlasDimensions.set(atlasIndex, dims);
    }
  }

  /** Look up the UV rect for a specific (type, anim, frame) combo */
  getFrameUV(typeId: string, animState: string, frameIndex: number): AtlasUV | null {
    const cacheKey = `${typeId}|${animState}|${frameIndex}`;
    const cached = this.uvCache.get(cacheKey);
    if (cached) return cached;

    const entry = this.types.get(typeId);
    if (!entry) return null;

    const anim = entry.animations.get(animState);
    if (!anim) {
      // Fallback: try 'walk' for unknown states
      const fallback = entry.animations.get('walk');
      if (!fallback) return null;
      return this.getFrameUV(typeId, 'walk', 0);
    }

    const clampedFrame = frameIndex % anim.frameCount;
    const dims = this.atlasDimensions.get(anim.atlasIndex);
    if (!dims) return null;

    // Handle multi-row animations (frames wrap at atlas column count)
    const colsPerRow = Math.floor(dims.width / entry.frameWidth);
    const col = anim.startCol + (clampedFrame % colsPerRow);
    const row = anim.startRow + Math.floor(clampedFrame / colsPerRow);

    const uv: AtlasUV = {
      u: (col * entry.frameWidth) / dims.width,
      // flipY=false: UV.y=0 → canvas top, UV.y=1 → canvas bottom.
      // v = bottom of frame row (feet), h negative sweeps up to top (head).
      // Shader: atlasUv.y = v + baseUv.y * h → baseUv.y=0 (feet), =1 (head).
      v: ((row + 1) * entry.frameHeight) / dims.height,
      w: entry.frameWidth / dims.width,
      h: -(entry.frameHeight / dims.height),
    };

    this.uvCache.set(cacheKey, uv);
    return uv;
  }

  /** Get sprite type entry by ID */
  getSpriteType(typeId: string): SpriteTypeEntry | undefined {
    return this.types.get(typeId);
  }

  /** Check if a sprite type is registered */
  hasType(typeId: string): boolean {
    return this.types.has(typeId);
  }

  /** Get all registered type IDs */
  getTypeIds(): string[] {
    return Array.from(this.types.keys());
  }

  /** Clear all registrations (e.g. on combat exit) */
  clear(): void {
    this.types.clear();
    this.atlasDimensions.clear();
    this.uvCache.clear();
  }
}
