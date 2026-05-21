/**
 * Tavern panel — main shell with auto-open + visitor grid + modals.
 *
 * Mirrors workshop-panel pattern: camera-detected auto-open via parent
 * (game-screen.tsx) with userClosedRef tracking. Embeds keeper row, rumor
 * banner, reputation indicator, re-roll, visitor grid, and routes negotiation
 * outcomes to downstream modals (counter / refuse toast / insult).
 */

import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import type { GuildFacility, TavernVisitor, Member } from '@/game/state/game-state';
import { getEffectiveKeeperStats } from '@/game/systems/tavern-spawn';
import { keeperNegotiation, rollInsultGoneForever, type NegotiationResult } from '@/game/systems/tavern-negotiation';
import { hashSeed } from '@/game/systems/seeded-rng';
import { TavernKeeperRow } from './tavern-keeper-row';
import { TavernRumorBanner } from './tavern-rumor-banner';
import { TavernVisitorCard } from './tavern-visitor-card';
import { TavernNegotiateModal } from './tavern-negotiate-modal';
import { TavernCounterOfferModal } from './tavern-counter-offer-modal';
import { TavernHireMercModal } from './tavern-hire-merc-modal';
import { TavernReinviteModal } from './tavern-reinvite-modal';
import { TavernInsultEventModal } from './tavern-insult-event-modal';
import '@/ui/styles/tavern-panel.css';
import '@/ui/styles/parchment.css';

interface TavernPanelProps {
  facility: GuildFacility;
  onClose: () => void;
}

type ModalState =
  | { kind: 'none' }
  | { kind: 'negotiate'; visitor: TavernVisitor }
  | { kind: 'counter'; visitor: TavernVisitor }
  | { kind: 'hire-merc'; visitor: TavernVisitor }
  | { kind: 'reinvite'; promptIdx: number }
  | { kind: 'insult'; visitor: TavernVisitor; goneForever: boolean };

const formatGold = (n: number) => new Intl.NumberFormat('en-US').format(n);

export function TavernPanel({ facility, onClose }: TavernPanelProps) {
  const { t } = useTranslation();
  const tavern = useGameStore((s) => s.tavern);
  const gold = useGameStore((s) => s.gold);
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);
  const rerollTavernRoster = useGameStore((s) => s.rerollTavernRoster);
  const facilities = useGameStore((s) => s.facilities);

  const live = facilities.find((f) => f.id === facility.id) ?? facility;
  const [modal, setModal] = useState<ModalState>({ kind: 'none' });
  const [outcomeBanner, setOutcomeBanner] = useState<NegotiationResult | null>(null);

  const allMembers: Member[] = useMemo(() => (founder ? [founder, ...roster] : roster), [founder, roster]);
  const memberLookup = useMemo(() => {
    const map = new Map(allMembers.map((m) => [m.id, m]));
    return (id: string) => map.get(id);
  }, [allMembers]);

  const keepers = useMemo(() => live.assignedMemberIds.map(memberLookup).filter((m): m is Member => Boolean(m)), [live.assignedMemberIds, memberLookup]);
  const keeperStats = useMemo(() => getEffectiveKeeperStats(live.assignedMemberIds, memberLookup), [live.assignedMemberIds, memberLookup]);
  const negotiator: Member | null = useMemo(() => {
    if (keepers.length === 0) return null;
    return keepers.reduce((best, k) => (keeperNegotiation(k) > keeperNegotiation(best) ? k : best));
  }, [keepers]);

  const visibilityScore = (keeperStats?.INT ?? 0) + live.level * 2;
  const keeperInt = keeperStats?.INT ?? 0;

  // Auto-open re-invite modal when a queued prompt exists and panel opens
  useEffect(() => {
    if (tavern.pendingPrompts.length > 0 && modal.kind === 'none') {
      setModal({ kind: 'reinvite', promptIdx: 0 });
    }
  }, [tavern.pendingPrompts.length, modal.kind]);

  const visitorCount = tavern.currentRoster.length;
  const visitorCap = live.level === 1 ? 3 : live.level === 2 ? 3 : 4;

  const rerollCost = 100 * live.level;
  const canReroll = !tavern.rerolledToday && gold >= rerollCost && live.level >= 2;
  const rerollDisableHint = tavern.rerolledToday
    ? t('tavern.reroll.alreadyUsed')
    : gold < rerollCost
    ? t('tavern.reroll.needGold', { cost: rerollCost })
    : '';

  const handleOutcome = (result: NegotiationResult, visitor: TavernVisitor) => {
    setModal({ kind: 'none' });
    setOutcomeBanner(result);

    switch (result.outcome.kind) {
      case 'success': {
        // Promote visitor to MEMBER directly. Mirror tavern-merc-lifecycle's promoteMercToMember
        // by constructing a Member from the visitor stats and pushing into roster.
        useGameStore.setState((s) => {
          const baseRoster = s.roster ?? [];
          const newMember: Member = {
            id: `mem-${Date.now()}-${visitor.id.slice(-4)}`,
            name: `${visitor.archetype.charAt(0).toUpperCase()}${visitor.archetype.slice(1)} #${visitor.id.slice(-4)}`,
            level: visitor.level,
            exp: 0,
            stats: visitor.stats,
            unallocatedPoints: 0,
            skill: null,
            status: 'idle',
            injuredUntil: null,
            civilization: visitor.civilization,
            archetype: visitor.archetype,
            gender: 'M',
            isFounder: false,
            rank: 'MEMBER',
            missionsCompleted: 0,
            rarity: visitor.rarity,
            traits: visitor.traits,
          };
          // +1 Tavern Rep when rarity ≥ 3
          const repBonus = visitor.rarity >= 3 ? 1 : 0;
          return {
            roster: [...baseRoster, newMember],
            tavern: {
              ...s.tavern,
              currentRoster: s.tavern.currentRoster.filter((v) => v.id !== visitor.id),
              reputation: Math.max(-5, Math.min(5, s.tavern.reputation + repBonus)),
            },
          };
        });
        setTimeout(() => setOutcomeBanner(null), 1500);
        break;
      }
      case 'counter':
        setTimeout(() => {
          setModal({ kind: 'counter', visitor });
          setOutcomeBanner(null);
        }, 1200);
        break;
      case 'soft-refuse':
      case 'hard-refuse':
        setTimeout(() => setOutcomeBanner(null), 1500);
        break;
      case 'insult': {
        const goneForever = rollInsultGoneForever(hashSeed(visitor.id, 'gone-forever', tavern.lastDayProcessed));
        // Apply consequences: Tavern Rep -1 + 24h global debuff window.
        useGameStore.setState((s) => ({
          tavern: {
            ...s.tavern,
            reputation: Math.max(-5, s.tavern.reputation - 1),
            globalNegotiationDebuffUntilDay: s.tavern.lastDayProcessed + 1,
            currentRoster: goneForever
              ? s.tavern.currentRoster.filter((v) => v.id !== visitor.id)
              : s.tavern.currentRoster,
          },
        }));
        setTimeout(() => {
          setOutcomeBanner(null);
          setModal({ kind: 'insult', visitor, goneForever });
        }, 1500);
        break;
      }
    }
  };

  return (
    <div className="tv-overlay" onClick={onClose}>
      <div className="tv-panel" onClick={(e) => e.stopPropagation()}>
        <header className="tv-header">
          <div className="tv-header-info">
            <span className="tv-title">{t('tavern.title')}</span>
            <span className="tv-badge">Lv.{live.level}</span>
            <span
              className={`tv-visitors-badge ${visitorCount >= visitorCap ? 'is-full' : ''}`}
              title={t('tavern.visitorsTooltip', { count: visitorCount, cap: visitorCap })}
            >
              {visitorCount}/{visitorCap}
            </span>
          </div>
          <button className="tv-close" onClick={onClose} aria-label={t('common.close')}>✕</button>
        </header>

        <TavernKeeperRow facility={live} />

        <TavernRumorBanner rumor={tavern.rumor} keeperInt={keeperInt} />

        <div className="tv-status-bar">
          <div className="tv-rep-indicator" aria-label={t('tavern.rep.aria')}>
            {live.level >= 3 ? (
              <>
                <span>{t('tavern.rep.label')}:</span>
                <span className="tv-rep-tankards">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className={`tv-rep-tankard ${i < tavern.reputation ? 'is-filled' : ''}`}
                      aria-hidden="true"
                    >🍺</span>
                  ))}
                </span>
                <span title={`Rep: ${tavern.reputation}`} style={{ marginLeft: 6, color: 'var(--ink-text-dim)' }}>
                  ({tavern.reputation >= 0 ? '+' : ''}{tavern.reputation})
                </span>
              </>
            ) : tavern.reputation >= 3 ? (
              <span className="tv-rep-hint is-positive">{t('tavern.rep.buzzing')}</span>
            ) : tavern.reputation <= -3 ? (
              <span className="tv-rep-hint is-negative">{t('tavern.rep.poor')}</span>
            ) : (
              <span className="tv-rep-hint">{t('tavern.rep.unknown')}</span>
            )}
          </div>
          {live.level >= 2 && (
            <button
              className="tv-reroll-btn"
              onClick={() => rerollTavernRoster()}
              disabled={!canReroll}
              title={rerollDisableHint || t('tavern.reroll.tooltip')}
            >
              ↻ {t('tavern.reroll.label')} (
              <span className={`tv-reroll-cost ${gold >= rerollCost ? 'is-affordable' : 'is-broke'}`}>
                {formatGold(rerollCost)}g
              </span>)
            </button>
          )}
        </div>

        <div className="tv-grid">
          {keepers.length === 0 ? (
            <div className="tv-empty-state">
              <div>🍺</div>
              <div>{t('tavern.empty.noKeeper')}</div>
            </div>
          ) : visitorCount === 0 ? (
            <div className="tv-empty-state">
              <div>📜</div>
              <div>{t('tavern.empty.noVisitors')}</div>
            </div>
          ) : (
            tavern.currentRoster.map((v) => (
              <TavernVisitorCard
                key={v.id}
                visitor={v}
                visibilityScore={visibilityScore}
                gold={gold}
                onNegotiate={() => setModal({ kind: 'negotiate', visitor: v })}
                onHireMerc={() => setModal({ kind: 'hire-merc', visitor: v })}
              />
            ))
          )}
        </div>

        {outcomeBanner && (
          <div className={`tv-outcome-banner kind-${outcomeBanner.attemptOutcome}`}>
            {t(`tavern.outcome.${outcomeBanner.attemptOutcome}`)}
            {outcomeBanner.outcome.kind === 'success' && ` — ${outcomeBanner.outcome.tier === 'comfortable' ? t('tavern.outcome.comfortable') : t('tavern.outcome.tight')}`}
          </div>
        )}
      </div>

      {modal.kind === 'negotiate' && (
        <TavernNegotiateModal
          visitor={modal.visitor}
          keeper={negotiator}
          visibilityScore={visibilityScore}
          onClose={() => setModal({ kind: 'none' })}
          onOutcome={handleOutcome}
        />
      )}
      {modal.kind === 'counter' && (
        <TavernCounterOfferModal
          visitor={modal.visitor}
          visibilityScore={visibilityScore}
          onClose={() => setModal({ kind: 'none' })}
        />
      )}
      {modal.kind === 'hire-merc' && (
        <TavernHireMercModal
          visitor={modal.visitor}
          onClose={() => setModal({ kind: 'none' })}
        />
      )}
      {modal.kind === 'reinvite' && tavern.pendingPrompts[modal.promptIdx] && (
        <TavernReinviteModal
          prompt={tavern.pendingPrompts[modal.promptIdx]}
          visibilityScore={visibilityScore}
          keeper={negotiator}
          onClose={() => setModal({ kind: 'none' })}
        />
      )}
      {modal.kind === 'insult' && (
        <TavernInsultEventModal
          visitor={modal.visitor}
          goneForever={modal.goneForever}
          onClose={() => setModal({ kind: 'none' })}
        />
      )}
    </div>
  );
}
