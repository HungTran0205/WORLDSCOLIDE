import { describe, it, expect } from 'vitest';
import {
  getHorizontalDirectionFromMovement,
  getGuildHallIdleFramePath,
} from '@/scene/sprites/sprite-path-resolver';

// screenRight = dx - dz ; screenDown = dx + dz (isometric screen projection)
describe('getHorizontalDirectionFromMovement', () => {
  it('screen-right movement → east', () => {
    expect(getHorizontalDirectionFromMovement(1, -1, 'west')).toBe('east');
  });

  it('screen-left movement → west', () => {
    expect(getHorizontalDirectionFromMovement(-1, 1, 'east')).toBe('west');
  });

  it('pure -Z movement → east (tilted floor)', () => {
    expect(getHorizontalDirectionFromMovement(0, -2, 'west')).toBe('east');
  });

  it('pure +Z movement → west (tilted floor)', () => {
    expect(getHorizontalDirectionFromMovement(0, 2, 'east')).toBe('west');
  });

  it('keeps previous facing only when screen-vertical (dx ≈ dz)', () => {
    expect(getHorizontalDirectionFromMovement(1, 1, 'west')).toBe('west');
    expect(getHorizontalDirectionFromMovement(1, 1, 'east')).toBe('east');
  });

  it('only ever returns east or west (never north/south)', () => {
    const seen = new Set<string>();
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        seen.add(getHorizontalDirectionFromMovement(dx, dz, 'east'));
      }
    }
    expect([...seen].every((d) => d === 'east' || d === 'west')).toBe(true);
  });
});

describe('getGuildHallIdleFramePath', () => {
  it('points to south frame_000 of the basePath', () => {
    expect(getGuildHallIdleFramePath('/sprites/characters/LS-WARRIOR-M')).toBe(
      '/sprites/characters/LS-WARRIOR-M/animations/walking-8-frames/south/frame_000.png',
    );
  });
});
