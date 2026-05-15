/**
 * AtmosphereProvider — supplies the current (lerped) per-room atmosphere
 * preset to downstream effects, particles, and lights.
 *
 * Must live INSIDE the Canvas: the lerp hook drives interpolation via
 * `useFrame`. Above-Canvas consumers (HUD, menus) have no use for it.
 *
 * When `atmosphericEnabled` is false (e.g. low tier opt-out from Phase 06),
 * the provider supplies `null`, and downstream consumers no-op. This makes
 * disabling fully zero-cost — no effects mount, no particles spawn.
 *
 * The `useAtmosphere()` consumer hook lives in `./use-atmosphere.ts` —
 * separated so this file can be component-only (react-refresh requirement).
 */

import { type ReactNode } from 'react';
import { useGameStore } from '@/game/state/store';
import { useActiveRoomId } from './use-active-room-id';
import { useLerpedAtmosphere } from './use-lerped-atmosphere';
import { getAtmospherePreset, DEFAULT_ROOM_ID } from './atmosphere-presets';
import { AtmosphereContext } from './atmosphere-context-store';

/* Fog wiring (`FogSync`) was prototyped here but reverted — setting
 * `scene.fog` while the WebGPU TSL particle pipeline (r3f-vfx) is active
 * caused drum-fire / torch-fire particles to drop out (regression observed
 * post-Phase 04). The atmospheric WebGPU pass renders the scene into a
 * texture via `pass(scene, camera)`; with `scene.fog` set, materials that
 * opted into fog at compile time interact badly with the texture-only
 * output pipeline used by TSL bloom + particles.
 *
 * Re-introducing fog will be planned as part of the TSL parity follow-up
 * (`260512-2039-atmospheric-webgpu-tsl-parity`) — there it'll go through a
 * proper TSL `fogNode` wired into `outputNode`, not the global `scene.fog`
 * which is WebGL-shader-codegen-only. */

export interface AtmosphereProviderProps {
  children: ReactNode;
}

/** Inner provider — runs the lerp hook and `useFrame`. Mounted only when
 *  `atmosphericEnabled` is true so disabling the stack is fully zero-cost
 *  (no per-frame work, no extra state, no re-renders).
 *
 *  Hemisphere light: mounted inside the provider so it lives within the
 *  Canvas and travels with preset swaps. `useLerpedAtmosphere` already lerps
 *  intensity and snaps colors at the midpoint, so a single instance works
 *  for every room. Rooms with `hemisphereLight: null` skip the mount —
 *  fully zero-cost when the preset opts out (e.g. stone-quarry). */
function EnabledAtmosphereProvider({ children }: AtmosphereProviderProps) {
  const activeRoomId = useActiveRoomId();
  // Fall back to default room when between rooms (camera panning) so we keep
  // lerping toward something sensible rather than freezing the last preset.
  const targetPreset = getAtmospherePreset(activeRoomId ?? DEFAULT_ROOM_ID);
  const lerped = useLerpedAtmosphere(targetPreset);
  const hemi = lerped.hemisphereLight;
  return (
    <AtmosphereContext.Provider value={lerped}>
      {hemi ? (
        <hemisphereLight
          color={hemi.skyColor}
          groundColor={hemi.groundColor}
          intensity={hemi.intensity}
        />
      ) : null}
      {children}
    </AtmosphereContext.Provider>
  );
}

export function AtmosphereProvider({ children }: AtmosphereProviderProps) {
  // Saves migrated from pre-Phase-1 schemas lack this field — treat absence as
  // "default on" (matches high-tier baseline). A dedicated migration can be
  // added later if persistence becomes important.
  const enabled = useGameStore((s) => s.settings.atmosphericEnabled ?? true);
  if (!enabled) {
    // Provider with explicit null — consumers no-op; no inner mount, no useFrame.
    return <AtmosphereContext.Provider value={null}>{children}</AtmosphereContext.Provider>;
  }
  return <EnabledAtmosphereProvider>{children}</EnabledAtmosphereProvider>;
}
