/**
 * Individual save slot card — displays metadata or "Empty Slot" placeholder.
 * Used on the title screen for slot selection.
 */

import { useTranslation } from 'react-i18next';
import type { SaveSlotMetadata } from '@/game/save/save-types';
import { formatPlayTime } from '@/game/save/format-play-time';

interface SaveSlotCardProps {
  slotIndex: number;
  metadata: SaveSlotMetadata | null;
  selected: boolean;
  onClick: () => void;
}

/** Format timestamp as short date string */
function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SaveSlotCard({ slotIndex, metadata, selected, onClick }: SaveSlotCardProps) {
  const { t } = useTranslation();
  const baseClass = 'save-slot-card';
  const classes = [
    baseClass,
    selected && `${baseClass}--selected`,
    !metadata && `${baseClass}--empty`,
  ]
    .filter(Boolean)
    .join(' ');

  if (!metadata) {
    return (
      <div className={classes} onClick={onClick} role="button" tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}>
        <div className="save-slot-card__empty-text">{t('saveSlot.slot', { number: slotIndex + 1 })}</div>
        <div className="save-slot-card__empty-text">{t('saveSlot.empty')}</div>
      </div>
    );
  }

  return (
    <div className={classes} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <div className="save-slot-card__header">{metadata.guildName}</div>
      <div className="save-slot-card__meta">
        <div>{t('saveSlot.founder', { name: metadata.founderName })}</div>
        <div>{t('saveSlot.level', { level: metadata.guildLevel })}</div>
        <div>{t('saveSlot.playTime', { time: formatPlayTime(metadata.playTimeMs) })}</div>
        <div>{t('saveSlot.saved', { date: formatDate(metadata.updatedAt) })}</div>
      </div>
    </div>
  );
}
