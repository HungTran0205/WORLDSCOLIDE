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
  hit: 20,
  crit: 24,
  heal: 16,
  death: 20,
};

/**
 * Windup delay (seconds) before hit VFX (spark + slash/beam mesh) appear, so they
 * land on the attack animation's connect/release frame (~frame 4 of the 8-frame,
 * 12fps attack → 4/12 ≈ 0.33s) instead of during the swing/draw. Shared by the
 * controller's spark emit and CombatImpactLayer's mesh delay so they stay synced.
 */
export const COMBAT_IMPACT_DELAY_S = 0.33;

/**
 * Per-particle size [min, max] override for the hit spark. The gen-hit preset
 * defaults to tiny debris (0.05–0.15); this enlarges it so the spark reads
 * clearly against large enemy sprites without re-baking the preset geometry.
 */
export const COMBAT_HIT_SPARK_SIZE: [number, number] = [0.1, 0.3];

/**
 * Hit-spark debris color (colorStart pool). Warm orange — applied to BOTH ally
 * and enemy attacks, overriding the gen-hit preset's red/yellow start so every
 * auto-attack spark reads orange. The preset's colorEnd (also orange) is kept.
 */
export const COMBAT_HIT_SPARK_COLOR: string[] = ['#ff8a1e', '#ffb347'];

/**
 * Shared impact palette for the combat attack VFX — the slash/beam meshes
 * (CombatImpactLayer). LinhSon default: warm amber ink + cyan glow. Future civs
 * branch this per attacker.
 */
export const COMBAT_IMPACT_COLORS = {
  /** Melee slash ink/edge color (amber). */
  ink: '#ffcc44',
  /** Additive glow-core for the slash/beam mesh (cyan). */
  glow: '#44aaff',
} as const;

/** Wall-clock window event name fired on every crit so the DOM panel can shake. */
export const COMBAT_CRIT_DOM_EVENT = 'combat-vfx-crit';

/** Wall-clock window event the Skip button fires; fight controller owns the
 *  engine ref so it picks this up, snapshots, runs the simulator (D11), and
 *  finalizes — keeps the DOM panel decoupled from R3F-canvas internals. */
export const COMBAT_SKIP_DOM_EVENT = 'combat-skip-requested';
