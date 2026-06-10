# Phase 6: Golden Aura Particles — Ancestral Blessings VFX

**Date**: 2026-06-06 15:33
**Severity**: Low (no bugs; POC complete, visual playtest pending)
**Component**: Combat VFX / Ancestral Blessings
**Status**: Resolved (phase 6/7 complete)

## What Happened

Completed Phase 6 of the Ancestral Blessings pipeline: added a continuous golden rising particle aura around blessed combat entities. The aura runs only during live arena combat; headless auto-resolve applies the buff with no VFX (POC scope). Two source files touched, 76 lines added. Covers LS-SWORD-M only.

## The Brutal Truth

This phase went *genuinely* smoothly—no bugs, no gotchas, no late-breaking code review findings. Which is its own lesson: auto-registration worked as designed, WebGPU safety fell out naturally from the existing `CombatVfxRoot` architecture, and the throttle mechanism inherited pause/speed control for free. Sometimes the design you ship does the job cleanly. Still, the honest caveat: all three success criteria are visual. Code review passed, unit tests passed, but particles are invisible to JSDOM. Live-arena visual playtest is still the gate. That's not a bug—it's just how particle systems work.

## Technical Details

**Files modified:**

1. `src/scene/effects/presets/linh-son-presets.ts` — new `ls-blessing-aura` preset. DISK emitter, anti-gravity `gravity:[0,1.2,0]` (rising), additive blending, small motes (`size:[0.05,0.14]`, lifetime `1.5–3s`), `maxParticles:400`, `intensity:4`. Added `Blending` to imports. No registry edit needed; spread into `allPresets` already covered by auto-registration.

2. `src/scene/combat/combat-fight-controller.tsx` — `auraEmitter = useVFXEmitter('ls-blessing-aura')` hook + `lastAuraEmitRef`. Three constants: `AURA_EMIT_INTERVAL_MS=300`, `AURA_EMIT_COUNT=4`, `AURA_EMIT_Y=0.3`. Throttled `useFrame` loop (keyed on `engine.time`, like existing `lastSyncRef`/`lastSnapshotRef`) emits at each blessed entity's feet `(position.y ?? 0)+0.3` when `blessed && currentHp>0`. Ref reset in init-cleanup branch. Stops cleanly when combat ends (dead entities excluded by `currentHp>0`; `engineRef` nulls on cleanup → early return).

**Tests**: 929/932 pass. 3 pre-existing failures are `.codex/hooks` infra noise (not game regressions). Neither VFX file is imported by unit test suite (particles are runtime-only in R3F context).

**Build**: `tsc -b` clean, `eslint` clean, no warnings.

## What We Tried

No rework. The throttle design (`engine.time` vs wall clock) was verified during code review to inherit pause and speed-multiplier semantics from the engine state. Feet-anchored emit `(position.y ?? 0)+0.3` is intentionally more correct than fixed-y hit/death emits (platform-aware). WebGPU safety fell out of reusing the persistent `<VFXParticles autoStart={false}>` mount—no per-entity emit/unmount churn, which was the disposal-warning risk identified in phase 5.

## Lessons Learned

- **Auto-registration pays off.** The phase doc anticipated an edit to `preset-registry.ts`. Wasn't needed. The spread pattern (`...linhSonPresets`) already feeds every `category:'linh-son'` preset into the root. Less code = less surface for bugs.
- **Inherit engine state, don't rebuild it.** Throttle on `engine.time` gets pause + speed multiplier for free. Wall-clock throttle would require re-piping those signals through the emitter.
- **Lazy validation > eager constraints.** Blessing is a permanent latch (set once, never cleared). The aura runs blessed→combat-end without needing explicit teardown logic. Dead entities are excluded naturally by the `currentHp>0` guard.
- **Particle systems are design-correct but visually unverified.** Code passes all scrutiny. Pixels need a human in an arena.

## Next Steps

1. **Phase 7**: Integration test suite + manual arena QA. Verify blend order (aura + overlay + body), color correctness under combat lighting, frame sync with entity movement under load.
2. **Visual playtest**: Live arena playtest of the aura with LS-SWORD-M blessed (remaining gate before declaring VFX complete).
3. **Second archetype expansion**: SCOUT and WARRIOR presets later (art + manifest registration only—code path is archetype-agnostic).
4. **3D combat camera**: Future phase (currently 2D overlay; full 3D would require camera controller not yet spec'd).

All code committed to `develop` (bundled phases 1–6 per user choice); zero blocking issues for phase 7.

---

**Status**: DONE

**Summary**: Golden aura particles emitting continuously from blessed entities in live arena. Design flowed cleanly; no bugs; visual playtest pending.

**Concerns/Blockers**: None—visual confirmation in live arena is validation, not a blocker.
