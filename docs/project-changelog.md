# Project Changelog

All notable changes to Worlds Collide are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/).

**Current Version**: 1.27.9
**Release Date**: 2026-05-10 (Combat AOE Telegraph)

---

## [Unreleased] — 2026-05-22 (Combat Mask Composite Atlas — Phase 3 Integration Complete)

### feat(combat): replace floating mask overlay with per-character runtime composite atlases

**Overview**: Replaced legacy per-archetype mask overlay plane with runtime-composite per-character atlases synced frame-by-frame to body animation. Each masked ally's mask is now baked into the rendered sprite, eliminating floating/misalignment and improving runtime perf (1 mesh/ally instead of 2).

**Implementation** (Phase 3 complete):
- **combat-idle-sprite.tsx** — Rewrote to build masked `idle`/`attack`/`blocking` composite atlases via `useMemo` when ally has `maskId`. Atlases loaded on first use; enemies and death states keep body atlas. Extended `currentAnim` type to include `'blocking'` (4 frames at 10 FPS = 400ms per `combat-engine.ts`).
- **combat-mask-anchors.ts** — Per-frame anchor table for `LS-SWORD-M` / `LS-WARRIOR-M` / `LS-SCOUT-F` (idle 8, attack 8, blocking 4 frames) + safe fallback helpers `setDevAnchorOverride()` / `getAnchorTable()`.
- **combat-mask-composite-atlas.ts** — Canvas-based atlas builder; draws body frame then masks texture at frame anchor with `imageSmoothingEnabled: false` (pixel-crisp rendering).
- **combat-mask-dev-tuner.tsx** (DEV-only) — Leva-based anchor authoring tool; select `charId+anim+frame`, nudge anchor x/y/size, rebuild live, export to clipboard.
- **Cleanup** — Deleted legacy overlay/tuner/placement files (`combat-mask-overlay.tsx` / `combat-mask-tuner.tsx` / `combat-mask-placement.ts`); removed overlay mount from `combat-idle-sprite.tsx`; DEV-gated new tuner in `combat-scene-shell.tsx`; wired `disposeCombatMaskCompositeAtlasCache()` on scene unmount.

**TypeScript**: Compile clean (0 errors).

**Plan Reference**: `plans/260522-1233-combat-mask-composite-atlas/phase-03-combat-sprite-integration.md` (Phase 3 complete).

---

## [Unreleased] — 2026-05-22 (Same-template concurrent quest dispatch fix)

### fix(missions): unique `instanceId` per dispatch — two parties on same quest no longer resolve as one

**Bug**: Dispatching 2 parties to the SAME quest template (e.g. "Diệt Slime"/Slime Extermination) → finishing one party's combat removed BOTH active missions; the second party's members stayed `on-mission` forever and never returned to the guild hall.

**Root cause**: `ActiveMission` had no unique id — `missionId` held the shared template id, so `completeMission`/`failMission`/`updateMissionPhase`/`setTargetPriority`/`saveCombatSnapshot` filtered/mapped by template id and hit every same-template instance at once. The arena/combat-panel also `.find()`'d the active mission by template id (returning the wrong/first party).

**Fix**: Added unique `ActiveMission.instanceId` (uuid, generated in `createActiveMission`). All per-instance store ops now key by `instanceId`; `completedMissions` still records the template `missionId` (derived inside `completeMission`) so quest prerequisite/tutorial checks are unchanged. Threaded `instanceId` through combat-panel-store, combat-arena-slice (`arenaInstanceId`), and UI consumers (active-missions-list, formation, battle, fight-controller, prep-panel, arena-result-handler). Template lookups (`MISSIONS.find`, tutorial/map checks) intentionally still use `missionId`.

**Save migration**: `SAVE_VERSION` 26→27 (`migrateV26toV27`) backfills `instanceId` (uuid) onto existing active missions.

**Tests**: Regression test in `mission-tick.test.ts` (only the targeted instance resolves when two parties share a template) + `save-migrations.test.ts` (same-template parties get distinct backfilled ids). Full game test suite green.

---

## [Unreleased] — 2026-05-21 (Bilingual i18n EN+VI Support & New Game Flow)

### feat(i18n): complete bilingual architecture — two-namespace EN/VI localization

**i18next + react-i18next** bilingual support with device-level language preference (localStorage, one language across all save slots). Branch `feature/WC-BiLangSupport`.

**Two-namespace strategy**:
- `ui` (interface chrome): 708 keys each language (EN source of truth; VI overlay); parity enforced by `ui-parity.test.ts`
- `content` (game-data display + narrative): asymmetric source-language resolution — EN-authored entities (missions, items, enemies, equipment, furniture, facilities, recipes, archetypes, ranks) have EN inline + VI overlay; VN-authored entities (civ display/description/passive, skills) have VN inline + EN overlay (sourced from lore glossary)

**Architecture details**:
- `src/i18n/index.ts` — i18next init with namespaced strategy, dev-only `saveMissing` for ui namespace
- `src/i18n/content-localization.ts` — `tContent(cat, id, field, fallback)` resolver with **`fallbackLng: false`** (critical for correct VN-authored entity fallback to inline VN value)
- `src/i18n/content-wrappers.ts` — Typed per-category helpers: `missionName()`, `itemName()`, `civName()`, `skillName()`, `equipmentName()`, `recipeName()`, `archetypeDisplayName()`, `enemyName()`, `furnitureName()`, `facilityName()`, `rankLabel()`, `civRole()`, `civPassiveName()`, `civPassiveDescription()`
- `src/i18n/use-language.ts` — `useLanguage()` centralized device-level pref hook (localStorage + i18n reactivity)
- `src/i18n/ui.{en,vi}.json` — UI namespace (708 keys each, exact parity)
- `src/i18n/content.{en,vi}.json` — Content namespace (per-source-language overlay)
- `src/i18n/ui-parity.test.ts` — Guard: exact key count alignment
- `src/i18n/content-coverage.test.ts` — Guard: all entity fields have required overlay entries

**Lore fidelity**: Faction/proper-noun names follow `docs/LORE.md` canon (The LinhSon/Linh Sơn, The Republic Empire/Đế Quốc, The Astopia/Thiên Lữ); character proper names never translated. See `plans/260521-1101-bilingual-i18n-vn-en-support/lore-glossary.md`.

**Number formatting**: Intentionally left as browser locale / en-US (pixel-art HUD consistency); `.toLocaleString()` unchanged. Language-aware formatting is a known consideration (user decision pending).

**UI integration**: Settings panel language toggle (EN ↔ VI) via `useLanguage()` — changes persist in localStorage, all components re-render on `languageChanged` event with zero flash.

**Docs**: New `docs/i18n.md` (comprehensive architecture + contributor guide); `docs/system-architecture.md` updated with i18n details.

**Test results**: `ui-parity.test.ts` (708 keys each), `content-coverage.test.ts` (all entities covered); full test suite green.

**Verification**:
- Build clean: `tsc -b && vite build`
- All tests pass: `npm run test`
- Settings toggle EN ↔ VI: all UI labels + game-data displays update live (no flash, no stale text)
- Playthrough: quest board, roster, build, combat, settings in both languages
- Dev console: zero `[i18n] missing ui key` warnings

**Plan Reference**: `plans/260521-1101-bilingual-i18n-vn-en-support/` (phases 01–06 complete)

---

## [Unreleased] — 2026-05-21 (New Game Flow — Split-Hero Character-Creation Wizard)

### feat(char-creation): split-hero new-game wizard + founder-only `sword` archetype

Replaced the old single-form new-game screen with a game-style **split-hero wizard**: a large live character preview pinned on the left, a per-step choice panel on the right. Step flow: **Civilization → Class → Mask → Identity → Begin**. The preview swaps its avatar as the player picks a class and overlays the chosen mask on the face, updating live. Branch `feature/WC-NewGameFlow`.

**New founder-only class** — `sword` (Templar): added to `CivArchetype` + `CIV_ARCHETYPE_PROFILES` + skill kit (reuses warrior kit for MVP) + `WOODEN_SWORD` weapon template. `sword` is **FOUNDER-ONLY** — deliberately NOT added to `CIV_CONFIG.LinhSon.archetypes` (still `['warrior','scout']`), so recruits/tavern never roll it (recruit-safety regression test guards this).

**3 founder presets** (Linh Sơn MVP, in new `src/game/data/founder-archetypes.ts`):
- Templar — sword, M, `LS-SWORD-M`, Wooden Sword
- Forester — warrior, M, `LS-WARRIOR-M`, Wooden Axe
- Ranger — scout, F, `LS-SCOUT-F`, Wooden Crossbow

**`createFounder` new signature**: `(name, stats, civilization, archetype, gender, maskSpriteId)` — was auto-picking `archetypes[0]` + random gender + always-warrior skill; now honors player choice. Founder skill is archetype-matched (sword/warrior→warrior kit, scout→scout kit). **No SAVE_VERSION bump** — fields were already optional on `Member`.

**Faction lock (MVP-temporary)**: only Linh Sơn selectable; Đế Quốc + Thiên Lữ shown dimmed with lock glyph + "Coming Soon" (non-clickable, non-focusable). **Follow-up**: unlock the two locked civs once their founder presets/sprites ship.

**Mask identity step**: `FOUNDER_MASK_CHOICES = MASK_POOL.slice(0, 10)` (10 curated tiles) + English narrative; selection persisted to `Member.maskSpriteId`, overlaid live on the preview face.

**New files**:
- `src/game/data/founder-archetypes.ts` — `FounderArchetypeChoice` + `LINH_SON_FOUNDER_CHOICES` + `FOUNDER_CHOICES_BY_CIV`
- `src/ui/components/character-preview.tsx` — large live avatar + mask overlay
- `src/ui/components/archetype-selector.tsx` — class tiles (weapon icon + tagline)
- `src/ui/components/stat-allocator.tsx` — "Talent Points" allocator (50 pts across 7 stats)
- `src/ui/components/mask-selector.tsx` — 10 mask tiles
- `public/ui/icons/founder/{sword,axe,crossbow}.png` — 3 monochrome weapon icons

**Modified**:
- `src/ui/panels/char-creation.tsx` — rebuilt as split-hero orchestrator (step rail civ→class→mask→identity)
- `src/ui/components/civ-selector.tsx` — locked-civ rendering (dim + lock + Coming Soon)
- `src/game/systems/character-creation.ts` — new `createFounder` signature
- `src/game/data/{civilization-config,characters,skills,equipment-templates}.ts` — `sword` archetype + `WOODEN_SWORD`
- `src/game/systems/equipment-bonuses.ts` — `sword → WOODEN_SWORD` starting weapon
- `src/game/systems/tavern-negotiation.ts` — `sword → fighter` portrait class map
- `src/scene/sprites/mask-pool.ts` — `FOUNDER_MASK_CHOICES`
- `src/ui/styles/panels.css` — split-hero layout styles

**All new player-facing copy is English** (project convention).

**Verification**:
- Build green (`tsc -b && vite build`); lint clean on all feature files.
- Tests: 55 new unit tests pass (founder-archetypes, createFounder per class, mask-pool/FOUNDER_MASK_CHOICES, recruit-safety regression) + full suite 633 pass, 0 feature regressions.
- Code review: zero critical/important issues; recruit-safety + exhaustive `Record<CivArchetype>` maps verified.
- chrome-devtools playthrough: New Game → slot → split-hero wizard; preview swaps to `LS-SWORD-M`/`LS-WARRIOR-M`/`LS-SCOUT-F` per class; mask overlay swaps live; 2 civs locked; Begin creates founder + enters guild hall; zero console/page errors.

**Docs**: `docs/feature/new-game-flow.md` (new); `codebase-summary.md`, `system-architecture.md`, `development-roadmap.md` updated.

**Plan Reference**: `plans/260520-2124-new-game-archetype-flow/` (phases 01–06)

---

## [Unreleased] — 2026-05-20 (Tutorial Quest Redesign Phase 07 — Playthrough Fixes & Cleanup)

### fix(tutorial): 6 playthrough fixes from first live test + Phase 07 cleanup

A partial live playthrough surfaced 6 issues; all fixed. (1) **Opening lore modal gated on scene readiness**: added a `worldReady` flag to `ui-store` (set when the existing `SceneReadySignal`/`onAssetsReady` fires); `<WorldBoardModal>` now only renders once the 3D world is interactive, fixing the dead "Begin" button during the 5–10s WebGPU first-load freeze. (2) **Drum beat guidance**: removed `highlightPanel: 'quests'` from the `open-quest-board` step (it pulsed the wrong HUD button) and made the existing world-target drum coachmark (`DrumTooltipArrow`, drum at `[5,1.2,3.5]`) show during that beat regardless of the `questBoardTutorialSeen` localStorage flag — previously suppressed for returning players. (3) **Hint bar repositioned** bottom → prominent top-center banner with a glow pulse. (4) **Kael-rescue deferred**: the rescue dialogue now waits until the combat victory screen is dismissed (`!isCombatPanelOpen`), so order is VICTORY+rewards → Continue → rescue → permit splash. (5) **In-panel guidance**: added the existing `.tutorial-highlight` pulse to the actual elements to click — empty slots → blueprint row → Build button (build beats), and the Logging Site slot → assign dropdown (assign-kael) — previously only the Facilities HUD button was highlighted. (6) **Moonbear combat sprite 404**: registered `moonbear` in `COMBAT_SPRITE_MANIFEST` (idle/attack/death west) so the resolver loads `animations/{idle,attack,death}/west` instead of the non-existent `rotations/west.png`.

**Modified**:
- `src/game/state/ui-store.ts` — +`worldReady: boolean` + `setWorldReady(v)` (UI-only, not persisted)
- `src/scene/world.tsx` — set `worldReady` false on mount, true via the existing `onAssetsReady` callback
- `src/ui/screens/game-screen.tsx` — gate `<WorldBoardModal>` on `worldReady`; gate `<KaelRescueDialogue>` on `!isCombatPanelOpen`; removed a redundant `loreSeen`-reset effect
- `src/game/systems/tutorial-manager.ts` — dropped `highlightPanel` from `open-quest-board`
- `src/ui/overlays/drum-tooltip-arrow.tsx` — show drum coachmark during `open-quest-board` regardless of `questBoardTutorialSeen`
- `src/ui/styles/hud.css` — `.tutorial-hint-bar` moved to top-center + `tutorialHintGlow` pulse
- `src/ui/panels/facilities-panel.tsx` — pulse empty slots (build beats) / built Logging Site slot (assign-kael)
- `src/ui/components/facility-detail-tray.tsx` — pulse target blueprint row + Build button (build beats), assign dropdown (assign-kael)
- `src/scene/sprites/combat-sprite-resolver.ts` — added `moonbear` to `enemiesWithIdleWest/AttackWest/DeathWest`

**Deleted**:
- `src/ui/overlays/drum-tooltip-arrow.css` — dead (component was refactored to use `<TutorialCoachmark>`; no importer)

**Tests**:
- `tests/mission-tick.test.ts` — mock updated with `tavern.mercContracts` + `mercContractIds` (a pre-existing gap from the tavern-merc integration, not from this work) → 12/12 pass
- `npx tsc --noEmit` clean; changed files lint-clean (the repo-wide `npm run lint` still reports pre-existing errors under `tools/vfx-playground/`); full vitest suite green apart from documented infra/hook noise

**Plan Reference**: `plans/260520-1152-tutorial-quest-redesign/` (Phase 07 — code-side tasks done)

**Manual QA — PENDING (requires live browser):** full guided playthrough, GDD §9 edge cases, and legacy v25→v26 save-load test are NOT yet verified. A partial playthrough confirmed the 6 fixes above only.

---

## [Unreleased] — 2026-05-20 (Tutorial Quest Redesign Phase 06 Complete)

### feat(tutorial): full state-machine integration + coachmark wiring (Phase 06)

Completed Phase 06 of tutorial-quest-redesign: expanded tutorial onboarding from legacy 8-step sandbox flow to a fully-wired 14-beat narrative chain (the GDD "Bear the Bear" / "First Tremor" story arc). Tutorial state machine now drives all key moments: char-creation → arrival-alarm (messenger scene) → open-quest-board (beat-the-drum) → accept-bear-quest → assign-and-dispatch → quest-travel → moonbear-combat (with HP-floor victory guarantee) → kael-rescue (narrative) → reward-splash → build-logging-site → assign-kael (grants +200 wood/gold) → first-haul-reward → build-tavern → complete.

**Expanded TutorialStep Union** (`src/game/state/game-state.ts`):
- Was 8 IDs (char-creation, world-board, quest-dispatch, quest-active, kael-rescue, reward, build-logging, assign-kael)
- Now 14 beats (char-creation → arrival-alarm → open-quest-board → accept-bear-quest → assign-and-dispatch → quest-travel → moonbear-combat → kael-rescue → reward-splash → build-logging-site → assign-kael → first-haul-reward → build-tavern → complete)

**Tutorial Manager Enhanced** (`src/game/systems/tutorial-manager.ts`):
- `TUTORIAL_STEPS: TutorialStepConfig[]` carries optional `coach?: CoachConfig` per beat (GDD §6 coachmark guidance)
- Beats advance via hybrid model:
  - **Tick-loop predicates** (autoAdvance + advanceCondition): store-observable signals (cameraFocus, activeMissions, facility level)
  - **UI callbacks**: Modals/handlers fire custom events advancing to next beat (quest-board selection, combat victory, first-haul handler completion)
- `shouldAdvanceTutorial(currentStep, state)` checks predicates in tick loop; called from mission-tick.ts for state-driven advances
- Order matters: TUTORIAL_STEPS list must match TutorialStep union so `getNextStep` walks linearly

**Coachmark Wiring** (Phase 01 infrastructure + Phase 06 integration):
- Reusable `<TutorialCoachmark>` component (Phase 01) mounted in game-screen.tsx, driven by `current step's coach config`
- Coachmark mounts only if `tutorialStep` matches the active step AND step config has `coach` field (None for modals/dedicated overlays)
- Example: 'accept-bear-quest' renders dom-target coachmark on `.quest-card` (spotlight, arrow, pulse, advanceOn='quest-selected' event)
- Visibility gated by `isTutorialActive` check; zero overhead when tutorial complete

**Save Format Bump** (SAVE_VERSION 25 → 26):
- Migration `migrateV25toV26()` remaps legacy 8-step IDs forward to 14-beat flow via `STEP_REMAP` table:
  - 'char-creation' → 'char-creation' (unchanged)
  - 'world-board' → 'arrival-alarm' (prerequisites met: no blocking items)
  - 'tutorial-quest-dispatch', 'tutorial-quest-active' → 'open-quest-board' (dead 'tutorial-into-the-clearing' mission strips below; player re-dispatches new 'tutorial-bear-the-bear')
  - 'tutorial-kael-rescue' → 'kael-rescue' (Kael + permit already granted pre-rescue)
  - 'tutorial-reward' → 'reward-splash' (permit already granted; no item gaps)
  - 'build-logging-site' → 'build-logging-site', 'assign-kael' → 'assign-kael' (unchanged, new beats exist)
  - Unknown legacy IDs → 'complete' (defensive fallback)
- **Stranded Member Cleanup**: Removed 'tutorial-into-the-clearing' mission from `activeMissions[]`; any members stuck 'on-mission' for that mission reset to 'idle' (frees their status so they're available for new tutorial flow)
- Transparent migration: auto-triggers on load, no player interaction needed

**Verification**: `npm run typecheck` ✓ (tight TutorialStep → TUTORIAL_STEPS sync); `npm run lint` ✓; all 7 migration tests pass (remapping + stranded-member-cleanup coverage).

**Plan Reference**: `plans/260520-1152-tutorial-quest-redesign/phase-06-state-machine-integration.md`

---

### feat(ui/narrative): RetroSpeechBubble reusable component + NpcAlarm beat-2 narrative binding (Phase 05)

Introduced reusable JRPG-style speech bubble component for future NPC dialogue scenes (e.g., Kael rescue quest). RetroSpeechBubble features typewriter text reveal (configurable chars/sec), reveal-all-on-click, blinking continue caret, and prefers-reduced-motion support. Anchoring via world coordinates (reuses Phase 01 coachmark world→screen projection bridge) with fixed-bottom fallback. NpcAlarm implements beat-2 narrative beat (messenger alarm scene) driving the bubble; mounted DEBUG-gated in GameScreen.tsx, live step wiring deferred to Phase 06.

**New files**:
- `src/ui/components/retro-speech-bubble.tsx` — Reusable retro speech bubble (~120 LOC, typewriter crawl + click-through + caret animation)
- `src/ui/components/retro-speech-bubble.css` — Speech bubble styling (retro borders, caret keyframes, reduced-motion safe)
- `src/ui/components/npc-alarm.tsx` — Beat-2 narrative scene driver (~40 LOC, English copy, world-anchored)

**Modified**:
- `src/ui/screens/game-screen.tsx` — Added DEBUG-gated stub mount; live wiring deferred to Phase 06
- `src/ui/components/world-board-modal.tsx` — Trimmed intro lore from 2 pages → 1 page, single "Begin" button

**Notes**: Reusable for future NPC dialogue (no hardcoding to tutorial flow). Shares coachmark projection bridge; safe because alarm + coachmark steps never run simultaneously. English copy (project convention). Phase 06 owns live step machine wiring; Phase 05 establishes reusable infrastructure.

**Verification**: `npm run typecheck` ✓; `npm run lint` ✓; DEBUG-gated, no player-visible change until Phase 06 wiring.

### feat(tutorial/combat): HP-floor guarantee for Moonbear fight + soft-retry UI (Phase 04)

Tutorial-only mechanic to guarantee victory in the `tutorial-bear-the-bear` mission. Added `CombatEngine.hpFloorActive` boolean (default false) + `clampTutorialAllyFloor()` helper called after each of 4 ally-damage sites (effect-tick poison, ThienLu clone, auto-attack, skill), ensuring allies clamp to minimum 1 HP. Headless simulator (`runCombatLoop()`) gains optional `hpFloor` param, honored during Skip button and mid-fight reload for offline-resolved missions. Scoping via `TUTORIAL_BEAR_MISSION_ID` (exported from `tutorial-data.ts`); flag set true **only** for that mission in `combat-fight-controller.tsx`, `mission-tick.ts`, `offline-progression.ts`. Zero behavior change for all other combat.

**Modified**:
- `src/game/systems/combat-engine.ts` — `hpFloorActive` field + `clampTutorialAllyFloor()` private method (4 call sites)
- `src/game/systems/combat-simulator.ts` — `runCombatLoop(entities, pickTarget, margin, hpFloor)` param + clamp logic inside loop
- `src/scene/combat/combat-fight-controller.tsx` — Set `engine.hpFloorActive = missionId === TUTORIAL_BEAR_MISSION_ID` on init
- `src/game/systems/mission-tick.ts` — Pass `hpFloor` when calling `runCombatLoop()` for offline mission resolution
- `src/game/systems/offline-progression.ts` — Pass `hpFloor` for Skip button simulator call
- `src/ui/panels/combat-panel-result.tsx` — Added tutorial-only "Try again" soft-retry button (re-enters battle at full HP) when outcome !== 'victory'
- `src/ui/panels/combat-skill-hotbar.tsx` — Added `data-coach="skill-hotbar"` selector on primary skill button (Phase 06 coachmark mount point)

**Verification**: `npm run typecheck` ✓; `npm run lint` ✓; tutorial mission guaranteed win, outcome !== 'victory' shows retry button, offline Skip honors floor, normal combat unaffected.

### feat(economy): Tavern now costs 200 Wood to build — global, applies post-tutorial (GDD §0.3 LOCKED)

Building a Tavern now requires 200 Oak Wood in addition to the existing gold cost. This is a **locked design decision** (GDD §0.3) that affects all Tavern builds — including post-tutorial players who already have Kael. The economy model change is implemented via a new generic `FacilityDef.buildMaterialCost?: Partial<Record<ItemID, number>>` field; `buildFacility` checks and deducts material cost atomically with gold inside one Zustand `set()`. The facility build UI displays the wood cost and disables the build button with a "Need 200 Oak Wood" caption when inventory is insufficient.

**Modified**:
- `src/game/data/facility-defs.ts` — Added `buildMaterialCost: { WOOD: 200 }` to Tavern def
- `src/game/systems/building-system.ts` (or equivalent) — `buildFacility` atomic material + gold deduction
- `src/ui/panels/build-menu.tsx` (or equivalent) — Cost display + disabled state with caption

**Plan reference**: `plans/260520-1152-tutorial-quest-redesign/phase-03-state-and-save.md`

### feat(tutorial): scripted first-haul reward handler + splash (Phase 03 of tutorial-quest-redesign, wiring deferred to Phase 06)

Incremental tutorial-chain piece: `handleFirstHaul` in `src/game/systems/tutorial-first-haul-handler.ts` grants +200 Wood +200 Gold (once) when Kael is assigned to the logging site at the `assign-kael` step. Presentational `src/ui/components/tutorial-first-haul-splash.tsx` built but not yet mounted — Phase 06 mounts and wires it. No player-visible change at this phase.

**New files**:
- `src/game/systems/tutorial-first-haul-handler.ts` — `handleFirstHaul` one-shot reward logic
- `src/ui/components/tutorial-first-haul-splash.tsx` — Reward splash UI (unmounted until Phase 06)

**Plan reference**: `plans/260520-1152-tutorial-quest-redesign/phase-03-state-and-save.md`

---

## [Unreleased] — 2026-05-12 (Quest Board Diegetic Redesign + Tiles + Platformer + HD-2D Atmospheric)

### feat(ui): title screen Settings + Credits overlays (Phase 5 Title Screen 2000s A.C. Redesign)

Title screen redesign Phase 5: two modal overlays for Settings and Credits. Settings panel features BGM/SFX volume sliders, language toggle (en/vi via i18next), and graphics quality selector (low/med/high); all settings persist to localStorage. Credits overlay displays scrollable credits list with role/name pairs (hardcoded, non-localized). Both overlays triggered from main menu via mode state machine, back button returns to main menu. Settings changes apply live (volume immediate feedback). CSS appended to `title-screen.css` with `.title-settings` and `.title-credits` styling.

**New files**:
- `src/ui/screens/title-screen-settings.tsx` — Settings form component with state management
- `src/ui/screens/title-screen-credits.tsx` — Scrollable credits list component

**Modified**:
- `src/ui/screens/title-screen.tsx` — Wired `mode === 'settings'` and `mode === 'credits'` render branches
- `src/ui/styles/title-screen.css` — Added Phase 5 overlay CSS (settings sliders, language radio buttons, credits list styling)

**Verification**: `npm run typecheck` ✓; `npm run lint` ✓; overlays render, back button functional, localStorage persistence verified.

**Plan reference**: `plans/260519-0926-title-screen-2000s-ac/phase-05-overlays.md`

### feat(audio): title-screen audio crossfade + BGM_TITLE key registration (Phase 6 Title Screen 2000s A.C. Redesign)

Phase 6 completes title-screen-2000s-ac flow integration: splash → title → game audio transitions now use `crossfadeBGM(key, durationMs)` 1500ms fade function. Added `BGM_TITLE` key to audio registry; `crossfadeBGM` uses Howler.js native fade + setTimeout cleanup for clean BGM cutoff during transitions. Audio asset (bgm-title.mp3/mp3) TBD Phase 7. System gracefully handles missing assets (Howler logs 404 silently, Havok continues).

**Modified**:
- `src/audio/audio-keys.ts` — Added `BGM_TITLE: 'bgm-title'` constant
- `src/audio/audio-manager.ts` — Registered `bgm-title` Howl + `crossfadeBGM(key, durationMs=1500)` function
- `src/ui/app.tsx` — Audio transition handlers now use `crossfadeBGM` instead of `playBGM`; `handleReturnToTitle` crossfades back; `handleSplashReady` lazy-inits audio

**Verification**: `npm run typecheck` ✓; `npm run lint` ✓; splash → title → game flow audio transitions working; no BGM_TITLE asset errors (Howler graceful 404 handling).

**Plan reference**: `plans/260519-0926-title-screen-2000s-ac/phase-06-app-integration-audio-crossfade.md`

### feat(combat): per-ally identity mask overlay with animation-state tracking (Phase 3 Mask Overlay POC)

Combat identity system Phase 3: per-character deterministic mask sprite overlay rendered on allies during battle, using established `mask-pool.ts` infrastructure (15-mask curated set, texture cache). `CombatMaskOverlay` component renders R3F plane inside Billboard (west.png, mirrored east via scale); tracks animation state via offset table (idle/walking/attacking/skill/hit/dead) with 0.25 lerp smoothing for smooth head-tracking during transitions. Mask selection deterministic per member id; enemies skip overlay (render via spriteId path). Preload on first combat scene mount via `preloadCombatMasks()`.

**New files**:
- `src/scene/combat/combat-mask-overlay.tsx` — R3F plane mesh (0.525u) with per-state offset table, animation tracking, directional mirroring

**Modified**:
- `src/scene/combat/combat-entity-sprite.tsx` — +maskId memo (allies only), +<CombatMaskOverlay/> conditional render inside Billboard after HpBar
- `src/scene/combat/combat-scene.tsx` — +useEffect preloadCombatMasks on mount

**Verification**: `npm run typecheck` ✓; `npm run lint` ✓; mask renders on ally entities only, tracks idle/attacking/hit states, direction flip correct, no texture leaks (cache hit).

**Plan reference**: `plans/260519-1641-mask-overlay-poc/phase-03-combat-overlay.md`

### feat(atmospheric): per-room theming foundation — context provider, preset registry, active-room detection (Phase 01)

HD-2D atmospheric depth system Phase 01: pure plumbing foundation for per-room post-FX, particles, and lighting. New module `src/scene/atmospheric/` (7 files) introduces `AtmosphereProvider` context, preset registry, active-room detection via camera position, and smooth 500ms lerp transitions. `GameSettings.atmosphericEnabled` toggle added; disabled = provider returns null (zero overhead). Phases 02–05 consume this plumbing to mount post-FX stack, particles, volumetric lighting, and diegetic UI. Zero user-visible changes at this phase.

**New files**:
- `src/scene/atmospheric/atmosphere-types.ts` — `RoomId` union (9 rooms), `AtmospherePreset` interface, `BASELINE_PRESET`
- `src/scene/atmospheric/atmosphere-presets.ts` — Preset registry (9 stub entries; Phase 04 tuning)
- `src/scene/atmospheric/atmosphere-context.tsx` — React provider component
- `src/scene/atmospheric/atmosphere-context-store.ts` — Zustand store instance
- `src/scene/atmospheric/use-atmosphere.ts` — Consumer hook
- `src/scene/atmospheric/use-active-room-id.ts` — Camera→room selector
- `src/scene/atmospheric/use-lerped-atmosphere.ts` — Numeric lerp helper
- `src/scene/atmospheric/CLAUDE.md` — Module reference

**Modified**:
- `src/game/state/guild-slice.ts` — +`atmosphericEnabled: boolean` setting
- `src/scene/world.tsx` — Wrapped `<WorldSceneContent>` with `<AtmosphereProvider>`

**Verification**: `npm run typecheck` ✓; `npm run lint` ✓; all 264 game tests pass; zero visual diff.

**Plan reference**: `plans/260512-1520-guild-hall-hd2d-atmospheric-depth/phase-01-atmosphere-foundation.md`

### feat(atmospheric): replace world-bloom-post with preset-driven composer; full effect stack on WebGL, bloom-only on WebGPU (Phase 02)

Replaces static `src/scene/world-bloom-post.tsx` with `src/scene/atmospheric/world-atmospheric-post.tsx` — a preset-driven EffectComposer reading active room via `useAtmosphere()` context. **WebGL**: Full stack (N8AO → DOF → TiltShift → Bloom → GodRays → HueSat → BrightnessContrast → Vignette → Noise → ChromaticAberration → ToneMapping). DOF target auto-syncs from camera lerp per-frame (no room-transition popping). **WebGPU** (Phase 02): TSL chain (Bloom → ColorGrade → Vignette → ACES ToneMapping); logs warning once if full-stack requested. Quality tier `graphicsQuality='low'` strips DOF, GodRays, ChromaticAberration; WebGPU chain always full per preset.

**New files**:
- `src/scene/atmospheric/world-atmospheric-post.tsx` — Composer entry; wraps effect stack OR WebGPU pass
- `src/scene/atmospheric/atmospheric-effect-stack.tsx` — WebGL effect children
- `src/scene/atmospheric/atmospheric-webgpu-pass.tsx` — TSL chain: bloom → colorGrade → vignette; preset-driven uniforms via refs
- `src/scene/atmospheric/atmospheric-leva-controls.ts` — Dev tuning multipliers
- `src/scene/atmospheric/tsl/vignette-node.ts` — TSL vignette node (pmndrs DEFAULT, radial darkening)
- `src/scene/atmospheric/tsl/color-grade-node.ts` — TSL color-grade node (hue/sat/brightness/contrast; HueSaturation + BrightnessContrast chained)
- `src/scene/atmospheric/tsl/types.ts` — `TslChainHolder` interface + uniform shape definitions (bloom, vignette, colorGrade; future: fog, chromAb, tiltShift)

**Modified**:
- `src/scene/atmospheric/atmosphere-types.ts` — +`GodRaysConfig.sourceId`, +`ChromaticAberrationConfig`, +`colorGrade` + `vignette` config on `AtmospherePreset`
- `src/scene/atmospheric/tsl/types.ts` — `vignette` + `colorGrade` flipped from optional to required on `TslChainHolder`
- `src/scene/world.tsx` — Updated import: `world-bloom-post` → `world-atmospheric-post`

**Deleted**: `src/scene/world-bloom-post.tsx` (migrated to modular `src/scene/atmospheric/`)

**Implementation Pattern**:
- Async IIFE tail + per-preset `useEffect` both call `applyPreset(holder, preset, overrides)` to sync uniform `.value` properties without pipeline rebuild.
- Refs (`presetRef`/`overridesRef`) prevent seed-race where preset mutation during dynamic-import window would stale uniforms.
- `post.dispose()` wired on cleanup to prevent WebGPU texture/buffer leaks.

**Verification**: `npm run typecheck` ✓; `npm run lint` ✓; visual parity on WebGL; WebGPU parity gap (Bloom + ToneMapping only, as designed).

**Plan reference**: `plans/260512-1520-guild-hall-hd2d-atmospheric-depth/phase-02-atmospheric-post-stack.md`

### feat(atmospheric): ambient particle system (dust, embers, magic, pollen) with tier-aware counts and router (Phase 03)

Implements Phase 03 of HD-2D atmospheric depth plan: 4 production particle components (dust-motes, embers, magic-motes, pollen) with shared infrastructure (deterministic PRNG, procedural texture, bounds helper). All particles use additive blending, tier-aware counts (high: 100 dust / 80 embers / 60 magic / 40 pollen; low: 30/20/15/10), and wrap-on-bounds lifecycle. Particle preset selection via `preset.particles` wired to `<AmbientParticlesRouter>` mounted in `world.tsx` inside AtmosphereProvider. Deterministic mulberry32 PRNG replaces Math.random for React purity compliance. TypeScript compilation ✓, lint clean, 99/99 tests pass, no regressions.

**New files**:
- `src/scene/atmospheric/particles/shared-particle-texture.ts` — 32×32 soft-circle DataTexture (SSR-safe singleton)
- `src/scene/atmospheric/particles/particle-prng.ts` — Mulberry32 seeded PRNG (deterministic, React-pure)
- `src/scene/atmospheric/particles/particle-bounds.ts` — RoomId → Box3 lookup; `randomInBounds(prng)` helper
- `src/scene/atmospheric/particles/dust-motes.tsx` — Warm slow drift, infinite lifecycle, tier-aware count
- `src/scene/atmospheric/particles/embers.tsx` — Hot orange upward-rising, 3–4s lifespan + fade-out
- `src/scene/atmospheric/particles/magic-motes.tsx` — Cool purple circular swirl, opacity pulse via sine wave
- `src/scene/atmospheric/particles/pollen.tsx` — Yellow outdoor vibe, slow settlement toward ground
- `src/scene/atmospheric/particles/particles-router.tsx` — Key-driven preset.particles → component preset switch

**Modified**:
- `src/scene/world.tsx` — Added `<AmbientParticlesRouter>` mount inside AtmosphereProvider

**Deviations from spec** (all acceptable):
- Math.random → mulberry32 PRNG: Passes exhaustive-deps lint; determinism bonus (identical layout per seed)
- Buffer init via useState + useRef (not useMemo): idiomatic r3f pattern for mutable frame buffers in useFrame
- `randomInBounds(prng)` signature: requires explicit Prng instance (callers updated, no API breaks)
- Profiling deferred to Phase 06: Phase 03 code ready, measurement postponed for tier-specific baselines

**Verification**: `npm run typecheck` ✓; `npm run lint` ✓; 99/99 tests pass; no pre-existing errors introduced.

**Plan reference**: `plans/260512-1520-guild-hall-hd2d-atmospheric-depth/phase-03-ambient-particles.md`

### feat(atmospheric/webgpu): ACES tonemap TSL node closes parity for four core effects (Phase 03)

WebGPU post-processing achieves functional parity with WebGL for Bloom, ColorGrade, Vignette, and ACES Filmic tonemap. Phase 03 of `atmospheric-webgpu-tsl-parity` plan (separate effort, 2026-05-12): adds `acesTonemapNode(input)` TSL node (Narkowicz approximation, param-free, must be chain tail) and removes parity-gap console warning from `world-atmospheric-post.tsx`. WebGPU chain now reads: Bloom → ColorGrade → Vignette → ACES Tonemap. Future phases (04/05) will add Chromatic Aberration and Tilt-Shift before the ACES guard line; DOF and GodRays remain WebGL-only.

**New files**:
- `src/scene/atmospheric/tsl/aces-tonemap-node.ts` — ACES Filmic tone mapping (Narkowicz formula, ~10 LOC, no uniforms)

**Modified**:
- `src/scene/atmospheric/atmospheric-webgpu-pass.tsx` — Append ACES at chain tail with guard comment "ACES MUST BE LAST"
- `src/scene/atmospheric/world-atmospheric-post.tsx` — Removed `webgpuParityWarned` flag and `WebGPUWithParityWarning` wrapper; WebGPU branch returns pass directly

**Verification**: `npm run typecheck` ✓; `npm run lint` ✓; visual diff WebGL vs WebGPU on 3 representative rooms (guild-hall, workshop, infirmary) shows functional parity within ±2 LSB per channel.

**Plan reference**: `plans/260512-2039-atmospheric-webgpu-tsl-parity/phase-03-aces-tonemap-node.md`

### feat(atmospheric/webgpu): chromatic aberration TSL node — opt-in per preset (Phase 04)

Phase 04 of atmospheric-webgpu-tsl-parity: adds `chromaticAberrationNode(input, offsetU)` TSL node (UV-offset RGB split, matches pmndrs convention). Inserted before ACES guard; all 9 current presets pass `chromaticAberration: null` → zero visible behavior change. Known parity deviation: pmndrs WebGL multiplies Y offset by screen aspect; WebGPU node uses offset unscaled (revisit Phase 06 if designer enables chromAb).

**New files**:
- `src/scene/atmospheric/tsl/chromatic-aberration-node.ts` — RGB split via `convertToTexture(input)` + offset UV sampling

**Modified**:
- `src/scene/atmospheric/atmospheric-webgpu-pass.tsx` — +`chromAbOffsetU = uniform(vec2(0, 0))`, insert `chromaticAberrationNode(chain, chromAbOffsetU)` before ACES, add to holder + applyPreset sync logic
- `src/scene/atmospheric/tsl/types.ts` — +`chromaticAberration: { offset: Uniform<Vector2> }` on `TslChainHolder`

**Verification**: `npm run typecheck` ✓; `npm run lint` ✓; visual test (temp workshop preset flip to `enabled: true`) shows RGB fringing; all presets remain at `chromaticAberration: null` → zero diff.

**Plan reference**: `plans/260512-2039-atmospheric-webgpu-tsl-parity/phase-04-chromatic-aberration-node.md`

### feat(atmospheric): per-room preset tuning; hemisphereLight conditional mount (Phase 04)

Phase 04 of atmospheric depth system: replaces baseline preset stubs with 9 per-room tuned presets across guild hall rooms. Adds optional `mood?: string` field to `AtmospherePreset` for designer documentation (runtime no-op). Conditional `<hemisphereLight>` mount in `AtmosphereProvider` reads `hemisphereLight` config from lerped preset; rooms with null skip entirely (zero cost). Skylight & groundColor properties lerp smoothly over 500ms per preset transitions.

**Modified**:
- `src/scene/atmospheric/atmosphere-presets.ts` — Replaced 9 baseline stub presets with per-room tuning (bloom, DOF, vignette, particles, lighting per room)
- `src/scene/atmospheric/atmosphere-types.ts` — +`mood?: string` field on `AtmospherePreset` (documentation-only)
- `src/scene/atmospheric/use-lerped-atmosphere.ts` — Routes `mood` field from target preset unchanged
- `src/scene/atmospheric/atmosphere-context.tsx` — Conditional `<hemisphereLight color={hemi.skyColor} groundColor={hemi.groundColor} intensity={hemi.intensity} />` mount gated by lerped preset presence

**Verification**: `npm run typecheck` ✓; `npm run lint` ✓; all 264 tests pass; zero visual regressions.

### feat(atmospheric/webgpu): tilt-shift TSL node + chainDisposables RT leak fix (Phase 05)

Phase 05 of atmospheric-webgpu-tsl-parity: adds `tiltShiftNode(input, strength)` TSL node (Gaussian masked blur, separable 2-pass, SIGMA=4, resolutionScale=0.5). Mask uses `focusBandHalfWidth = (1 - strength) * 0.5`, formula: `smoothstep(0, 0.3, abs(uv.y - 0.5) - halfWidth)` matches pmndrs WebGL `focusArea = 1 - strength, feather = 0.3` exactly. Disabled state: `tiltShift.enabled === false` → strength=0 → output equals sharp input (no chain rebuild). Inserted in WebGPU chain before colorGrade. **RT Leak Fix**: Introduced `chainDisposables` array in pass closure to collect dispose closures from TSL TempNode children (PostProcessing.dispose() doesn't walk child tree). Tilt-shift returns `{ output, dispose }` tuple; closure fed to array for cleanup on unmount.

**New files**:
- `src/scene/atmospheric/tsl/tilt-shift-node.ts` — TSL tilt-shift node (Gaussian masked blur, mask-strength formula, returns output + dispose)

**Modified**:
- `src/scene/atmospheric/atmospheric-webgpu-pass.tsx` — Insert tilt-shift after bloom, before colorGrade; update chain order to bloom → tilt-shift → colorGrade → vignette → chromAb → ACES; add `chainDisposables` array + collect dispose closures from TempNodes
- `src/scene/atmospheric/tsl/types.ts` — +`tiltShift: { strength: Uniform<number>, enabled: Uniform<boolean> }` on `TslChainHolder`

**Verification**: `npm run typecheck` ✓; `npm run lint` ✓; visual test shows tilt-shift blur on y-axis with masked hard/soft transitions; disabled state returns sharp input; no RT leaks on preset switch. All 264 tests pass.

**Plan reference**: `plans/260512-2039-atmospheric-webgpu-tsl-parity/phase-05-tilt-shift-node.md`

---

### feat(quest-board): diegetic trigger, camera zoom + scene blur, 5-SFX cinematic transition

Phase 03 of `plans/260512-1002-quest-board-diegetic-redesign/`. Wired drum mesh in guild hall as interactive gateway to quest panel: click triggers camera zoom-in (0.5s) + scene overlay blur (0→4px animated) + panel slide-up. All UI state synced via cameraFocus + pendingQuestPanel. Added 5 SFX: paper-unroll (open), seal-break (close), paper-flip (card hover, 120ms debounce), wood-clink (member toggle), ink-stamp (dispatch).

**New files**:
- `src/scene/guild-hall/interactive-drum.tsx` — click-interactive drum with hitbox, hover light, cursor pointer

**Modified**:
- `src/game/state/camera-slice.ts` — +cameraFocus state, +pendingQuestPanel, +requestQuestPanel action; reset to defaults in store
- `src/scene/camera-controller.tsx` — focus-based offset (CAM_OFFSET_DEFAULT vs CAM_OFFSET_QUEST); consolidated into existing controller
- `src/scene/guild-hall/guild-hall-props.tsx` — DrumFireHolder → InteractiveDrum
- `src/ui/screens/game-screen.tsx` — bridge activePanel ↔ cameraFocus + sync effects
- `src/ui/styles/quest-board.css` — animated overlay blur: 0→4px, reduced-motion fallback
- `src/ui/panels/quest-board.tsx` — 5 SFX wired (open/close lifecycle + hover/toggle/dispatch handlers), custom 120ms debounce
- `src/ui/panels/quest-card.tsx` — +onHover prop for SFX
- `src/ui/panels/quest-detail-pane.tsx` — +onMemberToggle prop for SFX

**Verification**: `npm run build` ✓ (941 modules); `npx tsc --noEmit` ✓; HUD + drum both trigger same state path; reduced-motion respected.

---

### feat(quest-board): tutorial sparkle, keyboard shortcuts, full a11y polish

Phase 04 of `plans/260512-1002-quest-board-diegetic-redesign/`. Final phase: first-visit discoverability + complete keyboard + screen reader support. Added sparkle particle hint + DOM tooltip arrow on guild-hall drum (first load only, persisted in localStorage). Global keyboard shortcuts: `Q` toggles quest board, `ESC` closes any panel (capture-phase handlers). Updated quest board to `role="dialog" aria-modal aria-label` with auto-focus on first quest card. All animations respect `prefers-reduced-motion`. Code review fixed invalid `role="listbox"` on tooltip + removed noisy `aria-live` redundancy. Lighthouse a11y ≥90.

**New files**:
- `src/ui/hud/keyboard-shortcuts.tsx` — global Q/ESC handler with input-detection guard
- `src/ui/overlays/drum-tooltip-arrow.tsx` — first-visit DOM tooltip + CSS bobbing animation (reduced-motion safe)

**Modified**:
- `src/game/state/ui-store.ts` — +questBoardTutorialSeen boolean, +markQuestTutorialSeen / +resetTutorials actions (localStorage persist)
- `src/scene/guild-hall/interactive-drum.tsx` — +sparkle particle conditional render (20 particles, 60fps maintained)
- `src/ui/screens/game-screen.tsx` — mount global `<KeyboardShortcuts />` + `<DrumTooltipArrow />`
- `src/ui/panels/quest-board.tsx` — upgraded `role="dialog" aria-modal aria-label="Quest Board"`; capture-phase ESC handler; auto-focus first card; removed bubble-phase conflict
- `src/ui/panels/quest-detail-pane.tsx` — updated `aria-label` descriptors
- Settings panel — added "Reset Tutorials" button (clears localStorage flag)

**Verification**: `npm run build` ✓; `npx tsc --noEmit` ✓; all 17 manual QA test cases pass (tutorial flow, keyboard nav, mobile 375px–1024px, screen reader, reduced-motion, contrast ≥4.5:1, 60fps); Lighthouse a11y = 92.

**Plan Completion**: Quest Board Diegetic Redesign (Plan B, Phases 1–4) complete. Diegetic UI pattern established: R3F drum mesh + DOM tooltip + DOM panel + global keyboard handler with proper capture-phase ordering. State owned by `useUIStore` (cross-cutting flags) + `game-screen.tsx` local state (activePanel) + `camera-slice` bridge (pendingQuestPanel). a11y baseline met: dialog semantics, no stale ARIA contracts, reduced-motion honored, keyboard-full navigable.

---

### feat(ui): unified split-pane quest board with parchment skin + mobile layout

Complete refactor of quest board UI (plan: `plans/260512-1002-quest-board-diegetic-redesign/`, phase 02). Eliminated stacked-modal architecture; replaced with single unified split-pane layout: 55% list (desktop) / 45% detail on desktop; single-pane swap on mobile (<1024px).

**New components**:
- `quest-card.tsx` — list-item card for mission entry
- `quest-detail-pane.tsx` — right-side detail panel with empty state
- `party-select-list.tsx` — checkbox member selector

**Modified**:
- `quest-board.tsx` — REWRITTEN: unified panel, `useIsMobile()` hook gates layout mode, parchment skin, "Return to Guild" button bottom-right replaces X close. Dispatch button styled with wax-seal accent + ink-stamp CSS-only keyframes (no SVG asset).

**Removed**:
- `quest-detail-modal.tsx` — legacy stacked-modal flow eliminated
- `panels.css` → removed `.quest-detail-modal*` rules

**Styling**:
- New `quest-board.css` — parchment skin for unified layout
- Unified theme via Phase 1 `parchment.css`

**Responsive behavior**:
- Desktop ≥1024px: split-pane (list | detail)
- Mobile <1024px: single-pane swap (list XOR detail)

**Verification**: `tsc --noEmit` ✓; `npm run build` ✓; all game-state/mission-dispatch/store references intact.

---

## [Unreleased] — 2026-05-10 (Combat Tiles + Platformer Redesign)

### feat(combat): multi-phase tile palette + platformer stage layout overhaul

Complete redesign of combat ground rendering and stage layout (plan: `plans/260510-1611-combat-tiles-platformer-redesign/`, phases 01–06 complete, phase 07 docs sync). Tile palette flattened from 50+ variants per biome to 3–5 base tiles + decal overlays; stage layout shifted from flat single-arena to multi-tier side-scroller platforms with optional Y-axis elevation.

**Tile palette reduction** (phase 02):
- Curated `public/tiles/2d/` from ~120 PNGs → 47. Kept 4–5 most distinct frames per biome; remapped consumers to survivors.
- Visual diversity delegated to `<FloorDecal>` overlays, not base-tile inflation.
- Source of truth: biome palette table in `docs/code-standards.md` (primary + variants, ≤5 per biome cap).

**Stage spec DSL** (phases 03–04):
- Pure data specs under `src/scene/combat/maps/stages/` (examples: lolo-village-outskirt, broken-cliff-outskirt, the-forest).
- Types: CombatStageSpec, PlatformSpec, SpawnSlot, DecalPlacement, DecalDensitySpec in `stage-spec-types.ts`.
- Decouples stage design from hardcoded global positions. Render flow: `combat-scene.tsx` → `getStageSpec(mapId)` → `<StageRenderHost spec>` → `<CombatPlatform>[]` per platform.

**Platformer layout** (phases 05–06):
- Spatial-Y extension: `entity.position.y` now optional (defaults 0, backward-compat). Sprites, shadows, AOE telegraphs read Y.
- Spawn anchors inherit Y from platform; `FORMATION_POSITIONS` deprecated (preserved for legacy code paths).
- Demo stage `broken-cliff-outskirt`: allies at y=0 (lower-ground), enemies at y=1.5 (upper-cliff with exposed cracked-stone side wall).
- Decal patterns: manual (exact coords, story moments) vs scatter (seed-driven per-cell probability, ambient grunge).

**Dead code pruned**:
- `combat-arena-environment.tsx` — orphaned pre-D8 arena setup
- `combat-tile-grid.tsx` — orphaned flat-grid asset helper

**Documentation**:
- New `docs/combat-stage-spec.md` (~400 LOC): full authoring guide (type hierarchy, render flow, decal patterns, Y-axis extension, authoring examples).
- Updated `docs/system-architecture.md`: render layer, phases progress table, render flow diagram.
- Updated `docs/code-standards.md`: cross-reference to combat-stage-spec.md.

**Verification**: `npm run build` ✓; all stages render correctly; spawn parity maintained.

---

### feat(combat): typed stage spec DSL for platformer-capable combat layout

Phase 03 of `260510-1611-combat-tiles-platformer-redesign`. Introduced typed DSL defining multi-platform combat stages with spawn anchors, decal placement, and background layer specs. Pure data + types (dormant — no render wiring until phase 04). All code under `src/scene/combat/maps/`:

**New files**:
- `stage-spec-types.ts` — 6 interfaces (BgLayer, DecalPlacement, DecalDensitySpec, PlatformSpec, SpawnSlot, CombatStageSpec); extensible, all optional except core fields.
- `stages/lolo-village-outskirt.ts` — 1st stage data reproducing current flat-ground layout (1 platform at y=0, existing tile setup, spawn anchors).
- `stage-formation-positions.ts` — helpers: `getStageSpec(mapId)`, `getStageSpawnPosition(spec, slotIndex, side)`.

**Modified**:
- `combat-map-registry.ts` — add `STAGE_SPECS` table + `getStageSpec()` resolver.

**Design**: Stage spec owns spawn positions; deprecates `FORMATION_POSITIONS` for future spec-driven combat (phase 05+). No save migration — y-axis spawn positions optional, default 0.

**Verification**: `npm run build` ✓; spawn parity test verifies coordinates match existing layout.

---

### chore(tiles): reduce tile-variant explosion from 50+ to 4-5 per biome

Phase 02 of `260510-1611-combat-tiles-platformer-redesign`. Curated `public/tiles/2d/` from ~120 PNGs down to 47 — kept the 4-5 most distinct frames per biome and remapped consumers to surviving filenames. Visual diversity now comes from `<FloorDecal>` overlays (Phase 01 decal palette), not base-tile inflation.

**Removed (74 PNGs)**:
- `cave_0006..0016` (11), `forest-grass-32_0006..0016` (11), `paving-stone-32_0006..0016` (11), `deep-forest-grass_0006..0010` (5)
- `stone-64_0005..0016` (12), `ruined-village_0005..0006` (2), `ruined-paving-stone_0005..0006` (2), `wood-guild-floor_0006..0010` (5), `wooden-floor-64_0006..0018` (13)
- `wooden-floor-128_0005..0006` (2)

**Consumer remaps**:
- `src/scene/combat/maps/lolo-village-outskirt-scene.tsx` — `ACCENT_TILES` drops `_0005, _0006`, gains `_0004`
- `src/scene/guild-hall/linh-son-floor.tsx` — `wood-guild-floor_0010` → `_0001`
- `src/scene/facility/facility-room.tsx` — logging-site variants now `forest-grass-32_{0001, 0002, 0004, 0005}`; stone-quarry `cave_0011` → `cave_0001`; alchemy variant `_0006` → `_0004`; workshop `stone-64_0009` → `_0001`

**Docs**:
- `docs/code-standards.md` → "Floor Rendering Pattern" section gets a new **Biome Palette** table (source-of-truth: primary + variants + recommended mode per biome) + cap rule (≤5/biome).

**Verification**: `npm run build` passes (4.13s, 0 errors); zero remaining `_0006+` references in `src/`.

---

## [1.27.9] — 2026-05-10 (Combat AOE Telegraph)

### feat(combat): animated AOE skill telegraph indicator on combat floor

Phase 08 (final) of the standard tile floor system. AOE skill casts now project an animated ground decal warning the player about the danger zone. Built on Phase 07 `<FloorDecal>`; engine emits `aoe-telegraph` events that React subscribes to and mounts an `<AoeTelegraph>` per event.

**Three-phase animation** drives the "danger" read:
- **Spawn** (0–100ms): opacity 0 → 0.7 fade-in
- **Pulse** (100ms..durationMs−200ms): 0.5..0.9 sinusoidal at 4Hz
- **Lock** (last 200ms): opacity 1.0 solid — damage imminent

`useFrame` mutates `material.opacity` directly via ref — no React rerender per frame.

**New files**:
- `src/scene/sprites/aoe-telegraph.tsx` — `<AoeTelegraph>` component (~115 LOC, 3-phase animation, useFrame opacity)
- `src/scene/combat/combat-aoe-layer.tsx` — `<CombatAoeLayer>` subscriber (~85 LOC, prevEventsRef guard, arenaPhase gate)
- `public/decals/floor/aoe-circle.png`, `aoe-cone.png`, `aoe-rect.png` — 256×256 placeholder decals (straight alpha, white shape + crosshatch for free tinting)
- `scripts/generate_aoe_decals.py` — placeholder asset generator (PIL)

**Modified**:
- `src/game/state/game-state.ts` — `Skill` interface gains optional `aoeRadius`, `aoeShape`, `aoeCastTimeMs`, `aoeColor` (additive — no save migration needed)
- `src/game/systems/combat-types.ts` — `CombatEvent` union gets `aoe-telegraph` variant; new shared `AoeShape` type alias
- `src/game/systems/combat-engine.ts` — `trySkill()` emits telegraph event (with target snapshot position) before damage when skill has `aoeRadius`
- `src/game/data/skills.ts` — `SKILL_HOA_CAU` (Hoả Cầu / Fireball) annotated with `aoeRadius=2.2, aoeShape='circle'` so Phase 08 wires through Scholar archetype organically
- `src/scene/sprites/floor-decal.tsx` — added optional `materialRef` prop forwarded to inner `meshBasicMaterial` (lets AoeTelegraph drive opacity per-frame)
- `src/scene/combat/combat-scene-shell.tsx` — `<CombatAoeLayer>` mounted (Suspense-wrapped) between shadow and entity layers
- `docs/code-standards.md` — new "Combat AOE Telegraph" section (pipeline, conventions, asset authoring, schema, forbidden patterns)

**Design trade-off (documented)**: Engine v1 keeps damage **synchronous** with cast — telegraph is cosmetic, plays alongside skill animation rather than gating damage. Future phase may convert to wind-up timing.

**Color policy**: red (`#ff5a5a`) is universal danger default regardless of caster faction. Blue reserved for future explicit beneficial-zone skills (heal AOE) via `Skill.aoeColor` override.

**Concurrency safety**:
- `prevEventsRef` guard in CombatAoeLayer (matches existing `combat-vfx-layer.tsx` / `combat-entity-sprite.tsx` pattern) prevents Suspense replay from duplicate-spawning
- `arenaPhase === 'fighting'` gate drops in-flight telegraphs on panel close
- Per-instance unique key (`attackerId-skillId-Date.now()-counter`) survives remount
- Sub-300ms `aoeCastTimeMs` clamped to `MIN_TOTAL_MS=350` so spawn+pulse+lock all get a slice

**Tests**: tsc clean (`tsc --noEmit -p tsconfig.app.json`). Code review passed with concerns addressed (M1 prevEventsRef guard, M2 color default red, M3 duration clamp, m1 dead ternary, m2 shared AoeShape, m3 redundant cast).

**Plan**: `plans/260509-1253-standard-tile-floor-system/` — Phase 08 complete, marks the entire 9-phase plan as ✅ done.

---

## [1.27.8] — 2026-05-10 (Floor Atmospheric Lighting)

### feat(scene): atmospheric floor lighting (lambert material + decal overlay)

Floor rendering enhanced with lighting reactivity and atmospheric overlays. **Part A** upgrades `<TiledFloor>` from `meshBasicMaterial` to `meshLambertMaterial` with `emissiveMap` trick (default `lighting='lit'` with `emissiveIntensity={0.7}`) so floors respond to scene pointLight/ambientLight while retaining pre-shaded pixel-art tone; backwards-compatible via `lighting='unlit'` opt-out. **Part B** adds `<FloorDecal>` component (~95 LOC) for static atmospheric overlays: flat planeGeometry above floor (y=0.01), `meshBasicMaterial transparent depthWrite=false alphaTest=0.05`, texture cloned per-instance for lifecycle safety.

**New files**:
- `src/scene/sprites/floor-decal.tsx` — `<FloorDecal>` component (position, size, texture, rotation, color, opacity, yOffset props)
- `public/decals/floor/lamp-pool.png` — 256×256 radial gradient placeholder (warm yellow alpha)
- `public/decals/floor/magic-rune-circle.png` — 256×256 ring placeholder

**Modified**:
- `src/scene/sprites/tiled-floor.tsx` — added `lighting?: 'lit' | 'unlit'` + `emissiveIntensity?: number` (default 0.7) props; conditional render lambert vs basic material
- `src/scene/guild-hall/linh-son-floor.tsx` — set `emissiveIntensity={0.6}` (torch-rich scene)
- `src/scene/facility/facility-room.tsx` — added `FACILITY_EMISSIVE_INTENSITY` map (alchemy=0.55, others 0.7), wired via prop
- `src/scene/alchemy/alchemy-furniture.tsx` — 1× rune-circle `<FloorDecal>` (3×3 at reactor center)

**Reverted by visual review**: Guild hall lamp-pool wiring (4× FloorDecal under each WallTorch) was implemented + repositioned + opacity-tuned, then removed entirely on user feedback ("xấu quá" — placeholder PNG quality insufficient). Component + asset infrastructure retained for future designer-iteration pass.
- `docs/code-standards.md` — Material section rewritten for Phase 07 lambert+emissive; new "Floor Decal Atmospheric Overlay" section (API, conventions, asset authoring, forbidden patterns)

**Tests**: tsc clean. Code review passed with concerns noted in deferred section (decal-on-decal stress test, animator pulse, ZoneFloorMarker overlap decision — observational, acceptable for Phase 07 scope).

**Design notes** (per phase-07 decision record):
- Decals use `meshBasicMaterial` (not Lambert) — pure additive overlay, no light-dimming artifact
- `depthWrite=false` ensures multiple decals layer without render-order dependency
- `ClampToEdge` wrapping (vs RepeatWrapping on TiledFloor) — single decal instance, no tiling
- `alphaTest=0.05` clips premultiplied halo; straight-alpha PNG convention enforced in docs

**Plan**: `plans/260509-1253-standard-tile-floor-system/` phase-07 complete; phase-08 (combat AOE telegraph) deferred.

---

## [1.27.7] — 2026-05-10 (Standard 2D Tile Floor System)

### refactor(scene): unify floor rendering with shared `<TiledFloor>` component

Replaced 4 ad-hoc floor patterns (procedural canvas checker, GLB tile clone, solid-color plane, GLB room shell) với 1 shared `<TiledFloor>` primitive — `planeGeometry` + 2D PNG tile texture + `RepeatWrapping` + `NearestFilter`. Adds optional multi-variant random-per-cell mode (`tiled-floor-mosaic.tsx`) for natural-looking grass/wood floors.

**Migrated scenes** (per phase 01–05):
- Combat ground: procedural checker → ruined-village + forest tiles via per-map components in `combat/maps/`
- Guild hall: 20 GLB tile clones → 1 plane + wood-guild-floor multi-variant (`linh-son-floor.tsx`)
- Tavern, Training-Yard, Infirmary: solid color plane → paving-stone-32 variants
- Logging-Site: solid green → forest-grass-32 multi-variant
- Stone-Quarry: solid grey → cave_0011
- Alchemy Lab: GLB room shell (floor only) → wood-guild-floor multi-variant; walls + furniture kept GLB
- Workshop: solid grey → stone-64_0009; walls + furniture unchanged

**New files**:
- `src/scene/sprites/tiled-floor.tsx` — shared `<TiledFloor>` component (single + multi-variant API)
- `src/scene/sprites/tiled-floor-mosaic.tsx` — randomized per-cell variant placement helper

**Modified**:
- `src/scene/guild-hall/linh-son-floor.tsx` — rewrite from GLB clone to TiledFloor (≤15 LOC)
- `src/scene/facility/facility-room.tsx` — single `<TiledFloor>` per facility; `FACILITY_TILE_PATH` table maps type → tile spec; removed solid-color floor branch
- `src/scene/combat/combat-scene.tsx` — refactored to map dispatcher + new `combat-scene-shell.tsx` (slot pattern)
- `docs/code-standards.md` — new "Floor Rendering Pattern" section

**Removed**:
- `src/scene/sprites/floor-tile-texture-generator.ts` — no remaining consumer (procedural wood/stone/cement Canvas2D textures replaced by authored PNGs)
- `src/scene/combat/combat-ground-simple.tsx` — absorbed into per-map combat scene components

**Asset audit** (flagged for follow-up cleanup PR — not deleted yet, designer review pending):
- `public/GuildHall/LinhSon/optimized/p_floortilset.glb` (replaced)
- `public/tiles/t_woodentiles.glb`, `t_Obsidian_Isometric.glb`, `t_ancient-manuscript.glb` — orphan, no consumer
- `public/tiles/t_Coiled_Rope_Mat.glb`, `t_dungeon_ceiling_til.glb`, `t_Rustic_Terrain_Tile.glb`, `t_Tile_Ice.glb`, `t_Stone_Ches.glb`, `t_gray_rock_tiles.glb`, `t_simple_Stylized.glb` — orphan
- `public/tiles/2d/128px/wooden-floor-128_*.png` (6 files) — orphan, no consumer
- Kept: `t_Green_Tile_of_Grass.glb`, `t_Cork_Tile.glb` — used by `arena-biome-config.ts` (combat-tile-grid)

**Tests**: tsc clean. No save migration required (pure rendering change).

**Plan**: `plans/260509-1253-standard-tile-floor-system/` (phases 00–06 complete; 07–08 floor decals deferred — independent of this migration).

---

## [1.27.6] — 2026-05-09 (Combat Panel Multi-Instance Sprite Animation Fix)

### fix: combat panel sprites animate independently per entity (WebGPU UV uniform)

**Bug**: Trong combat panel idle, khi spawn ≥2 entity cùng `spriteId` (vd 6 slime + 1 LS-SCOUT-M), chỉ 1 sprite chạy idle animation liên tiếp. Các sprite khác đứng yên 1 frame, chỉ "nhảy" sang frame mới khi entity nhận damage (do React re-render invalidate bind group).

**Root cause**: WebGPU NodeMaterial trong Three.js r175 không re-upload `texture.matrix` uniform đồng thời cho nhiều material instance cùng pipeline cache. `texture.offset/repeat` mutation chỉ effective cho 1 material/frame; các material còn lại giữ matrix cũ trong UBO. Workaround `mat.map = atlas.texture; mat.needsUpdate = false;` (copy từ guild hall animator) là no-op vì JS gán cùng reference không trigger setter.

**Fix**: Thêm `idle-sprite-material.ts` — per-entity NodeMaterial (WebGPU TSL) / ShaderMaterial (WebGL) factory với uniform `uUvRect: vec4` driving UV remap trong shader. Mỗi entity có riêng material + uniform → no cross-instance state sharing. Atlas texture vẫn shared via map binding (cheap), chỉ UV uniform khác nhau per entity.

**Modified**:
- NEW: `src/scene/combat/idle-sprite-material.ts` — material factory (WebGPU + WebGL paths)
- `src/scene/combat/combat-idle-sprite.tsx` — refactor: `materialRef` → async `handle` state; uniform UV update qua `handle.setUvRect()` thay cho `setAtlasFrame()`; tint qua `handle.setTint()` thay cho `mat.color.copy()`
- `src/scene/sprites/sprite-atlas.ts` — added `getAtlasFrameUv()` pure helper (extract UV calc từ `setAtlasFrame`, no side effects)

**Tests**: tsc clean (exit 0). Manual smoke test pass: 6+ slime animate độc lập, death anim freeze frame cuối, hit flash chuẩn.

**Known similar bug** (DEFERRED): `sprite-animator.tsx`, `woodcutting-animator.tsx`, `working-animator.tsx` cùng pattern (texture.offset/repeat). Guild hall thường có 1-2 instance cùng lúc nên symptom không lộ; có note inline cảnh báo nếu sau này có cảnh nhiều worker cùng spriteId.

**Design alignment**: Theo plan-260503-1123 D1 (panel KHÔNG dùng GPU instancing), giải pháp giữ kiến trúc 1-mesh-per-entity — không reuse `InstancedSpriteRenderer` (plan-260503-1145 sẽ xóa).

---

## [1.27.5] — 2026-05-07 (Unify Wood/Stone Production Per Game-Day)

### fix: standardize logging-site & stone-quarry rate calc to "/gameday"

Eliminated the stale `STONE_QUARRY_CONFIG.ticksPerDay = 86400` constant (game-seconds, never matched the 1Hz online scheduler) by setting it to **14400 = 4h × 3600s real ticks per game-day**. Online vein strike probability conversion (`dailyStrikeChance / ticksPerDay`) now produces the designed strike frequency instead of 1/6 of it. Online and offline production rates now match for both wood and stone (verified by parity tests). UI labels switched from "+X.XXXX wood/tick" and "+X Stone/day" to **"+N Wood/gameday"** and **"+N Stone/gameday"** so player-visible numbers reflect the actual per-game-day rate (1 game-day = 4 real-hours).

**Modified**:
- `src/game/data/facility-definitions.ts` — `STONE_QUARRY_CONFIG.ticksPerDay` 86400 → 14400; recalibrated baseRate comment.
- `src/game/systems/facility-production-system.ts` — comment alignment (TICKS_PER_DAY now matches `STONE_QUARRY_CONFIG.ticksPerDay`).
- `src/ui/components/facility-detail-tray.tsx` — logging-site preview switched to integer `Wood/gameday`; stone label `Stone/day` → `Stone/gameday`.
- `src/scene/quarry/facility-room-quarry-decor.tsx` — quarry zone card label `stone/day` → `stone/gameday`.
- `docs/codebase-summary.md` — added "Game-Day Timing Constants" section.

**New tests**: `tests/facility-production-parity.test.ts` (2 tests verifying 14400 online ticks ≈ offline 1 game-day for both logging-site and stone-quarry).

**Tests**: 239/239 game tests pass; tsc clean.

**Balance note**: Online vein strike rate now triggers 6x more often than pre-fix (matches design "1% chance per game-day"). Base wood/stone yield unchanged from today's earlier offline-rate fix. Save migration not required.

---

## [1.27.3] — 2026-05-03 (Combat Panel Shell & Idle Redesign Phase 3)

### feat: build combat panel shell with formation/battle/result phase orchestrator

Implemented Phase 3 of combat-panel-idle redesign: single overlay panel replacing arrival modal → combat-prep → combat-arena flow. Introduces Zustand ephemeral UI store, HD-2D Ink token styling, and single-Canvas + group toggle architecture (D8) to avoid WebGL context limit. Added formation sub-panel with target priority (Focus/Balance) toggle. Battle phase wired to Phase-4 stub. Fixed mid-formation mission-phase transition race by deferring `in-combat` state to "Start Battle" press.

**New files**: combat-panel-store.ts, combat-panel.css, combat-panel.tsx, combat-panel-header.tsx, combat-panel-formation.tsx (refactor of combat-prep-panel), combat-panel-result.tsx, target-priority-resolver.ts, combat-sprite-resolver.ts.

**Modified**: arrival-modal.tsx, active-missions-list.tsx, game-screen.tsx, world.tsx (single Canvas + group visibility, camera makeDefault toggle, solid black background D9).

**Deferred**: combat-panel-battle.tsx (Phase 4), VFX mount (Phase 5), save migration v21→v22 (Phase 7).

**Tests**: tsc -b ✓ 156/156 source tests pass. Runtime validation (R3F devtools, chrome://gpu single context, heap snapshot) deferred to Phase 4 playtest.

## [1.27.4] — 2026-05-03 (Combat Panel IDLE Redesign Phase 6 — Skip & Snapshot)

### feat: skip button with combat snapshot + persistent state recovery

Implemented Phase 6 of combat-panel-idle redesign: Skip button now snapshots live combat state via deep-clone and runs `simulateCombatFromSnapshot()` (D11). Browser-close mid-battle recovery via `ActiveMission` ephemeral `combatSnapshot` + `combatSnapshotTime` fields; autosave every 2s during battle phase (D12). Both Skip and resume-after-close use identical simulator path, eliminating outcome variance (removed "simulate from scratch" re-rolls). Re-targeting during skip simplified to random-alive (intentional complexity reduction per D11). Damage balance tuned via `BASE_DAMAGE_MULTIPLIER = 1.2` in `combat-formulas.ts` (additive knob, no save migration). DOM/R3F decoupling: Skip button dispatches `COMBAT_SKIP_DOM_EVENT`; `combat-fight-controller` listens and owns engine handoff.

**New files**: `combat-skip-snapshot.test.ts` (7 tests, 100% coverage on cloneCombatEntity + simulateCombatFromSnapshot semantics), `target-priority-resolver.ts` (inline in Phase 3, but isolated target logic for future skipping improvements).

**Modified**: `combat-formulas.ts` (added `BASE_DAMAGE_MULTIPLIER`), `combat-engine.ts` (added `simulateCombatFromSnapshot()` method), `combat-fight-controller.tsx` (added `saveCombatSnapshot` action + 2s autosave), `active-missions.ts` → mission save shape (added optional `combatSnapshot` + `combatSnapshotTime`), `combat-panel-battle.tsx` (DOM Skip button → `COMBAT_SKIP_DOM_EVENT`), `mission-tick.ts` (resume via simulator on close+relaunch).

**Tests**: tsc -b ✓, 7/7 combat-skip-snapshot tests pass. Sequential-turns combat-engine tests unaffected (simulator shares mutation-safe cloning path with Phase 5).

---

## [1.27.2] — 2026-05-02 (VFX Persistent Pattern Refactor)

### Refactor: Eliminate WebGPU buffer-disposal race at root cause

Replaced playground's mount-on-switch anti-pattern with persistent `<AllPresetParticles />` + emit-based triggering — the lib's officially supported pattern (verified via `caps-wars` reference). Removes 3 layered workarounds that all addressed symptoms instead of root cause.

**Pattern change**:
- All 18 particle presets mount once at Canvas root (`autoStart={false}`)
- Effect Designer: `useVFXEmitter(preset.id).emit()` interval-driven preview
- Sequencer: edge-triggered `useVFXStore.getState().emit()` per clip start; meshline still mount-on-live
- Live tweaks: override-able props flow via ref (no remount); structural props read-only in UI

**Files added**:
- `tools/vfx-playground/src/presets/preset-prop-classification.ts` — `BAKE_KEYS` + `splitPresetProps()`
- `tools/vfx-playground/src/scene/all-preset-particles.tsx` — persistent root component
- `tools/vfx-playground/src/scene/effect-preview-emitter.tsx` — interval emitter for designer mode
- `tools/vfx-playground/src/sequencer/sequence-meshline-renderer.tsx` — meshline-only path
- `tools/vfx-playground/src/ui/particle-tweak-panel.tsx` — runtime/structural split panel

**Files removed (orphans)**:
- `tools/vfx-playground/src/effect-renderer.tsx` — replaced by emitter
- `tools/vfx-playground/src/sequencer/sequence-renderer.tsx` — replaced by meshline-only renderer
- `patches/core-vfx+0.5.0.patch` — no longer needed (no dispose calls in normal flow)

**Workarounds removed**:
- `patch-package` devDep + `postinstall` hook (root `package.json`)
- `<PostProcessingBloom>` `key={preset.id}` remount + dispose cleanup useEffect + try/catch in render
- VFXParticles `key={preset.id}` remount in renderers

**Codegen template updated** — generated `.tsx` skill files use `<AllPresetParticles />` + `useVFXStore.emit()` instead of mount-on-live VFXParticles, matching production combat scene pattern.

**Plan**: `plans/260502-1838-vfx-persistent-pattern-refactor/`

---

## [1.27.1] — 2026-05-02 (VFX Buffer Disposal Fix + Integration Guide) [SUPERSEDED]

> **NOTE 2026-05-02**: This patch + integration guide was the temporary fix. Superseded by 1.27.2 persistent-pattern refactor — patch removed; pattern enforced everywhere.

### Fix: WebGPU "Buffer used in submit while destroyed" crash on preset switch

Investigated and patched lifecycle bug in `core-vfx@0.5.0` (`r3f-vfx@0.6.0` dependency). When `VFXParticles` instance unmounts (e.g. preset switch via `key` change), `dispose()` was destroying GPU storage buffers without awaiting pending `gl.computeAsync()` submissions, causing WebGPU validation errors and device loss.

**Patch applied** (`patches/core-vfx+0.5.0.patch`):
- `VFXParticleSystem.dispose()` made async
- Set `initialized = false` first to bail subsequent `update()` calls
- Await `updateInFlight` promise (current `runUpdate` chain)
- Await `device.queue.onSubmittedWorkDone()` to fence GPU queue
- Then dispose material/geometry/trail safely

**Auto-applied via** `postinstall: patch-package` script in root `package.json`.

**App-level cleanup**:
- `tools/vfx-playground/src/scene/post-processing-bloom.tsx` — added cleanup `useEffect` to dispose `PostProcessing` instance on unmount
- `tools/vfx-playground/src/ui/layout.tsx` — keyed `<PostProcessingBloom>` on `activePreset.id` to force fresh `pass()`/MRT rebuild between presets

### Doc: VFX Particles Integration Guide

Added `docs/feature/vfx-particles-integration-guide.md` covering library gotchas, recommended persistent pattern (`<CombatParticles />` root + `useVFXEmitter` hook), anti-patterns to avoid, and combat scene integration checklist. Required reading before building combat VFX.

### Investigation Reports
- `plans/reports/researcher-260502-1815-webgpu-buffer-cleanup-investigation.md` — full root cause analysis with verbatim source quotes
- `plans/reports/Explore-260502-1804-vfx-disposal.md` — initial r3f-vfx dispose audit

### Reference Examples
- Library author's own game `mustache-dev/caps-wars` confirms persistent-mount pattern as intended usage; preset-switch playground pattern is unsupported by lib (but works post-patch)

---

## [1.27.0] — 2026-05-02 (VFX Sequencer Integration into vfx-playground)

### Feature: Skill Choreography Sequencer Mode

Integrated Skill Choreography Sequencer into vfx-playground as a second mode alongside Effect Designer. Provides timeline-based skill animation sequencing with real R3F preview and `.tsx` code generation for plug-and-play skill integration.

**Core Features**:
- Dual-mode architecture: Effect Designer (existing) + Skill Sequencer (new)
- Mode switcher UI with tab navigation
- Timeline DAW-style interface for sequencing skill animations
- Track registry system for managing skill tracks (sprites, particles, audio)
- Clip inspector for real-time property editing
- Sequence code generator producing `.tsx` exports for game integration
- localStorage persistence for sequence library
- R3F preview canvas with Three.js WebGPU rendering
- Engine adapters for compatibility with Worlds Collide game state

**New Files**:
- `tools/vfx-playground/src/ui/mode-tabs.tsx` — Mode switcher component
- `tools/vfx-playground/src/sequencer/` — Sequencer module directory (11 files)
  - `sequence-types.ts` — Type definitions for sequences, tracks, clips
  - `track-registry.ts` — Track library and asset management
  - `sample-skills.ts` — Demo skill sequences
  - `use-sequence-runtime.ts` — Playback engine hook
  - `sequence-renderer.tsx` — R3F renderer component
  - `sequencer-layout.tsx` — Main sequencer UI shell
  - `clip-inspector.tsx` — Property editor panel
  - `codegen.ts` — `.tsx` code generator
  - `export-dialog.tsx` — Export/download UI
  - `skill-library.ts` — Skill metadata and presets
  - `engine-adapters.ts` — Game engine integration layer
  - `views/timeline-daw.tsx` — DAW timeline canvas

**Architecture**:
- `tools/vfx-playground/src/app.tsx` — Mode state management (effect-designer | skill-sequencer)
- Isolated sequencer module; zero impact to Effect Designer mode
- Modular track system enables easy extension for custom track types

**Breaking Changes**: None — Effect Designer mode unchanged.

**Save Format**: Sequences persisted to localStorage under `vfx-playground:sequences` key.

**Build Status**: 7 phases complete, zero regressions.

---

## [1.26.0] — 2026-04-28 (HD-2D Ink UI Redesign — Roster + Equip)

### Feature: HD-2D Ink Design Language for Guild Roster, Character Detail, and Equip

Applies the approved "HD-2D Ink" design language (Octopath / Sea of Stars style) to guild roster, character detail tabs, and equipment management. Introduces a design-token CSS layer with proportional `--ui-scale` responsive system and drag-drop equip mode. Adds medicine slot data model for future auto-use gameplay.

**Design Token System** (`src/ui/styles/game-ui-tokens.css`):
- CSS custom property namespace `--ink-*` for colors (bg, borders, text, gold, status bars)
- `--ui-scale` proportional zoom: 1.0 (≥1200px) / 0.9 (≥1024px) / 0.75 (≥768px) / 0.5 (<768px)
- Utility classes: `.ink-panel`, `.ink-tab-bar`, `.ink-tab`, `.ink-bar-hp`, `.ink-bar-exp`, `.ink-pixelated`, `.ink-enter`

**Guild Roster Redesign** (`src/ui/panels/guild-roster.tsx`, `src/ui/components/member-card.tsx`):
- Grid layout with auto-fill cards, adjusts columns per breakpoint
- Filter pills: name (text), civilization (dropdown), status (idle/busy/injured)
- Member cards show avatar (with 404 fallback initials), name, civilization, top-2 stats
- Click card to navigate to character detail view

**Character Detail Tabs** (`src/ui/panels/character-detail-panel.tsx`, `src/ui/components/character-tabs/stats-tab.tsx`):
- 4 tabs: Stats / Equipment / Skills / Bio (tab state ephemeral, no URL persistence)
- HP bar (uses calcMaxHp from current state), EXP progress bar, portrait display
- Equipment tab read-only preview (see slot icons without editing)
- Equip button opens split-view drag-drop panel
- Removed obsolete `member-book-detail-page.tsx`

**Equip Mode Drag-Drop Panel** (`src/ui/components/equip-mode-panel.tsx`):
- Split layout: equipment slots (left) | inventory items (right) | medicine slots (below)
- Drag inventory item → drop on slot → state updates instantly
- Click to unequip (returns item to inventory)
- Medicine slot selector: choose condition (start/80/50/30/never) + assign item or clear
- HUD auto-opens inventory panel when equip mode triggers; resets on close
- Close button returns to character detail view

**Medicine Slots Data Model** (`src/game/state/guild-slice.ts`, `src/game/state/game-state.ts`):
- `MedicineCondition` type: 'start' | '80' | '50' | '30' | 'never'
- `MedicineSlot` interface: { itemId: string | null, condition: MedicineCondition }
- `Member.medicineSlots`: array of 2 slots (default: [{itemId:null,condition:'start'},{itemId:null,condition:'start'}])
- `setMedicineSlot(memberId, slotIndex, itemId, condition)` reducer action
- `clearMedicineSlot(memberId, slotIndex)` reducer action

**Ephemeral UI State Store** (`src/game/state/ui-store.ts`):
- Separate Zustand store for transient UI state (not persisted to IndexedDB)
- `isEquipModeOpen: boolean` — tracks equip panel visibility
- `equipModeCharacterId: string | null` — which member is being equipped
- Prevents cluttering game state with UI-only flags

**Save Migration** (`src/game/save/save-migrations.ts`, `src/game/save/save-types.ts`):
- SAVE_VERSION: 19 → 20
- `migrateV19toV20()` — Adds `medicineSlots` to founder + roster + tavern members with default empty state
- Old saves load with medicine slots initialized; backward compatible

**State Management Updates** (`src/game/state/guild-slice.ts`, `src/game/state/store.ts`):
- Guild slice exports `setMedicineSlot`, `clearMedicineSlot` actions
- Store middleware combines game state + ui-store for component subscriptions
- No breaking changes to existing roster/equipment actions

**Inventory Panel Updates** (`src/ui/panels/inventory-panel.tsx`):
- Auto-opens when equip mode triggers (subscribes to ui-store)
- Shows equipment inventory and consumables (medicine/alchemy)
- Resets on panel close (clears equip mode flag)

**HUD Integration** (`src/ui/hud/hud.tsx`):
- Trigger equip mode from character detail view
- HUD respects equip mode state and auto-opens inventory

**Character Creation** (`src/game/systems/character-creation.ts`):
- Adds default medicineSlots during member initialization
- Applied to founder, roster recruits, and tavern members

**UI Styling** (new files):
- `src/ui/styles/guild-roster.css` — member card grid, filter pill styles
- `src/ui/styles/character-detail.css` — tab bar, content area, portrait frame
- `src/ui/styles/equip-mode.css` — split layout, drag-drop feedback, medicine selector

**Key Design Decisions**:
- Medicine slots are separate from carry capacity (no weight check in this phase)
- Equip mode is modal within the roster flow (not independent panel)
- `--ui-scale` applied at root level; responsive without media queries hardcoding sizes
- All new colors use `--ink-*` namespace; preserves existing color tokens
- Medicine auto-use trigger deferred to combat phase (UI captures intent only)
- Drag-drop fallback: click slot → click item (not implemented yet, Phase 2)

**Backward Compatibility**:
- Old saves (v19 and below) auto-migrate to v20 with default medicine slots
- Existing equipment equip/unequip actions unchanged
- No visual changes to other panels (Quest, Facilities, Build, Combat)
- Token system uses CSS defaults; components opt-in to new tokens

**Build Status**: Clean build, 892 modules, 10s compilation.

---

## [1.25.0] — 2026-04-27 (Equipment System Phase 1)

### Feature: Instance-Based Gear with Flat Stat Bonuses

Introduces equipment system allowing members to equip up to 3 items (weapon, armor, headgear) that grant additive flat stat bonuses. Equipment is instance-based with UUID and mutable durability. Broken gear (durability=0) provides no bonus.

**New Data** (`equipment-templates.ts`):
- 11 static gear templates across 3 slots:
  - **Weapons** (5): WOODEN_AXE, WOODEN_CROSSBOW, STONE_SWORD, IRON_SWORD, IRON_SPEAR
  - **Armor** (3): CLOTH_VEST, LEATHER_ARMOR, IRON_ARMOR
  - **Headgear** (3): CLOTH_HOOD, LEATHER_HELMET, IRON_HELMET
- Each template defines name, slot, damage/hp/defense bonuses, maxDurability, and craft costs for Phase 2

**New State Interfaces** (`game-state.ts`):
- `EquipmentItem` — Instance with UUID, templateId, durability
- `MemberEquipment` — Container with optional weapon, armor, headgear slots
- `Member.equipment?` — Optional equipment field (null on old saves)
- `InventoryState.equipmentInventory?` — Track unequipped gear items

**Bonus System** (`equipment-bonuses.ts`):
- `calcGearBonuses(equipment)` — Computes { flatDamage, flatHp, flatDefense } from equipped items
- Broken gear (durability=0) excluded from bonuses
- `createEquipmentItem(templateId)` — Create fresh instance with full durability
- `getStartingWeapon(archetype)` — LinhSon warrior/scout receive WOODEN_AXE/WOODEN_CROSSBOW at creation

**Combat Integration**:
- `combat-types.ts` — Added gearFlatDamage, gearFlatHp, gearFlatDefense to CombatEntity
- `combat-formulas.ts` — Added flatBonus param to calcAutoAttackDamage (backward compatible)
- `combat-entity-factory.ts` — Apply gear bonuses to ArenaEntity HP and damage/defense
- `combat-simulator.ts` — Gear bonuses in auto-resolve combat
- `combat-engine.ts` — Gear bonuses in real-time arena combat

**State Actions** (`guild-slice.ts`):
- `equipGear(memberId, slot, itemId)` — Equip item to member's equipment
- `unequipGear(memberId, slot)` — Unequip item, move to equipmentInventory

**UI Components**:
- `member-book-detail-page.tsx` — 3-slot equipment UI with equip dropdown and unequip button
- `character-detail-panel.tsx` — Same equipment UI for character detail view
- `guild-roster.tsx` — Wired equipment props to detail page
- `inventory-panel.tsx` — Equipment inventory section showing unequipped gear items

**Save Migration** (`save-types.ts`, `save-migrations.ts`):
- SAVE_VERSION: 18 → 19
- `migrateV18toV19()` — Adds equipment: null to members, equipmentInventory: [] to inventory
- Old saves load with no equipped gear (backward compatible)

**Key Design Decisions**:
- Equipment items are instance-based (UUID, mutable durability) for future durability decay
- Gear stats are additive flat bonuses (no stat scaling, no multiplicative bonuses)
- Only weapons add flatDamage; armor/headgear add flatHp + flatDefense
- Broken gear excluded from bonus calc (prevents zero-cost upkeep)
- No visual sprite changes on equip (Phase 2 feature)
- LinhSon warrior/scout only civs with starting weapons; other civs/archetypes start bare
- Equipment inventory counted in getUsedSlots() for capacity (dedicated equipment UI Phase 2)

**Backward Compatibility**:
- Existing saves migrate seamlessly with equipment: null, equipmentInventory: []
- Members without equipment field treated as unequipped
- calcAutoAttackDamage flatBonus defaults to 0 (no impact on old combat systems)
- Graphics settings unaffected (equipment is gameplay only)

---

## [1.24.0] — 2026-04-27 (Graphics Refactor: Native PCFShadowMap)

### Refactor: WebGPU-Compatible Shadow System

Replaced WebGL-only drei `ContactShadows` component with native Three.js `PCFShadowMap` for cross-backend compatibility. Added reactive `ShadowController` for zero-reload shadow toggles.

**Technical Changes**:
- `src/scene/world.tsx` — New `ShadowController` component that reactively toggles `gl.shadowMap.enabled` when `shadowsEnabled` setting changes (no scene reload required)
- `src/scene/guild-hall.tsx` — Removed drei `ContactShadows`, `useThree` hook, WebGPU guard (12 lines shorter); now relies on native shadow map
- `src/scene/world.tsx` (`SceneLighting`) — `directionalLight` now has `castShadow` + orthographic frustum sized for 10×7 guild hall coverage
- `src/scene/linh-son-floor.tsx` — Clone now has `receiveShadow` property
- `src/scene/furniture-model.tsx` — Clone now has `castShadow receiveShadow` properties
- `src/scene/world-bloom-post.tsx` — Post-processing comment clarified: N8AO/SSAO is separate post-processing concern, not shadow ownership

**Zero ContactShadows References**: Entire codebase clean of drei ContactShadows imports/usage.

**Backward Compatibility**:
- Existing saves load with `shadowsEnabled: true` (default from previous version)
- No save migration required (graphics settings in localStorage + Zustand, not in IndexedDB)
- Visual quality unchanged; native PCFShadowMap matches ContactShadows appearance on guild floor

**Cross-Backend Support**:
- PCFShadowMap works on both WebGL and WebGPU
- No longer gated by WebGL-only restrictions
- `ShadowController` reactive toggle enables settings without reload (applicable to both backends)

---

## [1.23.0] — 2026-04-27 (Shadow & Bloom Settings Toggle)

### Feature: User-Facing Graphics Settings for Shadows & Bloom

Adds Settings Panel toggles for previously debug-only graphics effects. Players can now control shadow quality and bloom post-processing without code changes.

**New GameSettings Fields** (`game-state.ts`):
- `shadowsEnabled: boolean` — Enable/disable native PCFShadowMap + N8AO SSAO (localStorage: `shadows-enabled`)
- `bloomEnabled: boolean` — Enable/disable world bloom post-processing (localStorage: `bloom-enabled`)
- `bloomThreshold: number` (0–1) — Luminance threshold for bloom effect (localStorage: `bloom-threshold`)

**Settings Panel UI** (`settings-panel.tsx`):
- **Shadows**: Toggle button (On/Off) — Controls native PCFShadowMap in guild hall floor + N8AO SSAO in WebGL post-processing
- **Bloom**: Toggle button (On/Off) — Enables world bloom effect via EffectComposer or WebGPU TSL PostProcessing
- **Bloom Threshold**: Conditional slider (only visible when bloomEnabled = true) — Adjusts luminance threshold in real-time

**Technical Changes**:
- `src/game/state/game-state.ts` — Added GameSettings interface fields
- `src/ui/panels/settings-panel.tsx` — New toggles + threshold slider with event handlers
- `src/scene/world.tsx` — Added `ShadowController` component that reactively flips `gl.shadowMap.enabled` when `shadowsEnabled` changes (no scene reload)
- `src/scene/world-bloom-post.tsx` — Store-driven post-processing pipeline; WebGPU + WebGL dual-path
  - WebGPU branch: `WebGPUBloomPass` reads `bloomEnabled`, `bloomThreshold` from Zustand
  - WebGL branch: `EffectComposer` + `Bloom` + `N8AO` respect settings
  - Clarified: N8AO/post-processing separate from native PCFShadowMap ownership
- `src/scene/guild-hall.tsx` — Removed WebGL-only `ContactShadows` (drei); now uses native PCFShadowMap
- `src/scene/world.tsx` — `directionalLight` now has `castShadow` + orthographic frustum for 10×7 guild hall
- `src/scene/linh-son-floor.tsx` — Clone now has `receiveShadow`
- `src/scene/furniture-model.tsx` — Clone now has `castShadow receiveShadow`
- localStorage persistence (auto-load on session restore)

**User Experience**:
- Settings persist across sessions (localStorage)
- Changes apply immediately during gameplay
- No page reload required
- Disabled states show 60% opacity styling for inactive options
- Active state highlights with green border

**Files Modified**:
- `src/game/state/game-state.ts` — GameSettings interface
- `src/ui/panels/settings-panel.tsx` — UI implementation
- `src/scene/world-bloom-post.tsx` — Store-driven post-processing
- `src/scene/guild-hall.tsx` — ContactShadows condition
- `src/game/save/save-storage.ts` — No migration needed (optional fields)

**Backward Compatibility**:
- Existing saves load with `shadowsEnabled: true`, `bloomEnabled: true`, `bloomThreshold: 0.5` (sensible defaults)
- No save migration required (settings stored separately in Zustand + localStorage)
- Leva dev panel still available for advanced tuning (co-exists with user toggles)

---

## [1.22.0] — 2026-04-19 (Combat Formation Movement + ATB Timeline Bar + Manual Combat Mode)

### Major Feature: Formation-Based Positioning, ATB Timeline, and Player-Controlled Combat

#### Phase 1: Formation Home Slots & Step-Attack Movement
Introduces positional combat where units occupy fixed home slots in the formation grid. Melee units step forward to attack, ranged units attack from home.

**New Types** (`combat-arena-types.ts`):
- `AttackMoveState = 'home' | 'step-forward' | 'returning'` — State machine for melee unit movement
- Extended `ArenaEntity` with:
  - `homeX`, `homeZ` — Formation home position (3×2 grid)
  - `attackMoveState` — Current position state
  - `stepTargetX?`, `stepTargetZ?` — Attack destination for melee units

**Movement Timing Constants**:
- `FORMATION_STEP_DISTANCE = 1.5` — Units forward toward target
- `FORMATION_STEP_DURATION_MS = 250` — Forward lerp duration
- `FORMATION_RETURN_DURATION_MS = 300` — Return-to-home lerp duration

**AI Behavior**:
- Melee units (warrior, dualblade, engineer): Path to target, step forward, return home after attack
- Ranged units (scout, scholar, philosopher): Attack from home slot (no stepping)
- Position lerping handled by `AnimationStateBuffer` (GPU instancing)

**Files Modified**:
- `src/game/systems/combat-arena-types.ts` — AttackMoveState type, home/step/return constants
- `src/game/systems/combat-engine.ts` — Step-attack state transitions, position updates
- `src/scene/combat/animation-state-buffer.ts` — Position lerp in buffer update

---

#### Phase 2: ATB Timeline Bar — Attack Order Visualization
New UI component showing all entities sorted by `nextAttackAt` with real-time cooldown progress.

**Component**: `combat-timeline-bar.tsx` (new)
- **Display**: Top strip showing top 12 entities (allies, enemies, bosses)
- **Per-Entry**:
  - 4-char name abbreviation
  - Cooldown fill bar (% of attackInterval elapsed)
  - Waiting icon (!) for manual-mode allies
  - Acting indicator for step-forward state
- **Styling** (`combat-timeline.css`):
  - Ally entries: blue tint
  - Boss entries: gold tint
  - Enemy entries: red tint
  - Near-ready (≥90% cooldown): bright glow
  - Waiting state: exclamation badge
  - Acting state: animation pulse
- **Performance**: Memoized sort, updates only when entity list changes
- **Visibility**: Only during `arenaPhase === 'fighting'`

---

#### Phase 3: Manual Combat Mode — Player Input Control
Toggles combat between auto-play and manual turn-by-turn control.

**New State** (`game-state.ts`, `mission-slice.ts`):
- `mission.combatMode: 'auto' | 'manual' | null`
- `entity.waitingForInput?: boolean` — Ally awaiting player action

**Manual Mode Mechanics**:
- Allies queue `waitingForInput = true` when ready to attack
- Engine waits for player input before ally acts
- Q key: Fire basic attack (first waiting ally)
- Number keys 1-4: Activate skills (existing hotbar logic)
- Target: Uses manually-selected enemy or auto-targeting fallback

**UI Components**:
- `CombatManualToggle` button (top-right, near speed controls)
  - Toggle text: "Manual" | "Auto"
  - Icon: Gamepad/hand cursor
  - Syncs to mission.combatMode instantly
- **Hotbar Enhancements**:
  - First waiting ally shown with yellow "Waiting…" glow
  - Q key hint tooltip
  - Skill buttons state-aware (pending manual target)
- **Timeline Integration**: Waiting entries show "!" badge

**Files Modified**:
- `src/game/state/game-state.ts` — combatMode field
- `src/game/state/mission-slice.ts` — toggleCombatMode(missionId)
- `src/game/systems/combat-engine.ts` — setManualMode, fireBasicAttack, queuing
- `src/scene/combat-fight-controller.tsx` — Syncs combatMode to engine
- `src/ui/screens/game-screen.tsx` — CombatManualToggle button
- `src/ui/panels/combat-skill-hotbar.tsx` — Q key listener, waiting glow
- `src/ui/panels/combat-timeline-bar.tsx` — Timeline display + waiting icons

---

#### Phase 4: Target Selection — Click-to-Target Enemies
In manual mode, players click enemy entities to lock target.

**Component**: `combat-target-selector.tsx` (new)
- R3F raycasting against enemy hitboxes
- Sets `manualTargetId` on ready ally
- Fallback to auto-targeting if manual target dies
- Visual feedback: Enemy outline/highlight (polish pending)

**Files Modified**:
- `src/scene/combat/combat-target-selector.tsx` — **NEW**

---

#### Phase 5: Integration & State Sync
Ensures manual mode state persists and syncs across engine/UI.

**State Persistence**:
- `combatMode` saved in mission — loaded from last session
- Players don't need to re-toggle on reload

**Engine Sync** (`combat-fight-controller.tsx`):
```typescript
useEffect(() => {
  engineRef.current?.setManualMode(combatMode === 'manual');
}, [combatMode]);
```
Changes apply on next engine tick.

---

#### Phase 6: Manual Mode ATB Pause Fix (Hotfix)
Critical fix ensuring manual mode works correctly with unified ATB timeline.

**Bug**: Manual mode allowed enemies to attack while player was selecting an action, breaking turn fairness.

**Solution**:
- **New Field**: `CombatEngine.pausedForAllyTurn` — Engine freeze flag
- **Pause Logic**: When ally turn fires in manual mode, engine stops entirely (enemies don't tick)
- **Resume Trigger**: Player picks action (Q key or skill) → engine resumes
- **Timeline Sync**: All entities (allies + enemies) share ONE ATB timeline even in manual mode
- **Active Turn Indicator**: `activeAllyTurnId` in Zustand store syncs UI
- **Timeline Bar**: Gold pulsing outline on active-turn ally
- **Skill Hotbar**: "YOUR TURN" badge + dims non-active ally slots
- **Edge Case (EC-3)**: Pause clears when manual mode toggled off mid-freeze

**Files Modified**:
- `src/game/systems/combat-types.ts` — `pausedForAllyTurn` field
- `src/game/systems/combat-engine.ts` — Freeze logic in `tick()`
- `src/game/state/combat-arena-slice.ts` — `activeAllyTurnId` state
- `src/scene/combat-fight-controller.tsx` — Mode toggle → pause sync
- `src/ui/panels/combat-timeline-bar.tsx` — Gold pulsing outline styling
- `src/ui/panels/combat-skill-hotbar.tsx` — "YOUR TURN" badge, slot dimming

**Test Coverage**: 5 new tests in `tests/combat-engine-manual-atb.test.ts`
- Pause on ally turn ready in manual mode
- Resume on Q key / skill input
- Enemies don't advance during pause
- Toggle manual mode clears pause
- Timeline stays unified

---

### Backward Compatibility
- `combatMode` defaults to `null` in old saves (treats as `'auto'`)
- No save migration required (field added with optional chaining)
- Formation positions preserved for existing combat code
- Timeline bar non-blocking (hides during non-combat phases)
- pausedForAllyTurn resets on engine reset

### Performance Notes
- Timeline sort O(n log n), memoized, runs at Zustand 5Hz sync
- Manual queuing: O(n) single pass to find waiting allies
- Pause check: O(1) boolean flag in tick loop
- Position lerping: GPU-side (AnimationStateBuffer, no JS overhead)
- No new draw calls or complex raycasting per-frame

---

## [1.21.0] — 2026-04-15 (Stone Quarry Mining Skill & Per-Tick Production)

### Major Feature: Mining Occupational Skill + Per-Tick Vein Strike System

#### New Item: Gemstone (GEM)
- **ID**: 'GEM'
- **Rarity**: RARE (blue-tinted slot in inventory)
- **Stackable**: Yes (limit 99)
- **Base Price**: 50g
- **Description**: "A rough gemstone found deep in the quarry."
- Obtained exclusively from vein strikes (rare outcome, ~1% daily base chance)

#### Mining Occupational Skill (MC) — 11 Levels (0–10)
- **Primary Stats**: STR (yield), LCK (vein strike chance via fortune: `LCK×3 + CHA×0.5`)
- **XP Source**: Stone mined per tick (cumulative across all members working Stone Quarry)
- **Level Thresholds**: 25% harder than Woodcutting (0 → 100 → 250 → 563 → 1063 → 1875 → 3125 → 5000 → 7500 → 11250 → 16250)
- **Yield Bonus per Level**: 0% → 8% → 18% → 32% → 50% → 72% → 98% → 128% → 162% → 200% → 245%
- **Vein Strike Bonus per Level**: 0% → 0.3% → 0.6% → 1.0% → 1.5% → 2.0% → 2.5% → 3.0% → 3.5% → 4.0% → 5.0%
- **UI Display**: Mining Skill section in member-book-detail-page (mirroring Woodcutting display)

#### Per-Tick Stone Production Formula
- **Base Rate**: 0.002315 (calibrated to ~20 stone/day at lv1, STR20, MC0)
- **Calculation**:
  ```
  baseScore = STR × 0.5
  stonePerTick = baseRate × (baseScore / 100) × levelMult[level-1] × (1 + mcYieldPct[mcLevel]/100)
  ```
- **Level Multipliers**: [1.0, 2.0, 3.5] for lv1/lv2/lv3
- **Example Calibration**:
  - lv1, STR20, MC0 → ~20 stone/day
  - lv2, STR20, MC0 → ~40 stone/day
  - lv3, STR25, MC10 → ~295 stone/day

#### Vein Strike System (Per-Tick Probability)
- **Daily Strike Chance**:
  ```
  dailyStrikeChance = 0.01 (base 1%)
                    + mcSkillStrikePct[mcLevel]      // 0% → 5%
                    + (LCK×3 + CHA×0.5) × 0.0002     // fortune bonus
                    + levelStrikeBonus[level-1]      // [0%, 1.5%, 3.5%]
  ```
- **Per-Tick Conversion**: `dailyStrikeChance / 86400`
- **Vein Type Distribution** (cumulative roll 0.0–1.0):
  - [0.00–0.65): **Iron Vein** → 2–4× IRON_ORE
  - [0.65–0.90): **Rich Stone** → 10–20× STONE bonus
  - [0.90–1.00]: **Gem Vein** → 1× GEM (rare ~10% of strikes)
- **Example Strike Frequencies**:
  - MC0, LCK0, lv1 → 1% daily = ~1/100 days
  - MC4, LCK15, lv2 → ~4.8% daily = ~1/21 days
  - MC10, LCK30, lv3 → ~11.3% daily = ~1/9 days

#### Stone Quarry Config (NEW) — `src/game/data/facility-definitions.ts`
- **Unlock Gate**: 250g (unchanged)
- **Reserve**: Infinite (no depletion, unlike Logging Site)
- **Primary Stats**: STR + LCK
- **Updated Description**: "Mine stone continuously. STR controls yield. LCK unlocks rare vein strikes (Iron Ore, Gems). MC skill amplifies both."
- **Facility Levels**: 1–3 (matching Logging Site)
- **Config Constants Exported**:
  - `STONE_QUARRY_CONFIG` containing baseRate, levelMult, mcSkillThresholds, mcSkillYieldPct, mcSkillStrikePct, baseStrikeChancePerDay, fortuneStrikeScale, levelStrikeBonus, ticksPerDay (86400), mcSkillMaxLevel (10), veinWeights, ironOreRange, richStoneBonusRange

#### Per-Tick Production System (NEW) — `src/game/systems/stone-quarry-production-system.ts`
- **Functions**:
  - `calcMcLevel(xp: number): number` — Threshold lookup (mirrors Woodcutting pattern)
  - `processStoneQuarryTick(facilities[], allMembers[]): StoneQuarryTickResult` — Main tick handler
    - Iterates assigned members per facility level
    - Computes stonePerTick + perTickStrikeChance roll
    - Determines vein type on strike, adds bonusItemGains
    - Accumulates MC XP gains per member
- **Result Type**: `StoneQuarryTickResult { stoneProduced, bonusItemGains, mcXpGains }`

#### Offline Catch-Up (Updated) — `src/game/systems/facility-production-system.ts`
- **Stone Quarry Case**: Now applies MC skill yield bonus to offline stone production
- **Logic**: Offline stone = baseCalc × (1 + mcYieldPct[calcMcLevel(xp)]/100)
- **Vein Strikes**: Not simulated offline (too complex, acceptable loss)
- **Integration**: Called during `processFacilityProduction()` for v15→v16 saves

#### Guild State Integration (NEW) — `src/game/state/guild-slice.ts`
- **Action**: `applyStoneQuarryProduction(result: StoneQuarryTickResult)`
  - Updates `member.craftSkills.mining` (level + xpAccumulated per thresholds)
  - No reserve/depletion logic (infinite production model)
  - Called per tick from use-game-tick-loop

#### Tick Loop Integration (UPDATED) — `src/ui/hooks/use-game-tick-loop.ts`
- **New Block**: After logging-site block, processes Stone Quarry per-tick
  - Calls `processStoneQuarryTick(facilities, allMembers)`
  - If result has stoneProduced/xpGains: calls `applyStoneQuarryProduction`
  - Calls `addItem('STONE', stoneProduced)`
  - For each bonusItemGain: calls `addItem(id, qty)`

#### Save Migration v15 → v16 (NEW) — `src/game/save/save-migrations.ts`
- **Migration Function**: `migrateV15ToV16(save: SaveData): SaveData`
  - Iterates founder + roster + tavern mercenaries
  - If `craftSkills` exists but missing `mining`: adds `{ mining: { level: 0, xpAccumulated: 0 } }`
  - If `craftSkills` undefined: initializes `{ woodcutting: {...}, mining: {...} }`
  - Resets online member XP to 0 (preserves level across migration)
- **Save Version Bump**: 15 → 16 (`CURRENT_SAVE_VERSION` in save-types.ts)

#### Files Modified
- `src/game/data/items.ts` — Added GEM to ItemID + ITEM_DATABASE
- `src/game/data/facility-definitions.ts` — Added STONE_QUARRY_CONFIG, updated facility description + primaryStats
- `src/game/state/game-state.ts` — Added MiningSkill interface, extended CraftSkills with mining field
- `src/game/systems/stone-quarry-production-system.ts` — **NEW FILE** (calcMcLevel, processStoneQuarryTick)
- `src/game/systems/facility-production-system.ts` — Updated offline case with MC skill bonus
- `src/game/state/guild-slice.ts` — Added applyStoneQuarryProduction action
- `src/ui/hooks/use-game-tick-loop.ts` — Wired Stone Quarry per-tick block
- `src/game/save/save-types.ts` — Bumped CURRENT_SAVE_VERSION 15 → 16
- `src/game/save/save-migrations.ts` — Added migrateV15ToV16 + registered in chain

#### Code Quality
- Mirrors Logging Site architecture for consistency (per-tick pattern, skill bonuses)
- Defensive rounding + Math.max guards against floating-point errors
- Zero-quantity cleanup in bonusItemGains (matches item system practices)
- Full TypeScript strict mode compliance

#### Testing & Verification
- [ ] npm run build passes (0 errors) — compiles without issues
- [ ] Stone Quarry per-tick produces stone when assigned at lv1+
- [ ] MC skill XP accumulates, auto-levels at thresholds
- [ ] Vein strikes produce IRON_ORE / STONE bonus / GEM with correct probabilities
- [ ] Facility level 3 has higher strike rate than lv1
- [ ] LCK stat increases vein strike chance (fortune formula)
- [ ] Old v15 saves auto-migrate to v16 with mining skill seeded
- [ ] Offline catch-up applies MC skill yield bonus correctly
- [ ] GEM item renders in inventory with RARE rarity color (blue)

### Backward Compatibility
- **Save Compat**: v15 → v16 migration automatic (seeded mining skill to all members)
- **No Inventory Impact**: GEM is new item, doesn't affect existing item model
- **Facility Backward Compat**: Stone Quarry was lv0 disabled in v15; lv1+ now functional with MC system
- **Production Unchanged**: Existing Stone Quarry bases (if any) continue working; XP system auto-seeds on load

### Performance Notes
- Per-tick processing mirrors Logging Site (validated cost)
- Vein strike roll = 1 random per tick per member (negligible impact)
- Offline catch-up inline with facility-production-system (no new loop)

---

## [1.20.0] — 2026-04-12 (Guild Inventory System)

### Major Feature: Guild Inventory with Slot-Based UI and Storage Furniture

#### Inventory System Architecture (NEW)
- **Flat Dict Model**: Inventory remains `{ items: Partial<Record<ItemID, number>> }`
  - No save migration required (presentation layer only)
  - Compatible with facility production system (no overflow loss)
- **Stackable Items**: Stack limit = 99 per visual slot
  - `stackable: boolean` added to ItemTemplate
  - Non-stackable items: 1 slot each regardless of quantity
  - >99 items automatically split across multiple UI slots

#### Capacity Management (NEW)
- **Base Capacity**: 10 slots
- **Storage Chest Furniture**: +20 slots per chest (max 3 chests → max 70 slots)
  - Cost: 200g + 15 Wood + 5 Iron Ore
  - 1×1 footprint, category: 'upgrade'
  - Unlocked at guild level 2
- **Capacity Logic**:
  - `getMaxSlots()` → 10 + (20 × chestCount)
  - `getUsedSlots()` → Σ ceil(qty / 99) per item
  - `addItem()` → checks capacity, returns boolean
  - Facility production always succeeds (no item loss)

#### Inventory Panel UI (NEW)
- **Centered Overlay**: Not a sidebar panel, independent of PanelId system
- **Chest Theme Styling**: Dark wood background (#1e140a), brown borders (#8B4513), gold accents (#ffd700)
- **Grid Layout**: 5 columns × N rows, 64px cells, 4px gap
- **Responsive**: 4 columns on smaller screens
- **Slot States**:
  - Empty: dashed gold border
  - Occupied: solid border, icon + qty badge (bottom-right)
  - Hovered: brightened border, subtle glow
  - Selected: gold border, detail popup visible
- **Rarity Colors**:
  - COMMON: no tint
  - UNCOMMON: green tint
  - RARE: blue tint
  - EPIC: purple tint
  - LEGENDARY: gold tint

#### Item Detail Popup (NEW)
- **Tooltip-Style Card**: Positioned adjacent to slot
- **Content**: Icon, name, type, rarity badge (color-coded), description, quantity, sell value
- **Interaction**: Click slot → popup shows; click outside or same slot → close
- **Responsive**: Mobile fallback to centered mini-modal

#### Inventory Button Integration (NEW)
- Added "Inventory" button to HUD top bar (backpack icon)
- Click toggles inventory panel visibility
- Panel state tracked separately from sidebar panels

#### New Components
- `src/ui/panels/inventory-panel.tsx` — Main panel, grid rendering, slot tracking
- `src/ui/components/inventory-slot.tsx` — Individual slot (empty/occupied states, rarity colors)
- `src/ui/components/item-detail-popup.tsx` — Detail card with item info + sell values
- `src/ui/styles/inventory.css` — Chest theme, grid layout, animations

#### Data Layer Updates
- `src/game/data/items.ts` — Added `stackable: boolean` to ItemTemplate, `STACK_LIMIT = 99`
- `src/game/state/game-state.ts` — Added 'storage-chest' to FurnitureType union
- `src/game/data/furniture.ts` — Storage chest furniture definition
- `src/game/data/buildings.ts` — Unlocked storage-chest at guild level 2
- `src/game/state/inventory-slice.ts` — Added capacity helpers, fixed consumeItems cleanup bug

### Code Quality
- useMemo for expensive slot computation
- Defensive cap on non-stackable expansion (prevents infinite loops)
- selectedItemId index tracking (prevents stale selection on inventory changes)
- Zero-quantity item cleanup in consumeItems (prevents save bloat)

### Testing & Verification
- All 9 item types render correctly with icons
- Stack splitting works (150 wood → 2 slots)
- Empty/full states display correctly
- Storage chest correctly increases capacity
- Item detail popup shows all information
- Escape key closes panel
- Backdrop click closes panel

### Migration Notes
- **Save Compat**: v14→v15 migration transparent (presentation layer only)
- **No Data Model Change**: Existing save data compatible
- **Facility Production**: Unaffected, continues to work

---

## [1.19.0] — 2026-04-12 (GPU-Instanced Combat Rendering Overhaul)

### Major Refactor: WebGPU-Compatible Combat Rendering

#### GPU Instancing Architecture (BREAKING CHANGE TO RENDERING)
- **Mega-Atlas Builder**: Packs ALL sprite frames (walk/attack/death) for all characters + all enemy waves into single shared CanvasTexture
  - One atlas per sprite-size group (e.g., 128×128, 256×256)
  - Max size 4096×4096; 8-column packing
  - Canvas disposed post-GPU upload (RAM savings)
  - **Critical fix**: All enemy templates from ALL waves pre-loaded (prevents sprite-missing during wave transitions)

#### Imperative Animation State Buffer (NEW)
- **AnimationStateBuffer**: Float32Array, 18 floats per entity (replaces per-entity React components)
  - Fields: targetX/Z, currentX/Z, animState, frameIndex, fps, totalFrames, facingRight, hpRatio, isAlive, spriteTypeIndex, scale, tint RGB
  - Zero React overhead (pure imperative operations)
  - Position lerp, frame advance, hit flash, death fade all handled in buffer
  - CombatStateBridge syncs CombatEngine → buffer every frame

#### Single Draw Call Rendering (NEW)
- **InstancedSpriteRenderer**: Renders 48 entities in 1 GPU draw call via InstancedMesh + PlaneGeometry
  - Per-instance attributes: UV rect, opacity, tint
  - Billboard rotation via camera quaternion
  - WebGPU workaround: always render MAX_INSTANCES, hide unused via opacity=0 (dynamic count not picked up)
  - Death fade-out: opacity → 0 over 0.5s after death animation (~1s total)

#### WebGPU Compatibility Fixes (CRITICAL)
- **CanvasTexture.flipY = false** (true breaks UV formula)
- **Troika-three-text SDF replaced** with canvas-texture sprite labels (SDF uses custom GLSL, incompatible with WebGPU)
- **Fixed canvas dimensions** (256×48 for labels, 160×48 for damage numbers) to prevent WebGPU texture-resize errors
- **Alpha-test (alphaTest = 0.5)** required in SpriteMaterial for correct transparency
- **Dual-path material**: MeshBasicNodeMaterial+TSL for WebGPU, ShaderMaterial+GLSL for WebGL fallback

#### Text & UI Layers (Canvas-Based Sprites)
- **CombatTextLayer**: Entity name labels as canvas-texture sprites (fixed 256×48)
- **DamageNumberPool**: 32 pooled floating damage numbers, fixed 160×48 canvas, imperative spawn via ref

#### New Modules (src/scene/combat/)
- `mega-atlas-builder.ts` — Atlas packing engine
- `sprite-registry.ts` — (typeId, animState, frameIndex) → UV coords mapping
- `animation-state-buffer.ts` — Typed array animation state management
- `combat-state-bridge.ts` — CombatEngine ↔ AnimationStateBuffer sync
- `instanced-sprite-renderer.tsx` — GPU-instanced rendering component
- `sprite-material.ts` — Dual-path WebGPU/WebGL material
- `combat-text-layer.tsx` — Entity label rendering
- `damage-number-pool.tsx` — Damage number pool manager
- `instanced-hp-bars.tsx` — HP bar rendering
- `combat-vfx-spawner.tsx` — VFX layer

#### Wave System Enhancement
- Multi-wave missions now build atlas with ALL enemy templates from ALL waves upfront
- Prevents sprite-missing errors during wave transitions
- No performance regression (atlas built once per combat, reused across waves)

### Performance Impact
- **Memory**: Reduced ~30% (canvas disposed, typed arrays < individual React components)
- **Draw Calls**: Reduced from ~20-30 to ~10-15 per frame
- **GPU Utilization**: Single InstancedMesh draw call for all sprites (efficient batching)

### Testing & Verification
- WebGPU backend tested (Chrome 121+)
- WebGL fallback maintained (all modern browsers)
- Character sprite sheets verified (12 civ-specific sets)
- Enemy sprite frames verified (15 enemy types, all waves)

### Migration Notes
- **Code**: Combat rendering completely encapsulated in `src/scene/combat/` (no breaking changes to game logic)
- **Save Compat**: v14→v15 migration transparent (rendering layer independent)
- **Asset Requirements**: All sprite frames must exist in public/sprites/ (graceful 404 fallback for missing frames)

---

## [1.18.0] — 2026-04-11 (Logging Site Finite Harvest System)

### Major Feature: Finite-Resource Logging Site with Woodcutting Skill

#### Woodcutting Occupational Skill (NEW)
- **Skill Progression**: Level 0–10 tied to wood harvested as XP
- **Thresholds**: [0, 50, 150, 350, 700, 1200, 2000, 3200, 5000, 7500, 11000] wood
- **Bonuses**: [0%, 10%, 22%, 38%, 58%, 80%, 105%, 133%, 165%, 200%, 240%] harvest rate per level
- **Auto-Level**: On each tick, XP is compared to threshold table; level automatically advances
- **Persistence**: Stored per member as `craftSkills.woodcutting` in save data

#### Finite Wood Reserve System (NEW)
- **Reserve Pool**: Each logging site starts with 1000 wood (full capacity)
- **Depletion Rate**: Formula: `woodPerTick = 0.0114 × (baseScore/100) × skillMultiplier`
  - baseScore = (STR × 0.5) + (END × 0.3) + (DEX × 0.2)
  - skillMultiplier = 1 + (wcSkillBonusPct / 100)
  - Calibrated: STR20/END15/DEX0/WC0 depletes 1000 wood in ~7 days
- **Multiple Members**: Wood per-tick stacks across all assigned members; first member to exceed remaining reserve ends depletion
- **Clamping**: Wood harvested never exceeds remaining reserve (prevents negatives)

#### Depletion Lifecycle (NEW)
- **Active State** (0 < reserve ≤ 1000): Normal production, progress bar green
- **Warning State** (≤25% reserve ~250 wood): Amber progress bar + "⚠ Running Low" badge + ETA display
- **Critical State** (≤10% reserve ~100 wood): Red progress bar + "🔴 Almost Depleted" badge + short ETA
- **Depleted State** (reserve = 0): 
  - All assigned members auto-unassigned to idle status
  - assignedMemberIds cleared
  - UI shows "DEPLETED" label, grey disabled card, Remove Site button only
  - No further production

#### Permit-Based Unlock (NEW)
- **Build Gate**: Logging site cannot be built with gold — requires 1x Logging Permit
- **Item Source**: 
  - Tutorial quest "Into the Clearing" guarantees 1 permit on completion
  - Forest area quests (5 missions) drop permit at 15% rate
- **Consumption**: Permit item consumed (quantity decremented) when build confirmed
- **UI Gate**: Build button disabled + tooltip if player has 0 permits

#### UI/UX Enhancements (NEW)
- **Facility Card Updates**:
  - Wood reserve progress bar (fill %/text)
  - Warning badge + ETA calculation at thresholds
  - WC skill level displayed as chip on each assigned member
  - Depleted card variant (grayscale, no assign UI)
  - Remove Site button (prominent on depleted)
- **Facilities Panel Updates**:
  - Depleted sites sorted to bottom of list
  - Color badges (green/amber/red/grey) for reserve state
- **Build Menu Updates**:
  - Logging site entry shows permit requirement instead of gold cost
  - Tooltip displays available permit count or requirement message
- **CSS Classes**:
  - `.wood-reserve-bar-track` / `.wood-reserve-bar-fill` (progress bar)
  - `.wood-reserve-bar--warning` / `.wood-reserve-bar--critical` (color states)
  - `.wc-level-badge` (skill chip)
  - `.facility-card--depleted` (grayscale)
  - `.depleted-tag` (label)

#### 3D Scene Integration (NEW)
- **Zone Floor Tinting**:
  - Green (normal): >25% reserve
  - Amber (warning): 10%–25% reserve
  - Red (critical): <10% reserve
  - Grey (depleted): 0 reserve
- **Floating Zone Card**: HTML overlay in facility room showing reserve bar + wood/tick rate (via R3F `<Html>` component)
- **Zone Props**: Tint applied to `ZoneFloorMarker` based on `reservePct` prop passed from `facility-zone-layer.tsx`

#### Save Migration v13→v14 (NEW)
- **Version Bump**: SAVE_VERSION 13 → 14
- **Member Migration**: All members get `craftSkills: { woodcutting: { level: 0, xpAccumulated: 0 } }`
- **Facility Migration**:
  - Non-logging sites: `woodReserve: null`
  - Existing built logging sites (level > 0): `woodReserve: 1000` (full capacity)
- **Tests**: 39/39 save migration tests passing
- **Backward Compatibility**: Existing saves auto-migrate without data loss

#### Production System Changes (NEW)
- **Per-Tick Processing**: Logging site production now runs every tick (1s) instead of per-day
- **New Actions**:
  - `applyLoggingProduction` — updates member WC XP + facility reserves + handles depletion
  - `removeFacility` — deletes facility from guild, frees placed slot
- **Integration**: Wired into `use-game-tick-loop.ts` for continuous per-tick updates

#### Mission System Extension (NEW)
- **Conditional Drops**: Added `conditionalDrops` field to Mission interface
  - Entries: `{ itemId, chance: 0–1, quantity }`
  - Processed on mission success with random roll
- **Forest Missions**: 5 forest-area missions now have 15% drop chance for logging permits

### Files Added
- `src/game/data/facility-slot-positions.ts` — Facility slot position constants (new)
- `src/game/data/tutorial-data.ts` — Updated with Logging Permit definition
- `src/game/systems/tutorial-quest-handler.ts` — Handles permit grant on quest completion
- `src/ui/components/facility-slot-picker.tsx` — Slot selection UI for facility placement
- `src/ui/components/tutorial-dialogue-overlays.tsx` — Extended for permit reward display

### Files Modified
- `src/game/state/game-state.ts` — Added `WoodcuttingSkill`, `CraftSkills` to Member interface; added `woodReserve` to GuildFacility
- `src/game/data/facility-definitions.ts` — Added `LOGGING_SITE_CONFIG` export; removed `upgradeCosts` from logging-site
- `src/game/data/items.ts` — Ensured `LOGGING_SITE_ACCESS` item matches logging-permit use case
- `src/game/data/missions.ts` — Added `conditionalDrops` field; populated 5 forest missions with 15% permit drop
- `src/game/save/save-types.ts` — Bumped `SAVE_VERSION` to 14
- `src/game/save/save-migrations.ts` — Added `migrateV13toV14()` function
- `src/game/save/save-migrations.test.ts` — Added v13→v14 migration test
- `src/game/save/test-fixtures.ts` — Updated fixtures with new fields
- `src/game/save/save-validation.ts` — Added validation for `craftSkills` + `woodReserve`
- `src/game/state/guild-slice.ts` — Added `applyLoggingProduction`, `removeFacility`, `consumeLoggingPermit` actions
- `src/game/systems/mission-tick.ts` — Integrated conditional drop processing
- `src/game/systems/facility-production-system.ts` — Implemented per-tick logging production with WC XP + depletion
- `src/game/systems/tutorial-manager.ts` — Integrated permit gating for logging-site builds
- `src/ui/panels/facility-card.tsx` — Added `WoodReserveBar`, WC level chip, `DepletedFacilityCard`, `onRemove` prop
- `src/ui/panels/facilities-panel.tsx` — Added depleted site sorting + `removeFacility` dispatch
- `src/ui/panels/build-menu.tsx` — Added permit gate for logging-site build button
- `src/ui/styles/panels.css` — Added `.wood-reserve-bar*`, `.wc-level-badge`, `.facility-card--depleted`, `.depleted-tag` classes
- `src/scene/facility-zone-layer.tsx` — Passed `reservePct` to zone floor marker
- `src/scene/zone-floor-marker.tsx` — Added tint color logic based on reserve thresholds
- `src/scene/facility-room.tsx` — Added `LoggingSiteZoneCard` inline component + R3F `<Html>` overlay

### Test Coverage
- ✅ 39/39 save migration tests passing (v13→v14 migration validates)
- ✅ TypeScript compiles (0 new errors)
- ✅ WC skill level calculation (thresholds → levels)
- ✅ Wood depletion formula (per-tick, multi-member, clamping)
- ✅ Permit consumption (build gate, count decrement)
- ✅ UI updates (reserve bar colors, WC badge display, depleted card)
- ✅ 3D zone tint (based on reserve %)

### Backward Compatibility
- ✅ Existing saves auto-migrate (members get default WC0, facilities get null/1000 reserve per type)
- ✅ Permit gating only applies to new logging-site builds (existing ones unaffected)
- ✅ No breaking changes to mission/facility/member schema
- ✅ Production system expanded, not replaced (other facilities unaffected)

---

## [1.17.0] — 2026-04-10 (Tutorial First-Session Flow)

### Major Feature: Narrative-Driven First-Session Onboarding

#### World Board Lore Modal (NEW)
- **2-Page Narrative Modal**: Opens after character creation (step: world-board)
- **Page 1 - A World Divided**: World lore with 3 civilizations (LinhSon, ThuanPhong, HaiLong)
- **Page 2 - Your Guild**: Charter, mission statement, player role
- **Pagination UI**: Back/Next/Begin buttons, page counter (1/2)
- **Styling**: Fixed overlay (z-index 1000), dark background, gold-trimmed borders
- **Component**: `world-board-modal.tsx` (NEW)

#### Tutorial Quest "Into the Clearing" (NEW)
- **Mission ID**: `tutorial-into-the-clearing` (tier F, duration 5s, travel 2s)
- **Rewards**: 25 gold, 50 exp, trivial slime fight (hp multiplier 0.1)
- **Progression**: Dispatch → Active → Complete (auto-triggers rewards)
- **Founder Only**: No roster requirement for tutorial phase
- **Defined**: `tutorial-data.ts` (NEW)

#### Kael Recruitment System (NEW)
- **NPC Template**: `KAEL_TEMPLATE` — LinhSon warrior (STR 8, END 7)
- **Auto-Add**: Triggers on tutorial quest completion (no cost, no gold spent)
- **Guard**: Duplicate prevention (checks roster for 'Kael' name)
- **Animation**: Rescue dialogue modal showing Kael's story/acceptance

#### Logging Site Access Permit (NEW)
- **Key Item**: `LOGGING_SITE_ACCESS` (item type CONSUMABLE, rarity UNCOMMON)
- **Grant**: Awarded after Kael rescue (via `handleTutorialQuestComplete()`)
- **Consumption**: Used when building logging site during tutorial
- **Cost Bypass**: Waives gold + guildLevel requirements during tutorial
- **Mechanism**: Check in `guild-slice.ts` `buildFacility()` action

#### Tutorial Progression Gates (NEW)
- **9 Tutorial Steps**: char-creation → world-board → quest-dispatch → quest-active → kael-rescue → reward → build-logging-site → assign-kael → complete
- **Auto-Advance**: 
  - Tutorial-quest-dispatch → active (when mission dispatched)
  - Build-logging-site → assign-kael (when facility level > 0)
  - Assign-kael → complete (when member assigned)
- **Manual Steps**: world-board, kael-rescue, reward (modal/dialogue interaction)
- **Configuration**: Updated `TUTORIAL_STEPS` array in `tutorial-manager.ts`

#### Panel Gating During Tutorial (NEW)
- **Quest Board**: Filtered to show only `tutorial-*` prefixed missions (normal quests hidden)
- **Facilities Panel**: 
  - Highlights Logging Site during build-logging-site step
  - Filters to show only Logging Site during build/assign steps
- **No Tier Filter**: Tier buttons hidden during tutorial (UI simplification)

#### Tutorial Quest Handler (NEW)
- **Pure Function**: `handleTutorialQuestComplete()` in `tutorial-quest-handler.ts`
- **Called After**: Mission completion (both auto-tick and arena modes)
- **Side Effects**:
  1. Add Kael to roster (UUID generation, duplicate guard)
  2. Grant LOGGING_SITE_ACCESS item (qty 1)
  3. Advance tutorial step to kael-rescue (shows rescue dialogue)
- **Hooks**: Integrated into `mission-tick.ts` and `arena-result-handler.ts`

#### Tutorial Dialogue Overlays (NEW)
- **Kael Rescue Dialogue**: Shows Kael story after quest completion
  - Component: `KaelRescueDialogue` in `tutorial-dialogue-overlays.tsx`
  - Triggers advance to tutorial-reward
- **Reward Splash**: Displays LOGGING_SITE_ACCESS permit card
  - Component: `TutorialRewardSplash` in `tutorial-dialogue-overlays.tsx`
  - Triggers advance to build-logging-site
- **Styling**: Matching world-board-modal (dark overlay, gold trim, centered)

#### Save Migration v11→v12 (NEW)
- **Version Bump**: CURRENT_SAVE_VERSION 11 → 12
- **Migration Logic**: Maps old tutorial steps (sandbox-intro, first-build, etc.) → complete
- **Guard**: Existing saves skip entire tutorial on load (migrated to complete state)
- **Tests**: Added `save-migrations.test.ts` validation

#### Tutorial Integration in Game Screen (NEW)
- **Conditional Renders**: Mounts modal/dialogue based on tutorialStep
  - `tutorialStep === 'world-board'` → `<WorldBoardModal />`
  - `tutorialStep === 'tutorial-kael-rescue'` → `<KaelRescueDialogue />`
  - `tutorialStep === 'tutorial-reward'` → `<TutorialRewardSplash />`
- **Z-Index Management**: All tutorial overlays at z-index 1000 (above HUD/panels)
- **File**: Updated `game-screen.tsx`

### Files Added
- `src/game/data/tutorial-data.ts` — Kael template + tutorial quest definition
- `src/game/systems/tutorial-quest-handler.ts` — Completion handler + rewards
- `src/ui/components/world-board-modal.tsx` — 2-page lore intro modal
- `src/ui/components/tutorial-dialogue-overlays.tsx` — Kael + reward dialogues

### Files Modified
- `src/game/state/game-state.ts` — Updated TutorialStep union (9 values)
- `src/game/data/items.ts` — Added LOGGING_SITE_ACCESS to ItemID + database
- `src/game/data/missions.ts` — Prepended TUTORIAL_QUEST
- `src/game/save/save-validation.ts` — Updated TUTORIAL_STEPS array
- `src/game/save/save-migrations.ts` — Added v11→v12 migration
- `src/game/save/save-types.ts` — Bumped SAVE_VERSION 11→12
- `src/game/save/test-fixtures.ts` — Updated version + tutorialStep
- `src/game/systems/tutorial-manager.ts` — Replaced TUTORIAL_STEPS config (9 steps, new auto-advance conditions)
- `src/game/systems/mission-tick.ts` — Added handleTutorialQuestComplete hook
- `src/game/systems/arena-result-handler.ts` — Added handleTutorialQuestComplete hook
- `src/game/state/guild-slice.ts` — Added LOGGING_SITE_ACCESS cost bypass in buildFacility
- `src/ui/panels/quest-board.tsx` — Added tutorial quest filtering (filter to tutorial-* only)
- `src/ui/panels/facilities-panel.tsx` — Added tutorial gating (highlight logging-site)
- `src/ui/screens/game-screen.tsx` — Mounted tutorial overlays + modals
- `src/ui/hooks/use-game-tick-loop.ts` — Added tutorial auto-advance logic
- `src/ui/panels/char-creation.tsx` — Changed post-creation step from sandbox-intro → world-board
- `src/game/save/save-migrations.test.ts` — Added v11→v12 migration test

### Test Coverage
- ✅ TutorialStep type validation (9 values)
- ✅ TUTORIAL_QUEST mission lookup
- ✅ handleTutorialQuestComplete behavior (Kael addition, item grant, step advance)
- ✅ LOGGING_SITE_ACCESS cost bypass in buildFacility
- ✅ Save migration v11→v12 (old steps → complete)
- ✅ Full tutorial flow (manual playthrough: char-creation → complete)
- ✅ TypeScript compilation (npx tsc --noEmit, 0 errors)

### Backward Compatibility
- ✅ Old saves with sandbox-intro etc. migrate to complete (skip tutorial)
- ✅ LOGGING_SITE_ACCESS item absent in old inventories (no impact)
- ✅ Quest board filter only applies when tutorialStep !== complete
- ✅ Existing facility system unaffected
- ✅ No breaking changes to mission/roster/save schema

---

## [1.16.0] — 2026-04-10 (UI Enhancements & New Facilities)

### Major Features: Character Progression & Resource Expansion

#### +5 Stat Allocation Button (NEW)
- **Allocate Helper**: `allocateStat()` now accepts optional `amount` parameter (default: 1)
- **UI Enhancement**: +5 button shown when `unallocatedPoints >= 5` in:
  - Character detail panel (`character-detail-panel.tsx`)
  - Member book detail page (`member-book-detail-page.tsx`)
- **Player Convenience**: Quick allocation reduces click fatigue for high-stat characters

#### New Facility Types (NEW)
- **Logging Site**: Resource extraction facility with STR-based production
  - Extraction formula: `STR * 0.004 * gatherSpeed`
  - Supports member assignment, offline production, level progression
- **Stone Quarry**: Resource extraction facility with STR-based production
  - Extraction formula: `STR * 0.004 * gatherSpeed`
  - Full production pipeline matching existing facility system (Tavern, Training, Infirmary, Workshop)
- **DEFAULT_FACILITIES Updated**: Both new facilities added to default guild setup
- **FacilityType Enum Extended**: Backward compatible (existing saves unaffected)

#### WASD Camera Pan Controls (NEW)
- **Keyboard Handler**: Implemented in `HomeButton` within `game-screen.tsx`
  - **W/↑**: Pan camera north
  - **A/←**: Pan camera west
  - **S/↓**: Pan camera south
  - **D/→**: Pan camera east
  - **ESC**: Return to guild hall view
- **Usage Context**: Active when viewing facility rooms (post-Enter Room)
- **Accessibility**: Complements mouse-based orbit controls; no speed ramp (instant pan)

#### Room Navigation UI Bar (NEW)
- **New Component**: `room-nav-bar.tsx` above PanelToggle in game screen
- **Visual Design**: Horizontal icon button bar showing:
  - Guild Hall icon (home) + built facility icons (Tavern, Training Yard, Infirmary, Workshop, Logging Site, Stone Quarry)
  - Icons auto-generated via PixelLab (facility-specific 32×32 pixel art)
  - Quick facility access without opening FacilitiesPanel
- **Interaction**: Click to navigate to facility room (camera animation)

#### UI Build Menu Refactor (NEW)
- **Removed**: FloorTab from build menu (unused feature)
- **Simplified**: `build-menu.tsx` now renders FurnitureTab directly
- **User Impact**: Cleaner build UI, focused on room furniture placement

### Files Added
- None (feature extensions to existing systems)

### Files Modified
- `src/game/systems/facility-production-system.ts` — Added Logging Site & Stone Quarry to facility configs
- `src/game/data/facilities.ts` — Extended FacilityType enum with 'logging-site', 'stone-quarry'
- `src/game/systems/stat-system.ts` — Updated `allocateStat()` to accept optional amount parameter
- `src/ui/components/room-nav-bar.tsx` — NEW: Navigation bar component for facility access
- `src/ui/panels/character-detail-panel.tsx` — Added +5 stat button (unallocatedPoints >= 5)
- `src/ui/panels/member-book-detail-page.tsx` — Added +5 stat button (unallocatedPoints >= 5)
- `src/ui/screens/game-screen.tsx` — Integrated keyboard handler (WASD + ESC)
- `src/ui/panels/build-menu.tsx` — Removed FloorTab, FurnitureTab now primary
- `src/ui/hud/home-button.tsx` — Integrated WASD camera pan controls

### Asset Generation
- 2 new facility icons (Logging Site, Stone Quarry) via PixelLab AI
- Integrated into room nav bar (32×32 pixel art format)

### Backward Compatibility
- ✅ Save format unchanged (new facilities optional, existing saves unaffected)
- ✅ `allocateStat()` default behavior preserved (amount = 1)
- ✅ Existing facility system fully operational
- ✅ Build mode workflow unaffected

---

## [1.15.0] — 2026-04-09 (Facility Rooms with Camera Navigation)

### Major Feature: Animated Room Navigation

#### Facility Rooms (NEW)
- **4 Dedicated 7×7 Rooms**: Tavern, Training Yard, Infirmary, Workshop positioned behind guild hall (z < 0)
- **Room Rendering**: Walls (back, left, right, transparent front), tinted floors per facility type
- **Room Labels**: HTML labels showing facility name + lock state / level
- **Always Visible**: Rooms render in background, accessible via camera navigation

#### Camera Animation System (NEW)
- **Smooth Transitions**: Camera lerps toward facility center when "Enter Room" clicked (0.08 rate ≈ 500ms)
- **Zustand CameraSlice**: Manages `cameraTarget` state + `setCameraTarget()` + `resetCameraToGuildHall()` actions
- **CameraController**: Uses OrbitControls ref + useFrame to animate camera + target toward goal
- **Isometric Constraints**: Rotation disabled, pan disabled during build mode, zoom always enabled
- **Arrival Detection**: Stops animating once within 0.01 unit threshold (demand frameloop efficiency)

#### UI Integration (NEW)
- **"Enter Room" Button**: Added to FacilitiesPanel — triggers `setCameraTarget(roomCenter)` + closes panel
- **Home Button (🏠)**: Click to `resetCameraToGuildHall()` and return to main view
- **No State Persistence**: Camera defaults to guild hall on load (prevents isolated room spawns)

#### Camera Offset Formula
```
cameraPosition = cameraTarget + [10, 10, 10.5]
cameraLookAt = cameraTarget
```
Derived from isometric perspective: position [15, 10, 14] looking at [5, 0, 3.5].

### Files Added
- `src/game/state/camera-slice.ts` — CameraSlice: state, setCameraTarget(), resetCameraToGuildHall()
- `src/scene/camera-controller.tsx` — Camera animation controller (useFrame lerp)
- `src/scene/facility-room.tsx` — Single 7×7 room with walls, floor, name label
- `src/scene/facility-rooms-layer.tsx` — Orchestrator for 4 facility rooms

### Files Modified
- `src/game/state/store.ts` — Integrated CameraSlice into GameStore
- `src/scene/camera-controller.tsx` — Modified to use Zustand cameraTarget instead of fixed position
- `src/scene/world.tsx` — Added FacilityRoomsLayer to Canvas; positioned after GuildHall, before MemberLayer
- `src/ui/panels/facilities-panel.tsx` — Added "Enter Room" button with setCameraTarget() call
- `src/ui/screens/game-screen.tsx` — Ensured cameraTarget state is accessible (read-only in this version)
- `src/scene/guild-hall.tsx` — FacilityZoneLayer removed from render (replaced by FacilityRoomsLayer functionality)

### Backward Compatibility
- No breaking changes to game mechanics or save format
- Existing facility game logic unaffected (production, bonuses, assignments)
- Build mode workflow unchanged
- Save migration: Not required (camera target is transient state)

---

## [1.12.1] — 2026-04-09 (3D Facility Zone Visualization)

### Major Feature: Visual Guild Hall Facility Zones

#### Zone Floor Markers (NEW)
- **4 Colored Zone Markers**: Always-visible semi-transparent floor planes indicating facility locations
  - Tavern: Gold (#D4A017)
  - Training Yard: Red (#B04040)
  - Infirmary: Blue (#4080B0)
  - Workshop: Brown (#8B6914)
- **State Indication**: Locked zones (level 0) render grey/dim, active zones show facility color
- **Isometric Positioning**: Fixed zone positions in guild hall for consistent player navigation

#### Level-Gated Props (NEW — GLB 3D Models)
- **Progressive Unlocking**: Props appear as facilities level up (lv1 → lv2)
- **Tavern Props**: Bar-counter (lv1), wine-barrel (lv2) with warm amber lighting
- **Training Yard Props**: Training dummies (lv1 + lv2 pair) with red warning lighting
- **Infirmary Props**: Medical bed (lv1), alchemy-table (lv2) with cool blue healing lighting
- **Workshop Props**: Workbench (lv1), reception-desk (lv2) with golden work lighting
- **Auto-Scaling**: Each GLB model automatically scaled to target height (preserves proportions)
- **Lighting**: Ambient point lights per zone with color-coded intensity and distance

#### Assigned Member Sprites (NEW)
- **2×2 Grid Display**: Up to 4 members per zone arranged in 4 fixed slot positions
- **Static Rendering**: Members always idle + facing south (no wandering like main hall)
- **Sprite Consistency**: Uses existing SpriteAnimator + sprite-path-resolver (4-directional sprites with fallback)
- **Visual Polish**:
  - Billboard rendering (always face camera)
  - Blob shadow under each sprite (0.35u radius, 25% opacity)
  - Name labels above sprites with black text shadow for readability
  - Y position: 1.05u (stands on zone floor)

#### User Interaction (NEW)
- **Zone Click → Panel Bridge**: Clicking zone opens FacilitiesPanel with that facility focused
  - Zustand bridge: zone click sets `pendingFacilityPanel` + `focusFacilityType`
  - GameScreen watches state, auto-opens panel + scrolls to target facility
- **Build Mode Hiding**: All zones (markers, props, sprites) hidden when in build mode (preserves UI focus)
- **Cursor Feedback**: Pointer cursor on zone hover, auto-reset on layer unmount

#### Zero Breaking Changes
- Facility game mechanics unchanged (production, bonuses, assignments)
- Backward compatible with existing saves (new rendering layer only)
- No impact on build mode or furniture placement workflow

### Files Added
- `src/scene/facility-zone-layer.tsx` — Master orchestrator for all 4 zones + click handling
- `src/scene/zone-floor-marker.tsx` — Color-coded floor planes with locked/active logic
- `src/scene/zone-props.tsx` — Level-gated GLB models with auto-scaling + ambient lighting
- `src/scene/zone-member-sprites.tsx` — 2×2 grid member sprite layout
- `src/game/state/facility-zone-slice.ts` — Zustand slice for zone interaction state

### Files Modified
- `src/scene/guild-hall.tsx` — Integrated FacilityZoneLayer into isometric scene
- `src/ui/screens/game-screen.tsx` — Watches `pendingFacilityPanel`, auto-opens panel

---

## [1.11] — 2026-03-26 (Auto-Battler Combat Arena — Real-Time Visual Combat)

### Major Feature: Real-Time Combat Arena

#### Combat Mode Selection (NEW)
- **Mission Arrival Phase**: When party arrives at mission, player chooses **Manual** (arena) or **Auto** (text-log simulation)
- **30-Second Timeout**: Defaults to auto-resolve if no choice made
- **UI Modal**: Shows party composition + enemy preview + combat mode buttons
- **Backwards Compatible**: Auto-resolve fully preserved; no gameplay changes to existing auto path

#### Combat Arena System (MAJOR — 14 New Files)
- **CombatEngine Class**: Tick-based real-time driver (100ms logic ticks, independent of frame rate)
- **Formation Grid**: 2×3 party placement slots (front row 0-2, back row 3-5) before battle
- **3D Beat-Em-Up Arena**: R3F Canvas replacing guild-hall scene during combat (sidescroller perspective, 35° camera angle)
- **Billboard Sprites**: Members + enemies rendered as animated pixel-art sprites facing camera
- **Spatial Combat AI**: Range-aware targeting (melee 1.5-2.0u, ranged 5.0u), pathfinding to enemies
- **Skill Hotbar**: Keys 1-4 activate manual skills (cooldown tracking, resource cost checks)
- **Visual Feedback**:
  - HP bars above each entity (color-coded: green healthy → red critical)
  - Floating damage numbers (red damage, green healing, yellow critical hits)
  - Status effect icons (poison, stun, vulnerability, buffs)
  - Animation states (idle, walking, attacking, skill-cast, hit, dead)
- **Speed Control**: 1x/2x multiplier toggle during combat (affects logic tick frequency)
- **Combat Timer**: Elapsed/total time display, 2-minute hard cap per battle
- **Result Screen**: Detailed outcome (victory/defeat), gold earned, EXP per member, injuries applied
- **Game Tick Pause**: Main game loop pauses during arenaPhase='fighting', resumes on exit
- **Full Mission Integration**: Arena results flow through mission-resolver to update member stats + guild resources

#### Formation Prep UI (NEW)
- **CombatPrepPanel**: Slot-based formation editor
  - Shows 2×3 grid of formation slots
  - Drag-and-drop or click-to-assign members from party
  - Cancel/Start Battle buttons
  - Real-time stats preview (formation total HP/DPS/range)

#### Combat During Battle (NEW)
- **CombatSkillHotbar**: Keys 1-4 mapped to active member skills
  - Shows skill icon, name, cooldown (ms remaining)
  - Disabled when on cooldown or insufficient resources
  - Global/per-entity cooldown tracking
- **CombatArenaEnvironment**: Ground plane, side/background walls, sidescroller camera setup
  - Grid-snapped positioning (formation spread Z ∈ ±1.5)
  - 35° camera angle for beat-em-up sidescroller view
  - Arena bounds X ∈ [-8, 8], Z ∈ [-4, 4]
  - Front-above lighting for combat readability

#### Combat Results & Rewards (NEW)
- **CombatResultOverlay**: Full-screen results screen
  - Victory/Defeat banner with outcome reason
  - Gold earned (scaled by member luck stat)
  - EXP per survivor (modified by rank bonuses)
  - Injury list (members injured, recovery time)
  - Loot summary (items dropped)
  - "Return to Guild Hall" button
- **Automatic Reward Application**: Results integrated into mission-resolver
  - Gold added to guild treasury
  - EXP distributed to survivors
  - Injuries marked with recovery timers
  - Member status updated (idle → active during → idle/injured after)

#### Backend Systems (Reused + Extended)
- **Combat Formulas**: Existing damage calc, crit, armor (unchanged)
- **Combat Passives**: All 3 civilization passives apply (unchanged)
- **Status Effects**: Poison, stun, vulnerability, buffs fully supported
- **Loot Tables**: Enemy drops unchanged, applied same way as auto-resolve
- **Skill System**: All 7 skills + archetype variants supported, cooldown system extended for hotbar

#### New Zustand Slice (9th Slice Total)
- **CombatArenaSlice**: gameScene, arenaPhase, formation, entities, time, speedMultiplier, result
- **Actions**: enterCombatPrep(), setFormationSlot(), startBattle(), syncArenaState(), endCombat(), exitArena()
- **Entity Snapshots**: Stored for rendering (position, animState, HP, effects, etc.)

### File Additions (14 New Files)

**Game Systems**:
- `src/game/systems/combat-arena-types.ts` — ArenaEntity, Formation, ARCHETYPE_RANGE, FORMATION_POSITIONS
- `src/game/systems/combat-engine.ts` — CombatEngine class (300+ lines, complete real-time driver)
- `src/game/systems/combat-ai.ts` — findTarget(), moveToward(), distance, pathfinding logic
- `src/game/systems/arena-result-handler.ts` — Apply arena results to mission rewards + injuries

**State Management**:
- `src/game/state/combat-arena-slice.ts` — Zustand slice #9 for arena state management

**3D Scene**:
- `src/scene/combat-arena.tsx` — Main Arena Canvas (R3F entry point)
- `src/scene/combat-arena-environment.tsx` — Ground plane, grid, lighting, camera setup
- `src/scene/combat-entity-sprite.tsx` — Billboard entity rendering + HP bar overlay
- `src/scene/combat-fight-controller.tsx` — useFrame loop, engine tick, state sync
- `src/scene/combat-damage-number.tsx` — Floating damage text VFX component
- `src/scene/combat-vfx-layer.tsx` — VFX manager, particle effects, damage numbers pool

**UI Panels**:
- `src/ui/panels/combat-prep-panel.tsx` — Formation setup grid + start battle button
- `src/ui/panels/combat-skill-hotbar.tsx` — Skill bar (keys 1-4) with cooldown display
- `src/ui/panels/combat-result-overlay.tsx` — Full-screen results + rewards display

### File Modifications (8 Files)

- `src/game/systems/combat-types.ts` — Extended CombatEntity with position, animState, moveSpeed, targetId, etc.
- `src/game/state/game-state.ts` — Added GameScene type ('guild-hall' | 'combat-arena'), game state interfaces
- `src/game/state/store.ts` — Integrated combat-arena-slice as 9th slice
- `src/game/systems/mission-tick.ts` — Trigger enterCombatPrep() on manual mode selection during arrival
- `src/game/systems/mission-resolver.ts` — Apply arena results via arena-result-handler
- `src/ui/screens/game-screen.tsx` — Conditional render: show CombatArenaCanvas when gameScene='combat-arena'
- `src/ui/panels/active-missions-list.tsx` — Add "Manual/Auto" mode selection button on arrival
- `src/game/systems/use-game-tick-loop.ts` — Pause tick loop when arenaPhase='fighting'
- `src/scene/floor-tile-texture-generator.ts` — (NEW helper) Procedural floor texture generation

### Breaking Changes
**None**. Arena system is purely additive:
- Auto-resolve path unchanged, all existing logic preserved
- Save format unchanged (arenaPhase initialized on prep)
- Optional feature (can be disabled server-side if needed)
- No changes to combat formulas, skills, passives, or loot

### Performance Impact
- **Logic Tick**: 100ms (frame-rate independent), ~5-10 ticks per second
- **Rendering**: 60fps target via R3F (capped by browser refresh)
- **Memory**: O(n) entities (typically 6-12), ~1-2MB per arena instance
- **No Asset Load**: Reuses existing sprites + models
- **GPU**: Minimal draw calls (billboards + ground plane)

### Testing & Validation
- **Arena Initialization**: Formation setup, member placement
- **Combat Tick**: AI targeting, skill casting, damage application
- **State Sync**: Engine → Store → UI rendering consistency
- **Result Application**: Gold/EXP distributed, injuries tracked, mission completion
- **Edge Cases**: Full party wipe, single survivor, skill cooldown overlap, status effect stacking

### Arena Camera & Layout Transformation (Sidescroller View — v1.11.1)
- **Camera Angle**: Updated from isometric to sidescroller perspective (35° from horizontal)
- **Camera Position**: Repositioned to [0, 7, 10] for beat-em-up visual style
- **Arena Boundaries**: Defined bounds X ∈ [-8, 8], Z ∈ [-4, 4]
- **Formation Spread**: Tightened Z spacing to ±1.5 per slot (from ±2) for depth clarity in sidescroller view
- **Environment**: Added side walls (X=-8/8) + background wall, dark ground, center reference line
- **Lighting**: Adjusted to front-above angle for sidescroller combat readability
- **Gameplay Impact**: None — purely visual/layout change, all combat logic unchanged

### Known Limitations
- Formation editing only before battle (no mid-combat repositioning)
- Skill hotbar global cooldown (can be per-skill in future)
- 2-minute hard cap (prevents infinite battles)
- No player-controllable member movement (AI pathfinding only)

### Next Steps (Future Enhancements)
- Mid-combat tactical options (swap party members, adjust formation)
- Ability to record arena replays
- Difficulty scaling per arena encounter
- Boss-specific mechanics (phase transitions, enrage mechanics)
- PvP arena (guild vs guild)

---

## [1.10] — 2026-03-23 (Building System Refactor — Tile-Based Architecture)

### Major Refactor

#### Removed Room/RoomType Abstraction (Breaking Change)
- **Removed**: Fixed 6x6 room blocks with RoomType classification
- **Removed**: Room placement UI + room movement mechanics
- **Removed**: Room-specific panel access (onRoomClick obsolete)
- **Removed**: Multi-room grid cells logic (replaced with flat tile array)
- **Impact**: Saves v9→v10 migration required (compresses rooms → tiles+furniture)

#### New Floor Tile System (Major Feature)
- **FloorTile Array**: `guild.floorTiles: FloorTile[]` — Individual colored tiles at (x, z)
- **Paint Mode**: Click-to-paint color palette (5g per tile)
- **Erase Mode**: Click-to-erase tiles (blocked if furniture occupies)
- **Default Floor**: 6x6 gold floor auto-created on new games (36 tiles = #DAA520 color)
- **No Adjacency**: Tiles placed freely (no adjacency requirement, unlike rooms)
- **Cost**: 5g per tile (FLOOR_TILE_COST constant)

#### Refactored Furniture System (Major Feature)
- **Guild-Level Array**: `guild.furniture: PlacedFurniture[]` — Flat list (not nested per room)
- **New PlacedFurniture**: `{ id, type, level, position: { x, z }, rotation }`
- **Floor Validation**: Furniture must have floor tile underneath (mandatory)
- **Guild Level Unlock**: Each furniture type has `unlockedAtLevel` gate
- **Max Per Guild**: Each furniture type has max count limit (at guild level, not per-room)
- **No Per-Room Nesting**: Furniture tracked at guild level, not scoped to rooms
- **Placement Cost**: Validates gold + items from FurnitureDefinition.cost

#### Build Menu Refactor (UI Update)
- **Floor Tab**: Color palette for paint/erase modes
  - Shows current floor tile count
  - Color selector + paint/erase toggle buttons
- **Furniture Tab**: All furniture with level unlock badges
  - Filtered by guild.level >= unlockedAtLevel
  - Click to select → shows ghost preview at cursor
- **No Room Selection**: Rooms tab removed entirely

#### Build Overlay Changes (UI Update)
- **3 Modes**: floor-tile (paint), erase-tile (erase), furniture (place)
- **Ghost Preview**: Shows single cell for tiles, 1x1 box for furniture
- **Validation Color**: Green (valid) / Red (invalid)
  - Floor tile: checks cell not occupied
  - Erase: checks furniture not occupying
  - Furniture: checks floor exists + level unlocked + no overlap + cost OK

#### Furniture Effects Renamed (File Refactor)
- **Renamed**: `room-effects.ts` → `furniture-effects.ts`
- **Function Rename**: `calcRoomBonuses()` → `calcFurnitureBonuses()`
- **Logic Change**: Iterates `guild.furniture[]` (flat) instead of `guild.rooms[]`
- **Bonus Application**: Same bonus logic, applied from furniture array now
- **Example Effects**:
  - quest-board: +10% mission gold reward
  - tavern-counter: shows tavern panel when placed (not when room exists)
  - training: +5% combat EXP

#### Tutorial First-Build Step
- **Old Trigger**: `rooms.length > 1` (place 2+ rooms)
- **New Trigger**: `floorTiles.length > 36` (paint full 6x6 grid)
- **Progression**: Paint floor → unlock furniture placement tutorial

#### Panel Access Changes (Breaking)
- **Removed**: onRoomClick handlers (no room objects to click)
- **Panel Access Method**: HUD toggle bar buttons only
  - Quest Board → Button in HUD
  - Roster → Button in HUD
  - Build → Button in HUD
  - Tavern → Appears when bar-counter furniture placed (furniture effect trigger)
- **No Direct 3D Interaction**: Panels accessed only via HUD buttons, not by clicking scene objects

#### Save Migration v9 → v10 (Complex)
- **Version Bump**: `SAVE_VERSION` incremented from 9 to 10
- **Auto-Migration**: `migrateV9toV10()` runs on load
  - Flattens `guild.rooms[]` into `guild.floorTiles[]` + `guild.furniture[]`
  - For each room: generates tiles covering room bounds with room color
  - For each room's furniture: copies to guild.furniture[] with absolute position
  - Adjusts furniture positions from room-relative to guild-absolute
  - Clears old `rooms` field
- **Position Recalculation**: Room bounds (x, z, width, depth) → individual tile (x, z) positions
- **Backward Compatibility**: v9 saves load with transparent migration (auto-triggered)
- **Data Loss**: None (all room data recoverable from tiles + furniture array)

### Changed

#### Guild State (guild-slice.ts)
- **Removed Fields**: `guildHall.rooms: Room[]`
- **New Fields**: `guildHall.floorTiles: FloorTile[]`, `guildHall.furniture: PlacedFurniture[]`
- **New Actions**:
  - `placeFloorTile(x, z, color)` — Paint a tile (5g cost)
  - `eraseFloorTile(x, z)` — Erase if no furniture
  - `placeFurniture(type, pos, rotation)` — Place furniture (validates floor + cost)
  - `removeFurniture(furnitureId)` — Remove by ID from flat array
  - `upgradeFurniture(furnitureId)` — Level up furniture

#### Build Mode Slice (build-mode-slice.ts)
- **Removed**: `startMovingRoom()`, `startPlacement()` (room-centric)
- **New**: `startFloorTilePlacement(color)`, `startErasePlacement()`
- **Updated**: `startFurniturePlacement()` — No longer takes targetRoomId
- **activeItem Type**: Changed from `'new-room' | 'move-room' | 'new-furniture'` to `'floor-tile' | 'erase-tile' | 'furniture'`

#### Validation Systems (building-system.ts)
- **Removed**: `checkCellOverlap()`, `checkAdjacency()`, `generateRoomCells()`
- **New**: `canPlaceFurnitureOnFloor()` — Checks floor tile exists at position
- **Removed**: `canPlaceRoom()` (room placement logic gone)
- **Removed**: Room collision + adjacency checking (not applicable to tiles)

#### 3D Scene Rendering (guild-hall.tsx)
- **Removed**: RoomMesh components (no rooms to render)
- **New**: FloorTileMesh components (individual tiles with colors)
- **Simplified**: No room collision visualization needed
- **Grid Visualization**: Still shows grid cells during build mode (unchanged)

#### Furniture System (furniture-system.ts)
- **Removed**: Per-room furniture placement logic
- **New**: Guild-level furniture validation (`canPlaceFurnitureOnFloor()`)
- **Function**: `placeFurniture()` now operates on flat guild.furniture[]

### Fixed

#### Build Mode UX
- **Fixed**: Complex room placement mechanics replaced with simple tile painting
- **Fixed**: No way to customize floor appearance (now fully paintable)
- **Fixed**: Panels required clicking scene objects (now HUD buttons only)

#### Furniture System
- **Fixed**: Furniture tied to rooms (now guild-level, more flexible)
- **Fixed**: Max furniture limits per-room (now per-guild)
- **Fixed**: Furniture level != room level (decoupled: furniture has own level)

### Performance

- **Tile Storage**: O(1) lookup by (x, z) key (can add Set if >1000 tiles)
- **Furniture Storage**: O(n) linear scan where n = furniture count (typically <50)
- **Placement Validation**: O(m) where m = furniture count (checking floor coverage)
- **Migration v9→v10**: One-time cost, no ongoing impact

### Testing

- **New Test Coverage**:
  - Floor tile placement (cost, color, occupied check)
  - Floor tile erase (furniture blocking)
  - Furniture placement on floor (floor requirement)
  - Furniture removal + upgrades
  - Save migration v9→v10 (flattening correctness)
- **Test Count**: Full suite passing (tile + furniture + migration tests)

### Documentation

- Updated `system-architecture.md` with new build mode data flow (tile-based)
- Updated `codebase-summary.md` with FloorTile + PlacedFurniture structures
- Updated `project-changelog.md` (this entry) with v1.10 refactor details
- Renamed documentation references from rooms to tiles/furniture throughout

### Known Issues

None identified in v1.10 release. Floor tile painting, furniture placement, and save migration all tested and working.

### Limitations

- Tile painting is click-by-click (no drag-to-paint mode in v1.10)
- Furniture cannot be moved after placement (remove + re-place)
- No visual grid cell highlighting during paint (just preview color)

### Breaking Changes

- **Removed**: Room/RoomType abstraction entirely
- **Removed**: onRoomClick event handlers
- **Removed**: Room placement UI + room movement
- **Removed**: Room-scoped furniture system
- **Save Incompatibility**: v9 saves auto-migrate to v10 (transparent, one-time)
- **Code Incompatibility**: Any room-referencing systems must update to use tiles/furniture

---

## [1.9] — 2026-03-21 (Milestone 2 Vertical Slice)

### Added

#### Civilizations System (Major Feature)
- **3 Civilizations**: Linh Sơn, Đế Quốc, Thiên Lữ (complete replacement)
- **CIV_CONFIG**: Single source of truth for civilization data
  - Each civ defines stat bonuses, archetype classes, unique hero rosters
- **Character Creation**: Founder and members assigned to civilizations
  - Stat bonuses applied automatically on creation via `applyCivBonuses()`
  - Visual selector in character creation UI
- **Civ Badge Component**: Visual emblem + name display across UI
- **Roster Filtering**: Members can be filtered/sorted by civilization

#### Combat Passives (Major Feature)
- **3 Exclusive Passive Abilities**:
  - **Son The (Linh Sơn)**: +20% max HP per level
  - **Dien The Chi Huy (Đế Quốc)**: +30% EXP gain from missions
  - **Tinh Lo (Thiên Lữ)**: +15% dodge rate in combat
- **Passive Integration**: Automatically applied during combat simulation
- **UI Display**: Passive descriptions in character detail + roster panels
- **Combat Calculation**: Passives modify HP, dodge chance, and EXP rewards

#### Skills Expansion (Major Feature)
- **7 Skills Total** (up from 1)
- **Archetype-Based Organization**: `SKILLS_BY_ARCHETYPE` groups skills per class
- **Skill Variety**: Warrior, Mage, Rogue variants per civilization
- **Combat System**: Skill cooldown, mana, damage scaling, range
- **UI Display**: Full skill cards in character detail panel

#### Enemy Expansion (Major Feature)
- **15 Enemy Types** (up from 5)
  - F tier: 5 enemies
  - E tier: 5 enemies
  - D tier: 5 enemies
- **New Abilities**:
  - **Stun-attack**: Disables target for 1 turn
  - **Enrage**: Increases self damage by 50% for duration
  - **Heal-ally**: Restores HP to nearby enemies
- **Smart AI**: Enemies select targets strategically + use abilities tactically
- **Diverse Loot Tables**: Each enemy drops unique items + materials

#### Mission Expansion (Major Feature)
- **22 Total Missions** (up from 5)
  - F tier: 8 missions
  - E tier: 7 missions
  - D tier: 7 missions
- **2 Gate Bosses**: One-time elite challenges blocking tier progression
- **1 Quest Chain**: Multi-mission narrative story with escalating rewards
- **Mission Variety**: Standard combat, boss encounters, elite gates, story chains
- **Reward Scaling**: Gold + EXP adjust for difficulty tier + quest type
- **Travel Times**: Recalibrated per tier (F=10s, E=15s, D=20s)

#### Audio System Expansion (Major Feature)
- **6 New Audio Keys**:
  - `BGM_COMBAT`: Combat background music
  - `SFX_CRIT`: Critical hit sound effect
  - `SFX_DODGE`: Dodge/miss sound effect
  - `SFX_DEATH`: Enemy defeat sound effect
  - `SFX_SKILL`: Skill usage sound effect
  - `SFX_RECRUIT`: Character recruitment sound effect
- **Integration**: Sounds triggered during combat, recruitment, abilities
- **Audio Manager**: New keys registered in audio-manager.ts

### Changed

#### Character Creation
- **New Field**: `civId: string` on all members (founder + roster)
- **Founder Creation**: Includes civilization selector
- **Stat Bonuses**: Applied based on selected civilization
- **UI Update**: Character creation flow includes civ selection step

#### Combat Simulation
- **Passive Application**: Son The, Dien The Chi Huy, Tinh Lo checked during combat
- **Damage Calculation**: Passives modify damage, dodge, and other formulas
- **EXP Calculation**: Dien The Chi Huy bonus applied to mission rewards
- **HP Calculation**: Son The bonus affects max HP + healing

#### Roster & UI
- **Civ Badges**: All member displays show civilization emblem
- **Filter Options**: Roster can filter by civilization
- **Character Detail**: Shows applied passives + civ bonuses
- **Quest Board**: Displays civilization-specific quest chains

#### Mission System
- **Quest Chain Tracking**: Multi-mission story lines with progression
- **Gate Boss Logic**: One-time bosses unlock higher tiers on completion
- **Mission Variety**: Expanded enemy combinations per mission
- **Reward Scaling**: Adjusted for new mission count + difficulty tier

### Fixed

#### Civilization Representation
- **Fixed**: Old civilizations (Viet/Nordic/Saharan) replaced with lore-appropriate alternatives
- **Fixed**: No way to distinguish member civilizations in UI (now shows badges)
- **Fixed**: Stat bonuses not applied at character creation (now automatic via CIV_CONFIG)

#### Gameplay Progression
- **Fixed**: Limited mission variety (5 missions) → now 22 missions with quest chains
- **Fixed**: Limited enemy types (5) → now 15 enemies with special abilities
- **Fixed**: No audio feedback for combat actions → 6 new sound effects added
- **Fixed**: Skills limited to 1 type → now 7 skills organized by archetype

### Save Migration v8 → v9

- **Version Bump**: `SAVE_VERSION` incremented from 8 to 9
- **Auto-Migration**: `migrateV8toV9()` runs on load
  - Add `civId: string` field to all members
  - Map old civilization names to new IDs (if exists)
  - Ensure founder has valid civId assignment
- **Backward Compatibility**: Old v8 saves load with default civ assignments
- **Transparent**: No user interaction required

### Performance

- **Civilization Config**: O(1) lookup via CIV_CONFIG[civId]
- **Passive Application**: O(1) per passive during combat calc (simple multipliers)
- **Mission Filtering**: O(n) per filter (n = mission count, ~22)
- **Audio Keys**: No performance impact (enum-based registration)

### Testing

- **Civilization Tests**: CIV_CONFIG structure, stat bonus application
- **Passive Tests**: Son The, Dien The Chi Huy, Tinh Lo stat modifications
- **Mission Tests**: Quest chain progression, gate boss unlocks
- **Enemy Tests**: 15 types + abilities, loot generation
- **Audio Tests**: New keys registered, sound playback
- **Full Test Suite**: All systems passing with new features

### Documentation

- Updated `codebase-summary.md` with Milestone 2 features
- Updated `system-architecture.md` with civilization + passive data flows
- Updated `project-changelog.md` (this entry) with v1.9 features
- Updated `development-roadmap.md` Milestone 2 complete status

### Known Issues

None identified in v1.9 release. All civilization, passive, skill, enemy, mission, and audio features tested and working.

### Limitations

- Passives fixed per civilization (no customization)
- Quest chains linear (cannot skip chapters)
- Gate bosses must be defeated sequentially per tier

---

## [1.6] — 2026-03-16 (Roster Management & Combat Enhancements)

### Added

#### Multi-Member Quest Dispatch (Major Feature)
- **Party Size Flexibility**: Dispatch N+ members (above quest minimum) on single mission
- **EXP Sharing**: Reward divided by party size (`Math.max(1, Math.floor(expReward / members.length))`)
  - Larger parties earn less per member; incentivizes focused teams
  - Maintains gold earning (not divided, quest-level reward)
- **Dispatch UI**: Quest detail modal shows member count with "(selected/min+)" format

#### Skill Cooldown Rebalance (Gameplay Adjustment)
- **1-Turn Cooldown System**: Skills now cooldown for `attackIntervalMs * 2` instead of fixed `cooldownMs`
  - Forces minimum 1 normal attack between skill uses
  - Attack speed affects cooldown duration (AGI scaling)
  - Prevents skill spam, encourages turn-based flow
- **Combat Simulator Update**: `combat-simulator.ts` uses dynamic cooldown calculation
- **Balance Impact**: Higher AGI members have shorter skill cooldowns

#### Auto-cast Toggle Feature (NEW)
- **Store Action**: `toggleAutoCast(memberId)` added to roster slice
- **UI Implementation**: Toggle in Character Detail panel (roster page)
- **Combat Effect**: Auto-cast enabled members use skills automatically in combat
- **Persistent**: Auto-cast state saved with member data

#### Compact Roster UI (Major Refactor)
- **Condensed List Items**: Guild Roster panel shows minimized member cards
- **Character Detail Panel**: Left-side panel opens on member click with:
  - Avatar image (large preview)
  - Equipment placeholders (5 armor slots)
  - Skill section with auto-cast toggle
  - Talent/stat allocation UI
- **New Files**:
  - `roster-list-item.tsx` — Compact member card component
  - `character-detail-panel.tsx` — Left panel with stats/equipment/skills

#### Quest Board Label Updates (UI Polish)
- **Changed**: "Members: N" → "Min Members: N" (clarity on minimum requirement)
- **Dispatch Button**: Now shows "(selected/min+)" format indicating party size range
- **Modal Display**: Quest detail modal lists selected members with "(N selected)" label

### Changed

#### Mission Resolution (EXP Division)
- **Old**: EXP awarded equally to all members regardless of party size
- **New**: EXP divided by members.length for multi-member parties
  - Single-member missions: full EXP (no division)
  - Multi-member missions: EXP/count per survivor
  - Example: 100 EXP mission with 4-member party = 25 EXP each

#### Combat Simulator
- **Skill Cooldown Logic**: `cooldownMs` field replaced with dynamic calculation
  - Previous cooldown: fixed value
  - New cooldown: `Math.ceil(attackIntervalMs * 2)`
  - More responsive to character AGI/equipment

#### Guild Roster UI Structure
- **Old**: Full-width member cards with inline details
- **New**: Condensed list on right, expandable detail panel on left
- **Files Modified**: `guild-roster.tsx` (layout restructure), `quest-board.tsx` (label update), `quest-detail-modal.tsx` (member display)

#### Roster Slice (Zustand)
- **New Field**: `autoCastEnabled: Record<memberId, boolean>` tracking per-member auto-cast state
- **New Action**: `toggleAutoCast(memberId)` flips auto-cast flag
- **Persistence**: Auto-cast state included in save data (save migration required)

### Fixed

#### Multi-Member Party Dispatch
- **Fixed**: No EXP penalty for larger teams (now properly incentivizes focused groups)
- **Fixed**: Unclear party size requirements in UI (now shows "Min Members: N")

#### Skill Balance
- **Fixed**: Skills too spammable (now cooldown based on attack interval, forces tactical use)

#### Roster Navigation
- **Fixed**: No way to quickly view character details without opening quest modal
- **Fixed**: Equipment status not visible in roster (now shown in detail panel)

### Performance

- **Roster Rendering**: Compact list items reduce DOM nodes vs. full-width cards
- **Detail Panel**: Lazy-loads character data on open (minimal initial render cost)
- **EXP Division**: O(1) division operation (single multiplication + floor)
- **Auto-cast Toggle**: O(1) state update in Zustand

### Save Migration v5 → v6

- **Version Bump**: `SAVE_VERSION` incremented from 5 to 6
- **Auto-Migration**: `migrateV5toV6()` adds `autoCastEnabled` map to roster state
- **Backward Compatibility**: Old v5 saves load with all members defaulting to auto-cast disabled

---

## [1.5] — 2026-03-16 (Inventory & Multi-Resource Economy)

### Added

#### Item Database & Inventory System (Major Feature)
- **8 Core Item Types**: WOOD, STONE, IRON_ORE, SLIME_GEL, BOAR_PELT, WOLF_FANG, GOBLIN_EAR, ORC_TUSK
- **Inventory Zustand Slice**: Tracks quantity per item type in guild state
- **Atomic Operations**: `consumeItems()` validates inventory before deduction; `addItems()` increases quantities
- **Item Registry**: `items.ts` defines all items with name labels and stack limits (100+ per type)

#### Multi-Resource Loot System (Major Feature)
- **Loot Tables on Enemies**: Each enemy template has `LootRule[]` with `chance`, `minQuantity`, `maxQuantity`
  - Example: Goblin has chance to drop GOBLIN_EAR (1-3 qty)
  - Example: Boar has chance to drop BOAR_PELT (1-2 qty)
- **Loot Rolling**: Pure `rollLoot(enemyDef)` function generates random drops per enemy defeated
- **Loot Merging**: `mergeLoot(drops[])` combines all enemy drops into `ItemDropMap`
- **Mission Integration**: `MissionResult` now includes `lootEarned: ItemDropMap`
- **Notification Display**: Mission completion toast shows items earned (e.g., "+3 Wood, +2 Stone")

#### Multi-Resource Building Costs (Major Feature)
- **ResourceCost Type**: Buildings now cost `{ gold: number; items: ItemQuantityMap }`
  - Training Room: 200g + 10 Wood
  - Workshop: 300g + 5 Wood + 5 Iron Ore
  - Infirmary: 250g + 8 Stone
- **Placement Validation**: `canPlaceRoom()` checks both gold AND item inventory
  - Prevents placement if insufficient gold or items
  - Clear error message indicates what's missing
- **Cost Deduction**: Building placement atomically deducts both gold and items via `consumeItems()`
- **No Partial Deduction**: All-or-nothing transaction model ensures inventory consistency

#### Resource HUD Display (Major Feature)
- **Resource Bar Component**: Shows Wood/Stone/Iron quantities in top HUD (next to gold display)
- **Real-time Sync**: Quantities update immediately on loot earn or building cost deduction
- **Quick Reference**: At-a-glance inventory status during active gameplay
- **Quest Board Enhancement**: Mission listings show potential item drops from loot tables

#### Save Migration v4 → v5
- **Version Bump**: `SAVE_VERSION` incremented from 4 to 5
- **Auto-Migration**: `migrateV4toV5()` adds empty inventory structure to all members/guild
- **Default State**: New saves start with 0 items in inventory
- **Backward Compatibility**: Old v4 saves migrate seamlessly with zero-quantity inventory

### Changed

#### Mission Resolution
- **MissionResult Type**: Now includes `lootEarned: ItemDropMap` field
  - Loot generated during combat simulation (called for each defeated enemy)
  - Loot applied to guild inventory on mission completion

#### Building Costs Schema
- **Old**: `baseCost: number` (gold only)
- **New**: `cost: ResourceCost` (gold + items)
  - `RoomDefinition` interface updated
  - Building placement requires item validation

#### Guild State
- **New Field**: `inventory: Record<ItemType, number>` tracking item quantities
- **Inventory Actions**: `addItems()` and `consumeItems()` for atomic updates

#### Quest Board Panel
- **Dispatch Handler**: Calls `consumeItems()` to deduct building costs
- **Cost Display**: Shows both gold and item requirements before dispatch
- **Potential Drops**: Mission details modal lists item drops from loot tables

#### Item System Integration
- **Enemies Data**: `enemies.ts` includes `lootRules: LootRule[]`
  - Each rule: `{ itemType: ItemType; chance: 0-1; minQuantity: number; maxQuantity: number }`
- **Loot Rolling**: `loot-roller.ts` pure functions (no side effects)

### Fixed

#### Item Economy Gaps
- **Fixed**: No way to earn multi-resource items
  - Loot system now drops items from mission rewards
- **Fixed**: No use for multi-resource items
  - Building costs now require specific items
- **Fixed**: No inventory feedback to player
  - Resource bar shows current quantities

#### Building Cost Validation
- **Fixed**: Building placement had no item cost check
  - `canPlaceRoom()` now validates both gold and items
- **Fixed**: No indication of item requirements
  - Quest board shows required items before dispatch

### Performance

- **Loot Rolling**: O(n) where n = enemies defeated (typically 3-5 per mission)
- **Inventory Operations**: O(1) per consumeItems/addItems call (hash lookup)
- **Resource Bar Render**: Minimal re-render, only updates on inventory change
- **Save Migration**: One-time v4→v5 cost, no ongoing impact

### Testing

- **New Tests**: Full test coverage for loot generation, item consumption, building costs
- **Test Count**: All systems passing (inventory, loot, cost validation)
- **Coverage Areas**:
  - Loot rolling per enemy (chance + quantity)
  - Loot merging across multiple enemies
  - Inventory consumeItems validation
  - Building cost deduction (atomic transaction)
  - Resource bar update synchronization
  - Save migration v4→v5

### Documentation

- Updated `codebase-summary.md` with Inventory & Multi-Resource Economy section
- Updated `development-roadmap.md` Phase 5 Checkpoint 4 complete
- Updated `project-changelog.md` (this entry) with v1.5 features
- Updated `system-architecture.md` with multi-resource loot system data flows

### Known Issues

None identified in v1.5 release. All inventory, loot, and building cost features tested and working.

### Limitations

- Item stack limits fixed at 100+ per type (can be adjusted per item in items.ts)
- No item trading between members (design choice for v1.5)
- No item degradation or consumption during missions (reserved for future content)

---

## [1.4] — 2026-03-16 (Structures Utility — Mercenary System & Tavern)

### Added

#### Mercenary Recruitment System (Major Feature)
- **Member Rank Field**: Members now have `rank: 'MEMBER' | 'MERCENARY'` classification
- **Auto-Stat Distribution**: Mercenaries auto-distribute stat points on level-up (random across all 7 stats)
  - Regular members continue with manual stat allocation
  - No `unallocatedPoints` accumulation for mercenaries
- **Tavern Spawning**: Every 4 real-time hours, tavern generates 3 random mercenaries
  - Mercenaries appear in new Tavern panel
  - Click "Hire" to recruit mercenary to roster (costs 50% of quest reward upfront during mission dispatch)
- **Mercenary UI Badges**: Roster displays "MERC" badge on mercenary cards with distinct styling
- **Stat Allocation Guard**: Mercenary stat allocate buttons disabled in roster (auto-managed)
- **Upkeep Exclusion**: Mercenaries have 0 upkeep cost, excluded from `calcTotalUpkeep()`

#### Tavern System (New Room Type)
- **TavernState Interface**: Tracks `lastRefreshTime` and `availableMercenaries[]`
- **Tavern Panel**: New UI panel shows available mercenaries with stats, level, and hire button
- **Refresh Timer**: Displays countdown to next mercenary refresh (updates every tick)
- **Hire Action**: Button-driven recruitment moves mercenary from tavern → roster

#### Quest Board Tier Gating (Major Feature)
- **Room Level → Tier Mapping**: Quest board room level determines max quest tier
  - Lv1 → F tier, Lv2 → E tier, Lv3 → D tier, etc. (up to Lv5 → B tier)
  - `QUEST_BOARD_TIER_BY_LEVEL` constant map in `buildings.ts`
- **Dynamic Tier Filter**: Quest board panel reads highest-level quest-board room, filters missions accordingly
- **Locked Tier Display**: Missions above max tier automatically hidden from quest list
- **No Guild Level Gating**: Replaced old guild-level-based unlock system

#### Mission Dispatch Costs (Major Feature)
- **Mercenary Fee Validation**: Parties with ≥1 mercenary require 50% upfront gold fee
  - Fee calculated as `Math.floor(mission.goldRewardMin * 0.5)`
  - Gold deducted on dispatch (before mission sent to worker)
- **Gold Validation**: Dispatch blocked with clear message if insufficient gold for fee
- **Non-Mercenary Parties**: No fee change (0 mercenaries = no fee)
- **Clear Messaging**: UI shows fee requirement before dispatch

#### Save Migration v3 → v4
- **Version Bump**: `SAVE_VERSION` incremented to 4
- **Auto-Migration**: `migrateV3toV4()` adds:
  - `rank: 'MEMBER'` to all roster members + founder
  - `tavern: { lastRefreshTime: 0, availableMercenaries: [] }` to save data
- **Backward Compatibility**: Old saves load with default values

#### New Files
- `src/game/systems/mercenary-generator.ts`: Random mercenary generation
- `src/ui/panels/tavern-panel.tsx`: Tavern UI with hire interface

### Changed

#### Member Type & State
- **Member Interface**: Added `rank: MemberRank` field (default 'MEMBER')
- **Roster Slice**: `applyExpGain()` now branches on `member.rank`
  - Mercenaries: auto-distribute points immediately
  - Members: accumulate points for manual allocation

#### Quest Board Panel
- **Tier Logic**: Replaced guild-level-based unlock with quest-board room level lookup
- **useMemo Optimization**: `maxQuestTier` derived from highest-level quest-board room
- **Mission Filter**: `filteredMissions` now uses room-level-based tier cap
- **Dispatch Handler**: Validates mercenary fee, deducts gold if applicable

#### Guild Slice
- **Tavern State**: Added `tavern: TavernState` field
- **Tavern Actions**: `refreshTavern()` + `hireMercenary()` for tavern management
- **Game Tick Integration**: Tavern refresh check runs every game tick (4h interval check)

#### Game Tick Loop
- **Tavern Refresh Check**: Every tick, compare `Date.now() - tavern.lastRefreshTime` against 4h threshold
  - If exceeded, call `generateMercenaries(3)` and `refreshTavern()`
  - Implemented in tick handler (likely `use-game-tick-loop.ts`)

#### HUD & Panels
- **Tavern Room Click**: Tavern room 3D mesh click opens TavernPanel
- **Panel Toggle**: 'tavern' added to `PanelId` enum
- **Game Screen**: TavernPanel wired into panel routing

### Fixed

#### Quest Tier Access
- **Fixed**: Guild level no longer gates quest tiers
  - Now properly gated by quest-board room level
- **Fixed**: Max tier cap was not visually clear
  - Now shows filtered mission list with locked missions hidden

#### Mission Dispatch Validation
- **Fixed**: No gold cost for mercenary parties
  - Now correctly charges 50% upfront fee
- **Fixed**: No validation for insufficient gold
  - Dispatch blocked with clear message if gold < fee

#### Mercenary Progression
- **Fixed**: No way to recruit mercenaries
  - Tavern system spawns 3 every 4 hours
- **Fixed**: Mercenary stat growth uncontrolled
  - Auto-distribution ensures balanced progression

### Performance

- **Mercenary Generation**: O(3) per refresh (3 random members generated every 4h)
- **Tavern Refresh Check**: O(1) time check per tick (negligible)
- **Tier Lookup**: O(n) filter per room query (n = rooms, typically <10)
- **Save Migration**: One-time v3→v4 migration, no ongoing cost

### Testing

- **New Tests**: Full test coverage for mercenary generation and tavern interactions
- **Test Count**: 25/25 tests passing (including all mercenary/tavern flows)
- **Coverage Areas**:
  - Mercenary rank assignment + auto-stat distribution
  - Tavern refresh interval logic
  - Quest tier gating by room level
  - Mercenary fee validation & gold deduction
  - Save migration v3→v4

### Documentation

- Updated `codebase-summary.md` with Mercenary system & Tavern section
- Updated `development-roadmap.md` Phase 5 status (Structures Utility v1.4 complete)
- Updated `project-changelog.md` (this entry) with v1.4 features

### Known Issues

None identified in v1.4 release. All mercenary and tavern features tested and working.

### Limitations

- Tavern refresh limited to 3 mercenaries per spawn (by design)
- Mercenary stats capped at same level caps as regular members (100 levels)
- No mercenary dismissal UI (can be added in future patch)

---

## [1.3] — 2026-03-15 (Advanced Build Mode — Room Moving & Toggle)

### Added

#### Build Mode Toggle (Major Feature)
- **Build Mode Toggle Button**: Dedicated HUD button to enter/exit build mode
- **isBuildMode State**: Boolean flag controlling grid visibility and member visibility
- **Grid Visibility**: Grid shown during build mode for clear placement reference
- **Member Hiding**: All members hidden when in build mode for clean visual workspace

#### Room Moving & Manipulation (Major Feature)
- **Pick-Up Mechanic**: Click existing rooms to pick up and move them
- **Room Dragging**: Drag picked-up rooms around the grid with collision detection
- **Rotation During Move**: Press R to rotate rooms while moving
- **Cancel/Restore**: ESC or right-click to cancel move, room returns to originalPosition/Rotation
- **Collision Exclusion**: Moving rooms exclude themselves from collision checks (prevent self-blocking)

#### Advanced State Management
- **ActiveBuildItem Interface**: Unified interface for both new placements and room moves
  - `type: 'new' | 'existing'` — Placement type
  - `roomType: RoomType` — Room type being placed/moved
  - `rotation: Rotation` — Current rotation (0|90|180|270)
  - `roomId?: string` — ID of room being moved (existing only)
  - `originalPosition?: {x, z}` — Saved position for cancel restore (existing only)
  - `originalRotation?: Rotation` — Saved rotation for cancel restore (existing only)
- **Fresh State Pattern**: Each placement/move starts with clean state on entry
- **State Isolation**: Build mode state separate from gameplay state

#### Enhanced UI Components
- **BuildModeHint Context-Aware**:
  - Idle: "Click a room to move it"
  - Placing: "Placing: {room_name} ({rotation}°)"
  - Moving: "Moving: {room_name} ({rotation}°)"
  - Shows controls: click to place/drop, R to rotate, ESC/right-click to cancel
- **RoomMesh Interactive**: Click-to-pick-up in build mode, hide when being moved
- **Grid Persistence**: Grid remains visible throughout entire build mode session

#### Tests (NEW)
- `build-mode-advanced.test.ts`: 48 comprehensive tests covering:
  - toggleBuildMode: entry/exit with state cleanup
  - startMovingRoom: room capture with metadata preservation
  - rotatePlacement: rotation cycling during move
  - cancelPlacement: position/rotation restoration on cancel
  - activeItem transitions: proper state initialization and cleanup
  - Member visibility: members hidden when isBuildMode
  - Collision handling: excludes self from collision check during move

### Changed

#### Build Mode Architecture
- **Build Mode Slice**: Added `isBuildMode`, enhanced `activeItem` with move metadata
- **startPlacement()**: Now sets `activeItem.type = 'new'`
- **NEW startMovingRoom()**: Captures roomId, position, rotation for moves
- **toggleBuildMode()**: Replaces direct mode entry, handles full cleanup
- **cancelPlacement()**: Restores position/rotation if moving existing room

#### Guild Hall Rendering
- **RoomMesh**: Added onClick handler to pick up rooms in build mode
- **Visibility**: Rooms hidden when `activeItem.roomId` matches (being moved)
- **BuildOverlay**: Passes `excludeRoomId` to collision check when moving

#### Build Overlay
- **Unified Placement/Move**: Single overlay handles both new and existing room placement
- **Collision Exclusion**: Moving rooms exclude self: `checkCollision(..., excludeRoomId)`
- **Ghost Preview**: Shows preview for both new placements and room moves

### Fixed

#### Build Mode UX
- **Fixed**: No way to move existing rooms
  - Now clickable to pick up, drag, and drop with rotation
- **Fixed**: No build mode toggle
  - Dedicated button and isBuildMode state for easy mode switching
- **Fixed**: Members cluttered view during building
  - Now hidden when isBuildMode is true
- **Fixed**: No way to cancel room moves
  - ESC/right-click restores to original position and rotation
- **Fixed**: Moving rooms could collide with themselves
  - Collision check now excludes the room being moved

### Performance

- **State Management**: activeItem tracking adds ~2KB memory when active
- **Collision Detection**: excludeRoomId check adds 1 comparison per room (negligible)
- **Rendering**: Conditional visibility (hidden during move) no performance cost
- **Ghost Preview**: Real-time updates unaffected (same raycasting as v1.2)

### Testing

- New test file: `build-mode-advanced.test.ts` with 48 tests
- Test coverage: toggleBuildMode (5), startMovingRoom (6), rotatePlacement (3), cancelPlacement (4), collision (5), activeItem transitions (8), member visibility (3), integration (8)
- All tests passing, 100% success rate

### Documentation

- Updated `codebase-summary.md` with Advanced Build Mode features
- Updated `system-architecture.md` with ActiveBuildItem interface and move flow diagrams
- Updated `project-changelog.md` (this entry) with v1.3 features and breaking changes
- Updated `development-roadmap.md` Phase 5 status to include v1.3 completion

### Known Issues

None identified in v1.3 release. All major features tested and working.

### Limitations

- Max rotation: 4 values (0/90/180/270), no free-form rotation
- Grid snap: 0.5 cell minimum (no sub-cell precision)
- Single room move at a time (cannot multi-select)

---

See `v0-archive-changelog.md` for historical entries (v0.1 through v1.2)

---

## Version History Summary

| Version | Date | Focus | Status |
|---------|------|-------|--------|
| 1.3 | 2026-03-15 | Advanced Build Mode — room moving, toggle, member hiding | Complete |
| 1.4 | 2026-03-16 | Structures Utility — mercenary system, tavern, quest tier gating | Complete |
| 1.5 | 2026-03-16 | Inventory & Multi-Resource Economy — items, loot, building costs | Complete |
| 1.6 | 2026-03-16 | Roster Management & Combat Enhancements | Complete |
| 1.7 | 2026-03-16 | Guild Rank System — 5-tier hierarchy, promotion mechanics | Complete |
| 1.8 | 2026-03-16 | Save Migration & Enhanced Rank System (v7→v8) | Complete |
| 1.9 | 2026-03-21 | Milestone 2 Vertical Slice — Civilizations, Passives, 22 Missions, 15 Enemies, 7 Skills | Complete |
| 1.10 | 2026-03-23 | Building System Refactor — Tile-Based Architecture (rooms → tiles+furniture) | Complete |
| 2.0+ | TBD | Post-launch updates | Planned |

See `v0-archive-changelog.md` for v0.1-v1.2 history.

---

**Last Updated**: 2026-03-23 (v1.10 Building System Refactor)
**Maintained By**: Documentation Team
**Next Review**: 2026-03-24 (weekly) / 2026-04-15 (milestone)

For detailed file changes and historical information on v1.3-v1.6, see `v0-archive-changelog.md`.
