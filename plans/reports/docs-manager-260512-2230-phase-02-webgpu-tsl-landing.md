# Docs Update — Phase 02 WebGPU TSL Landing

**Date**: 2026-05-12 | **Task**: Evaluate & update docs for Phase 02 atmospheric TSL landing

---

## Summary

Phase 02 webgpu TSL parity plan (vignette + colorGrade nodes) landed. Docs were underselling the actual scope. Applied minimal-surgical edits across 3 files to reflect the expanded WebGPU chain and new TSL architecture.

---

## Changes Made

### 1. `docs/project-changelog.md`

**Lines edited**: 38–55 (New files section + Verification)

**What changed**:
- **Before**: Listed `atmospheric-webgpu-pass.tsx` as "TSL Bloom-only pass"
- **After**: Expanded to document:
  - `vignette-node.ts` — pmndrs DEFAULT radial darkening
  - `color-grade-node.ts` — HueSaturation + BrightnessContrast chained
  - `tsl/types.ts` — `TslChainHolder` + uniform shape definitions

**Before**: "**WebGPU**: Bloom + ToneMapping only (TSL parity gap documented)"
**After**: "**WebGPU** (Phase 02): TSL chain (Bloom → ColorGrade → Vignette → ACES ToneMapping)"

**Added**: New section documenting preset sync pattern
- `applyPreset(holder, preset, overrides)` helper
- Refs-based prevention of seed-race during async TSL import
- `post.dispose()` cleanup wiring

**Impact**: Changelog now accurately reflects Phase 02 scope (vignette + colorGrade as required fields, not future optionals).

---

### 2. `docs/codebase-summary.md`

**Lines edited**: 824–833 (World Atmospheric Composer section, Key Files)

**What changed**:
- Expanded "New" files list from 4 to 7 entries:
  - Added explicit `vignette-node.ts` and `color-grade-node.ts` descriptions
  - Added `tsl/types.ts` with phase roadmap comment (bloom required now; fog/chromAb/tiltShift optional future)
  
- Updated `atmospheric-webgpu-pass.tsx` description:
  - **Before**: "TSL Bloom-only pass with parity gap note"
  - **After**: "TSL chain: bloom → colorGrade → vignette → ACES; refs-based preset sync"

**Impact**: Codebase summary now documents the 3 new TSL files and clarifies that the parity gap is narrower than Phase 01 indicated.

---

### 3. `docs/system-architecture.md`

**Lines edited**: 2929–2936 (World Post-Processing section + Phase completion summaries)

**What changed**:
- Updated WebGPU path description:
  - **Before**: "Bloom + ToneMapping only (TSL parity gap documented in code)"
  - **After**: "TSL chain (Bloom → ColorGrade → Vignette → ACES ToneMapping); warns if full-stack requested. ColorGrade includes hue/saturation/brightness/contrast; vignette uses pmndrs DEFAULT radial darkening."

- Added "Preset Sync Pattern" subsection explaining refs-based approach and `applyPreset()` helper

- Updated Phase 02 completion line:
  - **Before**: "WebGPU fallback (Bloom + ToneMapping)"
  - **After**: "WebGPU TSL chain (Bloom → ColorGrade → Vignette → ACES ToneMapping). Per-room DOF target auto-sync via camera lerp. Refs-based preset sync prevents mutation race during async TSL import."

**Impact**: Architecture doc now documents Phase 02's actual WebGPU capabilities and the technical pattern for syncing presets to TSL chains.

---

## Verification

- ✅ Verified `vignette-node.ts` and `color-grade-node.ts` exist in `src/scene/atmospheric/tsl/`
- ✅ Verified `atmospheric-webgpu-pass.tsx` chain ordering: bloom → colorGrade → vignette
- ✅ Verified `tsl/types.ts` defines `TslChainHolder` with `vignette` + `colorGrade` as required (not optional)
- ✅ Verified `applyPreset()` helper syncs uniform `.value` properties without rebuild
- ✅ Verified cleanup: `post.dispose()` wired on component cleanup

---

## Files Changed

1. `D:/WORLDCOLIDE/docs/project-changelog.md` — 3 edits (38–55 lines + new pattern section)
2. `D:/WORLDCOLIDE/docs/codebase-summary.md` — 1 edit (824–833 lines)
3. `D:/WORLDCOLIDE/docs/system-architecture.md` — 2 edits (2929–2936 lines + phase summary)

---

## Notes

- No changes to `plans/` files (already synced by project-manager).
- No changes to `src/scene/atmospheric/tsl/README.md` (already marked "landed").
- Docs now accurately reflect that WebGPU parity gap is narrower than "Bloom + ToneMapping only"; actual chain is Bloom → ColorGrade → Vignette → ACES.
- All edits are minimal, surgical, and preserve existing doc structure.

---

**Status**: ✅ DONE

All docs updated to reflect Phase 02 WebGPU TSL landing. Changelog, codebase summary, and architecture doc now document vignette + colorGrade nodes and preset sync pattern.
