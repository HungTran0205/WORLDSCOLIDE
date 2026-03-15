/** Combat arena — replays combat ticks visually. Stub for MVP. */
export function CombatArena() {
  return (
    <group>
      {/* Arena ground */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#3a5a3a" />
      </mesh>
      {/* Ally positions (left side) — populated by combat system */}
      {/* Enemy positions (right side) — populated by combat system */}
    </group>
  );
}
