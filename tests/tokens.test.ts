import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

describe('Rosewood tokens', () => {
  it('every Rosewood token matches the design system copy', () => {
    const md = readFileSync('design/tokens.md', 'utf8');
    const row = /^\| `(\w+)` \|[^|]*\| `(#[0-9A-F]{6})` \| `(#[0-9A-F]{6})` \|$/gm;
    const dark = new Map<string, string>();
    for (const m of md.matchAll(row)) dark.set(kebab(m[1]), m[2]);
    expect(dark.size).toBe(7);

    const css = readFileSync('src/styles/tokens.css', 'utf8');
    const values = new Map<string, string>();
    for (const m of css.matchAll(/--([a-z-]+):\s*(#[0-9A-Fa-f]{6})/g)) values.set(m[1], m[2]);

    for (const [name, hex] of dark) {
      expect(values.get(name)?.toLowerCase(), name).toBe(hex.toLowerCase());
    }
    expect(dark.get('surface')).toBe('#171313');
    expect(dark.get('ink')).toBe('#F8EFE9');
    expect(dark.get('danger')).toBe('#D4857C');
  });
});
