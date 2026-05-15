/**
 * AoeTelegraph — animated ground decal warning the player about an incoming
 * area-of-effect skill cast. Phase 08 — Standard Tile Floor System.
 *
 * Built on <FloorDecal>. Three-phase opacity animation drives the "danger"
 * read while a target reticle / shape outline communicates the affected zone.
 *
 *   Phase 1 — Spawn  (0..SPAWN_MS)               opacity 0 → SPAWN_PEAK
 *   Phase 2 — Pulse  (SPAWN_MS..durationMs-LOCK_MS)  pulse PULSE_LO..PULSE_HI @ PULSE_HZ
 *   Phase 3 — Lock   (last LOCK_MS)              opacity 1 solid (damage imminent)
 *
 * Auto-unmounts after durationMs via onComplete callback (caller owns the
 * setState). Uses a per-instance ref + useFrame to avoid React rerender churn
 * on every animation frame.
 *
 * Texture lookup is shape-driven; caller passes shape, color, radius. The PNGs
 * live in /public/decals/floor/aoe-{shape}.png.
 */

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { MeshBasicMaterial } from 'three';
import type { AoeShape } from '@/game/systems/combat-types';
import { FloorDecal } from './floor-decal';

const SPAWN_MS = 100;
const LOCK_MS = 200;
const SPAWN_PEAK = 0.7;
const PULSE_LO = 0.5;
const PULSE_HI = 0.9;
const PULSE_HZ = 4;
/** Floor below which phase math (spawn + lock) collapses; clamp to keep a usable pulse window. */
const MIN_TOTAL_MS = SPAWN_MS + LOCK_MS + 50;

const SHAPE_TEXTURES: Record<AoeShape, string> = {
  circle: '/decals/floor/aoe-circle.png',
  cone: '/decals/floor/aoe-cone.png',
  rect: '/decals/floor/aoe-rect.png',
};

export interface AoeTelegraphProps {
  /** World-space center of the AOE [x, y, z]. */
  position: [number, number, number];
  /** AOE radius (world units). For circle this is the full radius; for cone/rect it is the half-extent baseline. */
  radius: number;
  /** Telegraph shape. */
  shape: AoeShape;
  /** Total telegraph lifetime in ms (spawn → pulse → lock → done). */
  durationMs: number;
  /** Tint color hex. Default red ('#ff5a5a' — enemy danger). */
  color?: string;
  /** Y rotation for cone aim direction (radians). Default 0 (cone faces +X). */
  rotation?: number;
  /** Render order hint when multiple telegraphs overlap. */
  renderOrder?: number;
  /** Fired exactly once after durationMs has elapsed. Caller unmounts the component. */
  onComplete?: () => void;
}

export function AoeTelegraph({
  position,
  radius,
  shape,
  durationMs,
  color = '#ff5a5a',
  rotation = 0,
  renderOrder = 5,
  onComplete,
}: AoeTelegraphProps) {
  const matRef = useRef<MeshBasicMaterial | null>(null);
  const startMsRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  // Clamp pathologically short durations so spawn + pulse + lock all get a slice.
  const totalMs = Math.max(durationMs, MIN_TOTAL_MS);

  // Plane covers the AOE bounding box. Circle/rect use diameter; cone is sized
  // as a square that contains a 90deg fan of length=radius emanating from one edge.
  const sizeWorld: [number, number] = [radius * 2, radius * 2];

  useFrame(({ clock }) => {
    const mat = matRef.current;
    if (!mat) return;
    const nowMs = clock.elapsedTime * 1000;
    if (startMsRef.current === null) startMsRef.current = nowMs;
    const elapsed = nowMs - startMsRef.current;

    let opacity: number;
    if (elapsed < SPAWN_MS) {
      // Phase 1 — fade in
      opacity = (elapsed / SPAWN_MS) * SPAWN_PEAK;
    } else if (elapsed < totalMs - LOCK_MS) {
      // Phase 2 — pulse
      const t = (elapsed - SPAWN_MS) / 1000; // seconds into pulse
      const wave = (Math.sin(t * Math.PI * 2 * PULSE_HZ) + 1) / 2; // 0..1
      opacity = PULSE_LO + (PULSE_HI - PULSE_LO) * wave;
    } else if (elapsed < totalMs) {
      // Phase 3 — lock solid
      opacity = 1.0;
    } else {
      // Done — fire onComplete once, freeze at 0 to avoid a flicker before unmount.
      opacity = 0;
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    }
    mat.opacity = opacity;
  });

  // Safety — if parent unmounts before useFrame ticks (e.g. combat closes mid-cast),
  // make sure onComplete is not called post-unmount (no setState-after-unmount warn).
  useEffect(() => {
    return () => {
      completedRef.current = true;
    };
  }, []);

  return (
    <FloorDecal
      position={position}
      size={sizeWorld}
      texture={SHAPE_TEXTURES[shape]}
      rotation={rotation}
      color={color}
      opacity={0}
      yOffset={0.02}
      renderOrder={renderOrder}
      materialRef={matRef}
    />
  );
}
