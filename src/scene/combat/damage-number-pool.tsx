/**
 * DamageNumberPool — pooled canvas-texture sprites for floating damage numbers.
 * Pre-allocated pool of 32 slots, recycled on expiry.
 * Uses CanvasTexture + SpriteMaterial for WebGPU compatibility
 * (troika SDF text uses custom GLSL that doesn't work on WebGPU).
 *
 * Exposed via forwardRef + useImperativeHandle for imperative spawning.
 */

import { forwardRef, useImperativeHandle, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Sprite as SpriteType } from 'three';

const POOL_SIZE = 32;
const LIFETIME = 0.8; // seconds
const FLOAT_SPEED = 1.5; // units/sec
const LABEL_SCALE_Y = 0.30;
const CRIT_SCALE_Y = 0.45;

export interface DamageNumberSpawnParams {
  position: { x: number; z: number };
  damage: number;
  isCrit?: boolean;
  isHeal?: boolean;
  isPoison?: boolean;
}

/** Handle exposed via ref for imperative spawning */
export interface DamageNumberPoolHandle {
  spawn(params: DamageNumberSpawnParams): void;
}

/** Internal slot state */
interface PoolSlot {
  active: boolean;
  elapsed: number;
  startY: number;
}

/** Fixed canvas size to avoid WebGPU texture resize errors */
const DMG_CANVAS_W = 160;
const DMG_CANVAS_H = 48;

/** Render damage text onto a fixed-size pre-allocated canvas */
function renderDamageCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  color: string,
  isCrit: boolean,
): void {
  const ctx = canvas.getContext('2d')!;
  const fontSize = isCrit ? 44 : 34;
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.clearRect(0, 0, DMG_CANVAS_W, DMG_CANVAS_H);
  // Outline
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  const textX = (DMG_CANVAS_W - ctx.measureText(text).width) / 2;
  ctx.strokeText(text, textX, fontSize + 4);
  // Fill
  ctx.fillStyle = color;
  ctx.fillText(text, textX, fontSize + 4);
}

export const DamageNumberPool = forwardRef<DamageNumberPoolHandle>(
  function DamageNumberPool(_, ref) {
    const spriteRefs = useRef<(SpriteType | null)[]>([]);
    const slots = useRef<PoolSlot[]>(
      Array.from({ length: POOL_SIZE }, () => ({
        active: false,
        elapsed: 0,
        startY: 0,
      })),
    );
    const nextSlot = useRef(0);

    // Pre-allocate canvases and textures — reused across spawns
    const pool = useMemo(() => {
      return Array.from({ length: POOL_SIZE }, () => {
        const canvas = document.createElement('canvas');
        canvas.width = DMG_CANVAS_W;
        canvas.height = DMG_CANVAS_H;
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        return { canvas, texture };
      });
    }, []);

    useImperativeHandle(ref, () => ({
      spawn(params: DamageNumberSpawnParams) {
        const idx = nextSlot.current;
        nextSlot.current = (nextSlot.current + 1) % POOL_SIZE;

        const slot = slots.current[idx];
        slot.active = true;
        slot.elapsed = 0;
        slot.startY = 1.5;

        // Determine text, color
        let prefix = '';
        let color = '#ffffff';
        let isCrit = false;
        if (params.isCrit) { prefix = 'CRIT '; color = '#ffd700'; isCrit = true; }
        if (params.isHeal) { prefix = '+'; color = '#2ecc71'; }
        if (params.isPoison) { color = '#9b59b6'; }

        const text = `${prefix}${params.damage}`;
        const { canvas, texture } = pool[idx];
        renderDamageCanvas(canvas, text, color, isCrit);
        texture.needsUpdate = true;

        const aspect = DMG_CANVAS_W / DMG_CANVAS_H;
        const sy = isCrit ? CRIT_SCALE_Y : LABEL_SCALE_Y;
        const sprite = spriteRefs.current[idx];
        if (sprite) {
          const offsetX = (Math.random() - 0.5) * 0.5;
          sprite.position.set(params.position.x + offsetX, slot.startY, params.position.z);
          sprite.scale.set(sy * aspect, sy, 1);
          sprite.visible = true;
          (sprite.material as THREE.SpriteMaterial).opacity = 1;
        }
      },
    }));

    useFrame((_, delta) => {
      for (let i = 0; i < POOL_SIZE; i++) {
        const slot = slots.current[i];
        if (!slot.active) continue;

        slot.elapsed += delta;

        if (slot.elapsed >= LIFETIME) {
          slot.active = false;
          const sprite = spriteRefs.current[i];
          if (sprite) sprite.visible = false;
          continue;
        }

        // Float up + fade out
        const sprite = spriteRefs.current[i];
        if (sprite) {
          sprite.position.y = slot.startY + slot.elapsed * FLOAT_SPEED;
          (sprite.material as THREE.SpriteMaterial).opacity = Math.max(0, 1 - slot.elapsed / LIFETIME);
        }
      }
    });

    return (
      <group>
        {pool.map((p, i) => (
          <sprite
            key={`dmg-${i}`}
            ref={(el) => { spriteRefs.current[i] = el; }}
            visible={false}
          >
            <spriteMaterial map={p.texture} transparent depthTest={false} />
          </sprite>
        ))}
      </group>
    );
  },
);
