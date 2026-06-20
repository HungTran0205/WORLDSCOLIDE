/**
 * Cleave skill cue sheet — full-impact tier (steel crescent + ground debris).
 *
 * castScoped: Cleave hits the primary + nearby enemies, emitting one skill-use
 * event per struck target. The orchestrator runs the cast-level cues (crescent /
 * shake / hitstop / sound) ONCE per cast while the `particles` cues fan out to
 * each victim → one wide slash, debris on everyone hit.
 *
 * Connect frame ≈ 330ms (COMBAT_IMPACT_DELAY_S * 1000), matching the attack anim.
 */

import type { SkillCueSheet } from './cue-sheet-types';
import { AUDIO } from '@/audio/audio-keys';

export const CLEAVE_CUE_SHEET: SkillCueSheet = {
  skillId: 'cleave',
  castScoped: true,
  trigger: 'skill-use',
  cues: [
    // Two-layer slash (additive): a wider BLUE glow halo wrapping the belly +
    // a white core crescent on top → sharper blade read. Both FLY from in front
    // of the caster toward the enemy (+X), long axis along world Z, arriving as
    // the hit lands (~330ms). Belly leads.
    { atMs: 90, type: 'mesh', kind: 'cleave-arc', anchor: 'target', fromAnchor: 'caster-front', color: '#3a9bff', scale: 1.4, durationMs: 320 },
    { atMs: 90, type: 'mesh', kind: 'cleave-arc', anchor: 'target', fromAnchor: 'caster-front', color: '#d8e4f2', durationMs: 320 },
    // All impact feedback lands on the connect frame.
    { atMs: 330, type: 'shake',     amplitude: 0.12, frequency: 30, durationS: 0.15 },
    { atMs: 330, type: 'hitstop',   durationMs: 80 },
    { atMs: 330, type: 'particles', presetId: 'gen-hit',       count: 24 },
    { atMs: 330, type: 'particles', presetId: 'ls-earth-slam', count: 16 },
    { atMs: 330, type: 'sound',     audioKey: AUDIO.SFX_CLEAVE },
  ],
};
