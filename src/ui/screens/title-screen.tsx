/**
 * Title screen — game entry point.
 * Renders the full-bleed R3F diorama as background and a floating menu panel
 * (with main / save-picker / settings / credits sub-views) as overlay.
 *
 * State machine for the menu panel:
 *   'main'      → TitleScreenMainMenu
 *   'new-game'  → TitleScreenSavePicker (mode=new)
 *   'load-game' → TitleScreenSavePicker (mode=load)
 *   'settings'  → TitleScreenSettings
 *   'credits'   → TitleScreenCredits
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listSlots } from '@/game/save/save-storage';
import { TitleScene } from '@/scene/title/title-scene';
import { TitleScreenLogo } from './title-screen-logo';
import { TitleScreenMainMenu } from './title-screen-main-menu';
import { TitleScreenSavePicker } from './title-screen-save-picker';
import { TitleScreenSettings } from './title-screen-settings';
import { TitleScreenCredits } from './title-screen-credits';
import type { SaveSlotMetadata } from '@/game/save/save-types';
import '@/ui/styles/title-screen.css';

type MenuMode = 'main' | 'new-game' | 'load-game' | 'settings' | 'credits';

interface TitleScreenProps {
  onContinue: (slotId: number) => void;
  onNewGame: (slotId: number) => void;
  onDeleteSlot: (slotId: number) => Promise<void>;
}

export function TitleScreen({ onContinue, onNewGame, onDeleteSlot }: TitleScreenProps) {
  const { t } = useTranslation();
  const [slots, setSlots] = useState<(SaveSlotMetadata | null)[]>([null, null, null]);
  const [mode, setMode] = useState<MenuMode>('main');
  const [error, setError] = useState<string | null>(null);

  const refreshSlots = useCallback(async () => {
    const result = await listSlots().catch(() => null);
    if (result) {
      setSlots(result);
      setError(null);
    } else {
      setError(t('titleScreen.loadFailed'));
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch on mount is standard pattern
  useEffect(() => { void refreshSlots(); }, [refreshSlots]);

  /** Latest populated slot id (1-3) by updatedAt, or null if all empty. */
  const latestSlotId = useMemo(() => {
    let best: { id: number; updatedAt: number } | null = null;
    slots.forEach((slot, idx) => {
      if (!slot) return;
      if (!best || slot.updatedAt > best.updatedAt) {
        best = { id: idx + 1, updatedAt: slot.updatedAt };
      }
    });
    return best !== null ? (best as { id: number; updatedAt: number }).id : null;
  }, [slots]);

  const hasAnySave = latestSlotId !== null;

  const handleContinue = () => {
    if (latestSlotId !== null) onContinue(latestSlotId);
  };

  const handleNewGameSelect = (slotId: number) => onNewGame(slotId);

  const handleLoadSelect = (slotId: number) => onContinue(slotId);

  const handleDelete = async (slotId: number) => {
    await onDeleteSlot(slotId);
    await refreshSlots();
  };

  const backToMain = () => setMode('main');

  // Submenu modes expand the panel to center for a wider workspace.
  const isSubmenu = mode !== 'main';
  const panelClass = `title-screen__panel${isSubmenu ? ' title-screen__panel--wide' : ''}`;

  return (
    <div className="title-screen">
      {/* Full-bleed diorama background */}
      <TitleScene />

      {/* Brand logo — standalone, top-center of the screen, sized between the
       *  splash and the old in-panel variant. Sits above the menu panel so it
       *  reads as the title of the whole composition, not a panel header. */}
      <div className="title-screen__brand">
        <TitleScreenLogo size="brand" animate={false} />
      </div>

      {/* Floating menu panel — overlays the diorama */}
      <aside className={panelClass} aria-label={t('titleScreen.panelAria')}>
        {mode === 'main' && (
          <TitleScreenMainMenu
            hasContinue={hasAnySave}
            onContinue={handleContinue}
            onNewGame={() => setMode('new-game')}
            onLoadGame={() => setMode('load-game')}
            onSettings={() => setMode('settings')}
            onCredits={() => setMode('credits')}
          />
        )}

        {mode === 'new-game' && (
          <TitleScreenSavePicker
            mode="new"
            slots={slots}
            onSelect={handleNewGameSelect}
            onDelete={handleDelete}
            onBack={backToMain}
          />
        )}

        {mode === 'load-game' && (
          <TitleScreenSavePicker
            mode="load"
            slots={slots}
            onSelect={handleLoadSelect}
            onBack={backToMain}
          />
        )}

        {mode === 'settings' && <TitleScreenSettings onBack={backToMain} />}

        {mode === 'credits' && <TitleScreenCredits onBack={backToMain} />}

        {error && <p className="title-menu__error" role="alert">{error}</p>}
      </aside>
    </div>
  );
}
