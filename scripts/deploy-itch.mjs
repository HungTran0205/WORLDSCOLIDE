// Deploy the production build to itch.io via butler.
//
// Why butler instead of the web uploader: the dist bundle is ~870 files, and
// itch.io's browser uploader rejects/zips that warn at >1000 files. butler
// pushes directly (with delta patching) and has no file-count limit.
//
// Usage:
//   npm run deploy                 # build + push to <DEFAULT_TARGET>:html5
//   npm run deploy -- --no-build   # skip the build, push the existing dist/
//   npm run deploy -- --status     # just print the channel status
//
// Config via env (all optional):
//   ITCH_TARGET   itch user/game     (default: hungtran0205/2000sac)
//   ITCH_CHANNEL  butler channel      (default: html5 -> flagged playable in browser)
//   BUTLER_PATH   path to butler.exe  (default: PATH, then known install dirs)

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(repoRoot, 'dist');

const TARGET = process.env.ITCH_TARGET || 'hungtran0205/2000sac';
const CHANNEL = process.env.ITCH_CHANNEL || 'html5';
const channelSpec = `${TARGET}:${CHANNEL}`;

const args = process.argv.slice(2);
const skipBuild = args.includes('--no-build');
const statusOnly = args.includes('--status');

// Resolve butler: explicit env wins, otherwise rely on PATH, otherwise probe
// the default itch app / standalone install locations.
function resolveButler() {
  if (process.env.BUTLER_PATH) return process.env.BUTLER_PATH;
  const candidates = [
    'butler', // on PATH
    path.join(os.homedir(), 'Documents', 'itchio', 'butler.exe'),
    path.join(os.homedir(), '.config', 'itch', 'butler'),
    'C:/Program Files/itch/butler.exe',
  ];
  for (const c of candidates) {
    if (c === 'butler') continue; // tried last via fall-through to PATH
    if (existsSync(c)) return c;
  }
  return 'butler';
}

const butler = resolveButler();

function run(cmd, cmdArgs, opts = {}) {
  console.log(`\n> ${cmd} ${cmdArgs.join(' ')}`);
  execFileSync(cmd, cmdArgs, { stdio: 'inherit', cwd: repoRoot, ...opts });
}

// butler isn't always on PATH, so invoke via cmd /c on Windows when using a bare name.
function runButler(butlerArgs) {
  run(butler, butlerArgs, { shell: process.platform === 'win32' && butler === 'butler' });
}

if (statusOnly) {
  runButler(['status', channelSpec]);
  process.exit(0);
}

const pkg = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
const version = pkg.version || '0.0.0';

if (!skipBuild) {
  run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build']);
}

if (!existsSync(distDir)) {
  console.error(`\n✗ dist/ not found at ${distDir} — run a build first (drop --no-build).`);
  process.exit(1);
}

console.log(`\nPushing ${distDir}\n  -> ${channelSpec}  (version ${version})`);
runButler(['push', distDir, channelSpec, '--userversion', version]);

console.log('\n✓ Pushed. Check processing with:  npm run deploy -- --status');
console.log(`  Live page: https://${TARGET.split('/')[0]}.itch.io/${TARGET.split('/')[1]}`);
