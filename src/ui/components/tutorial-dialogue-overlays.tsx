/** Tutorial dialogue overlays — Kael rescue and reward splash, shown after tutorial quest completes. */

import { useGameStore } from '@/game/state/store';
import { tContent } from '@/i18n/content-localization';

/** Shown at step 'kael-rescue' — rescue narrative + confirm */
export function KaelRescueDialogue() {
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);

  const title  = tContent('dialog', 'kael-rescue', 'title', 'Kael Rescued!');
  const body   = tContent('dialog', 'kael-rescue', 'body',
    'With the moonbear driven off, you pull a young LinhSon warrior from the wreckage — battered but alive.');
  const quote  = tContent('dialog', 'kael-rescue', 'quote',
    '"You saved my life. After that strange tremor, the beast gone wild and attacked the village, this never happened before.\nLet me repay you — I\'ll join your guild."');
  const joined = tContent('dialog', 'kael-rescue', 'joined', 'Kael has joined your guild!');
  const cta    = tContent('dialog', 'kael-rescue', 'cta', 'Welcome aboard');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        maxWidth: 480, padding: 28, background: '#1a1208',
        border: '2px solid rgba(255,215,0,0.3)', borderRadius: 12,
        color: '#e8d5b0', textAlign: 'center',
      }}>
        <h3 style={{ color: '#ffd700' }}>{title}</h3>
        <p style={{ lineHeight: 1.6, fontSize: '0.9rem', margin: '16px 0' }}>
          {body}
        </p>
        <p style={{ lineHeight: 1.6, fontSize: '0.9rem', fontStyle: 'italic', color: '#c8b080', whiteSpace: 'pre-line' }}>
          {quote}
        </p>
        <p style={{ fontSize: '0.85rem', color: '#aaa', marginTop: 12 }}>
          {joined}
        </p>
        <button className="panel-btn" style={{ marginTop: 16 }}
          onClick={() => setTutorialStep('reward-splash')}>
          {cta}
        </button>
      </div>
    </div>
  );
}

/** Shown at step 'reward-splash' — displays LOGGING_SITE_ACCESS reward */
export function TutorialRewardSplash() {
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);

  const title    = tContent('dialog', 'reward-splash', 'title', 'Reward Received');
  const body     = tContent('dialog', 'reward-splash', 'body', 'Kael hands you a weathered document.');
  const itemName = tContent('dialog', 'reward-splash', 'itemName', 'Logging Site Access');
  const itemDesc = tContent('dialog', 'reward-splash', 'itemDesc',
    "A worn permit from the Forester's Guild. Build a Logging Site for free.");
  const cta      = tContent('dialog', 'reward-splash', 'cta', 'Continue');

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
        }}>
          <strong style={{ color: '#ffd700' }}>{itemName}</strong>
          <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: 4 }}>
            {itemDesc}
          </div>
        </div>
        <button className="panel-btn" style={{ marginTop: 12 }}
          onClick={() => setTutorialStep('build-logging-site')}>
          {cta}
        </button>
      </div>
    </div>
  );
}
