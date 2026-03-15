/**
 * Individual save slot card — displays metadata or "Empty Slot" placeholder.
 * Used on the title screen for slot selection.
 */

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
        <div className="save-slot-card__empty-text">Slot {slotIndex + 1}</div>
        <div className="save-slot-card__empty-text">Empty</div>
      </div>
    );
  }

  return (
    <div className={classes} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <div className="save-slot-card__header">{metadata.guildName}</div>
      <div className="save-slot-card__meta">
        <div>Founder: {metadata.founderName}</div>
        <div>Level: {metadata.guildLevel}</div>
        <div>Play time: {formatPlayTime(metadata.playTimeMs)}</div>
        <div>Saved: {formatDate(metadata.updatedAt)}</div>
      </div>
    </div>
  );
}
