/**
 * Maps each tutorial step id to (screenshots to capture, action that advances it).
 * Used by tutorial-playthrough-capture.spec.ts driver loop.
 *
 * Steps follow src/game/systems/tutorial-manager.ts:23-167 order.
 */
import type { Page } from '@playwright/test';
import { waitForTutorialStep } from './game-helpers';
import { shot } from './screenshot-helpers';

export interface StepConfig {
  /** Screenshot slugs to capture BEFORE advancing */
  shots: string[];
  /** Action that fires the tutorial advance. null = step auto-advances (poll). */
  advance: ((page: Page) => Promise<void>) | null;
  /** Extra timeout override for slow steps (travel/combat). Default 120s. */
  timeout?: number;
}

export const TUTORIAL_STEP_ACTIONS: Record<string, StepConfig> = {
  // ── Step 1: char-creation ────────────────────────────────────────────────
  // Handled before the driver loop (char creation is its own screen).
  'char-creation': {
    shots: ['char-creation-civ', 'char-creation-class', 'char-creation-mask', 'char-creation-identity'],
    advance: null, // driven inline in the spec
  },

  // ── Step 2: arrival-alarm ────────────────────────────────────────────────
  // WorldBoardModal → click "Begin", then NpcAlarm → click speech bubble
  'arrival-alarm': {
    shots: ['world-board-modal'],
    advance: async (page) => {
      // WorldBoardModal appears only after worldReady — 3D scene is loaded at this point
      await page.waitForSelector('.panel-btn', { timeout: 20_000 });
      await page.locator('.panel-btn', { hasText: /^Begin$/i }).first().click();

      // NpcAlarm: 1st click = skip typewriter crawl, 2nd click = onComplete
      await page.waitForSelector('.retro-bubble-overlay', { timeout: 15_000 });
      await page.locator('.retro-bubble-overlay').click(); // skip crawl
      await page.waitForTimeout(500);
      await page.locator('.retro-bubble-overlay').click(); // advance

      // Wait for the bubble to fully close (advances tutorialStep to 'open-quest-board')
      await waitForTutorialStep(page, 'open-quest-board', 20_000);
    },
  },

  // ── Step 3: open-quest-board ─────────────────────────────────────────────
  // Click "Quests" panel toggle → sets cameraFocus='quest-board' → auto-advances
  'open-quest-board': {
    shots: ['guild-hall-scene', 'quest-board-focus'],
    advance: async (page) => {
      await page
        .locator('.panel-toggle-bar button')
        .filter({ hasText: /^Quests$/i })
        .click();
      await waitForTutorialStep(page, 'accept-bear-quest', 15_000);
    },
  },

  // ── Step 4: accept-bear-quest ────────────────────────────────────────────
  // Click the first .quest-card → opens quest detail
  'accept-bear-quest': {
    shots: ['quest-board-panel', 'quest-detail'],
    advance: async (page) => {
      // Wait for quest cards to render
      await page.waitForSelector('.quest-card', { timeout: 15_000 });
      await page.locator('.quest-card').first().click();
      // Quest detail pane opens — screenshot captured in spec before advance
      await waitForTutorialStep(page, 'assign-and-dispatch', 15_000);
    },
  },

  // ── Step 5: assign-and-dispatch ──────────────────────────────────────────
  // Quest detail + party row should be visible; click Dispatch button
  'assign-and-dispatch': {
    shots: ['quest-detail-pane', 'party-assignment'],
    advance: async (page) => {
      // Click the first empty party slot to open the roster picker
      const partySlot = page.locator('.quest-party-slot').first();
      if (await partySlot.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await partySlot.click();
        // Roster picker opens: pick the first available member card
        await page.waitForSelector('.quest-roster-picker', { timeout: 5_000 });
        const memberCard = page.locator('.quest-roster-picker .member-card').first();
        if (await memberCard.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await memberCard.click();
        }
        await page.waitForTimeout(400);
      }
      // Click Dispatch
      await page.waitForSelector('.dispatch-button:not([disabled])', { timeout: 10_000 });
      await page.locator('.dispatch-button').click();
      await waitForTutorialStep(page, 'quest-travel', 20_000);
      // Click "Return to Guild" (.quest-board__return) to close the quest board.
      // The guild hall must be visible for tutorial notifications to appear.
      const returnBtn = page.locator('.quest-board__return');
      if (await returnBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await returnBtn.click();
      } else {
        // Fallback: click the quest-board-overlay backdrop to dismiss
        await page.locator('.quest-board-overlay').click({ position: { x: 10, y: 10 } }).catch(() => {});
      }
      await page.waitForSelector('.quest-board-overlay', { state: 'hidden', timeout: 5_000 }).catch(() => {});
    },
  },

  // ── Step 6: quest-travel ─────────────────────────────────────────────────
  // Auto-advance when party arrives — just wait
  'quest-travel': {
    shots: ['mission-traveling-hud'],
    advance: null,
    timeout: 180_000, // travel can take up to ~30s real-time
  },

  // ── Step 7: moonbear-combat ──────────────────────────────────────────────
  // Real combat — click the arrived mission card → ArrivalModal → Enter Battle
  // → Auto-Place formation → Start Battle → wait for result.
  'moonbear-combat': {
    shots: ['combat-prep', 'combat-fighting'],
    advance: async (page) => {
      // Wait for mission to reach 'arrived' phase (travel completes, ~30s after dispatch)
      await page.waitForFunction(
        () => {
          const store = (window as unknown as Record<string, unknown>).useGameStore as
            | { getState: () => { activeMissions: Array<{ phase: string }> } }
            | undefined;
          return store?.getState().activeMissions.some((m) => m.phase === 'arrived');
        },
        undefined,
        { timeout: 120_000 },
      );
      await page.waitForTimeout(800);

      // Click the arrived mission card — it shows "Click to start combat" text.
      // This click bubbles to the parent card's onClick which opens ArrivalModal.
      const combatPrompt = page.locator('div', { hasText: /Click to start combat/i }).last();
      await combatPrompt.click();

      // ArrivalModal opens inside .confirm-dialog-overlay
      await page.waitForSelector('.confirm-dialog-overlay', { timeout: 10_000 });

      // Click "Enter Battle" button inside the modal
      await page.locator('.panel-btn', { hasText: /Enter Battle/i }).first().click();

      // enterCombatPrep is called → gameScene = 'combat-arena', arenaPhase = 'prep'
      await page.waitForFunction(
        () => {
          const store = (window as unknown as Record<string, unknown>).useGameStore as
            | { getState: () => { gameScene: string } }
            | undefined;
          return store?.getState().gameScene === 'combat-arena';
        },
        undefined,
        { timeout: 15_000 },
      );
      await page.waitForTimeout(1_000); // let combat prep panel render

      // Auto-place party into formation slots (formation starts empty after enterCombatPrep)
      const autoPlaceBtn = page.locator('button', { hasText: /Auto-Place/i }).first();
      if (await autoPlaceBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await autoPlaceBtn.click();
        await page.waitForTimeout(500);
      }

      // Wait for formation to have at least 1 unit placed (canStart = true)
      await page.waitForFunction(
        () => {
          const store = (window as unknown as Record<string, unknown>).useGameStore as
            | { getState: () => { formation: Array<string | null> } }
            | undefined;
          return store?.getState().formation.some((id) => id !== null);
        },
        undefined,
        { timeout: 10_000 },
      );
      await shot(page, '01-tutorial', 'combat-prep');

      // Click "Start Battle" — now enabled since formation is populated
      const startBattleBtn = page.locator('button', { hasText: /^Start Battle$/i });
      await startBattleBtn.waitFor({ state: 'visible', timeout: 10_000 });
      await startBattleBtn.click();

      // Wait for arenaPhase = 'fighting'
      await page.waitForFunction(
        () => {
          const store = (window as unknown as Record<string, unknown>).useGameStore as
            | { getState: () => { arenaPhase: string } }
            | undefined;
          return store?.getState().arenaPhase === 'fighting';
        },
        undefined,
        { timeout: 60_000 },
      ).catch(() => {});
      await page.waitForTimeout(1_000); // let fighting panel render
      await shot(page, '01-tutorial', 'combat-fighting');

      // Wait for gameStore.arenaPhase = 'result' (set by endCombat after arena finishes)
      await page.waitForFunction(
        () => {
          const store = (window as unknown as Record<string, unknown>).useGameStore as
            | { getState: () => { arenaPhase: string } }
            | undefined;
          return store?.getState().arenaPhase === 'result';
        },
        undefined,
        { timeout: 180_000 },
      );

      // Wait for CombatPanelResult to render its "Continue" button
      await page.locator('.combat-panel-btn--primary').waitFor({ state: 'visible', timeout: 10_000 });
      await page.waitForTimeout(500);

      // Click "Continue" → handleClose() → closeCombatPanel() + exitArena()
      await page.locator('.combat-panel-btn--primary').first().click();

      await waitForTutorialStep(page, 'kael-rescue', 30_000);
    },
  },

  // ── Step 8: kael-rescue ──────────────────────────────────────────────────
  // KaelRescueDialogue modal — click "Welcome aboard" panel-btn
  'kael-rescue': {
    shots: ['kael-rescue-dialogue'],
    advance: async (page) => {
      await page.waitForSelector('.panel-btn', { timeout: 20_000 });
      // "Welcome aboard" is the CTA
      await page.locator('.panel-btn', { hasText: /welcome aboard/i }).first().click();
      await waitForTutorialStep(page, 'reward-splash', 10_000);
    },
  },

  // ── Step 9: reward-splash ────────────────────────────────────────────────
  // TutorialRewardSplash — click "Continue"
  'reward-splash': {
    shots: ['tutorial-reward-splash'],
    advance: async (page) => {
      await page.waitForSelector('.panel-btn', { timeout: 10_000 });
      await page.locator('.panel-btn', { hasText: /^Continue$/i }).first().click();
      await waitForTutorialStep(page, 'build-logging-site', 10_000);
    },
  },

  // ── Step 10: build-logging-site ──────────────────────────────────────────
  // Open Facilities → click empty slot → click logging-site build button
  'build-logging-site': {
    shots: ['facilities-panel-grid', 'build-picker-logging'],
    advance: async (page) => {
      // Close any leftover overlay (quest board) before opening Facilities
      const questOverlay = page.locator('.quest-board-overlay');
      if (await questOverlay.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
      // Open facilities panel (uses .fp-overlay, not .panel-overlay)
      await page
        .locator('.panel-toggle-bar button')
        .filter({ hasText: /^Facilities$/i })
        .click();
      await page.waitForSelector('.fp-overlay', { timeout: 10_000 });

      // Click an empty slot → opens FacilityBuildPicker
      await page.waitForSelector('.fp-slot-empty', { timeout: 10_000 });
      await page.locator('.fp-slot-empty').first().click();

      // Step 1: click the Logging Site icon card to select it
      await page.waitForSelector('.fp-bp-card', { timeout: 10_000 });
      await page.locator('.fp-bp-card', { hasText: /Logging Site/i }).first().click();
      await page.waitForTimeout(300);

      // Step 2: click the .fp-bp-build-btn (now enabled with facility name)
      await page.locator('.fp-bp-build-btn:not([disabled])').waitFor({ timeout: 5_000 });
      await page.locator('.fp-bp-build-btn').click();

      // Step 3: InkConfirmDialog appears → click .fp-btn-confirm ("Build")
      await page.waitForSelector('.fp-btn-confirm', { timeout: 5_000 });
      await page.locator('.fp-btn-confirm').click();

      await waitForTutorialStep(page, 'assign-kael', 20_000);
    },
  },

  // ── Step 11: assign-kael ─────────────────────────────────────────────────
  // Click the built Logging Site slot → facility tray opens → click assign card → pick Kael
  'assign-kael': {
    shots: ['facility-detail-tray-logging'],
    advance: async (page) => {
      // After build, selectedSlot resets to null. Click the built Logging Site slot to open tray.
      await page.waitForSelector('.fp-slot', { timeout: 10_000 });
      await page.locator('.fp-slot', { hasText: /Logging Site/i }).first().click();

      // Facility detail tray opens — select Kael by name (handler requires member.name === 'Kael')
      await page.waitForSelector('.fp-assign-card select', { timeout: 10_000 });
      const kaelOpt = page.locator('.fp-assign-card select option').filter({ hasText: /Kael/i }).first();
      const kaelVal = await kaelOpt.getAttribute('value');
      if (!kaelVal) throw new Error('assign-kael: Kael not found in assign dropdown');
      await page.locator('.fp-assign-card select').first().selectOption(kaelVal);

      await waitForTutorialStep(page, 'first-haul-reward', 30_000);
    },
  },

  // ── Step 12: first-haul-reward ───────────────────────────────────────────
  // TutorialFirstHaulSplash — click "Continue"
  'first-haul-reward': {
    shots: ['first-haul-splash'],
    advance: async (page) => {
      await page.waitForSelector('.panel-btn', { timeout: 20_000 });
      await page.locator('.panel-btn', { hasText: /^Continue$/i }).first().click();
      await waitForTutorialStep(page, 'build-tavern', 10_000);
    },
  },

  // ── Step 13: build-tavern ────────────────────────────────────────────────
  // Open Facilities (if not open) → empty slot → build tavern
  'build-tavern': {
    shots: ['build-picker-tavern'],
    advance: async (page) => {
      const facilBtn = page.locator('.panel-toggle-bar button').filter({ hasText: /^Facilities$/i });
      // Close and reopen to reset any open tray from the assign-kael step
      if (await page.locator('.fp-overlay').isVisible({ timeout: 1_000 }).catch(() => false)) {
        await facilBtn.click();
        await page.waitForTimeout(300);
      }
      await facilBtn.click();
      await page.waitForSelector('.fp-overlay', { timeout: 10_000 });

      await page.waitForSelector('.fp-slot-empty', { timeout: 10_000 });
      await page.locator('.fp-slot-empty').first().click();

      // Step 1: click the Tavern icon card to select it (no ^ $ anchors — card also has icon char)
      await page.waitForSelector('.fp-bp-card', { timeout: 10_000 });
      await page.locator('.fp-bp-card', { hasText: /Tavern/i }).first().click();
      await page.waitForTimeout(300);

      // Step 2: click build button (enabled after selection)
      await page.locator('.fp-bp-build-btn:not([disabled])').waitFor({ timeout: 5_000 });
      await page.locator('.fp-bp-build-btn').click();

      // Step 3: confirm dialog → click .fp-btn-confirm
      await page.waitForSelector('.fp-btn-confirm', { timeout: 5_000 });
      await page.locator('.fp-btn-confirm').click();

      await waitForTutorialStep(page, 'assign-keeper', 20_000);
    },
  },

  // ── Step 14: assign-keeper ───────────────────────────────────────────────
  // Facilities tray → click Tavern slot → use <select> dropdown to assign keeper
  'assign-keeper': {
    shots: ['tavern-panel', 'keeper-assignment'],
    advance: async (page) => {
      // After build-tavern, selectedSlot resets to null. Click Tavern slot to open tray.
      await page.waitForSelector('.fp-slot', { timeout: 10_000 });
      await page.locator('.fp-slot', { hasText: /Tavern/i }).first().click();

      // Facility detail tray opens — use the <select> inside .fp-assign-card
      await page.waitForSelector('.fp-assign-card select', { timeout: 10_000 });
      await page.locator('.fp-assign-card select').first().selectOption({ index: 1 });

      await waitForTutorialStep(page, 'recruit-first-member', 30_000);
    },
  },

  // ── Step 15: recruit-first-member ────────────────────────────────────────
  // Enter Room (sets camera near tavern) → open tavern function panel → Negotiate → hire
  'recruit-first-member': {
    shots: ['tavern-visitor', 'negotiate-modal'],
    advance: async (page) => {
      // Tavern tray should still be open from assign-keeper. If not, reopen it.
      if (!(await page.locator('.fp-btn-enter').isVisible({ timeout: 2_000 }).catch(() => false))) {
        if (!(await page.locator('.fp-overlay').isVisible({ timeout: 1_000 }).catch(() => false))) {
          await page.locator('.panel-toggle-bar button').filter({ hasText: /^Facilities$/i }).click();
          await page.waitForSelector('.fp-overlay', { timeout: 10_000 });
        }
        await page.locator('.fp-slot', { hasText: /Tavern/i }).first().click();
      }

      // Click "Enter Room" — moves camera to the tavern slot position (satisfies proximity check)
      await page.locator('.fp-btn-enter').first().click();
      await page.waitForTimeout(600);

      // Open tavern function panel using the camera position set by Enter Room
      await page.evaluate(() => {
        const store = (window as unknown as { useGameStore: { getState: () => { cameraTarget: number[]; requestFacilityPanel: (t: string, p: number[]) => void } } }).useGameStore;
        const pos = store.getState().cameraTarget;
        store.getState().requestFacilityPanel('tavern', pos);
      });

      // Wait for visitor card to appear, then click Negotiate
      await page.waitForSelector('.tv-visitor-card', { timeout: 15_000 });
      await page.locator('.tv-visitor-card .tv-btn.is-primary').first().click();

      // Negotiate modal: click the primary action (Roll / Accept)
      await page.waitForSelector('.tv-btn.is-primary', { timeout: 10_000 });
      await page.locator('.tv-btn.is-primary').last().click();

      // If a hire confirm modal appears, confirm it
      const hireBtn = page.locator('.tv-btn.is-primary', { hasText: /hire|confirm/i });
      if (await hireBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await hireBtn.click();
      }

      await waitForTutorialStep(page, 'complete', 30_000);
    },
  },

  // ── Step 16: complete ────────────────────────────────────────────────────
  'complete': {
    shots: ['graduation-toast', 'final-guild-hall'],
    advance: null,
  },
};
