/**
 * Wandering merc sprites for the tavern facility room.
 *
 * Hired mercs (available contracts) loiter and wander the tavern's open floor,
 * mirroring the guild-hall member wander (free target-seeking + collision-aware
 * sliding) but bounded to this 7×7 room with a static furniture keep-out — see
 * tavern-merc-wander.ts. Sprite art comes from each contract's frozen
 * visitorSnapshot (civ/archetype/gender). Only animates while the camera is
 * inside the tavern room, so off-screen mercs don't drive the render loop.
 *
 * NOTE: reuses GuildHallSpriteAnimator (UV-atlas walk), which has the documented
 * multi-instance WebGPU freeze for 3+ same-sprite instances. Merc cap is 3-4 and
 * archetypes usually vary, so it's rarely hit; the uniform-UV fix in
 * idle-sprite-material.ts is the porting target if it surfaces here.
 */

import { Billboard, Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo, useEffect, useLayoutEffect } from 'react';
import type { Group } from 'three';
import { useGameStore } from '@/game/state/store';
import { useCombatPanelStore } from '@/game/state/combat-panel-store';
import type { MercContract } from '@/game/state/game-state';
import { GuildHallSpriteAnimator } from '../sprites/guild-hall-sprite-animator';
import { getSpritePath, getHorizontalDirectionFromMovement } from '../sprites/sprite-path-resolver';
import type { HorizontalDirection } from '../sprites/sprite-path-resolver';
import { useGraphicsQuality } from '../world';
import {
  getTavernWalkCells,
  isTavernPointBlocked,
  nearestTavernCell,
  pickTavernTarget,
  BLOCKED_RETARGET_FRAMES,
  type Cell,
} from './tavern-merc-wander';

function MercSprite({ contract, index, cx, cz, cells }: {
  contract: MercContract;
  index: number;
  cx: number;
  cz: number;
  cells: Cell[];
}) {
  const quality = useGraphicsQuality();
  const isCombatOpen = useCombatPanelStore((s) => s.isOpen);
  const ref = useRef<Group>(null);
  const targetRef = useRef<Cell | null>(null);
  const waitRef = useRef(0);
  const directionRef = useRef<HorizontalDirection>('east');
  const isMovingRef = useRef(false);
  const blockedFramesRef = useRef(0);
  const didSpawnSnapRef = useRef(false);

  useFrame(({ clock }, rawDelta) => {
    if (!ref.current || cells.length === 0) return;
    const delta = Math.min(rawDelta, 0.1);
    const pos = ref.current.position;

    // One-time spawn guard — relocate if spawned inside a furniture footprint.
    if (!didSpawnSnapRef.current) {
      didSpawnSnapRef.current = true;
      if (isTavernPointBlocked(pos.x, pos.z, cx, cz)) {
        const safe = nearestTavernCell(cells, pos.x, pos.z);
        if (safe) {
          pos.x = safe.x;
          pos.z = safe.z;
        }
      }
    }

    // Pick a fresh target when none set, the idle wait elapsed, or wedged too long.
    if (!targetRef.current || waitRef.current <= 0) {
      targetRef.current = pickTavernTarget(cells, clock.elapsedTime * 100 + index * 37);
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
    const speed = 0.8;
    const prevDistSq = dist * dist;
    const nextX = pos.x + (dx / dist) * speed * delta;
    const nextZ = pos.z + (dz / dist) * speed * delta;

    // Collision guard: full step, else slide on one axis, else stall.
    let fullStep = false;
    if (!isTavernPointBlocked(nextX, nextZ, cx, cz)) {
      pos.x = nextX;
      pos.z = nextZ;
      fullStep = true;
    } else if (!isTavernPointBlocked(nextX, pos.z, cx, cz)) {
      pos.x = nextX;
    } else if (!isTavernPointBlocked(pos.x, nextZ, cx, cz)) {
      pos.z = nextZ;
    }

    const ndx = target.x - pos.x;
    const ndz = target.z - pos.z;
    const progressed = ndx * ndx + ndz * ndz < prevDistSq - 1e-4;
    if (fullStep && progressed) {
      blockedFramesRef.current = 0;
    } else {
      blockedFramesRef.current++;
    }

    if (blockedFramesRef.current > BLOCKED_RETARGET_FRAMES) {
      targetRef.current = null;
      blockedFramesRef.current = 0;
    }
  });

  // Spread initial spawns across the walkable set instead of clustering at cell 0.
  const startPos = cells.length > 0 ? cells[(index * 13 + 5) % cells.length] : { x: cx, z: cz };

  // Seed the transform once, imperatively — a live `position` prop would be
  // re-applied on every re-render (combat toggle, roster changes), teleporting
  // the merc back to spawn and discarding its wandered position.
  useLayoutEffect(() => {
    ref.current?.position.set(startPos.x, 1.05, startPos.z);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const v = contract.visitorSnapshot;
  const basePath = getSpritePath(v.civilization, v.archetype, v.gender);

  return (
    <group ref={ref}>
      {quality === 'high' && (
        <mesh position={[0, -1.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.35, 8]} />
          <meshBasicMaterial color="black" transparent opacity={0.25} depthWrite={false} />
        </mesh>
      )}
      <Billboard>
        <GuildHallSpriteAnimator
          basePath={basePath}
          directionRef={directionRef}
          isMovingRef={isMovingRef}
        />
        {!isCombatOpen && (
          <Html position={[0, 1.3, 0]} center>
            <span style={{ color: '#ffd9a0', fontSize: '10px', whiteSpace: 'nowrap', textShadow: '1px 1px 2px black, 0 0 2px black' }}>
              {v.name} <span style={{ color: '#f0a500' }}>⚔</span>
            </span>
          </Html>
        )}
      </Billboard>
    </group>
  );
}

interface TavernMercSpritesProps {
  cx: number;
  cz: number;
}

/** Billboard sprites for hired mercs wandering the tavern room. */
export function TavernMercSprites({ cx, cz }: TavernMercSpritesProps) {
  const mercContracts = useGameStore((s) => s.tavern.mercContracts);
  const cameraTarget = useGameStore((s) => s.cameraTarget);
  const isCombatOpen = useCombatPanelStore((s) => s.isOpen);
  const invalidate = useThree((s) => s.invalidate);

  // Only mercs not currently away on a quest hang around the tavern.
  const available = useMemo(
    () => mercContracts.filter((c) => c.status === 'available'),
    [mercContracts],
  );
  const cells = useMemo(() => getTavernWalkCells(cx, cz), [cx, cz]);

  // Drive the render loop at 20fps only while the camera is inside this room.
  const isActive = Math.abs(cameraTarget[0] - cx) <= 3.5 && Math.abs(cameraTarget[2] - cz) <= 3.5;
  const shouldAnimate = isActive && !isCombatOpen && available.length > 0;
  useEffect(() => {
    if (!shouldAnimate) return;
    const id = setInterval(invalidate, 1000 / 20);
    return () => clearInterval(id);
  }, [shouldAnimate, invalidate]);

  useEffect(() => { invalidate(); }, [available.length, invalidate]);

  if (available.length === 0) return null;

  return (
    <group>
      {available.map((c, i) => (
        <MercSprite key={c.id} contract={c} index={i} cx={cx} cz={cz} cells={cells} />
      ))}
    </group>
  );
}
