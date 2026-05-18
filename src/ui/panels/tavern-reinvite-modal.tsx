/**
 * Re-invite modal — consumes pending-prompts queue from phase 05.
 * Roll has +25% bonus modifier baked in via `executeReinvite` action.
 * Visibility-gated rate preview (tier ≥ 40).
 */

import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import type { TavernPendingPrompt, Member } from '@/game/state/game-state';
import {
  buildModifierBundle,
  keeperNegotiation,
  successRate,
  sumModifiers,
  targetDemand,
  type TavernGameSnapshot,
} from '@/game/systems/tavern-negotiation';

interface ReinviteModalProps {
  prompt: TavernPendingPrompt;
  visibilityScore: number;
  keeper: Member | null;
  onClose: () => void;
}

export function TavernReinviteModal({ prompt, visibilityScore, keeper, onClose }: ReinviteModalProps) {
  const { t } = useTranslation();
  const gold = useGameStore((s) => s.gold);
  const guildLevel = useGameStore((s) => s.guildLevel);
  const tavern = useGameStore((s) => s.tavern);
  const executeReinvite = useGameStore((s) => s.executeReinvite);

  const visitor = prompt.visitorSnapshot;
  const snapshot: TavernGameSnapshot = {
    gold,
    guildLevel,
    tavernLevel: tavern.level,
    tavernReputation: tavern.reputation,
    globalNegotiationDebuffUntilDay: tavern.globalNegotiationDebuffUntilDay,
    currentDay: tavern.lastDayProcessed,
  };
  const kNeg = keeper ? keeperNegotiation(keeper) : 0;
  const demand = targetDemand(visitor);
  const mods = keeper ? buildModifierBundle(keeper, visitor, snapshot, { reinvite: true }) : null;
  const rate = mods ? successRate(kNeg, demand, sumModifiers(mods)) : 0;
  const showRate = visibilityScore >= 32;

  return (
    <div className="tv-modal-overlay" onClick={onClose}>
      <div className="tv-modal-secondary parchment-surface parchment-frame" onClick={(e) => e.stopPropagation()}>
        <h3 className="parchment-title">{t('tavern.reinvite.title', { archetype: visitor.archetype })}</h3>
        <div className="parchment-text">{t('tavern.reinvite.body')}</div>
        <div className="tv-modal-line">
          <span>{t('tavern.reinvite.bonus')}</span>
          <span style={{ color: 'var(--ink-status-ok)' }}>+25%</span>
        </div>
        {keeper && (
          <div className="tv-modal-line">
            <span>{t('tavern.reinvite.keeper')}</span>
            <span>{keeper.name} (Neg {kNeg})</span>
          </div>
        )}
        {showRate && (
          <div className="tv-rate-gauge">
            <div className="tv-rate-bar">
              <div className="tv-rate-bar-fill" style={{ width: `${rate}%` }} />
            </div>
            <span className={`tv-rate-pct ${rate < 30 ? 'is-low' : rate < 60 ? 'is-mid' : 'is-high'}`}>
              {Math.round(rate)}%
            </span>
          </div>
        )}
        <div className="tv-modal-footer">
          <button className="tv-btn is-ghost" onClick={() => { executeReinvite(prompt.contractId, false); onClose(); }}>
            {t('tavern.reinvite.decline')}
          </button>
          <button
            className="tv-btn is-primary"
            onClick={() => { executeReinvite(prompt.contractId, true); onClose(); }}
          >
            {t('tavern.reinvite.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
