import { describe, expect, it } from 'vitest';
import { clock, evening, ramp } from '../src/scripts/evening/timeline';

function numbers(value: unknown, path = ''): Array<[string, number]> {
  if (typeof value === 'number') return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => numbers(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => numbers(v, path ? `${path}.${k}` : k));
  }
  return [];
}

describe('evening timeline invariants', () => {
  it('holds at every sample of p from 0 to 1', () => {
    for (let i = 0; i <= 1000; i++) {
      const p = i / 1000;
      const s = evening(p);
      if (s.centre.opacity > 0) expect(s.hero, `p=${p}: headline must be gone before the phone shows`).toBe(0);
      if (s.split > 0) expect(s.centre.opacity, `p=${p}: one phone at a time`).toBe(0);
      if (s.panes > 0) expect(s.split, `p=${p}: panes need the split open`).toBeGreaterThan(0.8);
      expect(s.centre.cards[1], `p=${p}: Amara's card before Tunde's`).toBeLessThanOrEqual(s.centre.cards[0]);
      const [ah, am] = s.amara.time.split(':').map(Number);
      const [th, tm] = s.tunde.time.split(':').map(Number);
      expect((ah * 60 + am - (th * 60 + tm) + 1440) % 1440, `p=${p}: Tunde is one hour behind`).toBe(60);
      for (const [path, n] of numbers({ ...s, step: undefined })) {
        expect(n >= 0 && n <= 1, `p=${p}: ${path}=${n} outside 0..1`).toBe(true);
      }
    }
  });
});

describe('evening timeline points', () => {
  it('p=0', () => {
    const s = evening(0);
    expect(s.hero).toBe(1);
    expect(s.centre.opacity).toBe(0);
    expect(s.step).toBe(0);
    expect(s.rail).toBe(0);
  });
  it('p=0.2', () => {
    const s = evening(0.2);
    expect(s.centre.view).toBe('write');
    expect(s.caption.city).toBe('Lagos');
  });
  it('p=0.33', () => {
    const s = evening(0.33);
    expect(s.centre.opacity).toBe(0);
    expect(s.split).toBeGreaterThan(0);
    expect(s.split).toBeLessThan(1);
  });
  it('p=0.55', () => {
    const s = evening(0.55);
    expect(s.split).toBe(1);
    expect(s.tunde.view).toBe('write');
    expect(s.step).toBe(1);
  });
  it('p=0.97', () => {
    const s = evening(0.97);
    expect(s.centre.view).toBe('reveal');
    expect(s.centre.cards).toEqual([1, 1]);
    expect(s.step).toBe(2);
    expect(s.caption.text).toBe('Your day is open. Both of you, at the same moment.');
  });
  it('clamps NaN and out-of-range input', () => {
    expect(evening(NaN)).toEqual(evening(0));
    expect(evening(-1)).toEqual(evening(0));
    expect(evening(2)).toEqual(evening(1));
  });
  it('clock and ramp', () => {
    expect(clock(1300)).toBe('21:40');
    expect(clock(24 * 60 + 5)).toBe('00:05');
    expect(ramp(0.5, 0, 1)).toBe(0.5);
    expect(ramp(2, 0, 1)).toBe(1);
  });
});
