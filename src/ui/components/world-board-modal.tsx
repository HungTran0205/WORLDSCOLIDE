/** World Board modal — single trimmed lore page shown at the start of every new game.
 *  Long lore moves to a codex later (GDD §12.2). Rendered during the 'arrival-alarm'
 *  beat; "Begin" hands off (via onBegin) to the messenger alarm in game-screen. */

import { tContent } from '@/i18n/content-localization';

interface WorldBoardModalProps {
  /** Called when the player presses "Begin" — game-screen then shows the NPC alarm. */
  onBegin: () => void;
}

const EN_TITLE = 'A World Divided';
const EN_BODY =
  `Civilizations carve this land in uneasy silence — the mountain warriors of Linh Sơn, The Republic Empire of steel-and-steam, the star-reading nomads of Astopia, and The holy state of Eliza. They trust no one but their own.\n\nYou hold a charter to found a guild on neutral ground, open to fighters of every banner. Someone has to build the bridge. That begins with you.`;
const EN_BEGIN = 'Begin';

export function WorldBoardModal({ onBegin }: WorldBoardModalProps) {
  const title = tContent('dialog', 'world-board', 'title', EN_TITLE);
  const body = tContent('dialog', 'world-board', 'body', EN_BODY);
  const beginLabel = tContent('dialog', 'world-board', 'begin', EN_BEGIN);

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
        <h2 style={{ color: '#ffd700', marginBottom: 16 }}>{title}</h2>
        <p style={{ whiteSpace: 'pre-line', lineHeight: 1.6, fontSize: '0.95rem' }}>
          {body}
        </p>
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
          <button className="panel-btn" onClick={onBegin}>{beginLabel}</button>
        </div>
      </div>
    </div>
  );
}
