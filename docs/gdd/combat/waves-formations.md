# Combat — Waves, Formations & Stage Specs

**Code:** `src/game/systems/combat-wave-manager.ts`, `combat-arena-types.ts`, `combat-engine.ts`  
**Stage data:** `src/scene/combat/maps/stages/`, `combat-map-registry.ts`, `stage-spec-types.ts`

---

## Formation System

Six-slot formation grid: indices 0–2 = front row, 3–5 = back row.

```
Front row:  [0]  [1]  [2]   ← closer to camera / enemy
Back row:   [3]  [4]  [5]   ← farther from camera
```

- `Formation = (string | null)[]` — member IDs or empty slots (`combat-arena-types.ts:58`)
- Lane Z spacing: −3 / 0 / +3 world units (variants like −3.5 / −0.5 / +3 for asymmetry)
- `AttackRange`: melee = **1.5u**, ranged = **5.0u** (`combat-arena-types.ts`)
- Home position set at spawn; entity returns to `homeX/Y/Z` after each attack cycle

Ally spawn: X ∈ [−8, −2] (left side); enemy spawn: X ∈ [+2, +8] (right side).

---

## Wave System

`WaveManager` — `combat-wave-manager.ts`:

```typescript
interface WaveDefinition {
  enemyIds: string[];      // enemy template IDs to spawn
  spawnXOffset: number;    // X offset from arena origin
  hpMultiplier?: number;   // scales all enemy HP in this wave (default 1.0)
  lanes?: ('front'|'mid'|'back')[];  // optional per-enemy lane hints
}
```

- `WaveManager.advance()` moves to next wave; `hasNext()` checks if more waves remain
- `onWaveCheck()` callback on engine triggers wave advance when all enemies die
- New-wave enemies spawn with `spawnSlideFromX` cosmetic hint (slide in from off-screen right ≥ `OFFSCREEN_SLIDE_MIN_X = 14` world units — `combat-engine.ts:35`)
- Logic position is the on-screen home slot; slide is renderer-only, does not affect AI or collision

Legacy single-wave missions converted via `legacyToWaves()` wrapper.

---

## Stage Spec System

Each combat map is a `CombatStageSpec` in `src/scene/combat/maps/stages/{id}.ts`,
registered in `combat-map-registry.ts`. Current registered stages:

- `lolo-village-outskirt` — flat ground, single platform
- `broken-cliff-outskirt` — multi-platform, raised cliff + scatter decals
- `the-forest`

### Key Spec Fields

| Field | Purpose |
|-------|---------|
| `platforms[]` | Platform geometry; each has `position[x,y,z]`, `size[w,d]`, tile/decal config |
| `spawnAnchors.{ally,enemy}` | Slot → platform + `localOffset[dx,dz]` mappings |
| `bgFar` / `bgMid` | Background billboard layers (far z = −6 to −14, scale 1.1 for 2:1 images) |
| `foreground` | `'default'` or `'none'` decorative layer |

**Spawn Y**: taken from `platform.position[1]` — authoring controls elevation explicitly.  
Entities on flat stages carry `y = 0`; raised-platform entities carry `y > 0`  
(see `src/game/systems/combat-arena-types.ts` for the stage/platform spec types).

Camera: orthographic zoom **114**, position `[0, 3.6, 10.0]`, ~20° downward tilt.  
Visible safe zone: ±8X, ±4.5Y at 1920×1080 (`battlefield-template.md §1`).

### Decal Authoring Patterns

- **Manual** (`DecalPlacement`): exact world-coord for story moments, one-off accents
- **Scatter** (`DecalDensitySpec`): `perCellChance` + `seed` for deterministic ambient grunge
- Anti-pattern: do NOT use directional edge tiles (e.g. `grass-edge`) as scatter variants
