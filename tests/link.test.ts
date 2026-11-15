import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

const linkJs = readFileSync('dist/link.js', 'utf8');

function load(page: string, url: string) {
  const html = readFileSync(`dist/${page}.html`, 'utf8');
  const dom = new JSDOM(html, { url, runScripts: 'outside-only' });
  const { window } = dom;
  Object.defineProperty(window.navigator, 'clipboard', {
    value: { writeText: () => Promise.resolve() },
    configurable: true,
  });
  window.eval(linkJs);
  const doc = window.document;
  const text = (id: string) => doc.getElementById(id)!.textContent;
  const hidden = (id: string) => doc.getElementById(id)!.hidden;
  return { text, hidden };
}

describe('link.js on the built pages', () => {
  it('verify shows the token and command', () => {
    const p = load('verify', 'https://getmoyi.app/verify?token=abc_DEF-123');
    expect(p.text('value')).toBe('abc_DEF-123');
    expect(p.text('command')).toBe('scripts/moyi verify abc_DEF-123');
    expect(p.hidden('missing')).toBe(true);
  });

  it('reset shows its command', () => {
    const p = load('reset-password', 'https://getmoyi.app/reset-password?token=X1');
    expect(p.text('command')).toBe('scripts/moyi reset-password X1');
  });

  it('invite upper-cases the code', () => {
    const p = load('invite', 'https://getmoyi.app/i/k7qx2m');
    expect(p.text('value')).toBe('K7QX2M');
    expect(p.text('command')).toBe('scripts/moyi bond join K7QX2M');
  });

  it('shell metacharacters show the incomplete panel', () => {
    const p = load('verify', 'https://getmoyi.app/verify?token=$(rm%20-rf)');
    expect(p.hidden('found')).toBe(true);
    expect(p.hidden('missing')).toBe(false);
    expect(p.text('command')).toBe('');
  });

  it('a broken escape shows the incomplete panel', () => {
    const p = load('invite', 'https://getmoyi.app/i/%E0%A4%A');
    expect(p.hidden('missing')).toBe(false);
    expect(p.hidden('found')).toBe(true);
  });

  // Under Pages /i/abc/ is a 404 (pinned in scripts/headers-table.mjs); this covers link.js's own guard.
  it('a trailing slash shows the incomplete panel', () => {
    const p = load('invite', 'https://getmoyi.app/i/abc/');
    expect(p.hidden('missing')).toBe(false);
    expect(p.hidden('found')).toBe(true);
  });

  it('129 characters is too long', () => {
    const long = load('verify', `https://getmoyi.app/verify?token=${'a'.repeat(129)}`);
    expect(long.hidden('missing')).toBe(false);
    expect(long.hidden('found')).toBe(true);
    const ok = load('verify', `https://getmoyi.app/verify?token=${'a'.repeat(128)}`);
    expect(ok.hidden('missing')).toBe(true);
    expect(ok.text('value')).toBe('a'.repeat(128));
  });

  it('no token', () => {
    const p = load('verify', 'https://getmoyi.app/verify');
    expect(p.hidden('missing')).toBe(false);
    expect(p.hidden('found')).toBe(true);
  });
});
