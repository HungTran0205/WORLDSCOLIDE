/**
 * Guild hall member sprite animator — east/west walking only + one static
 * south idle frame.
 *
 * Walk uses a 2-row atlas (east = row 0, west = row 1, 8 frames each) driven by
 * UV offset (setAtlasFrame), the same zero-rebind technique as SpriteAnimator.
 * Idle is a SEPARATE static texture — south frame_000 from the member's own
 * folder — so a stopped member always faces south regardless of the last walk
 * direction. The walk plane and idle plane are toggled imperatively
 * (mesh.visible) in useFrame to avoid per-frame React re-renders and any
 * material.map swap.
 *
 * Kept separate from SpriteAnimator (which loads all 4 directions and is also
 * used by facility zone/room workers) so this guild-hall-only simplification
 * doesn't touch those.
 */

import { useRef, useMemo } from 'react';
import { useLoader, useFrame, useThree } from '@react-three/fiber';
import { TextureLoader, NearestFilter, SRGBColorSpace } from 'three';
import type { MutableRefObject } from 'react';
import type { Mesh } from 'three';
import type { HorizontalDirection } from './sprite-path-resolver';
import { getWalkingFramePath, getGuildHallIdleFramePath } from './sprite-path-resolver';
import { buildAtlasFromTextures, setAtlasFrame } from './sprite-atlas';
import type { SpriteAtlas } from './sprite-atlas';

const FRAME_COUNT = 8;
const ANIMATION_FPS = 10;
/** Atlas row per direction — walk frames are loaded east-then-west. */
const DIR_ROW: Record<HorizontalDirection, number> = { east: 0, west: 1 };

interface GuildHallSpriteAnimatorProps {
  basePath: string;
  directionRef: MutableRefObject<HorizontalDirection>;
  isMovingRef: MutableRefObject<boolean>;
  size?: [number, number];
}

export function GuildHallSpriteAnimator({
  basePath,
  directionRef,
  isMovingRef,
  size = [2.1, 2.1],
}: GuildHallSpriteAnimatorProps) {
  const frameIndexRef = useRef(0);
  const elapsedRef = useRef(0);
  const walkMeshRef = useRef<Mesh>(null);
  const idleMeshRef = useRef<Mesh>(null);

  // Walk frames: east 0-7 then west 0-7 → 8-col × 2-row atlas.
  const walkPaths = useMemo(() => {
    const p: string[] = [];
    for (let i = 0; i < FRAME_COUNT; i++) p.push(getWalkingFramePath(basePath, 'east', i));
    for (let i = 0; i < FRAME_COUNT; i++) p.push(getWalkingFramePath(basePath, 'west', i));
    return p;
  }, [basePath]);

  const idlePath = useMemo(() => getGuildHallIdleFramePath(basePath), [basePath]);

  const walkTextures = useLoader(TextureLoader, walkPaths);
  const idleTexture = useLoader(TextureLoader, idlePath);
  const { gl } = useThree();

  const atlas = useMemo<SpriteAtlas>(() => {
    for (const t of walkTextures) {
      t.magFilter = NearestFilter;
      t.minFilter = NearestFilter;
      t.colorSpace = SRGBColorSpace;
    }
    return buildAtlasFromTextures(walkTextures, FRAME_COUNT);
  }, [walkTextures, gl]);

  const idleMap = useMemo(() => {
    idleTexture.magFilter = NearestFilter;
    idleTexture.minFilter = NearestFilter;
    idleTexture.colorSpace = SRGBColorSpace;
    return idleTexture;
  }, [idleTexture]);

  useFrame((_, rawDelta) => {
    const moving = isMovingRef.current;
    if (walkMeshRef.current) walkMeshRef.current.visible = moving;
    if (idleMeshRef.current) idleMeshRef.current.visible = !moving;

    if (!moving) {
      frameIndexRef.current = 0;
      elapsedRef.current = 0;
      return;
    }

    const delta = Math.min(rawDelta, 0.1);
    elapsedRef.current += delta;
    if (elapsedRef.current >= 1 / ANIMATION_FPS) {
      elapsedRef.current -= 1 / ANIMATION_FPS;
      frameIndexRef.current = (frameIndexRef.current + 1) % FRAME_COUNT;
    }
    setAtlasFrame(atlas, DIR_ROW[directionRef.current] * FRAME_COUNT + frameIndexRef.current);
  });

  return (
    <>
      {/* Walk plane (east/west atlas) — shown while moving. Starts hidden;
          members spawn idle, so the idle plane is the initial visible one. */}
      <mesh ref={walkMeshRef} visible={false}>
        <planeGeometry args={size} />
        <meshStandardMaterial map={atlas.texture} transparent alphaTest={0.1} roughness={1} metalness={0} />
      </mesh>
      {/* Idle plane (static south frame_000) — shown while stopped. */}
      <mesh ref={idleMeshRef}>
        <planeGeometry args={size} />
        <meshStandardMaterial map={idleMap} transparent alphaTest={0.1} roughness={1} metalness={0} />
      </mesh>
    </>
  );
}
