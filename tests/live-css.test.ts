import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

// The built page with stylesheets inlined, so jsdom's cascade can be asked what
// live mode actually shows. jsdom skips @media, so only top-level rules count.
// jsdom also scores a selector LIST by its most specific member (browsers score
// each matching selector), and the minifier merges rules into lists. So the cascade
// is checked against the source CSS (no merged lists) as well as the built CSS.
const html = readFileSync('dist/index.html', 'utf8');
const hrefs = [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/g)].map((m) => /\bhref="([^"]+)"/.exec(m[0])![1]!);
const builtCss = hrefs
  .filter((h) => h.startsWith('/_astro/'))
  .map((h) => readFileSync(resolve('dist', h.slice(1)), 'utf8'))
  .join('\n');
const eveningCss = readFileSync('src/styles/evening.css', 'utf8');
const sourceCss = ['scenes.css', 'phone.css', 'evening.css'].map((f) => readFileSync(`src/styles/${f}`, 'utf8')).join('\n');

function page(css: string, isLive = true) {
  const dom = new JSDOM(html);
  const { document } = dom.window;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  if (isLive) document.getElementById('how')!.setAttribute('data-live', '');
  const display = (el: Element) => dom.window.getComputedStyle(el).display;
  return { document, display };
}

describe.each([
  ['source', sourceCss],
  ['built', builtCss],
])('live mode layers (%s css)', (_name, css) => {
  it('hides everything in frame 4 except its step label', () => {
    const { document, display } = page(css);
    const kids = [...document.querySelector('[data-frame="4"]')!.children];
    expect(kids.length).toBeGreaterThan(1);
    for (const k of kids) {
      if (k.classList.contains('evening__step')) expect(display(k), 'step').not.toBe('none');
      else expect(display(k), k.className).toBe('none');
    }
  });

  it("hides frame 2's own sky and keeps frame 1's", () => {
    const { document, display } = page(css);
    expect(display(document.querySelector('[data-frame="2"] > .scene')!)).toBe('none');
    expect(display(document.querySelector('[data-frame="2"] > .scrim')!)).toBe('none');
    expect(display(document.querySelector('[data-frame="1"] > .scene')!)).not.toBe('none');
  });

  it('shows frame 4 in full without data-live', () => {
    const { document, display } = page(css, false);
    for (const k of document.querySelector('[data-frame="4"]')!.children) expect(display(k), k.className).not.toBe('none');
  });
});

describe('frame 4 in live mode (source order)', () => {
  it('no live rule sets display on frame 4 itself; its hide rule targets children and comes after .frame--solo', () => {
    const rules = [...eveningCss.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
      sel: m[1]!.trim(),
      body: m[2]!,
      at: m.index!,
    }));
    for (const r of rules)
      for (const s of r.sel.split(','))
        if (/\[data-live\]/.test(s) && /\[data-frame="4"\]\s*$/.test(s.trim())) expect(r.body, s).not.toMatch(/(^|;)\s*display\s*:/);
    const hide = rules.find((r) => r.sel === '.evening[data-live] [data-frame="4"] > :not(.evening__step)');
    expect(hide?.body).toMatch(/display:\s*none/);
    const solo = rules.filter((r) => /\[data-live\][^,]*\.frame--solo\s*$/.test(r.sel) && /display\s*:/.test(r.body));
    expect(solo.length).toBeGreaterThan(0);
    // Different targets, so they never compete; if anyone ever retargets, the hide rule still wins on order.
    for (const s of solo) expect(hide!.at).toBeGreaterThan(-1), expect(s.sel).not.toContain(':not(.evening__step)');
  });
});
