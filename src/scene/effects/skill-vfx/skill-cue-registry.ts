/**
 * Skill cue registry — maps skillId → SkillCueSheet.
 *
 * hasCueSheet / getCueSheet are the public query API consumed by both:
 *   - CombatSkillVfxLayer  (dispatch the sheet)
 *   - CombatImpactLayer    (suppression guard — skip archetype mesh)
 *   - emitVfxFromEvents    (suppression guard — skip default gen-hit)
 *
 * Sheets are registered at module init (import side-effect). Order does not
 * matter — each skillId maps to exactly one sheet; pierce-cue-sheet takes
 * precedence over any civ-preset entry for the same id by being registered first.
 */

import type { SkillCueSheet } from './cue-sheet-types';
import { PIERCE_CUE_SHEET } from './pierce-cue-sheet';
import { CIV_PRESET_CUE_SHEETS } from './civ-preset-cue-sheets';

const _registry: Record<string, SkillCueSheet> = {};

function _register(sheet: SkillCueSheet): void {
  _registry[sheet.skillId] = sheet;
}

// Pierce first so it can't be overwritten by the civ-preset loop.
_register(PIERCE_CUE_SHEET);
for (const sheet of CIV_PRESET_CUE_SHEETS) _register(sheet);

/** True when a cue sheet exists for the given skillId. */
export function hasCueSheet(skillId: string | undefined): boolean {
  return skillId != null && skillId in _registry;
}

/** Returns the cue sheet for skillId, or null if none registered. */
export function getCueSheet(skillId: string | undefined): SkillCueSheet | null {
  if (skillId == null) return null;
  return _registry[skillId] ?? null;
}
