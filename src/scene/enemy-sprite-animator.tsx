/**
 * Sprite animator for enemies — uses sprite atlas for zero texture binding
 * overhead. Walk/attack/death frames packed into CanvasTexture grids,
 * selected via UV offset. Sprites are west-facing, mirrored for east.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader, MeshBasicMaterial } from 'three';
import type { MutableRefObject } from 'react';
import { getEnemyAnimFramePath } from './sprite-path-resolver';
import { buildAtlasFromTextures, buildAtlasFromUrls, setAtlasFrame } from './sprite-atlas';
import type { SpriteAtlas } from './sprite-atlas';

const WALK_FRAMES = 8;
const WALK_FPS = 10;
const ATTACK_FPS = 12;
const DEATH_FPS = 8;

export type EnemyAnimState = 'idle' | 'walking' | 'attacking' | 'skill' | 'hit' | 'dead';

interface EnemySpriteAnimatorProps {
  spriteId: string;
  animStateRef: MutableRefObject<EnemyAnimState>;
  facingRight: boolean;
  size?: [number, number];
}

export function EnemySpriteAnimator({
  spriteId,
  animStateRef,
  facingRight,
  size = [2.1, 2.1],
}: EnemySpriteAnimatorProps) {
  const frameIndexRef = useRef(0);
  const elapsedRef = useRef(0);
  const prevAnimRef = useRef<EnemyAnimState>('idle');

  // --- Walk atlas (always available via useLoader) ---
  const walkPaths = useMemo(() => {
    const p: string[] = [];
    for (let i = 0; i < WALK_FRAMES; i++) {
      p.push(getEnemyAnimFramePath(spriteId, 'walk', i));
    }
    return p;
  }, [spriteId]);

  const walkTextures = useLoader(TextureLoader, walkPaths);

  // Build walk atlas (8 frames → 8×1 grid)
  const walkAtlas = useMemo<SpriteAtlas>(
    () => buildAtlasFromTextures(walkTextures, 8),
    [walkTextures],
  );

  // --- Attack atlas (async, graceful 404) ---
  const attackAtlasRef = useRef<SpriteAtlas | null>(null);
  useEffect(() => {
    let cancelled = false;
    const paths: string[] = [];
    for (let i = 0; i < 8; i++) paths.push(getEnemyAnimFramePath(spriteId, 'attack', i));
    buildAtlasFromUrls(paths, 8).then((atlas) => {
      if (!cancelled) attackAtlasRef.current = atlas;
    });
    return () => { cancelled = true; };
  }, [spriteId]);

  // --- Death atlas (async, graceful 404) ---
  const deathAtlasRef = useRef<SpriteAtlas | null>(null);
  useEffect(() => {
    let cancelled = false;
    const paths: string[] = [];
    for (let i = 0; i < 8; i++) paths.push(getEnemyAnimFramePath(spriteId, 'death', i));
    buildAtlasFromUrls(paths, 8).then((atlas) => {
      if (!cancelled) deathAtlasRef.current = atlas;
    });
    return () => { cancelled = true; };
  }, [spriteId]);

  // --- Animation loop ---
  const materialRef = useRef<MeshBasicMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const deathFrozenRef = useRef(false);
  // Track which atlas is currently bound
  const currentAtlasRef = useRef<'walk' | 'attack' | 'death'>('walk');

  useFrame((_, delta) => {
    if (!materialRef.current || !meshRef.current) return;

    const anim = animStateRef.current;

    // Reset frame on anim state change
    if (anim !== prevAnimRef.current) {
      frameIndexRef.current = 0;
      elapsedRef.current = 0;
      deathFrozenRef.current = false;
      prevAnimRef.current = anim;
    }

    // Mirror for east (enemy sprites are west-facing)
    meshRef.current.scale.x = facingRight ? -size[0] : size[0];

    // --- Death ---
    if (anim === 'dead' && deathAtlasRef.current) {
      const atlas = deathAtlasRef.current;
      if (currentAtlasRef.current !== 'death') {
        materialRef.current.map = atlas.texture;
        currentAtlasRef.current = 'death';
      }
      if (!deathFrozenRef.current) {
        elapsedRef.current += delta;
        if (elapsedRef.current >= 1 / DEATH_FPS) {
          elapsedRef.current -= 1 / DEATH_FPS;
          frameIndexRef.current++;
          if (frameIndexRef.current >= atlas.frameCount) {
            frameIndexRef.current = atlas.frameCount - 1;
            deathFrozenRef.current = true;
          }
        }
      }
      setAtlasFrame(atlas, frameIndexRef.current);
      return;
    }

    // --- Attack ---
    if ((anim === 'attacking' || anim === 'skill') && attackAtlasRef.current) {
      const atlas = attackAtlasRef.current;
      if (currentAtlasRef.current !== 'attack') {
        materialRef.current.map = atlas.texture;
        currentAtlasRef.current = 'attack';
      }
      elapsedRef.current += delta;
      if (elapsedRef.current >= 1 / ATTACK_FPS) {
        elapsedRef.current -= 1 / ATTACK_FPS;
        frameIndexRef.current = (frameIndexRef.current + 1) % atlas.frameCount;
      }
      setAtlasFrame(atlas, frameIndexRef.current);
      return;
    }

    // --- Walk / Idle ---
    if (currentAtlasRef.current !== 'walk') {
      materialRef.current.map = walkAtlas.texture;
      currentAtlasRef.current = 'walk';
    }
    if (anim === 'walking') {
      elapsedRef.current += delta;
      if (elapsedRef.current >= 1 / WALK_FPS) {
        elapsedRef.current -= 1 / WALK_FPS;
        frameIndexRef.current = (frameIndexRef.current + 1) % WALK_FRAMES;
      }
    } else {
      frameIndexRef.current = 0;
      elapsedRef.current = 0;
    }
    setAtlasFrame(walkAtlas, frameIndexRef.current);
  });

  const scaleX = facingRight ? -size[0] : size[0];

  return (
    <mesh ref={meshRef} scale={[scaleX, size[1], 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={materialRef}
        map={walkAtlas.texture}
        transparent
        alphaTest={0.1}
      />
    </mesh>
  );
}
