/**
 * Bridges canvas-space projected entity positions to the DOM HUD layer.
 *
 * The combat scene runs inside the shared world canvas (D8) but the HP bars
 * and damage popups live as absolute-positioned <div>s in the combat panel
 * (the plan calls out DOM-cheaper-than-troika for many transient elements).
 * A `useFrame` publisher inside the canvas writes screen coords here at ~30Hz;
 * the HUD subscribes selectively per entity id.
 *
 * Coords are CSS pixels relative to the viewport (window). HUD adds container
 * offsets if the overlay isn't full-bleed.
 */

import { create } from 'zustand';

export interface ScreenPos {
  x: number;     // CSS pixels from viewport left
  y: number;     // CSS pixels from viewport top
  visible: boolean;
}

export interface DamageNumber {
  id: number;
  entityId: string;
  /** Display text (e.g. "120", "120 CRIT", "+45") */
  text: string;
  /** Color category — drives CSS class */
  kind: 'normal' | 'crit' | 'heal' | 'poison';
  /** Wall-clock ms when spawned (for cleanup) */
  spawnedAt: number;
}

interface CombatProjectionStore {
  /** Map of entityId → screen position */
  positions: Map<string, ScreenPos>;
  /** Active damage popups (FIFO, capped) */
  damages: DamageNumber[];

  setPositions: (next: Map<string, ScreenPos>) => void;
  spawnDamage: (entityId: string, text: string, kind: DamageNumber['kind']) => void;
  pruneDamages: (olderThanMs: number) => void;
  clear: () => void;
}

const MAX_ACTIVE_DAMAGES = 64;
let damageIdSeq = 0;

export const useCombatProjectionStore = create<CombatProjectionStore>()((set) => ({
  positions: new Map(),
  damages: [],

  setPositions: (next) => set({ positions: next }),

  spawnDamage: (entityId, text, kind) =>
    set((s) => {
      const next: DamageNumber[] = [
        ...s.damages,
        { id: ++damageIdSeq, entityId, text, kind, spawnedAt: performance.now() },
      ];
      // Cap pool so a hellish AOE storm can't unbounded-grow
      if (next.length > MAX_ACTIVE_DAMAGES) {
        next.splice(0, next.length - MAX_ACTIVE_DAMAGES);
      }
      return { damages: next };
    }),

  pruneDamages: (olderThanMs) =>
    set((s) => {
      const cutoff = performance.now() - olderThanMs;
      const filtered = s.damages.filter((d) => d.spawnedAt >= cutoff);
      if (filtered.length === s.damages.length) return s;
      return { damages: filtered };
    }),

  clear: () => set({ positions: new Map(), damages: [] }),
}));
