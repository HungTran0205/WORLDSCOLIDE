/**
 * Settings panel — audio controls, save operations, return to title.
 * Uses new multi-slot save system.
 */

import { useState } from 'react';
import { useGameStore } from '@/game/state/store';
import { setMusicVolume, setSFXVolume, setMute } from '@/audio/audio-manager';
import { saveManager } from '@/game/save/save-manager';
import { saveSlot } from '@/game/save/save-storage';
import { deleteSlot } from '@/game/save/save-storage';
import '@/ui/styles/panels.css';

interface SettingsPanelProps {
  onClose: () => void;
  onReturnToTitle: () => void;
}

export function SettingsPanel({ onClose, onReturnToTitle }: SettingsPanelProps) {
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleQuality = async (q: 'high' | 'low') => {
    if (q === settings.graphicsQuality) return;
    updateSettings({ graphicsQuality: q });
    // Save first so progress isn't lost on reload
    await saveManager.save(() => useGameStore.getState() as unknown as Record<string, unknown>, true);
    window.location.reload();
  };

  const handleMusicVolume = (vol: number) => {
    updateSettings({ musicVolume: vol });
    setMusicVolume(vol);
  };

  const handleSFXVolume = (vol: number) => {
    updateSettings({ sfxVolume: vol });
    setSFXVolume(vol);
  };

  const handleSave = () => {
    saveManager.save(() => useGameStore.getState() as unknown as Record<string, unknown>, true);
  };

  const handleExport = () => {
    const slotId = saveManager.getActiveSlot();
    if (slotId) saveManager.exportToFile(slotId);
  };

  const handleImport = () => {
    setImportError(null);
    setImportSuccess(false);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const result = await saveManager.importFromFile(file);
      if (!result.ok) {
        setImportError(result.errors.join(', '));
        return;
      }
      // Hydrate store with imported data
      const slotId = saveManager.getActiveSlot();
      if (slotId) {
        result.data.metadata.slotId = slotId;
        await saveSlot(slotId, result.data);
      }
      useGameStore.setState(result.data.gameState as unknown as Parameters<typeof useGameStore.setState>[0], true);
      setImportSuccess(true);
    };
    input.click();
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    const slotId = saveManager.getActiveSlot();
    if (slotId) deleteSlot(slotId);
    onReturnToTitle();
  };

  return (
    <div className="panel-overlay">
      <h2>
        Settings
        <button className="panel-close-btn" onClick={onClose}>Close</button>
      </h2>

      <div className="panel-section">
        <label style={{ display: 'block', marginBottom: 8 }}>
          Music: {Math.round(settings.musicVolume * 100)}%
          <input
            type="range" min="0" max="1" step="0.05"
            value={settings.musicVolume}
            onChange={(e) => handleMusicVolume(Number(e.target.value))}
          />
        </label>
        <label style={{ display: 'block' }}>
          SFX: {Math.round(settings.sfxVolume * 100)}%
          <input
            type="range" min="0" max="1" step="0.05"
            value={settings.sfxVolume}
            onChange={(e) => handleSFXVolume(Number(e.target.value))}
          />
        </label>
        <button className="panel-btn" onClick={() => setMute(true)} style={{ marginTop: 8 }}>
          Mute All
        </button>
      </div>

      <div className="panel-section">
        <div style={{ marginBottom: 6 }}>Graphics Quality</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['high', 'low'] as const).map((q) => (
            <button
              key={q}
              className="panel-btn"
              style={{
                borderColor: settings.graphicsQuality === q ? '#4caf50' : undefined,
                opacity: settings.graphicsQuality === q ? 1 : 0.6,
              }}
              onClick={() => handleQuality(q)}
            >
              {q === 'high' ? 'High' : 'Low'}
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <button className="panel-btn" onClick={handleSave}>Save Game</button>
        <button className="panel-btn" onClick={handleExport}>Export Save</button>
        <button className="panel-btn" onClick={handleImport}>Import Save</button>
        {importError && (
          <div style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: 6 }}>{importError}</div>
        )}
        {importSuccess && (
          <div style={{ color: '#4caf50', fontSize: '0.8rem', marginTop: 6 }}>Import successful</div>
        )}
      </div>

      <div className="panel-section">
        <button className="panel-btn" onClick={onReturnToTitle}>Return to Title</button>
        <button
          className="panel-btn"
          style={{ borderColor: confirmReset ? '#e74c3c' : undefined }}
          onClick={handleReset}
        >
          {confirmReset ? 'Confirm Reset?' : 'Reset Game'}
        </button>
      </div>
    </div>
  );
}
