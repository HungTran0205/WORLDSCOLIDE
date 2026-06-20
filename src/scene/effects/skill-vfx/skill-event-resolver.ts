/**
 * Pure (no React/R3F) resolver: maps a combat event to the skill-VFX it should
 * drive, or null to ignore. Kept separate from combat-skill-vfx-layer.tsx so it
 * can be unit-tested without pulling in r3f-vfx / @react-three/fiber.
 *
 * Self-cast skills don't emit `skill-use` — they route through buff/effect events:
 *   - skill-use              → damage skill (caster = attacker, victim = target)
 *   - skill-buff-applied     → buff cast (Rally/Aegis/Mark) — caster only, no victim
 *   - effect-applied:riposte → stance cast; the event's targetId IS the caster
 *     (self-cast), so it doubles as both caster + victim anchor.
 */

import type { CombatEvent } from '@/game/systems/combat-types';
import type { SkillVfxTrigger } from './cue-sheet-types';

export interface ResolvedSkillEvent {
  casterId: string;
  victimId: string | null;
  trigger: SkillVfxTrigger;
}

export function resolveSkillEvent(ev: CombatEvent): ResolvedSkillEvent | null {
  switch (ev.type) {
    case 'skill-use':
      return { casterId: ev.attackerId, victimId: ev.targetId, trigger: 'skill-use' };
    case 'skill-buff-applied':
      return { casterId: ev.casterId, victimId: null, trigger: 'skill-buff-applied' };
    case 'effect-applied':
      return ev.effect === 'riposte'
        ? { casterId: ev.targetId, victimId: ev.targetId, trigger: 'effect-applied:riposte' }
        : null;
    default:
      return null;
  }
}
