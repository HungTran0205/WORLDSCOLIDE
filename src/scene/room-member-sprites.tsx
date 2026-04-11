/**
 * Animated member sprites for the facility room view.
 * Slot 0: woodcutting animation (east) standing left of the stump.
 * Other slots: idle standing pose facing the work area.
 */

import { useRef, useMemo, Suspense } from 'react';
import { Billboard, Html } from '@react-three/drei';
import { useGameStore } from '@/game/state/store';
import { CIV_CONFIG } from '@/game/data/civilization-config';
import type { Civilization } from '@/game/data/civilization-config';
import { SpriteAnimator } from './sprite-animator';
import { WoodcuttingAnimator } from './woodcutting-animator';
import { getSpritePath } from './sprite-path-resolver';
import type { SpriteDirection } from './sprite-path-resolver';
import type { Member } from '@/game/state/game-state';

// Stump prop is at [cx+2.0, cz-0.4] — slot 0 stands west of it, facing east to chop.
// Other slots scattered around the work area.
const CHOP_SPOTS: { offset: [number, number]; facing: SpriteDirection }[] = [
  { offset: [0.7,  0.2],  facing: 'east'  }, // slot 0: left of stump, chops east
  { offset: [-1.0, -0.5], facing: 'east'  }, // slot 1: left side
  { offset: [-1.0,  0.8], facing: 'east'  }, // slot 2: left-front
  { offset: [ 0.5,  1.2], facing: 'south' }, // slot 3: near fallen log
];

/** Member name label above the sprite */
function NameLabel({ name }: { name: string }) {
  return (
    <Html position={[0, 1.3, 0]} center>
      <span style={{
        color: 'white',
        fontSize: '10px',
        whiteSpace: 'nowrap',
        textShadow: '1px 1px 2px black, 0 0 2px black',
      }}>
        {name}
      </span>
    </Html>
  );
}

function ChoppingMemberSprite({ member, slotIndex, roomCx, roomCz }: {
  member: Member;
  slotIndex: number;
  roomCx: number;
  roomCz: number;
}) {
  const idleDirRef = useRef<SpriteDirection>(CHOP_SPOTS[slotIndex].facing);
  const isMovingRef = useRef(false); // idle pose for non-woodcutting slots

  const civConfig = CIV_CONFIG[member.civilization as Civilization];
  const archetype = member.archetype ?? civConfig?.archetypes[0] ?? 'warrior';
  const gender = member.gender ?? 'M';
  const basePath = getSpritePath(member.civilization, archetype, gender);

  const { offset } = CHOP_SPOTS[slotIndex];
  const x = roomCx + offset[0];
  const z = roomCz + offset[1];

  return (
    <group position={[x, 1.05, z]}>
      {/* Blob shadow */}
      <mesh position={[0, -1.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 8]} />
        <meshBasicMaterial color="black" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <Billboard>
        <Suspense fallback={null}>
          {slotIndex === 0 ? (
            /* Slot 0: play woodcutting-8-frames/east animation */
            <WoodcuttingAnimator basePath={basePath} />
          ) : (
            /* Other slots: idle walking sprite (frame 0) */
            <SpriteAnimator
              basePath={basePath}
              directionRef={idleDirRef}
              isMovingRef={isMovingRef}
            />
          )}
        </Suspense>
        <NameLabel name={member.name} />
      </Billboard>
    </group>
  );
}

interface RoomMemberSpritesProps {
  assignedMemberIds: string[];
  roomCx: number;
  roomCz: number;
}

/** Renders up to 4 assigned members at chopping positions in the facility room */
export function RoomMemberSprites({ assignedMemberIds, roomCx, roomCz }: RoomMemberSpritesProps) {
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
        <ChoppingMemberSprite
          key={member.id}
          member={member}
          slotIndex={i}
          roomCx={roomCx}
          roomCz={roomCz}
        />
      ))}
    </group>
  );
}
