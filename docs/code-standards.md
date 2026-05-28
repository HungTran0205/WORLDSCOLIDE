# Code Standards & Conventions

## File Naming

### TypeScript/JavaScript Files
- **Format**: kebab-case with descriptive names
- **Examples**:
  - `save-manager.ts` — SaveManager class
  - `save-status-slice.ts` — Zustand slice for save status
  - `char-creation.tsx` — React component
  - `game-loop.ts` — Web Worker script
- **Rationale**: Self-documenting for LLM tools (Grep, Glob); easy to find files by function

### React Components
- **Files**: kebab-case (e.g., `title-screen.tsx`, `save-slot-card.tsx`)
- **Exports**: PascalCase (e.g., `export function TitleScreen()`)
- **Props Types**: `{ComponentName}Props` (e.g., `interface TitleScreenProps`)

### CSS Files
- **Format**: kebab-case, match component or feature area
- **Examples**:
  - `title-screen.css` — Title screen styles
  - `hud.css` — HUD overlay styles
  - `panels.css` — Panel container styles

### Test Files
- **Format**: Same as source file + `.test.ts` suffix
- **Example**: `save-validation.ts` → `save-validation.test.ts`

## Code Organization

### Directory Structure
```
src/
├── game/
│   ├── state/        # Zustand store + slices
│   ├── systems/      # Game logic (combat, economy, missions)
│   ├── data/         # Static data (enemies, missions, characters)
│   └── save/         # Save/load system
├── scene/            # React Three Fiber 3D components
├── ui/
│   ├── screens/      # Full-screen views (title, char creation)
│   ├── panels/       # Collapsible game panels
│   ├── hud/          # Heads-up display components
│   ├── components/   # Reusable UI components
│   └── styles/       # CSS files
├── audio/            # Howler.js audio manager
├── i18n/             # Localization (i18next)
└── main.tsx          # Entry point
```

### File Size Limits
- **Code files**: Keep under 200 lines for optimal context
- **Large files**: Split into focused, reusable modules
- **Documentation**: Keep markdown files under 800 lines (split into topic directories if needed)

### Import Organization
```typescript
// 1. External dependencies
import React, { useState } from 'react';
import { useGameStore } from '@/game/state/store';

// 2. Internal modules
import { saveManager } from '@/game/save/save-manager';
import { TitleScreen } from '@/ui/screens/title-screen';

// 3. Types/Interfaces
import type { SaveEnvelope } from '@/game/save/save-types';

// 4. Styles (last)
import '@/ui/styles/title-screen.css';
```

## TypeScript Conventions

### Type Definitions
```typescript
// Interfaces for objects
interface SaveEnvelope {
  version: number;
  gameState: Record<string, unknown>;
  metadata: SaveSlotMetadata;
}

// Type aliases for unions/primitives
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// Props types always end with "Props"
interface TitleScreenProps {
  onContinue: (slotId: number) => void;
  onNewGame: (slotId: number) => void;
  onDeleteSlot: (slotId: number) => void;
}
```

### Type Guards
- **Format**: `isValid{Type}()` predicate functions
- **Return**: boolean type predicate (`(x): x is Type`)
- **Usage**: Runtime validation without external libraries
- **Example**:
```typescript
export function isValidSaveEnvelope(data: unknown): data is SaveEnvelope {
  if (typeof data !== 'object' || !data) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.version === 'number' &&
    typeof obj.gameState === 'object' &&
    typeof obj.metadata === 'object'
  );
}
```

### Null/Undefined Handling
```typescript
// Prefer explicit nullability
let activeSlotId: number | null = null;

// Use optional chaining
const slotData = slots[selectedIdx]?.metadata;

// Use nullish coalescing for defaults
const slot = selectedSlot ?? getDefaultSlot();
```

## React Component Patterns

### Functional Components
```typescript
export interface MyComponentProps {
  title: string;
  onClick: () => void;
}

export function MyComponent({ title, onClick }: MyComponentProps) {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(c => c + 1);
    onClick();
  };

  return <button onClick={handleClick}>{title} ({count})</button>;
}
```

### Hooks Usage
- **Custom hooks**: Prefix with `use`, return values not JSX
- **Dependencies**: Always specify ESLint-compliant dependency arrays
- **Async in effects**: Wrap in function (don't use `async` directly)
```typescript
// Good
useEffect(() => {
  const load = async () => {
    const data = await fetchData();
    setState(data);
  };
  load();
}, []);

// Bad - don't do this
useEffect(async () => {
  const data = await fetchData();
}, []);
```

### Component Composition
- **Size**: Single responsibility — keep components focused
- **Props**: Pass only what's needed (avoid prop drilling)
- **Children**: Use `ReactNode` or `JSX.Element` for flexible composition

## State Management (Zustand)

### Store Structure
```typescript
import { create } from 'zustand';
import type { StateCreator } from 'zustand';

export interface MySlice {
  count: number;
  increment: () => void;
}

export const createMySlice: StateCreator<MySlice> = (set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
});
```

### Store Usage
```typescript
// In components
const count = useGameStore((state) => state.count);
const increment = useGameStore((state) => state.increment);

// In non-React code
const state = useGameStore.getState();
useGameStore.setState({ count: 0 });
```

### Slice Composition
```typescript
const useGameStore = create<Game & Guild & Roster & SaveStatus>((...args) => ({
  ...createGameSlice(...args),
  ...createGuildSlice(...args),
  ...createRosterSlice(...args),
  ...createSaveStatusSlice(...args),
}));
```

## Error Handling

### Try/Catch Pattern
```typescript
async function loadSave(slotId: number) {
  try {
    const envelope = await saveManager.load(slotId);
    if (!envelope) throw new Error('Save not found');
    return envelope;
  } catch (e) {
    setSaveStatus('error', (e as Error).message);
    return null;
  }
}
```

### Validation Errors
```typescript
interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: SaveEnvelope;
}

export function validateAndMigrate(json: string): ValidationResult {
  try {
    const parsed = JSON.parse(json);
    if (!isValidSaveEnvelope(parsed)) {
      return { valid: false, error: 'Invalid save format' };
    }
    return { valid: true, data: parsed };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}
```

## CSS Conventions

### Design Tokens System (v1.20 — HD-2D Ink Refresh)

All UI styling uses a centralized token system in `src/ui/styles/game-ui-tokens.css`. **All new tokens must use the `--ink-*` prefix.**

#### Core Token Categories

**Colors:**
- **Surfaces**: `--ink-bg`, `--ink-bg-deep`, `--ink-bg-panel`, `--ink-bg-panel-alt`, `--ink-bg-hover`, `--ink-bg-selected`
- **Text**: `--ink-text`, `--ink-text-dim`, `--ink-text-muted`
- **Status**: `--ink-status-ok`, `--ink-status-warn`, `--ink-status-bad`
- **Accents**: `--ink-gold`, `--ink-gold-dim`, `--ink-gold-bright`, `--ink-amber`
- **Bars**: `--ink-hp-from`, `--ink-hp-to`, `--ink-exp-from`, `--ink-exp-to`
- **Rank Palette** (6 ranks): `--ink-rank-recruit`, `--ink-rank-member`, `--ink-rank-veteran`, `--ink-rank-officer`, `--ink-rank-commander`, `--ink-rank-mercenary`
- **Quest Tier Palette** (7 tiers): `--ink-tier-f` through `--ink-tier-s`
- **Combat Log Accents**: `--ink-log-skill`, `--ink-log-dodge`, `--ink-log-heal`, `--ink-log-zone`
- **Wood Theme** (InventoryPanel): `--ink-wood-edge`, `--ink-wood-edge-light`, `--ink-wood-edge-dark`, `--ink-wood-fill-from`, `--ink-wood-fill-to`, `--ink-stud-bright`, `--ink-stud-mid`

**Typography:**
- **Fonts**: `--ink-font-title` (Cinzel), `--ink-font-body` (IM Fell English), `--ink-font-mono` (Share Tech Mono), `--ink-font-ui` (Segoe UI, sans-serif)
- **Type Scale** (8 levels, rem-based): `--ink-fs-display`, `--ink-fs-h1`, `--ink-fs-h2`, `--ink-fs-body`, `--ink-fs-small`, `--ink-fs-meta`, `--ink-fs-label`, `--ink-fs-tiny`

**Spacing & Layout:**
- **Spacing Scale** (6 steps, 4px base): `--ink-space-1` (4px) through `--ink-space-6` (24px)
- **Radii**: `--ink-radius-sm` (2px), `--ink-radius-md` (4px), `--ink-radius-lg` (8px), `--ink-radius-chest` (12px)

**Effects:**
- **Shadows**: `--ink-shadow-deep`, `--ink-shadow-panel`
- **Glows**: `--ink-glow-gold`, `--ink-glow-bright`
- **Durations**: `--ink-dur-fast` (120ms), `--ink-dur-tab` (150ms), `--ink-dur-panel` (200ms), `--ink-dur-bar` (300ms)

#### Typography Utility Classes

New file: `src/ui/styles/typography.css` — 9 semantic type classes:
- `.ink-display` — Main title (3rem, bright gold)
- `.ink-h1`, `.ink-h2` — Section headings
- `.ink-section-title` — Subsection label
- `.ink-body` — Body text (0.9rem, normal color)
- `.ink-small`, `.ink-stat` — Smaller text (stats, metadata)
- `.ink-label` — UI labels (monospace, uppercase)
- `.ink-tiny` — Smallest text (0.5rem)

#### Component Token Usage

Components must reference tokens, not hardcoded colors:
```css
.my-component {
  background: var(--ink-bg-panel);     /* ✓ Good */
  color: var(--ink-text);               /* ✓ Good */
  border-color: var(--ink-gold);        /* ✓ Good */
  
  background: #1a1326;                  /* ✗ Bad */
  color: #f0e6d3;                       /* ✗ Bad */
}
```

#### Responsive Token Scaling

The `--ui-scale` token auto-scales panels at breakpoints. **CSS Transform**: Media queries adjust --ui-scale (1, 0.9, 0.75, 0.5). Use `rem` for type sizes so scale doesn't double-apply; use `px` for borders and spacing.

```css
/* ✓ Correct — uses rem for type, px for layout */
.my-label { font-size: var(--ink-fs-label); padding: var(--ink-space-2); }

/* ✗ Wrong — would double-scale type */
.my-label { font-size: 0.62rem * var(--ui-scale); }
```

#### Accessibility & Motion

All new animations must respect `prefers-reduced-motion`:
```css
@keyframes slide { from { opacity: 0; } to { opacity: 1; } }
.panel { animation: slide 200ms; }

@media (prefers-reduced-motion: reduce) {
  .panel { animation: none; }
}
```

### Class Naming (BEM-like)
```css
/* Block */
.title-screen { }

/* Element */
.title-screen__logo { }
.title-screen__subtitle { }

/* Modifier (may reference tokens) */
.title-screen--loading { }
.member-card--recruit { --rank-color: var(--ink-rank-recruit); }

/* State */
.title-btn:disabled { }
.title-btn:hover { }
```

### File Organization
```css
/* Variables & resets */
:root {
  --color-primary: #333;
  --color-danger: #e74c3c;
  --spacing-sm: 8px;
}

/* Layout */
.title-screen {
  display: grid;
  gap: var(--spacing-sm);
}

/* Components */
.title-btn { }
.title-btn--danger { }
.title-btn:disabled { }

/* Animations (with prefers-reduced-motion guard) */
@keyframes fadeIn { }
@media (prefers-reduced-motion: reduce) { .fade { animation: none; } }
```

## Testing Conventions

### Unit Tests (Vitest)
```typescript
import { describe, it, expect } from 'vitest';
import { isValidSaveEnvelope } from './save-validation';

describe('save-validation', () => {
  it('validates correct save envelope', () => {
    const envelope = {
      version: 1,
      gameState: {},
      metadata: { /* ... */ },
    };
    expect(isValidSaveEnvelope(envelope)).toBe(true);
  });

  it('rejects invalid envelope', () => {
    expect(isValidSaveEnvelope(null)).toBe(false);
    expect(isValidSaveEnvelope({ version: 'x' })).toBe(false);
  });
});
```

### Test File Structure
- **Arrange**: Set up test data
- **Act**: Call function or render component
- **Assert**: Verify results
```typescript
it('saves game state to slot', async () => {
  // Arrange
  const slotId = 1;
  const gameData = createTestGameState();
  const envelope = createSaveEnvelope(slotId, gameData);

  // Act
  await saveSlot(slotId, envelope);

  // Assert
  const loaded = await loadSlot(slotId);
  expect(loaded).toEqual(envelope);
});
```

## Comments & Documentation

### Code Comments
- **Use sparingly**: Self-documenting code is preferred
- **Why over what**: Explain reasoning, not just what code does
- **Complex logic**: Comment non-obvious algorithms
```typescript
// Good - explains intent
// Debounce saves to avoid hammering IndexedDB
const now = Date.now();
if (now - this.lastSaveTime < SAVE_DEBOUNCE_MS) return;

// Bad - just restates code
// Set the save status to saving
setSaveStatus('saving');
```

### File Headers
```typescript
/**
 * SaveManager — orchestrates save/load/export/import with multi-slot storage.
 * Uses IndexedDB via save-storage, validates via save-validation,
 * reports status via Zustand save-status slice.
 */
```

### Function/Method Documentation
```typescript
/**
 * Save current store state to active slot
 * @param getState - Function returning current game store state
 * @throws Error if active slot not set or save fails
 */
async save(getState: () => Record<string, unknown>): Promise<void> {
  // implementation
}
```

## Linting & Code Quality

### ESLint Configuration
- **Parser**: TypeScript
- **Rules**: Enforce type safety, React best practices
- **Hooks**: Require proper dependency arrays
- **Prefer const/let**: No var declarations

### Pre-commit Checks
- Run `npm run lint` before committing
- Fix warnings where practical
- Document any necessary disables with comments
```typescript
// eslint-disable-next-line react-hooks/set-state-in-effect
// Async data fetch on mount is standard pattern
useEffect(() => { refreshSlots(); }, [refreshSlots]);
```

## Async/Await Patterns

### Promise-Based APIs
```typescript
// Save operation returns promise
async function save(getState: () => Record<string, unknown>): Promise<void> {
  const envelope = createSaveEnvelope(/* ... */);
  await saveSlot(activeSlotId, envelope);
}

// Usage with await
const envelope = await saveManager.load(slotId);
if (!envelope) return;
```

### Chaining Promises (When Needed)
```typescript
// Load primary, fall back to backup
let envelope = await saveManager.load(slotId);
if (!envelope) {
  const backup = await loadBackup(slotId);
  if (backup && isValidSaveEnvelope(backup)) {
    await saveSlot(slotId, backup);
    envelope = backup;
  }
}
```

## Internationalization (i18n)

### Translation Keys
- **Format**: dot-notation, hierarchical
- **Examples**:
  - `title.logo` → "Worlds Collide"
  - `title.continue` → "Continue"
  - `title.newGame` → "New Game"
  - `title.delete` → "Delete Save"

### Usage in Components
```typescript
import { useTranslation } from 'i18next';

export function TitleScreen() {
  const { t } = useTranslation();

  return (
    <>
      <div>{t('title.logo')}</div>
      <button>{t('title.continue')}</button>
    </>
  );
}
```

### Adding Translations
1. Add key to `src/i18n/vi.json`
2. Use `t('key')` in component
3. Wrap dynamic strings: `t('key', { value })`

## Constants & Configuration

### Location
- Game constants: `src/game/systems/*.ts` (near usage)
- UI constants: `src/ui/hud/panel-toggle.ts` or component file
- Global constants: `src/game/constants.ts` (if used widely)

### Naming
```typescript
// All caps, snake_case
const AUTO_SAVE_INTERVAL = 60_000; // 60 seconds
const SAVE_DEBOUNCE_MS = 5_000;
const MAX_ROSTER_SIZE = 50;
```

## Inventory & Equipment Patterns (v1.20)

### Unified Slot Entry (Discriminated Union)

The inventory grid uses a discriminated union pattern to handle both regular items and equipment instances uniformly:

```typescript
// Type definition in inventory-slice.ts
type UnifiedSlotEntry =
  | { kind: 'item'; itemId: ItemID; quantity: number }
  | { kind: 'equipment'; item: EquipmentItem; templateId: EquipmentTemplateId };

// Usage in UI — type-safe narrowing
const entries: UnifiedSlotEntry[] = [
  { kind: 'item', itemId: 'WOOD', quantity: 50 },
  { kind: 'equipment', item: { id: '123', templateId: 'IRON_SWORD', durability: 100 }, templateId: 'IRON_SWORD' },
];

entries.forEach(entry => {
  if (entry.kind === 'item') {
    // TypeScript narrows to { kind: 'item'; itemId; quantity }
    console.log(entry.itemId, entry.quantity);
  } else {
    // TypeScript narrows to { kind: 'equipment'; item; templateId }
    console.log(entry.item.templateId, entry.item.durability);
  }
});
```

**Benefits:**
- Type-safe narrowing with `kind` discriminator
- Single slot-rendering component handles both item and equipment
- No null checks — union covers all valid cases
- Extensible for future slot types (recipes, quest items, etc.)

### Inventory State Structure

```typescript
interface InventoryState {
  items: Partial<Record<ItemID, number>>;          // Quantity map
  equipmentInventory?: EquipmentItem[];            // Unequipped equipment
  categoryCapacity?: Partial<Record<InventoryCategory, number>>;  // Per-category overrides
}

interface EquipmentItem {
  id: string;              // Unique instance ID (uuid)
  templateId: EquipmentTemplateId;
  durability: number;      // Current durability (0 = broken, no bonus)
}

type InventoryCategory = 'material' | 'consumable' | 'weapon' | 'armor';
```

**Save Compatibility:** Old saves without `categoryCapacity` load with defaults (30 per category).

### Equipment Template Rarity

All equipment must define a rarity tier (used for UI filtering and sorting):

```typescript
interface EquipmentTemplate {
  id: EquipmentTemplateId;
  name: string;
  slot: EquipmentSlot;
  rarity: ItemRarity;  // COMMON | UNCOMMON | RARE | EPIC | LEGENDARY (REQUIRED)
  damage?: number;
  hp?: number;
  // ... other fields
}

// Usage: filter equipment by rarity
const rareEquipment = equipmentItems.filter(eq => {
  const template = EQUIPMENT_DATABASE[eq.templateId];
  return template.rarity === 'RARE' || template.rarity === 'EPIC';
});
```

### Per-Category Slot System

Inventory capacity is now managed per category (weapon, armor, material, consumable) instead of global:

```typescript
// Constants in inventory-slice.ts
export const CATEGORY_DEFAULT_SLOTS = 30;
export const SLOT_EXPANSION_AMOUNT = 10;

// Get current capacity for a category
function getCategoryMaxSlots(
  category: InventoryCategory,
  capacity?: Partial<Record<InventoryCategory, number>>
): number {
  return capacity?.[category] ?? CATEGORY_DEFAULT_SLOTS;  // Defaults to 30
}

// Check used slots (items split at stack limit 99)
function getUsedSlots(
  items: Partial<Record<ItemID, number>>,
  equipmentItems: EquipmentItem[] = []
): number {
  let used = 0;
  for (const [id, qty] of Object.entries(items)) {
    if (!qty || qty <= 0) continue;
    const template = ITEM_DATABASE[id as ItemID];
    // Stackable items: split into chunks of 99
    used += template?.stackable ? Math.ceil(qty / 99) : qty;  // Non-stackable = 1 slot each
  }
  return used + equipmentItems.length;  // Equipment = 1 slot each
}

// Expand capacity (Zustand action)
expandCategorySlots: (category, amount) => {
  set((s) => {
    const current = s.inventory.categoryCapacity?.[category] ?? CATEGORY_DEFAULT_SLOTS;
    const next = Math.min(current + amount, 200);  // Cap at 200
    return {
      inventory: {
        ...s.inventory,
        categoryCapacity: { ...s.inventory.categoryCapacity, [category]: next },
      },
    };
  });
}
```

**Expansion Costs** (defined in inventory-slice.ts):
```typescript
export const SLOT_EXPANSION_COSTS: Record<string, Partial<Record<ItemID, number>>> = {
  tier1: { WOOD: 20, STONE: 10 },
  tier2: { IRON_ORE: 10, GEM: 2 },
};
```

## Sprite Animation Conventions

### Walking Animation Directory Structure
```
public/sprites/characters/
├── LS-warrior-male/
│   └── animations/
│       └── walking-8-frames/
│           ├── east/
│           │   ├── frame_000.png
│           │   ├── frame_001.png
│           │   ...
│           │   └── frame_007.png
│           ├── north/
│           ├── south/
│           └── west/
├── DQ-rogue-female/
├── TL-mage-male/
└── ...
```

### Woodcutting Animation Directory Structure (NEW - v1.18)
```
public/sprites/characters/
├── LS-woodcutter-male/
│   └── animations/
│       └── woodcutting-8-frames/
│           ├── east/
│           │   ├── frame_000.png to frame_007.png
│           ├── north/
│           ├── south/
│           └── west/
```

### Naming Conventions
- **Civilization Prefix**: TS (ThienLu), DQ (DeQuoc), TL (LinhSon) — matches character database
- **Archetype**: warrior, rogue, mage, ranger, paladin, bard, etc. (lowercase)
- **Occupational**: woodcutter, stonecutter, smith (for craft skill animations)
- **Gender**: male / female
- **Animation Type**: walking-8-frames / woodcutting-8-frames / idle
- **Direction**: east, north, south, west (matches 4-directional camera)
- **Frame Count**: Always 8 frames per direction (frame_000 to frame_007)
- **Frame Rate**: 10fps for walking, 8fps for occupational (125ms per frame)

### Sprite Resolution
- **Standard**: 64×64 pixels per frame (CanvasTexture compatible)
- **Fallback**: Graceful degradation to idle sprite if direction unavailable

## 3D Facility Props Conventions (NEW - v1.18)

### GLB Asset Paths
```
public/arena/forest/3dprops/optimized/
├── p_tree_large.glb
├── p_tree_pine.glb
├── p_stump.glb
├── p_bush.glb
└── ... (other prop models)
```

### Prop Component Pattern
```typescript
// All 3D props follow auto-scaling pattern
<ForestProp
  model={models.p_tree_large}
  position={[x, y, z]}
  targetHeight={2.5}  // Auto-scales GLB to this height
  rotation={[0, angleY, 0]}
/>
```

### Auto-Scaling Logic
- **Input**: GLB model, desired `targetHeight`
- **Calculation**: Measure model's bounding box, compute scale factor
- **Output**: Uniformly scaled mesh preserving proportions
- **Benefit**: Single asset can be reused at different sizes

### Facility Slot Position Convention (NEW - v1.18)
```typescript
// src/game/data/facility-slot-positions.ts
const LOGGING_SITE_SLOTS = [
  { x: -1, z: 1 },   // Slot 0 (primary worker)
  { x: 1, z: 1 },    // Slot 1
  { x: -1, z: -1 },  // Slot 2
  { x: 1, z: -1 },   // Slot 3
];

// Used by room-member-sprites.tsx to position sprites at fixed chop spots
```

## Floor Rendering Pattern (NEW - v1.27.7)

All floor surfaces (combat ground, guild hall, facility rooms) MUST use the shared `<TiledFloor>` component from `src/scene/sprites/tiled-floor.tsx`. **Do not** create new procedural canvas floor textures or clone GLB tile models for floor rendering — extend `<TiledFloor>` if a feature is missing.

### Asset Locations
- `public/tiles/2d/32px/` — 4 themes (cave, deep-forest-grass, forest-grass-32, paving-stone-32)
- `public/tiles/2d/64px/` — ruined-paving-stone, ruined-village, wood-guild-floor, stone-64, wooden-floor-64
- `public/tiles/2d/128px/` — wooden-floor-128
- Each biome ships **4–5 curated variants** for multi-variant blend (curated 2026-05-10, was 6–18)

### Biome Palette (source of truth)

| Biome | Px | Primary | Variants | World size | Recommended mode |
|-------|----|---------|----------|------------|------------------|
| `cave` | 32 | `cave_0001` | `0002..0005` | 1 | single (`cave_0001`) for stone-quarry; mosaic for narrative caves |
| `deep-forest-grass` | 32 | `deep-forest-grass_0003` | `0001, 0002, 0004, 0005` | 1 | mosaic |
| `forest-grass-32` | 32 | `forest-grass-32_0003` | `0001, 0002, 0004, 0005` | 1 | mosaic (logging-site) |
| `paving-stone-32` | 32 | `paving-stone-32_0001` | `0002..0005` | 1 | single (per facility) |
| `ruined-paving-stone` | 64 | `ruined-paving-stone_0001` | `0002, 0003, 0004` | 1 | mosaic |
| `ruined-village` | 64 | `ruined-village_0002` | `0001, 0003, 0004` | 1 | mosaic (combat — `lolo-village-outskirt`) |
| `stone-64` | 64 | `stone-64_0001` | `0002, 0003, 0004` | 1 | single (workshop) or mosaic |
| `wood-guild-floor` | 64 | `wood-guild-floor_0005` | `0001, 0002, 0003, 0004` | 2 | mosaic (guild hall, alchemy) |
| `wooden-floor-64` | 64 | `wooden-floor-64_0001` | `0002..0005` | 1 | mosaic |
| `wooden-floor-128` | 128 | `wooden-floor-128_0001` | `0002, 0003, 0004` | 2 | mosaic |

Decal companions (Phase 01): `32px/dirt-base_0001`, `32px/grass-edge_0001`, `64px/wood-plank_0001`, `64px/cracked-stone-wall_0001` — overlay via `<FloorDecal>`, never as base tile.

**Rules**:
- Adding a 6th variant requires removing one first (keep palette ≤5/biome). Visual diversity comes from `<FloorDecal>` overlays, not base-tile inflation.
- New consumers MUST pick from this table — no `_0006+` references.
- Filename annotation `_0001` = primary by convention; pick the most uniform tone as `_0001` when authoring new biomes.

### Component API
```typescript
import { TiledFloor, type TileTextureSpec } from '@/scene/sprites/tiled-floor';

// Single tile (uniform repeat)
<TiledFloor width={32} depth={12} tileTexture="/tiles/2d/32px/forest-grass-32_0001.png" />

// Multi-variant (random per cell from main + variants)
<TiledFloor
  width={7}
  depth={7}
  tileTexture={{
    main: '/tiles/2d/32px/forest-grass-32_0003.png',
    variants: ['/tiles/2d/32px/forest-grass-32_0001.png', /* ... */],
    variantChance: 0.3,  // optional, default 0.5
  }}
  tileWorldSize={1}
  position={[cx, 0.01, cz]}
/>
```

### Conventions
- **Tile world size**: default `1` world unit = `1` tile cell. Override per scene via `tileWorldSize` prop (e.g. `2` for guild hall wood plank to match isometric scale)
- **Filtering**: `NearestFilter` mag/min for pixel-art crispness — do not use linear filtering on tile textures
- **Material** (Phase 07 update): `meshLambertMaterial` + `emissiveMap=tex` — sàn react với scene pointLight/ambientLight nhưng giữ pixel-art tone qua `emissiveIntensity` (0.55-0.85). Opt-out qua `lighting='unlit'` prop (legacy `meshBasicMaterial`) khi scene cần tonal control tuyệt đối (e.g. combat bg layers).
- **emissiveIntensity tuning**: `0.55-0.65` cho phòng nhiều torch (alchemy, guild hall pool); `0.7` default (standard facility); `0.8-0.9` ambient-only / outdoor
- **Mipmaps**: enabled with `NearestMipmapNearestFilter` to avoid distance aliasing
- **Y-offset**: typical floor at `y=0` or `y=0.01` to clear `<ZoneFloorMarker>` overlay z-fight
- **Coordinates**: floors that share scene with walls/props use `position={[cx, 0, cz]}` to center plane on facility origin

### Forbidden Patterns
- ❌ Procedural canvas texture in scene component (use authored PNG)
- ❌ `useGLTF('/tiles/...glb')` cloned per cell as floor (use single `<TiledFloor>` plane + tile repeat)
- ❌ Solid `meshStandardMaterial color="#hex"` plane as room floor (use a biome tile from the asset bank)
- ❌ Custom tile renderer in a scene file — extend the shared component instead

### Migration Reference
Plan: `plans/260509-1253-standard-tile-floor-system/` — replaces 4 prior floor patterns with this single primitive across combat scene + guild hall + facility rooms.

## Floor Decal Atmospheric Overlay (NEW — Phase 07)

`<FloorDecal>` (`src/scene/sprites/floor-decal.tsx`) is the standard primitive for static atmospheric spot accents on top of `<TiledFloor>`: lamp pools, magic runes, place-holding glyphs. Pure overlay — **does not** react to lighting (intentional — decal already fakes a lit hot-spot).

### Component API
```typescript
import { FloorDecal } from '@/scene/sprites/floor-decal';

<FloorDecal
  position={[cx, 0, cz]}        // XZ world (Y is auto-offset)
  size={[2, 2]}                 // world units [w, d]
  texture="/decals/floor/lamp-pool.png"
  rotation={0}                  // optional, radians
  color="#ffd66a"               // optional tint multiplier
  opacity={1}                   // optional 0-1
  yOffset={0.01}                // optional, default clears TiledFloor
  renderOrder={undefined}       // optional, for stacking control
/>
```

### Conventions
- **Material**: `meshBasicMaterial transparent depthWrite=false` — overlay-on-overlay stays additive without z-fight
- **Filtering**: `NearestFilter` (no mipmaps) — decal is a single instance, mipmap saves no perf
- **Wrap**: `ClampToEdgeWrapping` (single instance, never repeats)
- **alphaTest**: `0.05` baked-in — clips soft edges to prevent halo from premultiplied/JPEG-like compression artifacts
- **yOffset**: default `0.01` — clears `<TiledFloor>` (`y=0` or `y=0.01`); raise to `0.05` if z-fight visible at distance
- **Surface restriction**: flat horizontal floor only. Do **not** use on GLB walls / sloped terrain — out of scope (use Three.js `DecalGeometry` for that, separate concern)

### Decal Asset Authoring
- **Location**: `public/decals/floor/`
- **Format**: PNG with **straight alpha** (NOT premultiplied) — premultiplied → halo at `alphaTest=0.05` cutoff
- **Aspect**: square preferred (1:1)
- **Size budget**: ≤256×256 for hot-spot decoration (lamp pool, rune); 128×128 acceptable for small accents
- **Color authoring**: bake the desired tint into the PNG; use `color` prop only for runtime scaling (e.g. faction tinting)
- **Transparency falloff**: smooth radial gradient or hard ring — soft edges OK due to `alphaTest=0.05` clip

### Use Cases (current — Phase 07 PoC)
- **Lamp pool** (`/decals/floor/lamp-pool.png`, 256×256, warm yellow radial): mounted under each `<WallTorch>` in guild hall via `<GuildHallProps>`
- **Magic rune circle** (`/decals/floor/magic-rune-circle.png`, 256×256, purple ring + ticks): mounted under alchemy reactor in `<AlchemyLabFurniture>`

### Forbidden Patterns
- ❌ Custom transparent plane mesh inline in scene component — use `<FloorDecal>`
- ❌ `<FloorDecal>` on non-flat surface (walls, slopes) — out of scope
- ❌ Premultiplied-alpha PNG — causes halo at alphaTest cutoff
- ❌ `meshLambertMaterial` for decal — defeats the "fake lit hot-spot" purpose; decal would dim in shadow

### Migration Reference
Plan: `plans/260509-1253-standard-tile-floor-system/phase-07-floor-decal-atmospheric.md` — Part B introduces `<FloorDecal>` alongside Part A `<TiledFloor>` lambert+emissive upgrade.

## Combat AOE Telegraph (NEW — Phase 08)

`<AoeTelegraph>` (`src/scene/sprites/aoe-telegraph.tsx`) extends `<FloorDecal>` with a 3-phase animated lifecycle for combat skill cast indicators (danger zones). `<CombatAoeLayer>` (`src/scene/combat/combat-aoe-layer.tsx`) is the engine→React subscriber that mounts telegraphs from `aoe-telegraph` events.

### Pipeline
1. Skill defines AOE metadata (`Skill.aoeRadius`, `aoeShape`, `aoeCastTimeMs?`, `aoeColor?`)
2. `CombatEngine.trySkill()` emits `{ type: 'aoe-telegraph', position, radius, shape, durationMs, color }` into `eventQueue`
3. `combat-fight-controller.tsx` flushes events into Zustand `recentEvents` via `syncArenaState`
4. `<CombatAoeLayer>` (mounted in `<CombatSceneShell>` between shadow + entity layers) detects the new event array and spawns one `<AoeTelegraph>` per event
5. `<AoeTelegraph>` runs spawn → pulse → lock animation via `useFrame` (mutates material.opacity directly, no React rerender per frame)
6. After `durationMs`, `onComplete` fires once → CombatAoeLayer removes the entry

### Conventions
- **Damage timing**: Phase 08 v1 is **cosmetic only** — engine still applies damage instantly. Telegraph plays alongside skill animation. Future phase may gate damage on telegraph completion.
- **Color default**: red `#ff5a5a` (danger). Override via `Skill.aoeColor` (e.g. blue `#5a9bff` for explicit beneficial-zone heal AOE). Do NOT default-color by caster faction — an ally offensive AOE is still red danger to the eye.
- **Duration clamp**: `MIN_TOTAL_MS = 350` (spawn 100 + lock 200 + pulse 50). Pathologically short `aoeCastTimeMs` is silently raised so all 3 phases get a slice.
- **Concurrency**: same-tick multi-emit is rare under current sequential-actor lock, but the layer handles N spawns per tick. Each instance keys on `${attackerId}-${skillId}-${Date.now()}-${counter}` for collision-free remount.
- **Lifecycle gates**: subscriber checks `prevEventsRef === recentEvents` (skip Suspense replays) AND `arenaPhase === 'fighting'` (skip prep / result replay of stale events). Active telegraphs are dropped on phase change so panel close → reopen does not orphan visuals.
- **Render order**: `renderOrder=5` on telegraph; below sprite render order. Mount order in shell: ground → shadow → AOE layer → entity layer → foreground.

### AOE Decal Assets
- **Location**: `public/decals/floor/aoe-{circle,cone,rect}.png`
- **Generator**: `scripts/generate_aoe_decals.py` (256×256, straight alpha, white shape borders + faint crosshatch fill so the runtime `color` prop tints freely)
- **Authoring**: keep PNG color near white — final hue is set per-event via material `color` (engine sends red/blue hex)
- **Adding a new shape**: add the literal to `AoeShape` (in `combat-types.ts`), add a texture entry in `SHAPE_TEXTURES` (in `aoe-telegraph.tsx`), drop a matching PNG in `public/decals/floor/`. Engine emit + layer handles it transparently.

### Skill Schema Extension
```typescript
interface Skill {
  // ... existing fields ...
  aoeRadius?: number;       // world units; 0/undefined = no telegraph (single-target skill)
  aoeShape?: AoeShape;       // default 'circle' when aoeRadius set
  aoeCastTimeMs?: number;    // default 600 (engine ANIM_ATTACK_DURATION); minimum 350 (clamped)
  aoeColor?: string;         // hex; default '#ff5a5a'
}
```
Pure additive — no save migration. Existing skills without these fields produce no telegraph (`aoeRadius` falsy → emit guard fails).

### Forbidden Patterns
- ❌ Default ally telegraphs to blue — color encodes "danger vs benefit", not "us vs them"
- ❌ React state-driven opacity per frame — mutate `material.opacity` via `useFrame` ref
- ❌ Telegraph on non-flat surface — same restriction as `<FloorDecal>` parent
- ❌ Skipping the `prevEventsRef` guard in any new event-array subscriber on `recentEvents` — Suspense replays will dupe-spawn

### Migration Reference
Plan: `plans/260509-1253-standard-tile-floor-system/phase-08-floor-decal-aoe-telegraph.md` — Phase 08 final phase, builds on Phase 07 `<FloorDecal>` foundation.

## Combat Stage Specification (NEW — Phase 03+ Platformer DSL)

Stages are now defined via typed pure-data specs rather than hardcoded global positions. See [`gdd/06-combat.md`](./gdd/06-combat.md) for full authoring guide covering:
- Type hierarchy (CombatStageSpec, PlatformSpec, SpawnSlot, DecalPlacement, DecalDensitySpec)
- Render flow (data projection → platform rendering → spawn anchor reading)
- Decal patterns (manual vs scatter; anti-pattern warnings)
- Y-axis spatial extension (Phase 05+)
- Concrete examples and registration workflow

**Quick ref**: Stage specs live at `src/scene/combat/maps/stages/{stage-id}.ts`; registered in `combat-map-registry.ts`.

## Version Control

### Commit Messages
- **Format**: Conventional Commits (feat, fix, docs, refactor, test, chore)
- **No AI references**: Skip "AI-generated", "Claude", etc.
- **Focused**: One concern per commit
```
feat: add multi-slot save system with IndexedDB
fix: handle corrupted save recovery from backup
docs: update architecture documentation
```

## Performance Best Practices

### Rendering
- **Memoization**: Use `React.memo()` for expensive components
- **Callbacks**: Wrap with `useCallback()` if passed as prop
- **Keys**: Always provide stable keys in lists
```typescript
{slots.map((meta, idx) => (
  <SaveSlotCard
    key={idx}  // Use stable ID if available
    metadata={meta}
  />
))}
```

### State Updates
- **Immutability**: Never mutate state directly
- **Batching**: Multiple setState calls batch automatically (React 18+)
- **Selectors**: Use Zustand selectors to minimize re-renders
```typescript
// Good - only re-renders when saveStatus changes
const saveStatus = useGameStore((state) => state.saveStatus);

// Bad - re-renders on any store change
const { saveStatus } = useGameStore();
```

### Async Operations
- **No block**: Async calls should never block UI
- **Status tracking**: Use save-status slice for user feedback
- **Cleanup**: Always clean up timers and event listeners
```typescript
useEffect(() => {
  const timer = setInterval(() => save(), 60000);
  return () => clearInterval(timer); // Cleanup
}, []);
```

## Accessibility (A11y)

### Semantic HTML
```typescript
// Good
<button onClick={handleContinue}>Continue</button>

// Bad
<div onClick={handleContinue}>Continue</div>
```

### Keyboard Navigation
- Buttons must be focusable and activatable with Enter/Space
- Use `disabled` attribute for disabled buttons
- Tab order should be logical

### Color & Contrast
- Don't rely on color alone for information
- Danger buttons: Use both red color + clear label
- Status indicators: Use icons + text

## Security Practices

### Input Validation
- Validate all imported JSON before trusting
- Use type guards, never skip validation
- Sanitize user-provided file data

### No Hardcoded Secrets
- Never commit API keys, credentials, passwords
- Use environment variables for configuration
- `.env` should not be in version control

### Data Handling
- Only store necessary game state
- No sensitive player information
- Clear data on logout (return to title)
