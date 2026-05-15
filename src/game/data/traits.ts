/**
 * Trait pool for Tavern visitors and keepers.
 *
 * Phase 01 stub — only string identity stored on Member/TavernVisitor.
 * Named-passive math (Silver Tongue, Recruiter, Storyteller) and the
 * Cautious-gate behaviour are DEFERRED — phase 03/05 will consume the IDs
 * via a generic modifier resolver; this file just lists them.
 */

export type TraitId =
  | 'silver-tongue'   // keeper: +5% negotiation
  | 'recruiter'       // keeper: +5% negotiation vs rare+ visitors
  | 'storyteller'     // keeper: +5% negotiation if visitor has a personality trait
  | 'hot-headed'      // visitor: lower insult-margin threshold
  | 'cautious'        // visitor: must merc-first (DEFERRED — accept value but don't gate)
  | 'loyal';          // visitor: +10 RP on accept

export type TraitCategory = 'keeper' | 'visitor' | 'shared';

export interface TraitDef {
  id: TraitId;
  displayKey: string;       // i18n key
  descKey: string;          // i18n key
  category: TraitCategory;
}

export const TRAIT_POOL: TraitDef[] = [
  { id: 'silver-tongue', displayKey: 'trait.silverTongue.name', descKey: 'trait.silverTongue.desc', category: 'keeper' },
  { id: 'recruiter',     displayKey: 'trait.recruiter.name',    descKey: 'trait.recruiter.desc',    category: 'keeper' },
  { id: 'storyteller',   displayKey: 'trait.storyteller.name',  descKey: 'trait.storyteller.desc',  category: 'keeper' },
  { id: 'hot-headed',    displayKey: 'trait.hotHeaded.name',    descKey: 'trait.hotHeaded.desc',    category: 'visitor' },
  { id: 'cautious',      displayKey: 'trait.cautious.name',     descKey: 'trait.cautious.desc',     category: 'visitor' },
  { id: 'loyal',         displayKey: 'trait.loyal.name',        descKey: 'trait.loyal.desc',        category: 'visitor' },
];

export function getTraitDef(id: TraitId): TraitDef | undefined {
  return TRAIT_POOL.find((t) => t.id === id);
}
