/**
 * Rally skill cue sheet — warcry tier (hot gold-orange, NO hitstop).
 *
 * Self-cast buff: fires on the engine's `skill-buff-applied` event (caster =
 * casterId, no target). All cues anchor on the caster. Twin sound-wave rings
 * pulse out in rhythm with a rising orange rage column — a morale surge. Hot
 * palette is deliberately distinct from the gold Ancestral aura. No hitstop.
 */

import type { SkillCueSheet } from './cue-sheet-types';
import { AUDIO } from '@/audio/audio-keys';

export const RALLY_CUE_SHEET: SkillCueSheet = {
  skillId: 'rally',
  trigger: 'skill-buff-applied',
  cues: [
    { atMs: 0,   type: 'sound',     audioKey: AUDIO.SFX_RALLY },
    // Twin warcry rings (rhythm) + rising rage column, all on the caster.
    { atMs: 0,   type: 'mesh',      kind: 'shockwave-ring', anchor: 'caster', color: '#ffb24d', durationMs: 400 },
    { atMs: 130, type: 'mesh',      kind: 'shockwave-ring', anchor: 'caster', color: '#ffb24d', durationMs: 350 },
    { atMs: 0,   type: 'particles', presetId: 'ls-warcry-updraft', count: 16 },
    { atMs: 0,   type: 'shake',     amplitude: 0.08, frequency: 25, durationS: 0.20 },
  ],
};
