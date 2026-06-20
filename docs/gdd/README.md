# Game Design Document (GDD)

The **living** design spec for *2000s A.C — After the Collapse*. Multi-file by design (200-line rule).
Every section is authored **directly from code** (`src/game/{systems,data,state}`) and cites the files
it describes — when the code changes, the section must be updated (see *Keeping in sync* below).

- **Narrative canon** lives in [`../lore/`](../lore/README.md); GDD sections summarize + link, never copy.
- **Lookup data** (asset lists, calculators, guides) lives in [`../reference/`](../reference/).
- **Technical design** is [`../system-architecture.md`](../system-architecture.md) (no GDD section 15).

## Table of Contents

| # | Section | Scope |
|---|---------|-------|
| 01 | [High Concept](./01-high-concept.md) | Fantasy, pillars, first-playable success |
| 02 | [Core Loop & Pillars](./02-core-loop-pillars.md) | Recruit→Build→Dispatch→Resolve→Reward→Upgrade loop |
| 03 | [World & Lore](./03-world-and-lore.md) | Surface summary → links to `lore/` |
| 04 | [Civilizations](./04-civilizations.md) | Playable (Linh Sơn) + roadmap identity |
| 05 | [Characters & Progression](./05-characters-progression.md) | Grade F–S model, stat budgets, combat/guild formulas, upkeep, promotion spec |
| 06 | [Combat](./06-combat.md) | Tick/ATB model, formulas, AI, waves, formations |
| 07 | [Economy](./07-economy.md) | Gold, upkeep, debt, recruit cost, loot, offline |
| 08 | [Guild Hall & Rooms](./08-guild-hall-rooms.md) | Grid placement, room-effect model → [`rooms/`](./rooms/) |
| 09 | [Missions & Quests](./09-missions-quests.md) | Tiers, dispatch, suitability, rewards, arc 1 |
| 10 | [Items & Equipment](./10-items-equipment.md) | Slots/affixes, inventory, crafting, alchemy, loot |
| 11 | [Onboarding & Retention](./11-onboarding-retention.md) | New-game flow, tutorial state machine, first hour |
| 12 | [Art Direction](./12-art-direction.md) | HD-2D language, palette → `reference/asset-list-sprites.md` |
| 12a | [UI Design Language](./12a-ui-design-language.md) | Bronze × parchment UI chrome bible — tokens, motifs, panel anatomy, motion, z-tiers |
| 13 | [Audio Direction](./13-audio-direction.md) | BGM/SFX intent → `reference/asset-list-audio.md` |
| 14 | [UX / UI & i18n](./14-ux-ui-i18n.md) | Panel/HUD conventions, i18next EN/VI |
| 15 | [Items Master Database](./15-items-inventory-system.md) | Comprehensive items/materials/consumables/equipment/recipes lookup — use this for edits |
| 16 | [Linh Sơn Class Skills](./16-linh-son-class-skills.md) | Ability kits for Templar/Forester/Ranger — effects, balance, impl tiers |

### Rooms ([`rooms/`](./rooms/))

One file per guild-hall room: `tavern`, `workshop`, `alchemy`, `infirmary`, `inventory`,
`wood-mining` (Logging Site), `stone-quarry`, `training-yard`. Each cites its `facility-definitions.ts`
entry and production/effect system. (Stone comes only from the Stone Quarry — there is no separate
stone-mining facility. The Training Yard is repurposed from passive EXP to skill-rank training —
see [`rooms/training-yard.md`](./rooms/training-yard.md) and `16-linh-son-class-skills.md`.)

> **Status:** sections are authored progressively. Files marked here but not yet present are in-flight.
> `_src-*` staging files/dirs are temporary authoring seeds and are deleted once consumed.

## Reading order

`01` → `02` (the loop frames everything) → systems (`05`–`07`) → content (`08`–`11`) →
presentation (`12`–`14`). `03`/`04` give world context; full canon is in [`../lore/`](../lore/README.md).

## Keeping in sync

When you change game logic under `src/game/{systems,data,state}/**`, update the matching GDD section.
A non-blocking reminder hook points you to the right file — see
[`sync-guide.md`](./sync-guide.md) for the path→section map and how to enable it.
