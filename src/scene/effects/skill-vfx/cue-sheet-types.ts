/**
 * Cue-sheet type definitions for the skill VFX orchestrator.
 *
 * A SkillCueSheet maps a skillId → sequence of timed cues. Cues are
 * dispatched relative to the triggering event timestamp. Each cue type
 * drives a different feedback layer:
 *   mesh      → pool-acquired MeshFx primitive (thrust-lance / shockwave-ring / …)
 *   trail     → continuous particle emission along the lance path (useFrame loop)
 *   particles → one-shot preset emit at impact point
 *   shake     → camera impulse via camera-impulse-store
 *   hitstop   → presentation-clock freeze via hitstop-clock
 *   sound     → playSFX call
 */

import type { MeshFxKind } from '../mesh-fx/mesh-fx-types';

/**
 * Where a mesh cue is positioned.
 *   target       → on the victim (default for damage skills)
 *   caster       → on the caster (self-cast buffs/stances)
 *   caster-front → just ahead of the caster, toward the enemy side
 *   cluster      → midpoint between caster and victim — centers a wide slash
 *                  over the struck cluster so it reads as sweeping through them
 * Omitted → legacy behaviour: thrust-lance uses the caster↔target midpoint,
 * every other kind uses the target.
 */
export type MeshAnchor = 'target' | 'caster' | 'caster-front' | 'cluster';

/**
 * Which combat event activates a sheet. Self-cast skills don't emit `skill-use`,
 * so buffs/stances route through their own event types. Typed (not loose strings)
 * so the orchestrator's match guard is compiler-checked.
 */
export type SkillVfxTrigger = 'skill-use' | 'skill-buff-applied' | 'effect-applied:riposte';

export type Cue =
  // `fromAnchor` makes the mesh TRAVEL: it lerps from anchorPos(fromAnchor) to
  // anchorPos(anchor) over its lifetime (e.g. a Cleave slash flying caster→enemy).
  // Omitted → the mesh stays put at `anchor`.
  | { atMs: number; type: 'mesh';      kind: MeshFxKind; durationMs: number; anchor?: MeshAnchor; fromAnchor?: MeshAnchor; color?: string; scale?: number }
  | { atMs: number; type: 'trail';     durationMs: number }
  | { atMs: number; type: 'particles'; presetId: string;  count?: number }
  | { atMs: number; type: 'shake';     amplitude: number; frequency: number; durationS: number }
  | { atMs: number; type: 'hitstop';   durationMs: number }
  | { atMs: number; type: 'sound';     audioKey: string };

export interface SkillCueSheet {
  skillId: string;
  cues: Cue[];
  /**
   * Event that fires this sheet. Defaults to 'skill-use' when omitted (preserves
   * Pierce + all damage-skill civ sheets).
   */
  trigger?: SkillVfxTrigger;
  /**
   * Multi-victim skills (e.g. Cleave) emit one event per struck target. When true,
   * cast-level cues (mesh/shake/hitstop/sound) fire ONCE per caster per event-batch
   * while `particles` cues still emit per victim → one slash, debris on everyone.
   * Omitted/false → one full sequence per event (preserves Pierce's one-lance-per-target).
   */
  castScoped?: boolean;
}
