/**
 * Combat → VFX preset map. Pure data so combat-fight-controller can grab
 * the same emitter set for every event type without re-deriving the table
 * each frame.
 *
 * Preset IDs reference `src/scene/effects/preset-registry.ts`. If a preset
 * ID changes upstream, update here — TypeScript catches missing IDs at
 * registry compile time, not here, so verify the registry list after any
 * preset rename.
 */

export type CombatVfxEvent = 'hit' | 'crit' | 'heal' | 'death';

export const COMBAT_VFX_PRESETS: Record<CombatVfxEvent, string> = {
  hit: 'gen-hit',    // red-orange debris burst on auto-attack contact
  crit: 'gen-burst', // bright radial burst — pairs with screen shake
  heal: 'ls-heal',   // green/gold particle bloom on healed entity
  death: 'ls-smoke', // dense earthy smoke when entity HP hits zero
};

/** Per-event emit count (most presets emit 1 unit but bursts read better with more). */
export const COMBAT_VFX_COUNTS: Record<CombatVfxEvent, number> = {
  hit: 8,
  crit: 24,
  heal: 16,
  death: 20,
};

/** Wall-clock window event name fired on every crit so the DOM panel can shake. */
export const COMBAT_CRIT_DOM_EVENT = 'combat-vfx-crit';

/** Wall-clock window event the Skip button fires; fight controller owns the
 *  engine ref so it picks this up, snapshots, runs the simulator (D11), and
 *  finalizes — keeps the DOM panel decoupled from R3F-canvas internals. */
export const COMBAT_SKIP_DOM_EVENT = 'combat-skip-requested';
