import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uiEn from './ui.en.json';
import uiVi from './ui.vi.json';
import contentEn from './content.en.json';
import contentVi from './content.vi.json';

/**
 * Language is a device-level preference (one language across all save slots),
 * stored in localStorage — NOT in the per-save payload. Read it before init so
 * the first paint is already in the right language (no flash of EN then VN).
 */
export const LANG_STORAGE_KEY = 'settings.lang';

export function readStoredLang(): 'en' | 'vi' {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LANG_STORAGE_KEY) : null;
  return raw === 'vi' || raw === 'en' ? raw : 'en';
}

// Two namespaces: `ui` (interface chrome) is the default so existing
// prefix-less calls like t('tavern.x') keep resolving; `content` (game-data
// names/descriptions + dialog) is addressed explicitly via t('content:...').
// In dev, surface any un-migrated string as a console warning the moment it is
// requested without a translation, so coverage gaps show up during a playthrough
// rather than slipping past the static sweep. Disabled in prod (no overhead, no noise).
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV === true;

i18n.use(initReactI18next).init({
  resources: {
    en: { ui: uiEn, content: contentEn },
    vi: { ui: uiVi, content: contentVi },
  },
  ns: ['ui', 'content'],
  defaultNS: 'ui',
  lng: readStoredLang(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  // Resolve resources synchronously at import time; disabling Suspense avoids a
  // boot flash of raw keys before translations are ready.
  react: { useSuspense: false },
  saveMissing: isDev,
  missingKeyHandler: isDev
    ? (lngs, ns, key) => {
        // Only the `ui` namespace signals a real gap here: every key is expected
        // to exist in both languages, so a miss means an un-migrated string. The
        // `content` namespace resolves source-language entries through defaultValue
        // by design (the key is intentionally absent for the authoring language),
        // so warning on it would be constant false-positive noise.
        if (ns === 'ui') {
          console.warn(`[i18n] missing ui key "${key}" for ${lngs.join(', ')}`);
        }
      }
    : undefined,
});

export default i18n;
