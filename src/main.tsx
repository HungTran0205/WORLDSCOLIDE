import '@/i18n';
import '@/ui/styles/game-ui-tokens.css';
import '@/ui/styles/typography.css';
import '@/ui/styles/parchment.css';
import '@/ui/styles/ui-tokens-v2.css';
import '@/ui/styles/bp-content-theme.css';
import * as THREE from 'three';
import { assetUrl } from '@/lib/asset-url';
import { createRoot } from 'react-dom/client';
import { App } from '@/ui/app';

// Rewrite all absolute asset paths for Three.js loaders (useGLTF, useTexture,
// TextureLoader, etc.) so they resolve correctly when the app is served from a
// subpath (itch.io, GitHub Pages). setURLModifier fires for every load call so
// the ~20 scene files that use inline absolute paths need no individual changes.
THREE.DefaultLoadingManager.setURLModifier((url) => assetUrl(url));

// NOTE: StrictMode disabled because r3f-vfx's GPU buffer lifecycle crashes
// under React 18/19 double-invoke ("Buffer used in submit while destroyed").
// StrictMode is a dev-only check; production builds are unaffected.
// Re-enable if/when r3f-vfx fixes its dispose-then-submit race.
createRoot(document.getElementById('root')!).render(<App />);
