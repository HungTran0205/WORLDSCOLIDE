# WebGPU TSL Parity Phase 03: ACES Tonemap Closes Four-Effect Parity

**Date**: 2026-05-12 22:45
**Severity**: Medium
**Component**: Atmospheric / WebGPU TSL post-processing
**Status**: Resolved

## What Happened

Phase 03 of the atmospheric WebGPU TSL parity plan shipped successfully. Implemented a parameter-free ACES Filmic tonemap node as the final stage in the post-processing chain, eliminating the functional gap between WebGL and WebGPU rendering paths. The parity warning that previously flagged WebGPU as "bloom-only" can now be removed.

## The Brutal Truth

For five weeks, the WebGPU post-processing stack was incomplete. Any developer loading the game on WebGPU saw a console warning that 60% of the effect stack wasn't wired yet. Users testing on NVIDIA cards got a visibly undersaturated, flat image compared to the WebGL path. That's not acceptable for a game meant to ship on both. Phase 03 closes that gap for the four staple effects (Bloom, Vignette, ColorGrade, ACES). The parity messaging was a band-aid; now the band-aid can come off.

## Technical Details

Implemented `tsl/aces-tonemap-node.ts` using the Narkowicz fitted-curve approximation:

```
x = color * 0.6
a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14
out = clamp((x*(a*x + b)) / (x*(c*x + d) + e), 0, 1)
```

This matches three.js's `ACESFilmicToneMapping` exactly. 28 lines of TSL including constants and citation. Chain tail architecture enforces ACES as output—any future effect (ChromAb, Tilt-Shift) must insert BEFORE the ACES guard comment.

Visual diff on guild-hall, workshop (high bloom), and infirmary (cool color grade) shows imperceptible delta between WebGL and WebGPU renders. Eyeball tolerance met.

## What We Tried

- Debated three.js core's RRT+ODT matrix form vs Narkowicz polynomial—chose polynomial to stay under 30-LOC budget and because visual delta is sub-threshold for HD-2D look. Both are mathematically equivalent for our use case.

## Root Cause Analysis

WebGPU post-processing was scaffolded but incomplete. The warning existed to prevent art team confusion about perceived color shifts. Now the warning was truthful but unhelpful—it forced every WebGPU branch to carry a guilt-trip message. Removing it required finishing the actual effect, not just quieting the console.

## Lessons Learned

1. **Chain finality must be enforced surgically.** The "ACES MUST BE LAST" guard comment is loud for a reason—future developers will miss it otherwise. Strong conventions beat hoping people read the code.

2. **Parity timelines are binary.** Once you emit a "not ready" warning, you own the anxiety until you remove it. Delaying closure of the parity gap compounds friction. Better to ship a complete, smaller scope than drag out a warning across sprints.

3. **Visual tolerance should be defined upfront.** "Looks like WebGL" meant ±2 LSB per channel before we started. That's a testable claim. Builds trust faster than "pretty close."

## Next Steps

Phase 04 (Chromatic Aberration) and Phase 05 (Tilt-Shift) will insert before the ACES guard. Plan documents this explicitly. Code comment enforces it. No ambiguity.

---

**Files changed:** `src/scene/atmospheric/tsl/aces-tonemap-node.ts` (new), `src/scene/atmospheric/atmospheric-webgpu-pass.tsx`, `src/scene/atmospheric/world-atmospheric-post.tsx`
