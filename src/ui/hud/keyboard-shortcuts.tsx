/**
 * Global keyboard shortcuts for the guild-hall HUD.
 * - Q   → toggle Quest Board
 * - ESC → close all open panels (main + facility axes)
 *
 * Mounted by GameScreen. Reads panel state from ui-store directly — no props needed.
 * Uses capture phase so this handler beats HomeButton's bubble-phase ESC listener,
 * preventing a panel-close from also firing a camera-reset in the same keydown.
 */

import { useEffect } from 'react';
import { useUiStore } from '@/game/state/ui-store';

export function KeyboardShortcuts() {
  const mainPanel = useUiStore((s) => s.mainPanel);
  const facilityPanel = useUiStore((s) => s.facilityPanel);
  const openPanel = useUiStore((s) => s.openPanel);
  const closeAllPanels = useUiStore((s) => s.closeAllPanels);
  const markTutorialSeen = useUiStore((s) => s.markQuestTutorialSeen);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in form fields
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }

      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        if (mainPanel === 'quests') {
          closeAllPanels();
        } else {
          openPanel('quests');
          markTutorialSeen();
        }
        return;
      }

      // ESC closes whichever panel axis is open. stopImmediatePropagation prevents
      // HomeButton's bubble-phase listener from also resetting the camera on the
      // same keydown when a panel is open.
      if (e.key === 'Escape' && (mainPanel !== null || facilityPanel !== null)) {
        e.stopImmediatePropagation();
        e.preventDefault();
        closeAllPanels();
      }
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [mainPanel, facilityPanel, openPanel, closeAllPanels, markTutorialSeen]);

  return null;
}
