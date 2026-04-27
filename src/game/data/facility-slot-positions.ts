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

/**
 * Per-slot camera offset indexed by slot number (0–11).
 * Overrides FACILITY_CAMERA_DEFAULT_OFFSET when set.
 * Tune each slot after placing facilities to get the best isometric framing.
 *
 * Column A (slots 0-3, x=-6.5): tends to need positive x to compensate left lean
 * Column B (slots 4-7, x=3.5):  centered, minimal offset needed
 * Column C (slots 8-11, x=13.5): tends to need negative x to compensate right lean
 */
export const FACILITY_SLOT_CAMERA_OFFSETS: ([number, number, number] | null)[] = [
  [3, 0, 4.5],   // slot 0 — A0 (x=-6.5, z=-8.5)
  [-0.5, 0, -1.0],   // slot 1 — A1 (x=-6.5, z=-20.5)
  [2, 0, -2],   // slot 2 — A2 (x=-6.5, z=-32.5)
  [0.0, 0, -2],   // slot 3 — A3 (x=-6.5, z=-44.5)
  [0, 0, -2],   // slot 4 — B4 (x=3.5, z=-8.5)
  [0, 0, -2],   // slot 5 — B5 (x=3.5, z=-20.5)
  [0, 0, -2],   // slot 6 — B6 (x=3.5, z=-32.5)
  [1, 0, -0.5],   // slot 7 — B7 (x=3.5, z=-44.5)
  [0.5, 0, 2],   // slot 8 — C8 (x=13.5, z=-8.5)
  [-1.0, 0, 0.0],   // slot 9 — C9 (x=13.5, z=-20.5)
  [-0.5, 0, 0.0],   // slot 10 — C10 (x=13.5, z=-32.5)
  [-2, 0, -2],   // slot 11 — C11 (x=13.5, z=-44.5)
];

export const FACILITY_CAMERA_DEFAULT_OFFSET: [number, number, number] = [0, -1, -2];


/**
 * Dev-only mutable overrides — written by FacilitySlotDebugPanel via Leva.
 * null = fall through to static FACILITY_SLOT_CAMERA_OFFSETS value.
 */
export const _debugSlotOffsets: ([number, number, number] | null)[] = new Array(12).fill(null);

/**
 * Single access point for slot camera offset.
 * Priority: per-type override > debug override > per-slot static > default.
 */
export function getSlotCameraOffset(slotIndex: number): [number, number, number] {
if (import.meta.env.DEV && _debugSlotOffsets[slotIndex]) return _debugSlotOffsets[slotIndex]!;
  return FACILITY_SLOT_CAMERA_OFFSETS[slotIndex] ?? FACILITY_CAMERA_DEFAULT_OFFSET;
}

/** Default slot assigned to each facility type during v12→v13 save migration */
export const FACILITY_DEFAULT_SLOTS: Record<string, number> = {
  tavern: 8,
  'training-yard': 5,
  infirmary: 4,
  workshop: 9,
  'logging-site': 6,
  'stone-quarry': 10,
};
