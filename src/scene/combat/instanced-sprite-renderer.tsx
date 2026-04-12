/**
 * InstancedSpriteRenderer — renders ALL combat entity sprites in 1 draw call.
 * Single useFrame callback handles all animation, position lerp, and billboard.
 *
 * Receives:
 * - atlasTextures from MegaAtlasBuilder (Phase 01)
 * - registry from SpriteRegistry (Phase 01)
 * - stateBuffer from AnimationStateBuffer (Phase 04 bridge)
 */

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  InstancedMesh,
  PlaneGeometry,
  Matrix4,
  Quaternion,
  Vector3,
  MeshBasicMaterial,
  type CanvasTexture,
  type Material,
} from 'three';
import { createSpriteMaterial, createSpriteInstanceAttributes } from './sprite-material';
import type { SpriteRegistry } from './sprite-registry';
import type { AnimationStateBuffer } from './animation-state-buffer';
import { ANIM_STATE } from './animation-state-buffer';

/** Max instances — 48 entities + buffer */
const MAX_INSTANCES = 48;

// Reusable temporaries to avoid per-frame allocation
const _pos = new Vector3();
const _quat = new Quaternion();
const _scale = new Vector3();
const _mat = new Matrix4();

/** Map anim state enum to the animation name used in the atlas registry */
function animStateToAtlasAnim(state: number, isEnemy: boolean): string {
  switch (state) {
    case ANIM_STATE.walking: return 'walk';
    case ANIM_STATE.attacking: return 'attack';
    case ANIM_STATE.skill: return 'attack'; // skill reuses attack sprites
    case ANIM_STATE.dead: return isEnemy ? 'death' : 'walk';
    case ANIM_STATE.hit: return 'walk'; // hit uses walk frame 0
    case ANIM_STATE.idle:
    default: return 'walk'; // idle = walk frame 0
  }
}

interface InstancedSpriteRendererProps {
  stateBuffer: AnimationStateBuffer;
  registry: SpriteRegistry;
  atlasTextures: CanvasTexture[];
}

export function InstancedSpriteRenderer({
  stateBuffer,
  registry,
  atlasTextures,
}: InstancedSpriteRendererProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const { camera, gl } = useThree();

  // Create geometry (unit plane)
  const geometry = useMemo(() => new PlaneGeometry(1, 1), []);

  // Placeholder material (invisible) until async material is ready
  const placeholderMat = useMemo(
    () => new MeshBasicMaterial({ visible: false }),
    [],
  );

  // Async material state: created once atlas + renderer are available
  const [material, setMaterial] = useState<Material>(placeholderMat);

  useEffect(() => {
    if (atlasTextures.length === 0) return;
    let cancelled = false;

    createSpriteMaterial(atlasTextures[0], gl).then((mat) => {
      if (!cancelled) setMaterial(mat);
    });

    return () => { cancelled = true; };
  }, [atlasTextures, gl]);

  // Create instanced attributes
  const attrs = useMemo(() => createSpriteInstanceAttributes(MAX_INSTANCES), []);

  // Attach attributes to geometry
  useEffect(() => {
    geometry.setAttribute('aUvRect', attrs.uvRectAttr);
    geometry.setAttribute('aOpacity', attrs.opacityAttr);
    geometry.setAttribute('aTint', attrs.tintAttr);

    return () => {
      geometry.deleteAttribute('aUvRect');
      geometry.deleteAttribute('aOpacity');
      geometry.deleteAttribute('aTint');
    };
  }, [geometry, attrs]);

  // Single useFrame for ALL sprite animation
  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh || atlasTextures.length === 0 || material === placeholderMat) {
      // Prevent rendering with default MAX_INSTANCES count before data is ready
      if (mesh) mesh.count = 0;
      return;
    }

    const activeCount = stateBuffer.count;

    // Always render MAX_INSTANCES — WebGPU doesn't handle dynamic count changes well.
    // Unused slots are hidden via opacity=0 + position at -10000.
    mesh.count = MAX_INSTANCES;

    if (activeCount === 0) return;

    // Advance all animation timers
    stateBuffer.advanceAll(delta);

    // Extract camera quaternion for billboard (same for all instances)
    camera.getWorldQuaternion(_quat);

    // Process active entities
    for (let i = 0; i < activeCount; i++) {
      const isAlive = stateBuffer.getIsAlive(i);
      const animState = stateBuffer.getAnimState(i);

      // --- Scale (read first; needed for ground anchor below) ---
      const scale = stateBuffer.getScale(i);

      // --- Position ---
      // Sprite art is bottom-anchored in atlas cells, so quad bottom = visual feet.
      // PlaneGeometry(1,1) is centered → shift up by scaleY/2 to put feet on ground (Y=0).
      const pos = stateBuffer.getCurrentPosition(i);
      const flyingOffset = stateBuffer.isFlying(i) ? 1.2 : 0;
      _pos.set(pos.x, scale.y * 0.5 + flyingOffset, pos.z);
      const facingRight = stateBuffer.isFacingRight(i);
      const isEnemy = !stateBuffer.isAlly(i);

      // For characters: flip for west direction (negative X scale)
      // For enemies: sprites are west-facing, flip for east (facingRight)
      let sx = scale.x;
      if (isEnemy) {
        sx = facingRight ? -scale.x : scale.x;
      } else {
        sx = facingRight ? scale.x : -scale.x;
      }
      _scale.set(sx, scale.y, 1);

      // --- Death fade-out ---
      let opacity = 1;
      if (!isAlive && animState === ANIM_STATE.dead) {
        const deathElapsed = stateBuffer.getDeathElapsed(i);
        // Death anim plays ~1s (8 frames at 8fps), then fade out over 0.5s
        const DEATH_ANIM_DURATION = 1.0;
        const FADE_DURATION = 0.5;
        if (deathElapsed > DEATH_ANIM_DURATION) {
          const fadeProgress = Math.min(1, (deathElapsed - DEATH_ANIM_DURATION) / FADE_DURATION);
          opacity = 1 - fadeProgress;
          if (fadeProgress >= 1) _pos.y = -10000;
        }
      } else if (!isAlive) {
        // Dead but no death animation — hide immediately
        _pos.y = -10000;
        opacity = 0;
      }

      // --- Compose matrix: position + billboard rotation + scale ---
      _mat.compose(_pos, _quat, _scale);
      mesh.setMatrixAt(i, _mat);

      // --- UV from atlas registry ---
      const typeId = stateBuffer.getTypeId(i);
      const frameIndex = stateBuffer.getFrameIndex(i);
      const atlasAnim = animStateToAtlasAnim(animState, isEnemy);
      const uv = registry.getFrameUV(typeId, atlasAnim, frameIndex);

      if (uv) {
        const base4 = i * 4;
        attrs.uvRectArray[base4 + 0] = uv.u;
        attrs.uvRectArray[base4 + 1] = uv.v;
        attrs.uvRectArray[base4 + 2] = uv.w;
        attrs.uvRectArray[base4 + 3] = uv.h;
      }

      // --- Opacity ---
      attrs.opacityArray[i] = opacity;

      // --- Tint (hit flash) ---
      const tint = stateBuffer.getTint(i);
      const base3 = i * 3;
      attrs.tintArray[base3 + 0] = tint.r;
      attrs.tintArray[base3 + 1] = tint.g;
      attrs.tintArray[base3 + 2] = tint.b;
    }

    // Hide unused slots — push off-screen with zero opacity
    for (let i = activeCount; i < MAX_INSTANCES; i++) {
      _pos.set(0, -10000, 0);
      _scale.set(0, 0, 0);
      _mat.compose(_pos, _quat, _scale);
      mesh.setMatrixAt(i, _mat);
      attrs.opacityArray[i] = 0;
    }

    // Batch update all attributes
    mesh.instanceMatrix.needsUpdate = true;
    attrs.uvRectAttr.needsUpdate = true;
    attrs.opacityAttr.needsUpdate = true;
    attrs.tintAttr.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, MAX_INSTANCES]}
      frustumCulled={false}
    />
  );
}
