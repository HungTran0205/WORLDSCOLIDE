/**
 * Pierce skill cue sheet — full multi-cue VFX sequence.
 *
 * Timing is relative to the skill-use event; COMBAT_IMPACT_DELAY_S*1000 ≈ 330ms
 * is the connect frame (matches the 8-frame@12fps attack animation).
 *
 * Amplitude/frequency/count params are POC values; Phase 08 owns tuning.
 */

import type { SkillCueSheet } from './cue-sheet-types';
import { AUDIO } from '@/audio/audio-keys';

export const PIERCE_CUE_SHEET: SkillCueSheet = {
  skillId: 'pierce',
  cues: [
    // Lance emerges at t=0 and advances forward over its 450ms lifetime.
    { atMs: 0,   type: 'mesh',      kind: 'thrust-lance',   durationMs: 450 },
    // Trail fires along the lance path for the same window (useFrame loop).
    //{ atMs: 0,   type: 'trail',     durationMs: 450 },
    // First shockwave ring expands at the pre-connect frame.
    { atMs: 280, type: 'mesh',      kind: 'shockwave-ring', durationMs: 300 },
    // Second ring + all impact feedback lands on the connect frame.
    { atMs: 330, type: 'mesh',      kind: 'shockwave-ring', durationMs: 300 },
    { atMs: 330, type: 'shake',     amplitude: 0.15, frequency: 35, durationS: 0.18 },
    { atMs: 330, type: 'hitstop',   durationMs: 110 },
    { atMs: 330, type: 'particles', presetId: 'gen-hit',   count: 30 },
    { atMs: 330, type: 'particles', presetId: 'gen-burst', count: 15 },
    { atMs: 330, type: 'sound',     audioKey: AUDIO.SFX_PIERCE },
    { atMs: 330, type: 'mesh',      kind: 'impact-star',    durationMs: 400 },
  ],
};
