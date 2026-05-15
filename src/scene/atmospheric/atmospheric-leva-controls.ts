/**
 * Leva dev-tuning schema for the atmospheric composer.
 *
 * Values here are MULTIPLIERS over the active preset's numeric fields (not
 * absolute overrides). `bloomStrength: 1.0` means "leave preset intensity
 * alone"; `1.5` boosts the current room's bloom 50%. Lets devs sweep the
 * whole-stack feel without diffing each preset entry. Persistence: none
 * (Leva is dev-only). Production users tune via `settings.atmosphericEnabled`.
 */

export const ATMOSPHERIC_LEVA_SCHEMA = {
  bloomStrength: { value: 1.0, min: 0, max: 3, step: 0.05, label: 'bloom × intensity' },
  bloomRadius: { value: 1.0, min: 0, max: 2, step: 0.05, label: 'bloom × radius' },
} as const;

export type AtmosphericLevaOverrides = {
  bloomStrength: number;
  bloomRadius: number;
};
