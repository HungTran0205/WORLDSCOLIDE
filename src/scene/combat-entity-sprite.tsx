/**
 * Sprite for one combat entity — character sprite + HP bar + team indicator.
 * Uses Billboard for correct camera-facing (no distortion).
 * With sprite atlas, Billboard cost is negligible (just quaternion copy/frame).
 * No troika Text, no Html — pure mesh UI.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import type { Group, Mesh, MeshBasicMaterial } from 'three';
import { CombatCharacterAnimator } from './combat-character-animator';
import type { CombatAnimState } from './combat-character-animator';
import { EnemySpriteAnimator } from './enemy-sprite-animator';
import { getSpritePath } from './sprite-path-resolver';
import type { SpriteDirection } from './sprite-path-resolver';
import type { ArenaEntitySnapshot } from '@/game/state/combat-arena-slice';

/**
 * WebGL HP bar — background + fill plane.
 * Fill uses scale.x instead of recreating geometry.
 */
function HpBar({ ratio }: { ratio: number }) {
  const fillRef = useRef<Mesh>(null);
  const fillMatRef = useRef<MeshBasicMaterial>(null);
  const clampedRatio = Math.max(0.001, Math.min(1, ratio));
  const barWidth = 0.6;
  const barHeight = 0.06;

  if (fillRef.current) {
    fillRef.current.scale.x = clampedRatio;
    fillRef.current.position.x = (clampedRatio - 1) * barWidth * 0.5;
  }
  if (fillMatRef.current) {
    const color = clampedRatio > 0.5 ? '#2ecc71' : clampedRatio > 0.25 ? '#f1c40f' : '#e74c3c';
    fillMatRef.current.color.set(color);
  }

  return (
    <group>
      <mesh>
        <planeGeometry args={[barWidth, barHeight]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.6} />
      </mesh>
      <mesh ref={fillRef} position={[0, 0, 0.001]}>
        <planeGeometry args={[barWidth, barHeight]} />
        <meshBasicMaterial ref={fillMatRef} color="#2ecc71" />
      </mesh>
    </group>
  );
}

/** Entity name label — ally blue, enemy red */
function EntityName({ name, isAlly }: { name: string; isAlly: boolean }) {
  return (
    <Text
      fontSize={0.09}
      color={isAlly ? '#67b8e3' : '#e74c3c'}
      anchorX="center"
      anchorY="bottom"
      outlineWidth={0.01}
      outlineColor="#000000"
    >
      {name}
    </Text>
  );
}

interface CombatEntitySpriteProps {
  entity: ArenaEntitySnapshot;
}

export function CombatEntitySprite({ entity }: CombatEntitySpriteProps) {
  const groupRef = useRef<Group>(null);
  const directionRef = useRef<SpriteDirection>('south');
  const animStateRef = useRef<CombatAnimState>('idle');

  directionRef.current = entity.facingRight ? 'east' : 'west';
  animStateRef.current = entity.animState as CombatAnimState;

  const targetPos = useRef({ x: entity.position.x, z: entity.position.z });
  targetPos.current = { x: entity.position.x, z: entity.position.z };

  useFrame(() => {
    if (!groupRef.current) return;
    const f = 0.15;
    groupRef.current.position.x += (targetPos.current.x - groupRef.current.position.x) * f;
    groupRef.current.position.z += (targetPos.current.z - groupRef.current.position.z) * f;
  });

  const basePath = useMemo(() => {
    if (entity.isAlly && entity.civilization && entity.archetype) {
      return getSpritePath(entity.civilization, entity.archetype, entity.gender ?? 'M');
    }
    if (entity.spriteId) return null;
    return '/sprites/characters/TS-WARRIOR-M';
  }, [entity.isAlly, entity.civilization, entity.archetype, entity.gender, entity.spriteId]);

  const isDead = entity.animState === 'dead' || entity.currentHp <= 0;
  if (isDead && !entity.spriteId) return null;

  const hpRatio = entity.currentHp / entity.maxHp;

  return (
    <group ref={groupRef} position={[entity.position.x, 0, entity.position.z]}>
      {/* Single Billboard — correct camera-facing, no distortion */}
      <Billboard follow lockX={false} lockY={false} lockZ={false} position={[0, 1.05, 0]}>
        {entity.spriteId ? (
          <EnemySpriteAnimator
            spriteId={entity.spriteId}
            animStateRef={animStateRef}
            facingRight={entity.facingRight}
            size={[2.1, 2.1]}
          />
        ) : (
          <CombatCharacterAnimator
            basePath={basePath!}
            directionRef={directionRef}
            animStateRef={animStateRef}
            size={[2.1, 2.1]}
          />
        )}

        {/* Entity name + HP bar */}
        <group position={[0, 1.3, 0]}>
          <EntityName name={entity.name} isAlly={entity.isAlly} />
        </group>
        <group position={[0, 1.2, 0]}>
          <HpBar ratio={hpRatio} />
        </group>
      </Billboard>
    </group>
  );
}
