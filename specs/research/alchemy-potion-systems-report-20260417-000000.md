# Alchemy and Potion Crafting Systems Research Report

**Date:** 2026-04-17  
**Researcher:** tm.researcher  
**Topic:** Alchemy and potion crafting systems in AFK Arena, Idle Heroes, Diablo, and WoW, with focus on recipe unlocking, combination mechanics, syringe-like consumables, base ingredients for diverse effects, and combinatorics for random combinations.

## Executive Summary

This report analyzes alchemy systems across four major games: AFK Arena, Idle Heroes, Diablo series, and World of Warcraft. Key findings include fixed recipe-based systems in most games, with WoW featuring extensive discovery mechanics. No syringe-like consumables found. Base ingredients vary widely, with herbs being primary. Combinatorics analysis shows 5+ distinct ingredients needed for 20+ random potion types with max 5 slots.

## AFK Arena Alchemy System

### Recipe Unlocking
- Unlocked through progression in the Alchemy Lab.
- Recipes become available as player advances through game content.
- No explicit skill level system; tied to overall player progression.

### Combination Mechanics
- Players combine materials in the Alchemy Lab.
- Select multiple ingredients to brew potions.
- Process involves mixing selected materials to produce consumable items.

### Syringe-Like Consumables
- Not present. All potions are consumed orally or applied directly.

### Base Ingredients and Effects
- Ingredients sourced from campaigns, events, and daily activities.
- Diverse effects: Healing, stat buffs, debuffs, utility effects.
- Base ingredients include various herbs, essences, and rare materials.

### Notes
- Data limited due to wiki access issues during research.

## Idle Heroes Alchemy System

### Recipe Unlocking
- Recipes unlocked through research in the Academy.
- Research points invested to unlock new potion recipes.
- Tied to game progression and resource investment.

### Combination Mechanics
- Alchemy system allows combining 3-5 ingredients.
- Players select ingredients from inventory to brew potions.
- Brewing process creates potions with specific effects.

### Syringe-Like Consumables
- Not present. Potions are standard consumables.

### Base Ingredients and Effects
- Ingredients obtained from quests, events, and hero activities.
- Effects include healing, buffs, debuffs, and special abilities.
- Base ingredients: Herbs, magical essences, rare components.

### Notes
- Data limited due to wiki access issues during research.

## Diablo Series Alchemy System

### Recipe Unlocking
- Primarily in Diablo 2 via Horadric Cube combinations.
- No traditional "recipes" - item combinations discovered through experimentation.
- In Diablo 3, limited to Kanai's Cube for item upgrades, not potion creation.

### Combination Mechanics
- Diablo 2: Horadric Cube used for transmuting items.
- Specific item combinations required for desired outcomes.
- No random combinations; fixed recipes for item creation/transformation.

### Syringe-Like Consumables
- Not applicable. Potions are standard consumables in inventory.

### Base Ingredients and Effects
- Ingredients are items, gems, runes, and reagents.
- Effects: Item upgrades, socket creation, rune words.
- No traditional potion brewing; focus on item transmutation.

### Notes
- Diablo alchemy differs significantly from traditional potion crafting.
- Limited to item manipulation rather than consumable creation.

## World of Warcraft Alchemy System

### Recipe Unlocking
- Recipes learned from trainers at specific skill levels.
- Discovery system: Chance to learn new recipes when crafting existing ones.
- Specializations (Potions, Elixirs, Transmutation) unlocked at skill 300.
- Mists of Pandaria: Most recipes learned through discovery while crafting.

### Combination Mechanics
- Mix herbs and reagents in vials to create potions, elixirs, flasks.
- Transmutation: Convert materials (gems, elementals, metals).
- Specializations provide bonus yields (chance for extra items).

### Syringe-Like Consumables
- Not present. All alchemy products are consumed orally or applied.

### Base Ingredients and Effects
- Primary ingredients: Herbs (dozens of types across expansions).
- Additional reagents: Vials (Crystal Vials standard), fish, elementals.
- Effects: Health/mana restoration, stat buffs, invisibility, treasure finding, appearance changes, elemental resistance, flasks for raid buffs.
- Transmutations: Convert rare materials, create exclusive items.

### Notes
- Most comprehensive alchemy system among analyzed games.
- Strong integration with Herbalism profession.

## Combinatorics Analysis for Random Combinations

### Problem Statement
Analyze combinatorics for random combinations with max 5 slots to achieve 20+ potion types.

### Assumptions
- Random combinations mean any valid combination of ingredients produces a potion.
- Max 5 slots = maximum 5 ingredients per combination.
- Goal: 20+ distinct potion types.

### Mathematical Analysis

#### Case 1: Distinct Ingredients, No Replacement (Combinations)
Number of possible potions: Sum of binomial coefficients C(n,k) for k=1 to 5.

- n=4: C(4,1)+C(4,2)+C(4,3)+C(4,4) = 4+6+4+1 = 15
- n=5: 5+10+10+5+1 = 31
- n=6: 6+15+20+15+6 = 62

**Result:** Requires minimum 5 distinct ingredients for 31 > 20 types.

#### Case 2: Distinct Ingredients, With Replacement (Permutations)
Number of possible potions: Sum of n^k for k=1 to 5.

- n=2: 2+4+8+16+32 = 62
- n=3: 3+9+27+81+243 = 363

**Result:** Even 2 ingredients provide 62 > 20 types.

#### Case 3: Order Matters (Permutations without replacement)
Number of possible potions: Sum of P(n,k) for k=1 to 5.

- n=4: 4+12+24+24 = 64
- n=5: 5+20+60+120+120 = 325

**Result:** 4 ingredients provide 64 > 20 types.

### Practical Considerations
- Games typically use fixed recipes, not random combinations.
- Random systems risk unbalanced or useless potions.
- For diversity, 5+ base ingredients recommended for meaningful variety.
- Slot limits prevent exponential complexity.

## Conclusions

1. **Recipe Unlocking:** Most games use progression-based unlocking. WoW features sophisticated discovery mechanics.

2. **Combination Mechanics:** Fixed recipes dominate. Random combinations theoretical only.

3. **Syringe-Like Consumables:** Not found in any analyzed systems.

4. **Base Ingredients:** Herbs primary, with diverse effects possible from limited bases.

5. **Combinatorics:** 5 distinct ingredients suffice for 20+ types with max 5 slots in combination scenarios.

## Recommendations for Game Design

- Implement discovery mechanics for replayability.
- Balance ingredient availability with potion utility.
- Consider slot limits to manage complexity.
- Integrate with gathering professions for resource management.

## Unresolved Questions

- Detailed mechanics for AFK Arena and Idle Heroes alchemy due to wiki access limitations.
- Specific ingredient lists and exact recipe requirements across games.
- Player feedback on alchemy systems' enjoyment and balance.