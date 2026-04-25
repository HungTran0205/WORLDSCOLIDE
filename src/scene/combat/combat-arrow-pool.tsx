/**
 * CombatArrowPool — pool of 24 sprite-based arrow projectiles.
 *
 * Imperative `spawn(srcX, srcZ, tgtX, tgtZ)` fires an arrow that travels
 * in a straight line from source to target at ARROW_SPEED world units/sec,
 * rotated to match flight direction. `useFrame` interpolates position per
 * tick and despawns on arrival or MAX_LIFETIME.
 *
 * Pure VFX — damage is already resolved by the engine before this spawns.
 * Zero React re-renders during gameplay; all updates are direct mutations.
 *
 * Mirrors CombatSlashPool pattern (forwardRef + ring-buffer recycle).
 */

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const POOL_SIZE = 32;
/** World units / second. At ~5-unit range, travel ≈ 0.42s. */
const ARROW_SPEED = 12;
/**
 * Screen-space compression of the world Z axis under the tilted combat
 * camera (position ≈ [0, 8.4, 12], looking at origin). Camera pitch ≈ 35°
 * from horizontal, so world Z maps to screen Y scaled by sin(35°) ≈ 0.574.
 * Used to keep sprite `material.rotation` (which is screen-space) aligned
 * with the actual on-screen flight direction for diagonal shots.
 */
const Z_TILT_FACTOR = 0.574;
/** Hard cap to prevent stuck arrows if distance math goes sideways. */
const MAX_LIFETIME = 1.0;
/** Sprite scale in world units. Tune against character sprite size. */
const ARROW_SCALE = 0.4;
/** Lift above ground — aligns with scout bow/waist height. */
const Y_OFFSET = 0.55;
/**
 * Rotation offset baked in to align Arrow-001.png's native direction with
 * the world atan2 angle. Arrow-001 points +X (east) in texture space, but
 * the combat camera's orthographic tilt means screen-space rotation (which
 * is what SpriteMaterial.rotation uses) needs no additional yaw correction
 * at this camera angle. Tune here if sprite visually mis-aligns.
 */
const CAMERA_YAW_CORRECTION = 0;
/** Below slash (9999), above characters. Transparent sort key. */
const ARROW_RENDER_ORDER = 9998;
/** Fade starts at this fraction of flight — soft despawn. */
const FADE_START = 0.8;
/** Skip spawn if source and target are effectively on top of each other. */
const MIN_DISTANCE = 0.01;
/** Arrow texture path (public/). */
const ARROW_TEXTURE_URL = '/sprites/projectiles/arrows/Arrow-001.png';

export interface CombatArrowPoolHandle {
  spawn(srcX: number, srcZ: number, tgtX: number, tgtZ: number): void;
}

interface SlotMeta {
  active: boolean;
  elapsed: number;
  travelTime: number;
  srcX: number;
  srcZ: number;
  tgtX: number;
  tgtZ: number;
  order: number;
}

export const CombatArrowPool = forwardRef<CombatArrowPoolHandle>(
  function CombatArrowPool(_, ref) {
    const orderRef = useRef(0);

    // Load arrow texture once, shared across all 24 sprite materials.
    const texture = useMemo(() => {
      const tex = new THREE.TextureLoader().load(ARROW_TEXTURE_URL);
      // Pixel-art friendly filtering
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      return tex;
    }, []);

    const { pool, meta } = useMemo(() => {
      const sprites: THREE.Sprite[] = [];
      const slotMeta: SlotMeta[] = [];
      for (let i = 0; i < POOL_SIZE; i++) {
        const mat = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
        });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(ARROW_SCALE, ARROW_SCALE, 1);
        sprite.renderOrder = ARROW_RENDER_ORDER;
        sprite.visible = false;
        sprites.push(sprite);
        slotMeta.push({
          active: false,
          elapsed: 0,
          travelTime: 0,
          srcX: 0,
          srcZ: 0,
          tgtX: 0,
          tgtZ: 0,
          order: 0,
        });
      }
      return { pool: sprites, meta: slotMeta };
    }, [texture]);

    // Dispose texture and all sprite materials on unmount.
    useEffect(() => {
      return () => {
        for (const sprite of pool) {
          (sprite.material as THREE.SpriteMaterial).dispose();
        }
        texture.dispose();
      };
    }, [pool, texture]);

    useImperativeHandle(ref, () => ({
      spawn(srcX, srcZ, tgtX, tgtZ) {
        const dx = tgtX - srcX;
        const dz = tgtZ - srcZ;
        const dist = Math.hypot(dx, dz);
        if (dist < MIN_DISTANCE) return; // degenerate case

        // Prefer inactive slot; otherwise recycle the oldest.
        let slot = -1;
        for (let i = 0; i < meta.length; i++) {
          if (!meta[i].active) { slot = i; break; }
        }
        if (slot === -1) {
          slot = 0;
          for (let i = 1; i < meta.length; i++) {
            if (meta[i].order < meta[slot].order) slot = i;
          }
        }

        const travelTime = Math.min(dist / ARROW_SPEED, MAX_LIFETIME);
        const sprite = pool[slot];
        const mat = sprite.material as THREE.SpriteMaterial;

        sprite.position.set(srcX, Y_OFFSET, srcZ);
        // Screen-space angle: compress dz by Z_TILT_FACTOR so rotation matches
        // the projected flight vector on screen (not the raw world XZ angle).
        mat.rotation = Math.atan2(-dz * Z_TILT_FACTOR, dx) + CAMERA_YAW_CORRECTION;
        mat.opacity = 1;
        sprite.visible = true;

        const m = meta[slot];
        m.active = true;
        m.elapsed = 0;
        m.travelTime = travelTime;
        m.srcX = srcX;
        m.srcZ = srcZ;
        m.tgtX = tgtX;
        m.tgtZ = tgtZ;
        m.order = ++orderRef.current;
      },
    }), [pool, meta]);

    useFrame((_, delta) => {
      for (let i = 0; i < pool.length; i++) {
        const m = meta[i];
        if (!m.active) continue;

        m.elapsed += delta;
        const sprite = pool[i];
        const mat = sprite.material as THREE.SpriteMaterial;

        // Despawn when flight complete or safety cap hit.
        if (m.elapsed >= m.travelTime || m.elapsed >= MAX_LIFETIME) {
          sprite.visible = false;
          m.active = false;
          continue;
        }

        const t = m.elapsed / m.travelTime; // 0..1
        sprite.position.x = m.srcX + (m.tgtX - m.srcX) * t;
        sprite.position.z = m.srcZ + (m.tgtZ - m.srcZ) * t;

        // Soft fade in last stretch of flight.
        if (t > FADE_START) {
          mat.opacity = 1 - (t - FADE_START) / (1 - FADE_START);
        }
      }
    });

    return (
      <group>
        {pool.map((sprite, i) => (
          <primitive key={i} object={sprite} />
        ))}
      </group>
    );
  },
);
