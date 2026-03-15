/**
 * Title screen — game entry point with save slot selection.
 * Displays 3 save slots, Continue/New Game/Delete actions.
 */

import { useState, useEffect, useCallback } from 'react';
import { listSlots } from '@/game/save/save-storage';
import { SaveSlotCard } from './save-slot-card';
import type { SaveSlotMetadata } from '@/game/save/save-types';
import '@/ui/styles/title-screen.css';

interface TitleScreenProps {
  onContinue: (slotId: number) => void;
  onNewGame: (slotId: number) => void;
  onDeleteSlot: (slotId: number) => Promise<void>;
}

export function TitleScreen({ onContinue, onNewGame, onDeleteSlot }: TitleScreenProps) {
  const [slots, setSlots] = useState<(SaveSlotMetadata | null)[]>([null, null, null]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'info' } | null>(null);

  const refreshSlots = useCallback(async () => {
    setLoading(true);
    const result = await listSlots().catch(() => null);
    if (result) {
      setSlots(result);
    } else {
      setMessage({ text: 'Failed to load save slots', type: 'error' });
    }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch on mount is standard pattern
  useEffect(() => { refreshSlots(); }, [refreshSlots]);

  const selected = selectedIdx !== null ? slots[selectedIdx] : undefined;
  const slotId = selectedIdx !== null ? selectedIdx + 1 : 0;
  const isPopulated = !!selected;

  const handleContinue = () => {
    if (isPopulated) onContinue(slotId);
  };

  const handleNewGame = () => {
    if (selectedIdx === null) return;
    if (isPopulated) {
      setShowOverwriteConfirm(true);
      return;
    }
    onNewGame(slotId);
  };

  const confirmOverwrite = async () => {
    setShowOverwriteConfirm(false);
    await onDeleteSlot(slotId);
    onNewGame(slotId);
  };

  const handleDelete = async () => {
    if (!isPopulated) return;
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    setShowDeleteConfirm(false);
    await onDeleteSlot(slotId);
    refreshSlots();
  };

  // Reset confirms when slot selection changes
  const selectSlot = (idx: number) => {
    setSelectedIdx(idx);
    setShowDeleteConfirm(false);
    setShowOverwriteConfirm(false);
    setMessage(null);
  };

  if (loading) {
    return (
      <div className="title-screen">
        <div className="title-logo">Worlds Collide</div>
        <div className="title-subtitle">Loading...</div>
      </div>
    );
  }

  return (
    <div className="title-screen">
      <div className="title-logo">Worlds Collide</div>
      <div className="title-subtitle">RPG Idle Guild Builder</div>

      <div className="save-slot-list">
        {slots.map((meta, idx) => (
          <SaveSlotCard
            key={idx}
            slotIndex={idx}
            metadata={meta}
            selected={selectedIdx === idx}
            onClick={() => selectSlot(idx)}
          />
        ))}
      </div>

      <div className="title-actions">
        <button className="title-btn" disabled={!isPopulated} onClick={handleContinue}>
          Continue
        </button>
        <button className="title-btn" disabled={selectedIdx === null} onClick={handleNewGame}>
          New Game
        </button>
        <button
          className="title-btn title-btn--danger"
          disabled={!isPopulated}
          onClick={handleDelete}
        >
          {showDeleteConfirm ? 'Confirm Delete?' : 'Delete Save'}
        </button>
      </div>

      {showOverwriteConfirm && (
        <div className="title-message title-message--error">
          This slot has data. Overwrite?{' '}
          <button className="title-btn title-btn--danger" onClick={confirmOverwrite}>
            Yes, overwrite
          </button>{' '}
          <button className="title-btn" onClick={() => setShowOverwriteConfirm(false)}>
            Cancel
          </button>
        </div>
      )}

      {message && (
        <div className={`title-message title-message--${message.type}`}>{message.text}</div>
      )}
    </div>
  );
}
