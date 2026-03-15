const SAVE_KEY = 'worldcolide-save';

export function saveToLocalStorage(state: object): boolean {
  try {
    const json = JSON.stringify(state);
    if (json.length > 4_500_000) return false; // ~4.5MB safety margin
    localStorage.setItem(SAVE_KEY, json);
    return true;
  } catch {
    return false;
  }
}

export function loadFromLocalStorage(): object | null {
  try {
    const json = localStorage.getItem(SAVE_KEY);
    if (!json) return null;
    return JSON.parse(json) as object;
  } catch {
    return null;
  }
}

export function clearLocalStorage(): void {
  localStorage.removeItem(SAVE_KEY);
}
