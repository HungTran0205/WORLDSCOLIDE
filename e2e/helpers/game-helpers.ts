import type { Page } from '@playwright/test';

/**
 * Suppress Three.js WebGL errors that flood the console under SwiftShader.
 * Swallows all uncaught errors and unhandled rejections from Three.js / WebGL
 * so the browser stays alive during long test runs.
 */
export async function suppressWebGLErrors(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Suppress ALL uncaught errors from three.js bundle and WebGL-related messages.
    window.addEventListener('error', (e) => {
      const src = e.filename ?? '';
      const msg = e.message ?? '';
      if (src.includes('three') || msg.includes('WebGL') || msg.includes('resolveIncludes')
          || msg.includes('Illegal invocation')) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }, true);
    window.addEventListener('unhandledrejection', (e) => {
      const msg = String((e.reason as Error)?.message ?? e.reason ?? '');
      if (msg.includes('WebGL') || msg.includes('resolveIncludes') || msg.includes('Illegal invocation')
          || msg.includes('adapter')) {
        e.preventDefault();
      }
    }, true);
    // Suppress console.error noise from Three.js (keeps devtools clean, reduces memory)
    const origErr = console.error.bind(console);
    console.error = (...args: unknown[]) => {
      const msg = String(args[0] ?? '');
      if (msg.includes('THREE') || msg.includes('WebGL') || msg.includes('WebGPU')) return;
      origErr(...args);
    };
    const origWarn = console.warn.bind(console);
    console.warn = (...args: unknown[]) => {
      const msg = String(args[0] ?? '');
      if (msg.includes('THREE') || msg.includes('WebGL') || msg.includes('[Renderer]')) return;
      origWarn(...args);
    };
  });
}

/** Wait for the splash screen to finish and title menu to appear */
export async function waitForTitleScreen(page: Page): Promise<void> {
  await page.waitForSelector('.title-menu', { timeout: 30_000 });
}

/** Wait for the game screen HUD to be present (panel-toggle-bar) */
export async function waitForGameScreen(page: Page): Promise<void> {
  await page.waitForSelector('.panel-toggle-bar', { timeout: 60_000 });
}

/**
 * Wait for the 3D world to finish WebGPU init + asset load.
 * Polls window.useUiStore.getState().worldReady (exposed in dev mode via ui-store.ts).
 * If the 3D renderer crashes (SwiftShader/WebGPU unavailable), forcibly sets worldReady
 * via the store so tutorial modals aren't permanently blocked.
 */
export async function waitForWorldReady(page: Page, timeout = 60_000): Promise<void> {
  await page.waitForFunction(
    () => {
      const store = (window as unknown as Record<string, unknown>).useUiStore as
        | { getState: () => { worldReady: boolean } }
        | undefined;
      return store?.getState().worldReady === true;
    },
    undefined,
    { timeout },
  );
}

/** Read the current tutorial step from the game store */
export async function getTutorialStep(page: Page): Promise<string> {
  return page.evaluate(() => {
    const store = (window as unknown as Record<string, unknown>).useGameStore as
      | { getState: () => { tutorialStep: string } }
      | undefined;
    return store?.getState().tutorialStep ?? 'unknown';
  });
}

/**
 * Poll until tutorialStep equals the expected value.
 * Used after firing a tutorial-advancing action.
 */
export async function waitForTutorialStep(
  page: Page,
  step: string,
  timeout = 120_000,
): Promise<void> {
  await page.waitForFunction(
    (expected) => {
      const store = (window as unknown as Record<string, unknown>).useGameStore as
        | { getState: () => { tutorialStep: string } }
        | undefined;
      return store?.getState().tutorialStep === expected;
    },
    step,
    { timeout },
  );
}

/**
 * Click a panel-toggle-bar button by its visible label.
 * Labels: "Quests" | "Roster" | "Facilities" | "Settings"
 */
export async function openHudPanel(page: Page, label: string): Promise<void> {
  await page
    .locator('.panel-toggle-bar button', { hasText: new RegExp(`^${label}$`, 'i') })
    .click();
  // Facilities uses .fp-overlay; all other panels use .panel-overlay
  const overlaySelector = /facilities/i.test(label) ? '.fp-overlay' : '.panel-overlay';
  await page.waitForSelector(overlaySelector, { timeout: 10_000 });
}

/** Close any open panel overlay */
export async function closePanel(page: Page): Promise<void> {
  const btn = page.locator('.panel-close-btn').first();
  if (await btn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await btn.click();
    await page.waitForSelector('.panel-overlay', { state: 'hidden', timeout: 5_000 }).catch(() => {});
    return;
  }
  // Facilities panel: no close btn — toggle off via the Facilities button
  if (await page.locator('.fp-overlay').isVisible({ timeout: 1_000 }).catch(() => false)) {
    await page.locator('.panel-toggle-bar button').filter({ hasText: /^Facilities$/i }).click();
    await page.waitForSelector('.fp-overlay', { state: 'hidden', timeout: 5_000 }).catch(() => {});
  }
}

/** Read camera focus from game store */
export async function getCameraFocus(page: Page): Promise<string> {
  return page.evaluate(() => {
    const store = (window as unknown as Record<string, unknown>).useGameStore as
      | { getState: () => { cameraFocus: string } }
      | undefined;
    return store?.getState().cameraFocus ?? 'unknown';
  });
}

/** Wait until cameraFocus equals a specific value */
export async function waitForCameraFocus(
  page: Page,
  focus: string,
  timeout = 15_000,
): Promise<void> {
  await page.waitForFunction(
    (expected) => {
      const store = (window as unknown as Record<string, unknown>).useGameStore as
        | { getState: () => { cameraFocus: string } }
        | undefined;
      return store?.getState().cameraFocus === expected;
    },
    focus,
    { timeout },
  );
}

/** Read gameScene from store (guild-hall | combat | etc.) */
export async function getGameScene(page: Page): Promise<string> {
  return page.evaluate(() => {
    const store = (window as unknown as Record<string, unknown>).useGameStore as
      | { getState: () => { gameScene: string } }
      | undefined;
    return store?.getState().gameScene ?? 'unknown';
  });
}

/** Small settle wait — use sparingly only after camera/animation transitions */
export async function waitForCameraSettle(page: Page): Promise<void> {
  await page.waitForTimeout(1_500);
}
