import { existsSync, readFileSync, statSync } from 'node:fs';
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
