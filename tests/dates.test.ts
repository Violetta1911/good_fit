import { describe, it, expect, afterEach, vi } from 'vitest';
import { isValidIanaTimezone, dayBoundsInZone } from '../src/utils/dates';
import { userToday } from '../src/utils/dates';

describe('isValidIanaTimezone', () => {
  it('accepts Europe/Warsaw', () => {
    expect(isValidIanaTimezone('Europe/Warsaw')).toBe(true);
  });

  it('accepts UTC', () => {
    expect(isValidIanaTimezone('UTC')).toBe(true);
  });

  it('rejects an unknown zone', () => {
    expect(isValidIanaTimezone('Foo/Bar')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidIanaTimezone('')).toBe(false);
  });
});

describe('dayBoundsInZone', () => {
  const HOUR_MS = 60 * 60 * 1000;

  it('returns 24-hour bounds for a normal winter day in Warsaw', () => {
    const { start, end } = dayBoundsInZone(
      new Date('2025-01-15T12:00:00Z'),
      'Europe/Warsaw',
    );
    expect(start.toISOString()).toBe('2025-01-14T23:00:00.000Z');
    expect(end.toISOString()).toBe('2025-01-15T22:59:59.999Z');
    expect(end.getTime() - start.getTime()).toBeCloseTo(24 * HOUR_MS, -1);
  });

  it('returns 23-hour bounds on the spring-forward day in Warsaw', () => {
    const { start, end } = dayBoundsInZone(
      new Date('2025-03-30T12:00:00Z'),
      'Europe/Warsaw',
    );
    expect(start.toISOString()).toBe('2025-03-29T23:00:00.000Z');
    expect(end.toISOString()).toBe('2025-03-30T21:59:59.999Z');
    expect(end.getTime() - start.getTime()).toBeCloseTo(23 * HOUR_MS, -1);
  });

  it('returns 25-hour bounds on the fall-back day in Warsaw', () => {
    const { start, end } = dayBoundsInZone(
      new Date('2025-10-26T12:00:00Z'),
      'Europe/Warsaw',
    );
    expect(start.toISOString()).toBe('2025-10-25T22:00:00.000Z');
    expect(end.toISOString()).toBe('2025-10-26T22:59:59.999Z');
    expect(end.getTime() - start.getTime()).toBeCloseTo(25 * HOUR_MS, -1);
  });

  it('throws on invalid zone', () => {
    expect(() => dayBoundsInZone(new Date(), 'Foo/Bar')).toThrow();
  });
});

describe('userToday', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the date as seen in the given timezone, not the server', () => {
    vi.useFakeTimers();
    // 23:30 UTC on July 4 = 01:30 on July 5 in Warsaw (UTC+2 in summer)
    vi.setSystemTime(new Date('2026-07-04T23:30:00Z'));

    expect(userToday('UTC')).toBe('2026-07-04');
    expect(userToday('Europe/Warsaw')).toBe('2026-07-05');
  });
});