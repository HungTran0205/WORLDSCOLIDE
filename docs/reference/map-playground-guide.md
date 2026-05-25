# Map Playground Tool (WC-MAPMAKER)

Visual combat arena map editor. Replaces manual number-tweaking in `arena-biome-config.ts` with intuitive click-to-place workflow.

**Status**: Phases 1–10 complete. Production-ready.

**Location**: `tools/map-playground/`

## Quick Start

```bash
# From project root
npm run map              # Dev server on http://localhost:5175

# Or from tools/map-playground
cd tools/map-playground && npm run dev
```

## Workflow

1. Launch editor (`npm run map`)
2. Select 3D prop/background/VFX effect from left panel
3. Click in viewport to place (ghost preview shows placement)
4. Adjust position/scale/rotation via right panel sliders
5. Click "Generate TS" → BiomeConfig copied to clipboard
6. Paste into `src/scene/arena-biome-config.ts`
7. Run main game (`npm run dev`) — see changes live

## Tech Stack

- **Vite 8** — Build tool
- **React 19** — UI framework
- **TypeScript 5** — Type safety
- **@react-three/fiber (R3F)** — 3D rendering
- **Zustand 5** — Scene state management
- **Leva 1** — Reactive lighting debug panel
- **r3f-vfx** — Atmospheric particle effects

## Architecture

### Dev Server
- **Port**: 5175 (separate from main game at 5173)
- **Custom Vite Plugin**:
  - `/api/asset-manifest` — Asset listing (props, BG layers, VFX effects)
  - `/game-assets/*` — Game assets from main project `public/` folder
  - Enables cross-origin asset loading

### Layout
- **Left Column** (260px): Asset browser (filterable by type)
- **Center Canvas** (flex): R3F viewport + scene list + code preview
- **Right Column** (300px): Properties panel (transform sliders)
- **Floating Panel**: Leva lighting debug controls

## Features

### Viewport & Placement (Phase 1–2)
- Orthogonal isometric camera for combat arena view
- Floor raycaster for accurate click-to-place
- Ghost preview (green=valid, red=collision)
- Keyboard shortcuts:
  - **Esc** — Cancel placement
  - **Delete/Backspace** — Remove selected
  - **Ctrl+Z/Cmd+Z** — Undo
  - **Ctrl+Y/Cmd+Y** or **Ctrl+Shift+Z** — Redo
  - **Ctrl+D/Cmd+D** — Duplicate selected

### Asset Browser (Phase 3–5)
- **3D Props**: GLB models with metadata
- **Backgrounds**: PNG parallax layers (z-depth, y-offset, scale, opacity)
- **VFX Effects**: Preset particle systems
  - fog-mist (cool atmosphere)
  - cave-ember (glowing particles)
  - forest-spore (nature effects)
  - dust-motes (floating dust)
- Search/filter by asset name
- Selectable categories (Props, Backgrounds, Effects)

### Properties Panel (Phase 6–7)
- **Position**: X, Y, Z sliders with real-time preview
- **Rotation**: Euler angles (x, y, z in degrees)
- **Scale**: Single or per-axis control
- **Live Editing**: Slider drags update viewport instantly
- **History**: Release slider to commit; drag operations don't fill undo stack

### Code Generation (Phase 8–9)
- **Generate BiomeConfig**: Exports TypeScript constant
  - props3D array (src, position, rotation, scale)
  - bgLayers array (src, z, y, scale, opacity)
  - atmosphericVFX array (effectId, position, scale)
  - lighting config (ambient, directional, fog, vignette)
- **Copy to Clipboard**: Single-click export
- **Undo/Redo**: 50-frame immutable history

### UI Polish (Phase 10)
- **Scene Objects List**: Hierarchical view of all placed objects
- **Code Preview Panel**: Shows generated TypeScript before copy
- **Selection Highlighting**: Selected objects glow in viewport
- **Keyboard Help**: Inline hints for common shortcuts

## Code Generation Example

**Input**: Placed 3D props, backgrounds, VFX, lighting in editor

**Output**: BiomeConfig ready to paste

```typescript
export const FOREST_CONFIG: BiomeConfig = {
  biome: 'forest',
  groundColor: '#3a5a2a',
  bgLayers: [
    { src: '/arena/forest/bg/far.png', z: -8.1, y: 6.5, scale: 2.45, opacity: 0.09 },
  ],
  props: [],
  props3D: [
    { src: '/arena/forest/3dprops/p_standing_torch.glb', position: [2, 0, -1], scale: 0.8, rotation: [0, 0.5, 0] },
    { src: '/arena/forest/3dprops/p_tree.glb', position: [-3, 0, -2], scale: 1.2 },
  ],
  atmosphericVFX: [
    { effectId: 'fog-mist', position: [0, 1, -2], scale: 1.2 },
    { effectId: 'dust-motes', position: [3, 0.5, 0], scale: 0.8 },
  ],
  ambient: { intensity: 0.5, color: '#c8e6c8' },
  directional: { intensity: 0.9, color: '#fff5e0', position: [-3, 10, 6] },
  fogColor: '#1a2e1a',
  vignette: { strength: 0.99 },
};
```

## Integration with Main Game

### BiomeConfig Changes
- New optional field: `atmosphericVFX?: AtmosphericVFXPlacement[]`
- Backward compatible: old configs without this field work unchanged
- Location: `src/scene/arena-biome-config.ts`

### Game Rendering
- Component: `ArenaAtmosphericVFX` in `src/scene/arena-atmospheric-vfx.tsx`
- Renders placements as r3f-vfx particle systems
- 4 preset effects built-in (fog-mist, cave-ember, forest-spore, dust-motes)
- Expandable: add new effectId → add preset in ATMOSPHERIC_PRESETS map

### Usage
```tsx
// In CombatArenaEnvironment.tsx
const biomeConfig = getBiomeConfig(biome);

return (
  <Canvas>
    {/* ... other components ... */}
    <ArenaAtmosphericVFX placements={biomeConfig.atmosphericVFX ?? []} />
  </Canvas>
);
```

## File Structure

```
tools/map-playground/
├── src/
│   ├── app.tsx                    # Main layout + keyboard shortcuts
│   ├── main.tsx                   # React root
│   ├── store/
│   │   ├── scene-store.ts         # Zustand state (props, layers, vfx, undo/redo)
│   │   ├── scene-types.ts         # TypeScript interfaces
│   │   └── history-helpers.ts     # Immutable snapshot utilities
│   ├── scene/
│   │   ├── arena-viewport.tsx     # R3F Canvas with ortho camera + raycaster
│   │   ├── placed-props.tsx       # 3D prop rendering + selection highlight
│   │   ├── parallax-bg.tsx        # Background layer rendering
│   │   └── vfx-overlay.tsx        # VFX placement rendering (r3f-vfx)
│   ├── panels/
│   │   ├── asset-browser.tsx      # Asset listing + search + selection
│   │   ├── properties-panel.tsx   # Transform sliders (position, rotation, scale)
│   │   └── lighting-panel.tsx     # Leva debug panel (ambient, directional, fog)
│   ├── ui/
│   │   ├── code-preview.tsx       # Code generation + clipboard button
│   │   ├── scene-objects-list.tsx # Hierarchical scene graph view
│   │   └── styles.css             # Layout styles (flexbox, grid, theme)
│   └── codegen/
│       └── generate-biome-config.ts # TypeScript code generator
├── vite.config.ts                 # Vite config + custom plugin
└── package.json                   # Dependencies
```

## Extending with New VFX Effects

To add a new atmospheric effect:

1. **Define Preset** in `src/scene/arena-atmospheric-vfx.tsx`:
```typescript
const ATMOSPHERIC_PRESETS: Record<string, object> = {
  'my-custom-vfx': {
    maxParticles: 100,
    size: [0.1, 0.2],
    colorStart: ['#ff00ff', '#ff00ff'],
    colorEnd: ['#ff00ff00'],
    fadeOpacity: [1, 0],
    lifetime: [2, 4],
    speed: [0.1, 0.2],
    gravity: [0, 0.5, 0],
    emitterShape: EmitterShape.SPHERE,
    emitterRadius: [0, 1],
    blending: Blending.ADDITIVE,
    intensity: 3,
  },
};
```

2. **Add to Map Playground Asset Manifest** (vite plugin):
```javascript
// In vite.config.ts asset-manifest endpoint
vfxEffects: [
  { id: 'my-custom-vfx', label: 'My Custom VFX' }
],
```

3. **Use in Editor**: VFX effect appears in asset browser → place and export

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server on :5175 |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |

## Troubleshooting

**Q: Assets not loading in viewport?**
A: Ensure main game assets exist in `public/arena/` and `public/tiles/`. Check browser console for 404 errors. Verify vite.config.ts plugin is serving `/game-assets/*` correctly.

**Q: Code generation empty or missing?**
A: Ensure scene has placed objects (props, layers, or VFX). Click "Generate TS" button to preview code before copy.

**Q: Ghost preview always red?**
A: Check prop position is within viewport bounds. Orthogonal camera view spans roughly (-10, 0, 0) to (10, 5, 10).

**Q: Undo/Redo not working?**
A: Undo only commits on property release (after slider drag finishes). Placement and deletion auto-commit. Check history stack hasn't exceeded 50 entries (oldest entries are dropped).

## Notes

- All state lives in Zustand store — no backend required
- History is in-memory (lost on page refresh) — copy code before closing
- Asset manifest is static JSON served by vite plugin — update vite.config.ts to add assets
- Map Playground is standalone — runs independently from main game
- Code generation is deterministic — same scene → same TypeScript output
