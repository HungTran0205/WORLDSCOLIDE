/**
 * Battle sub-phase chrome — DOM panel surrounding the world canvas viewport.
 *
 * The actual entity rendering lives in the shared world canvas (D8 — see
 * `src/scene/combat/combat-scene.tsx`), so this component is intentionally
 * empty in the center: the underlying canvas shows through. We add the HUD
 * overlay (HP bars, damage popups) and a Skip → simulator button (Phase 6
 * fills the simulator handoff; Phase 4 just transitions to result for debug).
 */

import { useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '@/game/state/store';
import { useCombatPanelStore } from '@/game/state/combat-panel-store';
import { COMBAT_CRIT_DOM_EVENT, COMBAT_SKIP_DOM_EVENT } from '@/scene/combat/combat-vfx-bridge';
import { CombatPanelHud } from './combat-panel-hud';
import { CombatPanelEnemyRoster, CombatPanelAllyRoster } from './combat-panel-roster';
import { CombatPanelSkillBar } from './combat-panel-skill-bar';

const SHAKE_DURATION_MS = 220;

export function CombatPanelBattle() {
  const missionId = useCombatPanelStore((s) => s.missionId);
  const speedMultiplier = useGameStore((s) => s.speedMultiplier);
  const setSpeedMultiplier = useGameStore((s) => s.setSpeedMultiplier);
  const waveState = useGameStore((s) => s.waveState);
  const arenaTime = useGameStore((s) => s.arenaTime);
  const targetPriority = useGameStore((s) =>
    s.activeMissions.find((m) => m.missionId === missionId)?.targetPriority ?? 'focus',
  );

  // Crit screen-shake listener — engine dispatches `combat-vfx-crit` window
  // events from inside the canvas; this hook applies a CSS class for ~220ms
  // so the panel container jitters. Class toggled rather than imperative
  // transform so multiple crits within the same window cleanly retrigger.
  const rootRef = useRef<HTMLDivElement>(null);
  const clearTimerRef = useRef<number | null>(null);
  useEffect(() => {
    const handler = () => {
      const node = rootRef.current;
      if (!node) return;
      // Force reflow so re-adding the class restarts the keyframe animation.
      node.classList.remove('combat-panel--shake');
      void node.offsetWidth;
      node.classList.add('combat-panel--shake');
      if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = window.setTimeout(() => {
        rootRef.current?.classList.remove('combat-panel--shake');
        clearTimerRef.current = null;
      }, SHAKE_DURATION_MS);
    };
    window.addEventListener(COMBAT_CRIT_DOM_EVENT, handler);
    return () => {
      window.removeEventListener(COMBAT_CRIT_DOM_EVENT, handler);
      if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
    };
  }, []);

  // Skip resolves combat via simulator from current engine state (D11).
  // Fight controller owns the engine ref, so we dispatch a window event and
  // let the controller snapshot + run simulateCombatFromSnapshot + finalize.
  const handleSkip = useCallback(() => {
    window.dispatchEvent(new CustomEvent(COMBAT_SKIP_DOM_EVENT));
  }, []);

  const togglePause = useCallback(() => {
    const current = useGameStore.getState().speedMultiplier;
    setSpeedMultiplier(current === 0 ? 1 : 0);
  }, [setSpeedMultiplier]);

  // Space key toggles pause while in battle phase. Skips when focus is on a
  // text input so typing doesn't accidentally pause.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      togglePause();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePause]);

  const elapsed = formatElapsed(arenaTime);
  const modeLabel = targetPriority === 'focus' ? 'FOCUS' : 'BALANCE';
  const modeIcon = targetPriority === 'focus' ? '🎯' : '⚖️';

  return (
    <div ref={rootRef} className="combat-panel-battle">
      <CombatPanelEnemyRoster />

      {/* Viewport area — transparent so the world canvas combat group shows through */}
      <div className="combat-panel-battle__viewport">
        <CombatPanelHud />
      </div>

      <CombatPanelSkillBar />
      <CombatPanelAllyRoster />

      <div className="combat-panel-battle__footer">
        <div className="combat-panel-battle__meta">
          <span className="combat-panel-battle__mode" title={`Target priority: ${modeLabel}`}>
            {modeIcon} {modeLabel} MODE
          </span>
          <span className="combat-panel-battle__elapsed">ELAPSED {elapsed}</span>
          {waveState.total > 1 && (
            <span className="combat-panel-battle__wave">
              WAVE {waveState.current + 1}/{waveState.total}
            </span>
          )}
        </div>
        <div className="combat-panel-battle__actions">
          <button
            type="button"
            className={
              'combat-panel-btn combat-panel-btn--speed' +
              (speedMultiplier === 0 ? ' combat-panel-btn--active' : '')
            }
            onClick={togglePause}
            title={speedMultiplier === 0 ? 'Resume (Space)' : 'Pause (Space)'}
          >
            {speedMultiplier === 0 ? '▶' : '⏸'}
          </button>
          {[1, 2, 4].map((mult) => (
            <button
              key={mult}
              type="button"
              className={
                'combat-panel-btn combat-panel-btn--speed' +
                (speedMultiplier === mult ? ' combat-panel-btn--active' : '')
              }
              onClick={() => setSpeedMultiplier(mult)}
              title={`${mult}× speed`}
            >
              {mult}×
            </button>
          ))}
          <button
            type="button"
            className="combat-panel-btn combat-panel-btn--primary"
            onClick={handleSkip}
            title="Skip remaining battle and resolve via simulator"
          >
            SKIP → RESOLVE
          </button>
        </div>
      </div>
    </div>
  );
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
