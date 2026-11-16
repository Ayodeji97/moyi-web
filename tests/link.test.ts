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
  const href = (id: string) => doc.getElementById(id)!.getAttribute('href');
  return { text, hidden, href };
}

describe('link.js on the built pages (backend #207)', () => {
  it('verify opens the app on the open host and copies the whole link', () => {
    const p = load('verify', 'https://getmoyi.app/verify?token=abc_DEF-123');
    expect(p.href('open')).toBe('https://open.getmoyi.app/verify?token=abc_DEF-123');
    expect(p.text('value')).toBe('https://getmoyi.app/verify?token=abc_DEF-123');
    expect(p.hidden('found')).toBe(false);
    expect(p.hidden('missing')).toBe(true);
  });

  it('reset points at the reset path', () => {
    const p = load('reset-password', 'https://getmoyi.app/reset-password?token=X1');
    expect(p.href('open')).toBe('https://open.getmoyi.app/reset-password?token=X1');
    expect(p.text('value')).toBe('https://getmoyi.app/reset-password?token=X1');
  });

  it('invite upper-cases the code and copies the code alone', () => {
    const p = load('invite', 'https://getmoyi.app/i/k7qx2m');
    expect(p.text('value')).toBe('K7QX2M');
    expect(p.href('open')).toBe('https://open.getmoyi.app/i/K7QX2M');
  });

  it('an invite with a trailing slash is the same page', () => {
    const p = load('invite', 'https://getmoyi.app/i/k7qx2m/');
    expect(p.text('value')).toBe('K7QX2M');
    expect(p.hidden('found')).toBe(false);
  });

  it('shell metacharacters show the incomplete panel, and no button', () => {
    const p = load('verify', 'https://getmoyi.app/verify?token=$(rm%20-rf)');
    expect(p.hidden('found')).toBe(true);
    expect(p.hidden('missing')).toBe(false);
    expect(p.href('open')).toBe('/');
  });

  it('a broken escape shows the incomplete panel', () => {
    const p = load('invite', 'https://getmoyi.app/i/%E0%A4%A');
    expect(p.hidden('missing')).toBe(false);
    expect(p.hidden('found')).toBe(true);
  });

  it('129 characters is too long', () => {
    const long = load('verify', `https://getmoyi.app/verify?token=${'a'.repeat(129)}`);
    expect(long.hidden('missing')).toBe(false);
    expect(long.hidden('found')).toBe(true);
    const ok = load('verify', `https://getmoyi.app/verify?token=${'a'.repeat(128)}`);
    expect(ok.hidden('missing')).toBe(true);
    expect(ok.text('value')).toBe(`https://getmoyi.app/verify?token=${'a'.repeat(128)}`);
  });

  it('no token', () => {
    const p = load('verify', 'https://getmoyi.app/verify');
    expect(p.hidden('missing')).toBe(false);
    expect(p.hidden('found')).toBe(true);
  });

  it('without JavaScript nothing but the noscript line shows: both panels start hidden', () => {
    for (const page of ['verify', 'reset-password', 'invite']) {
      const html = readFileSync(`dist/${page}.html`, 'utf8');
      expect(html, page).toMatch(/id="found"[^>]*hidden/);
      expect(html, page).toMatch(/id="missing"[^>]*hidden/);
      expect(html, page).not.toContain('scripts/moyi');
    }
  });
});

describe('the app-link files match the backend site after #207', () => {
  const aasa = JSON.parse(readFileSync('dist/.well-known/apple-app-site-association', 'utf8'));
  const links = JSON.parse(readFileSync('dist/.well-known/assetlinks.json', 'utf8'));

  it('Apple: the three routed paths, and password autofill', () => {
    const paths = aasa.applinks.details[0].components.map((c: { '/': string }) => c['/']);
    expect(paths).toEqual(['/verify', '/reset-password', '/i/?*']);
    expect(aasa.webcredentials.apps).toEqual(['7DUJFVWF7W.app.getmoyi.moyi']);
  });

  it('Android: app links and shared sign-in credentials', () => {
    expect(links[0].relation).toEqual([
      'delegate_permission/common.handle_all_urls',
      'delegate_permission/common.get_login_creds',
    ]);
    expect(links[0].target.package_name).toBe('app.getmoyi.moyi');
  });
});
