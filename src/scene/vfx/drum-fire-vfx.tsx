/**
 * Drum fire VFX — lights, flicker, and particles for the copper drum fire holder.
 * Extracts all visual effects from DrumFireHolder so the props component stays lean.
 *
 * Contains:
 *  - Fire + smoke particles (quality-branched: TorchFireVfx | legacy)
 *  - Main upward SpotLight (wide cone, escaping drum mouth)
 *  - Fill downward SpotLight (drum body catches fire colour)
 *  - Flicker animation via layered sines (no Math.random jitter)
 */

import { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useControls } from 'leva';
import * as THREE from 'three';
import { TorchFireVfx } from './torch-fire-vfx';
import { TorchFireEffect as TorchFireEffectLegacy } from './torch-fire-particles';
import { useGraphicsQuality } from '../world';

interface DrumFireVfxProps {
  /** When true, the fire boosts intensity + turbulence as a hover affordance.
   *  Smooth lerp keeps the kick organic instead of a hard pop. */
  hovered?: boolean;
  /** Vertical offset of the fire particle emitter above the drum origin.
   *  Default 0.85 sits at the in-game drum mouth; the title scene lowers it. */
  fireOffsetY?: number;
  /** Baseline particle intensity multiplier (pre-hover-boost). Use <1 to dim
   *  the fire in showcase/title scenes without re-tuning TorchFireVfx defaults. */
  fireIntensityMul?: number;
  /** Baseline particle turbulence multiplier (pre-hover-boost). Same intent
   *  as fireIntensityMul — calmer flames for non-interactive scenery. */
  fireTurbulenceMul?: number;
  /** Override base flame palette (pre-hover). Defaults to white-hot tip
   *  fading to red. Title scene shifts toward gold to reduce white bloom. */
  baseColorStart?: [string, string];
  baseColorEnd?: [string, string];
  /** Override main spotlight color (the cone escaping the drum mouth).
   *  Defaults to the leva-controlled value; title scene overrides to gold. */
  spotMainColor?: string;
  /** Override main spotlight intensity multiplier. Use <1 to dim the bloomy
   *  upward cone in showcase scenes without retuning all leva defaults. */
  spotIntensityMul?: number;
  /** Override main spotlight reach (world units). Title scene extends this
   *  so the upward cone licks the masked figures behind the drum without
   *  retuning the in-game guild-hall drum's defaults. */
  spotMainDistance?: number;
  /** When true, skip leva controls and use baked defaults. Title scene sets
   *  this so it doesn't register debug panels into the leva store + so the
   *  particle child runs in static mode too. */
  disableLeva?: boolean;
}

/** Baked-in defaults — match the leva schema values verbatim. Used by the
 *  static dispatch path (title scene) so visuals stay identical even when
 *  leva is bypassed. */
type DrumFireSpotParams = {
  posY: number;
  targetY: number;
  color: string;
  intensity: number;
  distance: number;
  angle: number;
  penumbra: number;
  decay: number;
};

type DrumFireParams = {
  main: DrumFireSpotParams;
  flicker: { enabled: boolean; amount: number; speed: number };
  fill: DrumFireSpotParams;
};

const DRUM_FIRE_DEFAULTS: DrumFireParams = {
  main: {
    posY: 0.45,
    targetY: 5.8,
    color: '#e2bbaa',
    intensity: 34.5,
    distance: 7.0,
    angle: Math.PI / 1.41,
    penumbra: 0.15,
    decay: 1.2,
  },
  flicker: { enabled: true, amount: 0.38, speed: 1.0 },
  fill: {
    posY: 1.20,
    targetY: -2.1,
    color: '#ff5511',
    intensity: 10.5,
    distance: 3.2,
    angle: Math.PI / 1.21,
    penumbra: 1.95,
    decay: 2.6,
  },
};

const HOVER_LERP_RATE = 8; // 1/s — ~125ms to settle
const HOVER_INTENSITY_BOOST = 0.55;   // +55% spot + particle intensity
const HOVER_TURBULENCE_BOOST = 1.20;  // +120% turbulence (chaotic flames)

/** Base palette (warm) and hover palette (cyan-tinted mystic). The lerp runs
 *  on `boost` and produces the colors we feed to TorchFireVfx + the spotlight. */
const FIRE_BASE_START:  [string, string] = ['#ffffff', '#ffdd88'];
const FIRE_BASE_END:    [string, string] = ['#ff3300', '#aa1100'];
const FIRE_HOVER_START: [string, string] = ['#f6fa04', '#e8ec00'];
const FIRE_HOVER_END:   [string, string] = ['#d4b70e', '#d1ad0d'];
const SPOT_HOVER_COLOR = '#ffd900';

/** Linear RGB interpolation of two hex strings — returns '#rrggbb'. */
function lerpHex(a: string, b: string, t: number): string {
  const c = new THREE.Color(a).lerp(new THREE.Color(b), t);
  return `#${c.getHexString()}`;
}

/** Public component — dispatches to leva-fed or leva-free variant based on
 *  the `disableLeva` prop. Both variants render the same DrumFireVfxImpl
 *  internals; they only differ in how params are sourced. */
export function DrumFireVfx(props: DrumFireVfxProps) {
  return props.disableLeva
    ? <DrumFireVfxStatic {...props} />
    : <DrumFireVfxWithLeva {...props} />;
}

/** Leva-driven variant — used by the in-game guild hall drum. Registers
 *  three folders in the leva panel and feeds the live values into Impl. */
function DrumFireVfxWithLeva(props: DrumFireVfxProps) {
  const main = useControls('Drum Fire — Main Cone (Up)', {
    posY:      { value: DRUM_FIRE_DEFAULTS.main.posY,      min: 0,    max: 2,         step: 0.05 },
    targetY:   { value: DRUM_FIRE_DEFAULTS.main.targetY,   min: 0.5,  max: 12,        step: 0.1  },
    color:     { value: DRUM_FIRE_DEFAULTS.main.color },
    intensity: { value: DRUM_FIRE_DEFAULTS.main.intensity, min: 0,    max: 60,        step: 0.5  },
    distance:  { value: DRUM_FIRE_DEFAULTS.main.distance,  min: 1,    max: 20,        step: 0.5  },
    angle:     { value: DRUM_FIRE_DEFAULTS.main.angle,     min: 0.05, max: Math.PI / 2, step: 0.01 },
    penumbra:  { value: DRUM_FIRE_DEFAULTS.main.penumbra,  min: 0,    max: 2,         step: 0.05 },
    decay:     { value: DRUM_FIRE_DEFAULTS.main.decay,     min: 0,    max: 5,         step: 0.1  },
  }, { collapsed: true });

  const flicker = useControls('Drum Fire — Flicker', {
    enabled: { value: DRUM_FIRE_DEFAULTS.flicker.enabled },
    amount:  { value: DRUM_FIRE_DEFAULTS.flicker.amount, min: 0, max: 1,   step: 0.01 },
    speed:   { value: DRUM_FIRE_DEFAULTS.flicker.speed,  min: 0.1, max: 5, step: 0.05 },
  }, { collapsed: true });

  const fill = useControls('Drum Fire — Fill Cone (Down)', {
    posY:      { value: DRUM_FIRE_DEFAULTS.fill.posY,      min: 0,    max: 2,            step: 0.05 },
    targetY:   { value: DRUM_FIRE_DEFAULTS.fill.targetY,   min: -5,   max: 0,            step: 0.1  },
    color:     { value: DRUM_FIRE_DEFAULTS.fill.color },
    intensity: { value: DRUM_FIRE_DEFAULTS.fill.intensity, min: 0,    max: 30,           step: 0.5  },
    distance:  { value: DRUM_FIRE_DEFAULTS.fill.distance,  min: 0.2,  max: 10,           step: 0.1  },
    angle:     { value: DRUM_FIRE_DEFAULTS.fill.angle,     min: 0.05, max: Math.PI / 2, step: 0.01 },
    penumbra:  { value: DRUM_FIRE_DEFAULTS.fill.penumbra,  min: 0,    max: 2,            step: 0.05 },
    decay:     { value: DRUM_FIRE_DEFAULTS.fill.decay,     min: 0,    max: 5,            step: 0.1  },
  }, { collapsed: true });

  return <DrumFireVfxImpl {...props} params={{ main, flicker, fill }} />;
}

/** Leva-free variant — used by the title scene. Uses baked-in defaults so
 *  the title doesn't pollute the leva store with debug panels. */
function DrumFireVfxStatic(props: DrumFireVfxProps) {
  return <DrumFireVfxImpl {...props} params={DRUM_FIRE_DEFAULTS} />;
}

/** Shared rendering + animation logic. Receives all tunables via the
 *  `params` prop so both leva-fed and leva-free variants share one body. */
function DrumFireVfxImpl({
  hovered = false,
  fireOffsetY = 0.85,
  fireIntensityMul = 1,
  fireTurbulenceMul = 1,
  baseColorStart,
  baseColorEnd,
  spotMainColor,
  spotIntensityMul = 1,
  spotMainDistance,
  disableLeva = false,
  params,
}: DrumFireVfxProps & { params: DrumFireParams }) {
  const { main, flicker, fill } = params;
  const FIRE_START = baseColorStart ?? FIRE_BASE_START;
  const FIRE_END = baseColorEnd ?? FIRE_BASE_END;
  const quality = useGraphicsQuality();
  const groupRef = useRef<THREE.Group>(null);
  const spotRef  = useRef<THREE.SpotLight>(null);
  const fillRef  = useRef<THREE.SpotLight>(null);
  /** Eased hover factor, 0..1 — applied to spotlight + particle multipliers. */
  const boostRef = useRef(0);
  /** Mirrored to state so the particle props re-render when boost changes. */
  const [boost, setBoost] = useState(0);
  /** Reusable Color objects for per-frame spotlight tinting (no GC churn). */
  const spotBaseColor = useRef(new THREE.Color());
  const spotHoverColor = useMemo(() => new THREE.Color(SPOT_HOVER_COLOR), []);

  // Targets live inside the group so they inherit the drum transform.
  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    if (spotRef.current) {
      g.add(spotRef.current.target);
      spotRef.current.target.position.set(0, main.targetY, 0);
      spotRef.current.target.updateMatrixWorld();
    }
    if (fillRef.current) {
      g.add(fillRef.current.target);
      fillRef.current.target.position.set(0, fill.targetY, 0);
      fillRef.current.target.updateMatrixWorld();
    }
  }, [main.targetY, fill.targetY]);

  // Layered sines at 3 incommensurate frequencies fake organic flame noise
  // without Math.random() jitter (which looks like a strobe, not fire).
  // Also lerps the hover boost factor and applies it to the spot intensity.
  useFrame((state, dt) => {
    // Lerp boost toward target (1 when hovered, 0 otherwise).
    const target = hovered ? 1 : 0;
    const next = THREE.MathUtils.damp(boostRef.current, target, HOVER_LERP_RATE, dt);
    if (Math.abs(next - boostRef.current) > 0.005) {
      boostRef.current = next;
      // Round so we don't spam re-renders on imperceptible deltas.
      setBoost(Math.round(next * 20) / 20);
    } else if (next !== boostRef.current) {
      boostRef.current = next;
    }

    const light = spotRef.current;
    if (!light) return;

    // Tint the spotlight toward cyan as boost rises so the cast glow matches
    // the cooler flame palette. Mutating light.color avoids React reconcile.
    const baseSpotColor = spotMainColor ?? main.color;
    light.color.copy(spotBaseColor.current.set(baseSpotColor)).lerp(spotHoverColor, boostRef.current);

    const hoverMul = 1 + boostRef.current * HOVER_INTENSITY_BOOST;
    const baseIntensity = main.intensity * spotIntensityMul;
    if (!flicker.enabled) {
      light.intensity = baseIntensity * hoverMul;
      return;
    }
    const t = state.clock.elapsedTime * flicker.speed;
    const f =
      Math.sin(t * 12.0) * 0.5 +
      Math.sin(t * 23.7) * 0.3 +
      Math.sin(t *  7.3) * 0.2;
    light.intensity = baseIntensity * hoverMul * (1 + f * flicker.amount);
  });

  // Lerp particle palettes so the flame fades cyan as boost rises. Recomputes
  // only when the throttled `boost` state ticks (~20 steps per transition).
  const fireColorStart = useMemo<[string, string]>(() => [
    lerpHex(FIRE_START[0], FIRE_HOVER_START[0], boost),
    lerpHex(FIRE_START[1], FIRE_HOVER_START[1], boost),
  ], [boost, FIRE_START]);
  const fireColorEnd = useMemo<[string, string]>(() => [
    lerpHex(FIRE_END[0], FIRE_HOVER_END[0], boost),
    lerpHex(FIRE_END[1], FIRE_HOVER_END[1], boost),
  ], [boost, FIRE_END]);

  return (
    <group ref={groupRef}>
      {/* Fire + smoke particles rising from drum bowl.
          Hover boost only flows to the high-quality (TSL) path because the
          legacy sprite-pool component has no equivalent multiplier knobs. */}
      {quality === 'high'
        ? (
          <TorchFireVfx
            offsetY={fireOffsetY}
            scale={1.3}
            debugLabel="Drum Fire"
            intensityMul={fireIntensityMul * (1 + boost * HOVER_INTENSITY_BOOST)}
            turbulenceMul={fireTurbulenceMul * (1 + boost * HOVER_TURBULENCE_BOOST)}
            colorStart={fireColorStart}
            colorEnd={fireColorEnd}
            disableLeva={disableLeva}
          />
        )
        : <TorchFireEffectLegacy offsetY={fireOffsetY} scale={1.3} debugLabel="Drum Fire" />
      }
      <spotLight
        ref={spotRef}
        position={[0, main.posY, 0]}
        color={main.color}
        intensity={main.intensity}
        distance={spotMainDistance ?? main.distance}
        angle={main.angle}
        penumbra={main.penumbra}
        decay={main.decay}
      />
      <spotLight
        ref={fillRef}
        position={[0, fill.posY, 0]}
        color={fill.color}
        intensity={fill.intensity}
        distance={fill.distance}
        angle={fill.angle}
        penumbra={fill.penumbra}
        decay={fill.decay}
      />
    </group>
  );
}
