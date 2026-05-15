/**
 * Global keyboard shortcuts for the guild-hall HUD.
 * - Q  → toggle Quest Board
 * - ESC → close any open panel
 *
 * Mounted by GameScreen so it can drive the same activePanel state as the
 * HUD buttons and the drum click bridge.
 */

import { useEffect } from 'react';
import type { PanelId } from '@/ui/hud/panel-toggle';
import { useUiStore } from '@/game/state/ui-store';

interface KeyboardShortcutsProps {
  activePanel: PanelId;
  setActivePanel: (id: PanelId) => void;
}

export function KeyboardShortcuts({ activePanel, setActivePanel }: KeyboardShortcutsProps) {
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
        const next = activePanel === 'quests' ? null : 'quests';
        setActivePanel(next);
        if (next === 'quests') markTutorialSeen();
        return;
      }

      if (e.key === 'Escape' && activePanel !== null) {
        // Capture the close so HomeButton's ESC handler doesn't also fire.
        e.stopImmediatePropagation();
        e.preventDefault();
        setActivePanel(null);
      }
    };

    // Capture phase so we beat HomeButton's bubble-phase listener to ESC.
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [activePanel, setActivePanel, markTutorialSeen]);

  return null;
}
