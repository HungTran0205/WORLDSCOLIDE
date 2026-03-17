/** Format game time (in game-milliseconds) to "Day X, HH:MM" string */

const MS_PER_GAME_DAY = 86_400_000;
const MS_PER_GAME_HOUR = 3_600_000;
const MS_PER_GAME_MINUTE = 60_000;

export function formatGameTime(gameTimeMs: number): string {
  if (gameTimeMs < 0) return 'Day 1, 00:00';
  const day = Math.floor(gameTimeMs / MS_PER_GAME_DAY) + 1;
  const remainder = gameTimeMs % MS_PER_GAME_DAY;
  const hours = Math.floor(remainder / MS_PER_GAME_HOUR);
  const minutes = Math.floor((remainder % MS_PER_GAME_HOUR) / MS_PER_GAME_MINUTE);
  return `Day ${day}, ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
