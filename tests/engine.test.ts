// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bind, progress } from '../src/scripts/evening/engine';
import { start } from '../src/scripts/evening/live';
import { SWAP_MS } from '../src/scripts/evening/phone';
import { evening } from '../src/scripts/evening/timeline';

// The built page, from the fresh `astro build` that `npm test` runs first.
const built = readFileSync('dist/index.html', 'utf8');
const builtBody = /<body[^>]*>([\s\S]*)<\/body>/.exec(built)![1]!;

const fake = new Proxy(
  {},
  {
    get: (_t, prop) =>
      prop === 'createLinearGradient' || prop === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {},
    set: () => true,
  },
);

type Listener = (e: { matches: boolean }) => void;
function stubReduce(matches: boolean) {
  let listener: Listener | undefined;
  const mql = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (type: string, fn: Listener) => {
      if (type === 'change') listener = fn;
    },
    removeEventListener: (type: string, fn: Listener) => {
      if (type === 'change' && listener === fn) listener = undefined;
    },
  };
  window.matchMedia = vi.fn(() => mql) as never;
  return { fire: (m: boolean) => listener?.({ matches: m }), listening: () => listener !== undefined };
}

const section = () => document.getElementById('how')!;
const stage = () => section().querySelector<HTMLElement>('[data-stage]')!;
const role = (r: string) => section().querySelector<HTMLElement>(`[data-role="${r}"]`)!;
const shownViews = () =>
  [...document.querySelectorAll('.dev')].map((d) =>
    [...d.querySelectorAll('.v')].filter((v) => !v.hasAttribute('hidden')).map((v) => v.getAttribute('data-view')).join('+'),
  );

let teardowns: Array<() => void> = [];
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
  HTMLCanvasElement.prototype.getContext = (() => fake) as never;
  document.body.innerHTML = builtBody;
  teardowns = [];
});
afterEach(() => {
  teardowns.forEach((t) => t());
  vi.useRealTimers();
});

describe('progress', () => {
  it('clamps scroll through the pin to 0..1', () => {
    expect(progress(0, 0, 4000, 1000)).toBe(0);
    expect(progress(1500, 0, 4000, 1000)).toBe(0.5);
    expect(progress(5000, 0, 4000, 1000)).toBe(1);
    expect(progress(-200, 0, 4000, 1000)).toBe(0);
  });

  it('is 0 when the section is no taller than the viewport', () => {
    expect(progress(10, 0, 800, 1000)).toBe(0);
    expect(progress(10, 0, 1000, 1000)).toBe(0);
  });
});

describe('start under reduced motion', () => {
  it('does nothing: no data-live, no canvas, the body untouched', () => {
    stubReduce(true);
    const before = document.body.innerHTML;
    teardowns.push(start(document, window));
    vi.advanceTimersByTime(500);
    expect(section().hasAttribute('data-live')).toBe(false);
    expect(document.querySelector('canvas')).toBeNull();
    expect(document.body.innerHTML).toBe(before);
  });

  it('does nothing when #how is missing', () => {
    stubReduce(false);
    section().remove();
    const before = document.body.innerHTML;
    teardowns.push(start(document, window));
    expect(document.body.innerHTML).toBe(before);
  });
});

describe('start on a short viewport', () => {
  it('keeps the still frames below 480px tall, like reduced motion', () => {
    stubReduce(false);
    const before = document.body.innerHTML;
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 479 });
    try {
      teardowns.push(start(document, window));
      vi.advanceTimersByTime(500);
      expect(section().hasAttribute('data-live')).toBe(false);
      expect(document.querySelector('canvas')).toBeNull();
      expect(document.body.innerHTML).toBe(before);
    } finally {
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });
    }
  });

  it('goes live at exactly 480px', () => {
    stubReduce(false);
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 480 });
    try {
      teardowns.push(start(document, window));
      expect(section().hasAttribute('data-live')).toBe(true);
    } finally {
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });
    }
  });
});

describe('start with motion allowed', () => {
  it('goes live: data-live, the rail, progress line and hint unhidden, canvases in', () => {
    stubReduce(false);
    teardowns.push(start(document, window));
    expect(section().hasAttribute('data-live')).toBe(true);
    for (const r of ['rail', 'progress', 'hint']) expect(role(r).hasAttribute('hidden'), r).toBe(false);
    expect(document.querySelectorAll('canvas').length).toBeGreaterThan(0);
    expect(stage().style.getPropertyValue('--hero')).toBe('1');
  });
});

describe('bind', () => {
  it('writes the split, the Tunde phone and the rail at p = 0.55', () => {
    const b = bind(section());
    b.apply(evening(0.55));
    expect(stage().style.getPropertyValue('--split')).toBe('1');
    vi.advanceTimersByTime(SWAP_MS * 3);
    const tunde = role('tunde').querySelector('[data-phone]')!;
    const shown = [...tunde.querySelectorAll('.v')].filter((v) => !v.hasAttribute('hidden'));
    expect(shown.map((v) => v.getAttribute('data-view'))).toEqual(['write']);
    const items = [...role('rail').querySelectorAll('li')];
    expect(items.map((li) => li.getAttribute('aria-current'))).toEqual([null, 'step', null]);
  });

  it('writes nothing new the second time the same state is applied', () => {
    const sky = vi.fn();
    const b = bind(section(), { setSky: sky });
    b.apply(evening(0.55));
    vi.advanceTimersByTime(SWAP_MS * 3);
    const spy = vi.spyOn(stage().style, 'setProperty');
    const cardSpies = [...section().querySelectorAll<HTMLElement>('[data-card]')].map((c) => vi.spyOn(c.style, 'setProperty'));
    const mo = new MutationObserver(() => {});
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    sky.mockClear();
    b.apply(evening(0.55));
    expect(spy).not.toHaveBeenCalled();
    for (const c of cardSpies) expect(c).not.toHaveBeenCalled();
    expect(mo.takeRecords()).toEqual([]);
    expect(sky).not.toHaveBeenCalled();
    mo.disconnect();
  });

  it('lets a swap fade: re-applying the same view mid-swap does not settle it', () => {
    const b = bind(section());
    const centre = role('centre').querySelector('[data-phone]')!;
    const view = (v: string) => centre.querySelector<HTMLElement>(`.v[data-view="${v}"]`)!;
    b.apply(evening(0.1)); // centre: write -> today
    vi.advanceTimersByTime(SWAP_MS / 2);
    b.apply(evening(0.1));
    b.apply(evening(0.105));
    expect(view('write').classList.contains('is-out')).toBe(true);
    expect(view('write').hasAttribute('hidden')).toBe(false);
    expect(view('today').hasAttribute('hidden')).toBe(true);
    vi.advanceTimersByTime(SWAP_MS);
    expect(view('write').hasAttribute('hidden')).toBe(true);
    expect(view('today').hasAttribute('hidden')).toBe(false);
  });

  it('takes the faded hero out of the way but keeps its heading', () => {
    const b = bind(section());
    const hero = role('hero');
    const stores = hero.querySelector('.stores')!;
    b.apply(evening(0));
    expect(hero.hasAttribute('data-gone')).toBe(false);
    expect(stores.hasAttribute('inert')).toBe(false);
    b.apply(evening(0.55));
    expect(hero.hasAttribute('data-gone')).toBe(true);
    expect(stores.hasAttribute('inert')).toBe(true);
    expect(hero.querySelector('h1')!.closest('[inert]')).toBeNull();
    b.restore();
    expect(hero.hasAttribute('data-gone')).toBe(false);
    expect(stores.hasAttribute('inert')).toBe(false);
  });

  it('writes the caption and the pane clocks', () => {
    const b = bind(section());
    b.apply(evening(0.9));
    const cap = role('caption');
    expect(cap.querySelector('[data-city]')!.textContent).toBe('Lagos 23:10 · London 22:10');
    expect(cap.querySelector('[data-time]')!.textContent).toBe('');
    expect(cap.querySelector('[data-text]')!.textContent).toBe('Your day is open. Both of you, at the same moment.');
    const clocks = [...section().querySelectorAll('[data-role="who"] [data-clock]')].map((c) => c.textContent);
    expect(clocks).toEqual([evening(0.9).amara.time, evening(0.9).tunde.time]);
  });
});

describe('reduced motion switched on while live', () => {
  it('tears down to the still frames exactly as built', () => {
    const before = document.body.innerHTML;
    const q = stubReduce(false);
    teardowns.push(start(document, window));

    // Scroll to p = 0.9: the centre phone has moved to its reveal.
    section().getBoundingClientRect = () => ({ top: -2700, height: 4000, bottom: 1300, left: 0, right: 0, width: 0, x: 0, y: -2700, toJSON() {} });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
    window.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(SWAP_MS * 4);
    expect(shownViews()[0]).toBe('reveal');
    expect(document.querySelectorAll('.st2 .w').length).toBe(14);
    expect(document.querySelector('[data-section="statement"]')!.hasAttribute('data-live')).toBe(true);

    q.fire(true);
    expect(document.querySelectorAll('.st2 .w').length).toBe(0);
    vi.advanceTimersByTime(SWAP_MS * 4);

    expect(section().hasAttribute('data-live')).toBe(false);
    expect(document.querySelector('canvas')).toBeNull();
    expect(role('rail').hasAttribute('hidden')).toBe(true);
    expect(role('progress').hasAttribute('hidden')).toBe(true);
    expect(role('hint').hasAttribute('hidden')).toBe(true);
    expect(shownViews()).toEqual(['write', 'wait', 'write', 'reveal']);
    expect(q.listening()).toBe(false);
    expect(document.body.innerHTML).toBe(before);

    // Scrolling after teardown changes nothing.
    window.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(100);
    expect(document.body.innerHTML).toBe(before);
  });
});
