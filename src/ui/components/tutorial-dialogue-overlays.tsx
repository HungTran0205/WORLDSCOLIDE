/** Tutorial dialogue overlays — Kael rescue and reward splash, shown after tutorial quest completes. */

import { useGameStore } from '@/game/state/store';

/** Shown at step 'kael-rescue' — rescue narrative + confirm */
export function KaelRescueDialogue() {
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);

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
        <h3 style={{ color: '#ffd700' }}>Kael Rescued!</h3>
        <p style={{ lineHeight: 1.6, fontSize: '0.9rem', margin: '16px 0' }}>
          With the moonbear driven off, you pull a young LinhSon warrior from the wreckage — battered but alive.
        </p>
        <p style={{ lineHeight: 1.6, fontSize: '0.9rem', fontStyle: 'italic', color: '#c8b080' }}>
          "You saved my life. I was tracking that tremor when the beast ambushed me.
          Let me repay you — I'll join your guild."
        </p>
        <p style={{ fontSize: '0.85rem', color: '#aaa', marginTop: 12 }}>
          Kael has joined your guild!
        </p>
        <button className="panel-btn" style={{ marginTop: 16 }}
          onClick={() => setTutorialStep('reward-splash')}>
          Welcome aboard
        </button>
      </div>
    </div>
  );
}

/** Shown at step 'reward-splash' — displays LOGGING_SITE_ACCESS reward */
export function TutorialRewardSplash() {
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);

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
        <h3 style={{ color: '#ffd700' }}>Reward Received</h3>
        <p style={{ lineHeight: 1.6, fontSize: '0.9rem', margin: '16px 0' }}>
          Kael hands you a weathered document.
        </p>
        <div style={{
          padding: 12, background: 'rgba(255,215,0,0.08)',
          border: '1px solid rgba(255,215,0,0.2)', borderRadius: 8, margin: '12px 0',
        }}>
          <strong style={{ color: '#ffd700' }}>Logging Site Access</strong>
          <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: 4 }}>
            A worn permit from the Forester's Guild. Build a Logging Site for free.
          </div>
        </div>
        <button className="panel-btn" style={{ marginTop: 12 }}
          onClick={() => setTutorialStep('build-logging-site')}>
          Continue
        </button>
      </div>
    </div>
  );
}
