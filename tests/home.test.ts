import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

const html = readFileSync('dist/index.html', 'utf8');
const doc = new JSDOM(html).window.document;

describe('home page, the evening', () => {
  it('has exactly one h1', () => {
    const h1s = doc.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
    expect(h1s[0]!.textContent?.trim()).toBe('Write before you read.');
  });

  it('carries the promise line', () => {
    const text = doc.body.textContent ?? '';
    expect(text).toContain('Write before you read.');
    expect(text).toContain('Your day opens when you both have.');
  });

  it('has four frames in order inside #how', () => {
    const frames = [...doc.querySelectorAll('[data-frame]')];
    expect(frames.map((f) => f.getAttribute('data-frame'))).toEqual(['1', '2', '3', '4']);
    for (const f of frames) expect(f.closest('#how')).not.toBeNull();
  });

  it('shows exactly one view per phone, in the story order', () => {
    const devs = [...doc.querySelectorAll('.dev')];
    const shown = devs.map((d) => {
      const visible = [...d.querySelectorAll('.v')].filter((v) => !v.hasAttribute('hidden'));
      expect(visible).toHaveLength(1);
      return visible[0]!.getAttribute('data-view');
    });
    expect(shown).toEqual(['write', 'wait', 'write', 'reveal']);
  });

  it('ships no script', () => {
    expect(html).not.toContain('<script');
  });
});
