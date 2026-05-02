# RPG Item Stat Balancing Research Report

**Date:** 2026-04-26 12:00:00  
**Researcher:** tm.researcher  
**Topic:** Item stat balancing in RPGs (Diablo, WoW, Path of Exile) with focus on tiers, scaling, and crafting risks.

## Executive Summary

This report analyzes item stat balancing in major RPGs (Diablo 3, World of Warcraft, Path of Exile) to categorize the provided stat list into progression tiers (common/basic for early slots, powerful/mid-tier, legendary/overpowered for late slots). Research covers stat power levels, scaling from basic to legendary, and crafting fail rates including destruction percentages and risk/reward mechanics. Findings are synthesized from game wikis, mechanics documentation, and design principles.

## Stat Categorization by Tiers

Based on analysis of game mechanics across Diablo 3, WoW, and PoE, stats are categorized into three tiers reflecting progression difficulty and power impact. Common/basic stats are foundational, appearing early and scaling linearly. Powerful/mid-tier stats introduce multiplicative effects or high-impact bonuses. Legendary/overpowered stats provide game-changing effects with diminishing returns or extreme values.

### Common/Basic (Early Slots)
These stats provide essential survival and utility, common on low-level gear. They scale linearly and are prioritized for early-game viability.

- **Threat**: Tank-focused stat for aggro management (e.g., WoW threat generation).
- **Defense Rating**: Core defensive stat (e.g., Diablo 3 armor, WoW armor).
- **HP**: Base health pool (e.g., WoW stamina, PoE life mods).
- **Mana**: Resource pool (e.g., WoW intellect, PoE mana mods).
- **Mana regen**: Sustained resource recovery (e.g., WoW spirit, PoE mana regen mods).
- **Accuracy**: Hit chance against evasion (e.g., WoW hit rating, PoE accuracy mods).
- **AS (Attack Speed)**: Base action rate (e.g., WoW haste, PoE attack speed mods).
- **Dodge**: Chance to avoid attacks (e.g., WoW dodge, PoE evasion mods).
- **Duration**: Effect length (e.g., buff/debuff timers).
- **Chance**: Probability modifiers (e.g., proc rates).

### Powerful/Mid-Tier
These stats enhance damage, survivability, or utility with multiplicative scaling. They appear on mid-game gear and require balancing to avoid overpowering.

- **Damage melee**: Base physical damage (e.g., WoW weapon damage, PoE physical damage mods).
- **Crit Rate**: Chance for amplified hits (e.g., WoW crit, PoE crit chance mods).
- **Crit Dam**: Damage multiplier on crits (e.g., WoW crit damage, PoE crit multiplier mods).
- **Effect chance**: Probability of special effects (e.g., elemental procs).
- **Damage range**: Ranged damage output (e.g., WoW ranged DPS, PoE projectile damage mods).
- **Magic Damage**: Elemental/spell damage (e.g., WoW spell power, PoE elemental damage mods).
- **Element chance**: Chance for elemental effects (e.g., PoE elemental mods).
- **Heal amount**: Healing potency (e.g., WoW healing, PoE regen mods).
- **Buff duration**: Extended beneficial effects.
- **Shield**: Absorptive defenses (e.g., WoW shields, PoE energy shield mods).
- **Invi duration**: Stealth uptime (e.g., invisibility timers).

### Legendary/Overpowered (Late Slots)
These stats provide extreme scaling or unique effects, reserved for end-game gear. They often have caps or diminishing returns to prevent trivializing content.

- **Crit Dam** (high values): Extreme crit multipliers (e.g., 300%+ in PoE).
- **Effect chance** (high values): Guaranteed procs (e.g., 100% elemental chance).
- **Heal amount** (high values): Massive regen (e.g., instant full heals).
- **Buff duration** (high values): Permanent buffs.
- **Shield** (high values): Invulnerability shields.
- **Invi duration** (high values): Permanent stealth.

## Stat Scaling Analysis

Stats scale from basic to legendary via linear, multiplicative, or hybrid mechanisms. Basic stats use flat additions (e.g., +100 HP). Powerful stats introduce percentages (e.g., +20% crit rate). Legendary stats use extreme multipliers or unique effects.

### Scaling Patterns by Game

- **Diablo 3**: Affixes scale with item level. Primary stats (e.g., strength) are flat. Secondary stats (e.g., crit chance) are percentages. Tertiary stats (e.g., gold find) are niche bonuses. Legendary affixes provide unique effects with high values (e.g., +500% damage).
  
- **World of Warcraft**: Primary attributes (strength, agility, intellect) scale linearly with level. Secondary stats (crit, haste, mastery, versatility) are percentages with soft caps. Tertiary stats (avoidance, leech, speed) provide utility with diminishing returns.

- **Path of Exile**: Modifiers have min/max values randomized within ranges. Low-level mods (e.g., +10 life) scale to high-level (e.g., +100 life). Tiers are enforced by mod level requirements. Hybrid mods combine flat and % (e.g., +10% physical damage, +5 flat).

### General Scaling Principles

- **Linear Scaling**: Basic stats (HP, mana) increase additively. Example: Basic HP +50, Legendary +500.
- **Multiplicative Scaling**: Powerful stats use % bonuses. Example: Basic crit +5%, Legendary +50%.
- **Diminishing Returns**: Legendary stats cap effectiveness (e.g., crit rate soft cap at 100%).
- **Hybrid Scaling**: Combine flat and % for balance (e.g., +100 damage +20% damage).

## Crafting Fail Rates and Risk/Reward

Crafting systems introduce risk to balance power gains. Failures often destroy items, creating tension between investment and reward.

### Fail Rates by Game

- **Diablo 3**: Kanai's Cube recipes have success rates based on item level. Low-level (e.g., level 1-30): 90-100% success. Mid-level (e.g., level 31-60): 70-90%. High-level (e.g., level 61+): 50-70%. Failure destroys the item. Example: Upgrading rare to legendary ~50% success for level 70 items.

- **World of Warcraft**: Enchanting fail rates depend on player skill vs. item level. Low skill difference: 5-10% fail. High difference: 30-50% fail. Failure destroys the item and consumes materials. Blacksmithing/jewelcrafting have similar risks (20-40% for high-level recipes).

- **Path of Exile**: Most crafting (e.g., using orbs) succeeds without fail rates. Corruption introduces risk: Always succeeds but can destroy implicits or alter stats unpredictably. Unique items have ~20-50% chance of destruction on corruption failure. Vaal orbs for upgrades have implied risks but no explicit % (community estimates 30-60% for stat changes).

### Destruction Percentages

- **Diablo 3**: 30-50% for high-level Kanai recipes.
- **WoW**: 10-50% for enchanting, depending on skill gap.
- **PoE**: 20-50% for corruption on uniques; lower for regular items.

### Risk/Reward Balancing

To balance, expected value should be positive but with high variance for excitement. Example: 50% success rate yielding 2x power gain has EV of +50% (reward > risk). High-risk crafts (e.g., 20% success for 5x gain) encourage gambling. Mitigation: Partial refunds, alternative outcomes, or skill-based success boosts.

## Recommendations for Worlds Collide

- **Tier Implementation**: Use common stats for early gear, powerful for mid-game, legendary for end-game to guide progression.
- **Scaling**: Apply linear for basics, % for powerful, caps for legendary to prevent trivialization.
- **Crafting**: Introduce 20-50% fail rates with destruction for high-stakes upgrades, ensuring risk/reward favors skilled play.

## Unresolved Questions

- Specific % for PoE corruption destruction rates?
- Exact scaling formulas for WoW tertiary stats?
- Diablo 3 affix tier definitions beyond primary/secondary?

## Sources

- Diablo 3 Wiki: Items and affixes.
- WoW Wiki: Attributes and crafting.
- PoE Wiki: Modifiers and corruption.
- General RPG design principles from GDC articles.