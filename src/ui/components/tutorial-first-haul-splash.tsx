/**
 * Tutorial first-haul splash — shown after Kael is assigned to the logging site and
 * the scripted +200 wood / +200 gold haul is granted (see tutorial-first-haul-handler).
 * Built in Phase 03; Phase 06 mounts it in game-screen keyed off the first-haul step.
 */

import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import { tContent } from '@/i18n/content-localization';
import { getNextStep } from '@/game/systems/tutorial-manager';
import { FIRST_HAUL_WOOD, FIRST_HAUL_GOLD } from '@/game/systems/tutorial-first-haul-handler';

export function TutorialFirstHaulSplash() {
  const { t } = useTranslation();
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);

  function handleContinue() {
    const next = getNextStep(tutorialStep);
    if (next) setTutorialStep(next);
  }

  const title = tContent('tutorial', 'first-haul', 'title', 'First Haul!');
  const body  = tContent('tutorial', 'first-haul', 'body',
    'Kael shoulders his axe and brings in the first load from the forest.');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        maxWidth: 420, padding: 28, background: '#1a1208',
        border: '2px solid rgba(255,215,0,0.3)', borderRadius: 12,
        color: '#e8d5b0', textAlign: 'center',
      }}>
        <h3 style={{ color: '#ffd700' }}>{title}</h3>
        <p style={{ lineHeight: 1.6, fontSize: '0.9rem', margin: '16px 0' }}>
          {body}
        </p>
        <div style={{
          padding: 12, background: 'rgba(255,215,0,0.08)',
          border: '1px solid rgba(255,215,0,0.2)', borderRadius: 8, margin: '12px 0',
          display: 'flex', justifyContent: 'center', gap: 24,
        }}>
          <strong style={{ color: '#ffd700' }}>+{FIRST_HAUL_WOOD} Wood</strong>
          <strong style={{ color: '#ffd700' }}>+{FIRST_HAUL_GOLD} Gold</strong>
        </div>
        <button className="panel-btn" style={{ marginTop: 12 }} onClick={handleContinue}>
          {t('charCreation.continue')}
        </button>
      </div>
    </div>
  );
}
