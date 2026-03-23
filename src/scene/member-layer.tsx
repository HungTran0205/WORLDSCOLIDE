import { Billboard, Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '@/game/state/store';
import { useRef, useMemo, useEffect } from 'react';
import type { Group } from 'three';
import type { Member, GridCell } from '@/game/state/game-state';
import { SpriteAnimator } from './sprite-animator';
import { getSpritePath, getDirectionFromMovement } from './sprite-path-resolver';
import type { SpriteDirection } from './sprite-path-resolver';

/** Collect all cell centers from all rooms as walkable positions */
function getAllCellCenters(rooms: { cells: GridCell[] }[]): { x: number; z: number }[] {
  const centers: { x: number; z: number }[] = [];
  for (const room of rooms) {
    for (const cell of room.cells) {
      centers.push({ x: cell.x + 0.5, z: cell.z + 0.5 });
    }
  }
  return centers;
}

/** Deterministic pseudo-random from seed (avoid Math.random in render) */
function seededIndex(seed: number, max: number): number {
  return Math.abs(Math.floor(Math.sin(seed * 9301 + 49297) * 233280)) % max;
}

function MemberSprite({ member, index }: { member: Member; index: number }) {
  const ref = useRef<Group>(null);
  const targetRef = useRef<{ x: number; z: number } | null>(null);
  const waitRef = useRef(0);
  const directionRef = useRef<SpriteDirection>('south');
  const isMovingRef = useRef(false);
  const rooms = useGameStore((s) => s.guildHall.rooms);
  const cells = useMemo(() => getAllCellCenters(rooms), [rooms]);

  useFrame(({ clock }, delta) => {
    if (!ref.current || cells.length === 0) return;
    const pos = ref.current.position;

    // Pick initial or new target when close enough
    if (!targetRef.current || waitRef.current <= 0) {
      const idx = seededIndex(clock.elapsedTime * 100 + index * 37, cells.length);
      targetRef.current = cells[idx];
      waitRef.current = 2 + index * 0.5;
    }

    const target = targetRef.current;
    const dx = target.x - pos.x;
    const dz = target.z - pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.15) {
      isMovingRef.current = false;
      waitRef.current -= delta;
    } else {
      isMovingRef.current = true;
      directionRef.current = getDirectionFromMovement(dx, dz);
      // Delta-time based movement (frame-rate independent)
      const speed = 0.9; // units per second
      pos.x += (dx / dist) * speed * delta;
      pos.z += (dz / dist) * speed * delta;
    }
  });

  // Start at first cell center
  const startPos = cells.length > 0
    ? cells[index % cells.length]
    : { x: 3, z: 3 };

  // Resolve sprite path with fallbacks for old saves missing archetype/gender
  const archetype = member.archetype ?? 'warrior';
  const gender = member.gender ?? 'M';
  const basePath = getSpritePath(member.civilization, archetype, gender);

  return (
    <group ref={ref} position={[startPos.x, 0.75, startPos.z]}>
      <Billboard>
        <SpriteAnimator
          basePath={basePath}
          directionRef={directionRef}
          isMovingRef={isMovingRef}
        />
      </Billboard>
      <Billboard position={[0, 0.7, 0]}>
        <Text fontSize={0.15} color="white" anchorY="bottom" outlineWidth={0.02} outlineColor="black">
          {member.name}
        </Text>
      </Billboard>
    </group>
  );
}

/** Billboard sprites for guild members wandering in the hall */
export function MemberLayer() {
  const isBuildMode = useGameStore((s) => s.isBuildMode);
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);
  const invalidate = useThree((s) => s.invalidate);

  const idleMembers = useMemo(() => {
    const all = founder ? [founder, ...roster] : roster;
    return all.filter((m) => m.status === 'idle');
  }, [founder, roster]);

  // Drive render loop at 20fps only when members are visible (demand mode)
  const hasMembers = !isBuildMode && idleMembers.length > 0;
  useEffect(() => {
    if (!hasMembers) return;
    const interval = setInterval(invalidate, 1000 / 20);
    return () => clearInterval(interval);
  }, [hasMembers, invalidate]);

  if (isBuildMode) return null;

  return (
    <group>
      {idleMembers.map((member, i) => (
        <MemberSprite key={member.id} member={member} index={i} />
      ))}
    </group>
  );
}
