/**
 * Smoothly interpolates between atmosphere presets on room change.
 *
 * Numeric fields lerp linearly source→target with frame-independent step
 * `1 - exp(-rate * dt)` (~95% settled in 500ms at rate=5). Discrete fields
 * (string colors, enums like `particles`) snap at progress > 0.5 to avoid
 * mid-transition flicker.
 *
 * Implementation note: state is updated only while a transition is active —
 * once progress saturates at 1, the target is snapped and useFrame becomes
 * a no-op, so idle rooms incur zero re-render cost.
 *
 * Must be called inside a Canvas (uses useFrame).
 */

import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { AtmospherePreset } from './atmosphere-types';

/** Lerp rate — chosen so transitions settle in ~500ms (matches camera lerp at rate 5). */
const LERP_RATE = 5;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpPreset(
  source: AtmospherePreset,
  target: AtmospherePreset,
  t: number,
): AtmospherePreset {
  // Discrete swap point — strings/enums flip at midpoint to avoid lerping
  // through invalid intermediates (e.g. interpolating two hex colors as
  // strings doesn't make sense).
  const useTargetDiscrete = t >= 0.5;
  const discreteSource = useTargetDiscrete ? target : source;

  return {
    id: target.id,
    mood: target.mood,
    bloom: {
      threshold: lerp(source.bloom.threshold, target.bloom.threshold, t),
      intensity: lerp(source.bloom.intensity, target.bloom.intensity, t),
      radius: lerp(source.bloom.radius, target.bloom.radius, t),
    },
    tiltShift: {
      strength: lerp(source.tiltShift.strength, target.tiltShift.strength, t),
      enabled: discreteSource.tiltShift.enabled,
    },
    dof: {
      focalLength: lerp(source.dof.focalLength, target.dof.focalLength, t),
      bokehScale: lerp(source.dof.bokehScale, target.dof.bokehScale, t),
      targetOffset: discreteSource.dof.targetOffset,
      enabled: discreteSource.dof.enabled,
    },
    colorGrade: {
      hue: lerp(source.colorGrade.hue, target.colorGrade.hue, t),
      saturation: lerp(source.colorGrade.saturation, target.colorGrade.saturation, t),
      brightness: lerp(source.colorGrade.brightness, target.colorGrade.brightness, t),
      contrast: lerp(source.colorGrade.contrast, target.colorGrade.contrast, t),
    },
    vignette: {
      offset: lerp(source.vignette.offset, target.vignette.offset, t),
      darkness: lerp(source.vignette.darkness, target.vignette.darkness, t),
    },
    noise: {
      opacity: lerp(source.noise.opacity, target.noise.opacity, t),
    },
    fog: {
      color: discreteSource.fog.color,
      near: lerp(source.fog.near, target.fog.near, t),
      far: lerp(source.fog.far, target.fog.far, t),
      enabled: discreteSource.fog.enabled,
    },
    godRays:
      source.godRays && target.godRays
        ? {
            color: discreteSource.godRays!.color,
            exposure: lerp(source.godRays.exposure, target.godRays.exposure, t),
            samples: discreteSource.godRays!.samples,
            sourceId: discreteSource.godRays!.sourceId,
            enabled: discreteSource.godRays!.enabled,
          }
        : discreteSource.godRays,
    chromaticAberration:
      source.chromaticAberration && target.chromaticAberration
        ? {
            offset: [
              lerp(source.chromaticAberration.offset[0], target.chromaticAberration.offset[0], t),
              lerp(source.chromaticAberration.offset[1], target.chromaticAberration.offset[1], t),
            ],
            enabled: discreteSource.chromaticAberration!.enabled,
          }
        : discreteSource.chromaticAberration,
    heatHaze:
      source.heatHaze && target.heatHaze
        ? {
            intensity: lerp(source.heatHaze.intensity, target.heatHaze.intensity, t),
            enabled: discreteSource.heatHaze!.enabled,
          }
        : discreteSource.heatHaze,
    particles: discreteSource.particles,
    hemisphereLight:
      source.hemisphereLight && target.hemisphereLight
        ? {
            skyColor: discreteSource.hemisphereLight!.skyColor,
            groundColor: discreteSource.hemisphereLight!.groundColor,
            intensity: lerp(source.hemisphereLight.intensity, target.hemisphereLight.intensity, t),
          }
        : discreteSource.hemisphereLight,
  };
}

export function useLerpedAtmosphere(targetPreset: AtmospherePreset): AtmospherePreset {
  const [current, setCurrent] = useState<AtmospherePreset>(targetPreset);
  const sourceRef = useRef<AtmospherePreset>(targetPreset);
  const targetRef = useRef<AtmospherePreset>(targetPreset);
  const progressRef = useRef(1);

  // Kick off a new transition when the target room changes. Same-room
  // preset edits (HMR / leva tuning) rely on R3F's full-remount HMR cycle
  // to reseed `useState`; no in-place update path is needed here.
  useEffect(() => {
    if (targetRef.current.id !== targetPreset.id) {
      sourceRef.current = current;
      targetRef.current = targetPreset;
      progressRef.current = 0;
    } else {
      targetRef.current = targetPreset;
    }
  }, [targetPreset, current]);

  useFrame((_, delta) => {
    if (progressRef.current >= 1) return;
    const step = 1 - Math.exp(-LERP_RATE * delta);
    progressRef.current = Math.min(1, progressRef.current + step);
    setCurrent(lerpPreset(sourceRef.current, targetRef.current, progressRef.current));
  });

  return current;
}
