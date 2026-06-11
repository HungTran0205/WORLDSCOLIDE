/**
 * Generates docs/reference/game-feature-screenshot-tour.md from captured screenshots.
 * Re-runnable after any re-capture — idempotent.
 *
 * Usage: npx tsx e2e/helpers/generate-screenshot-tour-doc.ts
 *   (or via npm script: npm run docs:screenshot-tour)
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { FEATURE_TOUR_MANIFEST } from './feature-tour-manifest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_REF = path.resolve(__dirname, '../../docs/reference');
const SCREENSHOTS_ROOT = path.join(DOCS_REF, 'screenshots');
const OUTPUT_DOC = path.join(DOCS_REF, 'game-feature-screenshot-tour.md');

// ── Utilities ────────────────────────────────────────────────────────────────

function relToDoc(absPath: string): string {
  // relative to docs/reference/ (where the markdown lives)
  return path.relative(DOCS_REF, absPath).replace(/\\/g, '/');
}

function listPngs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.png'))
    .sort();
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    '00-smoke': 'Smoke / Setup',
    '01-tutorial': 'Tutorial Walkthrough',
    '02-facilities': 'Facilities',
    '03-panels': 'Panels & Screens',
  };
  return map[cat] ?? cat;
}

// ── Build caption lookup from manifest ───────────────────────────────────────

const captionMap = new Map<string, string>();
for (const entry of FEATURE_TOUR_MANIFEST) {
  for (const s of entry.shots) {
    captionMap.set(s.name, s.description);
  }
}

function captionFor(filename: string): string {
  // filename is like "01-guild-hall-wide.png"
  const slug = filename.replace(/^\d+-/, '').replace(/\.png$/, '');
  return captionMap.get(slug) ?? slug.replace(/-/g, ' ');
}

// ── Collect all screenshots ───────────────────────────────────────────────────

interface CapturedShot {
  category: string;
  filename: string;
  absPath: string;
  relPath: string;
}

const allShots: CapturedShot[] = [];
const referencedSlugs = new Set<string>();

if (fs.existsSync(SCREENSHOTS_ROOT)) {
  for (const cat of fs.readdirSync(SCREENSHOTS_ROOT).sort()) {
    const catDir = path.join(SCREENSHOTS_ROOT, cat);
    if (!fs.statSync(catDir).isDirectory()) continue;
    for (const file of listPngs(catDir)) {
      const absPath = path.join(catDir, file);
      allShots.push({ category: cat, filename: file, absPath, relPath: relToDoc(absPath) });
    }
  }
}

// ── Generate markdown ─────────────────────────────────────────────────────────

const lines: string[] = [];
const today = new Date().toISOString().slice(0, 10);

lines.push('# Game Feature Screenshot Tour');
lines.push('');
lines.push(`> Generated ${today} from automated Playwright run.`);
lines.push('> Regenerate: `npx playwright test && npm run docs:screenshot-tour`');
lines.push('');
lines.push('## Contents');
lines.push('');
lines.push('1. [Title Screen & New Game](#1-title-screen--new-game)');
lines.push('2. [Tutorial Walkthrough](#2-tutorial-walkthrough)');
lines.push('3. [Facilities Tour](#3-facilities-tour)');
lines.push('4. [Panels & Screens](#4-panels--screens)');
lines.push('5. [Coverage Appendix](#5-coverage-appendix)');
lines.push('');

// ── Section 1: Title Screen & New Game ───────────────────────────────────────
lines.push('## 1. Title Screen & New Game');
lines.push('');
lines.push('The game opens with a splash screen, then the title menu with Continue, New Game, and Load Game options.');
lines.push('');

const smokeShots = allShots.filter((s) => s.category === '00-smoke');
const tutorialShots = allShots.filter((s) => s.category === '01-tutorial');

// Title + save-picker from smoke or tutorial
const titleAndNewGame = [
  ...smokeShots.filter((s) => /title-screen|save-picker/.test(s.filename)),
  ...tutorialShots.filter((s) => /title-screen|save-picker/.test(s.filename)),
];

for (const s of titleAndNewGame) {
  referencedSlugs.add(s.absPath);
  lines.push(`### ${captionFor(s.filename)}`);
  lines.push('');
  lines.push(`![${s.filename}](${s.relPath})`);
  lines.push('');
}

// ── Section 2: Tutorial Walkthrough ──────────────────────────────────────────
lines.push('## 2. Tutorial Walkthrough');
lines.push('');
lines.push('New players are guided through 16 tutorial beats from character creation to recruiting their first mercenary.');
lines.push('');

const TUTORIAL_SECTIONS = [
  { heading: 'Character Creation', pattern: /char-creation/ },
  { heading: 'Arrival & World Board', pattern: /arrival-alarm|world-board|npc-alarm/ },
  { heading: 'Quest Board & Dispatch', pattern: /quest-board|quest-detail|party|dispatch/ },
  { heading: 'Combat', pattern: /combat|moonbear/ },
  { heading: 'Kael Rescue & Rewards', pattern: /kael|reward-splash|first-haul/ },
  { heading: 'Building Facilities', pattern: /build|logging-site|tavern-built|facility/ },
  { heading: 'Recruitment & Completion', pattern: /recruit|keeper|tutorial-complete|final/ },
];

for (const section of TUTORIAL_SECTIONS) {
  const shots = tutorialShots.filter((s) => section.pattern.test(s.filename));
  if (shots.length === 0) continue;

  lines.push(`### ${section.heading}`);
  lines.push('');
  for (const s of shots) {
    referencedSlugs.add(s.absPath);
    lines.push(`![${s.filename}](${s.relPath})`);
    lines.push(`*${captionFor(s.filename)}*`);
    lines.push('');
  }
}

// Remaining tutorial shots not grouped above
const ungroupedTutorial = tutorialShots.filter((s) => !referencedSlugs.has(s.absPath));
if (ungroupedTutorial.length > 0) {
  lines.push('### Other Tutorial Screens');
  lines.push('');
  for (const s of ungroupedTutorial) {
    referencedSlugs.add(s.absPath);
    lines.push(`![${s.filename}](${s.relPath})`);
    lines.push(`*${captionFor(s.filename)}*`);
    lines.push('');
  }
}

// ── Section 3: Facilities ─────────────────────────────────────────────────────
lines.push('## 3. Facilities Tour');
lines.push('');
lines.push('The guild can build 7 facility types, each with a dedicated 3D room and management panel.');
lines.push('');

const facilityShots = allShots.filter((s) => s.category === '02-facilities');

const FACILITY_NAMES = [
  { slug: 'guild-hall',    title: 'Guild Hall' },
  { slug: 'logging-site',  title: 'Logging Site' },
  { slug: 'tavern',        title: 'Tavern' },
  { slug: 'training-yard', title: 'Training Yard' },
  { slug: 'infirmary',     title: 'Infirmary' },
  { slug: 'workshop',      title: 'Workshop' },
  { slug: 'stone-quarry',  title: 'Stone Quarry' },
  { slug: 'alchemy-lab',   title: 'Alchemy Lab' },
];

for (const { slug, title } of FACILITY_NAMES) {
  const shots = facilityShots.filter((s) => s.filename.includes(slug));
  if (shots.length === 0) continue;

  const manifestEntry = FEATURE_TOUR_MANIFEST.find((e) => e.id === slug);
  lines.push(`### ${title}`);
  lines.push('');
  if (manifestEntry) lines.push(manifestEntry.description);
  lines.push('');
  for (const s of shots) {
    referencedSlugs.add(s.absPath);
    lines.push(`![${s.filename}](${s.relPath})`);
    lines.push(`*${captionFor(s.filename)}*`);
    lines.push('');
  }
}

// Ungrouped facility shots
const ungroupedFacility = facilityShots.filter((s) => !referencedSlugs.has(s.absPath));
if (ungroupedFacility.length > 0) {
  lines.push('### Other Facility Screens');
  lines.push('');
  for (const s of ungroupedFacility) {
    referencedSlugs.add(s.absPath);
    lines.push(`![${s.filename}](${s.relPath})`);
    lines.push(`*${captionFor(s.filename)}*`);
    lines.push('');
  }
}

// ── Section 4: Panels & Screens ───────────────────────────────────────────────
lines.push('## 4. Panels & Screens');
lines.push('');
lines.push('HUD panels accessible from the panel-toggle bar, plus combat and modal screens.');
lines.push('');

const panelShots = allShots.filter((s) => s.category === '03-panels');

const PANEL_GROUPS = [
  { heading: 'Quest Board',    pattern: /quest/ },
  { heading: 'Guild Roster',   pattern: /roster/ },
  { heading: 'Settings',       pattern: /settings/ },
  { heading: 'Combat',         pattern: /combat/ },
  { heading: 'Tavern Modals',  pattern: /tavern|negotiate/ },
];

for (const group of PANEL_GROUPS) {
  const shots = panelShots.filter((s) => group.pattern.test(s.filename));
  if (shots.length === 0) continue;

  lines.push(`### ${group.heading}`);
  lines.push('');
  for (const s of shots) {
    referencedSlugs.add(s.absPath);
    lines.push(`![${s.filename}](${s.relPath})`);
    lines.push(`*${captionFor(s.filename)}*`);
    lines.push('');
  }
}

const ungroupedPanels = panelShots.filter((s) => !referencedSlugs.has(s.absPath));
if (ungroupedPanels.length > 0) {
  lines.push('### Other Screens');
  lines.push('');
  for (const s of ungroupedPanels) {
    referencedSlugs.add(s.absPath);
    lines.push(`![${s.filename}](${s.relPath})`);
    lines.push(`*${captionFor(s.filename)}*`);
    lines.push('');
  }
}

// ── Section 5: Coverage Appendix ─────────────────────────────────────────────
lines.push('## 5. Coverage Appendix');
lines.push('');
lines.push('| Category | File | Referenced |');
lines.push('|----------|------|-----------|');

for (const s of allShots) {
  const ref = referencedSlugs.has(s.absPath) ? '✅' : '⚠️ uncaptioned';
  lines.push(`| ${categoryLabel(s.category)} | \`${s.filename}\` | ${ref} |`);
}

const totalShots = allShots.length;
const referencedCount = [...allShots].filter((s) => referencedSlugs.has(s.absPath)).length;
lines.push('');
lines.push(`**Total:** ${totalShots} screenshots — ${referencedCount} captioned, ${totalShots - referencedCount} uncaptioned.`);
lines.push('');

if (totalShots === 0) {
  lines.push('> No screenshots found. Run `npx playwright test` first to capture screenshots.');
}

// ── Write output ──────────────────────────────────────────────────────────────
fs.mkdirSync(DOCS_REF, { recursive: true });
fs.writeFileSync(OUTPUT_DOC, lines.join('\n'), 'utf-8');
console.log(`✓ Written ${lines.length} lines to ${OUTPUT_DOC}`);
console.log(`  ${totalShots} screenshots, ${referencedCount} captioned`);
