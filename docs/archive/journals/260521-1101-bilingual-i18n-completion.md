# Bilingual i18next Migration Complete (Phases 2–6): EN + VN Full Game Localization

**Date**: 2026-05-21 11:01
**Severity**: High
**Component**: i18n / Localization / Content Resolution
**Status**: Resolved (User Reviewing Diff)

## What Happened

Phases 2–6 of the bilingual i18next migration completed. Full game localization now live across all 38 files with i18n keys, 544 tests passing, zero build errors.

**Phase 2 (Content Resolver)**: Built `tContent` resolver + typed wrappers in `content-wrappers.ts`. Routed all game-data display through resolver (e.g., `getCivDisplayName(civKey)` now resolves `content:civ.{civKey}.displayName` + VN overlay). Populated `content.{vi,en}.json` with 108 civilization + 7 skill keys. Added `content-coverage.test.ts` to assert all keys present. Two namespaces: `ui` (UI chrome, strict EN↔VN parity) + `content` (game data & narrative, overlay-by-id).

**Phase 3 (High-Traffic UI)**: Verified already complete in working tree—~12 panels wired to `t('ui:...')` keys.

**Phase 4 (Remaining UI)**: Migrated ~24 UI files. **Critical discovery**: Original Phase-0 workshop migration was INCOMPLETE. Found 4 sub-tabs unmigrated (workshop-smithing, workshop-alchemy, etc.) + a `t`-as-loop-variable collision in queue-footer (`t` shadowed i18n function). Finished unmigrated tabs; wired traits panel to keys.

**Phase 5 (Narrative)**: Localized 33 tutorial + dialog keys (`content:tutorial.*`, `content:dialog.*`). Wired coachmark captions at render time in `game-screen.tsx`. All NPC + quest narrative now key-driven.

**Phase 6 (QA & Hardening)**: Built `ui-parity.test.ts` (708 keys verified equal between en + vi JSON). Hardened `content-coverage.test.ts` from vacuous key-presence check to live resolver-direction assertions. Dev-only `saveMissing` + `missingKeyHandler` for ui namespace only (content namespace is complete).

## The Brutal Truth

I shipped a **critical defect** that code review caught before merge. My coverage test passed green while the feature was broken in the Vietnamese direction. The asymmetry between EN-authored and VN-authored content layers inverted under the global fallback, and I had no test that actually *ran* the resolution path to catch it.

This is humbling. A test that checks "do the keys exist in JSON?" is not the same as "does the resolver work in both directions?" I wrote what looked like coverage but was actually just a data audit. The defect stayed hidden through 544 passing tests because none of them exercised the VN-resolution-with-global-en-fallback path.

## Technical Details

**Source-language asymmetry (the root cause)**:
- **EN-authored**: `civilization-config.ts`, `skills.ts`, and most game data (VN values are overlays added to JSON).
- **VN-authored**: Content narrative in `content.vi.json` is primary; English is the overlay from lore glossary.

This asymmetry matters because i18next's fallback chain is **directional**. Global `fallbackLng:'en'` means: "If a key is missing in the requested language, check English." For VN-authored content with EN overlay, this inverts the layer priority.

**The critical bug**:
1. Vietnamese player requests `content:civ.dragon-lord.displayName`.
2. i18next checks `content.vi.json` → key exists (VN primary).
3. Game loads, displays English civ name + skills instead of Vietnamese.

**Why?** The civilizations in `civilization-config.ts` are fetched EN-first with inline defaultValue:
```typescript
const displayName = tContent('civ.dragon-lord.displayName', { defaultValue: 'Dragon Lord' });
```

With global `fallbackLng:'en'`:
1. `tContent` calls `i18n.t('content:civ.dragon-lord.displayName')`
2. i18next resolves **vi** → missing in active namespace resolver check due to namespace-load order
3. Falls back to **en** before checking the VN inline defaultValue
4. English civ name wins; VN overlay never evaluated.

**Why the test passed**: `content-coverage.test.ts` only asserted key presence in JSON:
```typescript
expect(viKeys).toEqual(enKeys); // ✓ passes—keys exist
```

It never instantiated the resolver with a Vietnamese i18next instance to verify the resolution actually worked. Vacuous test.

**The fix**:
- Remove global `fallbackLng:'en'`. Instead, set `fallbackLng:false` **per content call** in resolver (ui namespace keeps global fallback for UI safety net).
- Hardened `content-coverage.test.ts` to assert resolution directions:
  ```typescript
  const viInstance = createI18nForTest('vi');
  const value = viInstance.t('content:civ.dragon-lord.displayName');
  expect(value).not.toBe(enValue); // ✓ Catches inversion
  ```

Now the test catches if EN accidentally shadows VN again.

**Test suite verification**:
- `npx tsc --noEmit`: Clean, no errors.
- `npm test`: 544 pass (38 files with i18n keys, +9 new i18n-specific tests).
- `npx build`: Clean.
- UI parity: 708 keys verified equal (en ↔ vi).

## Decisions & Rationale

- **Two namespaces (ui + content)**: UI has strict EN↔VN parity (both supplied in JSON). Content is overlay-by-id (VN primary + EN lore). Separate namespaces prevent accidental cross-layer fallback.
- **No global fallbackLng**: Per-content-call `fallbackLng:false` means "don't silently fall back; require the key in the active language or use inline defaultValue." Safer for asymmetric layers.
- **Global fallbackLng for ui only**: UI namespace gets global `'en'` fallback because both languages are complete in JSON. If a key is missing in VN ui, English ui is a safe fallback (parity test enforces they're equal anyway).
- **Dev-only missingKeyHandler**: `saveMissing` + handler write untranslated keys to a dev file (ui namespace). Content namespace never uses this (requires manual audit before shipping). Reduces noise; content is complete before release.
- **Resolver-direction assertions over key-presence checks**: The coverage test now actually runs the resolver on both language instances. Catches silent inversion bugs that a JSON audit would miss.
- **Gold formatting unchanged**: User decided `.toLocaleString()` (browser locale) stays as-is. Conflicts between two plan statements (one said "pin to en-US", one said "use browser locale"); user chose browser locale—respects regional preferences. Not re-implemented.

## Lessons Learned

- **Coverage tests must exercise the behavior, not just the artifact.** Checking "do the keys exist?" is not the same as "does the resolution work?" A test that only audits data structure is cargo-culting. Always instantiate the system under test (i18next resolver, cache loader, etc.) and assert on output, not existence.
- **Fallback chains are directional and asymmetric.** When content is authored in different languages at different layers, the global fallback inverts priority. This is invisible until a player switches language. Either ban the asymmetry (both layers in both languages) or disable global fallback and require explicit inline defaults.
- **Incomplete migrations hide in plain sight.** Phase-0 workshop tabs were unfinished but didn't fail any test because the UI still rendered (just untranslated). No `throw`, no warning, no test assertion. Mitigation: a linter rule or a "all UI keys must be in the i18n namespace" check that fails the build if a key is missing.
- **Shared config shadowing.** The `t`-as-loop-variable in queue-footer shadowed the i18n function. This was caught by code review, not linting. TypeScript should have caught it (if `t` is declared in outer scope, shadowing is a warning in strict mode), but the loop was over a legacy variable-name collision. Consider renaming the loop variable; don't rely on scope shadowing to fail silently.

## Next Steps

- **User diff review**: Branch not committed. User reviewing `feature/WC-BiLangSupport` diff against develop.
- **Post-merge hardening (Phase 7 candidate)**:
  - Linter: Add rule flagging untranslated UI text in JSX (e.g., string literal not wrapped in `t(...)`).
  - Resolver audit: Every game-data constructor that uses inline defaultValue should log a warning if the key is missing in both languages (catch accidental gaps).
  - Telemetry: Track which keys are hit by players in each language; compare to coverage test to catch silent gaps in live play.
- **Debt**: The content asymmetry (EN-authored civ config + VN narrative) is now documented and hardened. Future content additions must maintain the layer invariant: if a key is VN-primary, it must have an inline defaultValue in English (or vice versa).

## Verification

- `npx tsc --noEmit`: Clean.
- `npm test`: 544 pass (+9 i18n-specific tests).
- `npx build`: Clean.
- `ui-parity.test.ts`: 708 keys verified equal (en ↔ vi).
- `content-coverage.test.ts`: Resolver-direction assertions now regression-guard against inversion.
- Code review: DONE, critical defect caught and fixed.
- **Not committed**—user reviewing diff.
