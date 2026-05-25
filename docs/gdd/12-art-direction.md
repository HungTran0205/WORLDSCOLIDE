# GDD 12 — Art Direction

**Game:** 2000s A.C — After the Collapse (codename WORLDSCOLIDE)
**Status:** Living document — update when visual style decisions change.

---

## 1. Core Style Identity

**Style name:** Pixel-integrated Miniature Storybook Dark Fantasy

**One-sentence statement:**
> A stylized world presented like a handcrafted miniature diorama, lit like a theatrical storybook stage, with readable pixel characters integrated into a simplified atmospheric environment.

**Decision filter:** Does this asset look like it belongs in a handcrafted fantasy miniature built for play? If no — revise.

**Final production law:**
> Everything in 2000s A.C should look like a handcrafted fantasy miniature staged for play, while remaining clear enough to function as a game first.

---

## 2. Visual Pillars

| Pillar | Rule |
|--------|------|
| **Handcrafted** | Everything feels authored by hand; avoid sterile or procedural output. |
| **Miniature** | Large objects feel like simplified physical pieces in a model world. |
| **Readable** | Silhouette, contrast, gameplay layering, and interaction clarity always preserved. |
| **Atmospheric** | Mood via light and depth, but atmosphere is always secondary to gameplay communication. |

### What this style is NOT

- Not photoreal fantasy — no realistic bark, foliage density, or PBR scans.
- Not luxury painterly illustration — environments must not overpower pixel sprites.
- Not hard retro pixel purism — modern crisp sprites are fine; no 16-bit limitations.
- Not hyper-neon magic fantasy — magic accents should feel rare and intentional.
- Not grimdark — shadowy and ancient but retaining charm and warmth.

---

## 3. Atmospheric Pipeline (Code-Level)

Atmosphere is implemented via a per-room preset registry.
**Source:** `src/scene/atmospheric/atmosphere-presets.ts` — `ATMOSPHERE_PRESETS: Record<RoomId, AtmospherePreset>`

Each preset declares the full effect stack explicitly (no implicit baseline):

| Effect | Example values (Workshop) | Design intent |
|--------|--------------------------|---------------|
| **Bloom** | `threshold: 0.72, intensity: 0.9` | Forge fire punches through dark room (Octopath signature) |
| **Tilt-shift** | `strength: 0.5` | HD-2D miniature-diorama band; 0.7 is too uniform |
| **DOF** | `bokehScale: 3.5, targetOffset: WORKSHOP_DOF_OFFSET` | Forge/anvil sharp, foreground/background soft — true lens feel |
| **Color grade** | `hue: +0.03, saturation: +0.03, contrast: +0.1` | Warm forge punch; negative saturation = Octopath muted look |
| **God rays** | `color: '#db7b4a', sourceId: 'workshop-forge'` | Must originate from believable opening, not post-process sticker |
| **Heat haze** | `intensity: 0.001` | Believable shimmer ≤ 0.001 to preserve pixel crispness |
| **Particles** | `'dust'` or `'none'` | Dust particles in inhabited interior rooms |
| **Hemisphere fill** | `skyColor: '#faf4f0', groundColor: '#704020'` | Warm bounce so foreground reads "in the room" |

**Per-room mood mapping** (from `atmosphere-presets.ts`):

| Room | Mood string |
|------|-------------|
| guild-hall | warm wood hall, hearth-lit drum centerpiece |
| tavern | cozy warm, candlelit hearth |
| infirmary | ether-lit sanctuary, warm gold crystal hush |
| workshop | hot forge, hammered iron, embers |
| logging-site | bright outdoor canopy, dappled sun |
| stone-quarry | dim damp cave, single torch in gloom |
| alchemy-lab | magical purple, bubbling cauldron glow |

The god-ray `sourceId` must map to a registered light mesh; unregistered sources are silently skipped.

---

## 4. Color System

**Base palette:** moss green, pine green, bark brown, warm earth brown, muted stone gray-green, deep teal shadow, dusty navy/indigo accents.

**Accent palette (functional roles):**
- Interactable magic: soft gold, pale yellow-green, faint cyan
- Enemy danger: muted red, controlled acidic green
- Player-friendly UI: soft green-blue
- Premium UI trim: brass / antique gold

**Balance:** 70% grounded base · 20% supporting variation · 10% accents.

Reserve strong saturation for key enemies, magic effects, important collectibles, and critical UI states.

---

## 5. Sprite & Character Rules

**Silhouette priority:** head shape, weapon silhouette, dominant pose line, class posture must read at gameplay distance in under one second.

**Grounding (mandatory):**
- Soft contact shadow directly beneath every sprite — darker closest to feet, soft-edged.
- Subtle biome ground tint (greenish in forest, cool gray in stone interiors).
- Optional gentle rim light to separate sprite from background; use sparingly.

**Palette for sprites:** muted indigo, dusty blue, brown leather, bone beige, bronze accents, warm skin tones, desaturated reds. Avoid neon cyan, saturated magenta, electric purple on main characters.

**Pixel edge rule:** sprites stay crisp and clearly pixel-authored. Post-processing must not melt pixel identity.

---

## 6. Environment & Room Rules

**Shape language:** chunky, simplified, slightly exaggerated, intentional. Thick trunks, grouped foliage masses, rocks with clear big planes, bold roof shapes.

**Hero prop rule:** every room has one main visual anchor (brazier, guild table, rune stone, brewing apparatus, etc.). Two or three supporting props + one ambient effect if needed.

**Background hierarchy:** foreground (framing) → gameplay plane (clearest layer, strongest actor separation) → midground (atmosphere) → background (desaturated, low contrast, soft).

---

## 7. VFX & Post-Processing

**Good VFX types:** dust puffs, spark motes in sunbeams, small weapon flash, magical particle drift, compact hit sparks, brief impact lines.

**Post-processing stack:** subtle color grading, very light bloom, minimal vignette, atmospheric haze. Goal: unify world and sprites, never melt pixel identity.

---

## 8. Asset Catalog Reference

Full sprite catalog: [`docs/reference/asset-list-sprites.md`](../reference/asset-list-sprites.md) — link only, do not duplicate here.

Concept art references (Linh Sơn rooms, characters):
- [`docs/concept-art/LinhSon/`](../concept-art/LinhSon/) — guild hall, workshop, alchemy lab, infirmary reference images.
- [`docs/concept-art/`](../concept-art/) — tavern, workshop, stone quarry, alchemy lab room renders.

See [`docs/concept-art/three_quarks_review.md`](../concept-art/three_quarks_review.md) for art review notes.

---

## 9. Production Priorities (when time-constrained)

1. Contact shadows, palette unification, background simplification, gameplay plane clarity.
2. Light hierarchy, room hero props, stronger foreground/midground/background separation.
3. Biome atmosphere tuning, VFX polish, advanced shader unification.
