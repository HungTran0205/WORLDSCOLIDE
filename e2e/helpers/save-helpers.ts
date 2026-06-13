import type { Page } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_FIXTURE = path.resolve(__dirname, '../fixtures/full-progress-save.json');

/**
 * Import a save fixture via Settings panel → Import Save button.
 * Leaves the settings panel closed on exit.
 */
export async function importSave(page: Page, fixturePath = DEFAULT_FIXTURE): Promise<void> {
  // Open settings panel via panel-toggle-bar
  const settingsBtn = page
    .locator('.panel-toggle-bar button')
    .filter({ hasText: /^Settings$/i });
  await settingsBtn.click();
  await page.waitForSelector('.panel-overlay', { timeout: 10_000 });

  // Intercept the dynamically-created <input type="file"> from handleImport
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 10_000 }),
    page.getByRole('button', { name: 'Import Save' }).click(),
  ]);
  await fileChooser.setFiles(fixturePath);

  // Wait for success message rendered by settings-panel.tsx
  await page.waitForSelector('text=Import successful', { timeout: 15_000 });

  // Close settings panel
  const closeBtn = page.locator('.panel-close-btn').first();
  if (await closeBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await closeBtn.click();
  }
}
