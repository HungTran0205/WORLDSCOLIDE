/**
 * BuildOverlay — dynamic grid + 3-mode ghost preview for tile-based placement.
 * Modes: floor-tile | erase-tile | furniture
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/game/state/store';
import { FURNITURE_DEFINITIONS } from '@/game/data/furniture';
import {
  checkTileAdjacency,
  isCellOccupiedByFurniture,
  getWorldBounds,
} from '@/game/systems/building-system';
import { canPlaceFurnitureOnFloor } from '@/game/systems/furniture-system';
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
  const floorTiles = useGameStore((s) => s.guildHall.floorTiles);
  const furniture = useGameStore((s) => s.guildHall.furniture);
  const guildLevel = useGameStore((s) => s.guildLevel);
  const { gl } = useThree();

  const [ghostPos, setGhostPos] = useState<{ x: number; z: number } | null>(null);
  const isPlacing = activeItem !== null;

  // Dynamic grid bounds with padding
  const worldBounds = useMemo(() => getWorldBounds(floorTiles), [floorTiles]);
  const gridBounds = useMemo(() => ({
    minX: worldBounds.minX - GRID_PADDING,
    minZ: worldBounds.minZ - GRID_PADDING,
    maxX: worldBounds.maxX + GRID_PADDING,
    maxZ: worldBounds.maxZ + GRID_PADDING,
  }), [worldBounds]);

  const handlePointerMove = useCallback((point: THREE.Vector3) => {
    setGhostPos({ x: Math.floor(point.x), z: Math.floor(point.z) });
  }, []);

  // Compute ghost state and validity for current mode
  const guildHall = useGameStore((s) => s.guildHall);
  const ghostState = useMemo(() => {
    if (!ghostPos || !activeItem) return null;

    if (activeItem.type === 'floor-tile') {
      const exists = floorTiles.some((t) => t.x === ghostPos.x && t.z === ghostPos.z);
      const adjacent = checkTileAdjacency(floorTiles, ghostPos.x, ghostPos.z);
      const valid = !exists && adjacent;
      return {
        mode: 'tile' as const,
        cells: [{ x: ghostPos.x, z: ghostPos.z }],
        valid,
        color: activeItem.selectedColor,
      };
    }

    if (activeItem.type === 'erase-tile') {
      const exists = floorTiles.some((t) => t.x === ghostPos.x && t.z === ghostPos.z);
      const occupied = isCellOccupiedByFurniture(furniture, ghostPos.x, ghostPos.z);
      const valid = exists && !occupied && floorTiles.length > 1;
      return {
        mode: 'erase' as const,
        cells: [{ x: ghostPos.x, z: ghostPos.z }],
        valid,
      };
    }

    if (activeItem.type === 'furniture') {
      const fDef = FURNITURE_DEFINITIONS.find((f) => f.type === activeItem.furnitureType);
      if (!fDef) return null;
      const [w, d] = (activeItem.rotation === 90 || activeItem.rotation === 270)
        ? [fDef.depth, fDef.width] : [fDef.width, fDef.depth];
      const pos = { x: ghostPos.x, z: ghostPos.z };
      const result = canPlaceFurnitureOnFloor(guildHall, activeItem.furnitureType!, pos, activeItem.rotation, guildLevel);
      return { mode: 'furniture' as const, x: ghostPos.x, z: ghostPos.z, w, d, valid: result.success };
    }

    return null;
  }, [ghostPos, activeItem, floorTiles, furniture, guildHall, guildLevel]);

  // Confirm placement on click
  const handleClick = useCallback(() => {
    if (!ghostPos || !ghostState || !ghostState.valid) return;

    const state = useGameStore.getState();
    const item = state.activeItem;
    if (!item) return;

    if (item.type === 'floor-tile') {
      state.placeFloorTile(ghostPos.x, ghostPos.z, item.selectedColor);
      // DON'T cancel — continuous paint mode
    } else if (item.type === 'erase-tile') {
      state.eraseFloorTile(ghostPos.x, ghostPos.z);
      // DON'T cancel — continuous erase mode
    } else if (item.type === 'furniture' && item.furnitureType) {
      state.placeFurniture(item.furnitureType, { x: ghostPos.x, z: ghostPos.z }, item.rotation);
      state.cancelPlacement(); // furniture: place once then exit
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
          {ghostState?.mode === 'tile' && (
            <GhostCells cells={ghostState.cells} valid={ghostState.valid} />
          )}
          {ghostState?.mode === 'erase' && (
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
