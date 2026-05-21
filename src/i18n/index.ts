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
});

export default i18n;
