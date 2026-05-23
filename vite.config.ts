import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readdirSync, rmSync } from 'fs';

// Files copied verbatim from public/ that should NOT ship in the build
// (e.g. AI agent docs scattered across asset folders). Vite has no native
// exclude filter for publicDir, so we strip them after the bundle is written.
const EXCLUDED_FILENAMES = new Set(['CLAUDE.md']);

function stripUnwantedFiles(): Plugin {
  return {
    name: 'strip-unwanted-files',
    apply: 'build',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist');
      let removed = 0;
      const walk = (dir: string) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else if (EXCLUDED_FILENAMES.has(entry.name)) {
            rmSync(full);
            removed++;
          }
        }
      };
      walk(outDir);
      if (removed) this.info?.(`stripped ${removed} excluded file(s) from dist`);
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
