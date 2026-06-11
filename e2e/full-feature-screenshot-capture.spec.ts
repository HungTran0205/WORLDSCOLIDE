/**
 * Phase 3 — Full-feature screenshot tour after importing the progress fixture.
 * Captures all 7 facility types, all HUD panels, combat, and modals.
 * Screenshots land in docs/reference/screenshots/02-facilities/ and 03-panels/.
 *
 * Run: npx playwright test e2e/full-feature-screenshot-capture.spec.ts
 */
import { test } from '@playwright/test';
import {
  waitForTitleScreen,
  waitForGameScreen,
  waitForWorldReady,
  waitForCameraSettle,
  openHudPanel,
  closePanel,
  suppressWebGLErrors,
} from './helpers/game-helpers';
import { shot, resetCounters } from './helpers/screenshot-helpers';
import { importSave } from './helpers/save-helpers';

test.setTimeout(600_000);
test.beforeEach(() => resetCounters());

/** Helper: open a facility function panel via requestFacilityPanel with the correct slot position.
 *  The proximity check in game-screen requires cameraTarget to be within 3.5 units of the facility. */
async function openFacilityFunctionPanel(page: import('@playwright/test').Page, type: string): Promise<void> {
  await page.evaluate((facilityType) => {
    // Mirror of FACILITY_SLOTS from facility-slot-positions.ts (slots 0–11)
    const SLOTS: [number, number, number][] = [
      [5, 0, -14.5], [23, 0, 3.5],  [5, 0, 21.5],  [-13, 0, 3.5],
      [-31, 0, 3.5], [-13, 0, -14.5], [5, 0, -32.5], [23, 0, -14.5],
      [41, 0, 3.5],  [23, 0, 21.5], [5, 0, 39.5],  [-13, 0, 21.5],
    ];
    const store = (window as unknown as { useGameStore: {
      getState: () => {
        facilities: Array<{ type: string; level: number; placedSlot: number | null }>;
        requestFacilityPanel: (t: string, p: [number, number, number]) => void;
      }
    } }).useGameStore;
    const facility = store.getState().facilities.find(
      (f) => f.type === facilityType && f.level > 0 && f.placedSlot !== null
    );
    if (facility && facility.placedSlot !== null) {
      store.getState().requestFacilityPanel(facilityType, SLOTS[facility.placedSlot]);
    }
  }, type);
  await page.waitForTimeout(800);
}

/** Helper: click a fp-slot by facility type name or fp-slot-hall */
async function clickFacilitySlot(page: import('@playwright/test').Page, namePattern: RegExp | string): Promise<void> {
  const slot = typeof namePattern === 'string'
    ? page.locator(namePattern)
    : page.locator('.fp-slot', { hasText: namePattern });
  if (await slot.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await slot.click();
    await waitForCameraSettle(page);
  }
}

// ── Boot + import fixture ───────────────────────────────────────────────────

async function bootAndImport(page: import('@playwright/test').Page): Promise<void> {
  await suppressWebGLErrors(page);
  await page.goto('/');
  await waitForTitleScreen(page);

  // Start new game on slot 2 (leave slot 1 for tutorial run)
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.waitForSelector('.title-save-picker', { timeout: 10_000 });
  const slots = page.locator('.save-slot-card');
  const targetSlot = (await slots.count()) >= 2 ? slots.nth(1) : slots.first();
  await targetSlot.click();
  const overwriteBtn = page.getByRole('button', { name: /yes.*overwrite/i });
  if (await overwriteBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await overwriteBtn.click();
  } else {
    await page.getByRole('button', { name: /start new game/i }).click();
  }

  // ── Char creation (same quick path as tutorial test) ──
  await page.waitForSelector('.char-creation-overlay', { timeout: 30_000 });
  await page.locator('.civ-card:not(.civ-card--locked)').first().click();
  await page.locator('.panel-btn.char-create-nav-btn', { hasText: /continue/i }).click();
  await page.waitForSelector('.archetype-tile', { timeout: 10_000 });
  await page.locator('.archetype-tile').first().click();
  await page.locator('.panel-btn.char-create-nav-btn', { hasText: /continue/i }).click();
  await page.waitForSelector('.mask-tile', { timeout: 10_000 });
  await page.locator('.mask-tile').first().click();
  await page.locator('.panel-btn.char-create-nav-btn', { hasText: /continue/i }).click();
  await page.waitForSelector('.char-create-fields', { timeout: 10_000 });
  await page.locator('input[placeholder*="name"], input[placeholder*="Name"]').first().fill('Tour');
  await page.locator('input[placeholder*="guild"], input[placeholder*="Guild"]').first().fill('Tour Guild');
  // Dump all 50 stat points
  const addFiveBtn = page.locator('.stat-allocator button', { hasText: '+5' }).first();
  for (let i = 0; i < 10; i++) await addFiveBtn.click();
  await page.locator('.panel-btn.char-create-nav-btn', { hasText: /begin/i }).click();

  // ── Game screen + world ready ──
  await waitForGameScreen(page);
  await waitForWorldReady(page);
  await waitForCameraSettle(page);

  // ── Advance past arrival-alarm (Settings → Import Save requires being in-game) ──
  // RetroSpeechBubble: click twice (skip typewriter, then advance)
  const bubble = page.locator('.retro-speech-bubble, .retro-bubble-container');
  if (await bubble.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await bubble.first().click();
    await page.waitForTimeout(300);
    await bubble.first().click();
    await page.waitForTimeout(500);
  }

  // ── Import the full-progress fixture ──
  await importSave(page);
  await waitForWorldReady(page);
  await waitForCameraSettle(page);
}

// ── Facilities ──────────────────────────────────────────────────────────────

test('facilities: all 7 types scene + panel', async ({ page }) => {
  await bootAndImport(page);

  // Open Facilities panel
  await openHudPanel(page, 'Facilities');
  await shot(page, '02-facilities', 'facilities-panel-grid-overview');

  // Guild Hall (center slot)
  await page.locator('.fp-slot-hall').click();
  await waitForCameraSettle(page);
  await closePanel(page);
  await waitForCameraSettle(page);
  await shot(page, '02-facilities', 'guild-hall-wide');
  await openHudPanel(page, 'Facilities');

  const FACILITY_TYPES: Array<{ type: string; label: RegExp }> = [
    { type: 'logging-site',  label: /logging.?site/i },
    { type: 'tavern',        label: /^Tavern$/i },
    { type: 'training-yard', label: /training.?yard/i },
    { type: 'infirmary',     label: /infirmary/i },
    { type: 'workshop',      label: /workshop/i },
    { type: 'stone-quarry',  label: /stone.?quarry/i },
    { type: 'alchemy-lab',   label: /alchemy.?lab/i },
  ];

  for (const { type, label } of FACILITY_TYPES) {
    // Click the slot in the facilities panel
    const slot = page.locator('.fp-slot:not(.fp-slot-hall)', { hasText: label });
    if (!await slot.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // Slot may be empty/locked — click first empty slot and screenshot
      const emptySlot = page.locator('.fp-slot-empty').first();
      if (await emptySlot.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await emptySlot.click();
        await waitForCameraSettle(page);
        await shot(page, '02-facilities', `${type}-build-picker`);
        await page.keyboard.press('Escape');
      }
      continue;
    }

    await slot.click();
    await waitForCameraSettle(page);
    await shot(page, '02-facilities', `${type}-tray`);

    // Close panel overlay to see the 3D scene
    await closePanel(page);
    await waitForCameraSettle(page);
    await shot(page, '02-facilities', `${type}-scene`);

    // Re-open facilities panel for the next iteration
    await openHudPanel(page, 'Facilities');

    // Workshop: also open function panel and capture each tab
    if (type === 'workshop') {
      await closePanel(page);
      await openFacilityFunctionPanel(page, 'workshop');
      await page.waitForSelector('.ws-tabs', { timeout: 10_000 });
      for (const tabLabel of ['Craft', 'Dismantle', 'Enhance', 'Repair']) {
        const tabBtn = page.locator('.ws-tab', { hasText: new RegExp(`^${tabLabel}$`, 'i') });
        if (await tabBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await tabBtn.click();
          await page.waitForTimeout(400);
          await shot(page, '02-facilities', `workshop-tab-${tabLabel.toLowerCase()}`);
        }
      }
      // Close workshop panel
      await page.locator('.panel-close-btn').first().click().catch(() => {});
      await openHudPanel(page, 'Facilities');
    }
  }
});

// ── HUD Panels ───────────────────────────────────────────────────────────────

test('panels: quest board, roster, settings', async ({ page }) => {
  await bootAndImport(page);

  // Quest board
  await openHudPanel(page, 'Quests');
  await shot(page, '03-panels', 'quest-board-list');

  const firstQuest = page.locator('.quest-card').first();
  if (await firstQuest.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await firstQuest.click();
    await page.waitForTimeout(400);
    await shot(page, '03-panels', 'quest-detail-pane');
  }

  // Active missions (if any in the fixture)
  const activeTab = page.locator('[class*="quest-tab"], button', { hasText: /active/i }).first();
  if (await activeTab.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await activeTab.click();
    await page.waitForTimeout(400);
    await shot(page, '03-panels', 'active-missions-list');
  }
  await closePanel(page);

  // Roster
  await openHudPanel(page, 'Roster');
  await shot(page, '03-panels', 'roster-overview');

  const firstMember = page.locator('[class*="roster-card"], [class*="member-card"]').first();
  if (await firstMember.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await firstMember.click();
    await page.waitForTimeout(400);
    await shot(page, '03-panels', 'roster-member-detail');
    await page.keyboard.press('Escape');
  }
  await closePanel(page);

  // Settings
  await openHudPanel(page, 'Settings');
  await shot(page, '03-panels', 'settings-panel');
  await closePanel(page);
});

// ── Combat sequence ──────────────────────────────────────────────────────────

test('panels: combat sequence', async ({ page }) => {
  await bootAndImport(page);

  // Open quest board and pick the first available quest
  await openHudPanel(page, 'Quests');
  await page.waitForSelector('.quest-card', { timeout: 10_000 });

  const quest = page.locator('.quest-card').first();
  await quest.click();
  await page.waitForTimeout(500);
  await shot(page, '03-panels', 'combat-quest-selected');

  // Add a member to the party slot if possible
  const partySlot = page.locator('[class*="party-slot"]:not([class*="occupied"])').first();
  if (await partySlot.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await partySlot.click();
    const member = page.locator('[class*="member-pick"], [class*="roster-member"]').first();
    if (await member.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await member.click();
    }
  }

  await shot(page, '03-panels', 'combat-formation-setup');

  // Dispatch
  const dispatchBtn = page.locator('.dispatch-button');
  if (await dispatchBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await dispatchBtn.click();
  }

  // Wait for combat or traveling state
  await page.waitForFunction(
    () => {
      const store = (window as unknown as Record<string, unknown>).useGameStore as
        | { getState: () => { gameScene: string; arenaPhase: string } }
        | undefined;
      const s = store?.getState();
      return s?.gameScene === 'combat' || s?.arenaPhase === 'fighting';
    },
    undefined,
    { timeout: 60_000 },
  ).catch(() => {
    console.log('[combat] combat scene not reached — quest may need travel first');
  });

  await waitForCameraSettle(page);
  await shot(page, '03-panels', 'combat-active-view');

  // Wait for combat to resolve
  await page.waitForFunction(
    () => {
      const store = (window as unknown as Record<string, unknown>).useGameStore as
        | { getState: () => { arenaPhase: string } }
        | undefined;
      return store?.getState().arenaPhase === 'result';
    },
    undefined,
    { timeout: 300_000 },
  ).catch(() => {});

  await shot(page, '03-panels', 'combat-result');
});

// ── Tavern negotiation ───────────────────────────────────────────────────────

test('panels: tavern negotiate flow', async ({ page }) => {
  await bootAndImport(page);

  // Open tavern function panel via store bridge
  await openFacilityFunctionPanel(page, 'tavern');
  await page.waitForTimeout(1_000);

  // If tavern panel is visible, screenshot visitor and try negotiate
  const tavernPanel = page.locator('.panel-overlay');
  if (await tavernPanel.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await shot(page, '03-panels', 'tavern-panel-visitor-roster');

    const negotiateBtn = page.locator('.tv-btn.is-primary').first();
    if (await negotiateBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await negotiateBtn.click();
      await page.waitForTimeout(600);
      await shot(page, '03-panels', 'tavern-negotiate-modal');

      // Close modal
      const closeBtn = page.locator('.tv-btn', { hasText: /cancel|close|✕/i }).first();
      if (await closeBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await closeBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }
  } else {
    await shot(page, '03-panels', 'tavern-no-visitor-state');
  }
});
