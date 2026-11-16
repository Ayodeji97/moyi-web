// Sharing previews, the sitemap and robots (slice 4 follow-ups).
import { existsSync, readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { PAGES } from '../src/pages/sitemap.xml';

const file = (p: string) => (p === '/' ? 'dist/index.html' : `dist${p}.html`);
const doc = (p: string) => new JSDOM(readFileSync(file(p), 'utf8')).window.document;
const meta = (d: Document, k: string) => d.querySelector(`meta[property="${k}"], meta[name="${k}"]`)?.getAttribute('content');

describe('sharing previews', () => {
  for (const p of PAGES) {
    it(`${p}: canonical, og and twitter tags that match the page`, () => {
      const d = doc(p);
      const url = new URL(p, 'https://getmoyi.app').href;
      expect(d.querySelector('link[rel="canonical"]')!.getAttribute('href')).toBe(url);
      expect(meta(d, 'og:url')).toBe(url);
      expect(meta(d, 'og:title')).toBe(d.title);
      expect(meta(d, 'og:description')).toBe(meta(d, 'description'));
      expect(meta(d, 'og:image')).toBe('https://getmoyi.app/og.png');
      expect(meta(d, 'twitter:card')).toBe('summary_large_image');
    });
  }
  it('the functional pages, which carry tokens and codes, have none', () => {
    for (const f of ['verify', 'reset-password', 'invite', '404']) {
      const html = readFileSync(`dist/${f}.html`, 'utf8');
      expect(html, f).not.toMatch(/og:|rel="canonical"/);
      expect(html, f).toContain('name="robots" content="noindex"');
    }
  });
  it('the card image is a 1200x630 PNG', () => {
    const png = readFileSync('dist/og.png');
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });
});

describe('sitemap and robots', () => {
  it('lists every indexable page, each built, and nothing noindex', () => {
    const xml = readFileSync('dist/sitemap.xml', 'utf8');
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual(PAGES.map((p) => new URL(p, 'https://getmoyi.app').href));
    for (const p of PAGES) {
      expect(existsSync(file(p)), p).toBe(true);
      expect(readFileSync(file(p), 'utf8'), p).not.toContain('noindex');
    }
  });
  it('robots points at the sitemap', () => {
    expect(readFileSync('dist/robots.txt', 'utf8')).toContain('Sitemap: https://getmoyi.app/sitemap.xml');
  });
});
