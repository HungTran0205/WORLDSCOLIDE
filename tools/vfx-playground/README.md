# VFX Playground — Worlds Collide Effect Designer

Standalone tool for designing particle effects using [Three-VFX](https://github.com/mustache-dev/Three-VFX) (`r3f-vfx`).

## Quick Start

```bash
cd tools/vfx-playground
npm install
npm run dev
```

Or from project root:

```bash
npm run vfx
```

Opens at `http://localhost:5174`

## How to Use

1. **Select a preset** from the sidebar (categorized by civilization)
2. **Tweak** using the r3f-vfx debug panel that appears in the viewport
3. **Copy code** from the right panel → paste into game's R3F scene

## Effect Categories

| Category | Theme | Effects |
|----------|-------|---------|
| 🔥 Linh Sơn | Earth, fire, jungle | Forest Fire, Earth Smoke, Earth Slam, Forest Heal |
| ⚡ Đế Quốc | Electric, steam, tech | Electric Spark, Lightning Trail, Steam Vent, Overcharge |
| ✨ Thiên Lữ | Celestial, stars, wind | Stardust, Comet Strike, Celestial Wind, Constellation |
| 💥 Generic | Universal combat | Hit Impact, Explosion Burst, Movement Trail, Level Up |

## Integrating Effects into Game

The generated `<VFXParticles ... />` code uses `r3f-vfx` props. To use in the main game:

1. Install `r3f-vfx` in the main project
2. Ensure Three.js version compatibility (r3f-vfx needs ^0.182.0)
3. Paste the copied code into any R3F `<Canvas>` scene

## Tech Stack

- Vite + React 19 + TypeScript
- Three.js 0.182 + React Three Fiber 9
- r3f-vfx (GPU particle system)
- makio-meshline (trail effects)
