# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full-feature-screenshot-capture.spec.ts >> facilities: all 7 types scene + panel
- Location: e2e\full-feature-screenshot-capture.spec.ts:122:1

# Error details

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for locator('.panel-toggle-bar button').filter({ hasText: /^Settings$/i })
    - locator resolved to <button class="">Settings</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div>…</div> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div>…</div> intercepts pointer events
    - retrying click action
      - waiting 100ms
    33 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div>…</div> intercepts pointer events
     - retrying click action
       - waiting 500ms

```

# Test source

```ts
  1  | import type { Page } from '@playwright/test';
  2  | import * as path from 'path';
  3  | import { fileURLToPath } from 'url';
  4  | 
  5  | const __dirname = path.dirname(fileURLToPath(import.meta.url));
  6  | const DEFAULT_FIXTURE = path.resolve(__dirname, '../fixtures/full-progress-save.json');
  7  | 
  8  | /**
  9  |  * Import a save fixture via Settings panel → Import Save button.
  10 |  * Leaves the settings panel closed on exit.
  11 |  */
  12 | export async function importSave(page: Page, fixturePath = DEFAULT_FIXTURE): Promise<void> {
  13 |   // Open settings panel via panel-toggle-bar
  14 |   const settingsBtn = page
  15 |     .locator('.panel-toggle-bar button')
  16 |     .filter({ hasText: /^Settings$/i });
> 17 |   await settingsBtn.click();
     |                     ^ Error: locator.click: Target page, context or browser has been closed
  18 |   await page.waitForSelector('.panel-overlay', { timeout: 10_000 });
  19 | 
  20 |   // Intercept the dynamically-created <input type="file"> from handleImport
  21 |   const [fileChooser] = await Promise.all([
  22 |     page.waitForEvent('filechooser', { timeout: 10_000 }),
  23 |     page.getByRole('button', { name: 'Import Save' }).click(),
  24 |   ]);
  25 |   await fileChooser.setFiles(fixturePath);
  26 | 
  27 |   // Wait for success message rendered by settings-panel.tsx
  28 |   await page.waitForSelector('text=Import successful', { timeout: 15_000 });
  29 | 
  30 |   // Close settings panel
  31 |   const closeBtn = page.locator('.panel-close-btn').first();
  32 |   if (await closeBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
  33 |     await closeBtn.click();
  34 |   }
  35 | }
  36 | 
```