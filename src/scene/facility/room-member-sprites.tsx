/**
 * Animated member sprites for the facility room view.
 * Logging-site slot 0: woodcutting animation facing east.
 * All other facilities: walking patrol animation with per-facility positions.
 */

import { useRef, useMemo, useCallback, Suspense } from 'react';
import { Billboard, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useVFXEmitter } from 'r3f-vfx';
import { useGameStore } from '@/game/state/store';
import { useCombatPanelStore } from '@/game/state/combat-panel-store';
import { CIV_CONFIG } from '@/game/data/civilization-config';
import type { Civilization } from '@/game/data/civilization-config';
import { SpriteAnimator } from '../sprites/sprite-animator';
import { WoodcuttingAnimator } from '../sprites/woodcutting-animator';
import { WorkingAnimator } from '../sprites/working-animator';
import { getSpritePath } from '../sprites/sprite-path-resolver';
import { hasWorkingAnim } from '../sprites/combat-sprite-resolver';
import type { SpriteDirection } from '../sprites/sprite-path-resolver';
import type { Member, FacilityType } from '@/game/state/game-state';
import type { MutableRefObject } from 'react';
import { BLACKSMITH_SPARK_NAME } from '../atmospheric/particles/ambient-vfx-root';

/** Animation frame that lands the hammer on the anvil. Sparks fly here. */
const BLACKSMITH_IMPACT_FRAME = 3;
/** Sparks per strike. ~150 maxParticles ÷ ~0.5s lifetime gives room for 3
 *  concurrent strikes if multiple blacksmiths exist (only 1 today). */
const BLACKSMITH_SPARK_COUNT = 18;

interface SpotDef {
  offset: [number, number]; // [dx, dz] from room center
  facing: SpriteDirection;
}

/** Per-facility member patrol positions relative to room center */
const FACILITY_SPOTS: Record<FacilityType, SpotDef[]> = {
  'logging-site': [
    { offset: [0.7,  0.2],  facing: 'east'  }, // slot 0: woodcutting east
    { offset: [-1.0, -0.5], facing: 'east'  },
    { offset: [-1.0,  0.8], facing: 'east'  },
    { offset: [ 0.5,  1.2], facing: 'south' },
  ],
  tavern: [
    // Keeper stands in the open floor in front of the bar (+Z = toward camera),
    // clear of the tall counter shelf (cx-2.8, cz+1.2) that was occluding it.
    { offset: [-2,  2.2], facing: 'north' },
    { offset: [ 1.2,  0.5], facing: 'west'  },
    { offset: [-1.5,  0.0], facing: 'east'  },
    { offset: [ 0.0, -0.5], facing: 'north' },
  ],
  'training-yard': [
    { offset: [ 0.0,  1.2], facing: 'north' }, // facing training dummy
    { offset: [-1.5,  0.5], facing: 'east'  },
    { offset: [ 1.5,  0.5], facing: 'west'  },
    { offset: [ 0.0,  0.0], facing: 'south' },
  ],
  infirmary: [
    { offset: [-1.5,  0.0], facing: 'east'  }, // attending left bed
    { offset: [ 1.5,  0.0], facing: 'west'  }, // attending right bed
    { offset: [ 0.0, -1.5], facing: 'south' }, // near alchemy table
    { offset: [ 0.0,  1.5], facing: 'north' },
  ],
  workshop: [
    { offset: [ 0.0, -1.2], facing: 'north' }, // at workbench
    { offset: [-1.5,  0.5], facing: 'east'  },
    { offset: [ 1.5,  0.5], facing: 'west'  },
    { offset: [ 0.0,  1.5], facing: 'south' },
  ],
  'stone-quarry': [
    { offset: [ 0.5,  1.0], facing: 'north' },
    { offset: [-0.8, -0.5], facing: 'east'  },
    { offset: [-0.5,  0.8], facing: 'west'  },
    { offset: [ 0.8, -0.2], facing: 'south' },
  ],
  'alchemy-lab': [
    { offset: [-1.0,  2.2], facing: 'south' }, // slot 0: at alchemy_workbend (front-left)
    { offset: [ 2.0, -2.2], facing: 'north' }, // slot 1: at alchemists-curio-cab (back-right)
    { offset: [-2.0, -2.0], facing: 'west'  }, // slot 2: at alchemy_shelf (back-left wall)
    { offset: [-2.2,  1.2], facing: 'west'  }, // slot 3: at alchemy_silo (left wall)
  ],
};

const FACING_REVERSE: Record<SpriteDirection, SpriteDirection> = {
  north: 'south', south: 'north', east: 'west', west: 'east',
};

/** Flips direction every ~2.5s to simulate back-and-forth patrol. Disabled for stationary workers. */
function usePatrolAnimation(
  dirRef: MutableRefObject<SpriteDirection>,
  isMovingRef: MutableRefObject<boolean>,
  facing: SpriteDirection,
  enabled: boolean,
) {
  const timerRef = useRef(0);
  const fwdRef = useRef(true);

  useFrame((_, delta) => {
    if (!enabled) {
      isMovingRef.current = false;
      return;
    }
    timerRef.current += delta;
    if (timerRef.current > 2.5) {
      timerRef.current = 0;
      fwdRef.current = !fwdRef.current;
      dirRef.current = fwdRef.current ? facing : FACING_REVERSE[facing];
    }
    isMovingRef.current = true;
  });
}

/** Member name label above sprite — hidden when combat panel is open
 *  because drei <Html> portals to DOM and bypasses the visibility wrapper
 *  in world.tsx. */
function NameLabel({ name }: { name: string }) {
  const isCombatOpen = useCombatPanelStore((s) => s.isOpen);
  if (isCombatOpen) return null;
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

function FacilityMemberSprite({ member, facilityType, slotIndex, roomCx, roomCz }: {
  member: Member;
  facilityType: FacilityType;
  slotIndex: number;
  roomCx: number;
  roomCz: number;
}) {
  const spots = FACILITY_SPOTS[facilityType] ?? FACILITY_SPOTS['training-yard'];
  const spot = spots[slotIndex] ?? spots[0];

  // Workshop slot 0 swings a hammer (blacksmith); slots 1-2 do generic
  // crafting (working). Slot 3 patrols. All slots in alchemy-lab use
  // working. Logging-site slot 0 chops wood.
  const isWoodcutting = facilityType === 'logging-site' && slotIndex === 0;
  const isBlacksmith  = facilityType === 'workshop' && slotIndex === 0;
  const isWorking     =
    facilityType === 'alchemy-lab' ||
    (facilityType === 'workshop' && (slotIndex === 1 || slotIndex === 2));

  const civConfig = CIV_CONFIG[member.civilization as Civilization];
  const archetype = member.archetype ?? civConfig?.archetypes[0] ?? 'warrior';
  const gender = member.gender ?? 'M';
  const basePath = getSpritePath(member.civilization, archetype, gender);

  // Tavern working branch: only for char types that have an on-disk working/
  // sprite folder. Characters without it (DQ-*, TL-*, LS-WARRIOR-F) fall
  // through to the patrol SpriteAnimator so they remain visible.
  const canWork = hasWorkingAnim(basePath);
  const isTavernWorker = facilityType === 'tavern' && canWork;

  const dirRef = useRef<SpriteDirection>(spot.facing);
  const isMovingRef = useRef(true);

  // Stationary workers don't patrol; woodcutting/working/blacksmith/tavern workers
  // use fixed-direction animators. isTavernWorker only true when asset exists.
  usePatrolAnimation(
    dirRef,
    isMovingRef,
    spot.facing,
    !isWoodcutting && !isWorking && !isBlacksmith && !isTavernWorker,
  );

  const x = roomCx + spot.offset[0];
  const z = roomCz + spot.offset[1];

  // Spark emitter — hook is called unconditionally per React rules. The
  // returned closure is a no-op when no <VFXParticles name="blacksmith-spark">
  // is mounted, but AmbientVfxRoot mounts it at scene root, so every sprite
  // can fire sparks if they happen to be the blacksmith.
  const sparkEmitter = useVFXEmitter(BLACKSMITH_SPARK_NAME);

  // Emit at the anvil in front of the blacksmith — member faces north
  // (spot.facing = 'north'), so the anvil sits at z - 0.4. Waist height for
  // a believable strike origin.
  const handleBlacksmithFrame = useCallback((frameIdx: number) => {
    if (frameIdx !== BLACKSMITH_IMPACT_FRAME) return;
    sparkEmitter.emit([x+1, 1.2, z + 1], BLACKSMITH_SPARK_COUNT);
  }, [sparkEmitter, x, z]);

  return (
    <group position={[x, 1.05, z]}>
      {/* Blob shadow */}
      <mesh position={[0, -1.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.35, 8]} />
        <meshBasicMaterial color="black" transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <Billboard>
        <Suspense fallback={null}>
          {isWoodcutting ? (
            <WoodcuttingAnimator basePath={basePath} />
          ) : isBlacksmith ? (
            <WorkingAnimator
              basePath={basePath}
              animationName="blacksmith"
              onFrame={handleBlacksmithFrame}
            />
          ) : isWorking ? (
            // WorkingAnimator with SpriteAnimator (isMoving=false) as fallback via Suspense
            <WorkingAnimator basePath={basePath} />
          ) : isTavernWorker ? (
            // Tavern: play working loop for chars that have the asset on disk.
            // canWork===false (DQ-*, TL-*, LS-WARRIOR-F) never enters this branch
            // and fall to the patrol SpriteAnimator below — no missing-texture error.
            <WorkingAnimator basePath={basePath} />
          ) : (
            <SpriteAnimator basePath={basePath} directionRef={dirRef} isMovingRef={isMovingRef} />
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
  facilityType: FacilityType;
}

/** Renders up to 4 assigned members at facility-appropriate positions */
export function RoomMemberSprites({ assignedMemberIds, roomCx, roomCz, facilityType }: RoomMemberSpritesProps) {
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
        <FacilityMemberSprite
          key={member.id}
          member={member}
          facilityType={facilityType}
          slotIndex={i}
          roomCx={roomCx}
          roomCz={roomCz}
        />
      ))}
    </group>
  );
}
