/**
 * Combat-panel single-entity sprite — idle loop + attack + blocking + death animation + hit flash.
 *
 * Phase 3: loads ONE sheet PNG per animation state via useLoader(TextureLoader, sheetPath)
 * instead of N per-frame PNGs. Geometry (cols, rows, row, frameCount) comes from
 * resolveAllyCombatSheet / resolveEnemyCombatSheet which read SPRITE_SHEET_MANIFEST
 * with COMBAT_SPRITE_MANIFEST fallback chains identical to the old per-frame resolvers.
 *
 * KEPT UNCHANGED: the uniform-UV material path (idle-sprite-material.ts) with
 * handle.setUvRect / handle.setMap / handle.setTint. Sheets reduce distinct GPU
 * textures (one sheet vs many), which only helps the WebGPU N≥3 same-pipeline
 * dedupe pressure — the uniform-UV path is still required for correctness.
 *
 * Mask composite: buildCombatMaskCompositeAtlas now accepts a SheetCompositeSource
 * (sheetTexture + cols/rows/row/frameCount) and slices body frames from the sheet
 * via canvas drawImage — no per-frame bodyTextures[] needed.
 *
 * Pre-conditions:
 * - Camera + lighting mounted by <CombatScene>.
 * - Sheet resolvers always return SOME path (fallback chain never 404s for allies).
 */

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { TextureLoader, Mesh, Group } from 'three';
import type { ArenaEntitySnapshot } from '@/game/state/combat-arena-slice';
import { COMBAT_CAM_TILT_RAD, getCombatSpriteScale } from './combat-camera-config';
import { resolveMemberMaskId, getMaskAssetPath } from '@/scene/sprites/mask-pool';
import {
  resolveAllyCombatSheet,
  resolveEnemyCombatSheet,
  type CombatSheetInfo,
} from '@/scene/sprites/combat-sprite-resolver';
import { getSpritePath } from '@/scene/sprites/sprite-path-resolver';
import { buildAtlasFromSheet, getAtlasFrameUv } from '@/scene/sprites/sprite-atlas';
import type { SpriteAtlas } from '@/scene/sprites/sprite-atlas';
import { createIdleSpriteMaterial, type IdleSpriteMaterialHandle } from './idle-sprite-material';
import {
  buildCombatMaskCompositeAtlas,
  subscribeToAtlasInvalidations,
  getAtlasInvalidationVersion,
} from './combat-mask-composite-atlas';
import { COMBAT_IMPACT_DELAY_S } from './combat-vfx-bridge';

const IDLE_FPS = 6.5;
const ATTACK_FPS = 12;
const BLOCKING_FPS = 10;
const DEATH_FPS = 8;
const FLASH_DURATION_MS = 110;

// Red hit flash — R over-bright, G/B suppressed (multiplicative tint).
const FLASH_R = 2.8, FLASH_G = 0.4, FLASH_B = 0.4;
const DEAD_R = 0.7, DEAD_G = 0.7, DEAD_B = 0.7;
const NORMAL_R = 0.97, NORMAL_G = 0.98, NORMAL_B = 1.0;

// Sentinel mask path — preloaded on boot; required so useLoader is called unconditionally.
const SENTINEL_MASK_PATH = getMaskAssetPath('mask-01', 'east');

/** Slide-in lerp constant (k≈8 → ~0.3–0.4s settle). */
const SLIDE_LERP_K = 8;

interface CombatIdleSpriteProps {
  entity: ArenaEntitySnapshot;
}

export function CombatIdleSprite({ entity }: CombatIdleSpriteProps) {
  const meshRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);
  const dispXRef = useRef<number | null>(null);
  const { gl } = useThree();

  const maskId = useMemo(() => {
    if (entity.spriteId || !entity.isAlly) return null;
    return resolveMemberMaskId({ id: entity.id, maskSpriteId: entity.maskSpriteId });
  }, [entity.id, entity.maskSpriteId, entity.spriteId, entity.isAlly]);

  const atlasVersion = useSyncExternalStore(subscribeToAtlasInvalidations, getAtlasInvalidationVersion);

  const [handle, setHandle] = useState<IdleSpriteMaterialHandle | null>(null);
  const frameIndexRef = useRef(0);
  const elapsedRef = useRef(0);
  const deathFrozenRef = useRef(false);
  const lastHpRef = useRef(entity.currentHp);
  const flashUntilRef = useRef(0);
  const wasDeadRef = useRef(entity.currentHp <= 0);
  const lastMapRef = useRef<import('three').Texture | null>(null);
  const lastAnimStateRef = useRef<'idle' | 'attack' | 'blocking' | 'death'>('idle');

  // Resolve sheet info for each animation state
  const { charId, idleInfo, attackInfo, blockingInfo, deathInfo, hasDedicatedAttack, hasDedicatedBlocking } =
    useCombatSheetInfo(entity.isAlly, entity.archetype, entity.civilization, entity.gender, entity.spriteId);

  // Load ONE sheet per state (useLoader deduplicates by URL — same path = cache hit)
  const idleSheetTex   = useLoader(TextureLoader, idleInfo.sheetPath);
  const attackSheetTex = useLoader(TextureLoader, attackInfo.sheetPath);
  const blockingSheetTex = useLoader(TextureLoader, blockingInfo.sheetPath);
  const deathSheetTex  = useLoader(TextureLoader, deathInfo.sheetPath);

  // Mask texture — always load unconditionally (React hook rules)
  const maskPath = maskId ? getMaskAssetPath(maskId, 'east') : SENTINEL_MASK_PATH;
  const maskTexture = useLoader(TextureLoader, maskPath);

  // Build body atlases from sheets
  const idleAtlas = useMemo<SpriteAtlas>(
    () => buildAtlasFromSheet(idleSheetTex, idleInfo.cols, idleInfo.rows, idleInfo.frameCount),
    [idleSheetTex, idleInfo.cols, idleInfo.rows, idleInfo.frameCount],
  );
  const dedicatedAttackAtlas = useMemo<SpriteAtlas | null>(() => {
    if (!hasDedicatedAttack) return null;
    return buildAtlasFromSheet(attackSheetTex, attackInfo.cols, attackInfo.rows, attackInfo.frameCount);
  }, [attackSheetTex, attackInfo.cols, attackInfo.rows, attackInfo.frameCount, hasDedicatedAttack]);

  const attackAtlas = dedicatedAttackAtlas ?? idleAtlas;

  const dedicatedBlockingAtlas = useMemo<SpriteAtlas | null>(() => {
    if (!hasDedicatedBlocking) return null;
    return buildAtlasFromSheet(blockingSheetTex, blockingInfo.cols, blockingInfo.rows, blockingInfo.frameCount);
  }, [blockingSheetTex, blockingInfo.cols, blockingInfo.rows, blockingInfo.frameCount, hasDedicatedBlocking]);

  const blockingAtlas = dedicatedBlockingAtlas ?? idleAtlas;

  const deathAtlas = useMemo<SpriteAtlas>(
    () => buildAtlasFromSheet(deathSheetTex, deathInfo.cols, deathInfo.rows, deathInfo.frameCount),
    [deathSheetTex, deathInfo.cols, deathInfo.rows, deathInfo.frameCount],
  );

  // Composite masked atlases — built for live ally non-death animations only.
  // buildCombatMaskCompositeAtlas is cached by charId|maskId|anim|row|frameCount.
  const maskedIdleAtlas = useMemo<SpriteAtlas | null>(() => {
    if (!maskId || !charId) return null;
    return buildCombatMaskCompositeAtlas({
      charId, anim: 'idle', maskId,
      sheetSource: { sheetTexture: idleSheetTex, cols: idleInfo.cols, rows: idleInfo.rows, row: idleInfo.row, frameCount: idleInfo.frameCount },
      maskTexture,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maskId, charId, maskTexture, idleSheetTex, idleInfo.row, idleInfo.frameCount, atlasVersion]);

  const maskedAttackAtlas = useMemo<SpriteAtlas | null>(() => {
    if (!maskId || !charId) return null;
    return buildCombatMaskCompositeAtlas({
      charId, anim: 'attack', maskId,
      sheetSource: { sheetTexture: attackSheetTex, cols: attackInfo.cols, rows: attackInfo.rows, row: attackInfo.row, frameCount: attackInfo.frameCount },
      maskTexture,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maskId, charId, maskTexture, attackSheetTex, attackInfo.row, attackInfo.frameCount, atlasVersion]);

  const maskedBlockingAtlas = useMemo<SpriteAtlas | null>(() => {
    if (!maskId || !charId) return null;
    return buildCombatMaskCompositeAtlas({
      charId, anim: 'blocking', maskId,
      sheetSource: { sheetTexture: blockingSheetTex, cols: blockingInfo.cols, rows: blockingInfo.rows, row: blockingInfo.row, frameCount: blockingInfo.frameCount },
      maskTexture,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maskId, charId, maskTexture, blockingSheetTex, blockingInfo.row, blockingInfo.frameCount, atlasVersion]);

  // Hit flash trigger — delayed to the attack's connect frame so the flash lands
  // together with the impact mesh + hit particles (both delayed by
  // COMBAT_IMPACT_DELAY_S). Damage is applied instantly in the engine tick, so
  // firing the flash on the HP drop made it read ~0.33s before the visual hit.
  useEffect(() => {
    const dropped = entity.currentHp < lastHpRef.current;
    lastHpRef.current = entity.currentHp;
    if (!dropped) return;
    const timer = setTimeout(() => {
      flashUntilRef.current = performance.now() + FLASH_DURATION_MS;
    }, COMBAT_IMPACT_DELAY_S * 1000);
    return () => clearTimeout(timer);
  }, [entity.currentHp]);

  // Build per-entity material handle once when idle atlas is ready.
  useEffect(() => {
    let cancelled = false;
    let createdHandle: IdleSpriteMaterialHandle | null = null;
    createIdleSpriteMaterial(idleAtlas.texture, gl).then((h) => {
      if (cancelled) { h.dispose(); return; }
      createdHandle = h;
      lastMapRef.current = idleAtlas.texture;
      setHandle(h);
    });
    return () => {
      cancelled = true;
      if (createdHandle) createdHandle.dispose();
    };
  }, [idleAtlas.texture, gl]);

  useFrame((_, dt) => {
    const mesh = meshRef.current;
    const group = groupRef.current;
    if (!handle || !mesh || !group) return;

    // Cosmetic slide-in
    if (dispXRef.current === null) {
      dispXRef.current = entity.spawnSlideFromX ?? entity.position.x;
    }
    const targetX = entity.position.x;
    const dispX = dispXRef.current + (targetX - dispXRef.current) * Math.min(1, dt * SLIDE_LERP_K);
    dispXRef.current = dispX;
    group.position.x = dispX;

    const isDead = entity.currentHp <= 0;
    const isAttackingState = entity.animState === 'attacking' || entity.animState === 'skill';
    const isBlockingState = entity.animState === 'blocking';

    const currentAnim: 'idle' | 'attack' | 'blocking' | 'death' = isDead
      ? 'death'
      : isAttackingState ? 'attack'
      : isBlockingState ? 'blocking'
      : 'idle';

    if (isDead && !wasDeadRef.current) {
      frameIndexRef.current = 0;
      elapsedRef.current = 0;
      deathFrozenRef.current = false;
      wasDeadRef.current = true;
    } else if (!isDead && wasDeadRef.current) {
      frameIndexRef.current = 0;
      elapsedRef.current = 0;
      deathFrozenRef.current = false;
      wasDeadRef.current = false;
    }

    if (currentAnim !== lastAnimStateRef.current && currentAnim !== 'death') {
      frameIndexRef.current = 0;
      elapsedRef.current = 0;
    }
    lastAnimStateRef.current = currentAnim;

    const liveScale = getCombatSpriteScale(entity.position.z, !!entity.isBoss);
    mesh.scale.x = liveScale;
    mesh.scale.y = liveScale;
    mesh.position.y = (entity.position.y ?? 0) + liveScale * 0.5;

    // Select atlas and animation parameters for current state.
    // For sheet atlases, getAtlasFrameUv must account for the animation row
    // within the sheet. The composite atlas is always a single-row strip
    // (atlasCols=frameCount, atlasRows=1) so frameIndex maps directly.
    // Body atlases wrap the full sheet; UV must offset by the correct row.
    let atlas: SpriteAtlas;
    let frameCount: number;
    let fps: number;
    let sheetRow: number; // row within the body sheet atlas (0 for composite atlases)

    if (isDead) {
      atlas = deathAtlas;
      frameCount = deathInfo.frameCount;
      fps = DEATH_FPS;
      sheetRow = deathInfo.row;
    } else if (isAttackingState) {
      atlas = maskedAttackAtlas ?? attackAtlas;
      frameCount = attackInfo.frameCount;
      fps = ATTACK_FPS;
      // Composite atlas is a single-row strip; body sheet atlas uses attackInfo.row
      sheetRow = maskedAttackAtlas ? 0 : attackInfo.row;
    } else if (isBlockingState) {
      atlas = maskedBlockingAtlas ?? blockingAtlas;
      frameCount = blockingInfo.frameCount;
      fps = BLOCKING_FPS;
      sheetRow = maskedBlockingAtlas ? 0 : blockingInfo.row;
    } else {
      atlas = maskedIdleAtlas ?? idleAtlas;
      frameCount = idleInfo.frameCount;
      fps = IDLE_FPS;
      sheetRow = maskedIdleAtlas ? 0 : idleInfo.row;
    }

    if (lastMapRef.current !== atlas.texture) {
      handle.setMap(atlas.texture);
      lastMapRef.current = atlas.texture;
    }

    if (isDead) {
      if (!deathFrozenRef.current) {
        elapsedRef.current += dt;
        const interval = 1 / fps;
        while (elapsedRef.current >= interval && !deathFrozenRef.current) {
          elapsedRef.current -= interval;
          frameIndexRef.current++;
          if (frameIndexRef.current >= frameCount) {
            frameIndexRef.current = frameCount - 1;
            deathFrozenRef.current = true;
          }
        }
      }
    } else if (frameCount > 1) {
      elapsedRef.current += dt;
      const interval = 1 / fps;
      while (elapsedRef.current >= interval) {
        elapsedRef.current -= interval;
        frameIndexRef.current = (frameIndexRef.current + 1) % frameCount;
      }
    } else {
      frameIndexRef.current = 0;
    }

    // UV: for body atlases the atlas grid is the full sheet (cols×rows); we
    // address frame via row*cols + frameIndex. For composite atlases the grid
    // is frameCount×1 so frameIndex maps directly (row=0).
    const atlasFrameIdx = sheetRow * atlas.cols + frameIndexRef.current;
    const uvFrame = getAtlasFrameUv(atlas, atlasFrameIdx);
    handle.setUvRect(uvFrame.u, uvFrame.v, uvFrame.w, uvFrame.h);

    const now = performance.now();
    if (now < flashUntilRef.current) {
      handle.setTint(FLASH_R, FLASH_G, FLASH_B);
    } else if (isDead && deathFrozenRef.current) {
      handle.setTint(DEAD_R, DEAD_G, DEAD_B);
    } else {
      handle.setTint(NORMAL_R, NORMAL_G, NORMAL_B);
    }
  });

  const initialScale = getCombatSpriteScale(entity.position.z, !!entity.isBoss);
  const initialY = (entity.position.y ?? 0) + initialScale * 0.5;
  const initialGroupX = entity.spawnSlideFromX ?? entity.position.x;

  return (
    <group ref={groupRef} position={[initialGroupX, 0, entity.position.z]}>
      <mesh
        ref={meshRef}
        position={[0, initialY, 0]}
        rotation={[-COMBAT_CAM_TILT_RAD, 0, 0]}
        scale={[initialScale, initialScale, 1]}
      >
        <planeGeometry args={[1, 1]} />
        {handle && <primitive object={handle.material} attach="material" />}
      </mesh>
    </group>
  );
}

// ─── Sheet info resolver hook ─────────────────────────────────────────────────

interface CombatSheetSet {
  charId: string;
  idleInfo: CombatSheetInfo;
  attackInfo: CombatSheetInfo;
  blockingInfo: CombatSheetInfo;
  deathInfo: CombatSheetInfo;
  hasDedicatedAttack: boolean;
  hasDedicatedBlocking: boolean;
}

/** Resolve sheet info for all four combat animation states. Stable across snapshot syncs. */
function useCombatSheetInfo(
  isAlly: boolean,
  archetype: string | undefined,
  civilization: string | undefined,
  gender: 'M' | 'F' | undefined,
  spriteId: string | undefined,
): CombatSheetSet {
  return useMemo(() => {
    if (isAlly) {
      const base = getSpritePath(civilization ?? 'LinhSon', archetype ?? 'warrior', gender ?? 'M');
      const parts = base.replace(/\\/g, '/').split('/').filter(Boolean);
      const charId = parts[parts.length - 1] ?? '';

      const idleInfo     = resolveAllyCombatSheet(base, 'idle');
      const attackResolved = resolveAllyCombatSheet(base, 'attack');
      const blockingResolved = resolveAllyCombatSheet(base, 'blocking');
      const deathInfo    = resolveAllyCombatSheet(base, 'death');

      // hasDedicatedAttack: attack sheet path differs from idle sheet path
      const hasDedicatedAttack = attackResolved.sheetPath !== idleInfo.sheetPath;
      const hasDedicatedBlocking = blockingResolved.sheetPath !== idleInfo.sheetPath;

      return {
        charId,
        idleInfo,
        attackInfo: attackResolved,
        blockingInfo: blockingResolved,
        deathInfo,
        hasDedicatedAttack,
        hasDedicatedBlocking,
      };
    }

    const sid = spriteId ?? 'slime';
    const idleInfo     = resolveEnemyCombatSheet(sid, 'idle');
    const attackResolved = resolveEnemyCombatSheet(sid, 'attack');
    const deathInfo    = resolveEnemyCombatSheet(sid, 'death');
    const hasDedicatedAttack = attackResolved.sheetPath !== idleInfo.sheetPath;

    return {
      charId: '',
      idleInfo,
      attackInfo: attackResolved,
      // Enemies never block — reuse idle so Three.js returns a cached texture
      blockingInfo: idleInfo,
      deathInfo,
      hasDedicatedAttack,
      hasDedicatedBlocking: false,
    };
  }, [isAlly, archetype, civilization, gender, spriteId]);
}
