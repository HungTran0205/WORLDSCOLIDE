/**
 * Guild hall member sprites — wandering idle members with name indicators.
 * Single Billboard per member, no troika Text (uses colored bar instead).
 * Invalidates at 20fps only when members exist and are visible.
 */

import { Billboard, Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '@/game/state/store';
import { useRef, useMemo, useEffect } from 'react';
import type { Group } from 'three';
import type { Member } from '@/game/state/game-state';
import { CIV_CONFIG } from '@/game/data/civilization-config';
import type { Civilization } from '@/game/data/civilization-config';
import { SpriteAnimator } from './sprite-animator';
import { getSpritePath, getDirectionFromMovement } from './sprite-path-resolver';
import type { SpriteDirection } from './sprite-path-resolver';

/** Collect all cell centers from floor tiles as walkable positions */
function getAllCellCenters(tiles: { x: number; z: number }[]): { x: number; z: number }[] {
  return tiles.map((t) => ({ x: t.x + 0.5, z: t.z + 0.5 }));
}

/** Deterministic pseudo-random from seed */
function seededIndex(seed: number, max: number): number {
  return Math.abs(Math.floor(Math.sin(seed * 9301 + 49297) * 233280)) % max;
}

function MemberSprite({ member, index }: { member: Member; index: number }) {
  const ref = useRef<Group>(null);
  const targetRef = useRef<{ x: number; z: number } | null>(null);
  const waitRef = useRef(0);
  const directionRef = useRef<SpriteDirection>('south');
  const isMovingRef = useRef(false);
  const floorTiles = useGameStore((s) => s.guildHall.floorTiles);
  const cells = useMemo(() => getAllCellCenters(floorTiles), [floorTiles]);

  useFrame(({ clock }, rawDelta) => {
    if (!ref.current || cells.length === 0) return;
    const delta = Math.min(rawDelta, 0.1);
    const pos = ref.current.position;

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
      const speed = 0.9;
      pos.x += (dx / dist) * speed * delta;
      pos.z += (dz / dist) * speed * delta;
    }
  });

  const startPos = cells.length > 0 ? cells[index % cells.length] : { x: 3, z: 3 };

  const civConfig = CIV_CONFIG[member.civilization as Civilization];
  const archetype = member.archetype ?? civConfig?.archetypes[0] ?? 'warrior';
  const gender = member.gender ?? 'M';
  const basePath = getSpritePath(member.civilization, archetype, gender);

  return (
    <group ref={ref} position={[startPos.x, 1.05, startPos.z]}>
      {/* Single Billboard — sprite + name indicator */}
      <Billboard>
        <SpriteAnimator
          basePath={basePath}
          directionRef={directionRef}
          isMovingRef={isMovingRef}
        />
        {/* Member name */}
        <Text
          position={[0, 1.3, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.025}
          outlineColor="black"
        >
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

  /* Drive render loop at 20fps only when members are visible */
  const hasMembers = !isBuildMode && idleMembers.length > 0;
  useEffect(() => {
    if (!hasMembers) return;
    const id = setInterval(invalidate, 1000 / 20);
    return () => clearInterval(id);
  }, [hasMembers, invalidate]);

  useEffect(() => { invalidate(); }, [idleMembers.length, invalidate]);

  if (isBuildMode) return null;

  return (
    <group>
      {idleMembers.map((member, i) => (
        <MemberSprite key={member.id} member={member} index={i} />
      ))}
    </group>
  );
}
