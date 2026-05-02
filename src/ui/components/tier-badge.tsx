import '@/ui/styles/tier-badge.css';
import { GameIcon } from './game-icon';

export type Tier = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

const TIER_SCALE: Record<Tier, number> = {
  F: 1.00, E: 1.30, D: 1.20, C: 1.05, B: 1.05, A: 1.20, S: 1.05,
};

const TIER_COLOR: Record<Tier, string> = {
  F: 'var(--ink-tier-f)', E: 'var(--ink-tier-e)', D: 'var(--ink-tier-d)',
  C: 'var(--ink-tier-c)', B: 'var(--ink-tier-b)', A: 'var(--ink-tier-a)',
  S: 'var(--ink-tier-s)',
};

const TIER_SOFT: Record<Tier, string> = {
  F: 'rgba(125,138,155,.18)', E: 'rgba(141,166,109,.18)', D: 'rgba(109,191,109,.20)',
  C: 'rgba(74,144,217,.22)',  B: 'rgba(159,122,204,.24)', A: 'rgba(212,168,67,.30)',
  S: 'rgba(255,215,0,.40)',
};

const TIER_DESCRIPTOR: Record<Tier, string> = {
  F: 'Errand', E: 'Novice', D: 'Routine', C: 'Standard',
  B: 'Advanced', A: 'Elite', S: 'Legendary',
};

interface TierBadgeProps {
  tier: Tier;
  size?: 28 | 36 | 64;
  showLabel?: boolean;
}

export function TierBadge({ tier, size = 64, showLabel = false }: TierBadgeProps) {
  const tierLc = tier.toLowerCase();
  return (
    <div
      className={`tier-badge tier-badge--${tierLc}`}
      style={{
        ['--tier-scale' as string]: TIER_SCALE[tier],
        ['--tier-color' as string]: TIER_COLOR[tier],
        ['--tier-soft' as string]: TIER_SOFT[tier],
      } as React.CSSProperties}
    >
      <div className="tier-badge__frame" style={{ width: size, height: size }}>
        <GameIcon category="badge" id={tier} size={Math.round(size * 0.75)} alt={`Tier ${tier}`} />
      </div>
      {showLabel && (
        <>
          <div className="tier-badge__letter">{tier}</div>
          <div className="tier-badge__descriptor">{TIER_DESCRIPTOR[tier]}</div>
        </>
      )}
    </div>
  );
}
