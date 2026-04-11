/**
 * Instanced HP Bars — renders ALL entity HP bars using 2 InstancedMesh:
 * 1. Background bars (dark, fixed width) — 1 draw call
 * 2. Fill bars (colored, scaled by HP ratio) — 1 draw call
 *
 * Uses MeshBasicMaterial (auto-converted to NodeMaterial on WebGPU).
 * Per-instance color is set via mesh.setColorAt() — works on both renderers.
 * Driven by AnimationStateBuffer — zero React re-renders.
 */

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  InstancedMesh,
  PlaneGeometry,
  MeshBasicMaterial,
  Matrix4,
  Quaternion,
  Vector3,
  Color,
} from 'three';
import type { AnimationStateBuffer } from './animation-state-buffer';

const MAX_BARS = 48;
const BAR_WIDTH = 0.6;
const BAR_HEIGHT = 0.06;
/** Y offset above entity position for HP bars */
const HP_BAR_Y_OFFSET = 1.85;

// Reusable temporaries
const _pos = new Vector3();
const _quat = new Quaternion();
const _scaleBg = new Vector3(1, 1, 1);
const _scaleFill = new Vector3();
const _mat = new Matrix4();
const _color = new Color();

interface InstancedHpBarsProps {
  stateBuffer: AnimationStateBuffer;
}

export function InstancedHpBars({ stateBuffer }: InstancedHpBarsProps) {
  const bgMeshRef = useRef<InstancedMesh>(null);
  const fillMeshRef = useRef<InstancedMesh>(null);
  const { camera } = useThree();

  const bgGeom = useMemo(() => new PlaneGeometry(BAR_WIDTH, BAR_HEIGHT), []);
  const fillGeom = useMemo(() => new PlaneGeometry(BAR_WIDTH, BAR_HEIGHT), []);

  const bgMat = useMemo(
    () => new MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      toneMapped: false,
    }),
    [],
  );

  const fillMat = useMemo(
    () => new MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
    [],
  );

  // Track if instanceColor has been initialized
  const colorInitialized = useRef(false);

  useFrame(() => {
    const bgMesh = bgMeshRef.current;
    const fillMesh = fillMeshRef.current;
    if (!bgMesh || !fillMesh) return;

    const count = stateBuffer.count;
    bgMesh.count = count;
    fillMesh.count = count;

    if (count === 0) return;

    // Initialize instanceColor on first use (setColorAt creates the buffer)
    if (!colorInitialized.current) {
      for (let i = 0; i < count; i++) {
        fillMesh.setColorAt(i, _color.set(0x2ecc71));
      }
      colorInitialized.current = true;
    }

    camera.getWorldQuaternion(_quat);

    for (let i = 0; i < count; i++) {
      const isAlive = stateBuffer.getIsAlive(i);
      const pos = stateBuffer.getCurrentPosition(i);
      const flyingOffset = stateBuffer.isFlying(i) ? 1.2 : 0;
      const hpRatio = stateBuffer.getHpRatio(i);

      // Position: above entity
      const yPos = isAlive ? HP_BAR_Y_OFFSET + flyingOffset : -10000;
      _pos.set(pos.x, yPos, pos.z);

      // Background bar: fixed size, centered
      _mat.compose(_pos, _quat, _scaleBg);
      bgMesh.setMatrixAt(i, _mat);

      // Fill bar: scaleX = hpRatio, offset X for left-aligned shrink
      const clampedRatio = Math.max(0.001, Math.min(1, hpRatio));
      const fillOffsetX = (clampedRatio - 1) * BAR_WIDTH * 0.5;
      _pos.x += fillOffsetX;
      _pos.z -= 0.001; // tiny Z offset to render fill in front of bg
      _scaleFill.set(clampedRatio, 1, 1);
      _mat.compose(_pos, _quat, _scaleFill);
      fillMesh.setMatrixAt(i, _mat);

      // Fill color based on HP ratio (green > 50%, yellow 25-50%, red < 25%)
      if (hpRatio > 0.5) {
        _color.set(0x2ecc71);
      } else if (hpRatio > 0.25) {
        _color.set(0xf1c40f);
      } else {
        _color.set(0xe74c3c);
      }
      fillMesh.setColorAt(i, _color);
    }

    bgMesh.instanceMatrix.needsUpdate = true;
    fillMesh.instanceMatrix.needsUpdate = true;
    if (fillMesh.instanceColor) {
      fillMesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={bgMeshRef} args={[bgGeom, bgMat, MAX_BARS]} frustumCulled={false} />
      <instancedMesh ref={fillMeshRef} args={[fillGeom, fillMat, MAX_BARS]} frustumCulled={false} />
    </group>
  );
}
