/**
 * mesh-fx-pool — module singleton that pre-warms one MeshFxHandle per slot
 * (N slots × 4 kinds) and leases them out to per-cast drivers.
 *
 * Design goals (owner decisions 2026-06-11):
 *   - Zero per-cast GPU allocation: warm() builds handles once; acquire() /
 *     release() only mutate uniforms and a visible flag.
 *   - Null-safe cold pool: acquire() returns null until warm() completes.
 *     Callers fire onComplete after the nominal lifetime so the slot releases
 *     correctly even when the cue is skipped.
 *   - Per-instance materials: each slot owns its own material (no shared
 *     pipeline-cache dedupe freeze on WebGPU, see idle-sprite-material.ts).
 *
 * MeshFxPoolRoot (pool-root.tsx) registers the THREE.Mesh refs after mount,
 * then calls warm(). The pool applies handle.material to the registered mesh
 * so R3F never needs to re-mount anything per cast.
 */

import type * as THREE from 'three';
import type { MeshFxKind, MeshFxHandle, MeshFxParams, LeaseHandle } from './mesh-fx-types';
import { createThrustLanceMaterial } from './presets/thrust-lance-material';
import { createShockwaveRingMaterial } from './presets/shockwave-ring-material';
import { createSlashArcMaterial } from './presets/slash-arc-material';
import { createImpactStarMaterial } from './presets/impact-star-material';
import { isLowMeshFxQuality } from './mesh-fx-quality';

export const MESH_FX_POOL_SIZE = 4;
export const MESH_FX_KINDS: MeshFxKind[] = [
  'thrust-lance',
  'shockwave-ring',
  'slash-arc',
  'impact-star',
];

const DEFAULT_PARAMS: MeshFxParams = { color: '#a0d0ff', glowColor: '#ffffff', axisAngle: 0 };

type Slot = {
  handle: MeshFxHandle | null;
  mesh:   THREE.Mesh   | null;
  busy:   boolean;
};

// Pre-allocate slot arrays at module load so acquire() never creates arrays.
const _slots: Record<MeshFxKind, Slot[]> = {
  'thrust-lance':   Array.from({ length: MESH_FX_POOL_SIZE }, () => ({ handle: null, mesh: null, busy: false })),
  'shockwave-ring': Array.from({ length: MESH_FX_POOL_SIZE }, () => ({ handle: null, mesh: null, busy: false })),
  'slash-arc':      Array.from({ length: MESH_FX_POOL_SIZE }, () => ({ handle: null, mesh: null, busy: false })),
  'impact-star':    Array.from({ length: MESH_FX_POOL_SIZE }, () => ({ handle: null, mesh: null, busy: false })),
};

let _warmed = false;

// ─── Registration (called by MeshFxPoolRoot) ──────────────────────────────────

/**
 * Register a mounted THREE.Mesh into a pool slot. If a handle was already
 * built (warm() raced ahead), applies the material immediately.
 */
export function registerMesh(kind: MeshFxKind, index: number, mesh: THREE.Mesh | null): void {
  const slot = _slots[kind]?.[index];
  if (!slot) return;
  slot.mesh = mesh;
  if (slot.handle && mesh) mesh.material = slot.handle.material;
}

// ─── Warm (called once per combat-open) ──────────────────────────────────────

async function buildHandle(kind: MeshFxKind, renderer: unknown, lowQuality: boolean): Promise<MeshFxHandle> {
  switch (kind) {
    case 'thrust-lance':   return createThrustLanceMaterial(renderer, DEFAULT_PARAMS, lowQuality);
    case 'shockwave-ring': return createShockwaveRingMaterial(renderer, DEFAULT_PARAMS);
    case 'slash-arc':      return createSlashArcMaterial(renderer, DEFAULT_PARAMS);
    case 'impact-star':    return createImpactStarMaterial(renderer, DEFAULT_PARAMS);
  }
}

/**
 * Build all N×kind material handles once. Idempotent — subsequent calls
 * during the same combat session are no-ops. Rebuilds after dispose().
 */
export async function warm(renderer: unknown): Promise<void> {
  if (_warmed) return;
  _warmed = true;

  // Quality is read once per warm (per combat-open); a mid-session toggle
  // applies on the next combat open. The lance dissolve-noise is dropped on low.
  const lowQuality = isLowMeshFxQuality();

  await Promise.all(
    MESH_FX_KINDS.flatMap((kind) =>
      _slots[kind].map(async (slot) => {
        slot.handle = await buildHandle(kind, renderer, lowQuality);
        // Apply to the mesh if the pool-root registered it before warm finished.
        if (slot.mesh) slot.mesh.material = slot.handle.material;
      }),
    ),
  );
}

// ─── Acquire / Release ────────────────────────────────────────────────────────

/**
 * Acquire a free slot for `kind`. Returns null if pool not yet warm or all
 * N slots of that kind are busy (callers should no-op gracefully).
 * Resets progress to 0 and optionally recolors — no GPU allocation.
 */
export function acquire(kind: MeshFxKind, color?: string): LeaseHandle | null {
  const slot = _slots[kind].find((s) => !s.busy && s.handle !== null && s.mesh !== null);
  if (!slot) return null;

  slot.busy = true;
  slot.handle!.setProgress(0);
  if (color) slot.handle!.setColor?.(color);
  slot.mesh!.visible = true;

  return {
    setProgress: (t)       => { slot.handle!.setProgress(t); },
    setColor:    (hex)     => { slot.handle!.setColor?.(hex); },
    setPosition: (x, y, z) => { slot.mesh!.position.set(x, y, z); },
    release:     ()        => { slot.busy = false; if (slot.mesh) slot.mesh.visible = false; },
  };
}

// ─── Billboard helper (called by pool-root useFrame) ─────────────────────────

/** Invoke cb for every mesh slot that is currently active (busy + visible). */
export function forEachBusyMesh(cb: (mesh: THREE.Mesh) => void): void {
  for (const kind of MESH_FX_KINDS) {
    for (const slot of _slots[kind]) {
      if (slot.busy && slot.mesh?.visible) cb(slot.mesh);
    }
  }
}

// ─── Dispose (called by pool-root on unmount) ─────────────────────────────────

/**
 * Free all handles and reset state. warm() will rebuild on next combat open.
 * Safe to call even if some slots are still busy (combat close transitions
 * happen at result-phase when no casts are in-flight).
 */
export function dispose(): void {
  for (const kind of MESH_FX_KINDS) {
    for (const slot of _slots[kind]) {
      slot.handle?.dispose();
      slot.handle = null;
      slot.mesh   = null;
      slot.busy   = false;
    }
  }
  _warmed = false;
}
