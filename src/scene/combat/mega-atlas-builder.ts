/**
 * Mega-Atlas Builder — packs ALL sprite frames for combat into shared atlas textures.
 * One atlas per sprite-size group (e.g. 128×128, 256×256).
 * Canvas disposed after GPU upload to save RAM.
 */

import * as THREE from 'three';
import { SpriteRegistry } from './sprite-registry';
import type { SpriteTypeEntry } from './sprite-registry';
import {
  getSpritePath,
  getRunningFramePath,
  getAttackFramePath,
  getBackFramePath,
  getBattleIdleFramePath,
  getBlockingFramePath,
  getEnemyAnimFramePath,
} from '../sprite-path-resolver';
import type { Member } from '@/game/state/game-state';
import type { EnemyTemplate } from '@/game/data/enemies';

/** Max atlas dimension — WebGPU min spec `maxTextureDimension2D` is 8192,
 *  safe on all modern GPUs. Previous 4096 caused row overflow once battle-idle
 *  and blocking anims bumped total row count past the 4096/cellH threshold
 *  (e.g. 38+ rows × 168px cellH = ~6.4k px, clipped at 4096 → sprites missing
 *  + WebGPU device loss under pressure). */
const MAX_ATLAS_SIZE = 8192;
/** Columns per row in atlas packing */
const ATLAS_COLS = 8;

const WALK_FRAMES = 8;
const MAX_ATTACK_FRAMES = 8; // try 8 frames; warriors have 8, others may have 4
const BACK_FRAMES = 4;       // warrior return-jump animation
const BATTLE_IDLE_FRAMES = 4;
const BLOCKING_FRAMES = 4;
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
 * frames contains only successfully loaded images (no nulls).
 */
interface SpritePack {
  typeId: string;
  frameWidth: number;
  frameHeight: number;
  animations: Map<string, { frames: HTMLImageElement[]; }>;
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

    const animations = new Map<string, { frames: HTMLImageElement[] }>();

    // Walk/run frames — east direction only (mirrored for west via X-scale flip)
    const walkUrls: string[] = [];
    for (let i = 0; i < WALK_FRAMES; i++) {
      walkUrls.push(getRunningFramePath(basePath, 'east', i));
    }
    const walkImgs = await loadImages(walkUrls);
    const validWalkImgs = walkImgs.filter((img): img is HTMLImageElement => img !== null);
    animations.set('walk', { frames: validWalkImgs });

    // Attack frames — east direction only (mirrored for west).
    // Try up to MAX_ATTACK_FRAMES; use only frames that successfully load.
    // Warriors have 8 frames, other archetypes may have fewer.
    const atkUrls: string[] = [];
    for (let i = 0; i < MAX_ATTACK_FRAMES; i++) {
      atkUrls.push(getAttackFramePath(basePath, 'east', i));
    }
    const atkImgs = await loadImages(atkUrls);
    const validAtkImgs = atkImgs.filter((img): img is HTMLImageElement => img !== null);
    if (validAtkImgs.length > 0) {
      animations.set('attack', { frames: validAtkImgs });
    }

    // Back animation — warrior return-jump after attack (east direction)
    const backUrls: string[] = [];
    for (let i = 0; i < BACK_FRAMES; i++) {
      backUrls.push(getBackFramePath(basePath, 'east', i));
    }
    const backImgs = await loadImages(backUrls);
    const validBackImgs = backImgs.filter((img): img is HTMLImageElement => img !== null);
    if (validBackImgs.length > 0) {
      animations.set('back', { frames: validBackImgs });
    }

    // Battle-idle frames (combat stance loop) — east direction
    const biUrls: string[] = [];
    for (let i = 0; i < BATTLE_IDLE_FRAMES; i++) {
      biUrls.push(getBattleIdleFramePath(basePath, 'east', i));
    }
    const biImgs = await loadImages(biUrls);
    const validBiImgs = biImgs.filter((img): img is HTMLImageElement => img !== null);
    if (validBiImgs.length > 0) {
      animations.set('battle-idle', { frames: validBiImgs });
    }

    // Blocking frames (one-shot, hold last frame) — east direction
    const blkUrls: string[] = [];
    for (let i = 0; i < BLOCKING_FRAMES; i++) {
      blkUrls.push(getBlockingFramePath(basePath, 'east', i));
    }
    const blkImgs = await loadImages(blkUrls);
    const validBlkImgs = blkImgs.filter((img): img is HTMLImageElement => img !== null);
    if (validBlkImgs.length > 0) {
      animations.set('blocking', { frames: validBlkImgs });
    }

    // Determine frame size from first valid walk image
    const firstImg = validWalkImgs[0] ?? null;
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

    const animations = new Map<string, { frames: HTMLImageElement[] }>();

    // Walk frames
    const walkUrls: string[] = [];
    for (let i = 0; i < ENEMY_WALK_FRAMES; i++) {
      walkUrls.push(getEnemyAnimFramePath(spriteId, 'walk', i));
    }
    const walkImgs = await loadImages(walkUrls);
    const validEWalkImgs = walkImgs.filter((img): img is HTMLImageElement => img !== null);
    animations.set('walk', { frames: validEWalkImgs });

    // Attack frames
    const atkUrls: string[] = [];
    for (let i = 0; i < ENEMY_ATTACK_FRAMES; i++) {
      atkUrls.push(getEnemyAnimFramePath(spriteId, 'attack', i));
    }
    const atkImgs = await loadImages(atkUrls);
    const validEAtkImgs = atkImgs.filter((img): img is HTMLImageElement => img !== null);
    if (validEAtkImgs.length > 0) {
      animations.set('attack', { frames: validEAtkImgs });
    }

    // Death frames
    const deathUrls: string[] = [];
    for (let i = 0; i < ENEMY_DEATH_FRAMES; i++) {
      deathUrls.push(getEnemyAnimFramePath(spriteId, 'death', i));
    }
    const deathImgs = await loadImages(deathUrls);
    const validEDeathImgs = deathImgs.filter((img): img is HTMLImageElement => img !== null);
    if (validEDeathImgs.length > 0) {
      animations.set('death', { frames: validEDeathImgs });
    }

    const firstImg = validEWalkImgs[0] ?? null;
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

        const col = i % ATLAS_COLS;
        const row = startRow + Math.floor(i / ATLAS_COLS);
        // Bottom-anchor sprite in cell: feet of source art (already shifted to canvas
        // bottom edge by scripts/anchor-sprites-bottom.py) align with cell bottom edge.
        // Combined with renderer Y = scaleY/2, this places feet exactly on ground Y=0.
        const ox = Math.floor((cellW - img.width) / 2);
        const oy = cellH - img.height;
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
