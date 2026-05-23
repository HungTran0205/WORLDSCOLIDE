/**
 * Story dialog overlay — click/Esc-advanced narrative lines, used for both
 * pre-arrival (inside ArrivalModal) and post-combat (inside CombatPanel)
 * story beats. Language-aware (VN/EN); no portrait asset for the MVP.
 *
 * Click anywhere or press Enter/Space advances to the next line; the final
 * advance (and Escape) calls `onDone`. The overlay stops click propagation so
 * it never triggers a parent modal's backdrop-close handler.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DialogLine } from '@/game/state/game-state';

interface StoryDialogOverlayProps {
  lines: DialogLine[];
  onDone: () => void;
}

const OVERLAY_STYLE: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  padding: '0 24px 48px',
  background: 'rgba(0, 0, 0, 0.55)',
  cursor: 'pointer',
};

const BOX_STYLE: React.CSSProperties = {
  position: 'relative',
  width: 'min(620px, 92vw)',
  background: 'linear-gradient(180deg, rgba(28,24,18,0.97), rgba(16,14,10,0.97))',
  border: '1px solid #c9a14a',
  borderRadius: 8,
  padding: '16px 18px 22px',
  color: '#ece3cf',
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  boxShadow: '0 8px 28px rgba(0,0,0,0.5)',
};

export function StoryDialogOverlay({ lines, onDone }: StoryDialogOverlayProps) {
  const { i18n } = useTranslation();
  const [currentLine, setCurrentLine] = useState(0);
  const isVN = i18n.language === 'vi';

  const advance = () =>
    setCurrentLine((l) => {
      if (l < lines.length - 1) return l + 1;
      onDone();
      return l;
    });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance(); }
      else if (e.key === 'Escape') { e.preventDefault(); onDone(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // Listener uses functional setState + stable onDone; safe to bind once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines.length]);

  const line = lines[currentLine];
  if (!line) return null;
  const speaker = isVN ? line.speakerNameVN : line.speakerNameEN;
  const text = isVN ? line.textVN : line.textEN;

  return (
    <div style={OVERLAY_STYLE} onClick={(e) => { e.stopPropagation(); advance(); }} role="presentation">
      <div style={BOX_STYLE}>
        <div style={{ color: '#ffd700', fontWeight: 700, marginBottom: 6, letterSpacing: '0.02em' }}>{speaker}</div>
        <div style={{ fontSize: '0.95rem', lineHeight: 1.55, color: '#ece3cf' }}>{text}</div>
        <div style={{ position: 'absolute', right: 14, bottom: 6, fontSize: '0.75rem', color: '#9a8a6a' }}>
          ▶ {currentLine + 1}/{lines.length}
        </div>
      </div>
    </div>
  );
}
