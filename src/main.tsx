import '@/i18n';
import { createRoot } from 'react-dom/client';
import { App } from '@/ui/app';

// NOTE: StrictMode disabled because r3f-vfx's GPU buffer lifecycle crashes
// under React 18/19 double-invoke ("Buffer used in submit while destroyed").
// StrictMode is a dev-only check; production builds are unaffected.
// Re-enable if/when r3f-vfx fixes its dispose-then-submit race.
createRoot(document.getElementById('root')!).render(<App />);
