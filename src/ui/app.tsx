/**
 * App root — screen-based routing: title -> char-creation -> game.
 * Manages save lifecycle: load, hydrate, auto-save, return to title.
 */

import { useState, useEffect, useCallback } from 'react';
import { CharCreation } from '@/ui/panels/char-creation';
import { TitleScreen } from '@/ui/screens/title-screen';
import { GameScreen } from '@/ui/screens/game-screen';
import { useGameStore } from '@/game/state/store';
import { saveManager } from '@/game/save/save-manager';
import { deleteSlot, loadBackup, saveSlot } from '@/game/save/save-storage';
import { getActiveSlotId, setActiveSlotId, clearActiveSlotId } from '@/game/save/active-slot-storage';
import { extractGameSaveData, createSaveEnvelope } from '@/game/save/save-types';
import { isValidSaveEnvelope } from '@/game/save/save-validation';

type AppScreen = 'title' | 'char-creation' | 'game';

const getState = () => useGameStore.getState() as unknown as Record<string, unknown>;

export function App() {
  const [appScreen, setAppScreen] = useState<AppScreen>('title');
  const [activeSlotId, setActiveSlot] = useState<number | null>(null);

  // Auto-load from localStorage on mount (skip title if active slot exists)
  useEffect(() => {
    const storedSlot = getActiveSlotId();
    if (!storedSlot) return;

    saveManager.load(storedSlot).then((envelope) => {
      if (envelope) {
        useGameStore.setState(envelope.gameState);
        saveManager.setActiveSlot(storedSlot);
        setActiveSlot(storedSlot);
        saveManager.startAutoSave(getState);
        setAppScreen('game');
      } else {
        // Corrupt save — clear and show title
        clearActiveSlotId();
      }
    });
  }, []);

  // Cleanup auto-save on unmount
  useEffect(() => {
    return () => saveManager.stopAutoSave();
  }, []);

  /** Continue: load save from slot -> hydrate store -> start auto-save */
  const handleContinue = useCallback(async (slotId: number) => {
    let envelope = await saveManager.load(slotId);

    // Try backup if primary fails
    if (!envelope) {
      const backup = await loadBackup(slotId);
      if (backup && isValidSaveEnvelope(backup)) {
        await saveSlot(slotId, backup);
        envelope = backup;
      }
    }

    if (!envelope) return;

    useGameStore.setState(envelope.gameState);
    saveManager.setActiveSlot(slotId);
    setActiveSlot(slotId);
    setActiveSlotId(slotId);
    saveManager.startAutoSave(getState);
    setAppScreen('game');
  }, []);

  /** New Game: set slot -> go to char creation */
  const handleNewGame = useCallback((slotId: number) => {
    saveManager.setActiveSlot(slotId);
    setActiveSlot(slotId);
    setAppScreen('char-creation');
  }, []);

  /** Delete a save slot */
  const handleDeleteSlot = useCallback(async (slotId: number) => {
    await deleteSlot(slotId);
  }, []);

  /** Char creation complete: save initial state -> start game */
  const handleCharComplete = useCallback(async () => {
    if (!activeSlotId) return;
    const gameData = extractGameSaveData(getState());
    const envelope = createSaveEnvelope(activeSlotId, gameData);
    await saveSlot(activeSlotId, envelope);
    setActiveSlotId(activeSlotId);
    saveManager.startAutoSave(getState);
    setAppScreen('game');
  }, [activeSlotId]);

  /** Return to title: save -> stop auto-save -> navigate */
  const handleReturnToTitle = useCallback(async () => {
    await saveManager.save(getState, true);
    saveManager.stopAutoSave();
    clearActiveSlotId();
    setActiveSlot(null);
    setAppScreen('title');
  }, []);

  if (appScreen === 'title') {
    return (
      <TitleScreen
        onContinue={handleContinue}
        onNewGame={handleNewGame}
        onDeleteSlot={handleDeleteSlot}
      />
    );
  }

  if (appScreen === 'char-creation') {
    return <CharCreation slotId={activeSlotId!} onComplete={handleCharComplete} />;
  }

  return <GameScreen onReturnToTitle={handleReturnToTitle} />;
}
