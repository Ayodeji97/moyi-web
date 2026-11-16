import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('built fonts', () => {
  it('home loads the self-hosted fonts', () => {
    const html = readFileSync('dist/index.html', 'utf8');
    expect(html).toContain('href="/fonts/fonts.css"');
  });

  it('fonts.css declares both weights from our own origin', () => {
    const css = readFileSync('dist/fonts/fonts.css', 'utf8');
    const blocks = css.match(/@font-face\s*{[^}]*}/g) ?? [];
    expect(blocks).toHaveLength(2);
    for (const w of ['400', '500']) {
      const block = blocks.find((b) => b.includes(`font-weight: ${w}`));
      expect(block, w).toBeDefined();
      expect(block).toContain(`src: url("/fonts/newsreader-${w}.woff2")`);
    }
    expect(css).not.toContain('http');
  });

  it('font files are small', () => {
    for (const w of ['400', '500']) {
      const f = `dist/fonts/newsreader-${w}.woff2`;
      expect(existsSync(f), f).toBe(true);
      expect(statSync(f).size, f).toBeLessThan(80 * 1024);
    }
  });
});

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return htmlFiles(p);
    return p.endsWith('.html') ? [p] : [];
  });
}

describe('built pages', () => {
  it("link.js is the backend's byte for byte", () => {
    const sum = createHash('sha256').update(readFileSync('dist/link.js')).digest('hex');
    expect(sum).toBe('edf3c34d646ba523b3a3169f6b8cbae5d73603aec69c0e50b219be4fe67dfc9d');
  });

  it('no inline code anywhere', () => {
    for (const f of htmlFiles('dist')) {
      const html = readFileSync(f, 'utf8');
      expect(html, f).not.toContain('<style');
      expect(html, f).not.toContain(' style=');
      expect(html, f).not.toMatch(/<script(?![^>]*\ssrc=)/);
      expect(html, f).not.toMatch(/\son[a-z]+=/);
    }
  });

  it('no third-party references', () => {
    for (const f of htmlFiles('dist')) {
      const html = readFileSync(f, 'utf8');
      for (const m of html.matchAll(/\s(?:src|href)=["']?([^"'\s>]+)/g)) {
        const external = /^(https?:|\/\/)/.test(m[1]);
        const storeHref =
          m[0].trimStart().startsWith('href') &&
          (m[1].startsWith('https://apps.apple.com/') || m[1].startsWith('https://play.google.com/'));
        // The canonical link names our own address absolutely; an href to our own origin loads nothing.
        const ownHref = m[0].trimStart().startsWith('href') && m[1].startsWith('https://getmoyi.app/');
        expect(external && !storeHref && !ownHref, `${f}: ${m[1]}`).toBe(false);
      }
    }
  });

  it('icons are built as real PNGs', () => {
    for (const f of ['favicon-32.png', 'favicon-16.png', 'apple-touch-icon.png']) {
      const bytes = readFileSync(`dist/${f}`);
      expect([...bytes.subarray(0, 4)], f).toEqual([0x89, 0x50, 0x4e, 0x47]);
    }
  });

  it('functional pages carry no fonts and are noindex', () => {
    for (const n of ['verify', 'reset-password', 'invite', '404']) {
      const html = readFileSync(`dist/${n}.html`, 'utf8');
      expect(html, n).toContain('content="noindex"');
      expect(html, n).not.toContain('/fonts/');
    }
  });

  it('functional pages keep the link.js contract', () => {
    const pages: Record<string, string> = { verify: 'verify', 'reset-password': 'reset', invite: 'invite' };
    for (const [n, kind] of Object.entries(pages)) {
      const html = readFileSync(`dist/${n}.html`, 'utf8');
      expect(html, n).toContain(`data-link="${kind}"`);
      expect(html, n).toContain('id="found"');
      expect(html, n).toContain('id="missing" hidden');
      expect(html, n).toContain('id="value"');
      expect(html, n).toContain('id="command"');
      expect(html.match(/data-copy=/g), n).toHaveLength(2);
      expect(html, n).toContain('<script src="/link.js"></script>');
    }
  });

  it("well-known files are the backend's byte for byte", () => {
    const sha = (f: string) => createHash('sha256').update(readFileSync(f)).digest('hex');
    expect(sha('dist/.well-known/assetlinks.json')).toBe('e84e7845c7d70232d1803ff854243a621b66c9fa36ab5fae285383b88cd437aa');
    expect(sha('dist/.well-known/apple-app-site-association')).toBe('66ab7a51dc292075aab0e5067e6767fcc643477df65d450a5f8869aeb6191e68');
    expect(sha('dist/_redirects')).toBe('cc3fb993ff7a6e195e1f6a40139801ceab4f979ee634ad2f81fe384cda8b6af7');
  });
});

describe('home layout', () => {
  it('no stylesheet linked from the home page has a main rule with max-width', () => {
    const html = readFileSync('dist/index.html', 'utf8');
    const hrefs = [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/g)].map((m) => /\bhref="([^"]+)"/.exec(m[0])?.[1]);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const h of hrefs) {
      const css = readFileSync(resolve('dist', (h as string).replace(/^\//, '')), 'utf8');
      for (const m of css.matchAll(/(^|[},\s])main\s*\{([^}]*)\}/g)) {
        expect(m[2], `${h}: main rule`).not.toMatch(/max-width/);
      }
    }
  });

  it('the functional pages still get the narrow main', () => {
    for (const n of ['verify', 'reset-password', 'invite', '404']) {
      const html = readFileSync(`dist/${n}.html`, 'utf8');
      const css = [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/g)]
        .map((m) => /\bhref="([^"]+)"/.exec(m[0])?.[1] as string)
        .map((h) => readFileSync(resolve('dist', h.replace(/^\//, '')), 'utf8'))
        .join('\n');
      expect(css, n).toMatch(/main\s*\{[^}]*max-width:\s*34rem/);
    }
  });
});

describe('home page weight', () => {
  it('html, stylesheets, scripts and fonts total under 150 KB', () => {
    const html = readFileSync('dist/index.html', 'utf8');
    const sizes = new Map<string, number>([['dist/index.html', statSync('dist/index.html').size]]);
    const refs = [
      ...[...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/g)].map((m) => /\bhref="([^"]+)"/.exec(m[0])?.[1]),
      ...[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map((m) => m[1]),
    ];
    expect(refs.length, 'asset references found').toBeGreaterThan(0);
    for (const ref of refs) {
      expect(ref, 'asset reference').toBeDefined();
      const file = resolve('dist', (ref as string).replace(/^\//, ''));
      sizes.set(file, statSync(file).size);
    }
    const fontsCss = readFileSync('dist/fonts/fonts.css', 'utf8');
    const fontUrls = [...fontsCss.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((m) => m[1]);
    expect(fontUrls.length, 'font urls in fonts.css').toBeGreaterThan(0);
    for (const u of fontUrls) {
      const f = resolve('dist', u.replace(/^\//, ''));
      sizes.set(f, statSync(f).size);
    }
    const total = [...sizes.values()].reduce((a, b) => a + b, 0);
    const breakdown = [...sizes].map(([f, n]) => `${f}: ${n}`).join('\n');
    expect(total, `total ${total} bytes\n${breakdown}`).toBeLessThan(150 * 1024);
  });
});
