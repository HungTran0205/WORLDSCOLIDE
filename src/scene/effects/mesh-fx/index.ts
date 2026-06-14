/**
 * mesh-fx public surface.
 *
 * Consumer pattern (Phase 06 orchestrator):
 *   1. Mount <MeshFxPoolRoot /> once inside <CombatSceneShell>.
 *   2. For each skill cue: mount <MeshFxVfx kind="thrust-lance" ... />.
 *   3. MeshFxVfx acquires a slot, drives it, releases on complete — no mesh per cast.
 */

export { MeshFxPoolRoot } from './mesh-fx-pool-root';
export { MeshFxVfx } from './mesh-fx-vfx';
export type { MeshFxVfxProps } from './mesh-fx-vfx';
export type { MeshFxKind, MeshFxHandle, MeshFxParams, LeaseHandle } from './mesh-fx-types';

// Pool imperative API — for tests and any code that needs direct pool access.
export { warm, acquire, dispose, registerMesh, forEachBusyMesh, MESH_FX_KINDS, MESH_FX_POOL_SIZE } from './mesh-fx-pool';

// Preset factories — exposed so Phase 06 can bypass the pool for one-off effects.
export { createThrustLanceMaterial }  from './presets/thrust-lance-material';
export { createShockwaveRingMaterial } from './presets/shockwave-ring-material';
export { createSlashArcMaterial }     from './presets/slash-arc-material';
export { createImpactStarMaterial }   from './presets/impact-star-material';

// ─── Registry ─────────────────────────────────────────────────────────────────

import type { MeshFxKind, MeshFxHandle, MeshFxParams } from './mesh-fx-types';
import { createThrustLanceMaterial }  from './presets/thrust-lance-material';
import { createShockwaveRingMaterial } from './presets/shockwave-ring-material';
import { createSlashArcMaterial }     from './presets/slash-arc-material';
import { createImpactStarMaterial }   from './presets/impact-star-material';

export interface MeshFxRegistryEntry {
  build: (renderer: unknown, params: MeshFxParams) => Promise<MeshFxHandle>;
  /** Plane geometry size [w, h] used for pool slots. */
  defaultSize: [number, number];
  /** Suggested lifetime in seconds for cue sheets. */
  defaultDuration: number;
  poolSize: number;
}

/** Kind → metadata. Consumed by cue-sheet orchestrator (Phase 06) and tests. */
export const MESH_FX_REGISTRY: Record<MeshFxKind, MeshFxRegistryEntry> = {
  'thrust-lance':   { build: createThrustLanceMaterial,   defaultSize: [3.0, 1.5], defaultDuration: 0.50, poolSize: 4 },
  'shockwave-ring': { build: createShockwaveRingMaterial,  defaultSize: [2.5, 2.5], defaultDuration: 0.70, poolSize: 4 },
  'slash-arc':      { build: createSlashArcMaterial,       defaultSize: [2.0, 2.0], defaultDuration: 0.45, poolSize: 4 },
  'impact-star':    { build: createImpactStarMaterial,     defaultSize: [2.0, 2.0], defaultDuration: 0.35, poolSize: 4 },
};
