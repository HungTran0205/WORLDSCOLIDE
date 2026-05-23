/**
 * Quest Board — unified split-pane panel (list + detail in one surface).
 * Replaces the legacy slide-in panel + stacked detail modal flow.
 * Parchment skin (Phase 1 tokens); mobile <1024px swaps list/detail.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { QuestTier, Mission } from '@/game/state/game-state';
import { useGameStore } from '@/game/state/store';
import { MISSIONS } from '@/game/data/missions';
import { validateDispatch, createActiveMission } from '@/game/systems/mission-dispatch';
import { QUEST_BOARD_TIER_BY_LEVEL } from '@/game/data/buildings';
import { GameIcon } from '@/ui/components/game-icon';
import { playSFX } from '@/audio/audio-manager';
import { AUDIO } from '@/audio/audio-keys';
import { QuestCard } from './quest-card';
import { QuestDetailPane } from './quest-detail-pane';
import '@/ui/styles/panels.css';
import '@/ui/styles/quest-board.css';

const PAPER_FLIP_DEBOUNCE_MS = 120;

const TIER_ORDER: QuestTier[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
const MOBILE_BREAKPOINT = 1024;

interface QuestBoardProps {
  onClose: () => void;
}

export function QuestBoard({ onClose }: QuestBoardProps) {
  const { t } = useTranslation();
  const founder = useGameStore((s) => s.founder);
  const roster = useGameStore((s) => s.roster);
  const guildHall = useGameStore((s) => s.guildHall);
  const gold = useGameStore((s) => s.gold);
  const dispatchMission = useGameStore((s) => s.dispatchMission);
  const updateMemberStatus = useGameStore((s) => s.updateMemberStatus);
  const completedMissions = useGameStore((s) => s.completedMissions);
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);
  const mercContracts = useGameStore((s) => s.tavern.mercContracts);
  const markMercsOnQuest = useGameStore((s) => s.markMercsOnQuest);

  const availableMembers = useMemo(() => {
    const all = founder ? [founder, ...roster] : roster;
    return all.filter((m) => m.status === 'idle');
  }, [founder, roster]);

  const unlockedTiers = useMemo(() => {
    const questBoardFurniture = guildHall.furniture.find((f) => f.type === 'quest-board');
    const maxLevel = questBoardFurniture?.level ?? 1;
    const maxTier = QUEST_BOARD_TIER_BY_LEVEL[maxLevel] ?? 'F';
    const maxIdx = TIER_ORDER.indexOf(maxTier);
    return TIER_ORDER.slice(0, maxIdx + 1);
  }, [guildHall]);

  const [filterTier, setFilterTier] = useState<QuestTier | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'main' | 'expedition'>('main');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  // Paper-unroll on open / seal-break on close. The cleanup fires after the
  // store flips activePanel back to null (panel unmount) which matches the
  // expected close-beat audio.
  useEffect(() => {
    playSFX(AUDIO.SFX_PAPER_UNROLL);
    return () => {
      playSFX(AUDIO.SFX_SEAL_BREAK);
    };
  }, []);

  // Auto-focus the first quest card so keyboard / screen-reader users land
  // inside the dialog. Microtask delay lets the unroll animation start first.
  const listPaneRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = window.setTimeout(() => {
      const first = listPaneRef.current?.querySelector<HTMLButtonElement>('.quest-card');
      first?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  // Debounced paper-flip when the user grazes quest scrolls. Multiple hovers
  // within PAPER_FLIP_DEBOUNCE_MS coalesce to one play to avoid the SFX
  // stacking on top of itself when sweeping the cursor over the list.
  const lastFlipRef = useRef(0);
  const handleCardHover = useCallback(() => {
    const now = performance.now();
    if (now - lastFlipRef.current < PAPER_FLIP_DEBOUNCE_MS) return;
    lastFlipRef.current = now;
    playSFX(AUDIO.SFX_PAPER_FLIP);
  }, []);

  const handleMemberToggleSfx = useCallback(() => {
    playSFX(AUDIO.SFX_WOOD_CLINK);
  }, []);

  // During the tutorial only tutorial quests appear (drives the accept-quest
  // beat); after completion the board splits into MAIN (story) + EXPEDITION
  // (repeatable) tabs. Tutorial quests are excluded from both tabs.
  const isTutorialActive = tutorialStep !== 'complete';

  const tutorialMissions = useMemo<Mission[]>(
    () =>
      MISSIONS.filter(
        (m) =>
          m.id.startsWith('tutorial-') &&
          !completedMissions.includes(m.id) &&
          unlockedTiers.includes(m.tier) &&
          (!m.prerequisiteId || completedMissions.includes(m.prerequisiteId)),
      ),
    [completedMissions, unlockedTiers],
  );

  // MAIN: story quests with prerequisite met, not yet completed. Not tier-gated
  // — Arc 1 story quests stay visible regardless of quest-board level.
  const mainMissions = useMemo<Mission[]>(
    () =>
      MISSIONS.filter(
        (m) =>
          m.isMainQuest &&
          !m.id.startsWith('tutorial-') &&
          !completedMissions.includes(m.id) &&
          (!m.prerequisiteId || completedMissions.includes(m.prerequisiteId)),
      ),
    [completedMissions],
  );

  // EXPEDITION: repeatable quests + legacy missions without a tab flag
  // (backward compat). Tier-gated by quest-board level, same as before.
  const expeditionMissions = useMemo<Mission[]>(
    () =>
      MISSIONS.filter(
        (m) =>
          (m.isExpedition || (!m.isMainQuest && !m.id.startsWith('tutorial-'))) &&
          (filterTier === 'all' || m.tier === filterTier) &&
          unlockedTiers.includes(m.tier) &&
          (!m.prerequisiteId || completedMissions.includes(m.prerequisiteId)),
      ),
    [completedMissions, filterTier, unlockedTiers],
  );

  const displayedMissions = isTutorialActive
    ? tutorialMissions
    : activeTab === 'main'
      ? mainMissions
      : expeditionMissions;

  const selectedMission = useMemo(
    () => displayedMissions.find((m) => m.id === selectedId) ?? null,
    [displayedMissions, selectedId],
  );

  // Clear selection if the displayed missions no longer include it
  useEffect(() => {
    if (selectedId && !displayedMissions.some((m) => m.id === selectedId)) {
      setSelectedId(null);
    }
  }, [displayedMissions, selectedId]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileView('detail');
    // Tutorial beat 4 → 5: selecting the tutorial quest advances to assign-and-dispatch.
    if (tutorialStep === 'accept-bear-quest' && id.startsWith('tutorial-')) {
      setTutorialStep('assign-and-dispatch');
    }
  };

  const handleDispatch = (memberIds: string[], mercContractIds: string[] = []) => {
    if (!selectedMission) return;
    const allMembers = [...(founder ? [founder] : []), ...roster];
    const party = allMembers.filter((m) => memberIds.includes(m.id));
    const mercs = mercContracts.filter((c) => mercContractIds.includes(c.id));
    const validation = validateDispatch(selectedMission, party, mercs, gold);
    if (!validation.valid) return;
    const now = Date.now();
    dispatchMission(createActiveMission(selectedMission, memberIds, mercContractIds, now));
    memberIds.forEach((id) => updateMemberStatus(id, 'on-mission'));
    if (mercContractIds.length > 0) markMercsOnQuest(mercContractIds, selectedMission.id);
    setSelectedId(null);
    setMobileView('list');
    playSFX(AUDIO.SFX_INK_STAMP);
    playSFX(AUDIO.SFX_DISPATCH);
  };

  const isMobile = useIsMobile();
  // Tier pills are an expedition-only affordance (Arc 1 main quests are all
  // tier F) and stay hidden during the tutorial.
  const showTierFilter = !isTutorialActive && activeTab === 'expedition';

  return (
    <div
      className="quest-board-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="quest-board parchment-surface parchment-frame parchment-rivets parchment-anim-unroll"
        role="dialog"
        aria-label={t('questBoard.ariaLabel')}
        aria-modal="true"
        data-mobile-view={isMobile ? mobileView : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="quest-board__header">
          <h2 className="quest-board__title parchment-title">{t('questBoard.title')}</h2>
          {!isTutorialActive && (
            <div className="quest-board__tabs" role="tablist" aria-label={t('questBoard.tabsAria')}>
              {(['main', 'expedition'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  className={`quest-board__tab${activeTab === tab ? ' quest-board__tab--active' : ''}`}
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'main' ? t('questBoard.tabMain') : t('questBoard.tabExpedition')}
                </button>
              ))}
            </div>
          )}
          {showTierFilter && (
            <div className="quest-board__filter" role="toolbar" aria-label={t('questBoard.filter.ariaLabel')}>
              <button
                type="button"
                className={`tier-pill${filterTier === 'all' ? ' tier-pill--active' : ''}`}
                onClick={() => setFilterTier('all')}
                aria-pressed={filterTier === 'all'}
              >
                {t('questBoard.filter.all')}
              </button>
              {unlockedTiers.map((tier) => (
                <button
                  key={tier}
                  type="button"
                  className={`tier-pill${filterTier === tier ? ' tier-pill--active' : ''}`}
                  onClick={() => setFilterTier(tier)}
                  aria-pressed={filterTier === tier}
                  aria-label={t('questBoard.filter.tierAria', { tier })}
                >
                  <GameIcon category="badge" id={tier} size={24} fallbackText={tier} />
                </button>
              ))}
            </div>
          )}
        </header>

        <div className="quest-board__body">
          <div
            ref={listPaneRef}
            className="quest-list-pane"
            aria-label={t('questBoard.listAria')}
          >
            {displayedMissions.length === 0 ? (
              <div className="quest-list-pane__empty">{t('questBoard.empty')}</div>
            ) : (
              displayedMissions.map((m) => (
                <QuestCard
                  key={m.id}
                  mission={m}
                  selected={m.id === selectedId}
                  onClick={() => handleSelect(m.id)}
                  onHover={handleCardHover}
                />
              ))
            )}
          </div>

          <QuestDetailPane
            mission={selectedMission}
            availableMembers={availableMembers}
            gold={gold}
            onDispatch={handleDispatch}
            onMemberToggle={handleMemberToggleSfx}
            onBack={isMobile ? () => setMobileView('list') : undefined}
          />
        </div>

        <button
          type="button"
          className="quest-board__return"
          onClick={onClose}
          aria-label={t('questBoard.returnAria')}
        >
          <span className="quest-board__return-icon" aria-hidden="true">⮌</span>
          {t('questBoard.return')}
        </button>
      </div>
    </div>
  );
}

/** Tracks viewport width to swap to mobile single-pane layout */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT,
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}
