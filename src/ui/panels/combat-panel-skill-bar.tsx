/**
 * Skill bar for the battle phase — clickable + 1-6 hotkey skill icons.
 * Reuses the same `combat-skill` window event that the engine listens for.
 *
 * Smaller than the legacy CombatSkillHotbar — no speed toggle / timer here
 * (those live in the panel footer now). Up to 6 ally skills are shown.
 */

import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/game/state/store';

const MAX_SKILLS = 6;

export function CombatPanelSkillBar() {
  const entities = useGameStore((s) => s.arenaEntities);
  const arenaTime = useGameStore((s) => s.arenaTime);

  const allySkills = entities
    .filter((e) => e.isAlly && e.currentHp > 0 && e.skillName)
    .slice(0, MAX_SKILLS);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const idx = parseInt(e.key, 10) - 1;
      if (idx < 0 || idx >= allySkills.length) return;
      const ally = allySkills[idx];
      if (ally.skillCooldownUntil > arenaTime) return;
      window.dispatchEvent(new CustomEvent('combat-skill', { detail: ally.id }));
    },
    [allySkills, arenaTime],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (allySkills.length === 0) return null;

  return (
    <div className="combat-skill-bar">
      <div className="combat-skill-bar__label">SKILLS</div>
      <div className="combat-skill-bar__icons">
        {allySkills.map((ally, idx) => {
          const cdRemaining = Math.max(0, ally.skillCooldownUntil - arenaTime);
          const onCD = cdRemaining > 0;
          const cdSeconds = Math.ceil(cdRemaining / 1000);
          return (
            <button
              key={ally.id}
              type="button"
              // Stable hook for the Phase 06 coachmark on the primary skill (slot 1).
              data-coach={idx === 0 ? 'skill-hotbar' : undefined}
              className={'combat-skill-icon' + (onCD ? ' combat-skill-icon--cd' : '')}
              onClick={() => {
                if (onCD) return;
                window.dispatchEvent(new CustomEvent('combat-skill', { detail: ally.id }));
              }}
              disabled={onCD}
              title={`${ally.skillName} (${idx + 1})`}
            >
              <span className="combat-skill-icon__hotkey">{idx + 1}</span>
              <span className="combat-skill-icon__name">
                {(ally.skillName ?? '').slice(0, 4)}
              </span>
              {onCD && <span className="combat-skill-icon__cd">{cdSeconds}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
