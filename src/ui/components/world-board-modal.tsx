/** World Board modal — 2-page lore intro shown at the start of every new game. */

import { useState } from 'react';
import { useGameStore } from '@/game/state/store';

const PAGES = [
  {
    title: 'A World Divided',
    body: `Three great civilizations carve this land in uneasy silence.\n\nLinh Sơn — ancient mountain warriors, unyielding as stone, loyal to their ancestors above all else.\n\nĐế Quốc — a reborn empire of steel, steam, and electric ambition, always reaching for more.\n\nThiên Lữ — nomadic mystics who read the stars as maps, as swift and untethered as the wind.\n\nThey do not trust each other. But a darkness stirs below — and none can face it alone.`,
  },
  {
    title: 'Your Guild',
    body: `You have been granted a charter to found a guild — a neutral ground, open to warriors of every civilization.\n\nRecruit fighters, dispatch them into a fractured world, expand your hall, and forge bonds across old borders.\n\nSomeone has to build the bridge. That begins with you.`,
  },
];

export function WorldBoardModal() {
  const [page, setPage] = useState(0);
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);

  const isLast = page === PAGES.length - 1;

  const handleNext = () => {
    if (isLast) {
      setTutorialStep('tutorial-quest-dispatch');
    } else {
      setPage((p) => p + 1);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        maxWidth: 520, padding: 32, background: '#1a1208',
        border: '2px solid rgba(255,215,0,0.3)', borderRadius: 12,
        color: '#e8d5b0', textAlign: 'center',
      }}>
        <h2 style={{ color: '#ffd700', marginBottom: 16 }}>{PAGES[page].title}</h2>
        <p style={{ whiteSpace: 'pre-line', lineHeight: 1.6, fontSize: '0.95rem' }}>
          {PAGES[page].body}
        </p>
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 12 }}>
          {page > 0 && (
            <button className="panel-btn" onClick={() => setPage((p) => p - 1)}>Back</button>
          )}
          <button className="panel-btn" onClick={handleNext}>
            {isLast ? 'Begin' : 'Next'}
          </button>
        </div>
        <div style={{ marginTop: 12, fontSize: '0.75rem', color: '#888' }}>
          {page + 1} / {PAGES.length}
        </div>
      </div>
    </div>
  );
}
