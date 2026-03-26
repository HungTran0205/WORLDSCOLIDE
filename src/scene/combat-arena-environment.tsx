/** Beat-em-up arena environment — ground, walls, lighting, center line */

export function CombatArenaEnvironment() {
  return (
    <group>
      {/* Arena ground — dark floor for beat-em-up feel */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      {/* Side indicator — left (ally blue tint) */}
      <mesh position={[-5, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 8]} />
        <meshStandardMaterial color="#2a3a4a" transparent opacity={0.2} />
      </mesh>
      {/* Side indicator — right (enemy red tint) */}
      <mesh position={[5, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 8]} />
        <meshStandardMaterial color="#4a2a2a" transparent opacity={0.2} />
      </mesh>

      {/* Background wall placeholder — replace with 3D model later */}
      <mesh position={[0, 3, -5]}>
        <planeGeometry args={[22, 8]} />
        <meshStandardMaterial color="#1a1a2a" />
      </mesh>

      {/* Left boundary wall placeholder */}
      <mesh position={[-10, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#1a1a2a" transparent opacity={0.5} />
      </mesh>
      {/* Right boundary wall placeholder */}
      <mesh position={[10, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#1a1a2a" transparent opacity={0.5} />
      </mesh>

      {/* Center line — subtle clash zone indicator */}
      <mesh position={[0, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.05, 10]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.15} />
      </mesh>

      {/* Lighting — front-above for beat-em-up shadows */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[0, 8, 6]} intensity={0.8} />
    </group>
  );
}
