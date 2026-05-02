/** Ghost cell/furniture preview for build mode placement */

import type { GridCell } from '@/game/state/game-state';

interface GhostCellProps {
  cells: GridCell[];
  valid: boolean;
  yOffset?: number;
}

/** Renders translucent tiles for each ghost cell */
export function GhostCells({ cells, valid, yOffset = 0.05 }: GhostCellProps) {
  const color = valid ? '#00ff00' : '#ff0000';
  return (
    <group>
      {cells.map((cell) => (
        <mesh key={`${cell.x},${cell.z}`} position={[cell.x + 0.5, yOffset, cell.z + 0.5]}>
          <boxGeometry args={[0.96, 0.08, 0.96]} />
          <meshStandardMaterial color={color} opacity={0.5} transparent />
        </mesh>
      ))}
    </group>
  );
}

interface GhostFurnitureProps {
  x: number; z: number; w: number; d: number; valid: boolean;
}

/** Renders translucent box for furniture ghost preview */
export function GhostFurniture({ x, z, w, d, valid }: GhostFurnitureProps) {
  const color = valid ? '#00ff00' : '#ff0000';
  return (
    <mesh position={[x + w / 2, 0.55, z + d / 2]}>
      <boxGeometry args={[w * 0.9, 1, d * 0.9]} />
      <meshStandardMaterial color={color} opacity={0.5} transparent />
    </mesh>
  );
}
