# Development Roadmap

**Last Updated**: 2026-03-23
**Current Phase**: Phase 5 In Progress (Milestone 5 Building System Refactor v1.10 Complete)
**Overall Progress**: ~95% Complete

---

## Phase Overview

```
[PHASE 1: Core Systems]        ████████████████████ 100% COMPLETE
[PHASE 2: Guild Hall]          ████████████████████ 100% COMPLETE
[PHASE 3: Characters & NPCs]   ████████████████████ 100% COMPLETE
[PHASE 4: Save System v1]      ████████████████████ 100% COMPLETE
[PHASE 5: Polish & Launch]     █████████████████████ 95% IN PROGRESS
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

**Status**: 🟡 IN PROGRESS (90% complete)
**Target Completion**: 2026-03-30
**Duration**: ~2 weeks

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

### Current Tasks
- [x] Character sprite animation system (v1.11 complete)
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
| Week 3 (03/29-03/30) | Launch decision, final build, release prep | 100% complete |

### Success Criteria for Phase 5
- [ ] All critical bugs fixed (0 P0/P1 issues)
- [ ] Performance: save/load < 100ms, list < 50ms
- [ ] Test coverage: 80%+ for core systems
- [ ] WCAG AA compliance achieved
- [ ] All UI strings localized
- [ ] Documentation complete & accurate
- [ ] Go/no-go decision made by 2026-03-30

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
| Phase 5 Complete | 2026-03-30 | 🟡 Expected | Performance optimization, accessibility, final polish, launch decision |
| Phase 6 Start | 2026-04-15 | 📋 Planned | Post-launch content |

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

**Last Updated**: 2026-03-21 by docs-manager (Milestone 2 Vertical Slice Complete)
