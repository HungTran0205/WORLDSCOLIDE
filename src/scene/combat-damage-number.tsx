/**
 * Floating damage number — uses drei Text for readable numbers.
 * Billboard for correct camera-facing. Floats up and fades over 0.8s.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
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
  const elapsed = useRef(0);

  let color = '#ffffff';
  let prefix = '';
  let fontSize = 0.12;
  if (isCrit) { color = '#ffd700'; prefix = 'CRIT '; fontSize = 0.16; }
  if (isHeal) { color = '#2ecc71'; prefix = '+'; }
  if (isPoison) { color = '#9b59b6'; fontSize = 0.1; }

  const opacity = Math.max(0, 1 - elapsed.current / LIFETIME);

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (elapsed.current >= LIFETIME) {
      onExpired();
      return;
    }
    if (groupRef.current) {
      groupRef.current.position.y = 1.5 + elapsed.current * 1.5;
    }
  });

  return (
    <group ref={groupRef} position={[position.x, 1.5, position.z]}>
      <Billboard>
        <Text
          fontSize={fontSize}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.015}
          outlineColor="#000000"
          fillOpacity={opacity}
          outlineOpacity={opacity}
        >
          {prefix}{damage}
        </Text>
      </Billboard>
    </group>
  );
}
