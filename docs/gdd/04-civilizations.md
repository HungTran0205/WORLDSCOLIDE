# 04 — Civilizations

**Game:** *2000s A.C — After the Collapse*

> **Code source of truth:** `src/game/data/civilization-config.ts` (type `Civilization`, `CIV_CONFIG`,
> `RECRUITABLE_UNITS`). Archetype stat profiles: `src/game/data/characters.ts → CIV_ARCHETYPE_PROFILES`.
> Founder presets (Linh Sơn only): `src/game/data/founder-archetypes.ts`.
>
> **Lore depth** for each civ lives in [`../lore/faction-bible-v2.md`](../lore/faction-bible-v2.md);
> this section covers **gameplay design identity only** — no bible prose is duplicated here.

---

## Playable Status at a Glance

| Civilization | Code ID | Status | Recruitable units |
|---|---|---|---|
| **Linh Sơn** | `LinhSon` | **Playable NOW** | 3 (Templar, Forester, Ranger) |
| **Đế Quốc** | `DeQuoc` | Planned — not yet playable | 0 (`RECRUITABLE_UNITS: []`) |
| **Thiên Lữ** | `ThienLu` | Planned — not yet playable | 0 (`RECRUITABLE_UNITS: []`) |
| **Eliza** | *(not in code)* | Roadmap — not yet implemented | — |

*`RECRUITABLE_UNITS` at `civilization-config.ts:152–160` is the gating mechanism. Any civ with an
empty array cannot spawn tavern recruits by construction.*

---

## Linh Sơn — Full Design Identity

> **Status: Playable.** Only civ with active `RECRUITABLE_UNITS` entries.

### Gameplay Role

`Tank / Defender` — mountain-blood endurance. Excels at absorbing damage and sustaining through
attrition. Best suited for missions that punish low END or require knockback resistance.

### Stat Bonuses (`civilization-config.ts:57–61`)

| Stat | Multiplier | Effect |
|---|---|---|
| END | ×1.2 | +20% endurance at character creation |
| DEX | ×1.1 | +10% dexterity |
| STR | ×1.1 | +10% strength |

Bonuses applied once at creation via `applyCivBonuses()` (`civilization-config.ts:163–170`).

### Passive — Sơn Thể (`civilization-config.ts:63–66`)

> HP < 30% → END +30%, knockback resist

Activates when the member is near death. Rewards keeping injured Linh Sơn members on the field
rather than rotating them out — a deliberate "last stand" identity.

### Archetypes (`civilization-config.ts:56`, `characters.ts:22–26`)

| Archetype | ID | Role | Key stat weights |
|---|---|---|---|
| Warrior (Forester) | `warrior` | Axe Bulwark — front-line melee | STR×3, END×2, AGI×1 |
| Scout (Ranger) | `scout` | Crossbow Tracker — ranged skirmisher | DEX×3, AGI×2, LCK×1 |
| Sword (Templar) | `sword` | Sword Vanguard — balanced blade fighter | STR×2.5, DEX×2, AGI×1.5 |

> `sword` / Templar is a **founder-only** archetype (`founder-archetypes.ts:24`). It is recruitable
> via `RECRUITABLE_UNITS` (as a tavern card) but is NOT listed in `CIV_CONFIG.LinhSon.archetypes`
> (which holds `['warrior', 'scout']` for the random-recruit pool). This is intentional: the Templar
> is a higher-tier unit gated behind the tavern card path, not the random generation path.

### Founder Presets (`founder-archetypes.ts:23–30`)

Three choices available at new-game class step (Linh Sơn only in MVP):

| Choice ID | Display | Weapon | Portrait sprite |
|---|---|---|---|
| `templar` | Templar | Sword | `LS-SWORD-M/animations/avatar/frame_000.png` |
| `forester` | Forester | Axe | `LS-WARRIOR-M/animations/avatar/frame_000.png` |
| `ranger` | Ranger | Crossbow | `LS-SCOUT-F/animations/avatar/frame_000.png` |

`FOUNDER_CHOICES_BY_CIV` (`founder-archetypes.ts:33`) only populates `LinhSon`; other civs are
absent from the map — consistent with their not-yet-playable status.

### Lore Hook

Mountain-blood discipline, ancestral memory encoded in the body, sacred restraint.
Full cultural worldview: [`../lore/faction-bible-v2.md §1`](../lore/faction-bible-v2.md).

---

## Civilizations Roadmap

> The civs below are **defined in code** (`CIV_CONFIG`) but ship with **empty `RECRUITABLE_UNITS`**
> — they cannot be recruited, and no founder path exists. Stats and passives shown here are from
> `civilization-config.ts` and reflect design intent, not shipped gameplay.
> Do not present these as available to players until the roadmap flag is removed.

---

### Đế Quốc (Republic Empire) — Planned

**Roadmap position:** 1st after Linh Sơn.
**Code ID:** `DeQuoc` — defined in `CIV_CONFIG`, `RECRUITABLE_UNITS: []`.
**Gameplay role:** `Tactician / Support-DPS` — industrial tech, chain debuffs, team amplification.

**Stat bonuses** (`civilization-config.ts:89–93`): CHA ×1.2, INT ×1.1, AGI ×1.1.

**Passive — Điện Thế Chỉ Huy** (`civilization-config.ts:95–98`):
3 stacks → Shock debuff on target + team-wide +5% crit/dmg for 5s.

**Archetypes** (defined, not recruitable): `engineer`, `scholar`.

**Lore:** [`../lore/faction-bible-v2.md §2`](../lore/faction-bible-v2.md) — rebuild through
industrial order; electric-steam-glass aesthetic.

---

### Thiên Lữ (Astopia) — Planned

**Roadmap position:** 2nd after Đế Quốc.
**Code ID:** `ThienLu` — defined in `CIV_CONFIG`, `RECRUITABLE_UNITS: []`.
**Gameplay role:** `Speed DPS / Crit Striker` — nomadic burst damage, hit-combo escalation.

**Stat bonuses** (`civilization-config.ts:117–121`): AGI ×1.2, INT ×1.1, DEX ×1.1.

**Passive — Tinh Lộ** (`civilization-config.ts:123–126`):
5 hits → +15% crit for 5s; 15 hits → summon clone for 5s.

**Archetypes** (defined, not recruitable): `dualblade`, `philosopher`.

**Lore:** [`../lore/faction-bible-v2.md §3`](../lore/faction-bible-v2.md) — nomadic star-readers
carrying living Etheric memory.

---

### The Eliza — Roadmap (not yet in code)

**Roadmap position:** 3rd after Thiên Lữ.
**Code status:** No `Civilization` type entry yet. Will require a full `CIV_CONFIG` entry, archetype
definitions, sprite set, and `RECRUITABLE_UNITS` entries before playable.

**Lore:** [`../lore/faction-bible-v2.md §4`](../lore/faction-bible-v2.md) — history sanctified into
doctrine; deeply tied to The Collapse's religious interpretation.

<!-- TODO: verify archetype names and stat design against code when Eliza implementation begins -->

---

## Excluded: The Scavenger

The Scavenger is a **world faction** (lore and NPC encounters) — not on the playable civilization
roadmap. Covered in [`../lore/faction-bible-v2.md §5`](../lore/faction-bible-v2.md) and surfaced
through missions and world events. Exclude from any recruitment UI or founder selection.

---

*Lore depth for all factions: [`../lore/faction-bible-v2.md`](../lore/faction-bible-v2.md)*
*Character stat mechanics: [`05-characters-progression.md`](./05-characters-progression.md)*
*Recruitment mechanics: [`rooms/tavern.md`](./rooms/tavern.md) / [`08-guild-hall-rooms.md`](./08-guild-hall-rooms.md)*
