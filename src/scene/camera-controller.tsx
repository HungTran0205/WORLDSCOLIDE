/**
 * Isometric camera controller — zoom/pan only, no rotation.
 * Animates smoothly toward `cameraTarget` from Zustand store on each frame.
 */

import { useRef, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/game/state/store';

// Fixed camera offset derived from initial position=[15,10,14] minus target=[5,0,3.5]
const CAM_OFFSET_X = 10;
const CAM_OFFSET_Y = 10;
const CAM_OFFSET_Z = 10.5;
const ARRIVE_THRESHOLD = 0.01;

/** Isometric camera — zoom/pan only, animates smoothly to cameraTarget from store */
export function CameraController() {
  const isBuildMode = useGameStore((s) => s.isBuildMode);
  const cameraTarget = useGameStore((s) => s.cameraTarget);
  const setCameraSettled = useGameStore((s) => s.setCameraSettled);
  const { camera, invalidate } = useThree();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const goalTarget = useRef(new THREE.Vector3(5, 0, 3.5));
  const goalPosition = useRef(new THREE.Vector3(15, 10, 14));

  // Sync goal vectors and kick first invalidation when target changes
  useEffect(() => {
    const [tx, ty, tz] = cameraTarget;
    goalTarget.current.set(tx, ty, tz);
    goalPosition.current.set(tx + CAM_OFFSET_X, CAM_OFFSET_Y, tz + CAM_OFFSET_Z);
    invalidate();
  }, [cameraTarget, invalidate]);

  useFrame((_state, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const distTarget = controls.target.distanceTo(goalTarget.current);
    const distCamera = camera.position.distanceTo(goalPosition.current);

    // Stop lerping when arrived — demand frameloop won't fire unless invalidated
    if (distTarget < ARRIVE_THRESHOLD && distCamera < ARRIVE_THRESHOLD) {
      if (distTarget > 0 || distCamera > 0) {
        controls.target.copy(goalTarget.current);
        camera.position.copy(goalPosition.current);
        controls.update();
        invalidate();
      }
      setCameraSettled(true);
      return;
    }

    // Frame-rate independent lerp using delta time to fix lag/stutter
    const dt = Math.min(delta, 0.1); // Clamp delta to max 100ms
    const step = 1 - Math.exp(-5 * dt); // Equivalent to 0.08 at 60fps

    controls.target.lerp(goalTarget.current, step);
    camera.position.lerp(goalPosition.current, step);
    controls.update();
    invalidate();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableRotate={false}
      enablePan={!isBuildMode}
      enableZoom={true}
      minZoom={40}
      maxZoom={150}
    />
  );
}
