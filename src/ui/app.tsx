/**
 * App root — screen-based routing: title -> char-creation -> game.
 * Manages save lifecycle: load, hydrate, auto-save, return to title.
 */

import { useState, useEffect, useCallback } from 'react';
import { CharCreation } from '@/ui/panels/char-creation';
import { SplashScreen } from '@/ui/screens/splash-screen';
import { TitleScreen } from '@/ui/screens/title-screen';
import { GameScreen } from '@/ui/screens/game-screen';
import { useGameStore, resetGameState } from '@/game/state/store';
import { saveManager } from '@/game/save/save-manager';
import { deleteSlot, loadBackup, saveSlot } from '@/game/save/save-storage';
import { getActiveSlotId, setActiveSlotId, clearActiveSlotId } from '@/game/save/active-slot-storage';
import { extractGameSaveData, createSaveEnvelope } from '@/game/save/save-types';
import { isValidSaveEnvelope } from '@/game/save/save-validation';
import { initAudio, playBGM, crossfadeBGM, setMusicVolume, setSFXVolume } from '@/audio/audio-manager';
import { AUDIO } from '@/audio/audio-keys';
import { graphicsTierFlags } from '@/game/state/guild-slice';
import { Leva } from 'leva';
import { DEBUG_MODE } from '@/debug';

type AppScreen = 'splash' | 'title' | 'char-creation' | 'game';

const getState = () => useGameStore.getState() as unknown as Record<string, unknown>;

/**
 * Apply persisted settings to subsystems that hold their own state
 * (audio engine + graphics tier flags). Call after `useGameStore.setState`
 * to ensure Howler volume + bloom/atmospheric flags match the loaded save.
 */
function hydrateRuntimeFromSettings() {
  const { settings, updateSettings } = useGameStore.getState();
  // Normalize tier — legacy saves may have graphicsQuality='high' but
  // bloomEnabled=false; cascade the tier so flags stay consistent.
  updateSettings(graphicsTierFlags(settings.graphicsQuality));
  setMusicVolume(settings.musicVolume);
  setSFXVolume(settings.sfxVolume);
}

export function App() {
  const [appScreen, setAppScreen] = useState<AppScreen>('splash');
  const [activeSlotId, setActiveSlot] = useState<number | null>(null);

  // TEMP debug: trace appScreen transitions during Phase 2/3 visual test.
  // Remove before Phase 7 polish.
  console.log('[App] render appScreen=', appScreen, 'activeSlot=', activeSlotId);

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
        initAudio();
        hydrateRuntimeFromSettings();
        playBGM(AUDIO.BGM_GUILD);
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
    initAudio();
    hydrateRuntimeFromSettings();
    crossfadeBGM(AUDIO.BGM_GUILD, 1500);
    setAppScreen('game');
  }, []);

  /** New Game: reset store -> set slot -> go to char creation */
  const handleNewGame = useCallback((slotId: number) => {
    resetGameState();
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
    initAudio();
    hydrateRuntimeFromSettings();
    crossfadeBGM(AUDIO.BGM_GUILD, 1500);
    setAppScreen('game');
  }, [activeSlotId]);

  /** Return to title: save -> stop auto-save -> navigate -> crossfade to title BGM */
  const handleReturnToTitle = useCallback(async () => {
    await saveManager.save(getState, true);
    saveManager.stopAutoSave();
    clearActiveSlotId();
    setActiveSlot(null);
    crossfadeBGM(AUDIO.BGM_TITLE, 1000);
    setAppScreen('title');
  }, []);

  /**
   * Splash → title: lazy-init audio and queue the title BGM. We use `playBGM`
   * (no fade) rather than `crossfadeBGM` because (a) no prior BGM exists to
   * fade out, and (b) splash auto-advances from a timer — not a user gesture —
   * so the browser's autoplay policy still blocks. Howler's `autoUnlock`
   * (default on) will flush the queued play on the user's first click in the
   * title menu, at which point the BGM starts cleanly at the user-set volume.
   *
   * The functional setter guard is double-protection — splash unmounts on
   * screen change so a late-firing onReady cannot bounce 'game' back to title.
   */
  const handleSplashReady = useCallback(() => {
    initAudio();
    hydrateRuntimeFromSettings();
    playBGM(AUDIO.BGM_TITLE);
    setAppScreen((s) => (s === 'splash' ? 'title' : s));
  }, []);

  if (appScreen === 'splash') {
    // Functional update guards against active-slot auto-load racing past the splash min duration —
    // we never want to bounce a 'game' screen back to 'title' just because splash finished later.
    return <SplashScreen onReady={handleSplashReady} />;
  }

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

  return (
    <>
      <Leva hidden={!DEBUG_MODE} />
      <GameScreen onReturnToTitle={handleReturnToTitle} />
    </>
  );
}
