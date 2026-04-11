/**
 * Combat Text Layer — canvas-texture sprite name labels.
 * Uses CanvasTexture + SpriteMaterial instead of troika SDF text
 * for WebGPU compatibility. Pre-allocates max slots, dynamically
 * shows/hides as entities are added (wave transitions).
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Sprite as SpriteType } from 'three';
import type { AnimationStateBuffer } from './animation-state-buffer';

/** Y offset above entity for name label */
const NAME_Y_OFFSET = 2.0;
/** World-space height of each label sprite */
const LABEL_SCALE_Y = 0.18;
/** Max pre-allocated label slots (matches AnimationStateBuffer max) */
const MAX_LABELS = 48;
/** Fixed canvas size to avoid WebGPU texture resize errors */
const LABEL_CANVAS_W = 256;
const LABEL_CANVAS_H = 48;

/** Render a name label to a fixed-size canvas and return CanvasTexture + aspect ratio */
function createNameTexture(name: string, color: string): { texture: THREE.CanvasTexture; aspect: number } {
  const canvas = document.createElement('canvas');
  canvas.width = LABEL_CANVAS_W;
  canvas.height = LABEL_CANVAS_H;
  const ctx = canvas.getContext('2d')!;
  const fontSize = 32;
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.clearRect(0, 0, LABEL_CANVAS_W, LABEL_CANVAS_H);
  // Outline
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  const textX = (LABEL_CANVAS_W - ctx.measureText(name).width) / 2;
  ctx.strokeText(name, textX, fontSize + 4);
  // Fill
  ctx.fillStyle = color;
  ctx.fillText(name, textX, fontSize + 4);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return { texture, aspect: LABEL_CANVAS_W / LABEL_CANVAS_H };
}

interface CombatTextLayerProps {
  stateBuffer: AnimationStateBuffer;
}

/**
 * Renders entity name labels as canvas-texture sprites.
 * Checks stateBuffer.count each frame to auto-detect new entities (wave spawns).
 */
export function CombatTextLayer({ stateBuffer }: CombatTextLayerProps) {
  const spriteRefs = useRef<(SpriteType | null)[]>([]);
  /** How many entities we've already created textures for */
  const processedCount = useRef(0);

  useFrame(() => {
    const count = stateBuffer.count;

    // Create textures for newly added entities (wave transitions)
    if (count > processedCount.current) {
      for (let i = processedCount.current; i < count; i++) {
        const sprite = spriteRefs.current[i];
        if (!sprite) continue;

        const name = stateBuffer.getEntityName(i);
        const isAlly = stateBuffer.isAlly(i);
        const color = isAlly ? '#67b8e3' : '#e74c3c';
        const { texture, aspect } = createNameTexture(name, color);

        const mat = sprite.material as THREE.SpriteMaterial;
        if (mat.map) mat.map.dispose();
        mat.map = texture;
        mat.needsUpdate = true;
        sprite.scale.set(LABEL_SCALE_Y * aspect, LABEL_SCALE_Y, 1);
      }
      processedCount.current = count;
    }

    // Update positions for all active labels
    for (let i = 0; i < count; i++) {
      const sprite = spriteRefs.current[i];
      if (!sprite) continue;

      const isAlive = stateBuffer.getIsAlive(i);
      const pos = stateBuffer.getCurrentPosition(i);
      const flyingOffset = stateBuffer.isFlying(i) ? 1.2 : 0;

      sprite.visible = true;
      sprite.position.set(
        pos.x,
        isAlive ? NAME_Y_OFFSET + flyingOffset : -10000,
        pos.z,
      );
    }
  });

  return (
    <group>
      {Array.from({ length: MAX_LABELS }, (_, i) => (
        <sprite
          key={`name-${i}`}
          ref={(el) => { spriteRefs.current[i] = el; }}
          visible={false}
        >
          <spriteMaterial transparent depthTest={false} />
        </sprite>
      ))}
    </group>
  );
}
