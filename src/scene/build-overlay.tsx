/**
 * BuildOverlay — dynamic grid + 3-mode ghost preview for cell-based placement.
 * Modes: new-room | new-furniture | move-room
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/game/state/store';
import { ROOM_DEFINITIONS } from '@/game/data/buildings';
import { FURNITURE_DEFINITIONS } from '@/game/data/furniture';
import {
  generateRoomCells,
  checkCellOverlap,
  checkAdjacency,
  getWorldBounds,
} from '@/game/systems/building-system';
import { canPlaceFurniture } from '@/game/systems/furniture-system';
import { BuildGridLines } from './build-grid-lines';
import { GhostCells, GhostFurniture } from './build-ghost-preview';

/** Grid padding around world bounds */
const GRID_PADDING = 8;

/** Invisible floor plane for raycasting mouse position */
function FloorPlane({ bounds, onPointerMove, onClick }: {
  bounds: { minX: number; minZ: number; maxX: number; maxZ: number };
  onPointerMove: (point: THREE.Vector3) => void;
  onClick: () => void;
}) {
  const w = bounds.maxX - bounds.minX;
  const d = bounds.maxZ - bounds.minZ;
  const cx = bounds.minX + w / 2;
  const cz = bounds.minZ + d / 2;

  const handlePointerMove = useCallback(
    (e: { point: THREE.Vector3 }) => { if (e.point) onPointerMove(e.point); },
    [onPointerMove],
  );

  return (
    <mesh position={[cx, 0, cz]} rotation={[-Math.PI / 2, 0, 0]}
      onPointerMove={handlePointerMove} onClick={onClick}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}

export function BuildOverlay() {
  const activeItem = useGameStore((s) => s.activeItem);
  const rotatePlacement = useGameStore((s) => s.rotatePlacement);
  const cancelPlacement = useGameStore((s) => s.cancelPlacement);
  const rooms = useGameStore((s) => s.guildHall.rooms);
  const { gl } = useThree();

  const [ghostPos, setGhostPos] = useState<{ x: number; z: number } | null>(null);
  const isPlacing = activeItem !== null;

  // Dynamic grid bounds with padding
  const worldBounds = useMemo(() => getWorldBounds(rooms), [rooms]);
  const gridBounds = useMemo(() => ({
    minX: worldBounds.minX - GRID_PADDING,
    minZ: worldBounds.minZ - GRID_PADDING,
    maxX: worldBounds.maxX + GRID_PADDING,
    maxZ: worldBounds.maxZ + GRID_PADDING,
  }), [worldBounds]);

  const handlePointerMove = useCallback((point: THREE.Vector3) => {
    setGhostPos({ x: Math.floor(point.x), z: Math.floor(point.z) });
  }, []);

  // Compute ghost cells and validity for current mode
  const ghostState = useMemo(() => {
    if (!ghostPos || !activeItem) return null;

    if (activeItem.type === 'new-room') {
      const def = ROOM_DEFINITIONS.find((r) => r.type === activeItem.roomType);
      if (!def) return null;
      const cells = generateRoomCells(ghostPos.x, ghostPos.z, def.defaultWidth, def.defaultDepth);
      const overlap = checkCellOverlap(rooms, cells);
      const adjacent = checkAdjacency(rooms, cells);
      return { mode: 'room' as const, cells, valid: !overlap && adjacent };
    }

    if (activeItem.type === 'move-room') {
      const def = ROOM_DEFINITIONS.find((r) => r.type === activeItem.roomType);
      if (!def) return null;
      const cells = generateRoomCells(ghostPos.x, ghostPos.z, def.defaultWidth, def.defaultDepth);
      const overlap = checkCellOverlap(rooms, cells, activeItem.roomId);
      const adjacent = checkAdjacency(
        rooms.filter((r) => r.id !== activeItem.roomId), cells,
      );
      return { mode: 'room' as const, cells, valid: !overlap && adjacent };
    }

    if (activeItem.type === 'new-furniture') {
      const fDef = FURNITURE_DEFINITIONS.find((f) => f.type === activeItem.furnitureType);
      const targetRoom = rooms.find((r) => r.id === activeItem.targetRoomId);
      if (!fDef || !targetRoom) return null;
      const [w, d] = (activeItem.rotation === 90 || activeItem.rotation === 270)
        ? [fDef.depth, fDef.width] : [fDef.width, fDef.depth];
      const pos = { x: ghostPos.x, z: ghostPos.z };
      const result = canPlaceFurniture(targetRoom, activeItem.furnitureType!, pos, activeItem.rotation);
      return { mode: 'furniture' as const, x: ghostPos.x, z: ghostPos.z, w, d, valid: result.success };
    }

    return null;
  }, [ghostPos, activeItem, rooms]);

  // Confirm placement on click
  const handleClick = useCallback(() => {
    if (!ghostPos || !ghostState || !ghostState.valid) return;

    const state = useGameStore.getState();
    const item = state.activeItem;
    if (!item) return;

    if (item.type === 'new-room' && item.roomType) {
      const def = ROOM_DEFINITIONS.find((r) => r.type === item.roomType);
      if (!def) return;
      const cells = generateRoomCells(ghostPos.x, ghostPos.z, def.defaultWidth, def.defaultDepth);
      state.buildRoom(item.roomType, cells);
      state.cancelPlacement();
    } else if (item.type === 'move-room' && item.roomId) {
      const def = ROOM_DEFINITIONS.find((r) => r.type === item.roomType);
      if (!def) return;
      const newCells = generateRoomCells(ghostPos.x, ghostPos.z, def.defaultWidth, def.defaultDepth);
      // Update room cells in place
      useGameStore.setState((s) => ({
        guildHall: {
          ...s.guildHall,
          rooms: s.guildHall.rooms.map((r) =>
            r.id === item.roomId ? { ...r, cells: newCells } : r,
          ),
        },
      }));
      state.cancelPlacement();
    } else if (item.type === 'new-furniture' && item.furnitureType && item.targetRoomId) {
      const fDef = FURNITURE_DEFINITIONS.find((f) => f.type === item.furnitureType);
      if (!fDef) return;
      const pos = { x: ghostPos.x, z: ghostPos.z };
      // Spend gold + items, place furniture via state update
      if (state.gold < fDef.cost.gold) return;
      state.spendGold(fDef.cost.gold);
      if (fDef.cost.items && !state.consumeItems(fDef.cost.items)) {
        state.addGold(fDef.cost.gold); // rollback
        return;
      }
      useGameStore.setState((s) => ({
        guildHall: {
          ...s.guildHall,
          rooms: s.guildHall.rooms.map((r) => {
            if (r.id !== item.targetRoomId) return r;
            return {
              ...r,
              furniture: [...r.furniture, {
                id: crypto.randomUUID(),
                type: item.furnitureType!,
                level: 1,
                position: pos,
                rotation: item.rotation,
              }],
            };
          }),
        },
      }));
      state.cancelPlacement();
    }
  }, [ghostPos, ghostState]);

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

  // Right-click to cancel
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
      <BuildGridLines {...gridBounds} />
      {isPlacing && (
        <>
          <FloorPlane bounds={gridBounds} onPointerMove={handlePointerMove} onClick={handleClick} />
          {ghostState?.mode === 'room' && (
            <GhostCells cells={ghostState.cells} valid={ghostState.valid} />
          )}
          {ghostState?.mode === 'furniture' && (
            <GhostFurniture
              x={ghostState.x} z={ghostState.z}
              w={ghostState.w} d={ghostState.d}
              valid={ghostState.valid}
            />
          )}
        </>
      )}
    </group>
  );
}
