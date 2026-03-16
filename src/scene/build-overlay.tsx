/**
 * BuildOverlay — 3D grid + ghost room preview for placement/move mode.
 * Shows grid lines when build mode is active.
 * When placing (new or moving existing), shows a translucent ghost mesh
 * colored green (valid) or red (collision/out-of-bounds).
 * Handles R to rotate, click to place/confirm, Escape/right-click to cancel.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/game/state/store';
import { ROOM_DEFINITIONS } from '@/game/data/buildings';
import type { ItemID } from '@/game/data/items';
import {
  HALL_WIDTH,
  HALL_DEPTH,
  getRotatedSize,
  checkCollision,
  placeRoom,
} from '@/game/systems/building-system';

/** Invisible floor plane for raycasting mouse position */
function FloorPlane({ onPointerMove, onClick }: {
  onPointerMove: (e: THREE.Vector3) => void;
  onClick: () => void;
}) {
  const handlePointerMove = useCallback(
    (e: { point: THREE.Vector3 }) => {
      if (e.point) onPointerMove(e.point);
    },
    [onPointerMove],
  );

  return (
    <mesh
      position={[HALL_WIDTH / 2, 0, HALL_DEPTH / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerMove={handlePointerMove}
      onClick={onClick}
    >
      <planeGeometry args={[HALL_WIDTH, HALL_DEPTH]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}

/** Grid lines rendered on the floor */
function GridLines() {
  const points = useMemo(() => {
    const lines: THREE.Vector3[] = [];
    for (let x = 0; x <= HALL_WIDTH; x++) {
      lines.push(new THREE.Vector3(x, 0.01, 0), new THREE.Vector3(x, 0.01, HALL_DEPTH));
    }
    for (let z = 0; z <= HALL_DEPTH; z++) {
      lines.push(new THREE.Vector3(0, 0.01, z), new THREE.Vector3(HALL_WIDTH, 0.01, z));
    }
    return lines;
  }, []);

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(points.flatMap((p) => [p.x, p.y, p.z])), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#ffffff" opacity={0.3} transparent />
    </lineSegments>
  );
}

/** Ghost preview mesh — follows snapped mouse position */
function GhostRoom({ x, z, w, h, valid }: {
  x: number; z: number; w: number; h: number; valid: boolean;
}) {
  const color = valid ? '#00ff00' : '#ff0000';
  return (
    <mesh position={[x + w / 2, 0.75, z + h / 2]}>
      <boxGeometry args={[w, 1.5, h]} />
      <meshStandardMaterial color={color} opacity={0.5} transparent />
    </mesh>
  );
}

export function BuildOverlay() {
  const activeBuildType = useGameStore((s) => s.activeBuildType);
  const buildRotation = useGameStore((s) => s.buildRotation);
  const activeItem = useGameStore((s) => s.activeItem);
  const rotatePlacement = useGameStore((s) => s.rotatePlacement);
  const cancelPlacement = useGameStore((s) => s.cancelPlacement);
  const guildHall = useGameStore((s) => s.guildHall);
  const gold = useGameStore((s) => s.gold);
  const { gl } = useThree();

  const [ghostPos, setGhostPos] = useState<{ x: number; z: number } | null>(null);

  const isPlacing = activeBuildType !== null;
  const def = activeBuildType
    ? ROOM_DEFINITIONS.find((r) => r.type === activeBuildType)
    : null;
  const size = def ? getRotatedSize(def.width, def.depth, buildRotation) : { w: 1, h: 1 };

  // Exclude the room being moved from collision checks
  const excludeId = activeItem?.type === 'existing' ? activeItem.roomId : undefined;

  const handlePointerMove = useCallback(
    (point: THREE.Vector3) => {
      const snappedX = Math.floor(point.x);
      const snappedZ = Math.floor(point.z);
      setGhostPos({ x: snappedX, z: snappedZ });
    },
    [],
  );

  const inventory = useGameStore((s) => s.inventory);

  // Valid placement: no collision, and for new rooms also check gold + items
  const canAfford = def
    ? gold >= def.cost.gold && (!def.cost.items || Object.entries(def.cost.items).every(
        ([id, needed]) => needed === undefined || (inventory.items[id as ItemID] ?? 0) >= needed,
      ))
    : false;
  const isValid = ghostPos && def
    ? !checkCollision(guildHall, ghostPos.x, ghostPos.z, size.w, size.h, excludeId) &&
      (activeItem?.type === 'existing' || canAfford)
    : false;

  // Confirm placement or move on click — reads fresh state to avoid stale closure
  const handleClick = useCallback(() => {
    if (!ghostPos) return;

    const state = useGameStore.getState();
    const currentItem = state.activeItem;
    const currentType = state.activeBuildType;
    const currentRotation = state.buildRotation;
    if (!currentType) return;

    const currentDef = ROOM_DEFINITIONS.find((r) => r.type === currentType);
    if (!currentDef) return;

    const { w, h } = getRotatedSize(currentDef.width, currentDef.depth, currentRotation);
    const exId = currentItem?.type === 'existing' ? currentItem.roomId : undefined;
    const hasCollision = checkCollision(state.guildHall, ghostPos.x, ghostPos.z, w, h, exId);

    if (currentItem?.type === 'existing' && currentItem.roomId) {
      if (hasCollision) return;
      // Move existing room: update its position and rotation
      useGameStore.setState((s) => ({
        guildHall: {
          ...s.guildHall,
          rooms: s.guildHall.rooms.map((r) =>
            r.id === currentItem.roomId
              ? { ...r, position: { x: ghostPos.x, z: ghostPos.z }, rotation: currentRotation }
              : r,
          ),
        },
      }));
    } else {
      if (hasCollision || state.gold < currentDef.cost.gold) return;
      // Spend gold first (cheaper check), then consume items atomically
      if (!state.spendGold(currentDef.cost.gold)) return;
      if (currentDef.cost.items && !state.consumeItems(currentDef.cost.items)) {
        // Rollback gold if item consumption fails
        state.addGold(currentDef.cost.gold);
        return;
      }
      const newRoom = placeRoom(currentType, { x: ghostPos.x, z: ghostPos.z }, currentRotation);
      useGameStore.setState((s) => ({
        guildHall: { ...s.guildHall, rooms: [...s.guildHall.rooms, newRoom] },
      }));
    }
    state.cancelPlacement();
  }, [ghostPos]);

  // Keyboard: R to rotate, Escape to cancel
  useEffect(() => {
    if (!isPlacing) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') rotatePlacement();
      if (e.key === 'Escape') cancelPlacement();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlacing, rotatePlacement, cancelPlacement]);

  // Right-click to cancel (only when placing)
  useEffect(() => {
    if (!isPlacing) return;
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      cancelPlacement();
    };
    const canvas = gl.domElement;
    canvas.addEventListener('contextmenu', handleContextMenu);
    return () => canvas.removeEventListener('contextmenu', handleContextMenu);
  }, [isPlacing, gl, cancelPlacement]);

  return (
    <group>
      <GridLines />
      {isPlacing && (
        <>
          <FloorPlane onPointerMove={handlePointerMove} onClick={handleClick} />
          {ghostPos && (
            <GhostRoom
              x={ghostPos.x}
              z={ghostPos.z}
              w={size.w}
              h={size.h}
              valid={isValid}
            />
          )}
        </>
      )}
    </group>
  );
}
