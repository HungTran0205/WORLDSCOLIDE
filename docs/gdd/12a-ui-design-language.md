# GDD 12a — UI Design Language: Bronze × Parchment

**Game:** 2000s A.C — After the Collapse (codename WORLDSCOLIDE)
**Status:** Living document — single source of truth for UI chrome. Sub-document of
[GDD 12 — Art Direction](./12-art-direction.md); UI conventions overview in
[GDD 14 — UX/UI & i18n](./14-ux-ui-i18n.md) §1.

**Scope:** UI chrome only — panels, HUD, buttons, modals, toasts, icons, UI motion.
World rendering, sprites, environment, and VFX remain governed by GDD 12.

**How to use this doc:** every color carries a hex value + a CSS custom-property token
name + a semantic role. Every size carries a token name. Implementations transcribe
tokens from here verbatim — if a value is not in this document, it does not ship.

**Token namespace:** new tokens use the `--bp-*` prefix (bronze-parchment) so they
coexist with today's `--ink-*` / `--parchment-*` tokens during migration. Where a
`--bp-*` token equals an existing token's value, the equivalence is noted — the old
token stays valid until its consumers are migrated.

---

## 1. Lineage & Decision Filter

### Lineage — brass matured into bronze

GDD 12 §4 mandates **"Premium UI trim: brass / antique gold."** This document does not
replace that mandate — it **matures it into a complete motif system**. The brass trim
becomes patinated **Đông Sơn bronze**: the same warm metal family (`#d4a843` —
`--ink-gold` — survives unchanged as `--bp-bronze-light`), now carrying the drum-spiral
and Lạc bird vocabulary of Linh Sơn's bronze-drum culture, weathered with verdigris
patina to match the post-collapse world. Brass → bronze is an *extension of hue depth
and ornament*, not a palette swap.

### Surface allocation (the one-sentence system)

> **Bronze is the frame. Parchment is the page. Cyan is the spark. Dark ink is the void behind.**

| Surface | Material | Role |
|---------|----------|------|
| Panel chrome (frames, headers, footers, buttons) | Đông Sơn bronze with patina | The "miniature handcrafted object" shell |
| Content fields (lists, text, cards, forms) | Warm parchment | The readable page; ink text on paper |
| Active / selected / magic states | Linh Sơn cyan crystal | Rare, intentional spark — never decoration |
| Backdrop / scrim behind modals | Ink-dark | Recedes; never a content surface |

### Decision filter

> **Does this chrome read as patinated Đông Sơn bronze framing a parchment content field? If no — revise.**

This nests inside GDD 12's master filter ("handcrafted fantasy miniature built for
play"): a UI panel should feel like a bronze-bound ledger or a framed parchment notice
that could physically sit inside the guild hall diorama.

### Color balance (inherits GDD 12 §4's 70/20/10 law)

- ~70% — parchment surfaces + ink-dark scrim (grounded base)
- ~20% — bronze chrome (supporting variation)
- **≤10% — cyan crystal accent.** Cyan appears ONLY on active, selected, or
  magic-related states. This is a hard law, restated in §3 and §11.

### Visual references

`docs/concept-art/LinhSon/` (cavern dioramas: cyan crystals, Đông Sơn drum centerpiece,
post-apocalyptic salvage). The guild hall's hearth-lit drum (GDD 12 §3 mood table) is
the in-world anchor for every bronze motif below.

---

## 2. Motif Vocabulary

Four motifs, all sourced from Đông Sơn bronze-drum iconography. Motifs live on chrome
only — **never inside the content field, never behind text.**

| Motif | Description | Allowed placements | Forbidden |
|-------|-------------|--------------------|-----------|
| **Drum-spiral** | Ngọc Lũ-style concentric circles / spiral quadrant | Top corner ornaments (TL/TR), large panel header flanks, title-screen framing | Content field, buttons, anything < 24px |
| **Lạc bird frieze** | Stylized crested bird, repeating horizontal band | Top edge band of panels (repeat-x), major section dividers on title/game-over screens | Side/bottom edges (visual weight stays top), content field, scrollbars |
| **Sao (star) boss** | Central drum-face star, radial | Divider center medallion, footer center stamp, modal confirm-seal | Repeated in rows (it is a singular emblem), corners |
| **Rivets / studs** | Round iron or bronze studs | All four 9-slice corners, header bar ends, button corners (large buttons only) | Scattered decoratively, inside content field |

**Density rule:** one panel carries at most — 2 drum-spiral corners + 1 frieze band +
4 rivets + 1 sao medallion. More is costume jewelry; the panel must stay a frame, not
an exhibit. Chrome (all bronze regions combined) covers **≤30% of panel area**.

**Diegetic exception — quest board:** the quest board keeps its full-parchment diegetic
skin (wax seals, ink stamps, pinned notes; see §4 "wax + ink"). Bronze chrome there is
minimal: outer frame only, no header bar.

---

## 3. Palette Ramps & Tokens

### 3.1 Bronze patina ramp (chrome)

| Token | Hex | Semantic role | Provenance |
|-------|-----|---------------|------------|
| `--bp-bronze-glint` | `#ffe87c` | Specular glint pixels, rivet catch-light, hover border | = existing `--ink-stud-bright` |
| `--bp-bronze-light` | `#d4a843` | Lit bevel face, motif line-work, default button border | = existing `--ink-gold` (the brass-lineage anchor) |
| `--bp-bronze-base` | `#8a6d2c` | Main bronze body — edge bands, button fill top | = existing `--ink-gold-dim` |
| `--bp-bronze-dark` | `#5c4a20` | Shadow bevel face, motif recess lines, button fill bottom | derived: `--bp-bronze-base` darkened ~35% |
| `--bp-bronze-patina` | `#527a66` | Verdigris in crevices, aged frame edges, weathering accents | derived from GDD 12 "muted stone gray-green / deep teal shadow" family |
| `--bp-bronze-shadow` | `#2a1f12` | Deepest recess, frame contact shadow, icon outlines | = existing `--ink-dark` |

**Patina usage:** crevice/edge weathering only — never a fill larger than 4px in any
dimension, never a border color. Patina is texture seasoning, not a surface.

### 3.2 Parchment ramp (content surfaces)

| Token | Hex | Semantic role | Provenance |
|-------|-----|---------------|------------|
| `--bp-parch-light` | `#f0e6d3` | Lit paper edge, header-bar text, text on dark bronze | = existing `--ink-text` |
| `--bp-parch-base` | `#e8d9b0` | Content field fill — the default page | = existing `--parchment-base` |
| `--bp-parch-aged` | `#c9b687` | Inset wells, scrollbar track, alternating list rows | = existing `--parchment-aged` |
| `--bp-parch-burn` | `#8b6a3f` | Torn/burnt paper edges, parchment-side borders | = existing `--parchment-burn` |
| `--bp-parch-shadow` | `rgba(40, 20, 5, 0.6)` | Drop shadow under parchment sheets | = existing `--parchment-shadow` |

### 3.3 Ink text on parchment

| Token | Hex | Semantic role | Provenance |
|-------|-----|---------------|------------|
| `--bp-text-ink` | `#2a1f12` | Primary body text on parchment (contrast 11.4:1 on `--bp-parch-base`) | = existing `--ink-dark` |
| `--bp-text-ink-soft` | `#5a4630` | Secondary/descriptive text on parchment | = existing `--ink-faded` |
| `--bp-text-ink-red` | `#8b2c1c` | Diegetic stamps, urgent marks on parchment (not a status color) | = existing `--ink-red` |

### 3.4 Cyan crystal accent (Linh Sơn) — 3 stops

The single net-new hue in the system, sampled from Linh Sơn crystal concept art
(`docs/concept-art/LinhSon/`). Kin to existing `--ink-log-dodge #7fffd4`.

| Token | Hex | Semantic role |
|-------|-----|---------------|
| `--bp-cyan-glow` | `#9ff2e6` | Outer glow halo, glint sparkle pixels (always with alpha or as 1–2px highlights) |
| `--bp-cyan-core` | `#46d8d0` | THE accent: active tab underline, selected-card border, magic stat values, toggled-on icon fill |
| `--bp-cyan-deep` | `#1d7a80` | Pressed-state shade, glow falloff, deep crystal facet |
| `--bp-cyan-halo` | `rgba(70, 216, 208, 0.35)` | Box-shadow glow for selected/active elements |

**THE CYAN LAW (restating §1):** cyan appears ONLY on:
1. **Active** — current tab, pressed primary action, focused input border
2. **Selected** — chosen card, selected list row border, equipped marker
3. **Magic** — spell/skill values, crystal/ether resources, enchanted-item glints

Never: body text, decorative borders, idle chrome, backgrounds, headers at rest.
Contrast note: `--bp-cyan-core` reads 7.7:1 on `--bp-header-fill` (good) but ~1.3:1 on
parchment — **on parchment, cyan is borders/underlines/icons only, never text.**

### 3.5 Semantic status colors

Mapped 1:1 from existing tokens — values unchanged, `--bp-*` aliases reserved.

| Token | Hex | Role | Provenance |
|-------|-----|------|------------|
| `--bp-status-ok` | `#6dbf6d` | Success, healthy, complete | = `--ink-status-ok` |
| `--bp-status-warn` | `#d4a843` | Caution, upkeep due, low resource | = `--ink-status-warn` (shares hex with `--bp-bronze-light` — disambiguated by context: status dots/icons/text, never chrome) |
| `--bp-status-bad` | `#c44a4a` | Danger, failure, debt | = `--ink-status-bad` |
| `--bp-status-info` | `#4a90d9` | Neutral information, hints | = existing `--ink-log-skill` / `--ink-tier-c` |

### 3.6 Supporting tokens

| Token | Hex | Role | Provenance |
|-------|-----|------|------------|
| `--bp-iron` | `#3a3025` | Rivet/stud body, hinge hardware, disabled fill | = existing `--iron-rivet` |
| `--bp-header-fill` | `#3a2c14` | Header/footer bar solid fill (see §5) | derived: `--bp-bronze-dark` deepened; FLAT — no texture |
| `--bp-header-text` | `#f0e6d3` | Title text on header bar (contrast 10.9:1) | = `--bp-parch-light` |
| `--bp-scrim` | `rgba(7, 5, 13, 0.65)` | Modal backdrop scrim | derived from existing `--ink-bg-deep #07050d` |

**Tier/rank ramps** (`--ink-rank-*`, `--ink-tier-*`, `game-ui-tokens.css`) are already
canonical — this bible references them and does not redefine them. They count as
semantic data colors, not chrome, and follow the same restraint as status colors.

---

## 4. Materials

| Material | Tokens | Where used | Finish notes |
|----------|--------|------------|--------------|
| **Bronze** | `--bp-bronze-*` ramp | Panel frames, header/footer bars, buttons, tab strips, HUD chassis | Matte cast metal, 1px `--bp-bronze-glint` top-edge catch-light, `--bp-bronze-patina` seeping in crevices/corners. Never mirror-shiny, never glossy mobile-game gradient. |
| **Parchment** | `--bp-parch-*` ramp | Content fields, cards, tooltips' body, list rows | Warm aged paper; subtle radial grain (existing `.parchment-surface` gradients); torn/burnt edge `--bp-parch-burn` only on diegetic sheets, straight-cut inside framed panels. |
| **Iron** | `--bp-iron` | Rivets, studs, hinges, lock plates, disabled controls | Near-black warm gray, 1px `--bp-bronze-glint` highlight at 10–11 o'clock per stud. |
| **Cyan crystal** | `--bp-cyan-*` triad | Accent gems on active states, magic glints, focus rings, crystal resource icons | Self-luminous: always pair `--bp-cyan-core` fill with `--bp-cyan-halo` glow; facet shading with `--bp-cyan-deep`. |
| **Wax + ink** | `--bp-text-ink-red`, `--bp-text-ink` | Quest board diegetic skin ONLY — seals, stamps, handwriting | Wax seal = `--bp-text-ink-red` with darker self-shadow; stamps rotated −6°, see existing `.parchment-stamp`. Not used in standard panels. |

---

## 5. Panel Anatomy — 9-Slice Specification

### Geometry tokens

| Token | Value | Role |
|-------|-------|------|
| `--bp-frame-w` | `6px` | Edge band thickness (9-slice edges) |
| `--bp-corner` | `24px` | 9-slice corner region (fixed, never scaled) |
| `--bp-header-h` | `40px` | Header bar height |
| `--bp-footer-h` | `36px` | Footer bar height (when present) |
| `--bp-divider-w` | `2px` | Content divider thickness |
| `--bp-scrollbar-w` | `10px` | Scrollbar width |
| `--bp-rivet` | `8px` | Rivet diameter (= existing `--ink-corner-size`) |
| `--bp-radius` | `4px` | Outer corner radius (= existing `--ink-radius-md` / `--parchment-radius`) |

Content padding adopts the existing spacing scale: `--ink-space-4` (16px) default,
`--ink-space-2` (8px) compact. The `--ink-space-1…6` scale (4px base) is canonical —
no new spacing values may be invented.

### 9-slice region diagram

```
 ◄─ --bp-corner ─►                                      ◄─ --bp-corner ─►
 ┌────────────────┬──────────────────────────────────────┬────────────────┐
 │ CORNER TL      │  EDGE TOP — Lạc bird frieze          │ CORNER TR      │
 │ drum-spiral    │  (repeat-x, fixed height             │ drum-spiral    │
 │ quadrant       │   --bp-frame-w, bronze-base fill,    │ mirrored       │
 │ + rivet        │   bronze-light line-work)            │ + rivet        │
 ├────────────────┼──────────────────────────────────────┼────────────────┤
 │                │ HEADER BAR  h: --bp-header-h         │                │
 │ EDGE LEFT      │ SOLID --bp-header-fill (NO texture)  │ EDGE RIGHT     │
 │ plain bronze   │ title: --ink-fs-h1 --bp-header-text  │ plain bronze   │
 │ band           │ close [X]: right, 32px hit target    │ band           │
 │ (repeat-y,     │ 2px bottom rule: --bp-bronze-light   │ (repeat-y,     │
 │  w:            ├──────────────────────────────────────┤  w:            │
 │  --bp-frame-w, │ CONTENT FIELD                        │  --bp-frame-w, │
 │  bronze-base,  │ fill: --bp-parch-base (parchment)    │  bronze-base,  │
 │  patina at     │ text: --bp-text-ink                  │  patina at     │
 │  joins)        │ pad: --ink-space-4                   │  joins)        │
 │                │ divider: --bp-divider-w              │                │
 │                │   --bp-bronze-dark + sao medallion   │                │
 │                │ scrollbar: w --bp-scrollbar-w        │                │
 │                │   track --bp-parch-aged              │                │
 │                │   thumb --bp-bronze-base             │                │
 │                ├──────────────────────────────────────┤                │
 │                │ FOOTER (optional)  h: --bp-footer-h  │                │
 │                │ SOLID --bp-header-fill, holds        │                │
 │                │ primary actions (§6 buttons)         │                │
 ├────────────────┼──────────────────────────────────────┼────────────────┤
 │ CORNER BL      │  EDGE BOTTOM — plain bronze band     │ CORNER BR      │
 │ rivet only     │  (repeat-x, no frieze)               │ rivet only     │
 └────────────────┴──────────────────────────────────────┴────────────────┘
```

### 9-slice scaling rules

- **Corners:** fixed `--bp-corner` square, never scaled or stretched.
- **Edges:** repeat (tile) along their axis — never stretch, or the frieze smears.
- **Center:** content field fills remaining space.
- Drum-spiral corners: **top two corners only** (visual weight stays top, per motif
  density rule §2); bottom corners carry rivets only.

### Header bar — HARD RULE

The header bar is a **solid, flat, high-contrast band**: fill `--bp-header-fill
#3a2c14`, title `--bp-header-text #f0e6d3` (10.9:1 contrast). **Title text NEVER sits
directly on textured/embossed bronze** — pixel fonts (Galmuri) lose legibility over
patina noise. Motifs may flank the title (drum-spiral corners outside the bar) but the
band behind the glyphs stays flat. Same rule for the footer bar.

### Panel shadow

`--ink-shadow-panel` (existing) under all floating panels; modals add `--bp-scrim`
backdrop behind them.

---

## 6. Button Anatomy — 4 States

Bronze body, cyan reserved for the active/pressed state. All transitions use the one
easing (§9) at `--bp-dur-fast` (120ms, = existing `--ink-dur-fast`).

| Property | Default | Hover | Active (pressed / toggled-on) | Disabled |
|----------|---------|-------|-------------------------------|----------|
| Fill (vertical gradient) | `--bp-bronze-base` → `--bp-bronze-dark` | `--bp-bronze-light` → `--bp-bronze-base` | `--bp-bronze-dark` → `--bp-bronze-shadow` | `--bp-iron` flat |
| Border (2px, `--ink-border-w`) | `--bp-bronze-light` | `--bp-bronze-glint` | `--bp-cyan-core` | `--bp-bronze-dark` |
| Text | `--bp-parch-light` | `--bp-parch-light` | `--bp-parch-light` | `--ink-text-muted #6b5a3f` |
| Glow | none | `--ink-glow-gold` (existing) | `box-shadow: 0 0 12px --bp-cyan-halo` | none |
| Motion | — | fill/border color fade, 120ms | press: `translateY(1px)`, 120ms | none (no hover response) |
| Cursor | pointer | pointer | pointer | not-allowed |

Additional rules:
- Top inner edge carries a 1px `--bp-bronze-glint` highlight line in default/hover
  (cast-metal catch-light); dropped in active/disabled.
- Text: `--ink-fs-body` (0.9rem) standard, `--ink-fs-small` (0.78rem) compact; Galmuri11;
  `letter-spacing: 0.08em`; uppercase for primary actions only.
- Minimum hit target 44×44px on touch contexts, 32×32px desktop (close buttons included).
- Focus-visible (keyboard): 2px outline `--bp-cyan-core`, offset 2px — counts as an
  "active" use of cyan, permitted by the cyan law.
- Destructive-action variant: border and text shift to `--bp-status-bad`; fill stays bronze.

---

## 7. Typography Scale & Roles

**Fonts are locked:** Galmuri11 (display/body/UI) + Galmuri9 (compact numerals/labels),
self-hosted Vietnamese-capable woff2 (`game-ui-tokens.css`). No new fonts, ever, without
re-validating Vietnamese diacritics.

The existing `--ink-fs-*` scale is **canonical** — this table assigns ONE size per role.
Any UI text must map to exactly one row; ad-hoc font sizes (the old 0.78–1.6rem header
drift) are retired.

| Role | Token | Size | Font | Case / spacing | Color (on parchment / on bronze) |
|------|-------|------|------|----------------|----------------------------------|
| Wordmark / title-screen display | `--ink-fs-display` | 3rem | Galmuri11 | as-authored | `--bp-bronze-light` on dark |
| Panel title (header bar) | `--ink-fs-h1` | 1.2rem | Galmuri11 | uppercase, 0.08em | `--bp-header-text` |
| Section header (in content) | `--ink-fs-h2` | 1.05rem | Galmuri11 | as-authored, 0.04em | `--bp-text-ink` |
| Body / descriptions | `--ink-fs-body` | 0.9rem | Galmuri11 | sentence, line-height 1.55 | `--bp-text-ink` / `--bp-parch-light` |
| Secondary stat lines | `--ink-fs-small` | 0.78rem | Galmuri9 | as-authored | `--bp-text-ink-soft` / `--bp-parch-light` |
| Meta (timestamps, counts) | `--ink-fs-meta` | 0.7rem | Galmuri9 | as-authored | `--bp-text-ink-soft` |
| Micro-labels, tab text | `--ink-fs-label` | 0.62rem | Galmuri9 | uppercase, 0.1em | role-dependent (tabs: §6 colors) |
| Badge numerals only | `--ink-fs-tiny` | 0.5rem | Galmuri9 | numerals | highest-contrast pairing available |

Rules:
- **Every panel title is `--ink-fs-h1`. No exceptions.** A panel that "feels like it
  needs a bigger title" is a panel with too much chrome.
- Numerals in bars/counters use Galmuri9 (`--ink-font-mono` stack) for tabular rhythm.
- Magic/crystal stat values may render in `--bp-cyan-core` — only on dark bronze
  surfaces, never on parchment (contrast, §3.4).
- Vietnamese diacritics must be visually checked on every new text role (stacked tone
  marks need the full line-height; never clip below 1.3).

---

## 8. Iconography Rules

Pixel icons replace text-label toggle bars (HUD toggle bar, resource bar).

**Size grid:** three sizes only — `16px` (inline/resource glyphs), `24px` (HUD toggle
bar, list-row icons), `32px` (panel-header emblems, large actions). Authored on exact
pixel grid, rendered with `image-rendering: pixelated` (existing `.ink-pixelated`).

**Style:**
- 1px outline in `--bp-bronze-shadow #2a1f12` — every icon, no exceptions (silhouette
  guarantee on both parchment and bronze).
- Fill: 2–3 tones from the bronze ramp (`--bp-bronze-light` / `-base` / `-dark`) for
  neutral icons; material colors allowed for resource icons (wood, stone, etc.) but
  desaturated to GDD 12 sprite-palette levels.
- Active/toggled state: fill swaps to `--bp-cyan-core` + 1px `--bp-cyan-glow` inner
  highlight, optional `--bp-cyan-halo` glow. Inactive returns to bronze. (Cyan law §3.)
- Disabled: `--bp-iron` fill, outline retained.
- No anti-aliasing, no sub-pixel strokes, no gradients inside a 16px icon.

**Source pipeline:** PixelLab / Gemini generation against this palette, then manual
pixel cleanup; watermark strip pass is mandatory before shipping (see ops docs).

**HUD toggle bar:** 24px icons, bronze chassis per §5, tooltip carries the text label
(`--ink-fs-label`). Icon + tooltip replaces the current text-only toggles.

---

## 9. Motion Language

**ONE easing for all UI motion:**

| Token | Value |
|-------|-------|
| `--bp-ease` | `cubic-bezier(0.16, 1, 0.3, 1)` (= existing `--ink-ease-out`) |

The legacy easings in `parchment.css` (`0.22,1,0.36,1` unroll and `0.34,1.56,0.64,1`
stamp overshoot) are retired; both animations migrate to `--bp-ease`. Overshoot feel,
where wanted (stamp press), is authored inside keyframe values, not the easing curve.

**Duration set:**

| Token | Value | Used for |
|-------|-------|----------|
| `--bp-dur-panel-open` | `250ms` | Panel/modal enter (slide-up + fade per existing `ink-slide-in`) |
| `--bp-dur-panel-close` | `150ms` | Panel/modal exit (fade + slight down) — exits are always faster than entries |
| `--bp-dur-tab` | `150ms` | Tab switch, toggle, hover color states on tabs |
| `--bp-dur-bar` | `300ms` | HP/EXP/progress bar width changes |
| `--bp-dur-fast` | `120ms` | Button hover/press micro-feedback (= existing `--ink-dur-fast`) |

Rules:
- No other durations, no other easings. A new interaction picks the nearest row.
- Cyan glow may pulse only on "awaiting player action" elements: opacity 0.6→1.0,
  1200ms loop, `--bp-ease` — maximum ONE pulsing element on screen at a time.
- `prefers-reduced-motion: reduce` disables all entrance/exit transforms and pulses
  (opacity-only fallback allowed). Existing reduced-motion blocks stay mandatory.

---

## 10. Z-Index Scale

Named tiers — tokens for transcription:

| Token | Value | Tier | Contents |
|-------|-------|------|----------|
| `--bp-z-scene` | `0` | Scene | 3D canvas, world rendering |
| `--bp-z-hud` | `50` | HUD | Top bar, room nav, compass, combat timeline, resource bar |
| `--bp-z-panel` | `100` | Panel | Standard panels (quest board, roster, inventory, combat) |
| `--bp-z-panel-elevated` | `200` | Panel-elevated | Panels stacked over panels, side-sheets, story dialog |
| `--bp-z-modal` | `300` | Modal | Confirmations, blocking dialogs, tutorial overlays + their `--bp-scrim` |
| `--bp-z-toast` | `9999` | Toast | Toasts, coachmarks, game-over — always above everything |

**Migration map** (current values found in `src/ui/**` → target tier):

| Today | Target |
|-------|--------|
| 40 (combat-timeline), 50 (hud, nav, compass), 60 (active-missions) | `--bp-z-hud` 50 |
| 80, 90 (combat hotbar/prep), 100 (panels, quest board, roster, overlays) | `--bp-z-panel` 100 |
| 120 (quest-board layer), 150/160 (inventory layers), 200 (facilities, alchemy, story-dialog, title), 220 (tavern, workshop, training-yard) | `--bp-z-panel-elevated` 200 |
| 250 (workshop confirm), 260/270 (tavern modals), 300 (confirm dialogs), 1000/1001 (tutorial overlays, world-board, speech bubbles, combat top layer) | `--bp-z-modal` 300 |
| 1101/1102 (HUD toast, coachmark), 9999 (game-over, toasts) | `--bp-z-toast` 9999 |

Local stacking inside a component (z-index 1–11 for layering pseudo-elements, card
art, etc.) is exempt — it never escapes the component's stacking context.

---

## 11. Do / Don't Gallery

| # | DO | DON'T |
|---|----|----|
| 1 | Title on the **solid** `--bp-header-fill` band, `--bp-header-text`, 10.9:1 contrast | Title floating directly on textured/embossed bronze — pixel glyphs drown in patina noise |
| 2 | Cyan on the active tab underline, the selected card border, a magic stat value | Cyan body text, cyan decorative borders on idle panels, cyan panel backgrounds — breaks the ≤10% accent law |
| 3 | Drum-spiral in TL/TR corners, Lạc bird frieze on the top edge band, sao medallion on a divider | Motifs tiled inside the content field or watermarked behind text — the page stays clean paper |
| 4 | Parchment content field with `--bp-text-ink` dark text (11.4:1) | Light cream text on parchment, or a parchment-colored panel with bronze text — mixing surface grammars kills readability |
| 5 | One easing (`--bp-ease`), durations only from the §9 table | Per-panel custom bounce/elastic easings or invented durations — motion accent drift is how UI fragments |
| 6 | Bronze chrome ≤30% of panel area; the parchment page dominates | Full-bronze panels with tiny content wells — the frame must never swallow the page |
| 7 | Status colors on status indicators only (dots, bar fills, state text) | Tier/rank/status hues reused as decoration or chrome — semantic colors must stay readable as meaning |
| 8 | 9-slice with fixed corners and **tiled** edges | Stretching corner ornaments or smearing the frieze — handcrafted bronze never rubber-bands |
| 9 | 24px pixel icons + tooltip labels in the HUD toggle bar | Text-only toggle buttons, or icons without the 1px `--bp-bronze-shadow` outline |
| 10 | Quest board keeps its diegetic wax + ink parchment skin, minimal bronze | Spreading wax seals and ink stamps into standard panels — diegetic props belong to the board |

---

## Cross-references

- [GDD 12 — Art Direction](./12-art-direction.md) — parent doc: world/sprite/VFX style,
  70/20/10 law, brass→bronze lineage origin (§1, §4).
- [GDD 14 — UX/UI & i18n](./14-ux-ui-i18n.md) — panel inventory, interaction patterns,
  i18n architecture. Its §1 visual identity defers to this document.
- `src/ui/styles/game-ui-tokens.css` — current `--ink-*` tokens (typography scale,
  spacing, tier ramps remain canonical there until migrated).
- `src/ui/styles/parchment.css` — current `--parchment-*` tokens (quest-board diegetic skin).
- `docs/concept-art/LinhSon/` — visual canon references.
