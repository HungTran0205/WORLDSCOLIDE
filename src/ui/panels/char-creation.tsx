/**
 * Character creation screen — choose civ, name founder, distribute stats, name guild.
 * Accepts slotId + onComplete callback; parent handles save + navigation.
 */

import { useState } from 'react';
import { useGameStore } from '@/game/state/store';
import { createFounder } from '@/game/systems/character-creation';
import { STAT_KEYS, INITIAL_STAT_POINTS, createEmptyStats } from '@/game/systems/stat-allocation';
import { initAudio, playBGM } from '@/audio/audio-manager';
import { AUDIO } from '@/audio/audio-keys';
import { CivSelector } from '@/ui/components/civ-selector';
import type { Civilization } from '@/game/data/civilization-config';
import type { Stats, StatKey } from '@/game/state/game-state';
import '@/ui/styles/panels.css';

interface CharCreationProps {
  slotId: number;
  onComplete: () => void;
}

export function CharCreation({ onComplete }: CharCreationProps) {
  const setFounder = useGameStore((s) => s.setFounder);
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);
  const setGuildName = useGameStore((s) => s.setGuildName);

  const [selectedCiv, setSelectedCiv] = useState<Civilization | null>(null);
  const [name, setName] = useState('');
  const [guildName, setGuildNameLocal] = useState('');
  const [stats, setStats] = useState<Stats>(createEmptyStats());

  const allocated = STAT_KEYS.reduce((sum, k) => sum + stats[k], 0);
  const remaining = INITIAL_STAT_POINTS - allocated;

  const handleAllocate = (stat: StatKey, delta: number) => {
    setStats((prev) => {
      const newVal = prev[stat] + delta;
      if (newVal < 0) return prev;
      const newAllocated = allocated + delta;
      if (newAllocated > INITIAL_STAT_POINTS) return prev;
      return { ...prev, [stat]: newVal };
    });
  };

  const handleConfirm = () => {
    if (!name.trim() || remaining > 0 || !selectedCiv) return;
    const founder = createFounder(name.trim(), stats, selectedCiv);
    setFounder(founder);
    if (guildName.trim()) setGuildName(guildName.trim());
    setTutorialStep('arrival-alarm');

    initAudio();
    playBGM(AUDIO.BGM_GUILD);
    onComplete();
  };

  return (
    <div className="char-creation-overlay">
      <h1>Worlds Collide</h1>
      <p style={{ marginBottom: 16, color: '#aaa' }}>Choose your civilization</p>

      <CivSelector selectedCiv={selectedCiv} onSelect={setSelectedCiv} />

      {selectedCiv && (
        <>
          <div style={{ marginTop: 20, display: 'flex', gap: 12, maxWidth: 600, width: '100%' }}>
            <input
              type="text" placeholder="Character name"
              value={name} onChange={(e) => setName(e.target.value)} maxLength={20}
              style={{ flex: 1 }}
            />
            <input
              type="text" placeholder="Guild name"
              value={guildName} onChange={(e) => setGuildNameLocal(e.target.value)} maxLength={24}
              style={{ flex: 1 }}
            />
          </div>

          <p style={{ margin: '12px 0', color: remaining > 0 ? '#ffd700' : '#4caf50' }}>
            Points remaining: {remaining}
          </p>

          <div className="stat-allocation-grid">
            {STAT_KEYS.map((stat) => (
              <StatRow
                key={stat} stat={stat} value={stats[stat]}
                canAdd={remaining > 0} canAdd5={remaining >= 5}
                onAdd={() => handleAllocate(stat, 1)}
                onAdd5={() => handleAllocate(stat, 5)}
                onRemove={() => handleAllocate(stat, -1)}
              />
            ))}
          </div>

          <button
            className="panel-btn"
            style={{ maxWidth: 300, marginTop: 24 }}
            disabled={!name.trim() || remaining > 0}
            onClick={handleConfirm}
          >
            Begin Adventure
          </button>
        </>
      )}
    </div>
  );
}

function StatRow({ stat, value, canAdd, canAdd5, onAdd, onAdd5, onRemove }: {
  stat: StatKey; value: number;
  canAdd: boolean; canAdd5: boolean;
  onAdd: () => void; onAdd5: () => void; onRemove: () => void;
}) {
  return (
    <>
      <span>{stat}</span>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
        <div style={{ width: `${Math.min(100, value)}%`, height: '100%', background: '#ffd700', borderRadius: 3 }} />
      </div>
      <span style={{ textAlign: 'center' }}>{value}</span>
      <div style={{ display: 'flex', gap: 2 }}>
        <button disabled={value <= 0} onClick={onRemove}>-</button>
        <button disabled={!canAdd} onClick={onAdd}>+</button>
        <button disabled={!canAdd5} onClick={onAdd5}>+5</button>
      </div>
    </>
  );
}
