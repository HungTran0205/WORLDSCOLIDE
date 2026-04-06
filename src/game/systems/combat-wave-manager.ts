/**
 * WaveManager — tracks multi-wave encounter progression.
 * Pure logic, no R3F dependency — unit testable.
 */

export interface WaveDefinition {
  /** Enemy template IDs to spawn */
  enemyIds: string[];
  /** X offset from arena origin for this wave's spawn zone */
  spawnXOffset: number;
  /** HP multiplier applied to all enemies in this wave (default 1.0) */
  hpMultiplier?: number;
  /** Optional lane assignments per enemy index */
  lanes?: ('front' | 'mid' | 'back')[];
}

export class WaveManager {
  private readonly _waves: WaveDefinition[];
  private _currentIndex = 0;

  constructor(waves: WaveDefinition[]) {
    this._waves = waves;
  }

  current(): WaveDefinition { return this._waves[this._currentIndex]; }
  currentWaveIndex(): number { return this._currentIndex; }
  totalWaves(): number { return this._waves.length; }
  hasNext(): boolean { return this._currentIndex < this._waves.length - 1; }

  /** Peek at the next wave without advancing */
  peekNext(): WaveDefinition | null {
    if (!this.hasNext()) return null;
    return this._waves[this._currentIndex + 1];
  }

  advance(): WaveDefinition | null {
    if (!this.hasNext()) return null;
    this._currentIndex++;
    return this.current();
  }
}

/** Convert legacy single-wave mission to WaveDefinition[] */
export function legacyToWaves(enemyIds: string[]): WaveDefinition[] {
  return [{ enemyIds, spawnXOffset: 0, hpMultiplier: 1.0 }];
}
