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
  return i18n.t(`${category}.${id}.${field}`, { ns: 'content', defaultValue: fallback });
}
