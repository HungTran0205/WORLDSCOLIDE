/**
 * Training Yard foundation — gives the flat grass plot real THICKNESS so the
 * room reads as a solid raised earth platform (a diorama slab) instead of a
 * flat card sitting next to flat walls.
 *
 * A box under the grass floor (top at y=0, down to -FOUND_H). The two
 * camera-facing side faces (east +X, south +Z) show the foundation texture
 * (grass fringe -> soil -> rock cliff); the back two faces + top + bottom are
 * hidden (behind walls / under the grass / facing the void). One box avoids any
 * corner seam between separate side planes.
 */

import { useTexture } from '@react-three/drei';
import { assetUrl } from '@/lib/asset-url';

const FOUND_TEX = '/training-yard/LinhSon/foundation.png';
useTexture.preload(assetUrl(FOUND_TEX));

const ROOM_SIZE = 7;
/** Slab depth. Tuned so the 7-wide face ≈ the texture's 3.33 aspect (no stretch). */
const FOUND_H = 2.1;

export function TrainingYardFoundation({ cx, cz }: { cx: number; cz: number }) {
  const tex = useTexture(assetUrl(FOUND_TEX));

  return (
    <mesh position={[cx, -FOUND_H / 2, cz]}>
      <boxGeometry args={[ROOM_SIZE, FOUND_H, ROOM_SIZE]} />
      <meshStandardMaterial
        map={tex}
        emissive="#ffffff"
        emissiveMap={tex}
        emissiveIntensity={0.6}
        roughness={0.95}
        metalness={0}
      />
    </mesh>
  );
}
