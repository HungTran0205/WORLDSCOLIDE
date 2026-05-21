/**
 * Title-screen R3F scene root.
 * Owns its Canvas (separate from in-game world.tsx) so it can mount/unmount
 * cleanly when the player enters/exits the game. Uses guild-hall assets
 * (walls + drum) to keep visual continuity with the actual hall the player
 * will walk into seconds later.
 *
 * Phase 2: chassis only — camera + lighting + walls + atmospheric pass.
 * Phase 3 injects drum + masked figures.
 */

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import type { AtmospherePreset, RoomId } from '@/scene/atmospheric/atmosphere-types';
import { AtmosphericWebGPUPass } from '@/scene/atmospheric/atmospheric-webgpu-pass';
import { GuildHallWall } from '@/scene/guild-hall/guild-hall-wall';
import { createWebGPURenderer } from '@/scene/webgpu-init';
import { MaskedFiguresCircle } from './masked-figures-circle';
import { TitleCamera } from './title-camera';
import { TitleDrum } from './title-drum';
import { TitleFlags } from './title-flags';
import { TitleLighting } from './title-lighting';

/**
 * Title-only atmosphere preset. Lives outside ATMOSPHERE_PRESETS registry
 * because title is not a room — it never enters the room-lerp pipeline.
 * `id` is cast as RoomId for type compatibility; the field is purely
 * descriptive here.
 */
const TITLE_PRESET: AtmospherePreset = {
  id: 'guild-hall' as RoomId, // bypass — title isn't a registered room
  mood: 'dark ritual, drum centerpiece, masked silhouettes',
  // Higher threshold + lower intensity tame the white-hot core into a gold
  // ritual glow. Combined with title-drum's gold palette this kills the
  // washed-out white halo that previously dominated the centerpiece.
  bloom: { threshold: 0.92, intensity: 0.18, radius: 0.35 },
  tiltShift: { strength: 0.5, enabled: true },
  dof: { focalLength: 0.5, bokehScale: 3.0, enabled: true },
  colorGrade: { hue: 0.03, saturation: 0, brightness: 0, contrast: 0.1 },
  vignette: { offset: 0.55, darkness: 0.5 },
  noise: { opacity: 0.05 },
  fog: { color: '#0a0606', near: 6, far: 40, enabled: true },
  godRays: null,
  chromaticAberration: null,
  heatHaze: null,
  particles: 'embers',
  hemisphereLight: null,
};

const PASS_OVERRIDES = { bloomStrength: 0.6, bloomRadius: 0.9 };

export function TitleScene() {
  return (
    <div className="title-scene-canvas">
      <Canvas
        gl={createWebGPURenderer}
        dpr={[1, 2]}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <TitleCamera />
          <TitleLighting />
          {/* GuildHallWall hardcodes wall positions for in-game room layout
           *  (back wall at X=gridW/2 Z=0, left wall at X=0 Z=gridD/2). The
           *  group offset re-centers it for title framing: back wall ends up
           *  centered behind drum at X=0 Z=-2.5, left wall pushed off-frame.
           *  backSrc override swaps in the title-specific cinematic backdrop. */}
          <group position={[-4, 0, -6.5]}>
            <GuildHallWall
              gridWidth={8}
              gridDepth={5}
              wallHeight={4}
              backSrc="/GuildHall/LinhSon/titlewallback.png"
            />
          </group>
          <TitleFlags />
          <MaskedFiguresCircle />
          <TitleDrum position={[0, 0, 0.5]} />
          <AtmosphericWebGPUPass preset={TITLE_PRESET} overrides={PASS_OVERRIDES} />
        </Suspense>
      </Canvas>
    </div>
  );
}
