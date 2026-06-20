# UI Design Language Foundation: Bronze Đông Sơn × Parchment

**Date**: 2026-06-13 02:47
**Severity**: Medium
**Component**: UI System (Panel Framework, Art Direction, Component Library)
**Status**: Resolved (Pending Visual QA)

## What Happened

Completed full orchestration of the UI design language foundation plan across 6 sequential phases in a single 24-hour session (10 subagents). Built the design artifact (art bible: 430 lines, hex tokens + components), generated chrome assets (Gemini + watermark strip + palette quantization), refactored panel architecture (PanelFrame presenter pattern, centralized close paths, two-axis panel manager), migrated 11 UI panels incrementally (training-yard pilot → batches → quest-board last), and validated with 21 new state-machine tests. Build green, vitest baseline matched, code-review sign-off.

## The Brutal Truth

This session exposed a critical flaw in our TypeScript validation gate and three design regressions that only surfaced under integration. Felt like shipping sand: "tsc clean" passed, code review initially approved, then real bugs bit during the final test-and-merge phase. Two critical catches saved the session from production breakage: a stale-closure camera clobber and a regression in Esc-close side effects. Stitching 11 panels without centralizing close behavior first was a mistake—each old component had its own camera-restore logic, and we deleted it before verifying all paths were covered.

## Technical Details

**Pipeline Architecture:**
- Art bible (docs/gdd/12a): 430 lines; every color, spacing, shadow, blend defined as hex tokens + component slots (PanelFrame, IconButton, HeaderText, etc.)
- Asset gen (parallel): PixelLab icons (per directive, chrome via Gemini + watermark strip + palette-quantize)
- Component build: PanelFrame (presentational), PanelClosingContext (exit animation host), panel manager (mainPanel + facilityPanel enums)
- 11-panel migration in batches: training-yard (pilot) → resource/stats panels → facility/home screens → quest-board (final)
- Test suite: 21 new state-machine tests covering panel lifecycle, proximity collapse, camera restore

**Critical Design Decision (Post-Review):**
- Original: PanelFrame managed close state internally, triggering animation
- Reviewed: Breaks store-driven closes (e.g., proximity mutual exclusion) because component never sees the close action
- Final: useDelayedUnmount hook + PanelClosingContext (exit animation on provider, not component); every close path (✕/Esc/proximity/mutual-exclusion) triggers centralized closeAllPanels reducer, watched by restore effect
- Outcome: identical animation regardless of close vector; side effects enumerated once, not replicated per-panel

**Panel Manager (Two-Axis Simplification):**
- Original design: 4 proximity booleans (facilityMenuOpen, questBoardOpen, etc.)
- Issue: redundancy; only one facility can be active; logic spread across 20+ reducers
- Fix: collapsed to `facilityPanel: "none" | "training-yard" | "home" | "quest-board"` enum after proving camera target is singular
- Saves 40+ lines of state, eliminates boolean collision bugs

**Compilation Gate Failure (CRITICAL):**
- `npx tsc --noEmit` returned zero errors while a hard crash existed: undefined `game-screen.cameraFocus` variable in camera-restore effect
- Root cause: tsconfig.json uses `"files": []` (solution-style config) — passes individual files, not references; `--noEmit` doesn't track undeclared variables in build contexts
- Discovery: code-reviewer re-ran `npx tsc -b --force` in second review round, caught undeclared variable; reported NO-GO
- Fix: replaced `cameraFocus` reference with `getState().panels.cameraFocus` to avoid stale closure
- Lesson: **`tsc --noEmit` is VACUOUS in this repo; real gate is `tsc -b --force`**; two parallel agents reported "tsc clean" without catching this

**Regression: Esc-Close Camera Soft-Lock:**
- Centralizing close paths skipped per-panel onClose effects
- Symptom: press Esc in facility mode, panel closes, but camera stays focused on facility (frozen)
- Root cause: old panel components called `camera.softFocus(null)` on close; centralized closeAllPanels reducer didn't
- Fix: added transition-watching restore effect that fires when `panels.cameraFocus` changes
- Guard: effect reads live `getState().panels.cameraFocus` to avoid stale-closure re-lock (caught in code-review second pass)

**Unclosed JSX Div (Parallel Merge):**
- One agent's panel migration left an unclosed div in quest-board template
- Caught by `tsc -b --force`, **not** `tsc --noEmit`
- Another agent claimed "tsc clean" on their batch despite same tsconfig

**Asset Generation & Directive Compliance:**
- Owner directive: PixelLab for icons only; chrome/UI chrome via Gemini + watermark strip + palette quantize
- Gemini bottom-right sparkle watermark stripped via pixel-diff + cropping before component export
- Palette quantized to 32 colors to match Đông Sơn bronze constraints (existing art direction)
- No new regressions vs recorded asset baseline

## What We Tried

1. **Component-internal close state**: failed because store-driven closes (proximity, mutual-exclusion) bypassed the component—animation skipped, side effects deleted
2. **Per-panel camera restore callbacks**: worked but replicated logic 11 times; when centralizing, we deleted them without auditing all close paths first
3. **Boolean proximity state**: 4 separate booleans; reduced to enum after proving singular camera target simplifies all collision logic
4. **tsc --noEmit as gate**: failed silently; two agents reported clean when undeclared variable existed; had to promote to `tsc -b --force`
5. **Parallel batch merges without orchestrator verification**: one unclosed div, one stale tsconfig interpretation; added re-run of `tsc -b` and code-review re-verification after parallel convergence

## Root Cause Analysis

1. **Vacuous TypeScript gate**: tsconfig solution-style `"files": []` makes `tsc --noEmit` skip cross-file references. Agents internalized "tsc clean = ship ready" without pressure-testing on real repo config. Fix was known (tsc -b) but not enforced at start
2. **Component-to-store refactoring without side-effect audit**: moving close behavior out of PanelFrame required enumerating all current close effects (camera reset, audio cue, analytics log). We deleted old code before mapping new equivalents—old patterns lived in 11 separate places
3. **Parallel agent output merge without orchestrator gate**: two agents reported tsc clean; orchestrator trusted claims instead of re-running locally; unclosed div and stale-closure camera bug only surfaced during final integration
4. **Design iteration without written spec**: original panel-manager boolean design was redundant but not obviously wrong until we unified camera behavior; should have formalized "camera target is singular" upfront

## Lessons Learned

- **TypeScript tsconfig is context-dependent**: `tsc --noEmit` alone is insufficient if tsconfig uses `"files": []`. Enforce `tsc -b --force` before merging. Document the repo's compilation gate in a README or GitHub Actions workflow so agents don't discover it by breakage
- **Centralizing state requires exhaustive side-effect mapping**: when moving close handlers from components to a store reducer, list every side effect in the old code before writing the new version. Use grep for patterns like `.close()`, `.restore()`, `cancel()`. Missing one = regression
- **Parallel agent verification is non-negotiable after merge**: after combining outputs from independent agents, re-run all gates (tsc, tests, lint) locally before delegating to code-review. Claims like "tsc clean" should be verified, not trusted
- **Single camera target simplifies architecture**: proving `cameraFocus` is always singular (no multi-camera facility UI) collapsed 4 booleans to 1 enum and eliminated collision bugs. Formalize singleton constraints early in design phase
- **Enum beats boolean explosion**: when state has mutual exclusion (only one active panel), use enum/discriminated union, not array of booleans. Reduces state space, eliminates impossible combinations

## Next Steps

1. **Owner visual QA**: review asset palette match (Đông Sơn bronze constraints), watermark strip quality, icon PixelLab parity; approve or flag for re-gen
2. **PNG border-image swap**: replace CSS borders with PNG edge slices per art direction (deferred from scope for time)
3. **Reduced-motion & crispness audit**: manual test alt-reduced-motion class behavior, verify font crispness on both Chrome/Firefox
4. **Formalize tsc gate**: add `npx tsc -b --force` to pre-commit hook and GitHub Actions to prevent stale-closure and undeclared-variable regressions
5. **Document close path audit**: in CLAUDE.md or code-standards, add checklist for state refactors: "identify all close/exit effects in old code before moving to store"

**Tests**: 21 new state-machine tests (panel lifecycle, proximity toggle, camera restore); vitest baseline matched; 0 new regressions
**Commits**: 6 phase commits (art-bible, assets, panel-frame, manager-enum, 11-panel-batches, tests); all code-review approved
**Branch**: feature/WC-UpgradeUI (merge to main pending owner visual QA)
