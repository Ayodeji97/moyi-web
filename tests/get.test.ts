// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { floatGet, NARROW, THRESHOLD } from '../src/scripts/get';

const html = readFileSync('dist/index.html', 'utf8');
const homeCss = readFileSync('src/styles/home.css', 'utf8');
const eveningCss = readFileSync('src/styles/evening.css', 'utf8');
const rule = (css: string, selector: string) => {
  const at = css.indexOf(`${selector} {`);
  expect(at, selector).toBeGreaterThanOrEqual(0);
  return css.slice(at, css.indexOf('}', at));
};

describe('the floating "Get the app" pill', () => {
  it('is one link, in the top bar, pointing at the closing store links', () => {
    const doc = new JSDOM(html).window.document;
    const links = [...doc.querySelectorAll('a[href="#get"]')];
    expect(links).toHaveLength(1);
    expect(links[0]!.closest('.topbar')).not.toBeNull();
    expect(links[0]!.textContent?.trim()).toBe('Get the app');
    expect(doc.getElementById('get')?.closest('[data-section="close"]')).not.toBeNull();
  });

  it('floats on a solid token surface, never a blur of its own, and does not slide under reduced motion', () => {
    const pill = rule(homeCss, '.topbar .get');
    expect(pill).toMatch(/position:\s*fixed/);
    expect(pill).toMatch(/background:\s*var\(--surface-raised\)/);
    expect(pill).toMatch(/min-height:\s*48px/);
    expect(pill).not.toMatch(/transform/);
    expect(pill).not.toMatch(/backdrop-filter/);
    // The only blur on the page is the docked glass bar (owner, 2026-11-16), and it has a near-solid
    // fallback where backdrop-filter is unsupported.
    const css = homeCss.replace(/\/\*[\s\S]*?\*\//g, '');
    const blurs = [...css.matchAll(/([^{}]+)\{[^{}]*backdrop-filter\s*:[^{}]*\}/g)].map((m) => m[1].trim());
    expect(blurs).toEqual(['.topbar[data-docked]']);
    expect(homeCss).toMatch(/@supports not \(\(backdrop-filter: blur\(1px\)\) or \(-webkit-backdrop-filter: blur\(1px\)\)\) \{ \.topbar\[data-docked\] \{ background: rgb\(23 19 19 \/ \.96\); \} \}/);
    expect(rule(homeCss, '.topbar .get[data-away]')).toMatch(/visibility:\s*hidden/);
    expect(homeCss).toMatch(/@media \(prefers-reduced-motion: reduce\) \{ \.topbar \.get \{ transition: none; \} \}/);
  });

  it('tucks up on phones without leaving the tab order, and focus overrides the tuck', () => {
    const tucked = rule(homeCss, '.topbar .get[data-tucked]:not(:focus)');
    expect(tucked).toMatch(/opacity:\s*0/);
    expect(tucked).toMatch(/translate:/);
    expect(tucked).toMatch(/pointer-events:\s*none/);
    expect(tucked).not.toMatch(/visibility|display/);
    expect(NARROW).toBe('(max-width: 699px)');
    expect(homeCss).toContain('@media (max-width: 699px)');
  });

  it('respects the notch on phones, and the progress line stops short of it', () => {
    expect(homeCss).toMatch(/--get-top:\s*max\(20px, env\(safe-area-inset-top\)\)/);
    expect(homeCss).toMatch(/--get-right:\s*max\(20px, env\(safe-area-inset-right\)\)/);
    const line = rule(eveningCss, '.evening[data-live] .evening__progress');
    expect(line).toMatch(/right:\s*calc\(var\(--get-w\) \+ var\(--get-right\) \+ 16px\)/);
    expect(line).toMatch(/top:\s*calc\(var\(--get-top\) \+ 23px\)/);
  });
});

describe('floatGet', () => {
  afterEach(() => vi.unstubAllGlobals());

  function fixture() {
    document.body.innerHTML =
      '<header class="topbar"><a class="get" href="#get">Get the app</a></header><section data-section="close"><div id="get"></div></section>';
    return document.querySelector<HTMLElement>('.get')!;
  }

  it('hides the pill while the closing section is on screen, and brings it back', () => {
    let cb: IntersectionObserverCallback = () => {};
    const observed: Element[] = [];
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(c: IntersectionObserverCallback) {
          cb = c;
        }
        observe(el: Element) {
          observed.push(el);
        }
        disconnect() {}
      },
    );
    const pill = fixture();
    const stop = floatGet(document);
    expect(observed.map((e) => e.getAttribute('data-section'))).toEqual(['close']);
    const io = {} as IntersectionObserver;
    cb([{ isIntersecting: true } as IntersectionObserverEntry], io);
    expect(pill.hasAttribute('data-away')).toBe(true);
    cb([{ isIntersecting: false } as IntersectionObserverEntry], io);
    expect(pill.hasAttribute('data-away')).toBe(false);
    cb([{ isIntersecting: true } as IntersectionObserverEntry], io);
    stop();
    expect(pill.hasAttribute('data-away')).toBe(false);
  });

  it('leaves the pill visible without IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const pill = fixture();
    floatGet(document);
    expect(pill.hasAttribute('data-away')).toBe(false);
  });
});

describe('floatGet on phones: tucks while scrolling down, back on scrolling up', () => {
  let narrow = true;
  let y = 0;
  const vh = 844;
  let eveningBottom = 0;

  function setup(opts: { live?: boolean } = {}) {
    narrow = true;
    y = 0;
    eveningBottom = 0;
    document.body.innerHTML =
      `<header class="topbar"><a class="get" href="#get">Get the app</a></header><section id="how"${opts.live ? ' data-live' : ''}></section><p>text</p><section data-section="close"><div id="get"></div></section>`;
    document.getElementById('how')!.getBoundingClientRect = () => ({ bottom: eveningBottom }) as DOMRect;
    const listeners: (() => void)[] = [];
    const mq = { get matches() { return narrow; }, addEventListener: (_: string, f: () => void) => listeners.push(f), removeEventListener: () => {} };
    const win = {
      get scrollY() { return y; },
      innerHeight: vh,
      matchMedia: (q: string) => { expect(q).toBe(NARROW); return mq; },
      requestAnimationFrame: (f: FrameRequestCallback) => { f(0); return 1; },
      cancelAnimationFrame: () => {},
      addEventListener: (t: string, f: () => void) => { if (t === 'scroll') scrolls.push(f); },
      removeEventListener: (_: string, f: () => void) => { const i = scrolls.indexOf(f); if (i >= 0) scrolls.splice(i, 1); },
    } as unknown as Window;
    const scrolls: (() => void)[] = [];
    const pill = document.querySelector<HTMLElement>('.get')!;
    const stop = floatGet(document, win);
    const to = (next: number) => { y = next; scrolls.forEach((f) => f()); };
    return { pill, stop, to, scrolls, flip: () => listeners.forEach((f) => f()) };
  }
  afterEach(() => vi.unstubAllGlobals());

  it('hides on the way down, past the top, and shows on the way up', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { pill, to } = setup();
    to(300);
    expect(pill.hasAttribute('data-tucked'), 'near the top').toBe(false);
    to(1200);
    expect(pill.hasAttribute('data-tucked'), 'scrolling down').toBe(true);
    to(1200 - THRESHOLD + 1);
    expect(pill.hasAttribute('data-tucked'), 'a jitter under the threshold').toBe(true);
    to(1100);
    expect(pill.hasAttribute('data-tucked'), 'scrolling up').toBe(false);
    to(1100 + THRESHOLD - 1);
    expect(pill.hasAttribute('data-tucked'), 'a jitter down').toBe(false);
    to(1600);
    expect(pill.hasAttribute('data-tucked')).toBe(true);
    to(200);
    expect(pill.hasAttribute('data-tucked'), 'back at the top').toBe(false);
  });

  it('never tucks while the top bar is docked as the glass bar', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { pill, to } = setup();
    document.querySelector('.topbar')!.setAttribute('data-docked', '');
    to(1200);
    to(2400);
    expect(pill.hasAttribute('data-tucked')).toBe(false);
    document.querySelector('.topbar')!.removeAttribute('data-docked');
    to(3600);
    expect(pill.hasAttribute('data-tucked')).toBe(true);
  });

  it('stays while the evening scene is pinned', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { pill, to } = setup({ live: true });
    eveningBottom = vh + 500;
    to(1500);
    to(2500);
    expect(pill.hasAttribute('data-tucked')).toBe(false);
    eveningBottom = vh - 10;
    to(3000);
    expect(pill.hasAttribute('data-tucked')).toBe(true);
  });

  it('never tucks on wider screens, and untucks when the screen widens', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { pill, to, flip } = setup();
    to(1200);
    to(2000);
    expect(pill.hasAttribute('data-tucked')).toBe(true);
    narrow = false;
    flip();
    expect(pill.hasAttribute('data-tucked')).toBe(false);
    to(3000);
    expect(pill.hasAttribute('data-tucked')).toBe(false);
  });

  it('shows when it takes keyboard focus, and stays while focused', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { pill, to } = setup();
    to(1200);
    to(2000);
    expect(pill.hasAttribute('data-tucked')).toBe(true);
    pill.focus();
    expect(pill.hasAttribute('data-tucked')).toBe(false);
    to(3000);
    expect(pill.hasAttribute('data-tucked')).toBe(false);
    pill.blur();
  });

  it('stops listening and leaves the pill shown', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { pill, to, stop, scrolls } = setup();
    to(1200);
    to(2000);
    stop();
    expect(pill.hasAttribute('data-tucked')).toBe(false);
    expect(scrolls).toHaveLength(0);
  });
});
