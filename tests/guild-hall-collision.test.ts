import { describe, it, expect, beforeEach } from 'vitest';
import {
  isRectBlocked,
  isGuildHallPointBlocked,
  registerObstacle,
  unregisterObstacle,
  getObstacles,
  DEFAULT_MEMBER_RADIUS,
  type RectObstacle,
} from '@/scene/guild-hall/guild-hall-collision';

const rect: RectObstacle = { minX: 4, maxX: 6, minZ: 2, maxZ: 4 };

describe('isRectBlocked (pure)', () => {
  it('point inside rect is blocked', () => {
    expect(isRectBlocked(5, 3, rect, 0)).toBe(true);
  });

  it('point clearly outside is open', () => {
    expect(isRectBlocked(0, 0, rect, 0)).toBe(false);
  });

  it('point just outside but within radius padding is blocked', () => {
    expect(isRectBlocked(6.2, 3, rect, 0.28)).toBe(true); // 6.2 <= 6 + 0.28
  });

  it('point beyond radius padding is open', () => {
    expect(isRectBlocked(6.5, 3, rect, 0.28)).toBe(false); // 6.5 > 6.28
  });

  it('padded corner is blocked', () => {
    expect(isRectBlocked(4 - 0.28, 2 - 0.28, rect, 0.28)).toBe(true);
  });
});

describe('isGuildHallPointBlocked (registry)', () => {
  beforeEach(() => {
    for (const { id } of getObstacles()) unregisterObstacle(id);
  });

  it('empty registry blocks nothing (graceful before props load)', () => {
    expect(isGuildHallPointBlocked(5, 3)).toBe(false);
  });

  it('registered obstacle blocks interior point', () => {
    registerObstacle('test', rect);
    expect(isGuildHallPointBlocked(5, 3)).toBe(true);
  });

  it('open point stays open with one obstacle registered', () => {
    registerObstacle('test', rect);
    expect(isGuildHallPointBlocked(0, 0)).toBe(false);
  });

  it('unregister removes blocking', () => {
    registerObstacle('test', rect);
    unregisterObstacle('test');
    expect(isGuildHallPointBlocked(5, 3)).toBe(false);
  });

  it('applies DEFAULT_MEMBER_RADIUS padding by default', () => {
    registerObstacle('test', rect);
    expect(isGuildHallPointBlocked(6 + DEFAULT_MEMBER_RADIUS - 0.01, 3)).toBe(true);
    expect(isGuildHallPointBlocked(6 + DEFAULT_MEMBER_RADIUS + 0.5, 3)).toBe(false);
  });

  it('blocks if inside any of multiple obstacles', () => {
    registerObstacle('a', rect);
    registerObstacle('b', { minX: 0, maxX: 1, minZ: 0, maxZ: 1 });
    expect(isGuildHallPointBlocked(0.5, 0.5)).toBe(true);
    expect(isGuildHallPointBlocked(5, 3)).toBe(true);
    expect(isGuildHallPointBlocked(9, 6)).toBe(false);
  });
});
