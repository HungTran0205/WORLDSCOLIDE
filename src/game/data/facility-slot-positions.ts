/**
 * 12 placement slots arranged in a 3-column × 4-row grid behind the guild hall.
 * Each slot is a 7×7 building pad. Slot index = col * 4 + row.
 *
 * Columns: x = -6.5 (A), 3.5 (B), 13.5 (C)
 * Rows:    z = -8.5 (front) → -44.5 (back)
 *
 * Columns B and C (slots 4–11) match the existing hard-coded roomCenter positions
 * used in v12 saves — migration re-uses these defaults.
 */
export const FACILITY_SLOTS: [number, number, number][] = [
  // Column A (x = -6.5)
  [-6.5, 0, -8.5],   // slot 0
  [-6.5, 0, -20.5],  // slot 1
  [-6.5, 0, -32.5],  // slot 2
  [-6.5, 0, -44.5],  // slot 3
  // Column B (x = 3.5)
  [3.5, 0, -8.5],    // slot 4  — was infirmary default
  [3.5, 0, -20.5],   // slot 5  — was training-yard default
  [3.5, 0, -32.5],   // slot 6  — was logging-site default
  [3.5, 0, -44.5],   // slot 7
  // Column C (x = 13.5)
  [13.5, 0, -8.5],   // slot 8  — was tavern default
  [13.5, 0, -20.5],  // slot 9  — was workshop default
  [13.5, 0, -32.5],  // slot 10 — was stone-quarry default
  [13.5, 0, -44.5],  // slot 11
];

/** Default slot assigned to each facility type during v12→v13 save migration */
export const FACILITY_DEFAULT_SLOTS: Record<string, number> = {
  tavern: 8,
  'training-yard': 5,
  infirmary: 4,
  workshop: 9,
  'logging-site': 6,
  'stone-quarry': 10,
};
