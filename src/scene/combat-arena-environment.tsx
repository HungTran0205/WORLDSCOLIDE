/**
 * HD-2D combat arena environment — layered parallax backgrounds,
 * pixel-art props, zone-aware lighting. All meshBasicMaterial for performance.
 */

import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { BiomeConfig, BgLayer, ArenaProp } from './arena-biome-config';
import { getBiomeConfig } from './arena-biome-config';

/* ---------- sub-components ---------- */

/** Single parallax background layer as a textured billboard */
function BgLayerPlane({ layer }: { layer: BgLayer }) {
  const texture = useTexture(layer.src);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  const aspect = texture.image
    ? (texture.image as HTMLImageElement).width / (texture.image as HTMLImageElement).height
    : 2;
  const width = layer.scale * aspect * 10;
  const height = layer.scale * 10;

  return (
    <mesh position={[0, layer.y, layer.z]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={layer.opacity}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/** Single prop billboard sprite */
function PropSprite({ prop }: { prop: ArenaProp }) {
  const texture = useTexture(prop.src);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  const aspect = texture.image
    ? (texture.image as HTMLImageElement).width / (texture.image as HTMLImageElement).height
    : 1;
  const height = prop.scale * 2;
  const width = height * aspect;

  return (
    <mesh position={prop.position}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ---------- main component ---------- */

interface Props {
  zone?: string;
}

export function CombatArenaEnvironment({ zone }: Props) {
  const config: BiomeConfig = useMemo(() => getBiomeConfig(zone), [zone]);

  return (
    <group>
      {/* Ground plane — meshBasicMaterial, no PBR cost */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[22, 12]} />
        <meshBasicMaterial color={config.groundColor} />
      </mesh>

      {/* Side zone indicators (subtle tint) */}
      <mesh position={[-5, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 8]} />
        <meshBasicMaterial color="#3366aa" transparent opacity={0.08} />
      </mesh>
      <mesh position={[5, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 8]} />
        <meshBasicMaterial color="#aa3333" transparent opacity={0.08} />
      </mesh>

      {/* Center line — clash zone */}
      <mesh position={[0, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.04, 10]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
      </mesh>

      {/* Parallax background layers (far → near) */}
      {config.bgLayers.map((layer, i) => (
        <BgLayerPlane key={i} layer={layer} />
      ))}

      {/* Decorative props */}
      {config.props.map((prop, i) => (
        <PropSprite key={i} prop={prop} />
      ))}

      {/* Single ambient light — enough for meshBasicMaterial scene */}
      <ambientLight intensity={1} />
    </group>
  );
}
