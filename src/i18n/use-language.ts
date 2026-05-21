import { useTranslation } from 'react-i18next';
import { LANG_STORAGE_KEY } from './index';

export type Lang = 'en' | 'vi';

/**
 * Single source of truth for the device-level language preference.
 *
 * Language is a device setting (one language across all save slots), so it lives
 * in localStorage + i18next — not in the saved game payload. This hook centralizes
 * the read/apply logic that used to be duplicated inline in the settings screens.
 *
 * `useTranslation` subscribes to i18next's `languageChanged` event, so `language`
 * stays reactive and any component using this hook re-renders on a switch.
 */
export function useLanguage(): { language: Lang; setLanguage: (lang: Lang) => void } {
  const { i18n } = useTranslation();
  const language: Lang = i18n.language === 'vi' ? 'vi' : 'en';

  const setLanguage = (lang: Lang) => {
    void i18n.changeLanguage(lang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // localStorage unavailable (private mode / SSR) — language still applies in-memory.
    }
  };

  return { language, setLanguage };
}
