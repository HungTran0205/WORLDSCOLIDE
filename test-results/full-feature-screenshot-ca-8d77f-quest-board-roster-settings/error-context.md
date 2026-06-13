# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full-feature-screenshot-capture.spec.ts >> panels: quest board, roster, settings
- Location: e2e\full-feature-screenshot-capture.spec.ts:196:1

# Error details

```
Error: page.waitForSelector: Target page, context or browser has been closed
Call log:
  - waiting for locator('.title-menu') to be visible

```

# Test source

```ts
  1   | import type { Page } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * Suppress Three.js WebGL errors that flood the console under SwiftShader.
  5   |  * Swallows all uncaught errors and unhandled rejections from Three.js / WebGL
  6   |  * so the browser stays alive during long test runs.
  7   |  */
  8   | export async function suppressWebGLErrors(page: Page): Promise<void> {
  9   |   await page.addInitScript(() => {
  10  |     // Suppress ALL uncaught errors from three.js bundle and WebGL-related messages.
  11  |     window.addEventListener('error', (e) => {
  12  |       const src = e.filename ?? '';
  13  |       const msg = e.message ?? '';
  14  |       if (src.includes('three') || msg.includes('WebGL') || msg.includes('resolveIncludes')
  15  |           || msg.includes('Illegal invocation')) {
  16  |         e.preventDefault();
  17  |         e.stopImmediatePropagation();
  18  |       }
  19  |     }, true);
  20  |     window.addEventListener('unhandledrejection', (e) => {
  21  |       const msg = String((e.reason as Error)?.message ?? e.reason ?? '');
  22  |       if (msg.includes('WebGL') || msg.includes('resolveIncludes') || msg.includes('Illegal invocation')
  23  |           || msg.includes('adapter')) {
  24  |         e.preventDefault();
  25  |       }
  26  |     }, true);
  27  |     // Suppress console.error noise from Three.js (keeps devtools clean, reduces memory)
  28  |     const origErr = console.error.bind(console);
  29  |     console.error = (...args: unknown[]) => {
  30  |       const msg = String(args[0] ?? '');
  31  |       if (msg.includes('THREE') || msg.includes('WebGL') || msg.includes('WebGPU')) return;
  32  |       origErr(...args);
  33  |     };
  34  |     const origWarn = console.warn.bind(console);
  35  |     console.warn = (...args: unknown[]) => {
  36  |       const msg = String(args[0] ?? '');
  37  |       if (msg.includes('THREE') || msg.includes('WebGL') || msg.includes('[Renderer]')) return;
  38  |       origWarn(...args);
  39  |     };
  40  |   });
  41  | }
  42  | 
  43  | /** Wait for the splash screen to finish and title menu to appear */
  44  | export async function waitForTitleScreen(page: Page): Promise<void> {
> 45  |   await page.waitForSelector('.title-menu', { timeout: 30_000 });
      |              ^ Error: page.waitForSelector: Target page, context or browser has been closed
  46  | }
  47  | 
  48  | /** Wait for the game screen HUD to be present (panel-toggle-bar) */
  49  | export async function waitForGameScreen(page: Page): Promise<void> {
  50  |   await page.waitForSelector('.panel-toggle-bar', { timeout: 60_000 });
  51  | }
  52  | 
  53  | /**
  54  |  * Wait for the 3D world to finish WebGPU init + asset load.
  55  |  * Polls window.useUiStore.getState().worldReady (exposed in dev mode via ui-store.ts).
  56  |  * If the 3D renderer crashes (SwiftShader/WebGPU unavailable), forcibly sets worldReady
  57  |  * via the store so tutorial modals aren't permanently blocked.
  58  |  */
  59  | export async function waitForWorldReady(page: Page, timeout = 60_000): Promise<void> {
  60  |   await page.waitForFunction(
  61  |     () => {
  62  |       const store = (window as unknown as Record<string, unknown>).useUiStore as
  63  |         | { getState: () => { worldReady: boolean } }
  64  |         | undefined;
  65  |       return store?.getState().worldReady === true;
  66  |     },
  67  |     undefined,
  68  |     { timeout },
  69  |   );
  70  | }
  71  | 
  72  | /** Read the current tutorial step from the game store */
  73  | export async function getTutorialStep(page: Page): Promise<string> {
  74  |   return page.evaluate(() => {
  75  |     const store = (window as unknown as Record<string, unknown>).useGameStore as
  76  |       | { getState: () => { tutorialStep: string } }
  77  |       | undefined;
  78  |     return store?.getState().tutorialStep ?? 'unknown';
  79  |   });
  80  | }
  81  | 
  82  | /**
  83  |  * Poll until tutorialStep equals the expected value.
  84  |  * Used after firing a tutorial-advancing action.
  85  |  */
  86  | export async function waitForTutorialStep(
  87  |   page: Page,
  88  |   step: string,
  89  |   timeout = 120_000,
  90  | ): Promise<void> {
  91  |   await page.waitForFunction(
  92  |     (expected) => {
  93  |       const store = (window as unknown as Record<string, unknown>).useGameStore as
  94  |         | { getState: () => { tutorialStep: string } }
  95  |         | undefined;
  96  |       return store?.getState().tutorialStep === expected;
  97  |     },
  98  |     step,
  99  |     { timeout },
  100 |   );
  101 | }
  102 | 
  103 | /**
  104 |  * Click a panel-toggle-bar button by its visible label.
  105 |  * Labels: "Quests" | "Roster" | "Facilities" | "Settings"
  106 |  */
  107 | export async function openHudPanel(page: Page, label: string): Promise<void> {
  108 |   await page
  109 |     .locator('.panel-toggle-bar button', { hasText: new RegExp(`^${label}$`, 'i') })
  110 |     .click();
  111 |   // Facilities uses .fp-overlay; all other panels use .panel-overlay
  112 |   const overlaySelector = /facilities/i.test(label) ? '.fp-overlay' : '.panel-overlay';
  113 |   await page.waitForSelector(overlaySelector, { timeout: 10_000 });
  114 | }
  115 | 
  116 | /** Close any open panel overlay */
  117 | export async function closePanel(page: Page): Promise<void> {
  118 |   const btn = page.locator('.panel-close-btn').first();
  119 |   if (await btn.isVisible({ timeout: 2_000 }).catch(() => false)) {
  120 |     await btn.click();
  121 |     await page.waitForSelector('.panel-overlay', { state: 'hidden', timeout: 5_000 }).catch(() => {});
  122 |     return;
  123 |   }
  124 |   // Facilities panel: no close btn — toggle off via the Facilities button
  125 |   if (await page.locator('.fp-overlay').isVisible({ timeout: 1_000 }).catch(() => false)) {
  126 |     await page.locator('.panel-toggle-bar button').filter({ hasText: /^Facilities$/i }).click();
  127 |     await page.waitForSelector('.fp-overlay', { state: 'hidden', timeout: 5_000 }).catch(() => {});
  128 |   }
  129 | }
  130 | 
  131 | /** Read camera focus from game store */
  132 | export async function getCameraFocus(page: Page): Promise<string> {
  133 |   return page.evaluate(() => {
  134 |     const store = (window as unknown as Record<string, unknown>).useGameStore as
  135 |       | { getState: () => { cameraFocus: string } }
  136 |       | undefined;
  137 |     return store?.getState().cameraFocus ?? 'unknown';
  138 |   });
  139 | }
  140 | 
  141 | /** Wait until cameraFocus equals a specific value */
  142 | export async function waitForCameraFocus(
  143 |   page: Page,
  144 |   focus: string,
  145 |   timeout = 15_000,
```