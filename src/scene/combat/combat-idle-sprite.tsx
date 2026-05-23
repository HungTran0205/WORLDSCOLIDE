/**
 * Combat-panel single-entity sprite — idle loop + attack + blocking + death animation + hit flash.
 *
 * Uses a per-entity NodeMaterial/ShaderMaterial with uniform-driven UV remap
 * (see idle-sprite-material.ts) to bypass WebGPU NodeMaterial's texture.matrix
 * dedupe behavior across pipeline cache. Each entity has its own uvRect uniform
 * → animation advances independently for every sprite.
 *
 * Atlas swap (idle/attack/blocking/death) updates the map node's value; UV update happens
 * every frame via handle.setUvRect(...). Tint (flash/dim/normal) routed through
 * handle.setTint instead of mutating material.color.
 *
 * Allies with a maskId render through composite atlases (body + identity mask baked into
 * each frame via combat-mask-composite-atlas.ts). Enemies and death always use plain body
 * atlases. No extra mesh for the mask.
 *
 * Pre-conditions:
 * - Camera + lighting are mounted by `<CombatScene>` (parent fragment).
 * - Resolver always returns *some* path — never 404 — so useLoader can't
 *   throw on missing assets (graceful degrade to walking-frame-0 fallback).
 */

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { TextureLoader, Mesh, Group, type Texture } from 'three';
import type { ArenaEntitySnapshot } from '@/game/state/combat-arena-slice';
import { COMBAT_CAM_TILT_RAD, getCombatSpriteScale } from './combat-camera-config';
import { resolveMemberMaskId, getMaskAssetPath } from '@/scene/sprites/mask-pool';
import {
  COMBAT_ATTACK_FRAME_COUNT,
  COMBAT_BLOCKING_FRAME_COUNT,
  COMBAT_DEATH_FRAME_COUNT,
  COMBAT_IDLE_FRAME_COUNT,
  getAllyCombatFrameCount,
  getEnemyCombatFrameCount,
  hasAllyAttackAnim,
  hasAllyBlockingAnim,
  hasEnemyAttackAnim,
  resolveAllyCombatSprite,
  resolveEnemyCombatSprite,
} from '@/scene/sprites/combat-sprite-resolver';
import { getSpritePath } from '@/scene/sprites/sprite-path-resolver';
import { buildAtlasFromTextures, getAtlasFrameUv } from '@/scene/sprites/sprite-atlas';
import type { SpriteAtlas } from '@/scene/sprites/sprite-atlas';
import { createIdleSpriteMaterial, type IdleSpriteMaterialHandle } from './idle-sprite-material';
import {
  buildCombatMaskCompositeAtlas,
  subscribeToAtlasInvalidations,
  getAtlasInvalidationVersion,
} from './combat-mask-composite-atlas';

const IDLE_FPS = 6.5;
const ATTACK_FPS = 12;
const BLOCKING_FPS = 10;  // 4 frames / 400ms blocking window → 10 fps
const DEATH_FPS = 8;
const FLASH_DURATION_MS = 110;

// Tint multipliers passed to handle.setTint (r, g, b). NodeMaterial/ShaderMaterial
// multiplies sampled texture by tint; >1 brightens (flash), <1 dims (dead), 1 = normal.
const FLASH_R = 2.4, FLASH_G = 2.4, FLASH_B = 2.4;
const DEAD_R = 0.7, DEAD_G = 0.7, DEAD_B = 0.7;
// NORMAL baseline is a subtle scene-integration tint (slightly < 1, faint cool
// bias) so full-bright pixel sprites sit inside the combat color-grade palette
// instead of popping out of the muted BG. Flash/dead are absolute setTint
// values (independent of this), so their read is unaffected.
const NORMAL_R = 0.97, NORMAL_G = 0.98, NORMAL_B = 1.0;

// Sentinel mask path for non-masked entities (enemies / no maskSpriteId).
// mask-01 is preloaded on app boot via preloadCombatMasks() → cache hit, no extra fetch.
// Required because useLoader must be called unconditionally (React hook rules).
const SENTINEL_MASK_PATH = getMaskAssetPath('mask-01', 'east');

interface CombatIdleSpriteProps {
  entity: ArenaEntitySnapshot;
}

/** Lerp constant for the spawn slide-in (k≈8 → ~0.3–0.4s settle time).
 *  Driven by real frame dt, independent of the 5Hz snapshot sync rate and
 *  speedMultiplier — so the slide is smooth at 1×/2×/4×. */
const SLIDE_LERP_K = 8;

export function CombatIdleSprite({ entity }: CombatIdleSpriteProps) {
  const meshRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);
  /** Current display X (cosmetic only). Initialized lazily in useFrame on first
   *  call so it reads the latest entity snapshot (entity may update before
   *  the first frame runs). Starts at spawnSlideFromX for new-wave enemies,
   *  or at position.x for wave-1 entities and allies (no visible motion). */
  const dispXRef = useRef<number | null>(null);
  const { gl } = useThree();

  // Allies-only identity mask. Enemies render via spriteId and skip composite logic.
  const maskId = useMemo(() => {
    if (entity.spriteId || !entity.isAlly) return null;
    return resolveMemberMaskId({ id: entity.id, maskSpriteId: entity.maskSpriteId });
  }, [entity.id, entity.maskSpriteId, entity.spriteId, entity.isAlly]);

  // Increments whenever the dev tuner invalidates a char's composite atlas cache,
  // forcing composite atlas memos to re-run and pick up new anchor values.
  const atlasVersion = useSyncExternalStore(subscribeToAtlasInvalidations, getAtlasInvalidationVersion);

  // Material handle is async-loaded (WebGPU TSL imports). Render placeholder
  // mesh-without-material until ready; parent <Suspense> covers texture load.
  const [handle, setHandle] = useState<IdleSpriteMaterialHandle | null>(null);
  const frameIndexRef = useRef(0);
  const elapsedRef = useRef(0);
  const deathFrozenRef = useRef(false);
  const lastHpRef = useRef(entity.currentHp);
  const flashUntilRef = useRef(0);
  const wasDeadRef = useRef(entity.currentHp <= 0);
  // Track last atlas texture set on the handle to skip redundant TextureNode swaps.
  const lastMapRef = useRef<Texture | null>(null);
  // Track last anim to reset frame counter on state transitions.
  const lastAnimStateRef = useRef<'idle' | 'attack' | 'blocking' | 'death'>('idle');

  const {
    charId,
    idlePaths, attackPaths, blockingPaths, deathPaths,
    idleFrames, attackFrames, blockingFrames, deathFrames,
    hasDedicatedAttack, hasDedicatedBlocking,
  } = useCombatSpritePaths(
    entity.isAlly,
    entity.archetype,
    entity.civilization,
    entity.gender,
    entity.spriteId,
  );

  const idleTextures = useLoader(TextureLoader, idlePaths);
  // When no dedicated attack, attackPaths === idlePaths content → Three.js cache hit.
  const attackTextures = useLoader(TextureLoader, attackPaths);
  // When no dedicated blocking, blockingPaths === idlePaths content → Three.js cache hit.
  const blockingTextures = useLoader(TextureLoader, blockingPaths);
  const deathTextures = useLoader(TextureLoader, deathPaths);

  // Mask texture — always load (React hook rules); sentinel for non-masked entities.
  const maskPath = maskId ? getMaskAssetPath(maskId, 'east') : SENTINEL_MASK_PATH;
  const maskTexture = useLoader(TextureLoader, maskPath);

  // Body atlases — same as before.
  const idleAtlas = useMemo<SpriteAtlas>(
    () => buildAtlasFromTextures(idleTextures, Math.max(1, COMBAT_IDLE_FRAME_COUNT)),
    [idleTextures],
  );
  const dedicatedAttackAtlas = useMemo<SpriteAtlas | null>(
    () => hasDedicatedAttack
      ? buildAtlasFromTextures(attackTextures, Math.max(1, COMBAT_ATTACK_FRAME_COUNT))
      : null,
    [attackTextures, hasDedicatedAttack],
  );
  const attackAtlas = dedicatedAttackAtlas ?? idleAtlas;
  const dedicatedBlockingAtlas = useMemo<SpriteAtlas | null>(
    () => hasDedicatedBlocking
      ? buildAtlasFromTextures(blockingTextures, Math.max(1, COMBAT_BLOCKING_FRAME_COUNT))
      : null,
    [blockingTextures, hasDedicatedBlocking],
  );
  const blockingAtlas = dedicatedBlockingAtlas ?? idleAtlas;
  const deathAtlas = useMemo<SpriteAtlas>(
    () => buildAtlasFromTextures(deathTextures, Math.max(1, COMBAT_DEATH_FRAME_COUNT)),
    [deathTextures],
  );

  // Composite masked atlases — built for live ally non-death animations only.
  // buildCombatMaskCompositeAtlas is cached by charId|maskId|anim|frameCount,
  // so repeated useMemo calls (same deps) are O(1) cache hits.
  // Death is always unmasked: entity hides on death, mask logic on death branch is unneeded.
  const maskedIdleAtlas = useMemo<SpriteAtlas | null>(
    () => (maskId && charId)
      ? buildCombatMaskCompositeAtlas({ charId, anim: 'idle', maskId, bodyTextures: Array.from(idleTextures), maskTexture, cols: Math.max(1, COMBAT_IDLE_FRAME_COUNT) })
      : null,
    // Use texture count as proxy: same paths → same count, composite cache handles the rest.
    // atlasVersion bumps when dev tuner invalidates cache → forces rebuild with new anchors.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maskId, charId, maskTexture, idleTextures.length, atlasVersion],
  );
  const maskedAttackAtlas = useMemo<SpriteAtlas | null>(
    () => (maskId && charId)
      ? buildCombatMaskCompositeAtlas({ charId, anim: 'attack', maskId, bodyTextures: Array.from(attackTextures), maskTexture, cols: Math.max(1, COMBAT_ATTACK_FRAME_COUNT) })
      : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maskId, charId, maskTexture, attackTextures.length, atlasVersion],
  );
  const maskedBlockingAtlas = useMemo<SpriteAtlas | null>(
    () => (maskId && charId)
      ? buildCombatMaskCompositeAtlas({ charId, anim: 'blocking', maskId, bodyTextures: Array.from(blockingTextures), maskTexture, cols: Math.max(1, COMBAT_BLOCKING_FRAME_COUNT) })
      : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maskId, charId, maskTexture, blockingTextures.length, atlasVersion],
  );

  // Trigger hit flash whenever current HP drops (not on heals or revives).
  useEffect(() => {
    if (entity.currentHp < lastHpRef.current) {
      flashUntilRef.current = performance.now() + FLASH_DURATION_MS;
    }
    lastHpRef.current = entity.currentHp;
  }, [entity.currentHp]);

  // Build the per-entity material handle once when the idle atlas is ready.
  // Async because the WebGPU path imports three/tsl + three/webgpu lazily.
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

    // Cosmetic slide-in: lerp display X toward the entity's logic home X.
    // Lazy-init dispX on the first frame so we read the current snapshot value
    // (spawnSlideFromX is only present on the first snapshot after wave spawn).
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

    // Death enter: reset frame counter so animation plays from start.
    if (isDead && !wasDeadRef.current) {
      frameIndexRef.current = 0;
      elapsedRef.current = 0;
      deathFrozenRef.current = false;
      wasDeadRef.current = true;
    } else if (!isDead && wasDeadRef.current) {
      // Revive (rare — e.g. cheat / debug): rewind to idle.
      frameIndexRef.current = 0;
      elapsedRef.current = 0;
      deathFrozenRef.current = false;
      wasDeadRef.current = false;
    }

    // Animation transition — restart frame counter so each clip starts from frame 0.
    // (death enter is handled above; skip re-reset here for death.)
    if (currentAnim !== lastAnimStateRef.current && currentAnim !== 'death') {
      frameIndexRef.current = 0;
      elapsedRef.current = 0;
    }
    lastAnimStateRef.current = currentAnim;

    const liveScale = getCombatSpriteScale(entity.position.z, !!entity.isBoss);
    mesh.scale.x = liveScale;
    mesh.scale.y = liveScale;
    mesh.position.y = (entity.position.y ?? 0) + liveScale * 0.5;

    // Atlas selection: masked composite for live ally non-death; body atlas otherwise.
    let atlas: SpriteAtlas;
    let frameCount: number;
    let fps: number;
    if (isDead) {
      atlas = deathAtlas;
      frameCount = deathFrames;
      fps = DEATH_FPS;
    } else if (isAttackingState) {
      atlas = maskedAttackAtlas ?? attackAtlas;
      frameCount = attackFrames;
      fps = ATTACK_FPS;
    } else if (isBlockingState) {
      atlas = maskedBlockingAtlas ?? blockingAtlas;
      frameCount = blockingFrames;
      fps = BLOCKING_FPS;
    } else {
      atlas = maskedIdleAtlas ?? idleAtlas;
      frameCount = idleFrames;
      fps = IDLE_FPS;
    }

    // Atlas swap — only call setMap when texture actually changes.
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

    const uvFrame = getAtlasFrameUv(atlas, frameIndexRef.current);
    handle.setUvRect(uvFrame.u, uvFrame.v, uvFrame.w, uvFrame.h);

    // Tint: white flash on hit, dimmed grey when dead, normal otherwise.
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
  // Initial group X: start at spawnSlideFromX (off-screen) for new-wave enemies,
  // or at the home slot for wave-1 entities and allies. The useFrame lerp drives
  // group.position.x every frame so this value is immediately overwritten.
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
        {/* Material handle is async-loaded by createIdleSpriteMaterial (WebGPU
            path lazy-imports three/tsl + three/webgpu). Until ready, the mesh
            renders without a material — parent <Suspense> covers the window. */}
        {handle && <primitive object={handle.material} attach="material" />}
      </mesh>
    </group>
  );
}

function range(n: number): number[] {
  return Array.from({ length: Math.max(1, n) }, (_, i) => i);
}

interface SpritePathSet {
  /** Last path segment of the basePath — used as charId for composite atlas keying. */
  charId: string;
  idlePaths: string[];
  attackPaths: string[];
  /** Blocking frames for allies; falls back to idle paths for enemies / chars without blocking. */
  blockingPaths: string[];
  deathPaths: string[];
  idleFrames: number;
  attackFrames: number;
  blockingFrames: number;
  deathFrames: number;
  /** False when attack falls back to idle paths — sprite component reuses idleAtlas. */
  hasDedicatedAttack: boolean;
  /** False when blocking falls back to idle paths — sprite component reuses idleAtlas. */
  hasDedicatedBlocking: boolean;
}

/** Resolve all animation paths for an entity. Stable across snapshot syncs. */
function useCombatSpritePaths(
  isAlly: boolean,
  archetype: string | undefined,
  civilization: string | undefined,
  gender: 'M' | 'F' | undefined,
  spriteId: string | undefined,
): SpritePathSet {
  return useMemo(() => {
    if (isAlly) {
      const base = getSpritePath(civilization ?? 'LinhSon', archetype ?? 'warrior', gender ?? 'M');
      const parts = base.split('/').filter(Boolean);
      const charId = parts[parts.length - 1] ?? '';
      const ic = getAllyCombatFrameCount(base, 'idle');
      const ac = getAllyCombatFrameCount(base, 'attack');
      const bc = getAllyCombatFrameCount(base, 'blocking');
      const dc = getAllyCombatFrameCount(base, 'death');
      return {
        charId,
        idlePaths: range(ic).map((i) => resolveAllyCombatSprite(base, 'idle', i)),
        attackPaths: range(ac).map((i) => resolveAllyCombatSprite(base, 'attack', i)),
        blockingPaths: range(bc).map((i) => resolveAllyCombatSprite(base, 'blocking', i)),
        deathPaths: range(dc).map((i) => resolveAllyCombatSprite(base, 'death', i)),
        idleFrames: ic,
        attackFrames: ac,
        blockingFrames: bc,
        deathFrames: dc,
        hasDedicatedAttack: hasAllyAttackAnim(base),
        hasDedicatedBlocking: hasAllyBlockingAnim(base),
      };
    }
    const sid = spriteId ?? 'slime';
    const ic = getEnemyCombatFrameCount(sid, 'idle');
    const ac = getEnemyCombatFrameCount(sid, 'attack');
    const dc = getEnemyCombatFrameCount(sid, 'death');
    const idlePaths = range(ic).map((i) => resolveEnemyCombatSprite(sid, 'idle', i));
    return {
      charId: '',
      idlePaths,
      attackPaths: range(ac).map((i) => resolveEnemyCombatSprite(sid, 'attack', i)),
      // Enemies never block; reuse idle paths so Three.js returns cached textures.
      blockingPaths: range(ic).map((i) => resolveEnemyCombatSprite(sid, 'idle', i)),
      deathPaths: range(dc).map((i) => resolveEnemyCombatSprite(sid, 'death', i)),
      idleFrames: ic,
      attackFrames: ac,
      blockingFrames: ic,
      deathFrames: dc,
      hasDedicatedAttack: hasEnemyAttackAnim(sid),
      hasDedicatedBlocking: false,
    };
  }, [isAlly, archetype, civilization, gender, spriteId]);
}
