/**
 * Active slot tracking via localStorage.
 * Only stores which slot (1-3) is currently active — no game state.
 */

const ACTIVE_SLOT_KEY = 'worldcolide-active-slot';

export function getActiveSlotId(): number | null {
  try {
    const val = localStorage.getItem(ACTIVE_SLOT_KEY);
    if (!val) return null;
    const num = Number(val);
    return num >= 1 && num <= 3 ? num : null;
  } catch {
    return null;
  }
}

export function setActiveSlotId(slotId: number): void {
  try {
    localStorage.setItem(ACTIVE_SLOT_KEY, String(slotId));
  } catch {
    // localStorage unavailable — non-critical
  }
}

export function clearActiveSlotId(): void {
  try {
    localStorage.removeItem(ACTIVE_SLOT_KEY);
  } catch {
    // localStorage unavailable — non-critical
  }
}
