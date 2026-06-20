import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 300_000,
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    video: 'off',
    screenshot: 'off',
    headless: false,
    launchOptions: {
      // Use system GPU for hardware-accelerated WebGL/WebGPU so the 3D scene renders.
      // SwiftShader (software renderer) can't compile the game's GLSL shaders.
      args: ['--no-sandbox', '--disable-gpu-sandbox', '--start-maximized', '--window-size=1920,1080'],
    },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
