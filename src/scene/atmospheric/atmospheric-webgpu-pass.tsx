/**
 * WebGPU atmospheric pass — TSL post-processing chain.
 *
 * Phase 01 scaffold: lazily builds a chained pipeline where every future
 * custom node (Vignette, ColorGrade, ACES Tonemap, ChromAb, Tilt-Shift)
 * is reassigned into a single `chain` local. Phases 02–05 only need to
 * insert their node at the marked spot and populate the corresponding
 * `TslChainHolder` field — no structural changes required.
 *
 * Chain ordering rule: ACES Tonemap must always be the LAST effect; every
 * other insertion goes BEFORE it. See `./tsl/types.ts` for the holder shape.
 *
 * Render path: `useFrame` priority 1 (after R3F's default render, before the
 * next frame's clears). Sync `post.render()`; `renderAsync()` causes
 * frame-queueing artifacts in three r167.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { AtmospherePreset } from './atmosphere-types';
import type { TslChainHolder } from './tsl/types';

export interface AtmosphericWebGPUPassProps {
  preset: AtmospherePreset;
  overrides: { bloomStrength: number; bloomRadius: number };
}

/**
 * Single source of truth for the preset → uniform mapping. Called both from
 * the async IIFE's tail (so values reflect the latest `preset` at chain-build
 * time) and from the per-preset `useEffect` (so later prop changes propagate).
 * This avoids the seed-race where a preset mutation during the dynamic-import
 * window would otherwise leave uniforms stuck on the at-mount values.
 */
function applyPreset(
  holder: TslChainHolder,
  preset: AtmospherePreset,
  overrides: AtmosphericWebGPUPassProps['overrides'],
) {
  holder.bloom.strength.value = preset.bloom.intensity * overrides.bloomStrength;
  holder.bloom.radius.value = preset.bloom.radius * overrides.bloomRadius;
  holder.bloom.threshold.value = preset.bloom.threshold;
  holder.colorGrade.hue.value = preset.colorGrade.hue;
  holder.colorGrade.saturation.value = preset.colorGrade.saturation;
  holder.colorGrade.brightness.value = preset.colorGrade.brightness;
  holder.colorGrade.contrast.value = preset.colorGrade.contrast;
  holder.vignette.offset.value = preset.vignette.offset;
  holder.vignette.darkness.value = preset.vignette.darkness;
  if (holder.chromaticAberration) {
    // `chromaticAberration: null` OR `enabled: false` → zero the offset so the
    // three samples collapse to one UV. No chain rebuild required.
    const ca = preset.chromaticAberration;
    if (ca?.enabled) {
      holder.chromaticAberration.offset.value.x = ca.offset[0];
      holder.chromaticAberration.offset.value.y = ca.offset[1];
    } else {
      holder.chromaticAberration.offset.value.x = 0;
      holder.chromaticAberration.offset.value.y = 0;
    }
  }
  if (holder.tiltShift) {
    // `enabled: false` → strength = 0 → focusBandHalfWidth = 0.5 → mask = 0 →
    // output equals sharp input everywhere. No chain rebuild required.
    holder.tiltShift.strength.value = preset.tiltShift.enabled
      ? preset.tiltShift.strength
      : 0;
  }
  if (holder.heatHaze) {
    // `heatHaze: null` OR `enabled: false` → intensity = 0 → displacement
    // collapses to vec2(0) → uv unchanged. No chain rebuild required.
    const h = preset.heatHaze;
    holder.heatHaze.intensity.value = h?.enabled ? h.intensity : 0;
    // `time` is updated in useFrame, not here — applyPreset only carries
    // preset-driven values, not animation state.
  }
}

let depthSpikeLogged = false;

export function AtmosphericWebGPUPass({ preset, overrides }: AtmosphericWebGPUPassProps) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  // Refs let the async IIFE's tail read the LATEST preset/overrides even if
  // they changed during the dynamic-import window — closes the seed-race
  // where a fast prop change during initial mount would otherwise leave the
  // chain stuck on at-mount values.
  const presetRef = useRef(preset);
  const overridesRef = useRef(overrides);
  presetRef.current = preset;
  overridesRef.current = overrides;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const setup = useMemo(() => {
    let cancelled = false;
    const holder: { current: TslChainHolder | null } = { current: null };
    // TSL TempNodes (e.g. `GaussianBlurNode`) own intermediate `RenderTarget`s
    // that `PostProcessing.dispose()` does NOT walk. Each node returns its
    // own dispose closure; we collect them here and invoke alongside
    // `post.dispose()` on unmount/HMR to avoid GPU texture leaks.
    const chainDisposables: Array<() => void> = [];

    (async () => {
      const { PostProcessing } = await import('three/webgpu');
      const { pass, uniform } = await import('three/tsl');
      const BloomNodeMod = await import('three/examples/jsm/tsl/display/BloomNode.js');
      const BloomNode = (BloomNodeMod as any).default ?? BloomNodeMod;
      const { vignetteNode } = await import('./tsl/vignette-node');
      const { colorGradeNode } = await import('./tsl/color-grade-node');
      const { acesTonemapNode } = await import('./tsl/aces-tonemap-node');
      const { chromaticAberrationNode } = await import('./tsl/chromatic-aberration-node');
      const { tiltShiftNode } = await import('./tsl/tilt-shift-node');
      const { heatHazeNode } = await import('./tsl/heat-haze-node');
      const { Vector2 } = await import('three');
      if (cancelled) return;

      const post = new (PostProcessing as any)(gl);
      const scenePass = (pass as any)(scene, camera);
      const sceneColor = scenePass.getTextureNode('output');

      // Phase 01 depth-texture spike. Records once per session whether
      // `getTextureNode('depth')` resolves to a usable node — informs whether
      // DOF-on-WebGPU is viable in a follow-up plan. Wrap in try/catch because
      // some renderer configs throw rather than return null.
      if (!depthSpikeLogged) {
        depthSpikeLogged = true;
        try {
          const sceneDepth = scenePass.getTextureNode('depth');
          console.info(
            '[atmospheric/webgpu] depth-texture spike:',
            sceneDepth ? 'available — DOF candidate viable' : 'null — DOF locked WebGL-only',
          );
        } catch (err) {
          console.info(
            '[atmospheric/webgpu] depth-texture spike: threw — DOF locked WebGL-only',
            err,
          );
        }
      }

      // Seed every uniform with 0; `applyPreset` below writes the real values
      // from the latest refs immediately after the chain is built. This keeps
      // the chain construction independent of when the dynamic imports settle.
      const bloomNode = new (BloomNode as any)(sceneColor, 0, 0, 0);
      const hueU = (uniform as any)(0);
      const satU = (uniform as any)(0);
      const brightU = (uniform as any)(0);
      const contU = (uniform as any)(0);
      const vignetteOffsetU = (uniform as any)(0);
      const vignetteDarknessU = (uniform as any)(0);
      // vec2 uniform — seeded to (0,0) so all 9 presets (which set
      // `chromaticAberration: null`) produce a no-op pass-through until a
      // designer flips one on. `applyPreset` writes the real x/y below.
      const chromAbOffsetU = (uniform as any)(new Vector2(0, 0));
      // Tilt-shift strength uniform — seeded to 0 (disabled). `applyPreset`
      // writes the real value (or 0 if `tiltShift.enabled === false`).
      const tiltShiftStrengthU = (uniform as any)(0);
      // Heat-haze intensity uniform — seeded to 0 (disabled). Only workshop
      // preset writes a non-zero value. Time uniform is updated every frame
      // from clock.elapsedTime in useFrame below.
      const heatHazeIntensityU = (uniform as any)(0);
      const heatHazeTimeU = (uniform as any)(0);

      // Build chain via single mutable local. Each phase reassigns once.
      // WebGL stack order: DOF → TiltShift → Bloom → grade → Vignette → ChromAb → tonemap.
      // On WebGPU we don't have DOF, so insert TiltShift right after Bloom-add
      // (still before grade — matches "tilt-shift before color grade" intent).
      let chain: any = sceneColor.add(bloomNode);
      const tilt = tiltShiftNode(chain, tiltShiftStrengthU);
      chain = tilt.output;
      chainDisposables.push(tilt.dispose);
      // Heat-haze: after tilt-shift (so wobble applies to the tilt-mixed
      // image), before color-grade (heat distorts geometry, then the warm
      // tint settles on top). Zero-intensity = no-op uv.
      chain = heatHazeNode(chain, heatHazeIntensityU, heatHazeTimeU);
      chain = colorGradeNode(chain, hueU, satU, brightU, contU);
      chain = vignetteNode(chain, vignetteOffsetU, vignetteDarknessU);
      chain = chromaticAberrationNode(chain, chromAbOffsetU);
      // === ACES MUST BE LAST. Insert new effects ABOVE this line. ===
      chain = acesTonemapNode(chain);

      post.outputNode = chain;
      holder.current = {
        post,
        bloom: {
          strength: bloomNode.strength,
          radius: bloomNode.radius,
          threshold: bloomNode.threshold,
        },
        colorGrade: { hue: hueU, saturation: satU, brightness: brightU, contrast: contU },
        vignette: { offset: vignetteOffsetU, darkness: vignetteDarknessU },
        chromaticAberration: { offset: chromAbOffsetU },
        tiltShift: { strength: tiltShiftStrengthU },
        heatHaze: { intensity: heatHazeIntensityU, time: heatHazeTimeU },
      };
      // Seed uniforms with the LATEST preset (refs always point at current
      // prop values, even if React rendered new ones during the async window).
      applyPreset(holder.current, presetRef.current, overridesRef.current);
    })();

    return {
      getCurrent: () => holder.current,
      dispose: () => {
        cancelled = true;
        for (const d of chainDisposables) d();
        chainDisposables.length = 0;
        const c = holder.current;
        if (c) {
          c.post.dispose?.();
          holder.current = null;
        }
      },
    };
    // Pipeline build depends only on renderer/scene/camera identity. Preset
    // values flow through `applyPreset` (called from the IIFE tail and the
    // sync effect below) — rebuilding the chain on every preset lerp would
    // thrash the GPU.
  }, [gl, scene, camera]);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  useEffect(() => () => setup.dispose(), [setup]);

  useEffect(() => {
    const current = setup.getCurrent();
    if (!current) return;
    applyPreset(current, preset, overrides);
  }, [setup, preset, overrides]);

  useFrame((state) => {
    const current = setup.getCurrent();
    if (!current) return;
    if (current.heatHaze) {
      // Drive the shimmer animation. elapsedTime starts at 0 and increases
      // monotonically — `sin` handles overflow gracefully, so no need to
      // wrap the value.
      current.heatHaze.time.value = state.clock.elapsedTime;
    }
    current.post.render();
  }, 1);

  return null;
}
