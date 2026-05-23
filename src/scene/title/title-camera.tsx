/**
 * Title-scene camera — locked perspective with idle Ken Burns-style drift.
 * Frame composes drum + masked figures in the left 60% of the viewport,
 * matching the user's mockup layout. Drift disabled under prefers-reduced-motion.
 */

import { PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import type { PerspectiveCamera as ThreePerspectiveCamera } from 'three';

const BASE_POSITION: [number, number, number] = [0, 1.2, 3.5];
const LOOK_AT: [number, number, number] = [0, 0.8, 0];
const FOV = 35;
const DRIFT_AMPLITUDE_X = 0.05;
const DRIFT_PERIOD_SEC = 8;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}

export function TitleCamera() {
  const cameraRef = useRef<ThreePerspectiveCamera>(null);
  const reducedMotion = usePrefersReducedMotion();

  useFrame((state) => {
    const cam = cameraRef.current;
    if (!cam) return;
    if (reducedMotion) {
      cam.position.x = BASE_POSITION[0];
    } else {
      const t = state.clock.elapsedTime;
      const sway = Math.sin((t / DRIFT_PERIOD_SEC) * Math.PI * 2) * DRIFT_AMPLITUDE_X;
      cam.position.x = BASE_POSITION[0] + sway;
    }
    cam.lookAt(LOOK_AT[0], LOOK_AT[1], LOOK_AT[2]);
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={BASE_POSITION}
      fov={FOV}
      near={0.1}
      far={50}
    />
  );
}
