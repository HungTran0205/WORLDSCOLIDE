/**
 * Phase 2 — Full tutorial playthrough, 16 steps.
 * Captures ≥ 25 screenshots into docs/reference/screenshots/01-tutorial/.
 *
 * Run: npx playwright test e2e/tutorial-playthrough-capture.spec.ts
 *
 * Prerequisites: npm run dev running (or reuseExistingServer: true in config).
 * Runtime target: < 10 min. Combat/travel steps are the longest.
 */
import { test } from '@playwright/test';
import {
  waitForTitleScreen,
  waitForGameScreen,
  waitForWorldReady,
  waitForTutorialStep,
  getTutorialStep,
  waitForCameraSettle,
  suppressWebGLErrors,
} from './helpers/game-helpers';
import { shot, resetCounters } from './helpers/screenshot-helpers';
import { TUTORIAL_STEP_ACTIONS } from './helpers/tutorial-step-actions';

const CAT = '01-tutorial';
const STEP_ORDER = [
  'char-creation',
  'arrival-alarm',
  'open-quest-board',
  'accept-bear-quest',
  'assign-and-dispatch',
  'quest-travel',
  'moonbear-combat',
  'kael-rescue',
  'reward-splash',
  'build-logging-site',
  'assign-kael',
  'first-haul-reward',
  'build-tavern',
  'assign-keeper',
  'recruit-first-member',
  'complete',
];

test.setTimeout(600_000); // 10 min cap for full run
test.beforeEach(() => resetCounters());

test('tutorial full playthrough', async ({ page }) => {
  await suppressWebGLErrors(page);
  // ── Navigate to app and wait for title ───────────────────────────────────
  await page.goto('/');
  await waitForTitleScreen(page);
  await shot(page, CAT, 'title-screen');

  // ── New Game → slot 1 ────────────────────────────────────────────────────
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.waitForSelector('.title-save-picker', { timeout: 10_000 });
  await shot(page, CAT, 'save-picker');

  await page.locator('.save-slot-card').first().click();
  const overwriteBtn = page.getByRole('button', { name: /yes.*overwrite/i });
  if (await overwriteBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await overwriteBtn.click();
  } else {
    await page.getByRole('button', { name: /start new game/i }).click();
  }

  // ── Char creation ─────────────────────────────────────────────────────────
  await page.waitForSelector('.char-creation-overlay', { timeout: 30_000 });
  await shot(page, CAT, 'char-creation-civ');

  // Step 1: pick civilization (only Linh Sơn available)
  await page.locator('.civ-card:not(.civ-card--locked)').first().click();
  await shot(page, CAT, 'char-creation-civ-selected');
  await page.locator('.panel-btn.char-create-nav-btn', { hasText: /continue/i }).click();

  // Step 2: pick archetype (first tile)
  await page.waitForSelector('.archetype-tile', { timeout: 10_000 });
  await shot(page, CAT, 'char-creation-class');
  await page.locator('.archetype-tile').first().click();
  await page.locator('.panel-btn.char-create-nav-btn', { hasText: /continue/i }).click();

  // Step 3: pick mask (first available)
  await page.waitForSelector('.mask-tile', { timeout: 10_000 });
  await shot(page, CAT, 'char-creation-mask');
  await page.locator('.mask-tile').first().click();
  await page.locator('.panel-btn.char-create-nav-btn', { hasText: /continue/i }).click();

  // Step 4: identity — fill name, guild name, allocate 50 stat points
  await page.waitForSelector('.char-create-fields', { timeout: 10_000 });
  await page.locator('input[placeholder*="name"], input[placeholder*="Name"]').first().fill('ScreenTour');
  await page.locator('input[placeholder*="guild"], input[placeholder*="Guild"]').first().fill('Tour Guild');

  // Allocate all 50 points using +5 buttons (10 × +5 on first stat)
  const addFiveBtn = page.locator('.stat-allocator button', { hasText: '+5' }).first();
  for (let i = 0; i < 10; i++) {
    await addFiveBtn.click();
  }
  await shot(page, CAT, 'char-creation-identity');

  // Begin game
  await page.locator('.panel-btn.char-create-nav-btn', { hasText: /begin/i }).click();

  // ── Game screen loads ─────────────────────────────────────────────────────
  await waitForGameScreen(page);
  await waitForWorldReady(page);
  await waitForCameraSettle(page);
  await shot(page, CAT, 'guild-hall-initial');

  // ── Tutorial driver loop ──────────────────────────────────────────────────
  for (const stepId of STEP_ORDER.slice(1)) {
    // Confirm we're on this step (may have already advanced)
    const current = await getTutorialStep(page);
    if (current !== stepId) {
      // Step already passed (auto-advanced); skip to next
      console.log(`[tutorial] skip ${stepId}: already at ${current}`);
      continue;
    }

    const config = TUTORIAL_STEP_ACTIONS[stepId];
    if (!config) {
      console.warn(`[tutorial] no config for step ${stepId}`);
      continue;
    }

    // Screenshot current state before advancing
    await shot(page, CAT, `step-${stepId}-before`);

    if (config.advance) {
      await config.advance(page);
    } else {
      // Auto-advance step: poll until step changes
      const nextIdx = STEP_ORDER.indexOf(stepId) + 1;
      const nextStep = STEP_ORDER[nextIdx];
      if (nextStep) {
        await waitForTutorialStep(page, nextStep, config.timeout ?? 180_000);
      }
    }

    // Screenshot after advancing
    await waitForCameraSettle(page);
    await shot(page, CAT, `step-${stepId}-after`);
    console.log(`[tutorial] ✓ step ${stepId}`);
  }

  // ── Final state screenshot ────────────────────────────────────────────────
  await waitForCameraSettle(page);
  await shot(page, CAT, 'tutorial-complete-final');
  console.log('[tutorial] ✓ complete');
});
