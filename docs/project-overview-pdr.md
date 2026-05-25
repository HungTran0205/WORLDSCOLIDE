# Project Overview & Product Development Requirements (PDR)

## Executive Summary

<!-- TODO: stale canon — title is "2000s A.C — After the Collapse"; factions are Linh Sơn / Đế Quốc (Republic Empire) / Thiên Lữ / Eliza / Scavenger, not Human/Orc/Elf. Playable now = Linh Sơn only (see src/game/data/civilization-config.ts + docs/lore/ + docs/gdd/04-civilizations.md). Owner to rewrite — flag-only per plan. -->
**Worlds Collide** is a client-side idle RPG built with React 19 + TypeScript, featuring an innovative multi-civilization recruitment system, real-time quest dispatch, and offline progression through Web Workers. The game emphasizes passive income generation (gold farming) combined with active decision-making (team building, quest selection).

**Current Phase**: Core gameplay implemented. Multi-slot save system deployed (v1.0).

## Vision & Goals

### Primary Vision
Create an engaging idle RPG where players build and manage a thriving guild, recruit heroes from different civilizations, and watch them grow—even while offline. The game rewards strategy (team composition, room placement) and patience (idle progression).

### Success Metrics
1. **Save System**: 3 independent slots with automatic backup recovery
2. **Gameplay Loop**: Character creation → quest dispatch → reward collection → progression
3. **Offline Play**: Web Worker sustains gameplay without active session
4. **Accessibility**: Vietnamese localization, intuitive UI, keyboard navigation
5. **Performance**: <100ms save/load operations, smooth 60fps rendering

## Product Requirements

### Functional Requirements (FR)

#### FR-1: Character System
- **FR-1.1**: Player creates founder character with custom name
- **FR-1.2**: Founder has 7 attributes (STR, VIT, DEX, AGI, INT, WIS, CHA)
- **FR-1.3**: Player allocates 50 stat points during character creation
- **FR-1.4**: Founders gain EXP from quest completion, level up to 100
- **FR-1.5**: Stat growth follows EXP curve with 1.35x scaling per level

**Acceptance Criteria**:
- Founder creation screen enforces 50-point limit
- Stat allocation persists across save/load
- EXP gains properly tier-scaled per quest difficulty

#### FR-2: Guild Management System
- **FR-2.1**: Player owns guild hall with 3x3 grid of rooms
- **FR-2.2**: Rooms: Tavern, Training, Infirmary, Barracks, Library, Workshop
- **FR-2.3**: Each room provides stat/EXP bonuses to members within
- **FR-2.4**: Gold upkeep scales with roster size + room count
- **FR-2.5**: Debt penalties apply if upkeep unpaid

**Acceptance Criteria**:
- Room placement affects member stats visually in scene
- Upkeep deducted daily, debt accumulates
- Guild state persists in save envelope

#### FR-3: Recruitment System
<!-- TODO: stale canon — civilizations are Linh Sơn / Đế Quốc / Thiên Lữ (code defines 3; only Linh Sơn recruitable per RECRUITABLE_UNITS in civilization-config.ts), NOT Human/Orc/Elf. See docs/gdd/04-civilizations.md. -->
- **FR-3.1**: 3 civilizations with distinct archetypes: Human, Orc, Elf
- **FR-3.2**: 80+ unique heroes available across 3 tiers (uncommon, rare, epic)
- **FR-3.3**: Recruitment costs fixed per tier, scale with progression
- **FR-3.4**: Heroes join at level 1 with class-based starting stats
- **FR-3.5**: Members level independently based on quest participation

**Acceptance Criteria**:
- Hero roster accessible, filterable by civilization
- Recruitment costs properly deducted from treasury
- Member stats accurately reflect equipment + room bonuses

#### FR-4: Quest System
- **FR-4.1**: 7-tier progression (F, E, D, C, B, A, S)
- **FR-4.2**: Player selects 1-6 party members, dispatches to quest
- **FR-4.3**: Quest duration scales with difficulty + party stats
- **FR-4.4**: Auto-combat simulator runs offline during quest
- **FR-4.5**: Rewards (gold, EXP, items) distributed on quest completion

**Acceptance Criteria**:
- Quest board displays unlocked tiers
- Party selection prevents over-capacity
- Rewards calculated correctly per difficulty
- Missions complete while app closed

#### FR-5: Combat System
- **FR-5.1**: Tick-based simulator with action turns
- **FR-5.2**: Action order determined by AGI + weapon speed
- **FR-5.3**: Damage formula: Base damage × (STR + weapon scaling)
- **FR-5.4**: Critical hits based on class + stat scaling
- **FR-5.5**: Status effects: poison, stun, vulnerability, defense buff

**Acceptance Criteria**:
- Combat outcomes deterministic (same party/enemy = same result)
- Damage within expected range
- Turn order correctly calculated
- Status effects apply/expire properly

#### FR-6: Save System (NEW - v1.0)
- **FR-6.1**: 3 independent IndexedDB save slots
- **FR-6.2**: Auto-save every 60 seconds + on tab visibility change
- **FR-6.3**: Shadow backup for corruption recovery
- **FR-6.4**: Full game state serialized (all slices)
- **FR-6.5**: JSON export/import with validation
- **FR-6.6**: Save status indicator in HUD (saving/saved/error)
- **FR-6.7**: Title screen shows all slots with metadata (founder name, playtime, last save)
- **FR-6.8**: Delete slot with confirmation dialog

**Acceptance Criteria**:
- All 3 slots independently readable after save
- Auto-save debounces to prevent IndexedDB hammering
- Corrupted save recoverable from backup
- Import validation prevents invalid game states
- Save metadata accurate (no date drift)

#### FR-7: Title Screen (NEW - v1.0)
- **FR-7.1**: Game entry point displays 3 save slot cards
- **FR-7.2**: Continue button loads selected slot (disabled if empty)
- **FR-7.3**: New Game button navigates to char creation
- **FR-7.4**: Delete button removes slot with confirmation
- **FR-7.5**: Overwrite confirmation when new game on populated slot

**Acceptance Criteria**:
- Slot cards render correctly on first load
- Continue/delete/new game transitions work smoothly
- Confirmation dialogs prevent accidental data loss
- All actions reflected immediately in UI

#### FR-8: UI & Navigation
- **FR-8.1**: 5 collapsible panels: Quest Board, Roster, Build, Combat, Settings
- **FR-8.2**: HUD bar toggles panels, shows resource indicators
- **FR-8.3**: Settings panel: audio/language toggle, import/export, return to title
- **FR-8.4**: All panels accept keyboard input (Escape closes)
- **FR-8.5**: Mobile-responsive layout (320px+ width)

**Acceptance Criteria**:
- Panel toggle bar always visible
- Settings persist across sessions
- Import/export accessible and validated
- Return to title triggers save

#### FR-9: Offline Progression
- **FR-9.1**: Web Worker runs game loop even when app tab inactive
- **FR-9.2**: Tick simulation continues at 1 tick/100ms
- **FR-9.3**: On app return, catch-up applies: mission completion, upkeep deduction
- **FR-9.4**: Offline duration capped to prevent exploit (max 24h catch-up)
- **FR-9.5**: Player notified of offline changes on return

**Acceptance Criteria**:
- Offline ticks correctly counted
- Upkeep and missions reconciled on return
- No duplicate rewards or state corruption

#### FR-10: Guild Rank System (NEW - v1.8)
- **FR-10.1**: Members advance through 5-tier hierarchy: RECRUIT → MEMBER → VETERAN → OFFICER → COMMANDER
- **FR-10.2**: Mercenary rank exists outside hierarchy (orthogonal, non-promotable)
- **FR-10.3**: Each rank provides upkeep modifier (0.8x to 1.3x) + EXP bonus (0% to 20%)
- **FR-10.4**: Promotion requires level + missions completed + gold cost
- **FR-10.5**: Player initiates promotion (click button, deducts gold atomically)
- **FR-10.6**: Promotion criteria scale per tier (e.g., RECRUIT→MEMBER: Lvl 3, 5 missions, 200g)
- **FR-10.7**: Per-member `missionsCompleted` counter tracks promotion eligibility
- **FR-10.8**: Save migration v7→v8 auto-seeds `missionsCompleted = level * 2`, resets ranks to RECRUIT

**Acceptance Criteria**:
- Rank badges display correctly with tier-appropriate colors
- Upkeep calculation applies rank.upkeepModifier multiplier
- Mission EXP applies rank.expBonusPct bonus on reward distribution
- Promotion UI shows eligibility (disabled if criteria unmet)
- Promotion atomic (gold deducted iff rank changes successfully)
- Save migration transparent; old saves load with correct ranks
- MERCENARY members unpromotable (UI shows lock icon)

#### FR-11: Guild Facilities System (NEW - v1.12)
- **FR-11.1**: 4 facility types: Tavern, Training Yard, Infirmary, Workshop (v1.12)
- **FR-11.2**: 2 additional facilities: Logging Site (finite wood harvest), Stone Quarry (infinite stone production)
- **FR-11.3**: Members assign to facilities for stat-based production (offline safe)
- **FR-11.4**: Each facility levels independently with upgrade costs (gold + items)
- **FR-11.5**: Facilities provide passive income: gold (Tavern), EXP (Training), healing (Infirmary), crafting mats (Workshop/Logging/Quarry)
- **FR-11.6**: Building placement: max 2 per facility type per guild level, visual zones in guild hall
- **FR-11.7**: Assigned members block mission dispatch (must unassign first)
- **FR-11.8**: Auto-unassign on facility depletion (Logging Site only when wood = 0)
- **FR-11.9**: 3D facility rooms: enter from guild hall, view assigned members working, WASD camera pan

**Acceptance Criteria**:
- Facilities produce correct quantities per tick (1s heartbeat)
- Multiple assigned members stack production correctly
- Upgrade costs deducted atomically
- Assigned members visible in facility rooms
- Facility state persists across save/load

#### FR-12: Woodcutting Occupational Skill System (NEW - v1.18)
- **FR-12.1**: Woodcutting skill: 11 levels (0–10), XP-gated by wood harvested
- **FR-12.2**: XP thresholds: [0, 50, 150, 350, 700, 1200, 2000, 3200, 5000, 7500, 11000]
- **FR-12.3**: Bonus multipliers: [0%, 10%, 22%, 38%, 58%, 80%, 105%, 133%, 165%, 200%, 240%] per level
- **FR-12.4**: Auto-leveling on threshold cross (no player action)
- **FR-12.5**: Skill progression persists per-member across sessions
- **FR-12.6**: Woodcutting animation: 8-frame directed sprite loop per civilization (east-facing in facility room)

**Acceptance Criteria**:
- Woodcutting skill XP accumulates from Logging Site production
- Level-up auto-triggers on threshold cross
- Skill bonus properly scales production rate
- Woodcutting animations play when member assigned to Logging Site

#### FR-13: Logging Site Finite Harvest System (NEW - v1.18)
- **FR-13.1**: Logging Site starts with 1000 wood reserve (depletable)
- **FR-13.2**: Production formula: `woodPerTick = 0.0114 × baseScore/100 × (1 + skillBonus%)`
  - baseScore = (STR×0.5) + (END×0.3) + (DEX×0.2)
- **FR-13.3**: Permit-based unlock: requires 1 Logging Permit to build (not gold)
- **FR-13.4**: Permit sources: Tutorial quest grant + forest missions 15% drop
- **FR-13.5**: Depletion states: Active (>25%) → Warning (10–25%) → Critical (<10%) → Depleted (0)
- **FR-13.6**: Depleted site auto-unassigns members, shows removal UI
- **FR-13.7**: 3D zone tint reflects reserve level: green/amber/red/grey

**Acceptance Criteria**:
- Wood reserve depletes at calibrated rate (STR20/END15 = ~7 days to zero)
- Permit consumption atomic on build
- Depletion state transitions trigger correct UI + unassign logic
- 3D tinting updates per-tick with reserve %
- Save migration v13→v14 seeds woodcutting skill + preserves old saves

### Non-Functional Requirements (NFR)

#### NFR-1: Performance
- **NFR-1.1**: Save/load < 100ms latency
- **NFR-1.2**: List slots < 50ms latency
- **NFR-1.3**: Main thread maintains 60fps during gameplay
- **NFR-1.4**: HUD badge animation smooth (no jank)
- **NFR-1.5**: Game loop Web Worker independent of UI thread

**Measurement**: Vitest + browser DevTools profiling

#### NFR-2: Reliability
- **NFR-2.1**: Save operations never corrupt existing slot
- **NFR-2.2**: Import validation rejects 100% of invalid saves
- **NFR-2.3**: Uptime: Game continues offline indefinitely
- **NFR-2.4**: Recovery: Automatic backup restore on corruption
- **NFR-2.5**: No game-breaking bugs in core systems (combat, economy, progression)

**Measurement**: Unit tests + integration tests

#### NFR-3: Data Integrity
- **NFR-3.1**: All game state stored in envelope (no partial saves)
- **NFR-3.2**: Metadata versioning enables future migrations
- **NFR-3.3**: Type validation prevents invalid state transitions
- **NFR-3.4**: Export format is human-readable JSON

**Measurement**: Type-safe code + test coverage

#### NFR-4: Accessibility (a11y)
- **NFR-4.1**: Semantic HTML for screen readers
- **NFR-4.2**: Keyboard navigation (Tab, Enter, Escape)
- **NFR-4.3**: Color contrast minimum WCAG AA (4.5:1)
- **NFR-4.4**: Alt text on icons and images
- **NFR-4.5**: Focus indicators visible

**Measurement**: WAVE, axe accessibility audits

#### NFR-5: Localization (i18n)
- **NFR-5.1**: Vietnamese as default locale (CJKV character support)
- **NFR-5.2**: All UI strings translatable via i18next
- **NFR-5.3**: No hardcoded English strings in components
- **NFR-5.4**: Title screen, save dialogs localized
- **NFR-5.5**: Future expansion: English, Japanese, Chinese

**Measurement**: Translation coverage report

#### NFR-6: Browser Compatibility
- **NFR-6.1**: Modern browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **NFR-6.2**: IndexedDB required (no fallback to localStorage)
- **NFR-6.3**: Web Workers required (offline progression disabled otherwise)
- **NFR-6.4**: React 19 requires ES2020+ support

**Measurement**: BrowserStack testing

#### NFR-7: Security
- **NFR-7.1**: No sensitive data in saves (game state only)
- **NFR-7.2**: Import JSON validated before state hydration
- **NFR-7.3**: No server communication (client-side only)
- **NFR-7.4**: No user authentication required
- **NFR-7.5**: XSS protection via React's built-in escaping

**Measurement**: Code review + OWASP top 10 checklist

#### NFR-8: Code Quality
- **NFR-8.1**: TypeScript strict mode enabled
- **NFR-8.2**: ESLint pass rate: 100% warnings or errors fixed
- **NFR-8.3**: Test coverage: 80%+ for core systems
- **NFR-8.4**: Cyclomatic complexity < 10 per function
- **NFR-8.5**: No hardcoded magic numbers (use constants)

**Measurement**: ESLint, Vitest coverage reports

## Architecture Constraints

### Technology Stack (Fixed)
- React 19 + TypeScript 5 (UI layer)
- Zustand 5 (state management)
- React Three Fiber (3D scenes)
- IndexedDB (persistence, no server)
- Web Workers (offline ticks)
- i18next (localization)

### Storage Constraints
- IndexedDB quota: 50MB+ (most browsers)
- Save envelope: ~50KB per slot
- 3 slots + backup = ~300KB total
- Well within quota

### Browser Requirements
- IndexedDB API
- Web Workers API
- localStorage API
- ES2020+ JavaScript

## Dependencies & Integration

### External Libraries (npm)
| Package | Version | Purpose |
|---------|---------|---------|
| react | 19 | UI framework |
| typescript | 5 | Type safety |
| vite | 8 | Build tool |
| zustand | 5 | State management |
| @react-three/fiber | Latest | 3D rendering |
| @react-three/drei | Latest | 3D utilities |
| howler | Latest | Audio engine |
| idb | Latest | IndexedDB wrapper |
| i18next | Latest | Localization |
| vitest | Latest | Testing |

### Internal Modules
- `save-manager.ts` — Orchestrates save lifecycle
- `save-storage.ts` — IndexedDB CRUD
- `save-validation.ts` — Type guards + validation
- `store.ts` — Zustand store (all slices)
- Game systems (combat, economy, missions)

### No Server Dependency
- Purely client-side
- No authentication
- No API calls
- Offline-first design

## Implementation Timeline

| Phase | Status | Target Date | Deliverables |
|-------|--------|-------------|--------------|
| Phase 1: Core Systems | Complete | — | Combat, economy, missions, leveling |
| Phase 2: Guild Hall | Complete | — | Room placement, effects, building |
| Phase 3: Character System | Complete | — | Founder, roster, recruitment |
| Phase 4: Save System v1 | Complete | 2026-03-15 | Multi-slot, validation, title screen |
| Phase 5: Guild Rank System | Complete | 2026-03-18 | 5-tier promotion, perks, UI (v1.8) |
| Phase 6: Polish & Launch | In Progress | TBD | Bug fixes, performance, localization |
| Phase 7: Post-Launch | Planned | TBD | New civilizations, seasonal quests, leaderboards |

## Success Criteria (Acceptance Tests)

### Save System (v1.0)
- [ ] All 3 save slots independently functional
- [ ] Auto-save triggers every 60s + on tab blur
- [ ] Corrupted save recovered from backup
- [ ] Import validation rejects invalid JSON
- [ ] HUD badge shows saving/saved/error states
- [ ] Title screen displays all slot metadata
- [ ] Delete confirmation prevents accidents

### Title Screen
- [ ] Loads on game start
- [ ] 3 save slot cards rendered with correct metadata
- [ ] Continue button loads selected save
- [ ] New Game navigates to char creation
- [ ] Delete removes save + refreshes UI
- [ ] Overwrite warning on new game to populated slot

### Offline Progression
- [ ] Web Worker runs while tab inactive
- [ ] Missions complete after 8+ hours offline
- [ ] Upkeep deducted for offline duration
- [ ] State synced correctly on app return

### Guild Rank System (v1.8)
- [ ] All 5 ranks + Mercenary tier correctly defined
- [ ] Upkeep modifier applied per rank (0.8x to 1.3x)
- [ ] EXP bonus applied per rank (0% to 20%)
- [ ] Promotion eligibility check: level + missions + gold
- [ ] Promotion UI shows requirements + button (disabled if unmet)
- [ ] Promotion atomic: gold deducted iff rank updates
- [ ] missionsCompleted counter incremented on mission completion
- [ ] Rank badges render with correct colors
- [ ] Save migration v7→v8 auto-runs (transparent to user)
- [ ] MERCENARY members stay MERCENARY + unpromotable

### Code Quality
- [ ] ESLint: 0 errors, minor warnings documented
- [ ] TypeScript: strict mode, 0 compilation errors
- [ ] Tests: 80%+ coverage for save system + rank system
- [ ] Performance: save/load < 100ms

### Localization
- [ ] All title screen strings translated to Vietnamese
- [ ] Rank labels translated (RECRUIT, MEMBER, etc.)
- [ ] Promotion requirement strings localized
- [ ] i18next integration tested

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| IndexedDB quota exceeded | Low | High | Monitor DB size, warn user |
| Corrupted save unrecoverable | Low | High | Shadow backup system |
| Web Worker fails offline | Medium | High | Fallback to on-app-return sync |
| Import validation bypassed | Low | Medium | Type guards, unit tests |
| Performance regression on save | Medium | Medium | Performance benchmarking |
| Localization strings incomplete | Medium | Low | Translation coverage audit |

## Future Enhancements (Post-v1.0)

### Phase 6: Expanded Content
- 2 additional civilizations (8+ new heroes)
- Seasonal quest lines
- Leaderboards & achievements

### Phase 7: Advanced Features
- Multiplayer guilds (async trading)
- Guild wars (PvP simulation)
- Cosmetic customization
- Pet system

### Phase 8: Platform Expansion
- Mobile apps (React Native)
- Cloud sync (optional server)
- Social integration

## Documentation & Maintenance

### Core Documentation (Maintained)
- `codebase-summary.md` — High-level overview
- `system-architecture.md` — Technical design
- `code-standards.md` — Development conventions
- `project-overview-pdr.md` — This document
- `development-roadmap.md` — Phase status & milestones
- `project-changelog.md` — Change history

### Update Protocol
- Update docs after major feature completion
- Record breaking changes in changelog
- Maintain roadmap progress weekly
- Review architecture annually or after major refactors

## Sign-Off & Approval

**Project Lead**: [Role TBD]
**Tech Lead**: [Role TBD]
**QA Lead**: [Role TBD]

**Approval Date**: 2026-03-15
**PDR Version**: 1.0
**Last Updated**: 2026-03-15

---

## Appendix: Terminology

| Term | Definition |
|------|-----------|
| **Slot** | One of 3 independent save game slots in IndexedDB |
| **Envelope** | Serialized save package (gameState + metadata + version) |
| **Save Status** | State slice tracking auto-save progress (idle/saving/saved/error) |
| **Backup** | Shadow copy of save used for corruption recovery |
| **Upkeep** | Daily gold cost based on roster size + rooms |
| **Tick** | 1 game simulation step (~100ms in Web Worker) |
| **Party** | Selected group of 1-6 members for quest dispatch |
| **Tier** | Quest difficulty level (F/E/D/C/B/A/S) |
<!-- TODO: stale canon — factions are Linh Sơn / Đế Quốc / Thiên Lữ, not Human/Orc/Elf. See docs/lore/faction-bible-v2.md. -->
| **Civilization** | Hero faction (Human, Orc, Elf) with distinct traits |

## Appendix: API Reference (Internal)

### SaveManager
```typescript
class SaveManager {
  setActiveSlot(slotId: number): void
  getActiveSlot(): number | null
  async save(getState: () => Record<string, unknown>): Promise<void>
  async load(slotId: number): Promise<SaveEnvelope | null>
  async exportToFile(slotId: number): Promise<void>
  async importFromFile(file: File): Promise<ValidationResult>
  startAutoSave(getState: () => Record<string, unknown>): void
  stopAutoSave(): void
}
```

### Save Storage
```typescript
async function saveSlot(slotId: number, envelope: SaveEnvelope): Promise<void>
async function loadSlot(slotId: number): Promise<SaveEnvelope | null>
async function listSlots(): Promise<(SaveSlotMetadata | null)[]>
async function deleteSlot(slotId: number): Promise<void>
async function loadBackup(slotId: number): Promise<SaveEnvelope | null>
```

### Save Validation
```typescript
function isValidSaveEnvelope(data: unknown): data is SaveEnvelope
function validateAndMigrate(json: string): ValidationResult
```

### Active Slot Storage
```typescript
function getActiveSlotId(): number | null
function setActiveSlotId(slotId: number): void
function clearActiveSlotId(): void
```
