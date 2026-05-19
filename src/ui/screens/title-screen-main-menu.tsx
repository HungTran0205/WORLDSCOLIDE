/**
 * Title-screen main menu — 6-item vertical list shown over the diorama.
 *
 * Continue is enabled only when at least one save slot is populated; it
 * routes to the most-recently-updated slot. New Game / Load Game open the
 * save-picker submenu. Settings / Credits open their overlays. Quit is
 * hidden on web (no native API to close a tab cleanly).
 */

interface TitleScreenMainMenuProps {
  hasContinue: boolean;
  onContinue: () => void;
  onNewGame: () => void;
  onLoadGame: () => void;
  onSettings: () => void;
  onCredits: () => void;
}

/** Web build hides Quit; native/desktop wrappers can override this later. */
function isWebBuild(): boolean {
  return typeof window === 'undefined' || !('electron' in window);
}

export function TitleScreenMainMenu({
  hasContinue,
  onContinue,
  onNewGame,
  onLoadGame,
  onSettings,
  onCredits,
}: TitleScreenMainMenuProps) {
  const showQuit = !isWebBuild();

  return (
    <nav className="title-menu" aria-label="Main menu">
      <button
        className="title-menu__item"
        disabled={!hasContinue}
        onClick={onContinue}
      >
        Continue
      </button>
      <button className="title-menu__item" onClick={onNewGame}>
        New Game
      </button>
      <button
        className="title-menu__item"
        disabled={!hasContinue}
        onClick={onLoadGame}
      >
        Load Game
      </button>
      <button className="title-menu__item" onClick={onSettings}>
        Settings
      </button>
      <button className="title-menu__item" onClick={onCredits}>
        Credits
      </button>
      {showQuit && (
        <button className="title-menu__item" onClick={() => window.close()}>
          Quit
        </button>
      )}
    </nav>
  );
}
