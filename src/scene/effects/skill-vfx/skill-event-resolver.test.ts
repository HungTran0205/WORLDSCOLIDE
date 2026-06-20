/**
 * resolveSkillEvent unit test — the self-cast generalization. Verifies each
 * event type maps to the right caster/victim/trigger so buffs and stances (which
 * never emit `skill-use`) can drive their own cue sheets.
 */

import { describe, it, expect } from 'vitest';
import { resolveSkillEvent } from './skill-event-resolver';
import type { CombatEvent } from '@/game/systems/combat-types';

describe('resolveSkillEvent', () => {
  it('maps skill-use → caster=attacker, victim=target', () => {
    const ev: CombatEvent = { type: 'skill-use', attackerId: 'a', targetId: 't', damage: 5, skillName: 'Cleave' };
    expect(resolveSkillEvent(ev)).toEqual({ casterId: 'a', victimId: 't', trigger: 'skill-use' });
  });

  it('maps skill-buff-applied → caster=casterId, no victim (self/team anchor on caster)', () => {
    const ev: CombatEvent = { type: 'skill-buff-applied', casterId: 'c', buffEffect: 'damage-up', scope: 'self', durationMs: 4000 };
    expect(resolveSkillEvent(ev)).toEqual({ casterId: 'c', victimId: null, trigger: 'skill-buff-applied' });
  });

  it('maps effect-applied:riposte → caster=victim=targetId (self-cast)', () => {
    const ev: CombatEvent = { type: 'effect-applied', targetId: 'self', effect: 'riposte', casterId: 'self' };
    expect(resolveSkillEvent(ev)).toEqual({ casterId: 'self', victimId: 'self', trigger: 'effect-applied:riposte' });
  });

  it('ignores non-riposte effect-applied (e.g. stunned)', () => {
    const ev: CombatEvent = { type: 'effect-applied', targetId: 't', effect: 'stunned' };
    expect(resolveSkillEvent(ev)).toBeNull();
  });

  it('ignores unrelated events (auto-attack, death)', () => {
    expect(resolveSkillEvent({ type: 'auto-attack', attackerId: 'a', targetId: 't', damage: 3 })).toBeNull();
    expect(resolveSkillEvent({ type: 'death', entityId: 'x' })).toBeNull();
  });
});
