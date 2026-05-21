/** World Board modal — single trimmed lore page shown at the start of every new game.
 *  Long lore moves to a codex later (GDD §12.2). Rendered during the 'arrival-alarm'
 *  beat; "Begin" hands off (via onBegin) to the messenger alarm in game-screen. */

interface WorldBoardModalProps {
  /** Called when the player presses "Begin" — game-screen then shows the NPC alarm. */
  onBegin: () => void;
}

const TITLE = 'A World Divided';
const BODY = `Three civilizations carve this land in uneasy silence — the mountain warriors of Linh Sơn, the steel-and-steam empire of Đế Quốc, and the star-reading nomads of Thiên Lữ. They trust no one but their own.

You hold a charter to found a guild on neutral ground, open to fighters of every banner. Someone has to build the bridge. That begins with you.`;

export function WorldBoardModal({ onBegin }: WorldBoardModalProps) {
  const handleBegin = onBegin;

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
        <h2 style={{ color: '#ffd700', marginBottom: 16 }}>{TITLE}</h2>
        <p style={{ whiteSpace: 'pre-line', lineHeight: 1.6, fontSize: '0.95rem' }}>
          {BODY}
        </p>
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
          <button className="panel-btn" onClick={handleBegin}>Begin</button>
        </div>
      </div>
    </div>
  );
}
