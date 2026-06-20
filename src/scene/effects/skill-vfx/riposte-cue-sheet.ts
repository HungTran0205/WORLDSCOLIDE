/**
 * Riposte skill cue sheet — stance tier (blue-silver parry, NO hitstop).
 *
 * Self-cast: fires on the engine's `effect-applied:'riposte'` event (targetId =
 * caster). All cues anchor on the caster. A blue guard ring pulses out, a
 * blade-glint arc sweeps, and a sharp parry spark snaps — signalling the counter
 * stance is up. No hitstop (this is not an impact).
 */

import type { SkillCueSheet } from './cue-sheet-types';
import { AUDIO } from '@/audio/audio-keys';

export const RIPOSTE_CUE_SHEET: SkillCueSheet = {
  skillId: 'riposte',
  trigger: 'effect-applied:riposte',
  cues: [
    { atMs: 0,  type: 'sound',     audioKey: AUDIO.SFX_RIPOSTE },
    // Defensive guard pulse + blade glint, both on the caster.
    { atMs: 0,  type: 'mesh',      kind: 'shockwave-ring', anchor: 'caster', color: '#7ab8ff', durationMs: 350 },
    { atMs: 60, type: 'mesh',      kind: 'slash-arc',      anchor: 'caster', color: '#eaf4ff', durationMs: 220 },
    { atMs: 0,  type: 'particles', presetId: 'ls-parry-glint', count: 12 },
    // Firm step into stance — light, no hitstop.
    { atMs: 0,  type: 'shake',     amplitude: 0.05, frequency: 28, durationS: 0.10 },
  ],
};
