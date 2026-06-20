import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readdirSync, rmSync, rmdirSync } from 'fs';

// Files copied verbatim from public/ that should NOT ship in the build
// (e.g. AI agent docs scattered across asset folders, source art, dir markers).
// Vite has no native exclude filter for publicDir, so we strip them after the
// bundle is written. Stripping + empty-dir pruning also keeps the dist entry
// count (files AND dirs) under itch.io's 1000-entry HTML5 zip limit.
const EXCLUDED_FILENAMES = new Set(['CLAUDE.md', '.gitkeep']);
const EXCLUDED_EXTENSIONS = new Set(['.aseprite']);

function stripUnwantedFiles(): Plugin {
  return {
    name: 'strip-unwanted-files',
    apply: 'build',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist');
      let removedFiles = 0;
      let removedDirs = 0;
      // Post-order walk: strip excluded files first, then remove any directory
      // left empty (itch.io counts directory entries toward the 1000-entry cap).
      const walk = (dir: string): number => {
        let kept = 0;
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (walk(full) === 0) {
              rmdirSync(full);
              removedDirs++;
            } else {
              kept++;
            }
          } else if (
            EXCLUDED_FILENAMES.has(entry.name) ||
            EXCLUDED_EXTENSIONS.has(path.extname(entry.name))
          ) {
            rmSync(full);
            removedFiles++;
          } else {
            kept++;
          }
        }
        return kept;
      };
      walk(outDir);
      if (removedFiles || removedDirs) {
        this.info?.(`stripped ${removedFiles} file(s) + ${removedDirs} empty dir(s) from dist`);
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), stripUnwantedFiles()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
