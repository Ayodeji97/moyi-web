import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
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
        expect(m[1], f).not.toMatch(/^(https?:|\/\/)/);
      }
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
});
