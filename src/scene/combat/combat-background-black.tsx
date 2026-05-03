/**
 * Solid black backdrop for the idle-combat panel scene (D9).
 * Renders a single unlit plane behind all entities. Diorama / styled
 * background deferred to v1.1.
 */

export function CombatBackgroundBlack() {
  return (
    <mesh position={[0, 0, -5]}>
      <planeGeometry args={[40, 25]} />
      <meshBasicMaterial color="#000000" />
    </mesh>
  );
}
