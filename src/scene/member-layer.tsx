/**
 * Guild hall member sprites — wandering idle members with name indicators.
 * Single Billboard per member, no troika Text (uses colored bar instead).
 * Invalidates at 20fps only when members exist and are visible.
 */

import { Billboard, Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '@/game/state/store';
import { useCombatPanelStore } from '@/game/state/combat-panel-store';
import { useRef, useMemo, useEffect, useLayoutEffect } from 'react';
import type { Group } from 'three';
import type { Member } from '@/game/state/game-state';
import { CIV_CONFIG } from '@/game/data/civilization-config';
import type { Civilization } from '@/game/data/civilization-config';
import { GuildHallSpriteAnimator } from './sprites/guild-hall-sprite-animator';
import { getSpritePath, getHorizontalDirectionFromMovement } from './sprites/sprite-path-resolver';
import type { HorizontalDirection } from './sprites/sprite-path-resolver';
import { isGuildHallPointBlocked } from './guild-hall/guild-hall-collision';
import {
  getAllCellCenters,
  nearestWalkableCell,
  pickWalkableTarget,
  BLOCKED_RETARGET_FRAMES,
} from './guild-hall/guild-hall-movement';
import { useGraphicsQuality } from './world';

function MemberSprite({ member, index }: { member: Member; index: number }) {
  const quality = useGraphicsQuality();
  // Guard nameplate <Html> against leaking into combat panel — drei <Html>
  // portals to DOM outside R3F, so the parent <group visible={false}> wrapper
  // in world.tsx doesn't hide it. Skip rendering the label when combat is open.
  const isCombatOpen = useCombatPanelStore((s) => s.isOpen);
  const ref = useRef<Group>(null);
  const targetRef = useRef<{ x: number; z: number } | null>(null);
  const waitRef = useRef(0);
  const directionRef = useRef<HorizontalDirection>('east');
  const isMovingRef = useRef(false);
  // Movement guard state: counts frames wedged against a prop, and whether the
  // one-time spawn-inside-a-prop relocation has run.
  const blockedFramesRef = useRef(0);
  const didSpawnSnapRef = useRef(false);
  const floorTiles = useGameStore((s) => s.guildHall.floorTiles);
  const cells = useMemo(() => getAllCellCenters(floorTiles), [floorTiles]);

  useFrame(({ clock }, rawDelta) => {
    if (!ref.current || cells.length === 0) return;
    const delta = Math.min(rawDelta, 0.1);
    const pos = ref.current.position;

    // One-time spawn guard — relocate if spawned inside a prop footprint.
    if (!didSpawnSnapRef.current) {
      didSpawnSnapRef.current = true;
      if (isGuildHallPointBlocked(pos.x, pos.z)) {
        const safe = nearestWalkableCell(cells, pos.x, pos.z);
        if (safe) {
          pos.x = safe.x;
          pos.z = safe.z;
        }
      }
    }

    // Pick a fresh walkable target when none set, the idle wait elapsed, or the
    // member has been wedged against a prop for too long.
    if (!targetRef.current || waitRef.current <= 0) {
      targetRef.current = pickWalkableTarget(cells, clock.elapsedTime * 100 + index * 37);
      waitRef.current = 2 + index * 0.5;
      blockedFramesRef.current = 0;
    }

    const target = targetRef.current;
    const dx = target.x - pos.x;
    const dz = target.z - pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.15) {
      isMovingRef.current = false;
      waitRef.current -= delta;
      return;
    }

    isMovingRef.current = true;
    directionRef.current = getHorizontalDirectionFromMovement(dx, dz, directionRef.current);
    const speed = 0.9;
    const prevDistSq = dist * dist;
    const nextX = pos.x + (dx / dist) * speed * delta;
    const nextZ = pos.z + (dz / dist) * speed * delta;

    // Collision guard: commit full step, else slide on a single axis, else stall.
    let fullStep = false;
    if (!isGuildHallPointBlocked(nextX, nextZ)) {
      pos.x = nextX;
      pos.z = nextZ;
      fullStep = true;
    } else if (!isGuildHallPointBlocked(nextX, pos.z)) {
      pos.x = nextX;
    } else if (!isGuildHallPointBlocked(pos.x, nextZ)) {
      pos.z = nextZ;
    }

    // Reset the wedged counter ONLY on a clean step that also got closer to the
    // target. A frame that's blocked head-on, only sliding along an obstacle
    // face, or oscillating in a pocket all count as wedged — so a member whose
    // target sits behind a prop turns away after BLOCKED_RETARGET_FRAMES instead
    // of grinding into the wall forever (sliding the whole wall face also counts
    // even though distance keeps shrinking).
    const ndx = target.x - pos.x;
    const ndz = target.z - pos.z;
    const progressed = ndx * ndx + ndz * ndz < prevDistSq - 1e-4;
    if (fullStep && progressed) {
      blockedFramesRef.current = 0;
    } else {
      blockedFramesRef.current++;
    }

    // Hit a wall too long → turn away (pick a fresh wander target).
    if (blockedFramesRef.current > BLOCKED_RETARGET_FRAMES) {
      targetRef.current = null;
      blockedFramesRef.current = 0;
    }
  });

  const startPos = cells.length > 0 ? cells[index % cells.length] : { x: 3, z: 3 };

  // Seed the transform once, imperatively. A live `position` prop would be
  // re-applied by R3F on every re-render (combat-panel toggle, floor edits,
  // roster changes), teleporting the member back to spawn and discarding both
  // its wandered position and the spawn-snap relocation. useLayoutEffect runs
  // before the first canvas draw, so there's no origin flash.
  useLayoutEffect(() => {
    ref.current?.position.set(startPos.x, 1.05, startPos.z);
    // Run once on mount; subsequent movement is driven imperatively in useFrame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const civConfig = CIV_CONFIG[member.civilization as Civilization];
  const archetype = member.archetype ?? civConfig?.archetypes[0] ?? 'warrior';
  const gender = member.gender ?? 'M';
  const basePath = getSpritePath(member.civilization, archetype, gender);

  return (
    <group ref={ref}>
      {/* Blob shadow — flat circle on floor, outside Billboard so it doesn't face camera */}
      {quality === 'high' && (
        <mesh position={[0, -1.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.35, 8]} />
          <meshBasicMaterial color="black" transparent opacity={0.25} depthWrite={false} />
        </mesh>
      )}
      {/* Single Billboard — sprite + name indicator */}
      <Billboard>
        <GuildHallSpriteAnimator
          basePath={basePath}
          directionRef={directionRef}
          isMovingRef={isMovingRef}
        />
        {/* Member name — Html overlay avoids troika GLSL incompatibility with WebGPU */}
        {!isCombatOpen && (
          <Html position={[0, 1.3, 0]} center>
            <span style={{ color: 'white', fontSize: '10px', whiteSpace: 'nowrap', textShadow: '1px 1px 2px black, 0 0 2px black' }}>
              {member.name}
            </span>
          </Html>
        )}
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
