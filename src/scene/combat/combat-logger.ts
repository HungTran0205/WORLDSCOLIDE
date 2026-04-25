/**
 * Combat diagnostic logger — accumulates log entries in memory.
 * Auto-downloads combat.log when combat ends (CombatFightController calls downloadCombatLog).
 * Also exposed globally: window.__downloadCombatLog(), window.__clearCombatLog()
 */

const ENTRIES: string[] = [];
let tBase = performance.now();

export function combatLog(msg: string): void {
  const ms = (performance.now() - tBase).toFixed(0).padStart(6);
  ENTRIES.push(`[${ms}ms] ${msg}`);
}

export function clearCombatLog(): void {
  ENTRIES.length = 0;
  tBase = performance.now();
}

export function downloadCombatLog(): void {
  if (ENTRIES.length === 0) return;
  const blob = new Blob([ENTRIES.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'combat.log';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Dev convenience — call from DevTools console if needed
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__combatLog = ENTRIES;
  (window as unknown as Record<string, unknown>).__downloadCombatLog = downloadCombatLog;
  (window as unknown as Record<string, unknown>).__clearCombatLog = clearCombatLog;
}
