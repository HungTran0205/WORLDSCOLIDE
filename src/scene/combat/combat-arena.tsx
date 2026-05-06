/**
 * Legacy combat arena canvas — DEAD CODE PATH after Phase 4.
 *
 * The combat panel (D8 single-canvas + group toggle) now drives all combat
 * via `src/scene/combat/combat-scene.tsx` mounted inside the shared world
 * canvas. This file remains exported only so existing references in
 * `game-screen.tsx` keep compiling; the conditional in game-screen ensures it
 * never actually mounts while `combatPanelStore.isOpen` is true (which is
 * always, in the new flow).
 *
 * Full removal: `plans/260503-1145-legacy-combat-path-removal/`.
 */

export function CombatArenaCanvas() {
  return null;
}
