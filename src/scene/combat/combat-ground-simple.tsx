/**
 * Minimal combat scene backdrop:
 *  - Large black plane behind everything (catches any rays past the ground)
 *  - Small tile-textured ground plane sized to the battlefield extent so it
 *    does NOT overflow past the visible combat area — gives the panel a
 *    "window looking onto a stage" feel rather than infinite floor.
 *
 * Tile texture is generated at runtime (checker pattern) so no asset file
 * is needed. Pixel-art crisp via NEAREST filter.
 */

import { useMemo } from 'react';
import { CanvasTexture, NearestFilter, RepeatWrapping } from 'three';

// Battlefield bounds — see FORMATION_POSITIONS in combat-arena-types.ts
// Allies at x=-10..-5, enemies at x=5..10, lanes z=-3..+3. Oversized
// (32×12) so the ground reaches the panel viewport edges at common browser
// widths — scissor + box-shadow then trim anything past the panel rect.
// Better to over-cover than reveal CSS body bg on the panel sides.
const GROUND_WIDTH = 32;
const GROUND_DEPTH = 12;
const TILE_WORLD_SIZE = 1; // 1 world unit per tile

// Backdrop pushed beyond all bg layers (far bg at z=-22, mid at z=-12) so it
// only catches edge cases where the bg planes don't fully cover frustum.
const BACKDROP_SIZE = 200;
const BACKDROP_Z = -30;

/** Two-tone forest-floor checker, 64×64 px, repeated by world units.
 *  Mountain Village theme — dark forest green, alternating tile shades. */
function createCheckerTexture(): CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  // Dark forest base
  ctx.fillStyle = '#1f3a22';
  ctx.fillRect(0, 0, size, size);
  // Slightly brighter quadrants for the checker — mossy variation
  ctx.fillStyle = '#2a4a2d';
  ctx.fillRect(0, 0, size / 2, size / 2);
  ctx.fillRect(size / 2, size / 2, size / 2, size / 2);

  const tex = new CanvasTexture(canvas);
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(GROUND_WIDTH / TILE_WORLD_SIZE, GROUND_DEPTH / TILE_WORLD_SIZE);
  return tex;
}

export function CombatGroundSimple() {
  const tileTex = useMemo(() => createCheckerTexture(), []);

  return (
    <>
      {/* Far black backdrop — last-resort opaque fallback behind all bg
          layers. Sized 200×200 at z=-30, plane normal +Z (no rotation) so it
          faces the camera. Guarantees no transparent canvas pixel shows
          through to underlying body / leaked guild scene inside panel. */}
      <mesh position={[0, 0, BACKDROP_Z]}>
        <planeGeometry args={[BACKDROP_SIZE, BACKDROP_SIZE]} />
        <meshBasicMaterial color="#0a0d0f" />
      </mesh>

      {/* Tile ground — flat on XZ, sized to battlefield extent only */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[GROUND_WIDTH, GROUND_DEPTH]} />
        <meshBasicMaterial map={tileTex} />
      </mesh>
    </>
  );
}
