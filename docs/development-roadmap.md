# Development Roadmap

**Last Updated**: 2026-04-19
**Current Phase**: Phase 5 In Progress (Milestone 17 Combat ATB Manual Mode Fix Complete)
**Overall Progress**: ~99.8% Complete

---

## Phase Overview

```
[PHASE 1: Core Systems]        ████████████████████ 100% COMPLETE
[PHASE 2: Guild Hall]          ████████████████████ 100% COMPLETE
[PHASE 3: Characters & NPCs]   ████████████████████ 100% COMPLETE
[PHASE 4: Save System v1]      ████████████████████ 100% COMPLETE
[PHASE 5: Polish & Launch]     ██████████████████████ 98% IN PROGRESS
[PHASE 6: Post-Launch]         ░░░░░░░░░░░░░░░░░░░░ 0% PLANNED
```

---

## Phase 1: Core Systems (COMPLETE)

**Status**: ✅ COMPLETE
**Completion Date**: Before 2026-03-15
**Duration**: ~1 week

### Achievements
- [x] Combat system (tick-based auto-RPG simulator)
- [x] Economy system (gold, upkeep, debt)
- [x] Mission system (7-tier quest progression)
- [x] Leveling system (EXP curves, stat growth)
- [x] Building system (room placement, effects)
- [x] Web Worker game loop (offline simulation)
- [x] Zustand store architecture

### Key Metrics
- **Test Coverage**: 85% (core systems)
- **Performance**: Game loop sustains 1 tick/100ms on Web Worker
- **Code Quality**: ESLint pass rate 100%

### Deliverables
- `src/game/systems/` — Combat, economy, missions, leveling, building
- `src/game/state/` — Zustand store with all slices (except save-status)
- `src/game/workers/game-loop.ts` — Web Worker implementation

---

## Phase 2: Guild Hall (COMPLETE)

**Status**: ✅ COMPLETE
**Completion Date**: Before 2026-03-15
**Duration**: ~3 days

### Achievements
- [x] 3x3 guild hall grid layout
- [x] 6 room types (Tavern, Training, Infirmary, Barracks, Library, Workshop)
- [x] Room placement UI in build menu
- [x] Room effect system (stat/EXP bonuses)
- [x] Isometric visual scene (React Three Fiber)
- [x] Real-time room preview

### Key Metrics
- **Rendering**: 60fps on modern hardware
- **Room Effects**: Correctly calculated on member stats
- **Upkeep**: Scales with room count (tested)

### Deliverables
- `src/scene/world.tsx` — Guild hall 3D scene
- `src/scene/guild-hall.tsx` — Room placement grid
- `src/ui/panels/build-menu.tsx` — Build UI
- `src/game/systems/building-system.ts` — Room logic

---

## Phase 3: Character & Recruitment System (COMPLETE)

**Status**: ✅ COMPLETE
**Completion Date**: Before 2026-03-15
**Duration**: ~5 days

### Achievements
- [x] Founder character creation (name, stat allocation)
- [x] 3 civilizations (Human, Orc, Elf)
- [x] 80+ unique heroes across 3 tiers
- [x] Recruitment system (cost, tier unlock)
- [x] Guild roster UI (view, filter, manage)
- [x] Member leveling (independent progression)
- [x] Equipment system (armor, weapons)

### Key Metrics
- **Heroes**: 80+ unique characters with stats
- **Civilizations**: 3 full archetypes with distinct traits
- **Roster**: Supports 50+ active members

### Deliverables
- `src/ui/panels/char-creation.tsx` — Founder creation
- `src/ui/panels/guild-roster.tsx` — Roster management
- `src/game/data/characters.ts` — Hero templates
- `src/game/data/civilizations.ts` — Civilization traits

---

## Phase 4: Save System v1 (COMPLETE)

**Status**: ✅ COMPLETE
**Completion Date**: 2026-03-15
**Duration**: ~4 days

### Achievements
- [x] Multi-slot IndexedDB architecture (3 slots)
- [x] Save validation (TypeScript type guards)
- [x] Auto-save timer (60s interval + visibility change)
- [x] Save status tracking (Zustand slice)
- [x] HUD save status badge (saving/saved/error states)
- [x] Title screen with slot selection
- [x] Continue/New Game/Delete actions
- [x] Save/load/export/import pipeline
- [x] Backup corruption recovery
- [x] Vietnamese localization (title screen, dialogs)

### Key Metrics
- **Save Latency**: <100ms for 3 slots
- **Load Latency**: <200ms with backup recovery
- **Validation**: 100% invalid saves rejected
- **Test Coverage**: 90%+ for save system
- **Backup Success**: 100% recovery rate from shadow slots

### Deliverables
- `src/game/save/save-manager.ts` — Lifecycle orchestration
- `src/game/save/save-storage.ts` — IndexedDB CRUD
- `src/game/save/save-validation.ts` — Type guards + migration
- `src/game/save/active-slot-storage.ts` — Slot tracking
- `src/game/state/save-status-slice.ts` — Status state
- `src/ui/screens/title-screen.tsx` — Slot selection UI
- `src/ui/screens/save-slot-card.tsx` — Slot card component
- `src/ui/hud/save-status-badge.tsx` — Status indicator
- `src/ui/styles/title-screen.css` — Title screen styling
- `src/i18n/vi.json` — Vietnamese translations

### Bugs Fixed
- None in Phase 4 (all requirements met)

### Technical Debt
- None introduced in Phase 4

---

## Phase 5: Polish & Launch (IN PROGRESS)

**Status**: 🟡 IN PROGRESS (98% complete)
**Target Completion**: 2026-04-11
**Duration**: ~3 weeks

### Completed Tasks
- [x] Build Mode Level 2 — Grid-based placement with rotation (v1.2 released)
- [x] Collision detection & boundary validation (24 tests, 95%+ coverage)
- [x] Advanced Build Mode — Room moving, build toggle, member hiding (v1.3 released)
- [x] Build mode advanced tests (48 new tests, 100% passing)
- [x] Structures Utility — Mercenary system + Tavern + Quest Board tier gating (v1.4 released)
- [x] Mercenary/Tavern integration tests (25/25 passing)
- [x] Inventory & Multi-Resource Economy — Item database, loot system, building costs (v1.5 released)
- [x] Resource loot and cost integration tests (full suite passing)
- [x] Roster Management & Combat Enhancements — Multi-member dispatch, skill cooldown, auto-cast, compact UI (v1.6 released)
- [x] Roster UI refactor + character detail panel (new components)
- [x] Guild Rank System — 5-tier hierarchy with promotion mechanics (v1.7/v1.8 released)
- [x] Rank system integration tests + save migration (v7→v8)
- [x] Milestone 2 Vertical Slice — Civilizations, Combat Passives, 22 Missions, 15 Enemies, 7 Skills, Audio Expansion (v1.9 released)
- [x] Civilization system with CIV_CONFIG, stat bonuses, character creation integration
- [x] Combat passives (Son The, Dien The Chi Huy, Tinh Lo) implemented + tested
- [x] Mission expansion (22 total) with quest chains + gate bosses
- [x] Enemy expansion (15 types) with stun-attack, enrage, heal-ally abilities
- [x] Skills expansion (7 total) grouped by archetype per civilization
- [x] Audio system expanded (6 new keys: BGM_COMBAT, SFX_CRIT, SFX_DODGE, SFX_DEATH, SFX_SKILL, SFX_RECRUIT)
- [x] Save migration v8→v9 + full test suite passing
- [x] Documentation updated (Milestone 2 features in all docs)
- [x] Icon Asset Integration — 60 pixel-art icons across 9 categories, convention-based path resolution (v1.10 released)
- [x] GameIcon component + CostDisplay extraction + 13-file UI integration
- [x] Icon system documentation + codebase summary updated
- [x] Character Sprite Animation — 12 civ-specific sprite sets, animated walking frames, movement AI, direction tracking (v1.11 released)
- [x] SpriteAnimator component + sprite-path-resolver utility + member-layer enhancement
- [x] Archetype/gender fields added to Member interface, fallback support for old saves
- [x] Convention-based sprite folder structure (TS/DQ/TL prefixes, 8 walking frames per direction)
- [x] Guild Facilities System — 4 zones (Tavern, Training Yard, Infirmary, Workshop) with member assignment, stat-based bonuses, offline production (v1.12 released)
- [x] FacilitiesPanel unified UI, facility-card component, facility-production-system calculations
- [x] Member 'assigned' status blocking missions/promotions, offline facility popup on login
- [x] Facility level progression with upgrade costs, per-level slot capacity
- [x] Forest Arena HD-2D upgrade (v1.13 complete — GLB diorama + 3D props + shadow casting)
- [x] Octopath Traveler style diorama rendering, shadow-casting 3D props, MeshStandardMaterial billboard sprites
- [x] Leva debug controls for prop tuning, backward compat with 2D fallback
- [x] Member Book UI — Unified book/ledger roster redesign (v1.14 released)
- [x] Bookmark navigation (78px column), two-page layout, ruled-line CSS texture
- [x] Derived stats display (combat + guild stats), sticky action footer (rank-aware)
- [x] member-bookmark-list, member-book-detail-page, member-derived-stats-section components
- [x] UI Enhancements & New Facilities (v1.16 released)
- [x] +5 Stat Allocation button (character-detail-panel, member-book-detail-page)
- [x] New facility types: Logging Site, Stone Quarry with STR-based production
- [x] WASD camera pan controls (WASD + ESC) for facility room navigation
- [x] Room navigation bar (room-nav-bar.tsx) with facility icon buttons
- [x] Build menu refactor: removed FloorTab, streamlined to FurnitureTab
- [x] Tutorial First-Session Flow (v1.17 planned)
- [x] Narrative-driven onboarding: World Board lore modal -> tutorial quest dispatch
- [x] Kael NPC recruitment via tutorial quest completion
- [x] LOGGING_SITE_ACCESS permit reward -> free facility unlock
- [x] Tutorial progression: world-board -> quest-dispatch -> quest-active -> kael-rescue -> reward -> build -> assign -> complete
- [x] Tutorial quest auto-advance with quest completion, facility build, member assignment
- [x] Panel gating during tutorial (quest board filtered to tutorial quests, facilities highlighted)
- [x] Save migration v11→v12 for tutorial step transitions
- [x] Logging Site Finite Harvest System (v1.18 released)
- [x] Woodcutting occupational skill (Lv0–10, XP thresholds, stat bonuses)
- [x] Finite wood reserve (1000 wood capacity, per-tick depletion, multi-member stacking)
- [x] Logging permit unlock system (tutorial grant, forest missions 15% drop)
- [x] Depletion lifecycle UI (warning/critical/depleted states, color thresholds, auto-unassign)
- [x] Save migration v13→v14 (members get craftSkills, facilities get woodReserve)
- [x] 3D zone tinting (reserve % → color gradient)
- [x] GPU-Instanced Combat Rendering (mega-atlas builder, animation state buffer, single draw call, WebGPU compatibility fixes)
- [x] Guild Inventory System (slot-based inventory panel, storage-chest furniture, stack limits, item detail popup)

### Current Tasks
- [x] Manual Mode ATB Pause Fix (unity timeline, engine freeze, 5 tests passing)
- [x] Shadow & Bloom Settings Toggle (user-facing graphics controls, localStorage, store-driven post-processing)
- [ ] Performance optimization (target <100ms saves)
- [ ] Comprehensive testing (combat, economy, offline progression, sprite rendering)
- [ ] Bug fixes from testing phase
- [ ] UI/UX polish (animations, transitions, sprite-related polish)
- [ ] Accessibility audit (WCAG AA compliance)
- [ ] Localization review (Vietnamese strings, archetype names)
- [ ] Launch checklist & go/no-go decision

### Planned Deliverables
- [ ] Performance benchmarks report
- [ ] Test coverage report (target 80%+)
- [ ] Accessibility audit report
- [ ] Final documentation
- [ ] Launch build (optimized, minified)

### Timeline

| Week | Tasks | Target |
|------|-------|--------|
| Week 1 (03/15-03/21) | Build Mode v2+v3, mercenary system, inventory, roster mgmt, guild ranks, Milestone 2 complete | 90% complete ✅ |
| Week 2 (03/22-03/28) | Performance optimization, accessibility, i18n, final docs, bug fixes | 95% complete (on track) |
| Week 3 (03/29-04/04) | Member Book UI, final polish, documentation, launch decision | 96% complete ✅ |

### Success Criteria for Phase 5
- [x] All critical bugs fixed (0 P0/P1 issues)
- [ ] Performance: save/load < 100ms, list < 50ms
- [ ] Test coverage: 80%+ for core systems
- [ ] WCAG AA compliance achieved
- [ ] All UI strings localized
- [ ] Documentation complete & accurate
- [ ] Go/no-go decision made by 2026-04-04

### Risks & Mitigations
| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Performance regression during testing | Medium | Early profiling, incremental testing |
| Localization gaps | Low | Translation coverage audit before launch |
| Browser compatibility issues | Low | BrowserStack testing |
| Last-minute bugs | High | Buffer time (3 days), regression testing suite |

---

## Phase 6: Post-Launch (PLANNED)

**Status**: 📋 PLANNED
**Target Start**: 2026-04-15
**Duration**: TBD (depends on post-launch feedback)

### Completed Features
- [x] **WC-MAPMAKER** (Map Playground Tool) — Phases 1–10 complete (full feature parity)
  - Asset browser (3D props, BG layers, VFX effects, filtering)
  - R3F canvas viewport with orthogonal camera, floor raycaster, click-to-place
  - Properties panel (position, scale, rotation sliders with live preview)
  - Background layer editor (z-depth, y-offset, scale, opacity)
  - Reactive lighting (Leva debug panel, ambient/directional/fog controls)
  - Atmospheric VFX placements (fog-mist, cave-ember, forest-spore, dust-motes)
  - TypeScript code generator → clipboard (BiomeConfig export for arena-biome-config.ts)
  - Undo/Redo (Ctrl+Z/Y), delete (Delete), duplicate (Ctrl+D)
  - Scene objects list panel (selectable object hierarchy)
  - Ghost preview on asset placement (green/red validation)
  - Keyboard shortcuts (Esc to cancel placement, Delete to remove, Ctrl+D to duplicate)
  - Vite dev server on port 5175 with custom plugin for game asset serving
- [x] **VFX-PLAYGROUND Sequencer** (Skill Choreography Sequencer) — Phases 1–7 complete
  - Mode switcher: dual-mode architecture (Effect Designer + Skill Sequencer)
  - Timeline DAW-style interface for animation sequencing
  - Track registry system with sprite, particle, audio tracks
  - Real R3F preview with Three.js WebGPU rendering
  - Clip inspector for real-time property editing
  - Sequence code generator (`.tsx` exports)
  - localStorage persistence for sequence library
  - Engine adapters for Worlds Collide game integration

### Planned Features
- [ ] New civilizations (2 additional factions)
- [ ] Seasonal quest lines (time-limited content)
- [ ] Leaderboards & achievements
- [ ] Guild wars (PvP simulation)
- [ ] Pet system (companion creatures)
- [ ] Cosmetic customization (character skins)

### Exploratory (Phase 6+)
- Mobile apps (React Native)
- Cloud sync (optional server)
- Social features (async multiplayer)

### Metrics for Phase 6
- Player retention after launch (target: 40% DAU after 30 days)
- Bug report rate (target: <5 P0/P1 per week)
- Feature requests from community
- Performance metrics (real-world usage)

---

## Milestone Summary

| Milestone | Target Date | Status | Notes |
|-----------|-------------|--------|-------|
| Phase 1 Complete | 2026-02-28 | ✅ Done | Core systems stable |
| Phase 2 Complete | 2026-03-07 | ✅ Done | Guild hall rendering |
| Phase 3 Complete | 2026-03-12 | ✅ Done | Character system |
| Phase 4 Complete | 2026-03-15 | ✅ Done | Save system v1 |
| Phase 5 Checkpoint 1 | 2026-03-21 | ✅ Done | Build Mode v2 complete, 24 tests passing |
| Phase 5 Checkpoint 2 | 2026-03-21 | ✅ Done | Advanced Build Mode v3, 48 tests passing, docs updated |
| Phase 5 Checkpoint 3 | 2026-03-16 | ✅ Done | Structures Utility v1.4 (mercenary system), 25/25 tests passing |
| Phase 5 Checkpoint 4 | 2026-03-16 | ✅ Done | Inventory & Multi-Resource Economy v1.5, full test suite passing |
| Phase 5 Checkpoint 5 | 2026-03-16 | ✅ Done | Roster Management v1.6 (multi-member dispatch, skill cooldown, auto-cast, UI) |
| Phase 5 Checkpoint 6 | 2026-03-16 | ✅ Done | Guild Rank System v1.7-v1.8 (5-tier hierarchy, promotion mechanics, save migration) |
| Phase 5 Milestone 2 | 2026-03-21 | ✅ Done | Civilizations system, 3 combat passives, 7 skills, 22 missions, 15 enemies, 6 audio keys |
| Phase 5 Milestone 3 | 2026-03-21 | ✅ Done | Icon asset integration (60 pixel-art icons, 9 categories, convention-based resolution) |
| Phase 5 Milestone 4 | 2026-03-23 | ✅ Done | Character sprite animation (12 civ-specific sprite sets, 4-directional walking, movement AI) |
| Phase 5 Milestone 5 | 2026-03-23 | ✅ Done | Building System Refactor (tile-based architecture, floor tiles, guild-level furniture, save migration v9→v10) |
| Phase 5 Milestone 6 | 2026-03-30 | ✅ Done | Guild Facilities System (4 zones, member assignment, stat-based production, offline catch-up) |
| Phase 5 Milestone 7 | 2026-03-30 | ✅ Done | Forest Arena HD-2D Upgrade (GLB diorama + 3D props, shadow pipeline, MeshStandardMaterial sprites) |
| Phase 5 Milestone 8 | 2026-04-04 | ✅ Done | Member Book UI (unified book-style roster, bookmark nav, derived stats display, ruled-line texture) |
| Phase 5 Milestone 9 | 2026-04-04 | ✅ Done | Civilization Sync (LinhSon last-stand, DeQuoc Shock+team-buff, ThienLu 2-tier clone, 95/95 tests) |
| Phase 5 Milestone 10 | 2026-04-09 | ✅ Done | 3D Facility Zone Visualization (4 zone markers, level-gated props, assigned member sprites, zone → panel integration) |
| Phase 5 Milestone 11 | 2026-04-09 | ✅ Done | Facility Rooms with Camera Navigation (4 facility rooms, smooth camera animation, "Enter Room" + home button) |
| Phase 5 Milestone 12 | 2026-04-10 | ✅ Done | UI Enhancements & New Facilities (+5 stat button, Logging Site, Stone Quarry, WASD camera pan, room nav bar) |
| Phase 5 Milestone 13 | 2026-04-10 | ✅ Done | Tutorial First-Session Flow (world-board lore, tutorial quest, Kael recruitment, facility unlock, progression gates) |
| Phase 5 Milestone 14 | 2026-04-11 | ✅ Done | Logging Site Finite Harvest System (woodcutting skill, finite reserve, permit gate, depletion lifecycle, 3D zone tinting, save v14) |
| Phase 5 Milestone 15 | 2026-04-12 | ✅ Done | GPU-Instanced Combat Rendering (mega-atlas, animation buffer, 1 draw call, WebGPU fixes, canvas-texture UI) |
| Phase 5 Milestone 16 | 2026-04-12 | ✅ Done | Guild Inventory System (slot-based UI, chest furniture, 99-item stacks, capacity management, item detail popup) |
| Phase 5 Milestone 17 | 2026-04-19 | ✅ Done | Combat Formation + ATB Timeline + Manual Mode (formation home slots, step-attack state machine, timeline bar, manual attack queue, target selection) |
| Phase 5 Milestone 18 | 2026-04-19 | ✅ Done | Manual Mode ATB Pause Fix (unified timeline, engine freeze on ally turn, pause clears on action, 5 tests passing) |
| Phase 5 Milestone 19 | 2026-04-27 | ✅ Done | Shadow & Bloom Settings Toggle (user-facing graphics toggles in Settings Panel, localStorage persistence, store-driven post-processing) |
| Phase 6 Milestone 1 | 2026-04-17 | ✅ Done | Map Playground Tool (Phases 1–10 complete, asset browser, R3F viewport, properties panel, code generator, undo/redo) |
| Phase 6 Milestone 2 | 2026-05-02 | ✅ Done | VFX Sequencer Integration (Phases 1–7 complete, dual-mode architecture, DAW timeline, codegen, engine adapters) |
| Phase 5 Complete | 2026-04-12 | 🟡 Expected | Performance optimization, accessibility, final polish, launch decision |
| Phase 6 Start | 2026-04-15 | 📋 In Progress | Post-launch content |


---

## Dependency Chain

```
Phase 1 (Core Systems)
    ↓
Phase 2 (Guild Hall) + Phase 3 (Characters)
    ↓
Phase 4 (Save System v1) — Blocks other phases until complete
    ↓
Phase 5 (Polish & Launch)
    ↓
Phase 6 (Post-Launch Features) — Concurrent development possible
```

---

## Resource Allocation

| Phase | Primary Focus | Support | Notes |
|-------|---------------|---------|-------|
| Phase 1-3 | Core gameplay | Setup, tooling | Parallel work on systems |
| Phase 4 | Save system | UI/UX, testing | Critical path item |
| Phase 5 | Quality assurance | All teams | Performance + stability focus |
| Phase 6+ | Feature development | Community feedback | Backlog refinement |

---

## Known Issues & Debt

### Technical Debt
- Web Worker communication could use better error handling (low priority)
- CSS could be refactored into theme variables (deferred to Phase 5)

### Planned Improvements
- [ ] Add animation framework for panel transitions (Phase 5)
- [ ] Implement settings persistence (settings panel values)
- [ ] Audio balance (BGM/SFX levels)

### Deferred Features
- Multiplayer guilds (Phase 6+)
- Cloud sync (Phase 7+)
- Mobile apps (Phase 8+)

---

## Launch Checklist

### Code Quality
- [ ] ESLint: 0 errors
- [ ] TypeScript: strict mode, 0 errors
- [ ] Tests: 80%+ coverage
- [ ] Performance: all metrics green

### User Experience
- [ ] Onboarding smooth (char creation → game)
- [ ] Save/load working reliably
- [ ] Panels responsive (mobile-friendly)
- [ ] No visual glitches

### Localization
- [ ] All UI strings translated (Vietnamese)
- [ ] Numbers/dates formatted correctly
- [ ] No placeholder text remaining

### Documentation
- [ ] README updated
- [ ] Architecture docs complete
- [ ] Code standards documented
- [ ] Changelog current

### Browser Support
- [ ] Chrome 90+: PASS
- [ ] Firefox 88+: PASS
- [ ] Safari 14+: PASS
- [ ] Edge 90+: PASS

### Deployment
- [ ] Production build tested
- [ ] Bundle size optimized (<2MB)
- [ ] No console warnings
- [ ] Analytics ready (if applicable)

---

## Post-Launch Monitoring

### Metrics to Track
1. **User Engagement**: DAU, session length, retention
2. **Performance**: Save/load times, crash reports
3. **Quality**: Bug reports, feature requests
4. **System Health**: Server uptime (if applicable), error rates

### Feedback Loop
- Weekly community check-ins
- Monthly metrics review
- Quarterly roadmap updates

---

## Version Numbering

| Version | Description | Date |
|---------|-------------|------|
| 0.1-0.3 | Development snapshots | 2026-02-01 to 2026-03-14 |
| 1.0 | Save system + title screen launch | 2026-03-15 |
| 1.1+ | Post-launch patches & features | 2026-03-30+ |

---

## Communication & Status

### Weekly Status (Every Friday)
- Completed tasks
- Blockers or risks
- Next week's priorities
- Metrics update

### Stakeholder Reviews
- Phase completions (gate reviews)
- Go/no-go decisions
- Launch readiness
- Post-launch retrospectives

---

## Change Log Trigger Events

Documentation automatically updated when:
- Phase status changes (In Progress → Complete)
- Major milestones reached
- Critical bugs discovered/resolved
- Significant scope changes
- Resource allocation changes

**Last Updated**: 2026-04-11 by project-manager (Milestone 14 Logging Site Finite Harvest v1.18.0 Complete)
