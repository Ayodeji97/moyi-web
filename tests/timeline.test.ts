import { readFileSync } from 'node:fs';
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
      expect([0, 1], `p=${p}: the centre phone is opaque or absent, never see-through`).toContain(s.centre.opacity);
      expect([0, 1], `p=${p}: the pane phones are opaque or absent, never see-through`).toContain(s.paneOn);
      expect(s.centre.opacity, `p=${p}: the centre phone shows exactly while it is on the stage`).toBe(s.centre.rise > 0 ? 1 : 0);
      expect(s.paneOn, `p=${p}: the pane phones show exactly while they are on the stage`).toBe(s.panes > 0 ? 1 : 0);
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

describe('evening timeline exact values', () => {
  it('clocks', () => {
    expect(evening(0).amara.time).toBe('21:42');
    expect(evening(0.7).amara.time).toBe('22:50');
    expect(evening(0.7).tunde.time).toBe('21:50');
    expect(evening(0.13).centre.time).toBe('17:30');
    expect(evening(0.26).centre.time).toBe('21:40');
    expect(evening(0.97).centre.time).toBe('23:10');
    expect(clock(-5)).toBe('23:55');
  });
  it('typing', () => {
    expect(evening(0.17).centre.view).toBe('write');
    expect(evening(0.25).centre.busy).toBe(true);
    expect(evening(0.26).centre.view).toBe('wait');
    expect(evening(0.26).centre.busy).toBe(false);
    expect(evening(0.5).tunde.view).toBe('write');
    // The day opens as soon as both have written: Tunde's send opens it on both phones.
    expect(evening(0.66).tunde.view).toBe('reveal');
    expect(evening(0.66).amara.view).toBe('reveal');
    expect(evening(0.6).amara.view).toBe('wait');
    for (let i = 0; i <= 1000; i++) {
      const s = evening(i / 1000);
      expect(s.tunde.view, `p=${i / 1000}: Tunde never waits for Amara, who has written`).not.toBe('wait');
      expect(s.amara.view === 'reveal', `p=${i / 1000}: both open together`).toBe(s.tunde.view === 'reveal');
    }
  });
  it('caption', () => {
    expect(evening(0.1).caption.opacity).toBe(0);
    expect(evening(0.15).caption.opacity).toBe(1);
    expect(evening(0.3).caption.opacity).toBe(0);
    expect(evening(0.9).caption.opacity).toBe(1);
    expect(evening(0.14).caption.text).toBe('The day is open for writing. Nothing to chase.');
    expect(evening(0.2).caption.text).toBe('Amara writes one true sentence about Tunde.');
    expect(evening(0.97).caption.city).toBe('Lagos 23:10 · London 22:10');
    expect(evening(0.97).caption.time).toBe('');
  });
  it('sky', () => {
    expect(evening(0.3).sky).toBeCloseTo(0.55, 6);
    expect(evening(0.72).sky).toBeCloseTo(0.55, 6);
    expect(evening(1).sky).toBeCloseTo(1, 6);
  });
  it('bars, rail and step', () => {
    const b1 = evening(0.36).bars;
    [1, 0, 0].forEach((v, i) => expect(b1[i]).toBeCloseTo(v, 6));
    const b2 = evening(0.78).bars;
    [1, 1, 0].forEach((v, i) => expect(b2[i]).toBeCloseTo(v, 6));
    expect(evening(0.1).rail).toBe(0);
    expect(evening(0.5).rail).toBe(1);
    expect(evening(0.36).step).toBe(1);
    expect(evening(0.78).step).toBe(2);
  });
  it('rise: in from below, out again, in for the reveal', () => {
    expect(evening(0.08).centre.rise).toBe(0);
    expect(evening(0.2).centre.rise).toBe(1);
    expect(evening(0.26).centre.rise).toBe(1);
    expect(evening(0.295).centre.rise).toBe(0);
    expect(evening(0.82).centre.rise).toBe(0);
    expect(evening(0.87).centre.rise).toBe(1);
    expect(evening(0.14).centre.rise).toBeCloseTo(0.5, 6);
  });
  it('cards', () => {
    const c = evening(0.88).centre.cards;
    expect(c[0]).toBeCloseTo(1, 6);
    expect(c[1]).toBeCloseTo(0.2, 6);
  });
});

describe('no see-through phone over the scenery', () => {
  const css = readFileSync('src/styles/evening.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1]!.trim(), body: m[2]! }));
  it('takes a phone opacity only from a 0-or-1 property', () => {
    const phoneRules = rules.filter((r) => /data-role="(centre|amara|tunde)"\]|evening__phone/.test(r.sel) && /opacity/.test(r.body));
    expect(phoneRules.length).toBeGreaterThan(0);
    for (const r of phoneRules) {
      const m = /opacity:\s*([^;]+);/.exec(r.body)!;
      expect(m[1]!.trim(), r.sel).toMatch(/^var\(--(centre|pane-on)\)$/);
    }
  });
  it('the engine writes those properties from the binary fields', () => {
    const engine = readFileSync('src/scripts/evening/engine.ts', 'utf8');
    expect(engine).toContain("prop('--centre', s.centre.opacity)");
    expect(engine).toContain("prop('--pane-on', s.paneOn)");
  });
});
