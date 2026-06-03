/**
 * Skill icon — renders the per-skill pixel-art icon from /ui/icons/skills/{id}.png,
 * falling back to a glyph chip (keyed by skill type) when the asset is missing so
 * the UI never shows a broken image while icons are still being authored.
 */

import { useState } from 'react';
import type { Skill } from '@/game/state/game-state';
import { assetUrl } from '@/lib/asset-url';

// Fallback glyph by dispatch type — used until a real icon PNG exists.
const TYPE_GLYPH: Record<string, string> = {
  'lane-hit': '⇶',
  'damage': '⚔',
  'riposte': '↩',
  'buff': '⛨',
  'armor-pierce': '⊘',
  'aoe-ground': '◎',
  'multi-hit': '⁂',
  'debuff': '☠',
};

export function skillIconPath(skillId: string): string {
  return assetUrl(`/ui/icons/skills/${skillId}.png`);
}

export function SkillIcon({ skill, size = 36 }: { skill: Skill; size?: number }) {
  const [failed, setFailed] = useState(false);
  const glyph = TYPE_GLYPH[skill.skillType ?? 'damage'] ?? '✦';

  if (failed) {
    return (
      <div className="ty-skill-icon ty-skill-icon--fallback" style={{ width: size, height: size, fontSize: size * 0.5 }}>
        {glyph}
      </div>
    );
  }
  return (
    <img
      className="ty-skill-icon ink-pixelated"
      src={skillIconPath(skill.id)}
      alt={skill.name}
      width={size}
      height={size}
      onError={() => setFailed(true)}
    />
  );
}
