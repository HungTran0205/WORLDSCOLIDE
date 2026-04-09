/** Renders assigned member sprites as static idle figures within a facility zone */

import { useRef, useMemo } from 'react';
import { Billboard, Html } from '@react-three/drei';
import { useGameStore } from '@/game/state/store';
import { CIV_CONFIG } from '@/game/data/civilization-config';
import type { Civilization } from '@/game/data/civilization-config';
import { SpriteAnimator } from './sprite-animator';
import { getSpritePath } from './sprite-path-resolver';
import type { SpriteDirection } from './sprite-path-resolver';
import type { Member } from '@/game/state/game-state';

/** 2×2 grid slot positions relative to zone center */
const SLOT_POSITIONS: [number, number, number][] = [
  [-0.5, 0, -0.5], // back-left
  [ 0.5, 0, -0.5], // back-right
  [-0.5, 0,  0.5], // front-left
  [ 0.5, 0,  0.5], // front-right
];

function ZoneMemberSprite({ member, slotOffset }: { member: Member; slotOffset: [number, number, number] }) {
  // Static refs — zone sprites never move, always idle facing south
  const directionRef = useRef<SpriteDirection>('south');
  const isMovingRef = useRef(false);

  const civConfig = CIV_CONFIG[member.civilization as Civilization];
  const archetype = member.archetype ?? civConfig?.archetypes[0] ?? 'warrior';
  const gender = member.gender ?? 'M';
  const basePath = getSpritePath(member.civilization, archetype, gender);

  return (
    <group position={[slotOffset[0], 1.05, slotOffset[2]]}>
      {/* Blob shadow — outside Billboard so it stays flat on floor */}
      <mesh position={[0, -1.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 8]} />
        <meshBasicMaterial color="black" transparent opacity={0.25} depthWrite={false} />
      </mesh>
      <Billboard>
        <SpriteAnimator
          basePath={basePath}
          directionRef={directionRef}
          isMovingRef={isMovingRef}
        />
        <Html position={[0, 1.3, 0]} center>
          <span style={{ color: 'white', fontSize: '10px', whiteSpace: 'nowrap', textShadow: '1px 1px 2px black, 0 0 2px black' }}>
            {member.name}
          </span>
        </Html>
      </Billboard>
    </group>
  );
}

interface ZoneMemberSpritesProps {
  assignedMemberIds: string[];
}

/** Renders up to 4 assigned member sprites in a 2×2 grid within zone bounds */
export function ZoneMemberSprites({ assignedMemberIds }: ZoneMemberSpritesProps) {
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);

  const allMembers = useMemo(
    () => (founder ? [founder, ...roster] : roster),
    [founder, roster],
  );

  const assignedMembers = useMemo(
    () => assignedMemberIds
      .map((id) => allMembers.find((m) => m.id === id))
      .filter((m): m is Member => m !== undefined)
      .slice(0, 4),
    [assignedMemberIds, allMembers],
  );

  return (
    <group>
      {assignedMembers.map((member, i) => (
        <ZoneMemberSprite key={member.id} member={member} slotOffset={SLOT_POSITIONS[i]} />
      ))}
    </group>
  );
}
