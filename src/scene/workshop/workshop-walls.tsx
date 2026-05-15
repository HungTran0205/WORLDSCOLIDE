/**
 * Workshop walls — back + left wall with tiled stone-64 texture.
 * Replaces flat color boxes for a stone-mason vibe matching the forge theme.
 */

import { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import {
  TextureLoader,
  NearestFilter,
  NearestMipmapNearestFilter,
  RepeatWrapping,
  SRGBColorSpace,
  PlaneGeometry,
  BufferAttribute,
  AdditiveBlending,
  DoubleSide,
  type Texture,
} from 'three';

const ROOM_SIZE = 7;
const WALL_HEIGHT = 3;
const WALL_THICKNESS = 0.2;
const STONE_TEX = '/tiles/2d/64px/stone-64_0001.png';
const WINDOW_TEX = '/walls/workshop-window-cracked-stone.png';
/** World units per stone tile cell. Larger = fewer repetitions = bigger blocks. */
const TILE_WORLD_SIZE = 1.5;
/** Window pane size in world units (matches generated 128×128 aspect). */
const WINDOW_SIZE = 1.8;
/** Stone frame strip width and protrusion depth. */
const FRAME_WIDTH = 0.18;
const FRAME_DEPTH = 0.12;
/** God beam dimensions: width near window, length into room. */
const BEAM_WIDTH = 1.6;
const BEAM_LENGTH = 4.8;
/** Beam direction in XY plane (window is on left wall, light goes +X and -Y).
 *  Rotation Z = atan2(sin, cos) where (sin, -cos) = world target dir. */
const BEAM_ROT_Z = Math.atan2(0.93, 0.37); // ≈ 68°, light cone down-right

/** Build a plane geometry with vertex-color fade from top (white) to bottom
 *  (black) — under additive blending this acts like alpha gradient for free. */
function makeBeamGeometry(): PlaneGeometry {
  const g = new PlaneGeometry(BEAM_WIDTH, BEAM_LENGTH, 1, 1);
  // Translate so top edge sits at local y=0, bottom edge at y=-BEAM_LENGTH
  g.translate(0, -BEAM_LENGTH / 2, 0);
  // Vertex order from PlaneGeometry: TL, TR, BL, BR (in local XY)
  const colors = new Float32Array([
    1, 1, 1, // top-left (at window)
    1, 1, 1, // top-right
    0, 0, 0, // bottom-left (far from window)
    0, 0, 0, // bottom-right
  ]);
  g.setAttribute('color', new BufferAttribute(colors, 3));
  return g;
}

function useStoneTexture(): Texture {
  const base = useLoader(TextureLoader, STONE_TEX);
  return useMemo(() => {
    const t = base.clone();
    t.needsUpdate = true;
    t.colorSpace = SRGBColorSpace;
    t.magFilter = NearestFilter;
    t.minFilter = NearestMipmapNearestFilter;
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    return t;
  }, [base]);
}

function useWindowTexture(): Texture {
  const base = useLoader(TextureLoader, WINDOW_TEX);
  return useMemo(() => {
    const t = base.clone();
    t.needsUpdate = true;
    t.colorSpace = SRGBColorSpace;
    t.magFilter = NearestFilter;
    t.minFilter = NearestFilter;
    return t;
  }, [base]);
}

export function WorkshopWalls({ cx, cz }: { cx: number; cz: number }) {
  const ox = cx - ROOM_SIZE / 2;
  const oz = cz - ROOM_SIZE / 2;
  const tex = useStoneTexture();
  const windowTex = useWindowTexture();

  // Back wall (along x axis) — repeat horizontally + vertically
  const backTex = useMemo(() => {
    const t = tex.clone();
    t.needsUpdate = true;
    t.repeat.set(ROOM_SIZE / TILE_WORLD_SIZE, WALL_HEIGHT / TILE_WORLD_SIZE);
    return t;
  }, [tex]);

  // Left wall (along z axis) — same idea, swapped dims
  const leftTex = useMemo(() => {
    const t = tex.clone();
    t.needsUpdate = true;
    t.repeat.set(ROOM_SIZE / TILE_WORLD_SIZE, WALL_HEIGHT / TILE_WORLD_SIZE);
    return t;
  }, [tex]);

  // Cracked window plane: sits flush on inner face of left wall, between the
  // two left workbenches (Red_Woodworking_Workbench @ cz+0.5 and red_workbend_2
  // @ cz+3). Rotated +90° around Y so the face points into the room (+X).
  // emissive so the moon glows through dim ambient; alphaTest cuts surround.
  const windowX = ox + WALL_THICKNESS / 2 + 0.01;
  const windowY = 1.75;
  const windowZ = cz + 1.6;

  return (
    <group>
      <mesh position={[cx, WALL_HEIGHT / 2, oz]}>
        <boxGeometry args={[ROOM_SIZE, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial
          map={backTex}
          color="#cfbdb1"
          emissive="#3a2e26"
          emissiveMap={backTex}
          emissiveIntensity={0.35}
          roughness={0.95}
          metalness={0}
        />
      </mesh>
      <mesh position={[ox, WALL_HEIGHT / 2, cz]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, ROOM_SIZE]} />
        <meshStandardMaterial
          map={leftTex}
          color="#a08778"
          emissive="#3a2e26"
          emissiveMap={leftTex}
          emissiveIntensity={0.35}
          roughness={0.95}
          metalness={0}
        />
      </mesh>
      {/* Cracked stone window — moon glow visible through arch (left wall).
          meshBasicMaterial = unlit, cheaper shader compile + no lighting cost.
          Window is "always lit by moonlight" so unlit is correct visually. */}
      <mesh position={[windowX, windowY, windowZ]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[WINDOW_SIZE, WINDOW_SIZE]} />
        <meshBasicMaterial
          map={windowTex}
          transparent
          alphaTest={0.5}
          toneMapped={false}
        />
      </mesh>
      {/* 3D stone frame — 4 strips (top/bottom/left/right) + protruding sill.
          Sits on inner face of left wall, hugging the window opening. */}
      <WindowFrame cx={windowX} cy={windowY} cz={windowZ} stoneTex={tex} />
      {/* God beam — crossed planes from window into room, fade via vertex
          colors + additive blending. Anchored at window inner face. */}
      <GodBeam x={windowX} y={windowY} z={windowZ} />
    </group>
  );
}

/** Stone frame around the window: 4 strips + a protruding bottom sill. */
function WindowFrame({ cx, cy, cz, stoneTex }: {
  cx: number; cy: number; cz: number; stoneTex: Texture;
}) {
  // Frame center x (protrudes from inner wall face into room)
  const fx = cx + FRAME_DEPTH / 2;
  const halfW = WINDOW_SIZE / 2;
  const fw = FRAME_WIDTH;
  // Per-strip stone material — reuses shared stoneTex (no clone needed since
  // frames don't repeat-wrap; box geometry samples 0..1 once per face).
  const matProps = {
    map: stoneTex,
    color: '#8a6f5e',
    roughness: 0.9,
    metalness: 0,
  } as const;
  return (
    <group>
      {/* Top strip */}
      <mesh position={[fx, cy + halfW + fw / 2, cz]}>
        <boxGeometry args={[FRAME_DEPTH, fw, WINDOW_SIZE + 2 * fw]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* Bottom strip */}
      <mesh position={[fx, cy - halfW - fw / 2, cz]}>
        <boxGeometry args={[FRAME_DEPTH, fw, WINDOW_SIZE + 2 * fw]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* Left strip (lower z) */}
      <mesh position={[fx, cy, cz - halfW - fw / 2]}>
        <boxGeometry args={[FRAME_DEPTH, WINDOW_SIZE, fw]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* Right strip (higher z) */}
      <mesh position={[fx, cy, cz + halfW + fw / 2]}>
        <boxGeometry args={[FRAME_DEPTH, WINDOW_SIZE, fw]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* Protruding bottom sill — sticks out further, slightly wider/taller */}
      <mesh position={[fx + 0.08, cy - halfW - fw / 2 - 0.04, cz]}>
        <boxGeometry args={[FRAME_DEPTH + 0.16, fw * 0.6, WINDOW_SIZE + 2 * fw + 0.2]} />
        <meshStandardMaterial {...matProps} color="#735848" />
      </mesh>
    </group>
  );
}

/** Volumetric moonlight beam from window. Two crossed planes with vertex-
 *  color fade — additive blending makes black vertices contribute 0. */
function GodBeam({ x, y, z }: { x: number; y: number; z: number }) {
  const geo = useMemo(() => makeBeamGeometry(), []);
  return (
    <group position={[x, y, z]} rotation={[0, 0, BEAM_ROT_Z]}>
      {/* Plane A: in XY local (default planeGeometry orientation) */}
      <mesh geometry={geo}>
        <meshBasicMaterial
          color="#88aadd"
          vertexColors
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
          opacity={0.55}
        />
      </mesh>
      {/* Plane B: rotated 90° around local Y → crossed pair for volumetric feel */}
      <mesh geometry={geo} rotation={[0, Math.PI / 2, 0]}>
        <meshBasicMaterial
          color="#88aadd"
          vertexColors
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
          opacity={0.55}
        />
      </mesh>
    </group>
  );
}
