/**
 * Combat-panel single-entity sprite — idle loop + death animation + hit flash.
 *
 * Uses a per-entity NodeMaterial/ShaderMaterial with uniform-driven UV remap
 * (see idle-sprite-material.ts) to bypass WebGPU NodeMaterial's texture.matrix
 * dedupe behavior across pipeline cache. Each entity has its own uvRect uniform
 * → animation advances independently for every sprite.
 *
 * Atlas swap (idle/attack/death) updates the map node's value; UV update happens
 * every frame via handle.setUvRect(...). Tint (flash/dim/normal) routed through
 * handle.setTint instead of mutating material.color.
 *
 * Pre-conditions:
 * - Camera + lighting are mounted by `<CombatScene>` (parent fragment).
 * - Resolver always returns *some* path — never 404 — so useLoader can't
 *   throw on missing assets (graceful degrade to walking-frame-0 fallback).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { TextureLoader, Mesh, type Texture } from 'three';
import type { ArenaEntitySnapshot } from '@/game/state/combat-arena-slice';
import { COMBAT_CAM_TILT_RAD, getCombatSpriteScale } from './combat-camera-config';
import { CombatMaskOverlay } from './combat-mask-overlay';
import { resolveMemberMaskId } from '@/scene/sprites/mask-pool';
import {
  COMBAT_ATTACK_FRAME_COUNT,
  COMBAT_DEATH_FRAME_COUNT,
  COMBAT_IDLE_FRAME_COUNT,
  getAllyCombatFrameCount,
  getEnemyCombatFrameCount,
  hasAllyAttackAnim,
  hasEnemyAttackAnim,
  resolveAllyCombatSprite,
  resolveEnemyCombatSprite,
} from '@/scene/sprites/combat-sprite-resolver';
import { getSpritePath } from '@/scene/sprites/sprite-path-resolver';
import { buildAtlasFromTextures, getAtlasFrameUv } from '@/scene/sprites/sprite-atlas';
import type { SpriteAtlas } from '@/scene/sprites/sprite-atlas';
import { createIdleSpriteMaterial, type IdleSpriteMaterialHandle } from './idle-sprite-material';

const IDLE_FPS = 6.5;        // ~150ms per frame per spec
const ATTACK_FPS = 12;       // ~83ms per frame — full 8-frame swing fits ~667ms ANIM_ATTACK_DURATION window
const DEATH_FPS = 8;
const FLASH_DURATION_MS = 110;

// Tint multipliers passed to handle.setTint (r, g, b). NodeMaterial/ShaderMaterial
// multiplies sampled texture by tint; >1 brightens (flash), <1 dims (dead), 1 = normal.
const FLASH_R = 2.4, FLASH_G = 2.4, FLASH_B = 2.4;
const DEAD_R = 0.7, DEAD_G = 0.7, DEAD_B = 0.7;
const NORMAL_R = 1, NORMAL_G = 1, NORMAL_B = 1;

interface CombatIdleSpriteProps {
  entity: ArenaEntitySnapshot;
}

export function CombatIdleSprite({ entity }: CombatIdleSpriteProps) {
  const meshRef = useRef<Mesh>(null);
  const { gl } = useThree();

  // Allies-only identity mask. Enemies render via spriteId and skip the overlay.
  const maskId = useMemo(() => {
    if (entity.spriteId || !entity.isAlly) return null;
    return resolveMemberMaskId({ id: entity.id, maskSpriteId: entity.maskSpriteId });
  }, [entity.id, entity.maskSpriteId, entity.spriteId, entity.isAlly]);

  // Refs for mask animation/direction sync (mask reads these via useFrame).
  const animStateRef = useRef<string>(entity.animState);
  animStateRef.current = entity.animState;
  const facingRightRef = useRef<boolean>(entity.facingRight ?? true);
  facingRightRef.current = entity.facingRight ?? true;
  // Material handle is async-loaded (WebGPU TSL imports). Render placeholder
  // mesh-without-material until ready; parent <Suspense> covers texture load.
  const [handle, setHandle] = useState<IdleSpriteMaterialHandle | null>(null);
  const frameIndexRef = useRef(0);
  const elapsedRef = useRef(0);
  const deathFrozenRef = useRef(false);
  const lastHpRef = useRef(entity.currentHp);
  const flashUntilRef = useRef(0);
  const wasDeadRef = useRef(entity.currentHp <= 0);
  // Track last atlas texture set on the handle to skip redundant TextureNode
  // swaps. mapNode.value writes are cheap but avoiding them when possible
  // keeps the WebGPU bind cache stable.
  const lastMapRef = useRef<Texture | null>(null);
  // Track which animation state was active last frame so we can reset frame
  // counters on transitions (e.g. idle → attack should restart at frame 0
  // instead of inheriting the idle cycle position).
  const lastAnimStateRef = useRef<'idle' | 'attack' | 'death'>('idle');

  // Build the path lists once per entity identity. Resolver always returns a
  // valid path so useLoader never sees a 404. Extracted into helper so the
  // memo dep list matches the helper's parameters (compiler memoization plays
  // poorly with reading multiple fields off a single object inside useMemo).
  const {
    idlePaths, attackPaths, deathPaths,
    idleFrames, attackFrames, deathFrames,
    hasDedicatedAttack,
  } = useCombatSpritePaths(
    entity.isAlly,
    entity.archetype,
    entity.civilization,
    entity.gender,
    entity.spriteId,
  );

  const idleTextures = useLoader(TextureLoader, idlePaths);
  // When the entity has no dedicated attack frames, attackPaths === idlePaths
  // so this useLoader call hits the texture cache (no extra fetch). The atlas
  // build below is also short-circuited to reuse idleAtlas — zero extra GPU
  // canvas allocated for entities without attack anims.
  const attackTextures = useLoader(TextureLoader, attackPaths);
  const deathTextures = useLoader(TextureLoader, deathPaths);

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
  const deathAtlas = useMemo<SpriteAtlas>(
    () => buildAtlasFromTextures(deathTextures, Math.max(1, COMBAT_DEATH_FRAME_COUNT)),
    [deathTextures],
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
  // Atlas SWAPS (idle→attack→death) reuse the same handle via setMap; only the
  // initial atlas seed binding requires this effect.
  useEffect(() => {
    let cancelled = false;
    let createdHandle: IdleSpriteMaterialHandle | null = null;
    createIdleSpriteMaterial(idleAtlas.texture, gl).then((h) => {
      if (cancelled) {
        h.dispose();
        return;
      }
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
    if (!handle || !mesh) return;

    const isDead = entity.currentHp <= 0;
    // Engine sets animState to 'attacking' for autos and 'skill' for skill
    // casts; both should play the attack animation. Anything else (battle-idle,
    // hit, blocking) keeps the idle loop. Dead overrides everything.
    const isAttackingState = entity.animState === 'attacking' || entity.animState === 'skill';
    const currentAnim: 'idle' | 'attack' | 'death' = isDead
      ? 'death'
      : isAttackingState ? 'attack' : 'idle';

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

    // Animation transition (idle ↔ attack) — restart frame counter so the
    // attack swing starts from frame 0 instead of mid-cycle.
    if (currentAnim !== lastAnimStateRef.current && currentAnim !== 'death') {
      frameIndexRef.current = 0;
      elapsedRef.current = 0;
    }
    lastAnimStateRef.current = currentAnim;

    // No mirroring needed — ally assets ship as east-facing (look right toward
    // enemies on the right) and enemy assets ship as west-facing (look left
    // toward allies on the left). Both sides keep positive scale.x so they
    // face each other naturally.
    // Scale incorporates fake foreshortening from lane z (see
    // getCombatSpriteScale): front-row entities appear larger, back-row smaller.
    const liveScale = getCombatSpriteScale(entity.position.z, !!entity.isBoss);
    mesh.scale.x = liveScale;
    mesh.scale.y = liveScale;
    // Anchor stays on the platform top — lift mesh center by half scaled
    // height above platform.y so the sprite's bottom edge sits on the
    // platform surface regardless of foreshortening factor. x/z come from
    // the prop binding (snapshot rerender every 200ms is sufficient given
    // the engine no longer step-attacks in idle-panel mode).
    mesh.position.y = (entity.position.y ?? 0) + liveScale * 0.5;

    // Pick atlas + advance frame.
    let atlas: SpriteAtlas;
    let frameCount: number;
    let fps: number;
    if (isDead) {
      atlas = deathAtlas;
      frameCount = deathFrames;
      fps = DEATH_FPS;
    } else if (isAttackingState) {
      atlas = attackAtlas;
      frameCount = attackFrames;
      fps = ATTACK_FPS;
    } else {
      atlas = idleAtlas;
      frameCount = idleFrames;
      fps = IDLE_FPS;
    }

    // Atlas swap (idle ↔ attack ↔ death) — only call setMap when the texture
    // actually changes to avoid unnecessary TextureNode value writes.
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
    // Drive UV via uniform — every entity has its own uvRect uniform on its
    // own material instance, so this update is isolated per sprite (the bug
    // we're fixing comes from texture.matrix being shared/cached at the
    // WebGPU pipeline level when materials look identical).
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

  // Initial anchor — useFrame overrides position.y + scale on first tick using
  // getCombatSpriteScale. Initial values use base scale so the mesh isn't
  // mounted at scale 1×1 (avoids a one-frame size pop). Y baseline includes
  // platform top (entity.position.y) so raised-platform spawns mount at the
  // correct height instead of snapping up from y=0 on first frame.
  const initialScale = getCombatSpriteScale(entity.position.z, !!entity.isBoss);
  const initialY = (entity.position.y ?? 0) + initialScale * 0.5;
  // Billboard the plane around X by -COMBAT_CAM_TILT_RAD so its +Z normal
  // tips UP toward the down-tilted camera ray. (Positive rotation around X
  // tips the normal toward -Y; we need toward +Y to face the camera that
  // sits high looking down.)
  const isDead = entity.currentHp <= 0;

  return (
    <group position={[entity.position.x, 0, entity.position.z]}>
      <mesh
        ref={meshRef}
        position={[0, initialY, 0]}
        rotation={[-COMBAT_CAM_TILT_RAD, 0, 0]}
        scale={[initialScale, initialScale, 1]}
      >
        <planeGeometry args={[1, 1]} />
        {/* Material handle is async-loaded by createIdleSpriteMaterial (WebGPU
            path lazy-imports three/tsl + three/webgpu). Until ready, the mesh
            renders without a material — parent <Suspense> + Three.js default
            fallback covers the brief window without a flash. */}
        {handle && <primitive object={handle.material} attach="material" />}
      </mesh>
      {maskId && (
        <CombatMaskOverlay
          maskId={maskId}
          charScale={initialScale}
          animStateRef={animStateRef}
          facingRightRef={facingRightRef}
          hidden={isDead}
        />
      )}
    </group>
  );
}

function range(n: number): number[] {
  return Array.from({ length: Math.max(1, n) }, (_, i) => i);
}

interface SpritePathSet {
  idlePaths: string[];
  attackPaths: string[];
  deathPaths: string[];
  idleFrames: number;
  attackFrames: number;
  deathFrames: number;
  /** False when attack falls back to idle paths — sprite component then
   *  reuses idleAtlas instead of allocating a separate canvas texture. */
  hasDedicatedAttack: boolean;
}

/** Resolve idle + attack + death paths for an entity. Stable across snapshot syncs. */
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
      const ic = getAllyCombatFrameCount(base, 'idle');
      const ac = getAllyCombatFrameCount(base, 'attack');
      const dc = getAllyCombatFrameCount(base, 'death');
      return {
        idlePaths: range(ic).map((i) => resolveAllyCombatSprite(base, 'idle', i)),
        attackPaths: range(ac).map((i) => resolveAllyCombatSprite(base, 'attack', i)),
        deathPaths: range(dc).map((i) => resolveAllyCombatSprite(base, 'death', i)),
        idleFrames: ic,
        attackFrames: ac,
        deathFrames: dc,
        hasDedicatedAttack: hasAllyAttackAnim(base),
      };
    }
    const sid = spriteId ?? 'slime';
    const ic = getEnemyCombatFrameCount(sid, 'idle');
    const ac = getEnemyCombatFrameCount(sid, 'attack');
    const dc = getEnemyCombatFrameCount(sid, 'death');
    return {
      idlePaths: range(ic).map((i) => resolveEnemyCombatSprite(sid, 'idle', i)),
      attackPaths: range(ac).map((i) => resolveEnemyCombatSprite(sid, 'attack', i)),
      deathPaths: range(dc).map((i) => resolveEnemyCombatSprite(sid, 'death', i)),
      idleFrames: ic,
      attackFrames: ac,
      deathFrames: dc,
      hasDedicatedAttack: hasEnemyAttackAnim(sid),
    };
  }, [isAlly, archetype, civilization, gender, spriteId]);
}
