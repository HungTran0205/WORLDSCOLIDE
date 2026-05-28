/**
 * Infirmary walls — Linh Son cavern theme (shared with tavern). Two solid
 * cracked-stone faces (left along Z, back along X) enclose the recovery
 * chamber. Warm stone tint + emissive map lets the golden ether crystal light
 * catch the rock face instead of fading into pure black.
 *
 * Simpler than tavern-walls (no cave-mouth opening / external god beam) because
 * the room's light source is the central crystal, not light leaking in.
 */

import { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import {
  TextureLoader,
  NearestFilter,
  NearestMipmapNearestFilter,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from 'three';
import { assetUrl } from '@/lib/asset-url';

const ROOM_SIZE = 7;
const WALL_HEIGHT = 5;
const WALL_THICKNESS = 0.2;
const STONE_TEX = '/tiles/2d/64px/stone-64_0001.png';
/** World units per stone tile cell. Larger = fewer repetitions = bigger blocks. */
const TILE_WORLD_SIZE = 1.5;

function useStoneTexture(): Texture {
  const base = useLoader(TextureLoader, assetUrl(STONE_TEX));
  return useMemo(() => {
    const t = base.clone();
    t.needsUpdate = true;
    t.colorSpace = SRGBColorSpace;
    t.magFilter = NearestFilter;
    t.minFilter = NearestMipmapNearestFilter;
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.repeat.set(ROOM_SIZE / TILE_WORLD_SIZE, WALL_HEIGHT / TILE_WORLD_SIZE);
    return t;
  }, [base]);
}

export function InfirmaryWalls({ cx, cz }: { cx: number; cz: number }) {
  const ox = cx - ROOM_SIZE / 2;
  const oz = cz - ROOM_SIZE / 2;
  const tex = useStoneTexture();

  return (
    <group>
      {/* Back wall — along X at oz */}
      <mesh position={[cx, WALL_HEIGHT / 2, oz]}>
        <boxGeometry args={[ROOM_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial
          map={tex}
          color="#8a7560"
          emissive="#4a3820"
          emissiveMap={tex}
          emissiveIntensity={0.85}
          roughness={0.95}
          metalness={0}
        />
      </mesh>
      {/* Left wall — along Z at ox */}
      <mesh position={[ox, WALL_HEIGHT / 2, cz]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, ROOM_SIZE]} />
        <meshStandardMaterial
          map={tex}
          color="#8a7560"
          emissive="#4a3820"
          emissiveMap={tex}
          emissiveIntensity={0.85}
          roughness={0.95}
          metalness={0}
        />
      </mesh>
    </group>
  );
}
