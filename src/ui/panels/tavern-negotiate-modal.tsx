/**
 * Tavern negotiate modal — modifier picker + rate preview + roll execution.
 *
 * Uses `buildModifierBundle` from tavern-negotiation.ts (single source of truth
 * for preview AND roll, per AD H5). Rate preview shown only when visibility ≥ 40.
 *
 * On Roll: dispatches local rollNegotiation, updates attemptHistory in store via
 * a direct setState mutation (tracked separately under tavern.currentRoster), and
 * routes outcome to the appropriate downstream modal/toast through parent callback.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import { getTraitDef } from '@/game/data/traits';
import type { Member, TavernVisitor, AttemptRecord } from '@/game/state/game-state';
import {
  buildModifierBundle,
  keeperNegotiation,
  rollNegotiation,
  successRate,
  sumModifiers,
  targetDemand,
  type GiftSpec,
  type NegotiationResult,
  type TavernGameSnapshot,
} from '@/game/systems/tavern-negotiation';
import { attemptSeed, hashSeed } from '@/game/systems/seeded-rng';
import { TavernInventoryGiftPicker } from './tavern-inventory-gift-picker';

interface NegotiateModalProps {
  visitor: TavernVisitor;
  keeper: Member | null;
  visibilityScore: number;
  onClose: () => void;
  onOutcome: (result: NegotiationResult, visitor: TavernVisitor) => void;
}

const formatGold = (n: number) => new Intl.NumberFormat('en-US').format(n);

export function TavernNegotiateModal({ visitor, keeper, visibilityScore, onClose, onOutcome }: NegotiateModalProps) {
  const { t } = useTranslation();
  const gold = useGameStore((s) => s.gold);
  const guildLevel = useGameStore((s) => s.guildLevel);
  const tavernState = useGameStore((s) => s.tavern);

  const [gift, setGift] = useState<GiftSpec | undefined>();
  const [showGiftPicker, setShowGiftPicker] = useState(false);
  const [rolling, setRolling] = useState(false);

  const snapshot: TavernGameSnapshot = {
    gold,
    guildLevel,
    tavernLevel: tavernState.level,
    tavernReputation: tavernState.reputation,
    globalNegotiationDebuffUntilDay: tavernState.globalNegotiationDebuffUntilDay,
    currentDay: tavernState.lastDayProcessed,
  };

  const mods = useMemo(() => {
    if (!keeper) return null;
    return buildModifierBundle(keeper, visitor, snapshot, { gift });
  }, [keeper, visitor, snapshot, gift]);

  const netMod = mods ? sumModifiers(mods) : 0;
  const kNeg = keeper ? keeperNegotiation(keeper) : 0;
  const demand = targetDemand(visitor);
  const rate = visitor.guaranteedRecruit ? 100 : (mods ? successRate(kNeg, demand, netMod) : 0);
  const showRate = visibilityScore >= 32 || Boolean(visitor.guaranteedRecruit);

  const giftLabel = gift ? `${gift.itemId} (${gift.tier === 'personal' ? '+15%' : '+5%'})` : t('tavern.modifier.giftPlaceholder');

  const handleRoll = () => {
    if (!keeper || !mods || rolling) return;
    setRolling(true);
    const seed = attemptSeed(
      hashSeed(tavernState.lastDayProcessed, 'tavern-roll'),
      visitor.id,
      visitor.attemptHistory.length,
    );
    const result = rollNegotiation(keeper, visitor, mods, seed);

    // Append the attempt to the visitor's history (for refusal-decay math).
    const record: AttemptRecord = {
      day: tavernState.lastDayProcessed,
      margin: result.margin,
      outcome: result.attemptOutcome,
    };
    useGameStore.setState((s) => ({
      tavern: {
        ...s.tavern,
        currentRoster: s.tavern.currentRoster.map((v) =>
          v.id === visitor.id
            ? { ...v, attemptHistory: [...v.attemptHistory, record] }
            : v,
        ),
      },
    }));

    // Consume gift from inventory — gift is given to the visitor on each roll attempt.
    if (gift) {
      useGameStore.getState().removeItem(gift.itemId, 1);
    }

    setTimeout(() => {
      onOutcome(result, visitor);
      setRolling(false);
    }, 400);
  };

  if (!keeper) {
    return (
      <div className="tv-modal-overlay" onClick={onClose}>
        <div className="tv-modal-secondary parchment-surface parchment-frame" onClick={(e) => e.stopPropagation()}>
          <h3 className="parchment-title">{t('tavern.negotiate.noKeeperTitle')}</h3>
          <div className="parchment-text">{t('tavern.negotiate.noKeeperBody')}</div>
          <div className="tv-modal-footer">
            <button className="tv-btn is-primary" onClick={onClose}>{t('common.ok')}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="tv-modal-overlay" onClick={onClose}>
        <div className="tv-negotiate-modal parchment-surface parchment-frame" onClick={(e) => e.stopPropagation()}>
          <div className="tv-modal-header">
            <h3 className="tv-modal-title parchment-title">{t('tavern.negotiate.title')}</h3>
            <button className="tv-btn is-small is-ghost" onClick={onClose}>✕</button>
          </div>

          <div className="tv-negotiate-body">
            <div>
              <div className="parchment-text" style={{ marginBottom: 6 }}>
                <strong>{visitor.name}</strong>
                <div>{visitor.civilization} · Lv{visitor.level} · {'★'.repeat(visitor.rarity)}</div>
                {visibilityScore >= 22 && visitor.traits.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    {visitor.traits.map((tr) => (
                      <span key={tr} className="tv-trait-chip" style={{ marginRight: 4 }}
                        title={t(getTraitDef(tr)?.descKey ?? tr)}>
                        {t(getTraitDef(tr)?.displayKey ?? tr)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="parchment-text" style={{ fontSize: '0.75rem' }}>
                <strong>{keeper.name}</strong> · CHA {keeper.stats.CHA} · INT {keeper.stats.INT}<br />
                {t('tavern.negotiate.keeperNeg')}: <strong>{kNeg}</strong>
              </div>
            </div>

            <div>
              <div className="tv-mod-list">
                <ModRow label={t('tavern.modifier.treasuryFlex')} value={mods!.treasuryFlex ? 5 : 0} active={mods!.treasuryFlex} />
                <ModRow label={t('tavern.modifier.tavernLevel', { lvl: mods!.tavernLevel })} value={mods!.tavernLevel * 2} active />
                <ModRow label={t('tavern.modifier.guildFame')} value={mods!.guildFame} active />
                <ModRow label={t('tavern.modifier.traitMatch', { n: mods!.shareTraitCount })} value={mods!.shareTraitCount * 10} active={mods!.shareTraitCount > 0} />
                {mods!.recentRefusalCount > 0 && (
                  <ModRow label={t('tavern.modifier.refusal', { n: mods!.recentRefusalCount })} value={Math.max(-40, mods!.recentRefusalCount * -10)} active penalty />
                )}
                {mods!.tavernReputation !== 0 && (
                  <ModRow label={t('tavern.modifier.tavernRep')} value={mods!.tavernReputation * 5} active penalty={mods!.tavernReputation < 0} />
                )}
                {mods!.globalNegotiationDebuff !== 0 && (
                  <ModRow label={t('tavern.modifier.postInsultDebuff')} value={mods!.globalNegotiationDebuff} active penalty />
                )}
                <div
                  className="tv-mod-row is-interactive"
                  onClick={() => setShowGiftPicker(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') setShowGiftPicker(true); }}
                >
                  <span>🎁 {giftLabel}</span>
                  <span>{gift ? (gift.tier === 'personal' ? '+15%' : '+5%') : '+0%'}</span>
                </div>
                <div className="tv-mod-row tv-mod-net">
                  <span>{t('tavern.modifier.net')}</span>
                  <span>{netMod >= 0 ? '+' : ''}{netMod}%</span>
                </div>
              </div>

              <div className="tv-rate-gauge" style={{ marginTop: 10 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--ink-faded)', fontFamily: 'var(--font-display)' }}>
                  {t('tavern.negotiate.successChance')}
                </span>
                {showRate ? (
                  <>
                    <div className="tv-rate-bar">
                      <div className="tv-rate-bar-fill" style={{ width: `${rate}%` }} />
                    </div>
                    <span className={`tv-rate-pct ${rate < 30 ? 'is-low' : rate < 60 ? 'is-mid' : 'is-high'}`}>
                      {Math.round(rate)}%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="tv-rate-locked">???</span>
                    <span className="tv-rate-hint">{t('tavern.negotiate.lockedHint')}</span>
                  </>
                )}
                <span className="tv-rate-meta">
                  {t('tavern.negotiate.demand')}: {formatGold(demand)} · {t('tavern.negotiate.neg')}: {kNeg}
                </span>
              </div>
            </div>
          </div>

          <div className="tv-modal-footer">
            <button className="tv-btn is-ghost" onClick={onClose} disabled={rolling}>{t('common.cancel')}</button>
            <button className="tv-btn is-primary" onClick={handleRoll} disabled={rolling}>
              {rolling ? t('tavern.negotiate.rolling') : t('tavern.negotiate.roll')}
            </button>
          </div>
        </div>
      </div>

      {showGiftPicker && (
        <TavernInventoryGiftPicker
          visitor={visitor}
          visibilityScore={visibilityScore}
          onClose={() => setShowGiftPicker(false)}
          onPick={setGift}
        />
      )}
    </>
  );
}

function ModRow({ label, value, active, penalty }: { label: string; value: number; active: boolean; penalty?: boolean }) {
  return (
    <div className={`tv-mod-row ${penalty ? 'is-penalty' : ''}`}>
      <span>{active ? '☑' : '☐'} {label}</span>
      <span>{value >= 0 ? '+' : ''}{value}%</span>
    </div>
  );
}
