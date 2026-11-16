// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { revealFoot } from '../src/scripts/foot';

type Cb = (entries: { isIntersecting: boolean }[]) => void;
let cb: Cb | null = null;
let disconnected = 0;
class FakeIO {
  constructor(c: Cb) { cb = c; }
  observe() {}
  disconnect() { disconnected++; }
}

const mount = (top: number) => {
  document.body.innerHTML = '<footer class="foot"><div class="foot__brand"></div></footer>';
  const foot = document.querySelector('footer')!;
  foot.getBoundingClientRect = () => ({ top, bottom: top + 400 }) as DOMRect;
  return foot;
};
const reduce = (on: boolean) => { window.matchMedia = vi.fn(() => ({ matches: on })) as never; };

afterEach(() => { cb = null; disconnected = 0; vi.unstubAllGlobals(); });

describe('revealFoot', () => {
  it('hides the footer only once armed, and shows it once in view, then stops watching', () => {
    vi.stubGlobal('IntersectionObserver', FakeIO);
    reduce(false);
    const foot = mount(5000);
    revealFoot(document, window);
    expect(foot.hasAttribute('data-reveal')).toBe(true);
    expect(foot.hasAttribute('data-in')).toBe(false);
    cb!([{ isIntersecting: false }]);
    expect(foot.hasAttribute('data-in')).toBe(false);
    cb!([{ isIntersecting: true }]);
    expect(foot.hasAttribute('data-in')).toBe(true);
    expect(disconnected).toBe(1);
  });

  it('does nothing under reduced motion, without IntersectionObserver, or when already on screen', () => {
    vi.stubGlobal('IntersectionObserver', FakeIO);
    reduce(true);
    expect(mount(5000).hasAttribute('data-reveal')).toBe(false);
    revealFoot(document, window);
    expect(document.querySelector('footer')!.hasAttribute('data-reveal')).toBe(false);

    reduce(false);
    const onScreen = mount(100);
    revealFoot(document, window);
    expect(onScreen.hasAttribute('data-reveal')).toBe(false);

    vi.stubGlobal('IntersectionObserver', undefined);
    const noIO = mount(5000);
    revealFoot(document, window);
    expect(noIO.hasAttribute('data-reveal')).toBe(false);
  });

  it('stop removes both attributes', () => {
    vi.stubGlobal('IntersectionObserver', FakeIO);
    reduce(false);
    const foot = mount(5000);
    const stop = revealFoot(document, window);
    cb!([{ isIntersecting: true }]);
    stop();
    expect(foot.hasAttribute('data-reveal')).toBe(false);
    expect(foot.hasAttribute('data-in')).toBe(false);
  });
});

describe('the built footer', () => {
  const doc = new JSDOM(readFileSync('dist/index.html', 'utf8')).window.document;
  it('has no wordmark, and the brand and its line share one row', () => {
    expect(doc.querySelector('.foot__mark')).toBeNull();
    const brand = doc.querySelector('footer .foot__brand')!;
    expect(brand.querySelector('.foot__logo')).not.toBeNull();
    expect(brand.querySelector('.foot__tag')!.textContent).toBe('Daily gratitude, for two.');
  });
});
