/**
 * Drum sparkle hint — rising particle ring around the quest drum.
 * Only mounted on first visit (questBoardTutorialSeen === false) to draw
 * the player's eye to the brazier as the quest board entry point.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 20;
const RADIUS = 0.6;
const RISE_BASE = 0.5;
const RISE_TOP = 2.0;
const RISE_SPEED = 0.3;

/** Deterministic ring layout — each particle gets a staggered Y so the rise
 *  reads as a continuous shimmer instead of a single ascending shell. */
function buildGeometry(): THREE.BufferGeometry {
  const arr = new Float32Array(COUNT * 3);
  const span = RISE_TOP - RISE_BASE;
  for (let i = 0; i < COUNT; i++) {
    const angle = (i / COUNT) * Math.PI * 2;
    arr[i * 3] = Math.cos(angle) * RADIUS;
    arr[i * 3 + 1] = RISE_BASE + (i / COUNT) * span;
    arr[i * 3 + 2] = Math.sin(angle) * RADIUS;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  return geo;
}

export function DrumSparkleHint() {
  const pointsRef = useRef<THREE.Points>(null);
  const geometry = useMemo(() => buildGeometry(), []);

  // Reduced-motion: skip the per-frame rise animation, keep static sparkles.
  const reducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useFrame((_, dt) => {
    if (reducedMotion || !pointsRef.current) return;
    const attr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      const y = arr[i * 3 + 1] + dt * RISE_SPEED;
      arr[i * 3 + 1] = y > RISE_TOP ? RISE_BASE : y;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.08}
        color="#ffcc66"
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
