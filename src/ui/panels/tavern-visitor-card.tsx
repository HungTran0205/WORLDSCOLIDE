/**
 * Tavern visitor card — visibility-tier-gated reveal.
 *
 * Visibility score = max(keeper.INT for assigned) + Tavern.Level × 2
 *   <10 : portrait + name + archetype + civ
 *   10+ : HP / ATK / DEF row
 *   14+ : Talent stats (STR/END/INT/DEX/CHA/LCK/AGI)
 *   22+ : Trait chips + mood line                       (INT 20 @ Lv1)
 *   27+ : Exact demand + preferred-gift category        (INT 25 @ Lv1)
 *   32+ : Success rate preview in negotiate modal       (INT 30 @ Lv1)
 */

import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import type { TavernVisitor } from '@/game/state/game-state';
import { totalCombatPower, ARCHETYPE_ROLE_MAP, hireMercCost } from '@/game/systems/tavern-negotiation';
import { getSpritePath, getBattleIdleFramePath } from '@/scene/sprites/sprite-path-resolver';
import { getTraitDef } from '@/game/data/traits';

interface VisitorCardProps {
  visitor: TavernVisitor;
  visibilityScore: number;
  gold: number;
  onNegotiate: () => void;
  onHireMerc: () => void;
  disabled?: boolean;
}

const formatGold = (n: number) => new Intl.NumberFormat('en-US').format(n) + 'g';

export function TavernVisitorCard({
  visitor,
  visibilityScore,
  gold,
  onNegotiate,
  onHireMerc,
  disabled,
}: VisitorCardProps) {
  const { t } = useTranslation();
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const isGuaranteed = Boolean(visitor.guaranteedRecruit);
  const highlightNegotiate = isGuaranteed && tutorialStep === 'recruit-first-member';
  const role = ARCHETYPE_ROLE_MAP[visitor.archetype];
  const power = totalCombatPower(visitor.stats, role);
  // Combat-derived display values (HP/ATK/DEF) derived from power for visibility tier 10+
  const hp = 100 + visitor.stats.END * 5 + visitor.level * 10;
  const atk = Math.floor(visitor.stats.STR * 1.2 + visitor.stats.DEX * 0.4);
  const def = Math.floor(visitor.stats.END * 0.8 + visitor.stats.AGI * 0.3);
  const mercCost = hireMercCost(visitor);
  const base = getSpritePath(visitor.civilization, visitor.archetype, visitor.gender);
  const portraitSrc = getBattleIdleFramePath(base, 'south', 0);
  const stars = '★'.repeat(visitor.rarity) + '☆'.repeat(5 - visitor.rarity);

  return (
    <div className="tv-visitor-card" data-power={power}>
      {visitor.veteranTag && (
        <span className="tv-veteran-badge" title={t('tavern.card.veteran')}>V</span>
      )}
      <div className="tv-card-portrait ink-pixelated">
        <img src={portraitSrc} alt={visitor.name} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      </div>
      <div className="tv-card-name">{visitor.name}</div>
      <div className="tv-card-meta">
        <span className="tv-card-rarity">{stars}</span>
        <span>· {visitor.civilization}</span>
        <span>· Lv{visitor.level}</span>
      </div>

      {/* Tier 10+: combat-derived */}
      {visibilityScore >= 10 ? (
        <div className="tv-stat-row">
          <span>HP {hp}</span><span>ATK {atk}</span><span>DEF {def}</span>
        </div>
      ) : (
        <div className="tv-stat-row is-locked" title={t('tavern.card.lockedHint', { score: 10 })}>▓▓▓ ▓▓ ▓▓▓</div>
      )}

      {/* Tier 20+: talent stats */}
      {visibilityScore >= 14 ? (
        <div className="tv-stat-row">
          <span>STR {visitor.stats.STR}</span>
          <span>END {visitor.stats.END}</span>
          <span>INT {visitor.stats.INT}</span>
          <span>DEX {visitor.stats.DEX}</span>
          <span>CHA {visitor.stats.CHA}</span>
          <span>LCK {visitor.stats.LCK}</span>
          <span>AGI {visitor.stats.AGI}</span>
        </div>
      ) : (
        <div className="tv-stat-row is-locked" title={t('tavern.card.lockedHint', { score: 14 })}>▓▓▓ ▓▓ ▓▓▓ ▓▓</div>
      )}

      {/* Tier 22+: traits + mood */}
      {visibilityScore >= 22 ? (
        <>
          {visitor.traits.length > 0 && (
            <div className="tv-card-meta">
              {visitor.traits.map((tr) => (
                <span key={tr} className="tv-trait-chip" title={t(getTraitDef(tr)?.descKey ?? tr)}>
                  {t(getTraitDef(tr)?.displayKey ?? tr)}
                </span>
              ))}
            </div>
          )}
          <div className="tv-mood-line">
            {t('tavern.card.mood')}: {visitor.dailyMoodBias >= 0 ? '+' : ''}{visitor.dailyMoodBias}
          </div>
        </>
      ) : null}

      {/* Tier 27+: exact demand + gift category */}
      {visibilityScore >= 27 && (
        <div className="tv-demand-line">
          {t('tavern.card.demand')}: {visitor.derivedDemand} · ❤ {visitor.preferredGiftCategory}
        </div>
      )}

      <div className="tv-card-actions">
        <button
          className={`tv-btn is-primary${highlightNegotiate ? ' tutorial-highlight' : ''}`}
          onClick={onNegotiate}
          disabled={disabled}
        >
          {t('tavern.action.negotiate')}
        </button>
        {/* Hire-as-merc is hidden for the scripted tutorial recruit so the tutorial
            can only complete via a real (permanent) negotiate-recruit. */}
        {!isGuaranteed && (
          <button
            className="tv-btn is-small"
            onClick={onHireMerc}
            disabled={disabled || gold < mercCost}
            title={gold < mercCost ? t('tavern.action.notEnoughGold', { cost: mercCost }) : ''}
          >
            {t('tavern.action.hireMerc')} — {formatGold(mercCost)}
          </button>
        )}
      </div>
    </div>
  );
}
