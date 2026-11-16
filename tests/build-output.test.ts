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
  // Byte for byte moyi-backend/site after #207 (3d9808bb), until that site is retired.
  it("link.js is the backend's byte for byte", () => {
    const sum = createHash('sha256').update(readFileSync('dist/link.js')).digest('hex');
    expect(sum).toBe('1600fb9ffc92744acb737da80d8d580f2d1c67e48104fa8fd4b05ee306f6e5e5');
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
      expect(html, n).toContain('id="found" hidden');
      expect(html, n).toContain('id="missing" hidden');
      expect(html, n).toContain('id="value"');
      expect(html, n).toContain('id="open"');
      expect(html.match(/data-copy=/g), n).toHaveLength(1);
      expect(html, n).toContain('<script src="/link.js"></script>');
    }
  });

  it("well-known files are the backend's byte for byte", () => {
    const sha = (f: string) => createHash('sha256').update(readFileSync(f)).digest('hex');
    expect(sha('dist/.well-known/assetlinks.json')).toBe('da98b3635e010773ce2554c837191b4da86a34653de22536979ff7c3e559e966');
    expect(sha('dist/.well-known/apple-app-site-association')).toBe('ccc9bf308e9735ae1da39559d30ff0b17be7bdb325aeae1a3d99897168a8c1ff');
    expect(sha('dist/_redirects')).toBe('51794f671bda0d5b098d39d3a02d6bc0edb8211b42ca6eb134d94556a5b7f073');
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
