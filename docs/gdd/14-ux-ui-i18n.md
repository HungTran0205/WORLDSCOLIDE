# GDD 14 — UX/UI & Internationalization

**Game:** 2000s A.C — After the Collapse (codename WORLDSCOLIDE)
**Status:** Living document — update when UI conventions or i18n architecture changes.

---

## 1. UI Design Conventions

### Visual Identity

UI must support the Pixel-integrated Miniature Storybook Dark Fantasy tone without stealing attention from the scene.

**Authoritative spec:** [GDD 12a — UI Design Language](./12a-ui-design-language.md)
defines all UI chrome — palette tokens, motifs, panel anatomy, button states,
typography roles, iconography, motion, and z-index tiers. This section states intent
only; when they disagree, 12a wins.

**UI style:** patinated Đông Sơn bronze chrome framing warm parchment content fields, with Linh Sơn cyan as the sole active/selected/magic accent (the "brass trim" below, matured — see 12a §1). Restrained ornamentation, pixel typography framing.
**Priority rule:** the gameplay scene is the main stage; UI is the frame, not the main event.

**Accent use (gold/brass):**
- Active choices, key action buttons, headers, premium/important indicators.
- Avoid glossy mobile-game gradients, neon sci-fi glows, too many competing highlight colors, or modern flat UI that clashes with the world tone.

### Panel System

All panels render through a unified **PanelFrame** system (`src/ui/components/panel-frame.tsx`) — one standard chrome per panel (header band, close button, parchment content field, SFX hooks, open/close animation). Panel state is managed centrally via `panel-slice.ts` (Zustand), with two independent axes: `mainPanel` (quest-board, roster, facilities, combat, settings) and `facilityPanel` (workshop, alchemy, tavern, training-yard). Panels on each axis are mutually exclusive; Esc closes all. **Exception:** combat panel uses its own `useCombatPanelStore` for independent lifecycle during combat sessions (documented in `combat-panel.tsx`).

### Combat HUD Status Icons

During active combat, entity status indicators render above each character head in the arena (driven by `combat-panel-hud.tsx` projection store):

| Icon | Trigger | Status | Meaning |
|------|---------|--------|---------|
| 🛡️ | `riposteActive: true` | Riposte stance active (3–4s) | Character can parry and counter next hit |
| ⚔️ | `statusEffects` contains `'boosted'` | Damage buff active (from Rally) | Character deals +20% damage until buff expires |

These are pure DOM indicators (no mesh layer), positioned via the existing projection-store anchor system (head bone + screen offset). They refresh once per combat tick and fade when status expires.

Quest board keeps its diegetic identity as the sole **hideClose** variant — it renders the parchment-and-wax-seal diegetic skin, with unroll animation and PAPER_UNROLL/SEAL_BREAK SFX, and accepts click-outside close (matching the panel-frame motion language). HUD restyled to bronze token ramp with pixel icon toggle bar (11 icons, tooltips preserved via aria-labels).

Panels are full-screen or side-pane overlays managed as React components. The HUD persists across room transitions. Key panel files (spot-read, not exhaustive):

- **HUD layer:** `src/ui/hud/hud.tsx`, `src/ui/hud/room-nav-bar.tsx`, `src/ui/hud/facility-compass.tsx`, `src/ui/hud/panel-toggle.tsx`, `src/ui/hud/save-status-badge.tsx`
- **Core panels:** `src/ui/panels/quest-board.tsx`, `src/ui/panels/guild-roster.tsx`, `src/ui/panels/inventory-panel.tsx`, `src/ui/panels/character-detail-panel.tsx`, `src/ui/panels/settings-panel.tsx`
- **Combat panels:** `src/ui/panels/combat-panel.tsx`, `src/ui/panels/combat-panel-hud.tsx`, `src/ui/panels/combat-prep-panel.tsx`
- **Workshop sub-tabs:** `src/ui/panels/workshop-panel.tsx`
- **Tavern modals:** `src/ui/panels/tavern-negotiate-modal.tsx`, `src/ui/panels/tavern-hire-merc-modal.tsx`
- **Panel infrastructure:** `src/ui/components/panel-frame.tsx` (chrome + animations), `src/game/state/panel-slice.ts` (state management), `src/ui/hooks/use-delayed-unmount.ts` (exit animation timing)

### Interaction Patterns

- **Room navigation:** `room-nav-bar.tsx` + `facility-compass.tsx` — directional navigation between guild rooms.
- **Keyboard shortcuts:** `src/ui/hud/keyboard-shortcuts.tsx` — shortcuts overlay for discoverability.
- **Modal dialogs:** used for confirmations and contextual flows (tavern negotiation, arrival, game-over).
- **Panel toggle:** `panel-toggle.tsx` manages open/close state of major side panels.

---

## 2. Localization Architecture

### Default Language

**The game ships English by default.** All player-facing UI copy is English.
Source: `src/i18n/index.ts` — `readStoredLang()` returns `'en'` when no stored preference exists.

```typescript
// src/i18n/index.ts
export function readStoredLang(): 'en' | 'vi' {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LANG_STORAGE_KEY) : null;
  return raw === 'vi' || raw === 'en' ? raw : 'en';  // EN default
}
```

### Tech Stack

**i18next + react-i18next**, initialized in `src/i18n/index.ts`.
Supported locales: `en` (English), `vi` (Vietnamese).
Global `fallbackLng: 'en'` (safety net for `ui` namespace only — see below).

### Language Preference Storage

- **Key:** `localStorage['settings.lang']` (constant `LANG_STORAGE_KEY` in `src/i18n/index.ts`)
- **Scope:** device-level — one language across ALL save slots, not per-save.
- **Hook:** `useLanguage()` in `src/i18n/use-language.ts` — exposes `{ language, setLanguage }`.
- **Runtime change:** `i18n.changeLanguage()` triggers React re-renders via `languageChanged` event; no page reload.
- **First-paint:** `readStoredLang()` is called before `i18n.init()`, so the first render is already in the correct language (no flash of EN then VI).

### Two-Namespace Strategy

| Namespace | Default? | Purpose | Source files |
|-----------|---------|---------|-------------|
| `ui` | Yes | Interface chrome (buttons, labels, headings, status) | `src/i18n/ui.en.json`, `src/i18n/ui.vi.json` |
| `content` | No | Game-data names/descriptions + dialog/tutorial narrative | `src/i18n/content.en.json`, `src/i18n/content.vi.json` |

**UI namespace usage:** `const { t } = useTranslation(); t('feature.section.element')`
**Content namespace usage:** never call raw; use typed wrappers from `src/i18n/content-wrappers.ts` or `tContent(category, id, field, fallback)` from `src/i18n/content-localization.ts`.

**Key convention:**
- `ui`: `<feature>.<section>.<element>` — e.g. `questBoard.title`, `roster.status.on-quest`
- `content`: `<category>.<id>.<field>` — e.g. `missions.slime-extermination.name`, `items.pine-wood.description`

**Parity guard:** `src/i18n/ui-parity.test.ts` fails CI if `ui.en.json` and `ui.vi.json` key counts diverge (currently 708 keys each).

### Source-Language Asymmetry (Critical Detail)

Not all game data is English-authored. The `content` namespace handles two authoring directions:

| Data type | Authored in | VI overlay lives in | EN overlay lives in |
|-----------|------------|---------------------|---------------------|
| Missions, items, enemies, equipment, furniture, facilities, recipes, archetypes, ranks | English (inline) | `content.vi.json` | — |
| Civilization config (`displayName`, `description`, passives), skills | Vietnamese (inline) | — | `content.en.json` |
| `civ.role` field | English (inline, despite being in VN-authored file) | `content.vi.json` | — |

**Why `fallbackLng: false` in content lookups:** `src/i18n/content-localization.ts` passes `fallbackLng: false` to every `tContent()` call. Without it, a VI player looking up a VN-authored entity (absent VI key by design) would fall through to `fallbackLng: 'en'` and receive English. With it, resolution goes: active language → `defaultValue` (inline source string) — always correct.

### i18n File Structure

```
src/i18n/
├── index.ts                   # i18next init, lang storage, dev helpers
├── content-localization.ts    # tContent() resolver (fallbackLng: false)
├── content-wrappers.ts        # Typed per-category helpers (missionName, itemName, civName, …)
├── use-language.ts            # useLanguage() hook for device-level preference
├── ui.en.json                 # UI strings — English, source of truth (708 keys)
├── ui.vi.json                 # UI strings — Vietnamese overlay (708 keys, parity enforced)
├── content.en.json            # EN overlay for VN-authored entities (civ, skills)
├── content.vi.json            # VI overlay for EN-authored entities (missions, items, …)
├── ui-parity.test.ts          # Guard: ui.en ↔ ui.vi key parity
└── content-coverage.test.ts   # Guard: all entities have required overlay entries
```

### Lore Fidelity & Proper Nouns

Faction and proper-noun names follow the lore canon. Vietnamese proper nouns are **never translated**:
- **Linh Sơn** — always preserved verbatim in both locales.
- **Thiên Lữ** (Astopia) — Vietnamese name preserved; EN display name sourced from `content.en.json`.
- Character names (e.g., "Kael") are never translated.

### Dev-Time Helpers

`saveMissing` + `missingKeyHandler` in `src/i18n/index.ts` — active only when `import.meta.env.DEV === true`. Emits `[i18n] missing ui key "..."` console warnings for un-migrated UI strings. Disabled for `content` namespace (intentional key absence is not a gap). Zero overhead in production.

---

## 3. Known Considerations

- **Number formatting:** currently browser-locale `.toLocaleString()` — not language-aware (no `vi-VN` / `en-US` switching). User decision pending.
- **RTL support:** not implemented; game uses LTR layout throughout.
- **Plural forms:** i18next supports `t('key', { count })` pluralization; no game strings currently use it.
- **Date/time localization:** game clock uses raw seconds/minutes; no human-readable date localization needed at this stage.
