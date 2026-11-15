import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Gradient stops only: a linear blend between two stops is never lighter than the lighter stop,
// and the card ::after fade only darkens, so neither can lower the contrast the stops give.
const css = readFileSync('src/styles/scenes.css', 'utf8');
type RGB = [number, number, number];

const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const blend = (fg: RGB, a: number, bg: RGB): RGB =>
  fg.map((c, i) => a * c + (1 - a) * bg[i]) as RGB;
const lin = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]: RGB) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a: RGB, b: RGB) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const stops = [...css.matchAll(/--scene-([a-z-]+-\d):\s*(#[0-9A-Fa-f]{6})\b/g)].map((m) => ({
  name: m[1],
  hex: m[2],
}));
const alphaMatch = css.match(/--scrim-alpha:\s*([0-9.]+)\s*;/);

describe('scene stand-ins keep text readable', () => {
  it('finds the stops and the scrim alpha', () => {
    expect(stops.length).toBeGreaterThanOrEqual(14);
    expect(alphaMatch).not.toBeNull();
    const a = Number(alphaMatch![1]);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThanOrEqual(1);
  });

  const alpha = Number(alphaMatch?.[1] ?? 0);
  for (const s of stops) {
    it(`${s.name} ${s.hex}: white and quiet text reach 4.5:1 under the scrim`, () => {
      const bg = blend([14, 10, 10], alpha, hex(s.hex));
      const white: RGB = [255, 255, 255];
      expect(ratio(white, bg), 'white').toBeGreaterThanOrEqual(4.5);
      expect(ratio(blend(white, 0.8, bg), bg), 'quiet').toBeGreaterThanOrEqual(4.5);
    });
  }
});
