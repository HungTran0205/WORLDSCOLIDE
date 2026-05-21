/**
 * Title screen credits overlay — static list of contributors, tools, and thanks.
 * Scrollable when content exceeds viewport height.
 */

import { useTranslation } from 'react-i18next';

interface CreditEntry {
  role: string;
  name: string;
}

const CREDITS: CreditEntry[] = [
  { role: 'Game Design & Programming', name: 'HungTran' },
  { role: 'Art Direction', name: 'HungTran' },
  { role: 'Story writter', name: 'HungTran' },
  { role: '3D Modeling', name: 'HungTran' },
  { role: '2D Modeling', name: 'PixelLab AI + custom' },
  { role: 'Concept Art', name: 'Nano Banana + Imagen' },
  { role: '', name: '' },
  { role: 'Built with', name: 'React • R3F • Three.js • Vite • Zustand' },
  { role: 'Engine', name: 'WebGPU + WebGL fallback' },
  { role: '', name: '' },
  { role: 'Special Thanks', name: 'Claude Code (Anthropic)' },
];

interface TitleScreenCreditsProps {
  onBack: () => void;
}

export function TitleScreenCredits({ onBack }: TitleScreenCreditsProps) {
  const { t } = useTranslation();

  return (
    <div className="title-save-picker title-credits">
      <header className="title-save-picker__header">
        <button
          className="title-save-picker__back"
          onClick={onBack}
          aria-label={t('credits.backAria')}
        >
          {t('credits.back')}
        </button>
        <h2 className="title-save-picker__heading">{t('credits.heading')}</h2>
      </header>

      <div className="title-credits__list">
        {CREDITS.map((entry, i) => (
          <div key={i} className="title-credits__entry">
            {entry.role && <span className="title-credits__role">{entry.role}</span>}
            {entry.name && <span className="title-credits__name">{entry.name}</span>}
          </div>
        ))}

        <p className="title-credits__footer">
          {t('credits.footer')}
        </p>
      </div>
    </div>
  );
}
