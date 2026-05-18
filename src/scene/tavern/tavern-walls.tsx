/**
 * Tavern walls — Linh Son cavern theme.
 * - Left wall (along Z, at ox): solid cracked-stone face — closed cave wall.
 * - Back wall (along X, at oz): split into 3 chunks (top lintel + 2 side
 *   pillars) leaving a rectangular cave-mouth opening reinforced with bamboo
 *   braces. Behind the opening sits a forest backdrop plane (vertex-color
 *   gradient) lit by a warm gold god beam — diegetic explanation of where the
 *   warm light bleeding into the room comes from.
 *
 * Reuses the GodBeam vertex-color-fade pattern from workshop-walls.tsx but
 * recolors to warm forest sun instead of cool moonlight, and anchors the beam
 * at the cave mouth instead of a small window.
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
const STONE_TEX = '/tiles/2d/64px/cracked-stone-wall_0001.png';
/** Linh Son wall decals — Bronze Dong Son drum (hero prop, §13.2 art rules) +
 *  hanging dried food strip (kitchen storytelling, Linh Son post-apoc lore). */
const DRUM_TEX = '/walls/tavern-dongson-drum.png';
const FOOD_STRIP_TEX = '/walls/tavern-dried-food-strip.png';
/** Linh Son cavern signature: glowing cyan crystal clusters embedded in the
 *  left (closed cave) wall. Single PNG reused at 2-3 positions/scales. */
const CRYSTAL_TEX = '/walls/tavern-cyan-crystal-cluster.png';
/** Glowing cyan vine drooping from cave ceiling — anchors top of left wall.
 *  Rock anchor at top of PNG, vines drooping downward → place top of plane
 *  flush with wall top (y=WALL_HEIGHT). */
const VINE_TEX = '/walls/tavern-cyan-vine.png';
const VINE_WIDTH = 0.9;
const VINE_HEIGHT = 1.4;
/** World units per stone tile cell. Larger = fewer repetitions = bigger blocks. */
const TILE_WORLD_SIZE = 1.5;

/** Decal sizes in world units. Both sit on the back wall LEFT chunk
 *  (=cx-2.45) — chunk is 2.1m wide so decals must stay <2.0m. */
const DRUM_SIZE = 1.0;
const FOOD_STRIP_WIDTH = 1.8;
const FOOD_STRIP_HEIGHT = 1.0;

/** Cave-mouth opening on the BACK wall — centered at room midpoint (x=cx).
 *  Spans along X (wall length) and Y (vertical). */
const OPENING_WIDTH = 2.8;   // along X
const OPENING_HEIGHT = 2.3;  // from y=0 up
/** Bamboo brace dimensions: square cross-section, weathered olive-yellow. */
const BAMBOO_THICKNESS = 0.14;
const BAMBOO_COLOR = '#a89348';
const BAMBOO_EMISSIVE = '#3a3010';

/** Forest backdrop sits this far OUTSIDE the back wall (in -Z direction). */
const BACKDROP_DISTANCE = 1.6;
const BACKDROP_WIDTH = 4.2;
const BACKDROP_HEIGHT = 3.4;

/** Warm god beam pouring through the cave mouth into the room. */
const BEAM_WIDTH = 2.2;
const BEAM_LENGTH = 5.0;
/** Beam tilts down-into-room. Rotation around X axis tips the beam in YZ plane,
 *  so it leans from the back wall toward the room interior. */
const BEAM_ROT_X = -Math.atan2(0.4, 0.92); // ≈ -24° (negative tilts +Z direction)

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

/** Generic decal texture loader — SRGB color, no repeat (clamp), linear filter
 *  for painterly assets so they don't look pixelated when scaled up. */
function useDecalTexture(path: string): Texture {
  const base = useLoader(TextureLoader, path);
  return useMemo(() => {
    const t = base.clone();
    t.needsUpdate = true;
    t.colorSpace = SRGBColorSpace;
    return t;
  }, [base]);
}

/** Vertex-color gradient plane: top warm gold (canopy filter), middle deep
 *  forest green, bottom dim earth brown. Used as the backdrop visible through
 *  the cave mouth — fakes a forest scene without rendering geometry. */
function makeForestBackdropGeometry(): PlaneGeometry {
  const g = new PlaneGeometry(BACKDROP_WIDTH, BACKDROP_HEIGHT, 1, 2);
  const goldR = 0.78, goldG = 0.68, goldB = 0.34;
  const midR = 0.10, midG = 0.22, midB = 0.16;
  const earthR = 0.18, earthG = 0.14, earthB = 0.08;
  const colors = new Float32Array([
    goldR, goldG, goldB,  goldR, goldG, goldB,
    midR,  midG,  midB,   midR,  midG,  midB,
    earthR, earthG, earthB, earthR, earthG, earthB,
  ]);
  g.setAttribute('color', new BufferAttribute(colors, 3));
  return g;
}

/** Build a plane geometry with vertex-color fade from top (white) to bottom
 *  (black) — under additive blending this acts like alpha gradient for free.
 *  Cloned from workshop-walls.tsx GodBeam pattern. */
function makeBeamGeometry(): PlaneGeometry {
  const g = new PlaneGeometry(BEAM_WIDTH, BEAM_LENGTH, 1, 1);
  g.translate(0, -BEAM_LENGTH / 2, 0);
  const colors = new Float32Array([
    1, 1, 1,
    1, 1, 1,
    0, 0, 0,
    0, 0, 0,
  ]);
  g.setAttribute('color', new BufferAttribute(colors, 3));
  return g;
}

export function TavernWalls({ cx, cz }: { cx: number; cz: number }) {
  const ox = cx - ROOM_SIZE / 2;
  const oz = cz - ROOM_SIZE / 2;
  const tex = useStoneTexture();
  const drumTex = useDecalTexture(DRUM_TEX);
  const foodTex = useDecalTexture(FOOD_STRIP_TEX);
  const crystalTex = useDecalTexture(CRYSTAL_TEX);
  const vineTex = useDecalTexture(VINE_TEX);

  // Left wall texture — full repeat across 7×3 face (solid wall, no opening).
  const leftTex = useMemo(() => {
    const t = tex.clone();
    t.needsUpdate = true;
    t.repeat.set(ROOM_SIZE / TILE_WORLD_SIZE, WALL_HEIGHT / TILE_WORLD_SIZE);
    return t;
  }, [tex]);

  // Back-wall chunk textures: each chunk uses repeat sized to its own span so
  // the texture density matches the left wall.
  const sideChunkSpanX = (ROOM_SIZE - OPENING_WIDTH) / 2;
  const sideChunkTex = useMemo(() => {
    const t = tex.clone();
    t.needsUpdate = true;
    t.repeat.set(sideChunkSpanX / TILE_WORLD_SIZE, WALL_HEIGHT / TILE_WORLD_SIZE);
    return t;
  }, [tex, sideChunkSpanX]);

  const lintelHeight = WALL_HEIGHT - OPENING_HEIGHT;
  const lintelTex = useMemo(() => {
    const t = tex.clone();
    t.needsUpdate = true;
    t.repeat.set(OPENING_WIDTH / TILE_WORLD_SIZE, lintelHeight / TILE_WORLD_SIZE);
    return t;
  }, [tex, lintelHeight]);

  // Side chunk centers along X
  const leftChunkCx = ox + sideChunkSpanX / 2;
  const rightChunkCx = ox + ROOM_SIZE - sideChunkSpanX / 2;

  // Opening corners (inner edges of the side chunks).
  const openingXmin = cx - OPENING_WIDTH / 2;
  const openingXmax = cx + OPENING_WIDTH / 2;

  // Forest backdrop sits outside the back wall (-Z direction).
  const backdropZ = oz - BACKDROP_DISTANCE;
  const backdropGeometry = useMemo(() => makeForestBackdropGeometry(), []);

  return (
    <group>
      {/* ── Left wall — solid cave-stone face ──────────────────────────────── */}
      <mesh position={[ox, WALL_HEIGHT / 2, cz]}>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, ROOM_SIZE]} />
        <meshStandardMaterial
          map={leftTex}
          color="#6a5a52"
          emissive="#1a2228"
          emissiveMap={leftTex}
          emissiveIntensity={0.3}
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* ── Linh Son cavern signature: cyan crystal clusters on left wall ───
          Two embeds at different positions/scales to break the empty wall:
          one front-of-bar (camera-facing area, large), one back-corner (above
          eye, small) for background depth. Each is a transparent decal
          rotated +90° around Y so it faces into the room (+X).
          meshBasicMaterial unlit keeps the baked cyan glow vivid regardless
          of room ambient (low decay so the cave still feels dim). */}
      <WallDecal
        position={[ox + WALL_THICKNESS / 2 + 0.02, 1.6, oz + 5.8]}
        width={1.4}
        height={1.4}
        tex={crystalTex}
      />
      <WallDecal
        position={[ox + WALL_THICKNESS / 2 + 0.02, 2.1, oz + 1.1]}
        width={0.9}
        height={0.9}
        tex={crystalTex}
      />
      {/* Cyan glowing vines drooping from the top of the left wall — 2 corners
          for frame-corner accent. Top edge of plane sits flush with wall top
          (y=WALL_HEIGHT) so the rock-anchor in the PNG looks like it grows
          from the ceiling. Slight forward offset prevents z-fighting. */}
      <WallDecal
        position={[ox + WALL_THICKNESS / 2 + 0.025, WALL_HEIGHT - VINE_HEIGHT / 2, oz + 0.6]}
        width={VINE_WIDTH}
        height={VINE_HEIGHT}
        tex={vineTex}
      />
      <WallDecal
        position={[ox + WALL_THICKNESS / 2 + 0.025, WALL_HEIGHT - VINE_HEIGHT / 2, oz + 6.4]}
        width={VINE_WIDTH}
        height={VINE_HEIGHT}
        tex={vineTex}
      />
      {/* Cyan ambient bleed — point light embedded near the large crystal
          cluster so it casts cool reflection on nearby props/floor and reads
          as a real light source (Linh Son chiaroscuro signature). */}
      <pointLight
        position={[ox + 0.6, 1.6, oz + 5.8]}
        color="#4dd6c2"
        intensity={2.2}
        distance={3.5}
        decay={2}
      />

      {/* ── Back wall: 3 stone chunks framing a cave-mouth opening ─────────── */}
      {/* Left chunk (lower X) */}
      <mesh position={[leftChunkCx, WALL_HEIGHT / 2, oz]}>
        <boxGeometry args={[sideChunkSpanX, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial
          map={sideChunkTex}
          color="#6a5a52"
          emissive="#1a2228"
          emissiveMap={sideChunkTex}
          emissiveIntensity={0.3}
          roughness={0.95}
          metalness={0}
        />
      </mesh>
      {/* Right chunk (higher X) */}
      <mesh position={[rightChunkCx, WALL_HEIGHT / 2, oz]}>
        <boxGeometry args={[sideChunkSpanX, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial
          map={sideChunkTex}
          color="#6a5a52"
          emissive="#1a2228"
          emissiveMap={sideChunkTex}
          emissiveIntensity={0.3}
          roughness={0.95}
          metalness={0}
        />
      </mesh>
      {/* Top lintel (above the opening) */}
      <mesh position={[cx, OPENING_HEIGHT + lintelHeight / 2, oz]}>
        <boxGeometry args={[OPENING_WIDTH, lintelHeight, WALL_THICKNESS]} />
        <meshStandardMaterial
          map={lintelTex}
          color="#6a5a52"
          emissive="#1a2228"
          emissiveMap={lintelTex}
          emissiveIntensity={0.3}
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* ── Jagged stone protrusions softening the rectangular opening ──────
          Six small irregular blocks staggered along the inner edges of the
          cave mouth. Same stone texture so they read as broken rock chips
          fused with the wall, not separate objects. Subtle random rotation
          breaks the straight-edge feel. */}
      <JaggedStone
        position={[openingXmin + 0.05, OPENING_HEIGHT - 0.35, oz + WALL_THICKNESS / 2]}
        size={[0.32, 0.4, 0.18]}
        rotZ={0.18}
        tex={tex}
      />
      <JaggedStone
        position={[openingXmax - 0.08, OPENING_HEIGHT - 0.22, oz + WALL_THICKNESS / 2]}
        size={[0.28, 0.5, 0.16]}
        rotZ={-0.12}
        tex={tex}
      />
      <JaggedStone
        position={[openingXmin + 0.12, OPENING_HEIGHT * 0.45, oz + WALL_THICKNESS / 2]}
        size={[0.22, 0.3, 0.14]}
        rotZ={-0.22}
        tex={tex}
      />
      <JaggedStone
        position={[openingXmax - 0.05, OPENING_HEIGHT * 0.6, oz + WALL_THICKNESS / 2]}
        size={[0.24, 0.36, 0.15]}
        rotZ={0.15}
        tex={tex}
      />
      {/* Rock debris piled at floor near the opening edges */}
      <JaggedStone
        position={[openingXmin + 0.25, 0.12, oz + WALL_THICKNESS / 2 + 0.08]}
        size={[0.36, 0.24, 0.22]}
        rotZ={0.08}
        tex={tex}
      />
      <JaggedStone
        position={[openingXmax - 0.18, 0.1, oz + WALL_THICKNESS / 2 + 0.06]}
        size={[0.28, 0.2, 0.18]}
        rotZ={-0.1}
        tex={tex}
      />

      {/* ── Bamboo braces reinforcing the cave mouth ───────────────────────── */}
      {/* Two vertical tre stakes flanking the opening (full height up to lintel) */}
      <BambooBrace
        position={[openingXmin + BAMBOO_THICKNESS / 2, OPENING_HEIGHT / 2, oz + WALL_THICKNESS / 2 + BAMBOO_THICKNESS / 2]}
        size={[BAMBOO_THICKNESS, OPENING_HEIGHT, BAMBOO_THICKNESS]}
      />
      <BambooBrace
        position={[openingXmax - BAMBOO_THICKNESS / 2, OPENING_HEIGHT / 2, oz + WALL_THICKNESS / 2 + BAMBOO_THICKNESS / 2]}
        size={[BAMBOO_THICKNESS, OPENING_HEIGHT, BAMBOO_THICKNESS]}
      />
      {/* Horizontal cross beam under the lintel — joins both vertical stakes */}
      <BambooBrace
        position={[cx, OPENING_HEIGHT - BAMBOO_THICKNESS / 2, oz + WALL_THICKNESS / 2 + BAMBOO_THICKNESS / 2]}
        size={[OPENING_WIDTH, BAMBOO_THICKNESS, BAMBOO_THICKNESS]}
      />

      {/* ── Forest backdrop visible through the cave mouth ─────────────────── */}
      {/* Default plane normal is +Z — leave un-rotated so it faces into room (+Z). */}
      <mesh
        position={[cx, BACKDROP_HEIGHT / 2, backdropZ]}
        geometry={backdropGeometry}
      >
        <meshBasicMaterial vertexColors toneMapped={false} side={DoubleSide} />
      </mesh>

      {/* ── Warm god beam pouring from cave mouth into the room ────────────── */}
      <ForestGodBeam x={cx} y={OPENING_HEIGHT * 0.65} z={oz + WALL_THICKNESS / 2 + 0.05} />

      {/* ── Hero prop: Bronze Dong Son drum on back wall LEFT chunk ─────────
          Centered on the left chunk (x=leftChunkCx) at upper-mid height so
          camera reads it instantly as the room's hero piece (§13.2). Slight
          forward offset (z+0.02) prevents z-fighting with the wall face.
          alphaTest cuts the transparent PNG background. */}
      <mesh
        position={[leftChunkCx, 2.15, oz + WALL_THICKNESS / 2 + 0.02]}
      >
        <planeGeometry args={[DRUM_SIZE, DRUM_SIZE]} />
        <meshBasicMaterial
          map={drumTex}
          transparent
          alphaTest={0.1}
          toneMapped={false}
        />
      </mesh>

      {/* ── Kitchen storytelling: dried fish/peppers/herbs hanging strip ────
          Sits below the drum on the same chunk. PNG content occupies the
          lower-half of the 16:9 image (rope near top, items dangling) — so
          the rendered plane center is positioned to align visible items
          around y=1.0-1.4 in world space. */}
      <mesh
        position={[leftChunkCx, 1.25, oz + WALL_THICKNESS / 2 + 0.04]}
      >
        <planeGeometry args={[FOOD_STRIP_WIDTH, FOOD_STRIP_HEIGHT]} />
        <meshBasicMaterial
          map={foodTex}
          transparent
          alphaTest={0.1}
          toneMapped={false}
        />
      </mesh>

      {/* ── Warm directional light leaking through the opening ─────────────── */}
      <directionalLight
        position={[cx, 4, oz - 4]}
        color="#e8c878"
        intensity={1.1}
      >
        <object3D attach="target" position={[cx, 0, cz]} />
      </directionalLight>
    </group>
  );
}

/** Generic transparent decal plane on the LEFT WALL — rotated +90° around Y
 *  so the face points +X (into the room). Unlit material so baked glow stays
 *  bright regardless of dim cave ambient. Used for crystal clusters + vines. */
function WallDecal({ position, width, height, tex }: {
  position: [number, number, number];
  width: number;
  height: number;
  tex: Texture;
}) {
  return (
    <mesh position={position} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={tex}
        transparent
        alphaTest={0.1}
        toneMapped={false}
      />
    </mesh>
  );
}

/** Small jagged stone protrusion clinging to the opening edge. Same texture
 *  as the wall so it reads as part of the rock face — slight rotation around
 *  Z gives the irregular natural-cave-edge feel. */
function JaggedStone({ position, size, rotZ, tex }: {
  position: [number, number, number];
  size: [number, number, number];
  rotZ: number;
  tex: Texture;
}) {
  return (
    <mesh position={position} rotation={[0, 0, rotZ]}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        map={tex}
        color="#5a4a42"
        emissive="#1a1a1a"
        emissiveIntensity={0.2}
        roughness={0.95}
        metalness={0}
      />
    </mesh>
  );
}

/** A single bamboo stake — box primitive with warm olive emissive so it reads
 *  even in dim cave ambient. Reused for vertical stakes + horizontal cross
 *  beam reinforcing the cave mouth. */
function BambooBrace({ position, size }: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={BAMBOO_COLOR}
        emissive={BAMBOO_EMISSIVE}
        emissiveIntensity={0.25}
        roughness={0.85}
        metalness={0}
      />
    </mesh>
  );
}

/** Warm gold god beam (vs Workshop's blue moonbeam). Two crossed planes with
 *  vertex-color fade — additive blending makes black vertices contribute 0.
 *  Beam tilts around X axis (in YZ plane) so it pours from back wall into room. */
function ForestGodBeam({ x, y, z }: { x: number; y: number; z: number }) {
  const geo = useMemo(() => makeBeamGeometry(), []);
  return (
    <group position={[x, y, z]} rotation={[BEAM_ROT_X, 0, 0]}>
      <mesh geometry={geo}>
        <meshBasicMaterial
          color="#e6c878"
          vertexColors
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
          opacity={0.5}
        />
      </mesh>
      <mesh geometry={geo} rotation={[0, Math.PI / 2, 0]}>
        <meshBasicMaterial
          color="#e6c878"
          vertexColors
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
          toneMapped={false}
          opacity={0.5}
        />
      </mesh>
    </group>
  );
}
