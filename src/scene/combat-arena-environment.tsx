/**
 * HD-2D combat arena environment — layered parallax backgrounds,
 * pixel-art props, zone-aware lighting. All meshBasicMaterial for performance.
 */

import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { CombatTileGrid } from './combat-tile-grid';

/** Diagonal god-ray quad — gradient texture fades at edges, biome-tinted */
function LightShaft({ tint, opacity, angle }: { tint: string; opacity: number; angle: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4; canvas.height = 2;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 4, 0);
    g.addColorStop(0,   'transparent');
    g.addColorStop(0.3, tint);
    g.addColorStop(0.7, tint);
    g.addColorStop(1,   'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 2);
    return new THREE.CanvasTexture(canvas);
  }, [tint]);

  return (
    <mesh position={[0, 3, -4]} rotation={[0, 0, angle]}>
      <planeGeometry args={[2, 18]} />
      <meshBasicMaterial map={texture} transparent opacity={opacity} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}
import type { BiomeConfig, BgLayer, ArenaProp } from './arena-biome-config';
import { getBiomeConfig } from './arena-biome-config';
import { useArenaDebug } from './combat-arena-debug';
import { Environment3DModel, Prop3DLayer } from './combat-arena-3d-props';
import { ArenaAtmosphericVFX } from './arena-atmospheric-vfx';

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

/** Ground plane with tiled texture */
function TexturedGround({ src, size, tileSize }: { src: string; size: [number, number]; tileSize: number }) {
  const texture = useTexture(src);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(size[0] / tileSize, size[1] / tileSize);

  return (
    <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

/* ---------- main component ---------- */

interface Props {
  zone?: string;
}

export function CombatArenaEnvironment({ zone }: Props) {
  const config: BiomeConfig = useMemo(() => getBiomeConfig(zone), [zone]);
  const debug = useArenaDebug();

  /* Merge debug overrides onto config bg layers when in dev mode */
  const bgLayers: BgLayer[] = debug
    ? config.bgLayers.map((layer, i) => ({ ...layer, ...debug.bgLayers[i] }))
    : config.bgLayers;

  const groundTileSize = debug?.groundTileSize ?? 3;
  const is3D = Boolean(config.diorama) || Boolean(config.props3D?.length);
  const activeProps3D = debug?.props3D ?? config.props3D;
  const activeDioramaScale = debug?.dioramaScale ?? config.dioramaScale ?? 1;
  const activeDioramaY = debug?.dioramaY ?? config.dioramaY ?? 0;

  return (
    <group>
      {/* === GROUND === */}
      {config.tilePrimary ? (
        <CombatTileGrid
          width={64} depth={9}
          fadeRowsTop={1}
          tileSize={config.tileSize ?? 1}
          primarySrc={config.tilePrimary}
          accentSrc={config.tileAccent ?? config.tilePrimary}
          fogColor={config.fogColor}
        />
      ) : is3D ? (
        <Environment3DModel src={config.diorama!} scale={activeDioramaScale} positionY={activeDioramaY} />
      ) : config.groundTexture ? (
        <TexturedGround src={config.groundTexture} size={[64, 9]} tileSize={groundTileSize} />
      ) : (
        <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[64, 9]} />
          <meshBasicMaterial color={config.groundColor} />
        </mesh>
      )}

      {/* Parallax background layers (far → near) */}
      {bgLayers.map((layer, i) => (
        <BgLayerPlane key={i} layer={layer} />
      ))}

      {/* === PROPS === */}
      {is3D && activeProps3D && activeProps3D.length > 0 ? (
        <Prop3DLayer props3D={activeProps3D} sceneScale={activeDioramaScale} />
      ) : (
        config.props.map((prop, i) => <PropSprite key={i} prop={prop} />)
      )}

      {/* Foreground props — decorative, high Z (blurred by DoF) */}
      {config.foregroundProps?.map((prop, i) => <PropSprite key={`fg-${i}`} prop={prop} />)}

      {/* Atmospheric VFX placements (generated by Map Playground) */}
      {config.atmosphericVFX && config.atmosphericVFX.length > 0 && (
        <ArenaAtmosphericVFX placements={config.atmosphericVFX} />
      )}

      {/* Light shafts — forest: warm sun rays; cave: cool crystal glow */}
      {config.biome === 'forest' && <>
        <LightShaft tint="#ffe8a0" opacity={0.055} angle={0.28} />
        <LightShaft tint="#ffe8a0" opacity={0.035} angle={0.42} />
      </>}
      {config.biome === 'cave' && <>
        <LightShaft tint="#a0a0ff" opacity={0.06} angle={0.2} />
        <LightShaft tint="#8080d0" opacity={0.04} angle={-0.35} />
      </>}

      {/* === LIGHTING === */}
      <ambientLight intensity={debug?.lighting?.ambientIntensity ?? config.ambient.intensity} color={config.ambient.color} />
      {/* Directional with shadow — only when 3D content is present */}
      {is3D && (
        <directionalLight
          castShadow
          intensity={debug?.lighting?.directionalIntensity ?? config.directional.intensity}
          color={config.directional.color}
          position={config.directional.position}
          shadow-mapSize={[1024, 512]}
          shadow-camera-left={-13}
          shadow-camera-right={13}
          shadow-camera-top={7}
          shadow-camera-bottom={-7}
          shadow-camera-near={0.5}
          shadow-camera-far={30}
          shadow-bias={-0.001}
        />
      )}

    </group>
  );
}
