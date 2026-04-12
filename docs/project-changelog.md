# Project Changelog

All notable changes to Worlds Collide are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/).

**Current Version**: 1.20.0
**Release Date**: 2026-04-12 (Guild Inventory System)

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
