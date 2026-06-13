import type { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_ROOT = path.resolve(__dirname, '../../docs/reference/screenshots');

/** Per-category auto-incrementing counters (reset between test runs via resetCounters()) */
const counters: Record<string, number> = {};

/**
 * Take a screenshot into docs/reference/screenshots/{category}/{NN}-{name}.png
 * Returns the absolute path written.
 */
export async function shot(page: Page, category: string, name: string): Promise<string> {
  const dir = path.join(SCREENSHOTS_ROOT, category);
  fs.mkdirSync(dir, { recursive: true });

  counters[category] = (counters[category] ?? 0) + 1;
  const seq = String(counters[category]).padStart(2, '0');
  const slug = name.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const filename = `${seq}-${slug}.png`;
  const filePath = path.join(dir, filename);

  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`[shot] ${category}/${filename}`);
  return filePath;
}

/** Reset all sequence counters — call in test.beforeEach */
export function resetCounters(): void {
  for (const key of Object.keys(counters)) {
    delete counters[key];
  }
}

/** List all PNGs under a category dir (used by doc generator) */
export function listShots(category: string): string[] {
  const dir = path.join(SCREENSHOTS_ROOT, category);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.png'))
    .sort()
    .map((f) => path.join(dir, f));
}

/** List all PNG files under screenshots root, relative to docs/reference/ */
export function listAllShots(): string[] {
  if (!fs.existsSync(SCREENSHOTS_ROOT)) return [];
  const results: string[] = [];
  for (const cat of fs.readdirSync(SCREENSHOTS_ROOT)) {
    const catDir = path.join(SCREENSHOTS_ROOT, cat);
    if (!fs.statSync(catDir).isDirectory()) continue;
    for (const file of fs.readdirSync(catDir).filter((f) => f.endsWith('.png')).sort()) {
      results.push(path.join('screenshots', cat, file));
    }
  }
  return results;
}
