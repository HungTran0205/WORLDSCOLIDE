/**
 * Settings panel — audio controls, save operations, return to title.
 * Shell (chrome, header, close button, animation, SFX) is owned by PanelFrame.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import { useUiStore } from '@/game/state/ui-store';
import { graphicsTierFlags } from '@/game/state/guild-slice';
import { setMusicVolume, setSFXVolume, setMute } from '@/audio/audio-manager';
import { saveManager } from '@/game/save/save-manager';
import { saveSlot } from '@/game/save/save-storage';
import { deleteSlot } from '@/game/save/save-storage';
import { useLanguage } from '@/i18n/use-language';
import { PanelFrame } from '@/ui/components/panel-frame';
import '@/ui/styles/panels.css';
import '@/ui/styles/settings-panel.css';

interface SettingsPanelProps {
  onClose: () => void;
  onReturnToTitle: () => void;
}

export function SettingsPanel({ onClose, onReturnToTitle }: SettingsPanelProps) {
  const { t } = useTranslation();
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const { language, setLanguage } = useLanguage();
  const resetTutorials = useUiStore((s) => s.resetTutorials);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [tutorialsReset, setTutorialsReset] = useState(false);

  const handleQuality = async (q: 'high' | 'low') => {
    if (q === settings.graphicsQuality) return;
    updateSettings(graphicsTierFlags(q));
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
    <div className="settings-positioner">
      <PanelFrame title={t('facilityNames.settings')} onClose={onClose} variant="modal">
        <div className="panel-section">
          <label style={{ display: 'block', marginBottom: 8 }}>
            {t('settings.music', { pct: Math.round(settings.musicVolume * 100) })}
            <input
              type="range" min="0" max="1" step="0.05"
              value={settings.musicVolume}
              onChange={(e) => handleMusicVolume(Number(e.target.value))}
            />
          </label>
          <label style={{ display: 'block' }}>
            {t('settings.sfx', { pct: Math.round(settings.sfxVolume * 100) })}
            <input
              type="range" min="0" max="1" step="0.05"
              value={settings.sfxVolume}
              onChange={(e) => handleSFXVolume(Number(e.target.value))}
            />
          </label>
          <button className="panel-btn" onClick={() => setMute(true)} style={{ marginTop: 8 }}>
            {t('settings.muteAll')}
          </button>
        </div>

        <div className="panel-section">
          <div style={{ marginBottom: 6 }}>{t('settings.graphicsQuality')}</div>
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
                {q === 'high' ? t('settings.qualityHigh') : t('settings.qualityLow')}
              </button>
            ))}
          </div>

          {/* Shadows + Bloom controls removed: shadows crash the WebGPU pipeline
              (samplers exceed per-stage limit) and bloom is now implicit in the
              graphics tier above. Tier preset cascades both flags. */}
        </div>

        <div className="panel-section">
          <div style={{ marginBottom: 6 }}>{t('settings.language')}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['en', 'vi'] as const).map((lng) => (
              <button
                key={lng}
                className="panel-btn"
                style={{
                  borderColor: language === lng ? '#4caf50' : undefined,
                  opacity: language === lng ? 1 : 0.6,
                }}
                onClick={() => setLanguage(lng)}
              >
                {lng === 'en' ? t('settings.langEn') : t('settings.langVi')}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-section">
          <button className="panel-btn" onClick={handleSave}>{t('settings.saveGame')}</button>
          <button className="panel-btn" onClick={handleExport}>{t('settings.exportSave')}</button>
          <button className="panel-btn" onClick={handleImport}>{t('settings.importSave')}</button>
          {importError && (
            <div style={{ color: '#e74c3c', fontSize: '0.8rem', marginTop: 6 }}>{importError}</div>
          )}
          {importSuccess && (
            <div style={{ color: '#4caf50', fontSize: '0.8rem', marginTop: 6 }}>{t('settings.importSuccess')}</div>
          )}
        </div>

        <div className="panel-section">
          <button
            className="panel-btn"
            onClick={() => { resetTutorials(); setTutorialsReset(true); }}
          >
            {t('settings.resetTutorials')}
          </button>
          {tutorialsReset && (
            <div style={{ color: '#4caf50', fontSize: '0.8rem', marginTop: 6 }}>
              {t('settings.tutorialsResetHint')}
            </div>
          )}
        </div>

        <div className="panel-section">
          <button className="panel-btn" onClick={onReturnToTitle}>{t('settings.returnToTitle')}</button>
          <button
            className="panel-btn"
            style={{ borderColor: confirmReset ? '#e74c3c' : undefined }}
            onClick={handleReset}
          >
            {confirmReset ? t('settings.confirmReset') : t('settings.resetGame')}
          </button>
        </div>
      </PanelFrame>
    </div>
  );
}
