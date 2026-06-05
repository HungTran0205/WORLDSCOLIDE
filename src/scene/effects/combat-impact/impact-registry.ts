/**
 * Impact registry — the single table mapping an attack's identity to its VFX
 * silhouette + tuning. This is where new attack types are added: drop a
 * material factory under presets/, then add one entry here. The dispatch layer
 * (combat-impact-layer) reads this; it never hard-codes silhouettes.
 *
 * Two shapes:
 *  - 'billboard' → a camera-facing planar silhouette rendered by
 *    <ImpactBillboardVfx> (slash / sword-thrust / axe-chop).
 *  - 'beam' → a stretched cylinder rendered by <BeamFlashVfx> (ranged bolt).
 *
 * Colors are NOT in the registry: they come from the attacker (civ palette),
 * passed through by the dispatch layer, so one silhouette can be re-tinted per
 * civ without a new entry.
 */

import { isRangedArchetype } from '@/game/systems/combat-arena-types';
import { createSlashCrescentMaterial } from './presets/slash-crescent-material';
import { createSwordThrustMaterial } from './presets/sword-thrust-material';
import { createAxeChopMaterial } from './presets/axe-chop-material';
import { createBeamMaterial } from './presets/beam-flash-material';
import type {
  ImpactMaterialHandle,
  PlanarImpactParams,
  BeamImpactParams,
} from './impact-material-types';

export type ImpactKind = 'slash-crescent' | 'sword-thrust' | 'axe-chop' | 'beam';

/** Camera-facing planar silhouette (slash / thrust / axe). */
interface BillboardImpactDef {
  shape: 'billboard';
  /** Plane geometry size [w, h] — tuned per silhouette. */
  size: [number, number];
  /** Visible lifetime in seconds. */
  durationS: number;
  /** Base silhouette orientation in radians. */
  baseAngle: number;
  /** Random angle jitter span added per mount (0 = deterministic orientation). */
  jitterAngle: number;
  build: (renderer: unknown, params: PlanarImpactParams) => Promise<ImpactMaterialHandle | null>;
}

/** Stretched-cylinder ranged beam. */
interface BeamImpactDef {
  shape: 'beam';
  durationS: number;
  build: (renderer: unknown, params: BeamImpactParams) => Promise<ImpactMaterialHandle | null>;
}

export type ImpactDef = BillboardImpactDef | BeamImpactDef;

export const IMPACT_REGISTRY: Record<ImpactKind, ImpactDef> = {
  // Default melee attack — generic crescent. Random arc orientation so repeats
  // don't look identical.
  'slash-crescent': {
    shape: 'billboard',
    size: [2.4, 2.4],
    durationS: 0.35,
    baseAngle: 0,
    jitterAngle: Math.PI * 0.5,
    build: createSlashCrescentMaterial,
  },
  // Templar stab — wide, short-lived horizontal lance tilted slightly up. No
  // jitter: a thrust is deliberate, not a wild swing.
  'sword-thrust': {
    shape: 'billboard',
    size: [2.8, 1.8],
    durationS: 0.24,
    baseAngle: 0.12,
    jitterAngle: 0,
    build: createSwordThrustMaterial,
  },
  // Warrior overhead cleave — tall vertical column dropping from the top, plus a
  // base flare. Tiny lateral jitter only.
  'axe-chop': {
    shape: 'billboard',
    size: [2.0, 3.0],
    durationS: 0.3,
    baseAngle: 0,
    jitterAngle: 0.12,
    build: createAxeChopMaterial,
  },
  // Ranged bolt.
  beam: {
    shape: 'beam',
    durationS: 0.2,
    build: createBeamMaterial,
  },
};

/**
 * Map an attacker archetype to its impact silhouette. Ranged archetypes
 * (range ≥ 4: scout/scholar/philosopher) fire the beam; specific melee classes
 * get bespoke silhouettes; everything else (dualblade, engineer, enemies,
 * unknown/old saves) falls back to the default slash crescent.
 */
export function resolveImpactKind(archetype?: string): ImpactKind {
  if (isRangedArchetype(archetype)) return 'beam';
  switch (archetype) {
    case 'warrior':
      return 'axe-chop';
    case 'sword':
      return 'sword-thrust';
    default:
      return 'slash-crescent';
  }
}
