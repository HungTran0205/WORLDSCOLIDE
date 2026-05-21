/**
 * Live hero preview for char-creation — large framed avatar + optional mask overlay.
 * Reuses the avatar+mask HTML overlay pattern from member-card.tsx, scaled up.
 * Avatar resolves only once an archetype+gender are chosen; otherwise shows a
 * faction-tinted silhouette placeholder. Frame border uses the faction accent.
 */

import { useState } from 'react';
import { getSpritePath } from '@/scene/sprites/sprite-path-resolver';
import { getMaskAssetPath } from '@/scene/sprites/mask-pool';
import { CIV_CONFIG } from '@/game/data/civilization-config';
import type { Civilization, CivArchetype, Gender } from '@/game/data/civilization-config';

interface CharacterPreviewProps {
  civ: Civilization;
  archetype?: CivArchetype;
  gender?: Gender;
  maskId?: string;
}

function buildAvatarUrl(civ: Civilization, archetype?: CivArchetype, gender?: Gender): string | null {
  if (!archetype || !gender) return null;
  return `${getSpritePath(civ, archetype, gender)}/animations/avatar/frame_000.png`;
}

export function CharacterPreview({ civ, archetype, gender, maskId }: CharacterPreviewProps) {
  // Track the URL that failed to load (not a boolean) so a new pick re-attempts
  // automatically — derived state, no effect needed (avoids set-state-in-effect).
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const [failedMaskUrl, setFailedMaskUrl] = useState<string | null>(null);
  const colors = CIV_CONFIG[civ]?.colors;
  const accent = colors?.accent ?? '#D4A017';
  const avatarUrl = buildAvatarUrl(civ, archetype, gender);
  const maskUrl = maskId ? getMaskAssetPath(maskId, 'front') : null;

  const showAvatar = avatarUrl && failedAvatarUrl !== avatarUrl;
  const showMask = maskUrl && failedMaskUrl !== maskUrl;
  const placeholderLabel = CIV_CONFIG[civ]?.shortName ?? '??';

  return (
    <div
      className="char-preview-frame"
      style={{ borderColor: accent, boxShadow: `0 0 28px ${accent}33, inset 0 0 18px ${accent}22` }}
    >
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
          <img
            className="char-preview-mask"
            src={maskUrl}
            alt=""
            aria-hidden
            onError={() => setFailedMaskUrl(maskUrl)}
          />
        )}
      </div>
    </div>
  );
}
