# 01 — High Concept

**Game:** *2000s A.C — After the Collapse*
**Genre:** HD-2D Idle Guild Builder Auto-RPG
**Platform:** Browser (itch.io); Progressive Web App target

---

## Elevator Pitch

You are the founder of a guild rising inside a civilization on the edge of collapse. Recruit the
right people, build the right rooms, dispatch the right teams — and watch your guild grow even while
you are offline. Every decision (who you recruit, what you build, where you send your crew) matters
in a world where four civilizations compete and the world is held together by Ether.

---

## Player Fantasy

The player wants to feel like a **Guild Master who reads people and situations**:

- **Recruit the right person** — talent-spot from a tavern full of strangers.
- **Assign teams correctly** — match skills and civilization synergies to mission demands.
- **Grow the hall** — unlock rooms that compound progression across sessions.
- **Return to progress** — idle returns feel meaningful, not flat.

Anti-fantasy: the player is NOT a war general issuing real-time orders, an explorer wandering an
open world, or a crafter deep in resource management. Those elements exist at the edges, not the
center.

---

## Three Design Pillars

### Pillar 1 — Guild Management Matters

Every decision in guild management should have a legible consequence:
- Recruiting wrong archetype for a mission tier = clear failure signal.
- Under-investing in a room = visible bottleneck on resources or member capacity.
- Civilization composition of the team changes mission suitability outcomes.

### Pillar 2 — Idle Progression Feels Rewarding

Whether the player is actively playing or returning after 8 hours:
- Missions resolve in the background with accumulated rewards.
- Room production ticks offline at a throttled rate.
- The guild hall looks more populated and upgraded — not static — on return.

### Pillar 3 — Civilizations Create Variety

Civilizations are not cosmetic. Each defines a distinct role/skill/synergy profile
(`src/game/data/civilization-config.ts`):
- Stat bonus multipliers per civ (`CIV_CONFIG[civ].statBonuses`).
- Unique passive ability per civ (e.g., Linh Sơn's `Sơn Thể`, Đế Quốc's `Điện Thế Chỉ Huy`).
- Mission suitability skews per archetype profile.

---

## Anti-Pillars (Explicit Out-of-Scope for Initial Ship)

These are **not** designed into the first release:

| Anti-pillar | Reason excluded |
|---|---|
| Open-world exploration | Conflicts with idle core loop |
| Full real-time manual combat | Auto-RPG model is the identity |
| Multiplayer | Out of scope; pure single-player |
| Extensive room types (>8 in v1) | Depth over breadth for launch |
| Complex multi-step crafting chains | Item system kept accessible |
| Massive lore dumps before loop hook | World is discovered through play |

---

## First-Playable Success Criteria

The build succeeds if a new player can complete this sequence in one session:

1. Choose founder archetype (Templar / Forester / Ranger) and name the guild.
2. Build at least one room (e.g., Tavern).
3. Recruit at least one mercenary and one full member.
4. Dispatch a mission with that team.
5. Receive a legible win or loss result with reward (or penalty).
6. Return after an offline gap and see measurable progress.

*Verified via new-game flow spec: see [`11-onboarding-retention.md`](./11-onboarding-retention.md).*

---

*Full narrative canon: [`../lore/canon-revision-v2.md`](../lore/canon-revision-v2.md)*
*Code entry point: `src/game/data/civilization-config.ts`, `src/game/systems/character-creation.ts`*
