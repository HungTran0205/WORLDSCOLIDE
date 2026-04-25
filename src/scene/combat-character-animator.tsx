/**
 * Combat-specific character sprite animator — uses sprite atlas for ZERO
 * texture binding overhead. Walk/attack frames packed into CanvasTexture
 * grids, selected via UV offset instead of material.map swapping.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useLoader, useFrame, useThree } from '@react-three/fiber';
import { TextureLoader, MeshStandardMaterial, Mesh } from 'three';
import type { RefObject } from 'react';
import type { SpriteDirection } from './sprite-path-resolver';
import { getRunningFramePath, getAttackFramePath } from './sprite-path-resolver';
import { buildAtlasFromTextures, buildAtlasFromUrls, setAtlasFrame } from './sprite-atlas';
import { combatLog } from './combat-logger';
import type { SpriteAtlas } from './sprite-atlas';

const DIRECTIONS: SpriteDirection[] = ['north', 'south', 'east', 'west'];
const FRAME_COUNT = 8;
const ATTACK_FRAME_COUNT = 4;
const WALK_FPS = 10;
const ATTACK_FPS = 8;

/** Module-level cache — only written when load completes (null = no frames on disk) */
const ATTACK_ATLAS_CACHE = new Map<string, SpriteAtlas | null>();
/** Tracks in-progress loads so concurrent callers can subscribe, not double-load */
const ATTACK_ATLAS_PENDING = new Map<string, Promise<SpriteAtlas | null>>();

/**
 * Preload attack atlas for a basePath and warm the cache.
 * Call from CombatFightController before combat ticks begin so the atlas
 * is ready before the first attack animation fires.
 */
export function preloadAttackAtlas(basePath: string): void {
  if (ATTACK_ATLAS_CACHE.has(basePath) || ATTACK_ATLAS_PENDING.has(basePath)) return;
  const paths = Array.from({ length: ATTACK_FRAME_COUNT }, (_, i) =>
    getAttackFramePath(basePath, 'east', i),
  );
  const p = buildAtlasFromUrls(paths, ATTACK_FRAME_COUNT).then((atlas) => {
    ATTACK_ATLAS_CACHE.set(basePath, atlas);
    ATTACK_ATLAS_PENDING.delete(basePath);
    combatLog(`preload ${basePath}: ${atlas ? `OK (${atlas.frameCount} frames)` : 'NULL — no attack folder'}`);
    return atlas;
  });
  ATTACK_ATLAS_PENDING.set(basePath, p);
}

/**
 * Clone a SpriteAtlas with an independent texture instance.
 * The cache stores one shared atlas per basePath — if two entities share the same
 * Texture object, setAtlasFrame on one overwrites texture.offset/repeat for both.
 * Cloning gives each entity its own Vector2 state while reusing the same canvas data.
 */
function cloneAtlasTexture(atlas: SpriteAtlas): SpriteAtlas {
  // We use standard Texture.clone() so each character gets independent UV properties 
  // (offset/repeat) while cleanly sharing the same underlying GPU image memory.
  // The previous R3F JSX reconciler bug is now fixed, making this safe!
  const tex = atlas.texture.clone();
  tex.needsUpdate = true;
  return { ...atlas, texture: tex };
}

const DIR_OFFSET: Record<SpriteDirection, number> = {
  north: 0,
  south: FRAME_COUNT,
  east: FRAME_COUNT * 2,
  west: FRAME_COUNT * 3,
};

export type CombatAnimState = 'idle' | 'walking' | 'attacking' | 'skill' | 'hit' | 'dead';

interface CombatCharacterAnimatorProps {
  basePath: string;
  directionRef: RefObject<SpriteDirection>;
  animStateRef: RefObject<CombatAnimState>;
  /** Optional identifier shown in combat.log entries */
  entityId?: string;
  size?: [number, number];
}

export function CombatCharacterAnimator({
  basePath,
  directionRef,
  animStateRef,
  entityId,
  size = [2.1, 2.1],
}: CombatCharacterAnimatorProps) {
  const label = entityId ?? basePath.split('/').pop() ?? basePath;

  const frameIndexRef = useRef(0);
  const elapsedRef = useRef(0);
  const prevAnimRef = useRef<CombatAnimState>('idle');

  // --- Run atlas: load running frames for all 4 directions ---
  const walkPaths = useMemo(() => {
    const paths: string[] = [];
    for (const dir of DIRECTIONS) {
      for (let i = 0; i < FRAME_COUNT; i++) {
        paths.push(getRunningFramePath(basePath, dir, i));
      }
    }
    return paths;
  }, [basePath]);

  const walkTextures = useLoader(TextureLoader, walkPaths);

  const { gl } = useThree();

  // Build walk atlas once textures are loaded (32 frames → 8×4 grid)
  const walkAtlas = useMemo<SpriteAtlas>(
    () => buildAtlasFromTextures(walkTextures, 8),
    [walkTextures, gl],
  );

  // --- Attack atlas: read from module-level cache (preloaded by CombatFightController) ---
  // IMPORTANT: clone texture from cache so each entity has independent UV state.
  // The cache stores a shared SpriteAtlas — if two entities share the same texture object,
  // setAtlasFrame on one overwrites the UV of both (texture.offset/repeat are per-object).
  const attackAtlasRef = useRef<SpriteAtlas | null>(null);

  useEffect(() => {
    // Case 1: already resolved (null = no frames, or SpriteAtlas = loaded)
    if (ATTACK_ATLAS_CACHE.has(basePath)) {
      const cached = ATTACK_ATLAS_CACHE.get(basePath) ?? null;
      attackAtlasRef.current = cached ? cloneAtlasTexture(cached) : null;
      combatLog(`${label} atlas cache hit: ${attackAtlasRef.current ? 'loaded' : 'NULL'}`);
      return;
    }

    // Case 2: in-progress (preloaded by FightController but not resolved yet)
    const pending = ATTACK_ATLAS_PENDING.get(basePath);
    if (pending) {
      let cancelled = false;
      pending.then((atlas) => {
        if (!cancelled) {
          attackAtlasRef.current = atlas ? cloneAtlasTexture(atlas) : null;
          combatLog(`${label} atlas resolved (pending): ${atlas ? 'OK' : 'NULL'}`);
        }
      });
      return () => { cancelled = true; };
    }

    // Case 3: not preloaded — load now (fallback for unexpected mount order)
    let cancelled = false;
    const paths = Array.from({ length: ATTACK_FRAME_COUNT }, (_, i) =>
      getAttackFramePath(basePath, 'east', i),
    );
    const p = buildAtlasFromUrls(paths, ATTACK_FRAME_COUNT).then((atlas) => {
      ATTACK_ATLAS_CACHE.set(basePath, atlas);
      ATTACK_ATLAS_PENDING.delete(basePath);
      if (!cancelled) {
        attackAtlasRef.current = atlas ? cloneAtlasTexture(atlas) : null;
        combatLog(`${label} atlas fallback load: ${atlas ? 'OK' : 'NULL'}`);
      }
      return atlas;
    });
    ATTACK_ATLAS_PENDING.set(basePath, p);
    return () => { cancelled = true; };
  }, [basePath, label]);

  // Animation loop
  const materialRef = useRef<MeshStandardMaterial>(null);
  const meshRef = useRef<Mesh>(null);
  // Initialize to 'none' to force an initial texture assignment inside useFrame
  // and prevent R3F from reconciling <meshStandardMaterial map={walkAtlas.texture} />
  const currentAtlasRef = useRef<'walk' | 'attack' | 'none'>('none');

  // Logging refs — track previous values to log only on change
  const prevLogFrameRef = useRef(-1);
  const prevLogAtlasRef = useRef<'walk' | 'attack'>('walk');
  const prevLogAnimRef = useRef<CombatAnimState>('idle');

  useFrame((_, delta) => {
    if (!materialRef.current || !meshRef.current) return;

    // Debug freeze — set from console: window.__animDebug = { id: 'Sơn', frame: 3 }
    // Step:  window.__animDebug.frame = 4   |   Resume: window.__animDebug = null
    type AnimDebug = { id: string; frame: number } | null;
    const dbg = (typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>).__animDebug : null) as AnimDebug;
    if (dbg?.id === label && typeof dbg.frame === 'number') {
      const isAtk = (animStateRef.current === 'attacking' || animStateRef.current === 'skill') && attackAtlasRef.current;
      const dbgMax = isAtk ? ATTACK_FRAME_COUNT : FRAME_COUNT;
      const f = ((dbg.frame % dbgMax) + dbgMax) % dbgMax;
      if (isAtk) {
        if (currentAtlasRef.current !== 'attack') {
          materialRef.current.map = attackAtlasRef.current!.texture;
          materialRef.current.needsUpdate = true;
          currentAtlasRef.current = 'attack';
        }
        setAtlasFrame(attackAtlasRef.current!, f);
      } else {
        if (currentAtlasRef.current !== 'walk') {
          materialRef.current.map = walkAtlas.texture;
          materialRef.current.needsUpdate = true;
          currentAtlasRef.current = 'walk';
        }
        setAtlasFrame(walkAtlas, DIR_OFFSET[directionRef.current] + f);
      }
      return;
    }

    const anim = animStateRef.current;
    const dir = directionRef.current;

    // Log anim state changes
    if (anim !== prevLogAnimRef.current) {
      combatLog(`${label} animState: ${prevLogAnimRef.current}→${anim}`);
      prevLogAnimRef.current = anim;
    }

    // Reset frame counter on anim state change
    if (anim !== prevAnimRef.current) {
      frameIndexRef.current = 0;
      elapsedRef.current = 0;
      prevAnimRef.current = anim;
      prevLogFrameRef.current = -1; // force log of frame 0 at start of each new cycle
    }

    const isAttacking = (anim === 'attacking' || anim === 'skill') && attackAtlasRef.current;

    if (isAttacking) {
      const atlas = attackAtlasRef.current!;
      // Swap to attack atlas if not already bound
      if (currentAtlasRef.current !== 'attack') {
        materialRef.current.map = atlas.texture;
        materialRef.current.needsUpdate = true;
        currentAtlasRef.current = 'attack';
        combatLog(`${label} ATLAS→attack (${atlas.frameCount} frames, ${atlas.cols}×${atlas.rows})`);
        prevLogAtlasRef.current = 'attack';
      }
      elapsedRef.current += delta;
      if (elapsedRef.current >= 1 / ATTACK_FPS) {
        elapsedRef.current -= 1 / ATTACK_FPS;
        frameIndexRef.current = (frameIndexRef.current + 1) % ATTACK_FRAME_COUNT;
      }
      setAtlasFrame(atlas, frameIndexRef.current);
      // Log frame changes
      if (frameIndexRef.current !== prevLogFrameRef.current) {
        combatLog(`${label} [attack] frame:${prevLogFrameRef.current}→${frameIndexRef.current}`);
        prevLogFrameRef.current = frameIndexRef.current;
      }
      // Mirror for west direction
      meshRef.current.scale.x = dir === 'west' ? -size[0] : size[0];
    } else {
      // Swap to walk atlas if not already bound
      if (currentAtlasRef.current !== 'walk') {
        materialRef.current.map = walkAtlas.texture;
        materialRef.current.needsUpdate = true;
        currentAtlasRef.current = 'walk';
        const reason = (anim === 'attacking' || anim === 'skill') ? `(attack atlas NULL for ${basePath})` : '';
        combatLog(`${label} ATLAS→walk ${reason}`);
        prevLogAtlasRef.current = 'walk';
      }

      // Advance run frames for walking AND attacking-without-atlas (graceful fallback)
      if (anim === 'walking' || anim === 'attacking' || anim === 'skill') {
        elapsedRef.current += delta;
        if (elapsedRef.current >= 1 / WALK_FPS) {
          elapsedRef.current -= 1 / WALK_FPS;
          frameIndexRef.current = (frameIndexRef.current + 1) % FRAME_COUNT;
        }
      } else {
        frameIndexRef.current = 0;
        elapsedRef.current = 0;
      }
      const frameIdx = DIR_OFFSET[dir] + frameIndexRef.current;
      setAtlasFrame(walkAtlas, frameIdx);
      if (frameIndexRef.current !== prevLogFrameRef.current) {
        combatLog(`${label} [walk/${dir}] frame:${prevLogFrameRef.current}→${frameIndexRef.current} (atlasIdx:${frameIdx})`);
        prevLogFrameRef.current = frameIndexRef.current;
      }
      meshRef.current.scale.x = size[0];
    }
  });

  return (
    <mesh ref={meshRef} scale={[size[0], size[1], 1]}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        ref={materialRef}
        transparent
        alphaTest={0.1}
      />
    </mesh>
  );
}
