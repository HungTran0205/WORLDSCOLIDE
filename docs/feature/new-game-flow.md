# New Game Flow — Split-Hero Character-Creation Wizard

**Status**: Shipped (branch `feature/WC-NewGameFlow`, 2026-05-21)
**Replaces**: old single-form new-game screen

Game-style character-creation wizard with a large live character preview pinned
on the left and a per-step choice panel on the right. The preview swaps its
avatar as the player picks a class and overlays the chosen mask on the face,
updating live as choices are made.

## Step Flow

```
Civilization → Class → Mask → Identity → Begin
```

| Step | Player chooses | Notes |
|------|----------------|-------|
| Civilization | Faction | Only Linh Sơn selectable in MVP; Đế Quốc + Thiên Lữ dimmed + "Coming Soon" (locked) |
| Class | Founder preset | Templar / Forester / Ranger — swaps preview avatar live |
| Mask | Identity mask | 10 curated tiles; overlays live on preview face |
| Identity | Name + stat allocation | Name + 50 "Talent Points" across 7 stats |
| Begin | — | Creates founder, enters guild hall |

Navigation: Back/Continue + a clickable step rail (completed steps are revisitable).
`canBegin` requires civ + class + mask + non-empty name + all 50 points allocated.

## Founder Presets (Linh Sơn MVP)

Defined in `src/game/data/founder-archetypes.ts` (`LINH_SON_FOUNDER_CHOICES`,
keyed by civ via `FOUNDER_CHOICES_BY_CIV`).

| Preset | Archetype | Gender | Sprite | Weapon | Icon |
|--------|-----------|--------|--------|--------|------|
| Templar | `sword` | M | `LS-SWORD-M` | Wooden Sword | `/ui/icons/founder/sword.png` |
| Forester | `warrior` | M | `LS-WARRIOR-M` | Wooden Axe | `/ui/icons/founder/axe.png` |
| Ranger | `scout` | F | `LS-SCOUT-F` | Wooden Crossbow | `/ui/icons/founder/crossbow.png` |

## `sword` Archetype (Founder-Only)

New `CivArchetype` member `sword` (the Templar). It is **founder-only** and
**deliberately NOT added to `CIV_CONFIG.LinhSon.archetypes`** (still
`['warrior', 'scout']`), so recruits and tavern rolls never produce a `sword`
member. A recruit-safety regression test guards this invariant.

Supporting data:
- `equipment-templates.ts` — `WOODEN_SWORD` template (10 damage, COMMON, 50 durability)
- `equipment-bonuses.ts` — `getStartingWeapon`: `sword → WOODEN_SWORD`
- `characters.ts` — `CIV_ARCHETYPE_PROFILES.sword` (balanced blade stat weights)
- `skills.ts` — `sword` reuses the warrior skill kit for MVP (`getDefaultSkill`)
- `tavern-negotiation.ts` — `sword → fighter` portrait-class map

## Data Model

`createFounder(name, stats, civilization, archetype, gender, maskSpriteId)` —
honors the player's class, gender, and mask choice. (Previously auto-picked
`archetypes[0]`, random gender, and an always-warrior skill.)

- Founder skill is archetype-matched: sword/warrior → warrior kit, scout → scout kit.
- Mask choice persists to `Member.maskSpriteId`.
- **No SAVE_VERSION bump** — `archetype`, `gender`, and `maskSpriteId` were
  already optional on `Member`.

Masks: `FOUNDER_MASK_CHOICES = MASK_POOL.slice(0, 10)` (in
`src/scene/sprites/mask-pool.ts`) — 10 curated tiles from the 15-entry pool.

## Files

**New**
- `src/game/data/founder-archetypes.ts` — founder preset table
- `src/ui/components/character-preview.tsx` — large live avatar + mask overlay
- `src/ui/components/archetype-selector.tsx` — class tiles
- `src/ui/components/mask-selector.tsx` — mask tiles
- `src/ui/components/stat-allocator.tsx` — "Talent Points" allocator
- `public/ui/icons/founder/{sword,axe,crossbow}.png` — monochrome weapon icons

**Modified**
- `src/ui/panels/char-creation.tsx` — split-hero orchestrator
- `src/ui/components/civ-selector.tsx` — locked-civ rendering
- `src/game/systems/character-creation.ts` — new `createFounder` signature
- `src/game/data/{civilization-config,characters,skills,equipment-templates}.ts`
- `src/game/systems/{equipment-bonuses,tavern-negotiation}.ts`
- `src/scene/sprites/mask-pool.ts` — `FOUNDER_MASK_CHOICES`
- `src/ui/styles/panels.css`

All player-facing copy is English (project convention).

## Verification

- Build green (`tsc -b && vite build`); lint clean on feature files.
- 55 new unit tests (founder-archetypes, createFounder per class,
  mask-pool/FOUNDER_MASK_CHOICES, recruit-safety regression) + full suite 633 pass.
- chrome-devtools playthrough: preview swaps per class, mask overlay swaps live,
  2 civs locked, Begin creates founder + enters guild hall, zero console errors.

## Follow-Ups

- **Unlock Đế Quốc + Thiên Lữ** founder presets/sprites (currently MVP-temporary
  locked civs with "Coming Soon" lock glyph).
