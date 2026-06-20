/**
 * Battle-phase DOM HUD overlay — HP bars + transient damage popups.
 *
 * Subscribes to:
 *   - `combat-arena-slice.arenaEntities` for entity HP / death state (5Hz sync).
 *   - `combat-projection-store.positions`  for screen-pixel coords (~30Hz sync
 *     from the in-canvas `<CombatProjectionPublisher />`).
 *   - `combat-projection-store.damages`    for active popup queue.
 *
 * Coordinates are viewport-space CSS pixels. The overlay is portaled to
 * document.body so its `position: fixed` resolves against the viewport, NOT
 * against the combat panel — any transform on a panel ancestor (open/close
 * animation, hit-shake) would otherwise turn the panel into the containing
 * block and shift every HP bar by the panel's offset.
 */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '@/game/state/store';
import { useCombatProjectionStore } from '@/scene/combat/combat-projection-store';

const HP_BAR_W = 56;     // CSS pixels — fixed for predictability
const HP_BAR_H = 6;
const DAMAGE_LIFETIME_MS = 800;

export function CombatPanelHud() {
  const entities = useGameStore((s) => s.arenaEntities);
  const positions = useCombatProjectionStore((s) => s.positions);
  const damages = useCombatProjectionStore((s) => s.damages);
  const pruneDamages = useCombatProjectionStore((s) => s.pruneDamages);

  // Soft-prune damages every 200ms even when no new events arrive — guarantees
  // popups disappear after their CSS animation if combat goes quiet.
  useEffect(() => {
    const id = setInterval(() => pruneDamages(DAMAGE_LIFETIME_MS), 200);
    return () => clearInterval(id);
  }, [pruneDamages]);

  return createPortal(
    <div className="combat-panel-hud" aria-hidden="true">
      {/* HP bars */}
      {entities.map((e) => {
        const pos = positions.get(e.id);
        if (!pos || !pos.visible) return null;
        const pct = Math.max(0, Math.min(1, e.currentHp / Math.max(1, e.maxHp)));
        const isDead = e.currentHp <= 0;
        // Overhead buff/stance icons — Riposte stance (🛡️) + damage-up buffs (⚔️, Rally).
        const buffIcons: string[] = [];
        if (e.riposteActive) buffIcons.push('🛡️');
        if (e.statusEffects?.some((s) => s.type === 'boosted')) buffIcons.push('⚔️');
        return (
          <div
            key={e.id}
            className={
              'combat-hud__hp-anchor' +
              (e.isAlly ? ' combat-hud__hp-anchor--ally' : ' combat-hud__hp-anchor--enemy') +
              (isDead ? ' combat-hud__hp-anchor--dead' : '')
            }
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              width: `${HP_BAR_W}px`,
              height: `${HP_BAR_H}px`,
            }}
          >
            <div className="combat-hud__hp-name">{e.name}</div>
            <div className="combat-hud__hp-bar">
              <div
                className="combat-hud__hp-fill"
                style={{ width: `${pct * 100}%` }}
              />
            </div>
            {buffIcons.length > 0 && (
              <div className="combat-hud__buff-row">
                {buffIcons.map((icon, i) => (
                  <span key={i} className="combat-hud__buff-icon">{icon}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Damage / heal popups */}
      {damages.map((d) => {
        const pos = positions.get(d.entityId);
        if (!pos) return null;
        return (
          <div
            key={d.id}
            className={`combat-hud__damage combat-hud__damage--${d.kind}`}
            style={{ left: `${pos.x + d.offsetX}px`, top: `${pos.y + d.offsetY}px` }}
          >
            {d.text}
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
