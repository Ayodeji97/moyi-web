// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { floatGet } from '../src/scripts/get';

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

  it('floats on a solid token surface, never a blur, and does not slide under reduced motion', () => {
    const pill = rule(homeCss, '.topbar .get');
    expect(pill).toMatch(/position:\s*fixed/);
    expect(pill).toMatch(/background:\s*var\(--surface-raised\)/);
    expect(pill).toMatch(/min-height:\s*48px/);
    expect(pill).not.toMatch(/transform/);
    expect(homeCss).not.toMatch(/backdrop-filter\s*:/);
    expect(rule(homeCss, '.topbar .get[data-away]')).toMatch(/visibility:\s*hidden/);
    expect(homeCss).toMatch(/@media \(prefers-reduced-motion: reduce\) \{ \.topbar \.get \{ transition: none; \} \}/);
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
