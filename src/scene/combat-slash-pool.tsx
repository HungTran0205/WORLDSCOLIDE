/**
 * CombatSlashPool — pool of 16 pre-built MeshLine slash instances.
 * Imperative `spawn(x, z, facingRight)` positions a free slot and activates it.
 * `useFrame` fades opacity over LIFETIME and hides expired slots.
 *
 * Zero React re-renders during gameplay — all updates are direct mutations.
 */

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { MeshLine } from 'makio-meshline';
import { createSlashMeshline } from './combat-slash-meshline';

/**
 * Write to the live material opacity uniform. makio-meshline's fluent
 * `ml.opacity()` only touches an internal `uOpacity` uniform that the
 * shader never reads, so fading via that method is a silent no-op.
 * The shader reads `material.opacity.value` (a TSL uniform set in
 * `MeshLineNodeMaterial.buildLine`). Before build, the material field
 * doesn't exist — fall back to `_options.opacity` so the next build
 * picks up the value.
 */
function setSlashOpacity(ml: MeshLine, value: number): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mat = ml.material as any;
  // Before first build: mat.opacity is a plain number (base NodeMaterial default).
  // After buildLine: MeshLineNodeMaterial replaces it with a TSL uniform `{ value: number }`.
  // Only the uniform form is live-writable.
  const matOpacity = mat?.opacity;
  if (matOpacity && typeof matOpacity === 'object' && 'value' in matOpacity) {
    (matOpacity as { value: number }).value = value;
  }
  // Stash on _options so the next build picks it up (covers pre-build spawns).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opts = (ml as any)._options;
  if (opts) opts.opacity = value;
}

const POOL_SIZE = 16;
const LIFETIME = 0.25;
/**
 * Start fully opaque so the #ffffff slash peak pushes luminance to 1.0 —
 * comfortably above the bloom threshold (default 0.80). At 0.75 the slash
 * renders but never crosses the threshold → no glow.
 */
const BASE_OPACITY = 1.0;
/**
 * Lift the slash above the character hitbox so it never overlaps the
 * sprite's opaque pixels in 2D screen-space (combat camera is orthographic
 * tilted ~35°, so +Y in world maps to "upward" on screen).
 */
const Y_OFFSET = 1.4;
const HAND_OFFSET = 0.5;
const ROT_TILT_X = Math.PI / 8;
/** Very high so transparent sort puts the slash last in the render queue. */
const SLASH_RENDER_ORDER = 9999;

export interface CombatSlashPoolHandle {
  spawn(x: number, z: number, facingRight: boolean): void;
}

interface SlotMeta {
  active: boolean;
  elapsed: number;
  order: number;
}

export const CombatSlashPool = forwardRef<CombatSlashPoolHandle>(
  function CombatSlashPool(_, ref) {
    const orderRef = useRef(0);
    // makio-meshline uses WebGPU-only TSL NodeMaterial — the generated shader
    // is invalid on the WebGL fallback renderer and crashes program compilation
    // in three.js `resolveIncludes`. Skip instantiation entirely when WebGL.
    const gl = useThree(s => s.gl);
    const isWebGPU = 'isWebGPURenderer' in gl;

    const { pool, meta } = useMemo(() => {
      const instances: MeshLine[] = [];
      const slotMeta: SlotMeta[] = [];
      if (!isWebGPU) return { pool: instances, meta: slotMeta };
      for (let i = 0; i < POOL_SIZE; i++) {
        const ml = createSlashMeshline();
        ml.visible = false;
        ml.renderOrder = SLASH_RENDER_ORDER;
        instances.push(ml);
        slotMeta.push({ active: false, elapsed: 0, order: 0 });
      }
      return { pool: instances, meta: slotMeta };
    }, [isWebGPU]);

    // Re-apply renderOrder post-mount (makio-meshline's lazy build can reset
    // it on first render) + dispose geometry/material on unmount.
    useEffect(() => {
      for (const ml of pool) ml.renderOrder = SLASH_RENDER_ORDER;
      return () => {
        for (const ml of pool) {
          ml.geometry?.dispose?.();
          const m = ml.material as unknown as { dispose?: () => void };
          m?.dispose?.();
        }
      };
    }, [pool]);

    useImperativeHandle(ref, () => ({
      spawn(x, z, facingRight) {
        // Pool empty on WebGL fallback — spawn is a no-op.
        if (pool.length === 0) return;
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

        const ml = pool[slot];
        ml.position.set(x + (facingRight ? HAND_OFFSET : -HAND_OFFSET), Y_OFFSET, z);
        ml.scale.set(facingRight ? 1 : -1, 1, 1);
        ml.rotation.set(ROT_TILT_X, 0, 0);
        setSlashOpacity(ml, BASE_OPACITY);
        ml.visible = true;

        meta[slot].active = true;
        meta[slot].elapsed = 0;
        meta[slot].order = ++orderRef.current;
      },
    }), [pool, meta]);

    useFrame((_, delta) => {
      for (let i = 0; i < pool.length; i++) {
        const m = meta[i];
        if (!m.active) continue;
        m.elapsed += delta;
        const t = m.elapsed / LIFETIME;
        const ml = pool[i];
        if (t >= 1) {
          ml.visible = false;
          m.active = false;
        } else {
          setSlashOpacity(ml, BASE_OPACITY * (1 - t));
        }
      }
    });

    return (
      <group>
        {pool.map((ml, i) => (
          <primitive key={i} object={ml} />
        ))}
      </group>
    );
  },
);
