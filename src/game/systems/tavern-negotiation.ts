/**
 * Tavern negotiation engine — pure math for keeper⇄visitor recruitment rolls.
 *
 * Implements spec §3-6 (docs/feature/tavern-facility.md):
 *  - Archetype-role-based combat-power formula
 *  - Target demand from power × rarity × mood
 *  - Keeper negotiation = floor(CHA×1.5 + INT×0.5) (+ optional trait/equip bonuses)
 *  - 11-slot modifier catalog (§5)
 *  - Success rate = clamp(5, 95, 50 + (kNeg - demand)×0.6 + modSum)
 *  - Margin → 6-tier outcome (§6): comfortable/tight success, counter, soft/hard refuse, insult
 *  - Linear refusal decay capped at -40% (AD8)
 *  - Deterministic via mulberry32(attemptSeed) — anti-save-scum
 *
 * No state mutation. Bundle builder consumes a `TavernGameSnapshot` (caller composes).
 */
import type { Stats, Member, TavernVisitor, AttemptRecord, AttemptOutcome } from '@/game/state/game-state';
import type { CivArchetype } from '@/game/data/civilization-config';
import type { TraitId } from '@/game/data/traits';
import type { ItemID } from '@/game/data/items';
import { mulberry32 } from './seeded-rng';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** AD8: refusal penalty is linear (count × -10%) capped at -40%. */
export const MAX_REFUSAL_PENALTY = 40;

/** Recent refusal window in game-days (spec §6.3). */
export const REFUSAL_DECAY_WINDOW_DAYS = 7;

/** Spec §7.1: counter-offer markup. */
export const COUNTER_OFFER_MULTIPLIER = 1.2;

/** AD9: insult event 30% gone-forever / 70% storm-off split. */
export const INSULT_GONE_FOREVER_CHANCE = 0.3;

/** AD H7: re-invite path bonus modifier (spec §11). */
export const REINVITE_BONUS = 25;

/** AD9: 24h global negotiation debuff after insult window. */
export const POST_INSULT_GLOBAL_DEBUFF = -10;

/**
 * Outcome tier thresholds applied to `margin = roll - rate` (lower margin = better).
 * Each band is `margin <= threshold` (consistent ≤ avoids float boundary slips).
 */
export const TIER_THRESHOLDS = {
  comfortable: -15,
  tight: 0,
  counter: 15,
  softRefuse: 30,
  hardRefuse: 45,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Archetype role mapping (civ archetypes → 4 generic combat roles)
// ─────────────────────────────────────────────────────────────────────────────

export type ArchetypeRole = 'fighter' | 'mage' | 'scout' | 'support';

export const ARCHETYPE_ROLE_MAP: Record<CivArchetype, ArchetypeRole> = {
  warrior: 'fighter',
  sword: 'fighter',
  dualblade: 'fighter',
  scholar: 'mage',
  philosopher: 'mage',
  scout: 'scout',
  engineer: 'support',
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface GiftSpec {
  itemId: ItemID;
  /** `personal` = matches visitor.preferredGiftCategory → +15%; `generic` → +5%. */
  tier: 'generic' | 'personal';
}

/** All 11 modifier slots used by the success-rate formula (spec §5). */
export interface ModifierBundle {
  gift?: GiftSpec;
  shareTraitCount: number;
  guildFame: number;                 // 0-20 from rank/reputation
  factionRep: number;                // DEFERRED — always 0 in MVP
  recentRefusalCount: number;        // raw count; sumModifiers applies cap
  tavernLevel: number;
  treasuryFlex: boolean;             // gold > 10 × hireCost
  keeperPassive: number;             // DEFERRED — Silver Tongue etc. always 0
  tavernReputation: number;          // [-5, +5]
  reinviteBonus: number;             // 0 or REINVITE_BONUS
  globalNegotiationDebuff: number;   // 0 or POST_INSULT_GLOBAL_DEBUFF
}

/** Game-state slice consumed by `buildModifierBundle` — keeps engine decoupled from store. */
export interface TavernGameSnapshot {
  gold: number;
  guildLevel: number;
  tavernLevel: 1 | 2 | 3;
  tavernReputation: number;
  globalNegotiationDebuffUntilDay: number | null;
  currentDay: number;
}

export type SuccessTier = 'comfortable' | 'tight';

export type Outcome =
  | { kind: 'success'; tier: SuccessTier }
  | { kind: 'counter'; mercFeeMultiplier: number }
  | { kind: 'soft-refuse'; cooldownDays: 2; demandBump: 5 }
  | { kind: 'hard-refuse'; cooldownDays: 7 }
  | { kind: 'insult'; goneForeverChance: number; cooldownDays: 7; globalDebuffHours: 24 };

export interface NegotiationResult {
  outcome: Outcome;
  margin: number;
  rate: number;
  roll: number;
  keeperNegotiation: number;
  demand: number;
  modSum: number;
  attemptOutcome: AttemptOutcome;
}

export interface BuildModifierBundleOptions {
  reinvite?: boolean;
  gift?: GiftSpec;
}

// ─────────────────────────────────────────────────────────────────────────────
// Power, demand, keeper negotiation
// ─────────────────────────────────────────────────────────────────────────────

/** Combat-power sum per archetype role (spec §3.2). */
export function totalCombatPower(stats: Stats, role: ArchetypeRole): number {
  switch (role) {
    case 'fighter': return stats.STR + stats.END + stats.DEX + stats.AGI;
    case 'mage':    return stats.INT + stats.END + stats.LCK;
    case 'scout':   return stats.DEX + stats.AGI + stats.LCK;
    case 'support': return stats.INT + stats.CHA + stats.END;
  }
}

/** Visitor's target demand — what the keeper must beat. */
export function targetDemand(visitor: TavernVisitor): number {
  const role = ARCHETYPE_ROLE_MAP[visitor.archetype];
  const power = totalCombatPower(visitor.stats, role);
  return Math.floor(power * 0.4) + visitor.rarity * 5 + visitor.dailyMoodBias;
}

/**
 * Keeper negotiation rating.
 * `traitBonus` / `equipBonus` are MVP placeholders — Silver Tongue / negotiation gear deferred.
 */
export function keeperNegotiation(keeper: Member, traitBonus = 0, equipBonus = 0): number {
  return Math.floor(keeper.stats.CHA * 1.5 + keeper.stats.INT * 0.5) + traitBonus + equipBonus;
}

// ─────────────────────────────────────────────────────────────────────────────
// Modifier catalog
// ─────────────────────────────────────────────────────────────────────────────

/** Count traits shared between keeper and visitor (intersection size). */
export function countSharedTraits(
  keeperTraits: readonly TraitId[],
  visitorTraits: readonly TraitId[],
): number {
  let n = 0;
  for (const t of visitorTraits) if (keeperTraits.includes(t)) n++;
  return n;
}

/** Refusals within the last 7 game-days (success attempts excluded). */
export function decayedRefusalCount(
  history: readonly AttemptRecord[],
  currentDay: number,
): number {
  return history.filter(
    (h) => currentDay - h.day <= REFUSAL_DECAY_WINDOW_DAYS && h.outcome !== 'success',
  ).length;
}

/** Guild fame placeholder — 0-20 derived from guild level until rank/reputation lands. */
export function computeGuildFame(snapshot: TavernGameSnapshot): number {
  return Math.max(0, Math.min(20, snapshot.guildLevel * 4));
}

/** Sum of all 11 modifier slots → percentage points added to base success rate. */
export function sumModifiers(mods: ModifierBundle): number {
  let m = 0;
  if (mods.gift) m += mods.gift.tier === 'personal' ? 15 : 5;
  m += mods.shareTraitCount * 10;
  m += mods.guildFame;
  m += mods.factionRep;
  // AD8: linear -10% per refusal, capped at -40%.
  m += Math.max(-MAX_REFUSAL_PENALTY, mods.recentRefusalCount * -10);
  m += mods.tavernLevel * 2;
  if (mods.treasuryFlex) m += 5;
  m += mods.keeperPassive;
  m += mods.tavernReputation * 5;
  m += mods.reinviteBonus;
  m += mods.globalNegotiationDebuff;
  return m;
}

/** Compose a ModifierBundle from current state — shared by UI preview AND roll execution (AD H5). */
export function buildModifierBundle(
  keeper: Member,
  visitor: TavernVisitor,
  snapshot: TavernGameSnapshot,
  options: BuildModifierBundleOptions = {},
): ModifierBundle {
  const hireCost = hireMercCost(visitor);
  const debuffActive =
    snapshot.globalNegotiationDebuffUntilDay !== null
    && snapshot.currentDay < snapshot.globalNegotiationDebuffUntilDay;
  return {
    gift: options.gift,
    shareTraitCount: countSharedTraits(keeper.traits ?? [], visitor.traits),
    guildFame: computeGuildFame(snapshot),
    factionRep: 0,
    recentRefusalCount: decayedRefusalCount(visitor.attemptHistory, snapshot.currentDay),
    tavernLevel: snapshot.tavernLevel,
    treasuryFlex: snapshot.gold > 10 * hireCost,
    keeperPassive: 0,
    tavernReputation: snapshot.tavernReputation,
    reinviteBonus: options.reinvite ? REINVITE_BONUS : 0,
    globalNegotiationDebuff: debuffActive ? POST_INSULT_GLOBAL_DEBUFF : 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Roll resolution
// ─────────────────────────────────────────────────────────────────────────────

/** Clamped success rate in [5, 95]. */
export function successRate(keeperNeg: number, demand: number, modSum: number): number {
  const base = 50 + (keeperNeg - demand) * 0.6;
  return Math.max(5, Math.min(95, base + modSum));
}

/** Map a margin to its outcome tier (spec §6). */
export function resolveMargin(margin: number): Outcome {
  if (margin <= TIER_THRESHOLDS.comfortable) return { kind: 'success', tier: 'comfortable' };
  if (margin <= TIER_THRESHOLDS.tight)       return { kind: 'success', tier: 'tight' };
  if (margin <= TIER_THRESHOLDS.counter)     return { kind: 'counter', mercFeeMultiplier: COUNTER_OFFER_MULTIPLIER };
  if (margin <= TIER_THRESHOLDS.softRefuse)  return { kind: 'soft-refuse', cooldownDays: 2, demandBump: 5 };
  if (margin <= TIER_THRESHOLDS.hardRefuse)  return { kind: 'hard-refuse', cooldownDays: 7 };
  // AD9: 7-day cooldown + 24h global debuff aligned with hard-refuse fallout.
  return { kind: 'insult', goneForeverChance: INSULT_GONE_FOREVER_CHANCE, cooldownDays: 7, globalDebuffHours: 24 };
}

function outcomeToAttemptOutcome(o: Outcome): AttemptOutcome {
  switch (o.kind) {
    case 'success':     return 'success';
    case 'counter':     return 'counter';
    case 'soft-refuse': return 'soft-refuse';
    case 'hard-refuse': return 'hard-refuse';
    case 'insult':      return 'insult';
  }
}

/** Execute one negotiation attempt deterministically. */
export function rollNegotiation(
  keeper: Member,
  visitor: TavernVisitor,
  mods: ModifierBundle,
  attemptSeed: number,
): NegotiationResult {
  const kNeg = keeperNegotiation(keeper);
  const demand = targetDemand(visitor);
  const modSum = sumModifiers(mods);
  const rate = successRate(kNeg, demand, modSum);
  const rng = mulberry32(attemptSeed);
  const roll = rng() * 100;
  const margin = roll - rate;
  const outcome = resolveMargin(margin);
  return {
    outcome,
    margin,
    rate,
    roll,
    keeperNegotiation: kNeg,
    demand,
    modSum,
    attemptOutcome: outcomeToAttemptOutcome(outcome),
  };
}

/** Roll the 30/70 split for insult fallout. Returns true if visitor is gone forever. */
export function rollInsultGoneForever(seed: number): boolean {
  return mulberry32(seed)() < INSULT_GONE_FOREVER_CHANCE;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hire cost
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cost of hiring a visitor as a one-quest mercenary (spec §7.1).
 * `mercFeeMultiplier` of 1.2 is applied on counter-offer acceptance.
 */
export function hireMercCost(visitor: TavernVisitor, mercFeeMultiplier = 1.0): number {
  const power = totalCombatPower(visitor.stats, ARCHETYPE_ROLE_MAP[visitor.archetype]);
  const base = Math.floor(power * 2.0 + visitor.rarity * 100);
  return Math.floor(base * (1.0 + 0.2 * (visitor.rarity - 1)) * mercFeeMultiplier);
}
