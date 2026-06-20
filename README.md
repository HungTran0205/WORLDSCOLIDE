# 2000s A.C — After the Collapse — RPG Idle Guild Builder

An HD-2D auto-RPG idle guild builder set 2000 years after a civilizational collapse. Build your guild hall, recruit members from Vietnamese-inspired civilizations, dispatch quests, and watch your guild grow — even while you're away.

> 📖 **Documentation:** see [`docs/README.md`](docs/README.md) for the full docs map (GDD, lore, reference). Technical design lives in [`docs/system-architecture.md`](docs/system-architecture.md).

## Tech Stack

- **React 19** + **TypeScript 5** — UI framework
- **Vite 8** — Build tool
- **@react-three/fiber** — 3D isometric guild hall scene
- **@react-three/drei** — Billboard sprites, orbit controls
- **Zustand 5** — State management (slice pattern)
- **Howler.js** — BGM + SFX audio
- **idb** — IndexedDB save persistence
- **Vitest** — Unit testing

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | ESLint check |

## Project Structure

```
src/
├── game/
│   ├── state/           # Zustand store + slices (clock, guild, roster, mission)
│   ├── systems/         # Game logic (combat, leveling, economy, missions, building)
│   │   └── workers/     # Web Worker game loop
│   ├── data/            # Static data (enemies, missions, skills, buildings, characters)
│   └── save/            # Save/load (localStorage + IndexedDB + JSON export)
├── scene/               # R3F 3D components (guild hall, member sprites, camera)
├── ui/
│   ├── panels/          # Game panels (quest board, roster, build, combat, settings)
│   ├── hud/             # HUD overlay + panel toggle bar
│   ├── components/      # Reusable UI (stat bar, member card, gold display)
│   └── styles/          # CSS for panels and HUD
├── audio/               # Howler.js audio manager + sound keys
├── i18n/                # i18next with Vietnamese default locale
└── main.tsx             # Entry point
```

## Game Systems

- **Combat** — Tick-based auto-RPG simulator with AGI+weapon speed formula, status effects, crits
- **Missions** — 7-tier quest system (F→S) with party dispatch, real-time timers, reward distribution
- **Economy** — Gold currency, level-scaled upkeep, debt penalties, recruitment costs
- **Guild Hall** — Room placement (tavern, training room, infirmary), room effect bonuses
- **Progression** — EXP curve with 1.35x scaling, stat allocation, multi-civilization roster (Linh Sơn playable now)
- **Save System** — Auto-save every 60s, localStorage + IndexedDB fallback, JSON export/import
- **Offline** — Web Worker tick loop, offline catch-up with upkeep charging + mission completion

## Game Flow

1. **Character Creation** — Name founder, distribute 50 stat points across 7 attributes
2. **Guild Setup** — Build rooms in your guild hall
3. **Quest Dispatch** — Select members, send them on tier-appropriate missions
4. **Combat Resolution** — Auto-combat simulates party vs enemies
5. **Recruit & Grow** — Recruit from Vietnamese-inspired civilizations (Linh Sơn playable now; Đế Quốc & Thiên Lữ planned), level up, unlock higher tiers

## License

Private — All rights reserved.
