import { EmitterShape } from 'r3f-vfx'
import type { VfxPreset } from '../preset-types'

// Linh Sơn — Earth/Mountain/Jungle warriors
// Colors: primary=#f5f0e6, secondary=#8B6914, accent=#D4A017
//
// CONTAINS: existing core presets (fire, smoke, earth-slam, heal)
//         + 3 new ultimate-skill presets for "Đồng Cổ Thất Trảm":
//           • ls-bronze-drum-mark   (meshline circle on ground — sigil)
//           • ls-drum-pulse         (small upward burst on each strike)
//           • ls-flame-wave         (linear meshline + fire wave for strike 7)
//
// Note: meshline category is 'weapon-fx' per preset-types.ts. The 3 new
// meshline entries below use that category — they will land in the Weapon FX
// sidebar group, but are theme-tagged Linh Sơn via name + emoji + colors.
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
   * flame wave on strike 7. Pair with ls-flame-wave (meshline) and animate
   * the EffectTarget along a linear motion path (forward, ~8 units, 900ms).
   * Higher density + longer lifetime than ls-fire so the wave reads big.
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

