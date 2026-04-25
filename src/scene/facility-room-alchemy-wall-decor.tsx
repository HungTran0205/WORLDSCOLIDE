/**
 * Cave-themed wall decorations for the Alchemy Lab room.
 * Adds glowing blue ether crystal clusters and copper pipe runs
 * on top of the existing back wall and left wall surfaces.
 *
 * Wall geometry reference (from facility-room.tsx):
 *   Back wall center: [cx, 1.5, cz - 3.5]  — size 7 × 3 × 0.2
 *   Left wall center: [cx - 3.5, 1.5, cz]  — size 0.2 × 3 × 7
 */

const PIPE_R  = 0.036;  // pipe tube radius
const JOINT_R = 0.054;  // elbow/joint sphere radius

// ─── Shared sub-components ────────────────────────────────────────────────────

/** Horizontal pipe running along the X axis */
function HPipe({ x, y, z, len }: { x: number; y: number; z: number; len: number }) {
  return (
    <mesh position={[x, y, z]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[PIPE_R, PIPE_R, len, 8]} />
      <meshStandardMaterial color="#b87333" metalness={0.75} roughness={0.3} />
    </mesh>
  );
}

/** Horizontal pipe running along the Z axis */
function ZPipe({ x, y, z, len }: { x: number; y: number; z: number; len: number }) {
  return (
    <mesh position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[PIPE_R, PIPE_R, len, 8]} />
      <meshStandardMaterial color="#b87333" metalness={0.75} roughness={0.3} />
    </mesh>
  );
}

/** Vertical pipe; `y` is its bottom edge, the mesh is centered at y + len/2 */
function VPipe({ x, y, z, len }: { x: number; y: number; z: number; len: number }) {
  return (
    <mesh position={[x, y + len / 2, z]}>
      <cylinderGeometry args={[PIPE_R, PIPE_R, len, 8]} />
      <meshStandardMaterial color="#b87333" metalness={0.75} roughness={0.3} />
    </mesh>
  );
}

/** Elbow / T-joint sphere connecting pipe segments */
function Joint({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <mesh position={[x, y, z]}>
      <sphereGeometry args={[JOINT_R, 8, 8]} />
      <meshStandardMaterial color="#9a5e1a" metalness={0.8} roughness={0.25} />
    </mesh>
  );
}

// ─── Per-wall layouts ─────────────────────────────────────────────────────────

/**
 * Back wall: copper pipe network + 3 ether crystal clusters.
 * Wall face sits at z = cz - 3.38 (0.12 in front of wall center).
 */
function AlchemyBackWallDecor({ cx, cz }: { cx: number; cz: number }) {
  const wz = cz - 3.38;

  // Lower pipe: spans cx-2.7 to cx+2.4  → length 5.1, center cx-0.15
  // Upper pipe: spans cx-1.6 to cx+2.7  → length 4.3, center cx+0.55
  // Two verticals connecting both runs at x=cx-1.3 and x=cx+1.5
  const vLen = 1.13; // gap between lower (y=0.72) and upper (y=1.85)

  return (
    <group>
      <HPipe x={cx - 0.15} y={0.72} z={wz} len={5.1} />
      <HPipe x={cx + 0.55} y={1.85} z={wz} len={4.3} />
      <VPipe x={cx - 1.30} y={0.72} z={wz} len={vLen} />
      <VPipe x={cx + 1.50} y={0.72} z={wz} len={vLen} />
      <Joint x={cx - 1.30} y={0.72} z={wz} />
      <Joint x={cx - 1.30} y={1.85} z={wz} />
      <Joint x={cx + 1.50} y={0.72} z={wz} />
      <Joint x={cx + 1.50} y={1.85} z={wz} />

    </group>
  );
}

/**
 * Left wall: copper pipe network + 2 ether crystal clusters.
 * Wall face sits at x = cx - 3.38.
 */
function AlchemyLeftWallDecor({ cx, cz }: { cx: number; cz: number }) {
  const wx = cx - 3.38;

  // Lower pipe: spans cz-2.5 to cz+2.0  → length 4.5, center cz-0.25
  // Upper pipe: spans cz-2.0 to cz+2.3  → length 4.3, center cz+0.15
  // One vertical connector at z=cz+0.8
  const vLen = 1.13;

  return (
    <group>
      <ZPipe x={wx} y={0.65} z={cz - 0.25} len={4.5} />
      <ZPipe x={wx} y={1.78} z={cz + 0.15} len={4.3} />
      <VPipe x={wx} y={0.65} z={cz + 0.80} len={vLen} />
      <Joint x={wx} y={0.65} z={cz + 0.80} />
      <Joint x={wx} y={1.78} z={cz + 0.80} />

    </group>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

/** Cave-themed decoration overlay for the alchemy lab's two solid walls. */
export function AlchemyWallDecor({ cx, cz }: { cx: number; cz: number }) {
  return (
    <>
      <AlchemyBackWallDecor cx={cx} cz={cz} />
      <AlchemyLeftWallDecor cx={cx} cz={cz} />
    </>
  );
}
