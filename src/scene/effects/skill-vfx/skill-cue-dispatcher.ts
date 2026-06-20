/**
 * skill-cue-dispatcher — pure scheduler for imperative cues.
 *
 * Handles particles / shake / hitstop / sound cues via setTimeout(atMs).
 * Mesh and trail cues are intentionally excluded — they need the R3F useFrame
 * context and pool handles, so CombatSkillVfxLayer owns them directly.
 *
 * Pure module (no React imports) so it can be unit-tested without R3F.
 * Returns timer IDs so the caller can clearTimeout() on cleanup.
 */

import type { Cue } from './cue-sheet-types';
import { pushCameraImpulse } from '@/scene/combat/camera-impulse/camera-impulse-store';
import { triggerHitstop } from '@/scene/combat/hitstop/hitstop-clock';
import { playSFX } from '@/audio/audio-manager';

export interface DispatcherFns {
  /** Emit particles from a registered VFX preset at the given world position. */
  emitParticles: (presetId: string, pos: [number, number, number], count?: number) => void;
}

/**
 * Schedule all imperative cues (particles / shake / hitstop / sound) for one
 * skill cast. Mesh and trail cues are skipped — caller handles them.
 *
 * @param cues   - Full cue sheet for the skill.
 * @param pos    - Impact world position (target torso height).
 * @param fns    - Injected emit/push/play callbacks.
 * @returns      - Array of timer IDs; call clearTimeout on each to cancel.
 */
export function dispatchImperativeCues(
  cues: Cue[],
  pos: [number, number, number],
  fns: DispatcherFns,
): ReturnType<typeof setTimeout>[] {
  const timers: ReturnType<typeof setTimeout>[] = [];

  for (const cue of cues) {
    switch (cue.type) {
      case 'particles': {
        const { presetId, count } = cue;
        timers.push(
          setTimeout(() => { fns.emitParticles(presetId, pos, count); }, cue.atMs),
        );
        break;
      }
      case 'shake': {
        const { amplitude, frequency, durationS } = cue;
        timers.push(
          setTimeout(() => {
            pushCameraImpulse({ amplitude, frequency, durationS });
          }, cue.atMs),
        );
        break;
      }
      case 'hitstop': {
        const { durationMs } = cue;
        timers.push(
          setTimeout(() => { triggerHitstop(durationMs); }, cue.atMs),
        );
        break;
      }
      case 'sound': {
        const { audioKey } = cue;
        timers.push(
          setTimeout(() => { playSFX(audioKey); }, cue.atMs),
        );
        break;
      }
      // mesh and trail are handled by CombatSkillVfxLayer — skip here.
      default:
        break;
    }
  }

  return timers;
}
