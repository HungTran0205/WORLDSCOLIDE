/**
 * Mega-Atlas Builder — packs ALL sprite frames for combat into shared atlas textures.
 * One atlas per sprite-size group (e.g. 128×128, 256×256).
 * Canvas disposed after GPU upload to save RAM.
 */

import * as THREE from 'three';
import { SpriteRegistry } from './sprite-registry';
import type { SpriteTypeEntry } from './sprite-registry';
import { getSpritePath, getRunningFramePath, getAttackFramePath, getEnemyAnimFramePath } from '../sprite-path-resolver';
import type { Member } from '@/game/state/game-state';
import type { EnemyTemplate } from '@/game/data/enemies';

/** Max atlas dimension — safe GPU limit */
const MAX_ATLAS_SIZE = 4096;
/** Columns per row in atlas packing */
const ATLAS_COLS = 8;

const WALK_FRAMES = 8;
const ATTACK_FRAMES = 4;
const ENEMY_WALK_FRAMES = 8;
const ENEMY_ATTACK_FRAMES = 4;
const ENEMY_DEATH_FRAMES = 8;

/** Load a single image — returns null on failure (graceful 404) */
function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Load multiple images, filtering out failures */
async function loadImages(urls: string[]): Promise<(HTMLImageElement | null)[]> {
  return Promise.all(urls.map(loadImage));
}

/** Result of building a mega-atlas */
export interface MegaAtlasResult {
  /** Atlas textures (one per size-group, usually just 1) */
  textures: THREE.CanvasTexture[];
  /** Populated sprite registry */
  registry: SpriteRegistry;
}

/**
 * Sprite info collected before packing — intermediate structure.
 */
interface SpritePack {
  typeId: string;
  frameWidth: number;
  frameHeight: number;
  animations: Map<string, { frames: (HTMLImageElement | null)[]; }>;
}

/**
 * Build mega-atlas for a set of party members + enemy templates.
 * Call during 'marching' phase — blocks until all images loaded & packed.
 */
export async function buildCombatAtlases(
  members: Member[],
  enemyTemplates: EnemyTemplate[],
): Promise<MegaAtlasResult> {
  const packs: SpritePack[] = [];

  // --- Collect character sprite data ---
  const seenCharTypes = new Set<string>();
  for (const member of members) {
    const basePath = getSpritePath(member.civilization ?? '', member.archetype ?? '', member.gender ?? 'M');
    const typeId = basePath.split('/').pop() ?? basePath;

    if (seenCharTypes.has(typeId)) continue;
    seenCharTypes.add(typeId);

    const animations = new Map<string, { frames: (HTMLImageElement | null)[] }>();

    // Walk/run frames — east direction only (mirrored for west via X-scale flip)
    const walkUrls: string[] = [];
    for (let i = 0; i < WALK_FRAMES; i++) {
      walkUrls.push(getRunningFramePath(basePath, 'east', i));
    }
    const walkImgs = await loadImages(walkUrls);
    animations.set('walk', { frames: walkImgs });

    // Attack frames — east direction only (mirrored for west)
    const atkUrls: string[] = [];
    for (let i = 0; i < ATTACK_FRAMES; i++) {
      atkUrls.push(getAttackFramePath(basePath, 'east', i));
    }
    const atkImgs = await loadImages(atkUrls);
    // Only add if at least one frame loaded
    if (atkImgs.some(img => img !== null)) {
      animations.set('attack', { frames: atkImgs });
    }

    // Determine frame size from first valid image
    const firstImg = walkImgs.find(img => img !== null);
    const frameWidth = firstImg?.width ?? 128;
    const frameHeight = firstImg?.height ?? 128;

    packs.push({ typeId, frameWidth, frameHeight, animations });
  }

  // --- Collect enemy sprite data ---
  const seenEnemyTypes = new Set<string>();
  for (const tmpl of enemyTemplates) {
    const spriteId = tmpl.spriteId ?? tmpl.id;
    if (seenEnemyTypes.has(spriteId)) continue;
    seenEnemyTypes.add(spriteId);

    const animations = new Map<string, { frames: (HTMLImageElement | null)[] }>();

    // Walk frames
    const walkUrls: string[] = [];
    for (let i = 0; i < ENEMY_WALK_FRAMES; i++) {
      walkUrls.push(getEnemyAnimFramePath(spriteId, 'walk', i));
    }
    const walkImgs = await loadImages(walkUrls);
    animations.set('walk', { frames: walkImgs });

    // Attack frames
    const atkUrls: string[] = [];
    for (let i = 0; i < ENEMY_ATTACK_FRAMES; i++) {
      atkUrls.push(getEnemyAnimFramePath(spriteId, 'attack', i));
    }
    const atkImgs = await loadImages(atkUrls);
    if (atkImgs.some(img => img !== null)) {
      animations.set('attack', { frames: atkImgs });
    }

    // Death frames
    const deathUrls: string[] = [];
    for (let i = 0; i < ENEMY_DEATH_FRAMES; i++) {
      deathUrls.push(getEnemyAnimFramePath(spriteId, 'death', i));
    }
    const deathImgs = await loadImages(deathUrls);
    if (deathImgs.some(img => img !== null)) {
      animations.set('death', { frames: deathImgs });
    }

    const firstImg = walkImgs.find(img => img !== null);
    const frameWidth = firstImg?.width ?? 128;
    const frameHeight = firstImg?.height ?? 128;

    packs.push({ typeId: spriteId, frameWidth, frameHeight, animations });
  }

  // --- Build single atlas (uniform cell size from max dimensions) ---
  const registry = new SpriteRegistry();
  const cellW = Math.max(...packs.map(p => p.frameWidth), 1);
  const cellH = Math.max(...packs.map(p => p.frameHeight), 1);

  // Calculate total rows needed
  let totalRows = 0;
  for (const pack of packs) {
    for (const [, animData] of pack.animations) {
      totalRows += Math.ceil(animData.frames.length / ATLAS_COLS);
    }
  }

  const atlasWidth = Math.min(ATLAS_COLS * cellW, MAX_ATLAS_SIZE);
  const atlasHeight = Math.min(totalRows * cellH, MAX_ATLAS_SIZE);

  const canvas = document.createElement('canvas');
  canvas.width = atlasWidth;
  canvas.height = atlasHeight;
  const ctx = canvas.getContext('2d')!;

  // Draw frames and register — all packs into one atlas
  let currentRow = 0;
  for (const pack of packs) {
    const entry: SpriteTypeEntry = {
      typeId: pack.typeId,
      frameWidth: cellW,
      frameHeight: cellH,
      nativeFrameWidth: pack.frameWidth,
      nativeFrameHeight: pack.frameHeight,
      animations: new Map(),
    };

    for (const [animName, animData] of pack.animations) {
      const frameCount = animData.frames.length;
      const startRow = currentRow;

      for (let i = 0; i < frameCount; i++) {
        const img = animData.frames[i];
        if (!img) continue;

        const col = i % ATLAS_COLS;
        const row = startRow + Math.floor(i / ATLAS_COLS);
        // Center sprite in cell (handles mixed dimensions, e.g. 84×84 enemy in 132×132 cell)
        const ox = Math.floor((cellW - img.width) / 2);
        const oy = Math.floor((cellH - img.height) / 2);
        ctx.drawImage(img, col * cellW + ox, row * cellH + oy);
      }

      entry.animations.set(animName, {
        frameCount,
        atlasIndex: 0,
        startCol: 0,
        startRow,
      });

      currentRow += Math.ceil(frameCount / ATLAS_COLS);
    }

    registry.registerSpriteType(entry, 0, { width: atlasWidth, height: atlasHeight });
  }

  // Create Three.js texture
  const atlasTexture = new THREE.CanvasTexture(canvas);
  atlasTexture.magFilter = THREE.NearestFilter;
  atlasTexture.minFilter = THREE.NearestFilter;
  atlasTexture.colorSpace = THREE.SRGBColorSpace;
  atlasTexture.generateMipmaps = false;
  atlasTexture.flipY = false; // UV formula assumes no flip: v=0 → canvas top, v=1 → canvas bottom

  return { textures: [atlasTexture], registry };
}

/**
 * Preload combat atlases — call from CombatFightController before combat starts.
 * Returns a promise that resolves when all atlases are built.
 */
export async function preloadCombatAtlases(
  members: Member[],
  enemyTemplates: EnemyTemplate[],
): Promise<MegaAtlasResult> {
  return buildCombatAtlases(members, enemyTemplates);
}
