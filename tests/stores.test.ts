import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { STORES, comingSoonLine } from '../src/config/stores';

const ORIGINS = {
  apple: 'https://apps.apple.com/',
  google: 'https://play.google.com/',
} as const;

describe('comingSoonLine', () => {
  it('names the stores that are not live yet', () => {
    expect(comingSoonLine(false, false)).toBe('Coming soon to the App Store and Google Play.');
    expect(comingSoonLine(true, false)).toBe('Coming soon to Google Play.');
    expect(comingSoonLine(false, true)).toBe('Coming soon to the App Store.');
    expect(comingSoonLine(true, true)).toBeNull();
  });
});

describe('store config', () => {
  it('sees both stores', () => {
    expect(Object.keys(STORES).sort()).toEqual(['apple', 'google']);
  });

  for (const [name, store] of Object.entries(STORES)) {
    if (!store.live) continue;
    it(`${name} is live with a real url and a badge file`, () => {
      expect(store.url.startsWith(ORIGINS[name as keyof typeof ORIGINS])).toBe(true);
      expect(existsSync(`public${store.badge}`), store.badge).toBe(true);
    });
  }
});

describe('built home page', () => {
  const html = readFileSync('dist/index.html', 'utf8');

  it('shows the coming soon line in the hero and the close', () => {
    const line = 'Coming soon to the App Store and Google Play.';
    expect(html.split(line).length - 1).toBe(2);
  });

  it('keeps the get anchor', () => {
    expect(html).toContain('id="get"');
  });
});
