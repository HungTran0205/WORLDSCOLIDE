/**
 * Negotiation engine tests — verifies spec §3-6 math, AD8 cap, AD9 split, and
 * deterministic roll given attemptSeed.
 */

import { describe, it, expect } from 'vitest';
import type { Stats, Member, TavernVisitor, AttemptRecord } from '@/game/state/game-state';
import {
  ARCHETYPE_ROLE_MAP,
  COUNTER_OFFER_MULTIPLIER,
  INSULT_GONE_FOREVER_CHANCE,
  MAX_REFUSAL_PENALTY,
  REINVITE_BONUS,
  TIER_THRESHOLDS,
  buildModifierBundle,
  computeGuildFame,
  countSharedTraits,
  decayedRefusalCount,
  hireMercCost,
  keeperNegotiation,
  resolveMargin,
  rollInsultGoneForever,
  rollNegotiation,
  successRate,
  sumModifiers,
  targetDemand,
  totalCombatPower,
  type ModifierBundle,
  type TavernGameSnapshot,
} from './tavern-negotiation';
import { attemptSeed } from './seeded-rng';

// ─── Test fixtures ───────────────────────────────────────────────────────────

const zeroStats = (): Stats => ({ STR: 0, END: 0, INT: 0, DEX: 0, CHA: 0, LCK: 0, AGI: 0 });

function member(id: string, partial: Partial<Stats>, traits: Member['traits'] = []): Member {
  return {
    id,
    name: id,
    level: 1,
    exp: 0,
    stats: { ...zeroStats(), ...partial },
    unallocatedPoints: 0,
    skill: null,
    status: 'idle',
    injuredUntil: null,
    civilization: 'LinhSon',
    isFounder: false,
    rank: 'MEMBER',
    missionsCompleted: 0,
    rarity: 1,
    traits,
  };
}

function visitor(overrides: Partial<TavernVisitor>): TavernVisitor {
  return {
    id: 'v1',
    archetype: 'warrior',
    civilization: 'LinhSon',
    rarity: 1,
    level: 1,
    stats: zeroStats(),
    derivedDemand: 0,
    dailyMoodBias: 0,
    traits: [],
    preferredGiftCategory: 'consumable',
    attemptHistory: [],
    veteranTag: false,
    spawnedDay: 0,
    ...overrides,
  };
}

function snapshot(overrides: Partial<TavernGameSnapshot> = {}): TavernGameSnapshot {
  return {
    gold: 0,
    guildLevel: 1,
    tavernLevel: 1,
    tavernReputation: 0,
    globalNegotiationDebuffUntilDay: null,
    currentDay: 0,
    ...overrides,
  };
}

const baseMods = (overrides: Partial<ModifierBundle> = {}): ModifierBundle => ({
  shareTraitCount: 0,
  guildFame: 0,
  factionRep: 0,
  recentRefusalCount: 0,
  tavernLevel: 0,
  treasuryFlex: false,
  keeperPassive: 0,
  tavernReputation: 0,
  reinviteBonus: 0,
  globalNegotiationDebuff: 0,
  ...overrides,
});

// ─── ARCHETYPE_ROLE_MAP ──────────────────────────────────────────────────────

describe('ARCHETYPE_ROLE_MAP', () => {
  it('covers all 6 civ archetypes', () => {
    expect(ARCHETYPE_ROLE_MAP.warrior).toBe('fighter');
    expect(ARCHETYPE_ROLE_MAP.dualblade).toBe('fighter');
    expect(ARCHETYPE_ROLE_MAP.scholar).toBe('mage');
    expect(ARCHETYPE_ROLE_MAP.philosopher).toBe('mage');
    expect(ARCHETYPE_ROLE_MAP.scout).toBe('scout');
    expect(ARCHETYPE_ROLE_MAP.engineer).toBe('support');
  });
});

// ─── totalCombatPower ────────────────────────────────────────────────────────

describe('totalCombatPower', () => {
  it('fighter = STR+END+DEX+AGI', () => {
    const s = { ...zeroStats(), STR: 5, END: 4, DEX: 3, AGI: 2, INT: 99, LCK: 99, CHA: 99 };
    expect(totalCombatPower(s, 'fighter')).toBe(14);
  });
  it('mage = INT+END+LCK', () => {
    const s = { ...zeroStats(), INT: 10, END: 5, LCK: 3 };
    expect(totalCombatPower(s, 'mage')).toBe(18);
  });
  it('scout = DEX+AGI+LCK', () => {
    const s = { ...zeroStats(), DEX: 7, AGI: 6, LCK: 2 };
    expect(totalCombatPower(s, 'scout')).toBe(15);
  });
  it('support = INT+CHA+END', () => {
    const s = { ...zeroStats(), INT: 4, CHA: 8, END: 3 };
    expect(totalCombatPower(s, 'support')).toBe(15);
  });
});

// ─── targetDemand ────────────────────────────────────────────────────────────

describe('targetDemand', () => {
  it('floor(power × 0.4) + rarity×5 + moodBias', () => {
    // fighter power = 10, rarity=2, mood=+3 → floor(4) + 10 + 3 = 17
    const v = visitor({
      archetype: 'warrior',
      stats: { ...zeroStats(), STR: 5, END: 3, DEX: 1, AGI: 1 },
      rarity: 2,
      dailyMoodBias: 3,
    });
    expect(targetDemand(v)).toBe(17);
  });

  it('respects archetype role mapping', () => {
    // scholar = mage role: power = INT+END+LCK = 6, rarity=1, mood=0 → floor(2.4)+5+0 = 7
    const v = visitor({
      archetype: 'scholar',
      stats: { ...zeroStats(), INT: 4, END: 1, LCK: 1, STR: 99 /* ignored */ },
      rarity: 1,
      dailyMoodBias: 0,
    });
    expect(targetDemand(v)).toBe(7);
  });
});

// ─── keeperNegotiation ───────────────────────────────────────────────────────

describe('keeperNegotiation', () => {
  it('= floor(CHA×1.5 + INT×0.5)', () => {
    const k = member('k', { CHA: 14, INT: 8 }); // 21 + 4 = 25
    expect(keeperNegotiation(k)).toBe(25);
  });
  it('adds traitBonus + equipBonus', () => {
    const k = member('k', { CHA: 10, INT: 0 }); // 15
    expect(keeperNegotiation(k, 5, 3)).toBe(23);
  });
  it('floors fractional CHA×1.5', () => {
    const k = member('k', { CHA: 1, INT: 0 }); // floor(1.5) = 1
    expect(keeperNegotiation(k)).toBe(1);
  });
});

// ─── successRate ─────────────────────────────────────────────────────────────

describe('successRate (spec §4.3 examples)', () => {
  it('newbie (Neg=25) vs common (Demand=22), no mods → ~52%', () => {
    expect(successRate(25, 22, 0)).toBeCloseTo(51.8, 2);
  });
  it('mid keeper (40) + matched gift (+15) vs Demand=32 → ~70%', () => {
    expect(successRate(40, 32, 15)).toBeCloseTo(69.8, 2);
  });
  it('max keeper (60) vs Demand=70 → 44%', () => {
    expect(successRate(60, 70, 0)).toBe(44);
  });
  it('newbie vs legendary Demand=83 → 15.2% (NOT clamped — corrects spec arithmetic)', () => {
    expect(successRate(25, 83, 0)).toBeCloseTo(15.2, 2);
  });
  it('clamps at lower bound 5', () => {
    expect(successRate(0, 200, 0)).toBe(5);
  });
  it('clamps at upper bound 95', () => {
    expect(successRate(200, 0, 50)).toBe(95);
  });
});

// ─── sumModifiers ────────────────────────────────────────────────────────────

describe('sumModifiers', () => {
  it('empty bundle = 0', () => {
    expect(sumModifiers(baseMods())).toBe(0);
  });

  it('generic gift = +5, personal gift = +15', () => {
    expect(sumModifiers(baseMods({ gift: { itemId: 'gift', tier: 'generic' } as never }))).toBe(5);
    expect(sumModifiers(baseMods({ gift: { itemId: 'gift', tier: 'personal' } as never }))).toBe(15);
  });

  it('shareTraitCount × 10', () => {
    expect(sumModifiers(baseMods({ shareTraitCount: 3 }))).toBe(30);
  });

  it('recentRefusalCount × -10, capped at -40 (AD8)', () => {
    expect(sumModifiers(baseMods({ recentRefusalCount: 3 }))).toBe(-30);
    expect(sumModifiers(baseMods({ recentRefusalCount: 4 }))).toBe(-MAX_REFUSAL_PENALTY);
    expect(sumModifiers(baseMods({ recentRefusalCount: 8 }))).toBe(-MAX_REFUSAL_PENALTY);
  });

  it('tavernLevel × 2', () => {
    expect(sumModifiers(baseMods({ tavernLevel: 3 }))).toBe(6);
  });

  it('treasuryFlex = +5 when true', () => {
    expect(sumModifiers(baseMods({ treasuryFlex: true }))).toBe(5);
    expect(sumModifiers(baseMods({ treasuryFlex: false }))).toBe(0);
  });

  it('tavernReputation × 5', () => {
    expect(sumModifiers(baseMods({ tavernReputation: 4 }))).toBe(20);
    expect(sumModifiers(baseMods({ tavernReputation: -3 }))).toBe(-15);
  });

  it('reinviteBonus passes through', () => {
    expect(sumModifiers(baseMods({ reinviteBonus: 25 }))).toBe(25);
  });

  it('globalNegotiationDebuff passes through (negative)', () => {
    expect(sumModifiers(baseMods({ globalNegotiationDebuff: -10 }))).toBe(-10);
  });

  it('combined: full positive stack', () => {
    const mods = baseMods({
      gift: { itemId: 'g', tier: 'personal' } as never,  // +15
      shareTraitCount: 1,                                  // +10
      guildFame: 12,                                       // +12
      tavernLevel: 3,                                      // +6
      treasuryFlex: true,                                  // +5
      tavernReputation: 4,                                 // +20
      reinviteBonus: 25,                                   // +25
    });
    expect(sumModifiers(mods)).toBe(93);
  });
});

// ─── resolveMargin (spec §6 tier classifier) ─────────────────────────────────

describe('resolveMargin', () => {
  it('margin ≤ -15 → comfortable success', () => {
    expect(resolveMargin(-20)).toEqual({ kind: 'success', tier: 'comfortable' });
    expect(resolveMargin(TIER_THRESHOLDS.comfortable)).toEqual({ kind: 'success', tier: 'comfortable' });
  });

  it('-15 < margin ≤ 0 → tight success', () => {
    expect(resolveMargin(-5)).toEqual({ kind: 'success', tier: 'tight' });
    expect(resolveMargin(0)).toEqual({ kind: 'success', tier: 'tight' });
  });

  it('0 < margin ≤ 15 → counter', () => {
    expect(resolveMargin(10)).toEqual({ kind: 'counter', mercFeeMultiplier: COUNTER_OFFER_MULTIPLIER });
    expect(resolveMargin(15)).toEqual({ kind: 'counter', mercFeeMultiplier: COUNTER_OFFER_MULTIPLIER });
  });

  it('15 < margin ≤ 30 → soft-refuse', () => {
    expect(resolveMargin(20)).toEqual({ kind: 'soft-refuse', cooldownDays: 2, demandBump: 5 });
    expect(resolveMargin(30)).toEqual({ kind: 'soft-refuse', cooldownDays: 2, demandBump: 5 });
  });

  it('30 < margin ≤ 45 → hard-refuse', () => {
    expect(resolveMargin(40)).toEqual({ kind: 'hard-refuse', cooldownDays: 7 });
    expect(resolveMargin(45)).toEqual({ kind: 'hard-refuse', cooldownDays: 7 });
  });

  it('margin > 45 → insult (AD9: 7-day cooldown + 24h global debuff)', () => {
    expect(resolveMargin(50)).toEqual({
      kind: 'insult',
      goneForeverChance: INSULT_GONE_FOREVER_CHANCE,
      cooldownDays: 7,
      globalDebuffHours: 24,
    });
  });
});

// ─── rollNegotiation determinism ─────────────────────────────────────────────

describe('rollNegotiation', () => {
  it('is deterministic for same attemptSeed', () => {
    const k = member('k', { CHA: 14, INT: 8 });
    const v = visitor({
      archetype: 'warrior',
      stats: { ...zeroStats(), STR: 5, END: 3, DEX: 1, AGI: 1 },
      rarity: 2,
      dailyMoodBias: 3,
    });
    const seed = attemptSeed(1234, v.id, 0);
    const a = rollNegotiation(k, v, baseMods(), seed);
    const b = rollNegotiation(k, v, baseMods(), seed);
    expect(a).toEqual(b);
  });

  it('different seeds → different rolls (almost surely)', () => {
    const k = member('k', { CHA: 14, INT: 8 });
    const v = visitor({ archetype: 'warrior', stats: { ...zeroStats(), STR: 5 } });
    const a = rollNegotiation(k, v, baseMods(), attemptSeed(1, v.id, 0));
    const b = rollNegotiation(k, v, baseMods(), attemptSeed(2, v.id, 0));
    expect(a.roll).not.toBe(b.roll);
  });

  it('populates computed fields (rate, demand, kNeg, modSum)', () => {
    const k = member('k', { CHA: 14, INT: 8 });            // kNeg = 25
    const v = visitor({
      archetype: 'warrior',
      stats: { ...zeroStats(), STR: 5, END: 3, DEX: 1, AGI: 1 },   // power = 10
      rarity: 2,
      dailyMoodBias: 3,                                              // demand = 4+10+3 = 17
    });
    const res = rollNegotiation(k, v, baseMods({ tavernLevel: 2 }), 42);
    expect(res.keeperNegotiation).toBe(25);
    expect(res.demand).toBe(17);
    expect(res.modSum).toBe(4);                                      // tavernLevel × 2
    expect(res.rate).toBeCloseTo(50 + (25 - 17) * 0.6 + 4, 2);       // 58.8
    expect(res.margin).toBeCloseTo(res.roll - res.rate, 10);
  });
});

// ─── decayedRefusalCount (spec §6.3 + AD8) ───────────────────────────────────

describe('decayedRefusalCount', () => {
  const hist: AttemptRecord[] = [
    { day: 10, margin: -5, outcome: 'success' },     // success — excluded
    { day: 11, margin: 8, outcome: 'counter' },      // within 7d — included
    { day: 8, margin: 20, outcome: 'soft-refuse' },  // within 7d — included
    { day: 2, margin: 50, outcome: 'insult' },       // > 7d old — excluded
  ];

  it('counts non-success outcomes within 7 days', () => {
    expect(decayedRefusalCount(hist, 15)).toBe(2);
  });

  it('returns 0 when history empty', () => {
    expect(decayedRefusalCount([], 5)).toBe(0);
  });

  it('boundary: day-7 exactly is included (delta = 7)', () => {
    const h: AttemptRecord[] = [{ day: 0, margin: 25, outcome: 'soft-refuse' }];
    expect(decayedRefusalCount(h, 7)).toBe(1);
    expect(decayedRefusalCount(h, 8)).toBe(0);
  });

  it('sumModifiers applied to count gives -40 cap at 4+ refusals', () => {
    expect(sumModifiers(baseMods({ recentRefusalCount: 4 }))).toBe(-MAX_REFUSAL_PENALTY);
    expect(sumModifiers(baseMods({ recentRefusalCount: 99 }))).toBe(-MAX_REFUSAL_PENALTY);
  });
});

// ─── hireMercCost ────────────────────────────────────────────────────────────

describe('hireMercCost', () => {
  it('rarity 1: base = floor(power×2 + 100), mult = 1.0', () => {
    const v = visitor({
      archetype: 'warrior',
      stats: { ...zeroStats(), STR: 5, END: 3, DEX: 1, AGI: 1 }, // power = 10
      rarity: 1,
    });
    expect(hireMercCost(v)).toBe(Math.floor(120 * 1.0)); // 120
  });

  it('rarity 5: mult = 1.8 (scaled)', () => {
    const v = visitor({
      archetype: 'warrior',
      stats: { ...zeroStats(), STR: 5, END: 3, DEX: 1, AGI: 1 }, // power = 10
      rarity: 5,
    });
    // base = floor(10×2 + 500) = 520; mult = 1 + 0.2×4 = 1.8 → 936
    expect(hireMercCost(v)).toBe(936);
  });

  it('mercFeeMultiplier applies on top (counter-offer 1.2×)', () => {
    const v = visitor({
      archetype: 'warrior',
      stats: { ...zeroStats(), STR: 5, END: 3, DEX: 1, AGI: 1 },
      rarity: 1,
    });
    expect(hireMercCost(v, COUNTER_OFFER_MULTIPLIER)).toBe(Math.floor(120 * 1.2)); // 144
  });
});

// ─── countSharedTraits ───────────────────────────────────────────────────────

describe('countSharedTraits', () => {
  it('counts intersection', () => {
    expect(countSharedTraits(['silver-tongue', 'loyal'], ['loyal', 'hot-headed'])).toBe(1);
    expect(countSharedTraits(['silver-tongue', 'loyal'], ['silver-tongue', 'loyal'])).toBe(2);
  });
  it('returns 0 when no overlap', () => {
    expect(countSharedTraits(['silver-tongue'], ['loyal'])).toBe(0);
  });
  it('handles empty inputs', () => {
    expect(countSharedTraits([], [])).toBe(0);
    expect(countSharedTraits([], ['loyal'])).toBe(0);
  });
});

// ─── computeGuildFame ────────────────────────────────────────────────────────

describe('computeGuildFame', () => {
  it('0 at guild level 0', () => {
    expect(computeGuildFame(snapshot({ guildLevel: 0 }))).toBe(0);
  });
  it('scales linearly (× 4)', () => {
    expect(computeGuildFame(snapshot({ guildLevel: 3 }))).toBe(12);
  });
  it('caps at 20', () => {
    expect(computeGuildFame(snapshot({ guildLevel: 99 }))).toBe(20);
  });
});

// ─── buildModifierBundle ─────────────────────────────────────────────────────

describe('buildModifierBundle', () => {
  it('composes all fields from keeper + visitor + snapshot + options', () => {
    const k = member('k', { CHA: 10, INT: 4 }, ['silver-tongue', 'loyal']);
    const v = visitor({
      traits: ['loyal'],                       // 1 shared
      archetype: 'warrior',
      stats: { ...zeroStats(), STR: 2, END: 2, DEX: 1, AGI: 1 }, // power = 6
      rarity: 1,
      attemptHistory: [{ day: 3, margin: 25, outcome: 'soft-refuse' }],
    });
    const snap = snapshot({
      gold: 100_000,                           // > 10 × hireCost → treasuryFlex
      guildLevel: 2,                            // fame = 8
      tavernLevel: 2,
      tavernReputation: 1,
      currentDay: 5,                            // 5 - 3 = 2 ≤ 7 → 1 refusal
      globalNegotiationDebuffUntilDay: 10,      // active (5 < 10)
    });
    const mods = buildModifierBundle(k, v, snap, {
      reinvite: true,
      gift: { itemId: 'wood' as never, tier: 'generic' },
    });

    expect(mods.shareTraitCount).toBe(1);
    expect(mods.guildFame).toBe(8);
    expect(mods.factionRep).toBe(0);
    expect(mods.recentRefusalCount).toBe(1);
    expect(mods.tavernLevel).toBe(2);
    expect(mods.treasuryFlex).toBe(true);
    expect(mods.keeperPassive).toBe(0);
    expect(mods.tavernReputation).toBe(1);
    expect(mods.reinviteBonus).toBe(REINVITE_BONUS);
    expect(mods.globalNegotiationDebuff).toBe(-10);
    expect(mods.gift?.tier).toBe('generic');
  });

  it('global debuff is 0 once window has elapsed', () => {
    const k = member('k', { CHA: 10 });
    const v = visitor({});
    const snap = snapshot({
      currentDay: 10,
      globalNegotiationDebuffUntilDay: 8,
    });
    expect(buildModifierBundle(k, v, snap).globalNegotiationDebuff).toBe(0);
  });

  it('uses [] when keeper.traits is undefined (legacy save)', () => {
    const k = member('k', { CHA: 10 });
    delete (k as { traits?: unknown }).traits;
    const v = visitor({ traits: ['loyal'] });
    expect(buildModifierBundle(k, v, snapshot()).shareTraitCount).toBe(0);
  });
});

// ─── Insult fallout (AD9 30/70 split) ────────────────────────────────────────

describe('rollInsultGoneForever', () => {
  it('is deterministic given seed', () => {
    expect(rollInsultGoneForever(42)).toBe(rollInsultGoneForever(42));
  });

  it('distributes ~30% gone-forever over many seeds', () => {
    const N = 5000;
    let gone = 0;
    for (let i = 0; i < N; i++) if (rollInsultGoneForever(i)) gone++;
    const rate = gone / N;
    // ±3% tolerance on a 30% nominal split — well within mulberry32 sampling noise.
    expect(Math.abs(rate - INSULT_GONE_FOREVER_CHANCE)).toBeLessThan(0.03);
  });
});
