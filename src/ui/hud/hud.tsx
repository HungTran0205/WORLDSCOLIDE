import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '@/game/state/store';
import { useUiStore } from '@/game/state/ui-store';
import { GoldDisplay } from '@/ui/components/gold-display';
import { ResourceBar } from '@/ui/components/resource-bar';
import { SaveStatusBadge } from './save-status-badge';
import { PanelToggle } from './panel-toggle';
import { FacilityCompass } from './facility-compass';
import { InventoryPanel } from '@/ui/panels/inventory-panel';
import { formatGameTime } from '@/game/utils/format-game-time';
import { calcTotalUpkeep } from '@/game/systems/upkeep-system';
import { getCurrentStep } from '@/game/systems/tutorial-manager';
import { tContent } from '@/i18n/content-localization';
import '@/ui/styles/hud.css';

/** Compute upkeep inside selector to return primitive (avoids new array ref → infinite re-render) */
const selectDailyUpkeep = (s: { founder: import('@/game/state/game-state').Member | null; roster: import('@/game/state/game-state').Member[] }): number => {
  const all = s.founder ? [s.founder, ...s.roster] : s.roster;
  return calcTotalUpkeep(all);
};

export function HUD() {
  const { t } = useTranslation();
  const gold = useGameStore((s) => s.gold);
  const gameTime = useGameStore((s) => s.gameTime);
  const rosterCount = useGameStore((s) => s.roster.length);
  const hasFounder = useGameStore((s) => s.founder !== null);
  const missionCount = useGameStore((s) => s.activeMissions.length);
  const dailyUpkeep = useGameStore(selectDailyUpkeep);
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const memberCount = rosterCount + (hasFounder ? 1 : 0);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const inventoryMode  = useUiStore(s => s.inventoryMode);
  const closeEquipMode = useUiStore(s => s.closeEquipMode);

  useEffect(() => {
    if (inventoryMode === 'equip') setInventoryOpen(true);
  }, [inventoryMode]);

  const stepConfig = getCurrentStep(tutorialStep);
  // Resolve the hint message through the content namespace so VN players see a
  // translated hint. The EN inline string is the defaultValue fallback.
  const rawMessage = stepConfig?.message ?? '';
  const hintMessage = rawMessage
    ? tContent('tutorial', tutorialStep, 'message', rawMessage)
    : '';
  const highlightPanel = stepConfig?.highlightPanel ?? null;

  return (
    <div className="hud-overlay">
      <div className="hud-top-bar">
        <span className="hud-clock">{formatGameTime(gameTime)}</span>
        <GoldDisplay amount={gold} />
        <span className="hud-upkeep">{t('hud.upkeep', { amount: dailyUpkeep })}</span>
        <ResourceBar />
        <button className="hud-inventory-btn" onClick={() => setInventoryOpen(true)}>{t('hud.inventory')}</button>
        <span>{t('hud.members', { count: memberCount })}</span>
        <span>{t('hud.missions', { count: missionCount })}</span>
        <SaveStatusBadge />
      </div>
      {/* Tutorial hint bar — shown when current step has a non-empty message */}
      {hintMessage && tutorialStep !== 'complete' && (
        <div className="tutorial-hint-bar">
          {hintMessage}
        </div>
      )}
      <FacilityCompass />
      <PanelToggle
        highlightPanel={highlightPanel}
      />
      {inventoryOpen && <InventoryPanel onClose={() => { setInventoryOpen(false); closeEquipMode(); }} />}
    </div>
  );
}
