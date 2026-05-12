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

    (async () => {
      const { PostProcessing } = await import('three/webgpu');
      const { pass, uniform } = await import('three/tsl');
      const BloomNodeMod = await import('three/examples/jsm/tsl/display/BloomNode.js');
      const BloomNode = (BloomNodeMod as any).default ?? BloomNodeMod;
      const { vignetteNode } = await import('./tsl/vignette-node');
      const { colorGradeNode } = await import('./tsl/color-grade-node');
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

      // Build chain via single mutable local. Each phase reassigns once.
      // Order must be: bloom → colorGrade → vignette → fog → chromAb → tiltShift → aces.
      // (Matches pmndrs WebGL stack ordering — see atmospheric-effect-stack.tsx.)
      let chain: any = sceneColor.add(bloomNode);
      chain = colorGradeNode(chain, hueU, satU, brightU, contU);
      chain = vignetteNode(chain, vignetteOffsetU, vignetteDarknessU);
      // Phase 03: chain = fog(chain, sceneDepth, holder.fog = { near, far, color, density })
      // Phase 04: chain = chromAb(chain, holder.chromaticAberration = { offset })
      // Phase 05: chain = tiltShift(chain, holder.tiltShift = { strength, focusBand })
      // Phase 03 (chain tail, ALWAYS LAST): chain = aces(chain)

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
      };
      // Seed uniforms with the LATEST preset (refs always point at current
      // prop values, even if React rendered new ones during the async window).
      applyPreset(holder.current, presetRef.current, overridesRef.current);
    })();

    return {
      getCurrent: () => holder.current,
      dispose: () => {
        cancelled = true;
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

  useFrame(() => {
    const current = setup.getCurrent();
    if (!current) return;
    current.post.render();
  }, 1);

  return null;
}
