import { EmitterShape, Blending } from 'r3f-vfx'
import type { VfxPreset } from '../preset-types'

// Linh Sơn — Earth/Mountain/Jungle warriors
// Colors: primary=#f5f0e6, secondary=#8B6914, accent=#D4A017
//
// CONTAINS: core particle presets (fire, smoke, earth-slam, heal)
//         + ultimate-skill particle presets for "Đồng Cổ Thất Trảm"
//           (ls-drum-pulse, ls-flame-wave-fire).
export const linhSonPresets: VfxPreset[] = [
  // ─── Core Linh Sơn particle presets ──────────────────────────────────
  {
    id: 'ls-fire',
    name: 'Lửa Rừng (Forest Fire)',
    category: 'linh-son',
    categoryLabel: 'Linh Sơn',
    emoji: '🔥',
    description: 'Rising campfire with ember drift',
    props: {
      maxParticles: 3000,
      size: [0.3, 0.8],
      colorStart: ['#ff6600', '#ffcc00', '#ff0000'],
      colorEnd: ['#ff0000', '#330000'],
      fadeSize: [1, 0.2],
      fadeOpacity: [1, 0],
      gravity: [0, 0.5, 0],
      lifetime: [0.4, 0.8],
      direction: [[-0.3, 0.3], [0.5, 1], [-0.3, 0.3]],
      speed: [0.01, 0.05],
      friction: { intensity: 0.03, easing: 'easeOut' },
      intensity: 10,
    },
  },
  {
    id: 'ls-smoke',
    name: 'Khói Đất (Earth Smoke)',
    category: 'linh-son',
    categoryLabel: 'Linh Sơn',
    emoji: '💨',
    description: 'Dense earthy smoke billowing upward',
    props: {
      maxParticles: 300,
      size: [0.3, 0.6],
      colorStart: ['#8B6914', '#A0845C'],
      colorEnd: ['#333333'],
      fadeSize: [0.5, 1.5],
      fadeOpacity: [0.6, 0],
      gravity: [0, 0.5, 0],
      lifetime: [3, 5],
      direction: [[-0.1, 0.1], [0.3, 0.5], [-0.1, 0.1]],
      speed: [0.02, 0.05],
      turbulence: { intensity: 1.2, frequency: 0.8, speed: 0.3 },
    },
  },
  {
    id: 'ls-earth-slam',
    name: 'Sơn Thể (Earth Slam)',
    category: 'linh-son',
    categoryLabel: 'Linh Sơn',
    emoji: '🌋',
    description: 'Ground impact debris burst — passive ability',
    props: {
      maxParticles: 500,
      size: [0.05, 0.15],
      colorStart: ['#D4A017', '#8B6914'],
      colorEnd: ['#553311'],
      fadeOpacity: [1, 0],
      lifetime: [0.5, 1.2],
      speed: [0.3, 0.8],
      gravity: [0, -2, 0],
      emitterShape: EmitterShape.DISK,
      emitterRadius: [0, 0.5],
      startPositionAsDirection: true,
      collision: { plane: { y: 0 }, bounce: 0.3, friction: 0.5 },
    },
  },
  {
    id: 'ls-heal',
    name: 'Chữa Lành (Forest Heal)',
    category: 'linh-son',
    categoryLabel: 'Linh Sơn',
    emoji: '🌿',
    description: 'Rising green motes with golden pollen',
    props: {
      maxParticles: 400,
      size: [0.04, 0.12],
      colorStart: ['#88dd44', '#D4A017'],
      colorEnd: ['#ffdd33'],
      fadeOpacity: [0.8, 0],
      gravity: [0, 0.3, 0],
      lifetime: [2, 4],
      direction: [[-0.2, 0.2], [0.5, 1], [-0.2, 0.2]],
      speed: [0.01, 0.03],
      turbulence: { intensity: 0.5, frequency: 1.2, speed: 0.2 },
      intensity: 3,
    },
  },

  // ─── Ancestral Blessings aura ────────────────────────────────────────

  /**
   * ls-blessing-aura — slow gold wisps rising from a blessed entity while the
   * Ancestral Blessings buff is active. Supplies the motion + glow the baked
   * gold-outline overlay can't (the overlay is a static composite). Emitted
   * continuously (throttled) by combat-fight-controller at each blessed, living
   * entity's feet; gentle anti-gravity (+y) carries the wisps up through the body.
   * `stretchBySpeed` elongates each mote along its velocity so the rising gold
   * reads as thin strands ("hair"/wisps) instead of round dots. Additive + small
   * size + low per-emit count → cheap enough for a persistent whole-fight loop.
   */
  {
    id: 'ls-blessing-aura',
    name: 'Phước Lành (Blessing Aura)',
    category: 'linh-son',
    categoryLabel: 'Linh Sơn',
    emoji: '✨',
    description: 'Rising gold wisps around a blessed entity (Ancestral Blessings)',
    props: {
      maxParticles: 400,
      size: [0.08, 0.2],
      colorStart: ['#ccb03f', '#ffcc44', '#D4A017'],
      colorEnd: ['#ff9933', '#b9253d'],
      fadeSize: [0.9, 0.3],
      fadeOpacity: [0.9, 0],
      // Gentle rise (down from 1.2) so the wisps drift up slowly.
      gravity: [0, 0.7, 0],
      // Longer life + mostly-vertical motion → taller, slower-reading strands.
      lifetime: [2, 3.5],
      direction: [[-0.2, 0.2], [0.7, 1], [-0.2, 0.2]],
      speed: [0.015, 0.045],
      emitterShape: EmitterShape.DISK,
      emitterRadius: [0, 0.5],
      startPositionAsDirection: false,
      turbulence: { intensity: 0.5, frequency: 0.9, speed: 0.3 },
      // Stretch motes along velocity → thin hair-like gold strands, not dots.
      stretchBySpeed: { factor: 7, maxStretch: 9 },
      blending: Blending.ADDITIVE,
      intensity: 4,
    },
  },

  /**
   * ls-blessing-dust — an expanding RING of fine golden smoke that pulses
   * outward along the ground around a blessed entity (a shockwave-style ring,
   * not scattered puffs). Pairs with the rising `ls-blessing-aura` wisps
   * (vertical) — this is the horizontal ground layer. Each emission spawns the
   * grains together on a thin perimeter circle (`emitterSurfaceOnly` + a narrow
   * `emitterRadius` annulus); `startPositionAsDirection` on the flat DISK makes
   * every grain expand radially so the whole circle grows as one ring. Low
   * turbulence + a narrow speed range keep the ring coherent instead of breaking
   * into clumps; friction slows the ring as it spreads, then it fades. Emitted by
   * combat-fight-controller on a ~0.6s cadence → repeating ring waves.
   * (CombatVfxRoot forces additive, so the smoke glows gold — on-theme for the
   * blessed buff rather than earthy brown.)
   */
  {
    id: 'ls-blessing-dust',
    name: 'Vòng Tổ Tiên (Ancestral Ring)',
    category: 'linh-son',
    categoryLabel: 'Linh Sơn',
    emoji: '🌀',
    description: 'Expanding golden smoke ring pulsing outward around a blessed entity',
    props: {
      maxParticles: 600,
      // Fine soft grains — fadeSize growth merges them into a smooth ring band.
      size: [0.05, 0.12],
      colorStart: ['#e8cf8a', '#d4a017', '#c2a878'],
      colorEnd: ['#8B6914', '#3a2a10'],
      // Grow + soft semi-transparent start → diffuse, smoke-like ring.
      fadeSize: [0.7, 1.8],
      fadeOpacity: [0.6, 0],
      // Near-flat ground ring (tiny settle, not a falling burst).
      gravity: [0, -0.1, 0],
      lifetime: [0.8, 1.3],
      // Narrow speed range → the ring stays a coherent circle as it expands.
      speed: [0.25, 0.4],
      emitterShape: EmitterShape.DISK,
      // Thin perimeter annulus → grains start on a circle, not a filled disk.
      emitterRadius: [0.38, 0.7],
      emitterSurfaceOnly: true,
      // Spawn offset doubles as velocity → the circle expands outward as a ring
      // (no explicit `direction`, same radial pattern as ls-earth-slam).
      startPositionAsDirection: true,
      // Low swirl only — high turbulence would shatter the ring into clumps.
      turbulence: { intensity: 0.25, frequency: 0.8, speed: 0.3 },
      // Ring slows as it spreads, then fades in place.
      friction: { intensity: 0.08, easing: 'easeOut' },
      blending: Blending.ADDITIVE,
      intensity: 5,
    },
  },

  // ─── Ultimate-skill particle presets: "Đồng Cổ Thất Trảm" ────────────

  /**
   * ls-drum-pulse — small upward ember burst that fires on each of the
   * 7 drum strikes. Spawns at the bronze sigil's center, kicks up gold
   * sparks like dust shaken loose by the impact. Short-lived; multiple
   * instances overlap on later strikes for accumulating intensity.
   */
  {
    id: 'ls-drum-pulse',
    name: 'Trống Pulse (Drum Pulse)',
    category: 'linh-son',
    categoryLabel: 'Linh Sơn',
    emoji: '🥁',
    description: 'Upward gold-ember burst per drum strike (ult)',
    props: {
      maxParticles: 600,
      size: [0.06, 0.18],
      colorStart: ['#ffdd66', '#D4A017', '#ff9933'],
      colorEnd: ['#552200', '#220000'],
      fadeSize: [1, 0.4],
      fadeOpacity: [1, 0],
      gravity: [0, -1.5, 0],
      lifetime: [0.4, 0.9],
      direction: [[-0.4, 0.4], [0.7, 1], [-0.4, 0.4]],
      speed: [0.15, 0.5],
      emitterShape: EmitterShape.DISK,
      emitterRadius: [0.1, 1.2],
      startPositionAsDirection: false,
      friction: { intensity: 0.04, easing: 'easeOut' },
      turbulence: { intensity: 0.6, frequency: 1.5, speed: 0.4 },
      intensity: 12,
    },
  },

  /**
   * ls-flame-wave-fire — fire-particle stream that travels with the linear
   * flame wave on strike 7. Animate the EffectTarget along a linear motion
   * path (forward, ~8 units, 900ms). Higher density + longer lifetime than
   * ls-fire so the wave reads big.
   */
  {
    id: 'ls-flame-wave-fire',
    name: 'Hỏa Triều (Flame Wave Fire)',
    category: 'linh-son',
    categoryLabel: 'Linh Sơn',
    emoji: '🔥',
    description: 'Dense forward-traveling fire body for ult finisher wave',
    props: {
      maxParticles: 5000,
      size: [0.4, 1.2],
      colorStart: ['#ffffff', '#ffdd44', '#ff6600'],
      colorEnd: ['#aa1100', '#220000'],
      fadeSize: [1.4, 0.2],
      fadeOpacity: [1, 0],
      gravity: [0, 0.4, 0],
      lifetime: [0.6, 1.2],
      direction: [[-0.4, 0.4], [0.3, 0.9], [-0.4, 0.4]],
      speed: [0.05, 0.18],
      emitterShape: EmitterShape.DISK,
      emitterRadius: [0, 0.8],
      startPositionAsDirection: false,
      turbulence: { intensity: 1.4, frequency: 1.0, speed: 0.5 },
      intensity: 25,
    },
  },
]

