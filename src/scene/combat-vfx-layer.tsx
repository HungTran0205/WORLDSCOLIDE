/**
 * VFX layer — manages floating damage numbers spawned from combat events.
 * Reads recentEvents from store, diffs against previous to avoid duplicates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '@/game/state/store';
import { DamageNumber } from './combat-damage-number';
import type { CombatEvent } from '@/game/systems/combat-types';

interface ActiveDamageNumber {
  id: number;
  position: { x: number; z: number };
  damage: number;
  isCrit?: boolean;
  isHeal?: boolean;
  isPoison?: boolean;
}

let nextId = 0;

export function CombatVfxLayer() {
  const recentEvents = useGameStore(s => s.recentEvents);
  const entities = useGameStore(s => s.arenaEntities);
  const [numbers, setNumbers] = useState<ActiveDamageNumber[]>([]);
  const prevEventsRef = useRef<CombatEvent[]>([]);

  useEffect(() => {
    if (recentEvents === prevEventsRef.current || recentEvents.length === 0) return;
    prevEventsRef.current = recentEvents;

    const newNumbers: ActiveDamageNumber[] = [];
    for (const event of recentEvents) {
      if (event.type === 'auto-attack' || event.type === 'skill-use') {
        const target = entities.find(e => e.id === event.targetId);
        if (target) {
          const offsetX = (Math.random() - 0.5) * 0.5;
          newNumbers.push({
            id: nextId++,
            position: { x: target.position.x + offsetX, z: target.position.z },
            damage: event.damage,
            isCrit: event.isCrit,
          });
        }
      }
      if (event.type === 'effect-tick') {
        const target = entities.find(e => e.id === event.targetId);
        if (target) {
          newNumbers.push({
            id: nextId++,
            position: { x: target.position.x, z: target.position.z },
            damage: event.damage,
            isPoison: event.effect === 'poison',
          });
        }
      }
      if (event.type === 'heal') {
        const target = entities.find(e => e.id === event.targetId);
        if (target) {
          newNumbers.push({
            id: nextId++,
            position: { x: target.position.x, z: target.position.z },
            damage: event.amount,
            isHeal: true,
          });
        }
      }
    }

    if (newNumbers.length > 0) {
      setNumbers(prev => [...prev.slice(-20), ...newNumbers]); // cap at ~20
    }
  }, [recentEvents, entities]);

  const handleExpired = useCallback((id: number) => {
    setNumbers(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <group>
      {numbers.map(n => (
        <DamageNumber
          key={n.id}
          position={n.position}
          damage={n.damage}
          isCrit={n.isCrit}
          isHeal={n.isHeal}
          isPoison={n.isPoison}
          onExpired={() => handleExpired(n.id)}
        />
      ))}
    </group>
  );
}
