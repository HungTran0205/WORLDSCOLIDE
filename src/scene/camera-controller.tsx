/**
 * Isometric camera controller — zoom/pan only, no rotation.
 * Animates smoothly toward `cameraTarget` from Zustand store on each frame.
 *
 * Two framing modes (driven by `cameraFocus`):
 *  - 'default'     : standard isometric offset for room navigation
 *  - 'quest-board' : tight offset zoomed onto the drum at the guild hall centre
 *                    (drives the diegetic quest board cinematic, Phase 3).
 */

import { useRef, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/game/state/store';

// Default isometric offset (initial camera [15,10,14] minus target [5,0,3.5])
const CAM_OFFSET_DEFAULT: [number, number, number] = [8, 5.5, 8.5];

// Quest-board focus: pulls the camera in to the drum and lowers eye-line for a
// cinematic close-up. Y kept above ground to avoid clipping the drum mesh.
const CAM_OFFSET_QUEST: [number, number, number] = [4, 5, 4.5];

const ARRIVE_THRESHOLD = 0.01;

/** Isometric camera — zoom/pan only, animates smoothly to cameraTarget from store */
export function CameraController() {
  const isBuildMode = useGameStore((s) => s.isBuildMode);
  const cameraTarget = useGameStore((s) => s.cameraTarget);
  const cameraFocus = useGameStore((s) => s.cameraFocus);
  const setCameraSettled = useGameStore((s) => s.setCameraSettled);
  const { camera, invalidate } = useThree();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const goalTarget = useRef(new THREE.Vector3(5, 0, 3.5));
  const goalPosition = useRef(new THREE.Vector3(13, 5.5, 12));

  // Sync goal vectors and kick first invalidation when target or focus changes
  useEffect(() => {
    const [tx, ty, tz] = cameraTarget;
    const [ox, oy, oz] = cameraFocus === 'quest-board' ? CAM_OFFSET_QUEST : CAM_OFFSET_DEFAULT;
    goalTarget.current.set(tx, ty, tz);
    goalPosition.current.set(tx + ox, oy, tz + oz);
    invalidate();
  }, [cameraTarget, cameraFocus, invalidate]);

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

  // Disable OrbitControls user input while the quest board is focused — the
  // panel owns the framing for the cinematic; user pan/zoom would fight the lerp.
  const userControlsEnabled = cameraFocus === 'default';

  return (
    <OrbitControls
      ref={controlsRef}
      enableRotate={false}
      enablePan={!isBuildMode && userControlsEnabled}
      enableZoom={userControlsEnabled}
      minZoom={140}
      maxZoom={160}
    />
  );
}
