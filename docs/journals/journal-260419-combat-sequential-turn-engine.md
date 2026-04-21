# Combat Sequential Turn Queue System

**Date**: 2026-04-19 14:36
**Severity**: High
**Component**: Combat Engine
**Status**: Resolved

## What Happened

Replaced the parallel ATB (Active Time Battle) system where all entities processed actions simultaneously with a strict sequential turn queue. This fundamentally changes combat from "everyone attacks every tick" to "only the active actor acts per cycle."

## The Brutal Truth

This was necessary but risky. The old ATB worked for simple cases, but once we added melee positioning (step-forward/return), stun mechanics, and skill locks, parallel processing created race conditions and felt chaotic. The sequential model is cleaner conceptually and drastically easier to debug — but we shipped it with one critical bug lurking underneath.

## Technical Details

Split the monolithic `processEntityTick()` into three focused methods:

- `processEntityStatus()` — runs **every tick** for **all entities** (passive regen, poison, stun duration, syringe effects)
- `processActorMovement()` — runs **only for active turn owner** (melee step-forward to target, return to home)
- `processEntityAction()` — runs when **next actor selected** (initiates attack/skill animation)

Added `activeActorId: string | null` turn lock field. Added `isActorDone()` helper to detect when current actor can release the lock (melee = `attackMoveState === 'home'`, ranged = `animState !== 'attacking' && 'skill'`).

Rewrote `processLogicTick()` as Phase A/B/C: (A) status all entities, (B) active actor movement, (C) select next actor via priority queue tie-break.

## What We Tried

Initial implementation had `activeActorId` never clearing after combat finished, causing an infinite loop in tests: combat ended, but the lock prevented next combat from starting. Caught before shipping. Added explicit cleanup in `finishCombat()`.

Also discovered stun could be bypassed if stun expired mid-lock — fixed by checking stun status **before** releasing turn ownership.

## Root Cause Analysis

The old parallel system masked these issues because every entity had equal priority. Sequentialization exposed the state management debt: locks must be cleared, status checks must run before state transitions, and edge cases around entity death/knockout need explicit handling.

## Lessons Learned

1. **Sequential state machines > parallel ticks** when action order matters. Much easier to reason about "who acts now?" than "does everyone act?"
2. **Test the exit conditions** — combat finish is a transition state that was easy to overlook. Infinite loop caught in tests.
3. **Tie-break strategy matters** — allies-first priority when multiple entities share same `nextAttackAt` creates better player feel than "whoever spawned first."

## Next Steps

All 225 tests passing, zero TS errors. Ready for combat QA testing. Monitor turn order edge cases: simultaneous-death scenarios, stun-during-animation, skill interrupt timing.

**Files modified**: `src/game/systems/combat-engine.ts`, `tests/combat-engine-sequential-turns.test.ts`
