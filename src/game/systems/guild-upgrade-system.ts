import { GUILD_UPGRADES } from '@/game/data/buildings';

export function canUpgradeGuild(currentLevel: number, gold: number): boolean {
  const next = GUILD_UPGRADES.find((u) => u.level === currentLevel + 1);
  if (!next) return false;
  return gold >= next.cost;
}

export function getUpgradeCost(currentLevel: number): number {
  const next = GUILD_UPGRADES.find((u) => u.level === currentLevel + 1);
  return next?.cost ?? Infinity;
}
