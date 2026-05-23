/**
 * Save-slot picker submenu — opened from the main menu's New Game or Load Game.
 *
 * mode='new'  : every slot clickable; populated slots prompt overwrite-confirm.
 * mode='load' : only populated slots clickable; the "Load" CTA dispatches the
 *               existing slot's continue handler.
 *
 * Renders inside the same menu panel as the main menu — same lacquer chrome,
 * just different children. Back button returns to main without committing.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SaveSlotCard } from './save-slot-card';
import type { SaveSlotMetadata } from '@/game/save/save-types';

export type SavePickerMode = 'new' | 'load';

interface TitleScreenSavePickerProps {
  mode: SavePickerMode;
  slots: (SaveSlotMetadata | null)[];
  /** Called with slotId (1-indexed) once the user confirms. */
  onSelect: (slotId: number) => void | Promise<void>;
  /** Required when mode='new' so overwrite confirm can clear the slot first. */
  onDelete?: (slotId: number) => Promise<void>;
  onBack: () => void;
}

export function TitleScreenSavePicker({
  mode,
  slots,
  onSelect,
  onDelete,
  onBack,
}: TitleScreenSavePickerProps) {
  const { t } = useTranslation();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);

  const isPopulated = selectedIdx !== null && slots[selectedIdx] !== null;
  const isLoadDisabled = selectedIdx === null || (mode === 'load' && !isPopulated);

  const isClickable = (slot: SaveSlotMetadata | null) =>
    mode === 'new' ? true : slot !== null;

  const handleConfirm = () => {
    if (selectedIdx === null) return;
    const slotId = selectedIdx + 1;

    if (mode === 'new' && isPopulated) {
      setShowOverwriteConfirm(true);
      return;
    }
    void onSelect(slotId);
  };

  const confirmOverwrite = async () => {
    setShowOverwriteConfirm(false);
    if (selectedIdx === null || !onDelete) return;
    const slotId = selectedIdx + 1;
    await onDelete(slotId);
    void onSelect(slotId);
  };

  return (
    <div className="title-save-picker">
      <header className="title-save-picker__header">
        <button
          className="title-save-picker__back"
          onClick={onBack}
          aria-label={t('savePicker.backAria')}
        >
          {t('savePicker.back')}
        </button>
        <h2 className="title-save-picker__heading">
          {mode === 'new' ? t('savePicker.headingNew') : t('savePicker.headingLoad')}
        </h2>
      </header>

      <div className="title-save-picker__slots">
        {slots.map((meta, idx) => (
          <SaveSlotCard
            key={idx}
            slotIndex={idx}
            metadata={meta}
            selected={selectedIdx === idx}
            onClick={() => {
              if (!isClickable(meta)) return;
              setSelectedIdx(idx);
              setShowOverwriteConfirm(false);
            }}
          />
        ))}
      </div>

      {showOverwriteConfirm ? (
        <div className="title-overwrite-confirm" role="alert">
          <p className="title-overwrite-confirm__msg">
            {t('savePicker.overwriteMsg')}
          </p>
          <div className="title-overwrite-confirm__actions">
            <button
              className="title-menu__item title-menu__item--danger"
              onClick={confirmOverwrite}
            >
              {t('savePicker.yesOverwrite')}
            </button>
            <button
              className="title-menu__item"
              onClick={() => setShowOverwriteConfirm(false)}
            >
              {t('savePicker.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <button
          className="title-menu__item title-menu__item--primary"
          disabled={isLoadDisabled}
          onClick={handleConfirm}
        >
          {mode === 'new' ? t('savePicker.startNew') : t('savePicker.load')}
        </button>
      )}
    </div>
  );
}
