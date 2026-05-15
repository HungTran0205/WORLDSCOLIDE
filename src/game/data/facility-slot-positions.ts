/**
 * 12 placement slots in a Bát Quái (八卦) radial layout around the guild hall.
 * Each slot is a 7×7 building pad. Center (HALL) at [5, 0, 3.5]. Spacing = 14 units.
 *
 * Inner cross  (slots 0–3):  14 units N/E/S/W from center.
 * Diagonal     (slots 5,7,9,11): 14 units on each axis.
 * Outer cardinal (slots 4,6,8,10): 28 units N/E/S/W from center.
 *
 * Slot map (image 1–12 → index 0–11):
 *   0=N, 1=E, 2=S, 3=W, 4=W-far, 5=NW, 6=N-far, 7=NE, 8=E-far, 9=SE, 10=S-far, 11=SW
 */
export const FACILITY_SLOTS: [number, number, number][] = [
  [5,   0, -10.5],  // slot 0  — North inner
  [19,  0,   3.5],  // slot 1  — East inner
  [5,   0,  17.5],  // slot 2  — South inner
  [-9,  0,   3.5],  // slot 3  — West inner
  [-23, 0,   3.5],  // slot 4  — West far
  [-9,  0, -10.5],  // slot 5  — Northwest
  [5,   0, -24.5],  // slot 6  — North far
  [19,  0, -10.5],  // slot 7  — Northeast
  [33,  0,   3.5],  // slot 8  — East far
  [19,  0,  17.5],  // slot 9  — Southeast
  [5,   0,  31.5],  // slot 10 — South far
  [-9,  0,  17.5],  // slot 11 — Southwest
];

/**
 * Per-slot camera offset (0–11). Tune each to get best isometric framing.
 * Western slots need +x, Eastern slots need -x to compensate isometric lean.
 */
export const FACILITY_SLOT_CAMERA_OFFSETS: ([number, number, number] | null)[] = [
  [-1.0,  0, -1.5],  // slot 0  — North inner-1.0
  [-1.0, 0, -1.5],  // slot 1  — East inner
  [-1.0,  0, -1.5],  // slot 2  — South inner
  [-1,  0, -1.5],  // slot 3  — West inner
  [-1.0,  0, -1.5],  // slot 4  — West far
  [-1.0,  0, -1.5],  // slot 5  — Northwest
  [-1.0,  0, -1.5],  // slot 6  — North far
  [-1.0, 0, -1.5],  // slot 7  — Northeast
  [-1, 0, -1.5],  // slot 8  — East far
  [-1.0, 0, -1.5],  // slot 9  — Southeast
  [-1.0,  0, -1.5],  // slot 10 — South far
  [-1.0,  0, -1.5],  // slot 11 — Southwest
];

export const FACILITY_CAMERA_DEFAULT_OFFSET: [number, number, number] = [0, -1, -2];

/**
 * Dev-only mutable overrides — written by FacilitySlotDebugPanel via Leva.
 * null = fall through to static FACILITY_SLOT_CAMERA_OFFSETS value.
 */
export const _debugSlotOffsets: ([number, number, number] | null)[] = new Array(12).fill(null);

/**
 * Single access point for slot camera offset.
 * Priority: debug override > per-slot static > default.
 */
export function getSlotCameraOffset(slotIndex: number): [number, number, number] {
  if (import.meta.env.DEV && _debugSlotOffsets[slotIndex]) return _debugSlotOffsets[slotIndex]!;
  return FACILITY_SLOT_CAMERA_OFFSETS[slotIndex] ?? FACILITY_CAMERA_DEFAULT_OFFSET;
}

/** Default slot assigned to each facility type during save migration */
export const FACILITY_DEFAULT_SLOTS: Record<string, number> = {
  tavern: 1,
  'training-yard': 0,
  infirmary: 3,
  workshop: 7,
  'logging-site': 2,
  'stone-quarry': 9,
};
