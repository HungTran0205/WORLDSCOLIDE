import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/game/state/store';
import { useRef, useMemo } from 'react';
import { HALL_WIDTH, HALL_DEPTH } from '@/game/systems/building-system';
import type { Group } from 'three';
import type { Member } from '@/game/state/game-state';

/** Sprite margin from hall edges so members stay visually within the floor */
const MARGIN = 0.5;

function MemberSprite({ member, index }: { member: Member; index: number }) {
  const ref = useRef<Group>(null);

  // Idle wander animation clamped to hall bounds
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime + index * 2;
    // Map sin/cos [-1,1] to [MARGIN, HALL_WIDTH/DEPTH - MARGIN]
    const halfW = (HALL_WIDTH - MARGIN * 2) / 2;
    const halfD = (HALL_DEPTH - MARGIN * 2) / 2;
    ref.current.position.x = MARGIN + halfW + Math.sin(t * 0.3 + index) * halfW;
    ref.current.position.z = MARGIN + halfD + Math.cos(t * 0.2 + index * 1.7) * halfD;
  });

  return (
    <group ref={ref} position={[1, 0.75, 1]}>
      <Billboard>
        <mesh>
          <planeGeometry args={[0.8, 1.2]} />
          <meshBasicMaterial color={member.isFounder ? '#FFD700' : '#87CEEB'} />
        </mesh>
      </Billboard>
      <Billboard position={[0, 0.8, 0]}>
        <Text fontSize={0.15} color="white" anchorY="bottom">
          {member.name}
        </Text>
      </Billboard>
    </group>
  );
}

/** Billboard sprites for guild members wandering in the hall */
export function MemberLayer() {
  const isBuildMode = useGameStore((s) => s.isBuildMode);
  // Select primitives separately to avoid new array references on every render
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);

  const idleMembers = useMemo(() => {
    const all = founder ? [founder, ...roster] : roster;
    return all.filter((m) => m.status === 'idle');
  }, [founder, roster]);

  // Hide members when in build mode for cleaner placement view
  if (isBuildMode) return null;

  return (
    <group>
      {idleMembers.map((member, i) => (
        <MemberSprite key={member.id} member={member} index={i} />
      ))}
    </group>
  );
}
