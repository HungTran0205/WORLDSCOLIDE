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

### Class Naming (BEM-like)
```css
/* Block */
.title-screen { }

/* Element */
.title-screen__logo { }
.title-screen__subtitle { }

/* Modifier */
.title-screen--loading { }
.title-btn--danger { }

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

/* Animations */
@keyframes fadeIn { }
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
