import i18n from 'i18next';

/**
 * Game-data display text (names, descriptions, zones) is localized via the
 * `content` namespace, keyed by entity id, WITHOUT changing any data shape.
 *
 * Key shape: `<category>.<id>.<field>` — e.g. `missions.slime-extermination.name`.
 *
 * The data files keep their *source* language inline; this resolver overlays the
 * other language from `content.<lng>.json` and falls back to the inline source
 * via i18next `defaultValue`. The source language differs by category:
 *   - Most data is EN-authored → VN keys live in `content.vi.json`;
 *     `defaultValue` (the inline data string) supplies EN.
 *   - `civilization-config` is VN-authored → EN keys live in `content.en.json`
 *     (sourced from the lore glossary); `defaultValue` supplies VN.
 * That asymmetry is why `content.en.json` is intentionally not empty.
 */
export function tContent(
  category: string,
  id: string,
  field: string,
  fallback: string,
): string {
  // fallbackLng:false is load-bearing. VN-authored categories (civ, skills) keep
  // their VN value inline and overlay EN in content.en.json. With the global
  // fallbackLng:'en', a vi lookup that misses the (absent) vi key would fall back
  // to the EN overlay and return English to a Vietnamese player. Disabling the
  // language fallback for content lookups makes resolution go active-language →
  // defaultValue (the inline source string), which is the correct value in both
  // directions. The UI namespace keeps the global EN fallback as a safety net.
  return i18n.t(`${category}.${id}.${field}`, {
    ns: 'content',
    defaultValue: fallback,
    fallbackLng: false,
  });
}
