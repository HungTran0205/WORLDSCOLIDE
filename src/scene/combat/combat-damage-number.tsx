/**
 * Floating damage number — uses drei Text for readable numbers.
 * Billboard for correct camera-facing. Floats up and fades over 0.8s.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Html } from '@react-three/drei';
import type { Group } from 'three';

interface DamageNumberProps {
  position: { x: number; z: number };
  damage: number;
  isCrit?: boolean;
  isHeal?: boolean;
  isPoison?: boolean;
  onExpired: () => void;
}

const LIFETIME = 0.8;

export function DamageNumber({ position, damage, isCrit, isHeal, isPoison, onExpired }: DamageNumberProps) {
  const groupRef = useRef<Group>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const elapsed = useRef(0);

  let color = '#ffffff';
  let prefix = '';
  let fontSize = '12px';
  if (isCrit) { color = '#ffd700'; prefix = 'CRIT '; fontSize = '16px'; }
  if (isHeal) { color = '#2ecc71'; prefix = '+'; }
  if (isPoison) { color = '#9b59b6'; fontSize = '10px'; }

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (elapsed.current >= LIFETIME) {
      onExpired();
      return;
    }
    if (groupRef.current) {
      groupRef.current.position.y = 1.5 + elapsed.current * 1.5;
    }
    // Animate opacity directly on DOM element — avoids React re-render per frame
    if (spanRef.current) {
      spanRef.current.style.opacity = String(Math.max(0, 1 - elapsed.current / LIFETIME));
    }
  });

  return (
    <group ref={groupRef} position={[position.x, 1.5, position.z]}>
      <Billboard>
        <Html center>
          <span
            ref={spanRef as React.RefObject<HTMLSpanElement>}
            style={{ color, fontSize, whiteSpace: 'nowrap', textShadow: '1px 1px 2px #000', fontWeight: isCrit ? 'bold' : 'normal' }}
          >
            {prefix}{damage}
          </span>
        </Html>
      </Billboard>
    </group>
  );
}
