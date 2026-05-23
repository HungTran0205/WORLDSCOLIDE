/**
 * Live hero preview for char-creation — a TCG-style character card.
 * Top corners: weapon icon (left) + chosen mask (right). Center: avatar art
 * with the mask worn on the face (live preview). Footer: the player's name +
 * the stats they've allocated. Card border uses the faction accent.
 */

import { useState } from 'react';
import { getSpritePath } from '@/scene/sprites/sprite-path-resolver';
import { getMaskAssetPath } from '@/scene/sprites/mask-pool';
import { CIV_CONFIG } from '@/game/data/civilization-config';
import { STAT_KEYS } from '@/game/systems/stat-allocation';
import type { Civilization, CivArchetype, Gender } from '@/game/data/civilization-config';
import type { Stats } from '@/game/state/game-state';

interface CharacterPreviewProps {
  civ: Civilization;
  archetype?: CivArchetype;
  gender?: Gender;
  maskId?: string;
  weaponIconPath?: string;
  weaponLabel?: string;
  stats?: Stats;
  name?: string;
}

function buildAvatarUrl(civ: Civilization, archetype?: CivArchetype, gender?: Gender): string | null {
  if (!archetype || !gender) return null;
  return `${getSpritePath(civ, archetype, gender)}/animations/avatar/frame_000.png`;
}

export function CharacterPreview({
  civ, archetype, gender, maskId, weaponIconPath, weaponLabel, stats, name,
}: CharacterPreviewProps) {
  // Track the URL that failed to load (not a boolean) so a new pick re-attempts
  // automatically — derived state, no effect needed (avoids set-state-in-effect).
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const [failedMaskUrl, setFailedMaskUrl] = useState<string | null>(null);
  const [failedWeaponUrl, setFailedWeaponUrl] = useState<string | null>(null);

  const accent = CIV_CONFIG[civ]?.colors?.accent ?? '#D4A017';
  const avatarUrl = buildAvatarUrl(civ, archetype, gender);
  const maskUrl = maskId ? getMaskAssetPath(maskId, 'front') : null;

  const showAvatar = avatarUrl && failedAvatarUrl !== avatarUrl;
  const showMask = maskUrl && failedMaskUrl !== maskUrl;
  const showWeapon = weaponIconPath && failedWeaponUrl !== weaponIconPath;
  const placeholderLabel = CIV_CONFIG[civ]?.shortName ?? '??';

  return (
    <div
      className="char-preview-frame"
      style={{ borderColor: accent, boxShadow: `0 0 28px ${accent}33, inset 0 0 18px ${accent}22` }}
    >
      {/* Top-corner badges: weapon (left) + chosen mask (right) */}
      <span className="char-preview-badge char-preview-badge--weapon" style={{ borderColor: `${accent}99` }}>
        {showWeapon ? (
          <img src={weaponIconPath} alt={weaponLabel ?? 'Weapon'} onError={() => setFailedWeaponUrl(weaponIconPath!)} />
        ) : (
          <span className="char-preview-badge-empty" aria-hidden>⚔</span>
        )}
      </span>
      <span className="char-preview-badge char-preview-badge--mask" style={{ borderColor: `${accent}99` }}>
        {showMask ? (
          <img className="pixelated" src={maskUrl!} alt="Mask" onError={() => setFailedMaskUrl(maskUrl)} />
        ) : (
          <span className="char-preview-badge-empty" aria-hidden>◌</span>
        )}
      </span>

      {/* Character art — avatar with the mask worn on the face */}
      <div className="char-preview-stage" style={{ background: `radial-gradient(ellipse at 50% 30%, ${accent}1f, rgba(0,0,0,0.55))` }}>
        {showAvatar ? (
          <img
            className="char-preview-avatar"
            src={avatarUrl}
            alt="Character preview"
            onError={() => setFailedAvatarUrl(avatarUrl)}
          />
        ) : (
          <div className="char-preview-placeholder" style={{ color: accent }}>
            {placeholderLabel}
          </div>
        )}
        {showMask && (
          <img className="char-preview-mask" src={maskUrl!} alt="" aria-hidden onError={() => setFailedMaskUrl(maskUrl)} />
        )}
      </div>

      {/* Name plate */}
      <div className="char-preview-nameplate" style={{ color: name ? accent : undefined }}>
        {name ? name : <span className="char-preview-nameplate--empty">Unnamed</span>}
      </div>

      {/* Chosen stats footer */}
      {stats && (
        <div className="char-preview-stats">
          {STAT_KEYS.map((k) => (
            <div key={k} className="char-preview-stat" data-zero={stats[k] === 0}>
              <span className="char-preview-stat-key">{k}</span>
              <span className="char-preview-stat-val">{stats[k]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
