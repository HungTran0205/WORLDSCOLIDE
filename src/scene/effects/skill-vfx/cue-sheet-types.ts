/**
 * Cue-sheet type definitions for the skill VFX orchestrator.
 *
 * A SkillCueSheet maps a skillId → sequence of timed cues. Cues are
 * dispatched relative to the skill-use event timestamp. Each cue type
 * drives a different feedback layer:
 *   mesh      → pool-acquired MeshFx primitive (thrust-lance / shockwave-ring / …)
 *   trail     → continuous particle emission along the lance path (useFrame loop)
 *   particles → one-shot preset emit at impact point
 *   shake     → camera impulse via camera-impulse-store
 *   hitstop   → presentation-clock freeze via hitstop-clock
 *   sound     → playSFX call
 */

import type { MeshFxKind } from '../mesh-fx/mesh-fx-types';

export type Cue =
  | { atMs: number; type: 'mesh';      kind: MeshFxKind; durationMs: number }
  | { atMs: number; type: 'trail';     durationMs: number }
  | { atMs: number; type: 'particles'; presetId: string;  count?: number }
  | { atMs: number; type: 'shake';     amplitude: number; frequency: number; durationS: number }
  | { atMs: number; type: 'hitstop';   durationMs: number }
  | { atMs: number; type: 'sound';     audioKey: string };

export interface SkillCueSheet {
  skillId: string;
  cues: Cue[];
}
