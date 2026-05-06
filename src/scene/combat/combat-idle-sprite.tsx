/**
 * Combat-panel single-entity sprite — idle loop + death animation + hit flash.
 *
 * Loads two atlases per entity (idle east/west, death east/west) via the
 * combat sprite resolver. Switches between them based on entity HP (alive →
 * idle, KO → death animation that freezes on the last frame). On HP delta a
 * brief white flash is applied via material.color (no extra material swap).
 *
 * Pre-conditions:
 * - Camera + lighting are mounted by `<CombatScene>` (parent fragment).
 * - Resolver always returns *some* path — never 404 — so useLoader can't
 *   throw on missing assets (graceful degrade to walking-frame-0 fallback).
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, MeshBasicMaterial, Mesh, Color } from 'three';
import type { ArenaEntitySnapshot } from '@/game/state/combat-arena-slice';
import { COMBAT_CAM_TILT_RAD, getCombatSpriteScale } from './combat-camera-config';
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
import { buildAtlasFromTextures, setAtlasFrame } from '@/scene/sprites/sprite-atlas';
import type { SpriteAtlas } from '@/scene/sprites/sprite-atlas';

const IDLE_FPS = 6.5;        // ~150ms per frame per spec
const ATTACK_FPS = 12;       // ~83ms per frame — full 8-frame swing fits ~667ms ANIM_ATTACK_DURATION window
const DEATH_FPS = 8;
const FLASH_DURATION_MS = 110;

const FLASH_COLOR = new Color(2.4, 2.4, 2.4);
const DEAD_COLOR = new Color(0.7, 0.7, 0.7);
const NORMAL_COLOR = new Color(1, 1, 1);

interface CombatIdleSpriteProps {
  entity: ArenaEntitySnapshot;
}

export function CombatIdleSprite({ entity }: CombatIdleSpriteProps) {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshBasicMaterial>(null);
  const frameIndexRef = useRef(0);
  const elapsedRef = useRef(0);
  const deathFrozenRef = useRef(false);
  const lastHpRef = useRef(entity.currentHp);
  const flashUntilRef = useRef(0);
  const wasDeadRef = useRef(entity.currentHp <= 0);
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

  useFrame((_, dt) => {
    const mat = materialRef.current;
    const mesh = meshRef.current;
    if (!mat || !mesh) return;

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
    // Anchor stays on ground — lift mesh center by half scaled height so the
    // sprite's bottom edge sits on y=0 regardless of foreshortening factor.
    mesh.position.y = liveScale * 0.5;

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

    if (mat.map !== atlas.texture) {
      mat.map = atlas.texture;
      mat.needsUpdate = true;
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
    setAtlasFrame(atlas, frameIndexRef.current);

    // Tint: white flash on hit, dimmed grey when dead, normal otherwise.
    const now = performance.now();
    if (now < flashUntilRef.current) {
      mat.color.copy(FLASH_COLOR);
    } else if (isDead && deathFrozenRef.current) {
      mat.color.copy(DEAD_COLOR);
    } else {
      mat.color.copy(NORMAL_COLOR);
    }
  });

  // Initial anchor — useFrame overrides position.y + scale on first tick using
  // getCombatSpriteScale. Initial values use base scale so the mesh isn't
  // mounted at scale 1×1 (avoids a one-frame size pop).
  const initialScale = getCombatSpriteScale(entity.position.z, !!entity.isBoss);
  // Billboard the plane around X by -COMBAT_CAM_TILT_RAD so its +Z normal
  // tips UP toward the down-tilted camera ray. (Positive rotation around X
  // tips the normal toward -Y; we need toward +Y to face the camera that
  // sits high looking down.)
  return (
    <mesh
      ref={meshRef}
      position={[entity.position.x, initialScale * 0.5, entity.position.z]}
      rotation={[-COMBAT_CAM_TILT_RAD, 0, 0]}
      scale={[initialScale, initialScale, 1]}
    >
      <planeGeometry args={[1, 1]} />
      {/* meshBasicMaterial — pixel-art sprites are pre-shaded, lighting-free
          rendering is correct here and avoids dim output when the global
          SceneLighting is dim or absent. */}
      <meshBasicMaterial
        ref={materialRef}
        map={idleAtlas.texture}
        transparent
        alphaTest={0.1}
      />
    </mesh>
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
