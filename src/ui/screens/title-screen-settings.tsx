/**
 * Title screen settings overlay — minimal form for BGM/SFX volume,
 * language (en/vi), and graphics quality. Volume/graphics persist via
 * `useGameStore` (same source-of-truth as the in-game settings panel) so
 * values survive across title <-> game transitions and reloads.
 *
 * Language is a device-level preference (one language across all save slots),
 * handled by the shared `useLanguage` hook (localStorage + i18n) — not part of
 * the saved game payload.
 */

import { useGameStore } from '@/game/state/store';
import { graphicsTierFlags } from '@/game/state/guild-slice';
import { setMusicVolume, setSFXVolume, playSFX } from '@/audio/audio-manager';
import { AUDIO } from '@/audio/audio-keys';
import { useLanguage } from '@/i18n/use-language';

interface TitleScreenSettingsProps {
  onBack: () => void;
}

export function TitleScreenSettings({ onBack }: TitleScreenSettingsProps) {
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const { language, setLanguage } = useLanguage();

  const handleMusicVolume = (vol: number) => {
    updateSettings({ musicVolume: vol });
    setMusicVolume(vol);
  };

  const handleSFXVolume = (vol: number) => {
    updateSettings({ sfxVolume: vol });
    setSFXVolume(vol);
  };

  // Preview SFX at new volume on slider release (avoids machine-gun playback
  // during drag where onChange fires 10-20x/sec).
  const handleSFXPreview = () => playSFX(AUDIO.SFX_CLICK);

  const handleGraphics = (q: 'high' | 'low') => {
    if (q === settings.graphicsQuality) return;
    // Cascade all dependent flags (bloom, atmospheric, shadows) so the
    // in-game scene matches the tier without needing a manual re-toggle.
    updateSettings(graphicsTierFlags(q));
  };

  return (
    <div className="title-save-picker title-settings">
      <header className="title-save-picker__header">
        <button
          className="title-save-picker__back"
          onClick={onBack}
          aria-label="Back to main menu"
        >
          ‹ Back
        </button>
        <h2 className="title-save-picker__heading">Settings</h2>
      </header>

      <div className="title-settings__group">
        <label htmlFor="title-bgm-vol">
          Music Volume <span className="title-settings__value">{Math.round(settings.musicVolume * 100)}%</span>
        </label>
        <input
          id="title-bgm-vol" type="range" min="0" max="1" step="0.05"
          value={settings.musicVolume}
          onChange={(e) => handleMusicVolume(Number(e.target.value))}
        />
      </div>

      <div className="title-settings__group">
        <label htmlFor="title-sfx-vol">
          SFX Volume <span className="title-settings__value">{Math.round(settings.sfxVolume * 100)}%</span>
        </label>
        <input
          id="title-sfx-vol" type="range" min="0" max="1" step="0.05"
          value={settings.sfxVolume}
          onChange={(e) => handleSFXVolume(Number(e.target.value))}
          onPointerUp={handleSFXPreview}
          onKeyUp={handleSFXPreview}
        />
      </div>

      <div className="title-settings__group">
        <label>Language</label>
        <div className="title-settings__radio-group" role="radiogroup" aria-label="Language">
          <button
            type="button"
            role="radio"
            aria-checked={language === 'en'}
            className={`title-settings__radio${language === 'en' ? ' title-settings__radio--active' : ''}`}
            onClick={() => setLanguage('en')}
          >English</button>
          <button
            type="button"
            role="radio"
            aria-checked={language === 'vi'}
            className={`title-settings__radio${language === 'vi' ? ' title-settings__radio--active' : ''}`}
            onClick={() => setLanguage('vi')}
          >Tiếng Việt</button>
        </div>
      </div>

      <div className="title-settings__group">
        <label>Graphics Quality</label>
        <div className="title-settings__radio-group" role="radiogroup" aria-label="Graphics quality">
          <button
            type="button"
            role="radio"
            aria-checked={settings.graphicsQuality === 'high'}
            className={`title-settings__radio${settings.graphicsQuality === 'high' ? ' title-settings__radio--active' : ''}`}
            onClick={() => handleGraphics('high')}
          >High</button>
          <button
            type="button"
            role="radio"
            aria-checked={settings.graphicsQuality === 'low'}
            className={`title-settings__radio${settings.graphicsQuality === 'low' ? ' title-settings__radio--active' : ''}`}
            onClick={() => handleGraphics('low')}
          >Low</button>
        </div>
        <p className="title-settings__hint">
          Low disables shadows, bloom &amp; atmospheric effects. Applied on next game load.
        </p>
      </div>
    </div>
  );
}
